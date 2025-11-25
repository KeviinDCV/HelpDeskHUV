<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Models\User;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $sortField = $request->input('sort', 'id');
        $sortDirection = $request->input('direction', 'desc');
        $search = $request->input('search', '');

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
        
        $tickets = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search
            ]);

        return Inertia::render('soporte/casos', [
            'tickets' => $tickets,
            'filters' => [
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search
            ],
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    }

    public function create()
    {
        // Obtener usuarios activos de Laravel (para solicitante, observador, asignado)
        $users = User::where('is_active', true)
            ->select('id', 'username', 'name', 'email')
            ->orderBy('name')
            ->get();

        // Obtener localizaciones de GLPI
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

        // Obtener usuarios de GLPI (por si necesitan seleccionar de la BD de GLPI)
        $glpiUsers = DB::table('glpi_users')
            ->select('id', 'name', 'firstname', 'realname', DB::raw("CONCAT(firstname, ' ', realname) as fullname"))
            ->where('is_deleted', 0)
            ->where('is_active', 1)
            ->orderBy('firstname')
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
            'glpiUsers' => $glpiUsers,
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
        
        switch ($type) {
            case 'Computer':
                $items = DB::table('glpi_computers')
                    ->select('id', 'name')
                    ->where('is_deleted', 0)
                    ->orderBy('name')
                    ->get();
                break;
            case 'Monitor':
                $items = DB::table('glpi_monitors')
                    ->select('id', 'name')
                    ->where('is_deleted', 0)
                    ->orderBy('name')
                    ->get();
                break;
            case 'NetworkEquipment':
                $items = DB::table('glpi_networkequipments')
                    ->select('id', 'name')
                    ->where('is_deleted', 0)
                    ->orderBy('name')
                    ->get();
                break;
            case 'Peripheral':
                $items = DB::table('glpi_peripherals')
                    ->select('id', 'name')
                    ->where('is_deleted', 0)
                    ->orderBy('name')
                    ->get();
                break;
            case 'Printer':
                $items = DB::table('glpi_printers')
                    ->select('id', 'name')
                    ->where('is_deleted', 0)
                    ->orderBy('name')
                    ->get();
                break;
            case 'Phone':
                $items = DB::table('glpi_phones')
                    ->select('id', 'name')
                    ->where('is_deleted', 0)
                    ->orderBy('name')
                    ->get();
                break;
            case 'Enclosure':
                $items = DB::table('glpi_enclosures')
                    ->select('id', 'name')
                    ->where('is_deleted', 0)
                    ->orderBy('name')
                    ->get();
                break;
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
            'requester_id' => 'required|integer',
            'observer_ids' => 'nullable|array',
            'observer_ids.*' => 'integer',
            'assigned_ids' => 'nullable|array',
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
                'users_id_recipient' => $validated['requester_id'],
                'is_deleted' => 0,
            ]);

            // Agregar solicitante (type = 1)
            DB::table('glpi_tickets_users')->insert([
                'tickets_id' => $ticketId,
                'users_id' => $validated['requester_id'],
                'type' => 1, // Requester
                'use_notification' => 1,
            ]);

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
                foreach ($validated['assigned_ids'] as $assignedId) {
                    DB::table('glpi_tickets_users')->insert([
                        'tickets_id' => $ticketId,
                        'users_id' => $assignedId,
                        'type' => 2, // Assigned
                        'use_notification' => 1,
                    ]);
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

        return Inertia::render('soporte/ver-caso', [
            'ticket' => $ticket,
            'requester' => $requester,
            'technician' => $technician,
            'ticketItems' => $ticketItems,
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
        ]);

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
                ]);

            DB::commit();

            return redirect()->route('soporte.casos')->with('success', 'Caso actualizado exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al actualizar el caso: ' . $e->getMessage())->withInput();
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
}
