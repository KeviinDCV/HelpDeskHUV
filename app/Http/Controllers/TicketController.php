<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Notification;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $sortField = $request->input('sort', 'id');
        $sortDirection = $request->input('direction', 'desc');
        $search = $request->input('search', '');

        // Filtros selectivos
        $statusFilter = $request->input('status', '');
        $priorityFilter = $request->input('priority', '');
        $categoryFilter = $request->input('category', '');
        $assignedFilter = $request->input('assigned', '');
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');
        $specialFilter = $request->input('filter', ''); // unassigned, my_cases, resolved_today

        // Log para debug
        \Log::info('Ticket filters received', [
            'status' => $statusFilter,
            'priority' => $priorityFilter,
            'category' => $categoryFilter,
            'assigned' => $assignedFilter,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'search' => $search,
        ]);

        // Mapeo de campos para ordenamiento
        $sortableFields = [
            'id' => 't.id',
            'name' => 't.name',
            'entity_name' => 'e.name',
            'date' => 't.date',
            'date_mod' => 't.date_mod',
            'status' => 't.status',
            'priority' => 't.priority',
        ];

        $orderByField = $sortableFields[$sortField] ?? 't.id';
        
        $query = DB::table('glpi_tickets as t')
            ->select(
                't.id',
                't.name',
                't.date',
                't.date_mod',
                't.priority',
                't.status',
                't.users_id_recipient',
                't.itilcategories_id',
                'e.name as entity_name',
                'cat.completename as category_name',
                DB::raw("(SELECT CONCAT(u.firstname, ' ', u.realname) 
                         FROM glpi_tickets_users tu 
                         LEFT JOIN glpi_users u ON tu.users_id = u.id 
                         WHERE tu.tickets_id = t.id AND tu.type = 1 
                         LIMIT 1) as requester_name"),
                DB::raw("(SELECT CONCAT(u.firstname, ' ', u.realname) 
                         FROM glpi_tickets_users tu 
                         LEFT JOIN glpi_users u ON tu.users_id = u.id 
                         WHERE tu.tickets_id = t.id AND tu.type = 2 
                         LIMIT 1) as assigned_name"),
                DB::raw("CASE 
                    WHEN t.status = 1 THEN 'Nuevo'
                    WHEN t.status = 2 THEN 'En curso (asignado)'
                    WHEN t.status = 3 THEN 'En curso (planificado)'
                    WHEN t.status = 4 THEN 'En espera'
                    WHEN t.status = 5 THEN 'Resuelto'
                    WHEN t.status = 6 THEN 'Cerrado'
                    ELSE 'Desconocido'
                END as status_name"),
                DB::raw("CASE 
                    WHEN t.priority = 1 THEN 'Muy baja'
                    WHEN t.priority = 2 THEN 'Baja'
                    WHEN t.priority = 3 THEN 'Media'
                    WHEN t.priority = 4 THEN 'Alta'
                    WHEN t.priority = 5 THEN 'Muy alta'
                    WHEN t.priority = 6 THEN 'Urgente'
                    ELSE 'Media'
                END as priority_name")
            )
            ->leftJoin('glpi_entities as e', 't.entities_id', '=', 'e.id')
            ->leftJoin('glpi_itilcategories as cat', 't.itilcategories_id', '=', 'cat.id')
            ->where('t.is_deleted', 0);

        // Aplicar búsqueda si existe
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('t.name', 'LIKE', "%{$search}%")
                  ->orWhere('t.id', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%");
            });
        }

        // Aplicar filtros selectivos
        if ($statusFilter !== '') {
            $query->where('t.status', $statusFilter);
        }
        
        if ($priorityFilter !== '') {
            $query->where('t.priority', $priorityFilter);
        }
        
        if ($categoryFilter !== '') {
            $query->where('t.itilcategories_id', $categoryFilter);
        }
        
        if ($assignedFilter !== '') {
            // Log para debug
            \Log::info('Filtering by assigned', ['assigned_id' => $assignedFilter]);

            // Verificar si existe algún técnico con ese ID
            $technicianExists = DB::table('glpi_users')
                ->where('id', $assignedFilter)
                ->where('is_deleted', 0)
                ->where('is_active', 1)
                ->exists();

            \Log::info('Technician exists check', [
                'technician_id' => $assignedFilter,
                'exists' => $technicianExists
            ]);

            // Verificar cuántos tickets tiene asignados este técnico
            $assignedCount = DB::table('glpi_tickets_users')
                ->where('users_id', $assignedFilter)
                ->where('type', 2)
                ->count();

            \Log::info('Assigned tickets count', [
                'technician_id' => $assignedFilter,
                'count' => $assignedCount
            ]);

            $query->whereExists(function ($q) use ($assignedFilter) {
                $q->select(DB::raw(1))
                  ->from('glpi_tickets_users')
                  ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                  ->where('glpi_tickets_users.type', 2) // type 2 = assigned
                  ->where('glpi_tickets_users.users_id', $assignedFilter);
            });
        }
        
        if ($dateFrom) {
            $query->whereDate('t.date', '>=', $dateFrom);
        }
        
        if ($dateTo) {
            $query->whereDate('t.date', '<=', $dateTo);
        }

        // Filtros especiales del dashboard
        if ($specialFilter === 'unassigned') {
            // Tickets sin asignar (status = 1 y sin técnico)
            $query->where('t.status', 1)
                  ->whereNotExists(function ($q) {
                      $q->select(DB::raw(1))
                        ->from('glpi_tickets_users')
                        ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                        ->where('glpi_tickets_users.type', 2);
                  });
        } elseif ($specialFilter === 'my_cases') {
            // Mis casos (asignados a mí, no cerrados)
            $user = auth()->user();
            $glpiUser = DB::table('glpi_users')
                ->where('name', $user->username ?? $user->name)
                ->first();
            $glpiUserId = $glpiUser ? $glpiUser->id : 0;
            
            $query->whereExists(function ($q) use ($glpiUserId) {
                $q->select(DB::raw(1))
                  ->from('glpi_tickets_users')
                  ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                  ->where('glpi_tickets_users.type', 2)
                  ->where('glpi_tickets_users.users_id', $glpiUserId);
            })->where('t.status', '!=', 6);
        } elseif ($specialFilter === 'resolved_today') {
            // Resueltos hoy
            $query->where('t.status', 5)
                  ->whereDate('t.date_mod', today());
        }
        
        $tickets = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends(array_filter([
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search,
                'status' => $statusFilter,
                'priority' => $priorityFilter,
                'category' => $categoryFilter,
                'assigned' => $assignedFilter,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'filter' => $specialFilter,
            ], fn($value) => $value !== '' && $value !== null));

        // Log resultado de la consulta
        \Log::info('Tickets query result', [
            'total' => $tickets->total(),
            'per_page' => $tickets->perPage(),
            'current_page' => $tickets->currentPage(),
            'count' => $tickets->count()
        ]);
        
        // Obtener categorías para el filtro
        $categories = DB::table('glpi_itilcategories')
            ->select('id', 'name', 'completename')
            ->where('is_incident', 1)
            ->orderBy('completename')
            ->get();
        
        // Obtener técnicos (usuarios asignados a tickets) para el filtro
        $technicians = DB::table('glpi_users')
            ->select('id', 'name', 'firstname', 'realname', DB::raw("CONCAT(firstname, ' ', realname) as fullname"))
            ->where('is_deleted', 0)
            ->where('is_active', 1)
            ->whereExists(function ($q) {
                $q->select(DB::raw(1))
                  ->from('glpi_tickets_users')
                  ->whereColumn('glpi_tickets_users.users_id', 'glpi_users.id')
                  ->where('glpi_tickets_users.type', 2);
            })
            ->orderBy('firstname')
            ->get();

        return Inertia::render('soporte/casos', [
            'tickets' => $tickets,
            'categories' => $categories,
            'technicians' => $technicians,
            'filters' => [
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search,
                'status' => $statusFilter,
                'priority' => $priorityFilter,
                'category' => $categoryFilter,
                'assigned' => $assignedFilter,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'filter' => $specialFilter,
            ],
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    }

    public function create()
    {
        // Obtener usuarios activos de Laravel (para solicitante, observador, asignado)
        $users = User::where('is_active', 1)
            ->select('id', 'username', 'name', 'email')
            ->orderBy('name')
            ->get();

        // Obtener localizaciones de GLPI (sin duplicados, mostrando solo el último segmento)
        $locations = DB::table('glpi_locations')
            ->select(
                DB::raw('MIN(id) as id'), 
                'completename',
                DB::raw("SUBSTRING_INDEX(completename, ' > ', -1) as short_name")
            )
            ->whereNotNull('completename')
            ->where('completename', '!=', '')
            ->groupBy('completename')
            ->orderBy(DB::raw("SUBSTRING_INDEX(completename, ' > ', -1)"))
            ->get();

        // Obtener categorías de GLPI (sin duplicados)
        $categories = DB::table('glpi_itilcategories')
            ->select(DB::raw('MIN(id) as id'), DB::raw('MIN(name) as name'), 'completename')
            ->where('is_incident', 1)
            ->whereNotNull('completename')
            ->where('completename', '!=', '')
            ->groupBy('completename')
            ->orderBy('completename')
            ->get();

        // Tipos de elementos asociados disponibles
        $itemTypes = [
            ['value' => 'Computer', 'label' => 'Computador'],
            ['value' => 'Monitor', 'label' => 'Monitor'],
            ['value' => 'NetworkEquipment', 'label' => 'Dispositivo para red'],
            ['value' => 'Peripheral', 'label' => 'Dispositivo'],
            ['value' => 'Printer', 'label' => 'Impresora'],
            ['value' => 'Phone', 'label' => 'Teléfono'],
            ['value' => 'Enclosure', 'label' => 'Gabinete'],
        ];

        return Inertia::render('soporte/crear-caso', [
            'users' => $users,
            'locations' => $locations,
            'categories' => $categories,
            'itemTypes' => $itemTypes,
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    }

    public function getItemsByType(Request $request, $type)
    {
        $items = [];
        $tables = [
            'Computer' => 'glpi_computers',
            'Monitor' => 'glpi_monitors',
            'NetworkEquipment' => 'glpi_networkequipments',
            'Peripheral' => 'glpi_peripherals',
            'Printer' => 'glpi_printers',
            'Phone' => 'glpi_phones',
            'Enclosure' => 'glpi_enclosures',
        ];

        if (isset($tables[$type])) {
            $items = DB::table($tables[$type])
                ->select('id', 'name')
                ->where('is_deleted', 0)
                ->where('is_template', 0)
                ->whereNotNull('name')
                ->where('name', '!=', '')
                ->distinct()
                ->orderBy('name')
                ->get()
                ->unique('name')
                ->values();
        }

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'required|string',
            'date' => 'required|date',
            'time_to_resolve' => 'nullable|date',
            'internal_time_to_resolve' => 'nullable|date',
            'status' => 'required|integer|between:1,6',
            'priority' => 'required|integer|between:1,6',
            'locations_id' => 'nullable|integer',
            'itilcategories_id' => 'nullable|integer',
            'requester_id' => 'nullable|integer',
            'observer_ids' => 'nullable|array',
            'observer_ids.*' => 'integer',
            'assigned_ids' => 'required|array|min:1',
            'assigned_ids.*' => 'integer',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:102400', // 100MB
            'items' => 'nullable|array',
            'items.*.type' => 'string',
            'items.*.id' => 'integer',
        ]);

        DB::beginTransaction();
        try {
            // Crear el ticket en glpi_tickets
            $ticketId = DB::table('glpi_tickets')->insertGetId([
                'entities_id' => 0,
                'name' => $validated['name'],
                'content' => $validated['content'],
                'date' => $validated['date'],
                'date_creation' => now(),
                'date_mod' => now(),
                'time_to_resolve' => $validated['time_to_resolve'] ?? null,
                'internal_time_to_resolve' => $validated['internal_time_to_resolve'] ?? null,
                'status' => $validated['status'],
                'priority' => $validated['priority'],
                'locations_id' => $validated['locations_id'] ?? 0,
                'itilcategories_id' => $validated['itilcategories_id'] ?? 0,
                'users_id_recipient' => $validated['requester_id'] ?? 0,
                'is_deleted' => 0,
            ]);

            // Agregar solicitante (type = 1) si existe
            if (!empty($validated['requester_id'])) {
                DB::table('glpi_tickets_users')->insert([
                    'tickets_id' => $ticketId,
                    'users_id' => $validated['requester_id'],
                    'type' => 1, // Requester
                    'use_notification' => 1,
                ]);
            }

            // Agregar observadores (type = 3)
            if (!empty($validated['observer_ids'])) {
                foreach ($validated['observer_ids'] as $observerId) {
                    DB::table('glpi_tickets_users')->insert([
                        'tickets_id' => $ticketId,
                        'users_id' => $observerId,
                        'type' => 3, // Observer
                        'use_notification' => 1,
                    ]);
                }
            }

            // Agregar asignados (type = 2)
            if (!empty($validated['assigned_ids'])) {
                $creatorId = $validated['requester_id'];
                $creatorUser = auth()->user();
                $creatorName = $creatorUser ? $creatorUser->name : 'Sistema';
                
                foreach ($validated['assigned_ids'] as $assignedId) {
                    DB::table('glpi_tickets_users')->insert([
                        'tickets_id' => $ticketId,
                        'users_id' => $assignedId,
                        'type' => 2, // Assigned
                        'use_notification' => 1,
                    ]);
                    
                    // Notificar al usuario asignado (si es diferente del creador)
                    if ($assignedId != $creatorId && $assignedId != auth()->id()) {
                        // Buscar el user_id en nuestra tabla users que corresponda al glpi_users id
                        $localUser = User::where('id', $assignedId)->first();
                        if ($localUser) {
                            Notification::createTicketAssigned(
                                $localUser->id,
                                $ticketId,
                                $validated['name'],
                                $creatorName
                            );
                        }
                    }
                }
                
                // Si es prioridad alta (4), muy alta (5) o urgente (6), notificar a todos los técnicos
                if ($validated['priority'] >= 4) {
                    $technicians = User::where('role', 'Técnico')
                        ->orWhere('role', 'Administrador')
                        ->where('id', '!=', auth()->id())
                        ->get();
                    
                    foreach ($technicians as $tech) {
                        // Evitar duplicar notificación si ya está asignado
                        if (!in_array($tech->id, $validated['assigned_ids'])) {
                            Notification::createTicketUrgent(
                                $tech->id,
                                $ticketId,
                                $validated['name']
                            );
                        }
                    }
                }
            }

            // Manejar archivos adjuntos
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('ticket-attachments/' . $ticketId, 'public');
                    
                    // Aquí podrías guardar información del archivo en una tabla si lo necesitas
                    // Por ahora solo los guardamos en storage
                }
            }

            // Agregar elementos asociados
            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    DB::table('glpi_items_tickets')->insert([
                        'tickets_id' => $ticketId,
                        'itemtype' => $item['type'],
                        'items_id' => $item['id'],
                    ]);
                }
            }

            DB::commit();

            return redirect()->route('soporte.casos')->with('success', 'Caso creado exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al crear el caso: ' . $e->getMessage())->withInput();
        }
    }

    public function show($id)
    {
        $ticket = DB::table('glpi_tickets as t')
            ->select(
                't.*',
                'e.name as entity_name',
                'l.completename as location_name',
                'cat.completename as category_name',
                DB::raw("CASE 
                    WHEN t.status = 1 THEN 'Nuevo'
                    WHEN t.status = 2 THEN 'En curso (asignado)'
                    WHEN t.status = 3 THEN 'En curso (planificado)'
                    WHEN t.status = 4 THEN 'En espera'
                    WHEN t.status = 5 THEN 'Resuelto'
                    WHEN t.status = 6 THEN 'Cerrado'
                    ELSE 'Desconocido'
                END as status_name"),
                DB::raw("CASE 
                    WHEN t.priority = 1 THEN 'Muy baja'
                    WHEN t.priority = 2 THEN 'Baja'
                    WHEN t.priority = 3 THEN 'Media'
                    WHEN t.priority = 4 THEN 'Alta'
                    WHEN t.priority = 5 THEN 'Muy alta'
                    WHEN t.priority = 6 THEN 'Urgente'
                    ELSE 'Media'
                END as priority_name"),
                DB::raw("CASE 
                    WHEN t.urgency = 1 THEN 'Muy baja'
                    WHEN t.urgency = 2 THEN 'Baja'
                    WHEN t.urgency = 3 THEN 'Media'
                    WHEN t.urgency = 4 THEN 'Alta'
                    WHEN t.urgency = 5 THEN 'Muy alta'
                    ELSE 'Media'
                END as urgency_name"),
                DB::raw("CASE 
                    WHEN t.impact = 1 THEN 'Muy bajo'
                    WHEN t.impact = 2 THEN 'Bajo'
                    WHEN t.impact = 3 THEN 'Medio'
                    WHEN t.impact = 4 THEN 'Alto'
                    WHEN t.impact = 5 THEN 'Muy alto'
                    ELSE 'Medio'
                END as impact_name")
            )
            ->leftJoin('glpi_entities as e', 't.entities_id', '=', 'e.id')
            ->leftJoin('glpi_locations as l', 't.locations_id', '=', 'l.id')
            ->leftJoin('glpi_itilcategories as cat', 't.itilcategories_id', '=', 'cat.id')
            ->where('t.id', $id)
            ->where('t.is_deleted', 0)
            ->first();

        if (!$ticket) {
            return redirect()->route('soporte.casos')->with('error', 'Caso no encontrado');
        }

        // Obtener solicitante
        $requester = DB::table('glpi_tickets_users as tu')
            ->select('u.id', 'u.firstname', 'u.realname', DB::raw("CONCAT(u.firstname, ' ', u.realname) as fullname"))
            ->join('glpi_users as u', 'tu.users_id', '=', 'u.id')
            ->where('tu.tickets_id', $id)
            ->where('tu.type', 1)
            ->first();

        // Obtener técnico asignado
        $technician = DB::table('glpi_tickets_users as tu')
            ->select('u.id', 'u.firstname', 'u.realname', DB::raw("CONCAT(u.firstname, ' ', u.realname) as fullname"))
            ->join('glpi_users as u', 'tu.users_id', '=', 'u.id')
            ->where('tu.tickets_id', $id)
            ->where('tu.type', 2)
            ->first();

        // Obtener elementos asociados
        $ticketItems = DB::table('glpi_items_tickets as it')
            ->select('it.*')
            ->where('it.tickets_id', $id)
            ->get()
            ->map(function($item) {
                $itemData = null;
                $tableName = 'glpi_' . strtolower($item->itemtype) . 's';
                
                try {
                    $itemData = DB::table($tableName)
                        ->select('id', 'name')
                        ->where('id', $item->items_id)
                        ->first();
                } catch (\Exception $e) {
                    // Tabla no existe o error
                }
                
                return [
                    'itemtype' => $item->itemtype,
                    'items_id' => $item->items_id,
                    'name' => $itemData->name ?? 'N/A',
                ];
            });

        // Obtener archivos adjuntos
        $attachments = [];
        
        // 1. Buscar archivos en directorio local (creados por nuestra app)
        $attachmentPath = storage_path('app/public/ticket-attachments/' . $id);
        if (is_dir($attachmentPath)) {
            $files = scandir($attachmentPath);
            foreach ($files as $file) {
                if ($file !== '.' && $file !== '..') {
                    $attachments[] = [
                        'name' => $file,
                        'url' => asset('storage/ticket-attachments/' . $id . '/' . $file),
                        'size' => filesize($attachmentPath . '/' . $file),
                        'source' => 'local',
                    ];
                }
            }
        }
        
        // 2. Buscar documentos en GLPI (glpi_documents_items + glpi_documents)
        $glpiDocuments = DB::table('glpi_documents_items as di')
            ->select('d.id', 'd.name', 'd.filename', 'd.filepath', 'd.mime', 'd.filesize')
            ->join('glpi_documents as d', 'di.documents_id', '=', 'd.id')
            ->where('di.itemtype', 'Ticket')
            ->where('di.items_id', $id)
            ->where('d.is_deleted', 0)
            ->get();
        
        foreach ($glpiDocuments as $doc) {
            // GLPI guarda archivos en /var/lib/glpi/files/_documents/
            // El filepath tiene formato como "PDF/abc123.pdf"
            $attachments[] = [
                'name' => $doc->name ?: $doc->filename,
                'url' => '/glpi-files/' . $doc->filepath,
                'size' => $doc->filesize ?? 0,
                'mime' => $doc->mime,
                'source' => 'glpi',
                'glpi_id' => $doc->id,
            ];
        }

        return Inertia::render('soporte/ver-caso', [
            'ticket' => $ticket,
            'requester' => $requester,
            'technician' => $technician,
            'ticketItems' => $ticketItems,
            'attachments' => $attachments,
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    }

    public function edit($id)
    {
        $ticket = DB::table('glpi_tickets as t')
            ->select(
                't.*',
                'e.name as entity_name',
                'l.completename as location_name'
            )
            ->leftJoin('glpi_entities as e', 't.entities_id', '=', 'e.id')
            ->leftJoin('glpi_locations as l', 't.locations_id', '=', 'l.id')
            ->where('t.id', $id)
            ->where('t.is_deleted', 0)
            ->first();

        if (!$ticket) {
            return redirect()->route('soporte.casos')->with('error', 'Caso no encontrado');
        }

        // Obtener usuarios asignados
        $ticketUsers = DB::table('glpi_tickets_users')
            ->where('tickets_id', $id)
            ->get();

        // Obtener elementos asociados
        $ticketItems = DB::table('glpi_items_tickets')
            ->where('tickets_id', $id)
            ->get();

        // Obtener localizaciones
        $locations = DB::table('glpi_locations')
            ->select('id', 'name', 'completename')
            ->orderBy('completename')
            ->get();

        // Obtener categorías de GLPI
        $categories = DB::table('glpi_itilcategories')
            ->select('id', 'name', 'completename')
            ->where('is_incident', 1)
            ->orderBy('completename')
            ->get();

        // Obtener usuarios de GLPI
        $glpiUsers = DB::table('glpi_users')
            ->select('id', 'name', 'firstname', 'realname', DB::raw("CONCAT(firstname, ' ', realname) as fullname"))
            ->where('is_deleted', 0)
            ->where('is_active', 1)
            ->orderBy('firstname')
            ->get();

        // Tipos de elementos
        $itemTypes = [
            ['value' => 'Computer', 'label' => 'Computador'],
            ['value' => 'Monitor', 'label' => 'Monitor'],
            ['value' => 'NetworkEquipment', 'label' => 'Dispositivo para red'],
            ['value' => 'Peripheral', 'label' => 'Dispositivo'],
            ['value' => 'Printer', 'label' => 'Impresora'],
            ['value' => 'Phone', 'label' => 'Teléfono'],
            ['value' => 'Enclosure', 'label' => 'Gabinete'],
        ];

        return Inertia::render('soporte/editar-caso', [
            'ticket' => $ticket,
            'ticketUsers' => $ticketUsers,
            'ticketItems' => $ticketItems,
            'locations' => $locations,
            'categories' => $categories,
            'glpiUsers' => $glpiUsers,
            'itemTypes' => $itemTypes,
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'required|string',
            'date' => 'required|date',
            'time_to_resolve' => 'nullable|date',
            'internal_time_to_resolve' => 'nullable|date',
            'status' => 'required|integer|between:1,6',
            'priority' => 'required|integer|between:1,6',
            'locations_id' => 'nullable|integer',
            'itilcategories_id' => 'nullable|integer',
        ]);

        // Obtener el estado anterior para comparar
        $oldTicket = DB::table('glpi_tickets')->where('id', $id)->first();
        $oldStatus = $oldTicket ? $oldTicket->status : null;

        DB::beginTransaction();
        try {
            DB::table('glpi_tickets')
                ->where('id', $id)
                ->update([
                    'name' => $validated['name'],
                    'content' => $validated['content'],
                    'date' => $validated['date'],
                    'date_mod' => now(),
                    'time_to_resolve' => $validated['time_to_resolve'] ?? null,
                    'internal_time_to_resolve' => $validated['internal_time_to_resolve'] ?? null,
                    'status' => $validated['status'],
                    'priority' => $validated['priority'],
                    'locations_id' => $validated['locations_id'] ?? 0,
                    'itilcategories_id' => $validated['itilcategories_id'] ?? 0,
                ]);

            // Notificar cambios de estado
            if ($oldStatus && $oldStatus != $validated['status']) {
                $statusNames = [
                    1 => 'Nuevo',
                    2 => 'En curso (asignado)',
                    3 => 'En curso (planificado)',
                    4 => 'En espera',
                    5 => 'Resuelto',
                    6 => 'Cerrado',
                ];
                $newStatusName = $statusNames[$validated['status']] ?? 'Desconocido';

                // Notificar al creador del caso
                $requester = DB::table('glpi_tickets_users as tu')
                    ->where('tu.tickets_id', $id)
                    ->where('tu.type', 1)
                    ->first();

                if ($requester && $requester->users_id != auth()->id()) {
                    $localUser = User::where('id', $requester->users_id)->first();
                    if ($localUser) {
                        if ($validated['status'] == 5) {
                            Notification::createTicketResolved($localUser->id, $id, $validated['name']);
                        } elseif ($validated['status'] == 6) {
                            Notification::createTicketClosed($localUser->id, $id, $validated['name']);
                        } else {
                            Notification::createTicketStatusChange($localUser->id, $id, $validated['name'], $newStatusName);
                        }
                    }
                }

                // Notificar al técnico asignado (si no es quien hace el cambio)
                $assigned = DB::table('glpi_tickets_users as tu')
                    ->where('tu.tickets_id', $id)
                    ->where('tu.type', 2)
                    ->first();

                if ($assigned && $assigned->users_id != auth()->id() && $assigned->users_id != ($requester->users_id ?? 0)) {
                    $localUser = User::where('id', $assigned->users_id)->first();
                    if ($localUser) {
                        Notification::createTicketStatusChange($localUser->id, $id, $validated['name'], $newStatusName);
                    }
                }
            }

            DB::commit();

            return redirect()->route('soporte.casos')->with('success', 'Caso actualizado exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al actualizar el caso: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Agregar solución y cerrar el caso
     */
    public function addSolution(Request $request, $id)
    {
        $validated = $request->validate([
            'solution' => 'required|string|min:10',
        ]);

        $ticket = DB::table('glpi_tickets')
            ->where('id', $id)
            ->where('is_deleted', 0)
            ->first();

        if (!$ticket) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Caso no encontrado'], 404);
            }
            return redirect()->back()->with('error', 'Caso no encontrado');
        }

        DB::beginTransaction();
        try {
            // Insertar la solución en glpi_itilsolutions
            DB::table('glpi_itilsolutions')->insert([
                'itemtype' => 'Ticket',
                'items_id' => $id,
                'content' => $validated['solution'],
                'date_creation' => now(),
                'date_mod' => now(),
                'users_id' => auth()->id(),
                'status' => 2, // Aprobado
            ]);

            // Actualizar el estado del ticket a Cerrado (6)
            DB::table('glpi_tickets')
                ->where('id', $id)
                ->update([
                    'status' => 6, // Cerrado
                    'date_mod' => now(),
                    'solvedate' => now(),
                    'closedate' => now(),
                ]);

            // Notificar al creador del caso que fue cerrado
            $requester = DB::table('glpi_tickets_users as tu')
                ->join('glpi_users as u', 'tu.users_id', '=', 'u.id')
                ->where('tu.tickets_id', $id)
                ->where('tu.type', 1) // Requester
                ->first();
            
            if ($requester && $requester->users_id != auth()->id()) {
                $localUser = User::where('id', $requester->users_id)->first();
                if ($localUser) {
                    Notification::createTicketClosed(
                        $localUser->id,
                        $id,
                        $ticket->name
                    );
                }
            }

            DB::commit();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true, 
                    'message' => 'Caso #' . $id . ' cerrado exitosamente'
                ]);
            }

            return redirect()->route('dashboard')->with('success', 'Caso #' . $id . ' cerrado exitosamente con la solución agregada');

        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Error al cerrar el caso: ' . $e->getMessage()], 500);
            }
            
            return redirect()->back()->with('error', 'Error al cerrar el caso: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        $user = auth()->user();
        
        // Verificar permisos
        if ($user->role === 'Técnico') {
            // Técnicos solo pueden eliminar casos que ellos crearon
            $ticket = DB::table('glpi_tickets')
                ->where('id', $id)
                ->first();

            if (!$ticket) {
                return redirect()->back()->with('error', 'Caso no encontrado');
            }

            // Verificar si el técnico es el creador (users_id_recipient)
            // También verificamos en glpi_tickets_users con type=1 (requester)
            $isCreator = DB::table('glpi_tickets_users')
                ->where('tickets_id', $id)
                ->where('type', 1) // Requester/Creator
                ->where('users_id', $user->id)
                ->exists();

            // O si el usuario está registrado como el recipient
            $isRecipient = $ticket->users_id_recipient == $user->id;

            if (!$isCreator && !$isRecipient) {
                return redirect()->back()->with('error', 'No tienes permisos para eliminar este caso');
            }
        }
        // Administradores pueden eliminar cualquier caso

        DB::beginTransaction();
        try {
            // Marcar como eliminado (soft delete)
            DB::table('glpi_tickets')
                ->where('id', $id)
                ->update(['is_deleted' => 1]);

            DB::commit();

            return redirect()->route('soporte.casos')->with('success', 'Caso eliminado exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al eliminar el caso: ' . $e->getMessage());
        }
    }

    /**
     * Servir archivos de documentos de GLPI
     */
    public function serveGlpiFile($path)
    {
        // Rutas posibles donde GLPI guarda sus archivos
        $possiblePaths = [
            '/var/lib/glpi/files/_documents/' . $path,
            '/var/www/glpi/files/_documents/' . $path,
            '/opt/glpi/files/_documents/' . $path,
            base_path('../glpi/files/_documents/' . $path),
            env('GLPI_FILES_PATH', '/var/lib/glpi/files/_documents/') . $path,
        ];

        foreach ($possiblePaths as $filePath) {
            if (file_exists($filePath)) {
                $mimeType = mime_content_type($filePath);
                $fileName = basename($path);
                
                return response()->file($filePath, [
                    'Content-Type' => $mimeType,
                    'Content-Disposition' => 'inline; filename="' . $fileName . '"',
                ]);
            }
        }

        // Si no se encuentra, intentar buscar en la BD el documento por su filepath
        $doc = DB::table('glpi_documents')
            ->where('filepath', $path)
            ->first();

        if ($doc) {
            // Intentar con el SHA1SUM que GLPI usa para nombrar archivos
            foreach ($possiblePaths as $basePath) {
                $dirPath = dirname($basePath);
                if (is_dir($dirPath)) {
                    // GLPI guarda archivos con nombres SHA1
                    $sha1Path = $dirPath . '/' . $doc->sha1sum;
                    if (file_exists($sha1Path)) {
                        return response()->file($sha1Path, [
                            'Content-Type' => $doc->mime ?? 'application/octet-stream',
                            'Content-Disposition' => 'inline; filename="' . ($doc->filename ?? basename($path)) . '"',
                        ]);
                    }
                }
            }
        }

        abort(404, 'Archivo no encontrado');
    }
}
