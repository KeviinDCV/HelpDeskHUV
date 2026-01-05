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

        // Mapeo de campos para ordenamiento
        $sortableFields = [
            'id' => 't.id',
            'name' => 't.name',
            'entity_name' => 'e.name',
            'date' => 't.date',
            'date_mod' => 't.date_mod',
            'status' => 't.status',
            'priority' => 't.priority',
            'category_name' => 'cat.completename',
            'requester_name' => 't.id', // Se ordena por ID ya que requester es subconsulta
            'assigned_name' => 't.id',  // Se ordena por ID ya que assigned es subconsulta
            'item_name' => 't.id',      // Se ordena por ID ya que item es subconsulta
        ];

        // Validar que sortField sea válido, si no usar 'id'
        if (!array_key_exists($sortField, $sortableFields)) {
            $sortField = 'id';
        }
        
        $orderByField = $sortableFields[$sortField];
        
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
                DB::raw("(SELECT COALESCE(
                            NULLIF(CONCAT(gu.firstname, ' ', gu.realname), ' '),
                            lu.name
                         )
                         FROM glpi_tickets_users tu 
                         LEFT JOIN glpi_users gu ON tu.users_id = gu.id 
                         LEFT JOIN users lu ON tu.users_id = lu.id
                         WHERE tu.tickets_id = t.id AND tu.type = 1 
                         LIMIT 1) as requester_name"),
                DB::raw("(SELECT lu.id
                         FROM glpi_tickets_users tu 
                         LEFT JOIN users lu ON tu.users_id = lu.glpi_user_id
                         WHERE tu.tickets_id = t.id AND tu.type = 1 
                         LIMIT 1) as requester_user_id"),
                DB::raw("(SELECT COALESCE(
                            (SELECT CONCAT(gu.firstname, ' ', gu.realname)
                             FROM glpi_itilsolutions sol
                             LEFT JOIN glpi_users gu ON sol.users_id = gu.id
                             WHERE sol.items_id = t.id AND sol.itemtype = 'Ticket'
                             ORDER BY sol.id DESC LIMIT 1),
                            (SELECT COALESCE(NULLIF(CONCAT(gu.firstname, ' ', gu.realname), ' '), lu.name)
                             FROM glpi_tickets_users tu
                             LEFT JOIN glpi_users gu ON tu.users_id = gu.id
                             LEFT JOIN users lu ON tu.users_id = lu.id
                             WHERE tu.tickets_id = t.id AND tu.type = 2
                             LIMIT 1)
                         )) as assigned_name"),
                DB::raw("(SELECT COALESCE(
                            (SELECT lu.id
                             FROM glpi_itilsolutions sol
                             LEFT JOIN users lu ON sol.users_id = lu.glpi_user_id
                             WHERE sol.items_id = t.id AND sol.itemtype = 'Ticket'
                             ORDER BY sol.id DESC LIMIT 1),
                            (SELECT lu.id
                             FROM glpi_tickets_users tu
                             LEFT JOIN users lu ON tu.users_id = lu.glpi_user_id
                             WHERE tu.tickets_id = t.id AND tu.type = 2
                             LIMIT 1)
                         )) as assigned_user_id"),
                DB::raw("(SELECT COALESCE(
                            (SELECT sol.users_id
                             FROM glpi_itilsolutions sol
                             WHERE sol.items_id = t.id AND sol.itemtype = 'Ticket'
                             ORDER BY sol.id DESC LIMIT 1),
                            (SELECT tu.users_id
                             FROM glpi_tickets_users tu
                             WHERE tu.tickets_id = t.id AND tu.type = 2
                             LIMIT 1)
                         )) as assigned_glpi_id"),
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
                DB::raw("(SELECT CONCAT(
                            CASE it.itemtype
                                WHEN 'Computer' THEN 'PC: '
                                WHEN 'Printer' THEN 'Imp: '
                                WHEN 'Phone' THEN 'Tel: '
                                WHEN 'Monitor' THEN 'Mon: '
                                WHEN 'NetworkEquipment' THEN 'Red: '
                                WHEN 'Peripheral' THEN 'Per: '
                                ELSE ''
                            END,
                            CASE it.itemtype
                                WHEN 'Computer' THEN (SELECT name FROM glpi_computers WHERE id = it.items_id)
                                WHEN 'Printer' THEN (SELECT name FROM glpi_printers WHERE id = it.items_id)
                                WHEN 'Phone' THEN (SELECT name FROM glpi_phones WHERE id = it.items_id)
                                WHEN 'Monitor' THEN (SELECT name FROM glpi_monitors WHERE id = it.items_id)
                                WHEN 'NetworkEquipment' THEN (SELECT name FROM glpi_networkequipments WHERE id = it.items_id)
                                WHEN 'Peripheral' THEN (SELECT name FROM glpi_peripherals WHERE id = it.items_id)
                                ELSE it.itemtype
                            END
                        )
                        FROM glpi_items_tickets it 
                        WHERE it.tickets_id = t.id 
                        LIMIT 1) as item_name")
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
            // Obtener el name de la categoría seleccionada
            $selectedCategoryName = DB::table('glpi_itilcategories')
                ->where('id', $categoryFilter)
                ->value('name');
            
            if ($selectedCategoryName) {
                // Buscar TODOS los IDs que tengan el mismo name (para unificar duplicados en GLPI)
                $categoryIds = DB::table('glpi_itilcategories')
                    ->where('name', $selectedCategoryName)
                    ->pluck('id')
                    ->toArray();
                
                $query->whereIn('t.itilcategories_id', $categoryIds);
            } else {
                $query->where('t.itilcategories_id', $categoryFilter);
            }
        }
        
        if ($assignedFilter !== '') {
            // Buscar por técnico que dio la solución (glpi_itilsolutions) O por técnico asignado (glpi_tickets_users)
            $query->where(function ($q) use ($assignedFilter) {
                $q->whereExists(function ($sub) use ($assignedFilter) {
                    $sub->select(DB::raw(1))
                        ->from('glpi_itilsolutions')
                        ->whereColumn('glpi_itilsolutions.items_id', 't.id')
                        ->where('glpi_itilsolutions.itemtype', 'Ticket')
                        ->where('glpi_itilsolutions.users_id', $assignedFilter);
                })->orWhere(function ($sub) use ($assignedFilter) {
                    $sub->whereExists(function ($inner) use ($assignedFilter) {
                        $inner->select(DB::raw(1))
                              ->from('glpi_tickets_users')
                              ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                              ->where('glpi_tickets_users.type', 2)
                              ->where('glpi_tickets_users.users_id', $assignedFilter);
                    })->whereNotExists(function ($inner) {
                        $inner->select(DB::raw(1))
                              ->from('glpi_itilsolutions')
                              ->whereColumn('glpi_itilsolutions.items_id', 't.id')
                              ->where('glpi_itilsolutions.itemtype', 'Ticket');
                    });
                });
            });
        }
        
        if ($dateFrom && $dateFrom !== '') {
            $query->where('t.date', '>=', $dateFrom . ' 00:00:00');
        }
        
        if ($dateTo && $dateTo !== '') {
            $query->where('t.date', '<=', $dateTo . ' 23:59:59');
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
        } elseif ($specialFilter === 'my_pending') {
            // Mis casos sin resolver (asignados a mí, pendientes)
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
            })->whereNotIn('t.status', [5, 6]); // Excluir resueltos y cerrados
        } elseif ($specialFilter === 'my_resolved') {
            // Mis casos resueltos (asignados a mí, resueltos o cerrados)
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
            })->whereIn('t.status', [5, 6]); // Solo resueltos y cerrados
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
        
        // Obtener categorías para el filtro (agrupadas por name para unificar duplicados de GLPI)
        $categories = DB::table('glpi_itilcategories')
            ->select(
                DB::raw('MIN(id) as id'),
                'name',
                DB::raw('MIN(completename) as completename')
            )
            ->where('is_incident', 1)
            ->whereNotNull('name')
            ->where('name', '!=', '')
            ->groupBy('name')
            ->orderBy('name')
            ->get();
        
        // Obtener técnicos de la tabla users de Laravel (Técnicos y Administradores activos)
        // que tengan glpi_user_id configurado
        $technicians = User::where('is_active', 1)
            ->whereIn('role', ['Técnico', 'Administrador'])
            ->whereNotNull('glpi_user_id')
            ->orderBy('name')
            ->get()
            ->map(fn($user) => (object)[
                'id' => $user->glpi_user_id, // Usar el ID de GLPI para el filtro
                'fullname' => $user->name
            ]);

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

    public function export(Request $request)
    {
        // Aumentar tiempo de ejecución para exportaciones grandes
        set_time_limit(300);
        
        $sortField = $request->input('sort', 'id');
        $sortDirection = $request->input('direction', 'desc');
        $search = $request->input('search', '');
        $statusFilter = $request->input('status', '');
        $priorityFilter = $request->input('priority', '');
        $categoryFilter = $request->input('category', '');
        $assignedFilter = $request->input('assigned', '');
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');
        $specialFilter = $request->input('filter', '');

        $sortableFields = [
            'id' => 't.id',
            'name' => 't.name',
            'entity_name' => 'e.name',
            'date' => 't.date',
            'date_mod' => 't.date_mod',
            'status' => 't.status',
            'priority' => 't.priority',
        ];

        if (!array_key_exists($sortField, $sortableFields)) {
            $sortField = 'id';
        }
        $orderByField = $sortableFields[$sortField];

        $query = DB::table('glpi_tickets as t')
            ->select(
                't.id',
                't.name',
                't.date',
                't.date_mod',
                't.priority',
                't.status',
                'e.name as entity_name',
                'cat.completename as category_name',
                DB::raw("(SELECT COALESCE(
                            NULLIF(CONCAT(gu.firstname, ' ', gu.realname), ' '),
                            lu.name
                         )
                         FROM glpi_tickets_users tu 
                         LEFT JOIN glpi_users gu ON tu.users_id = gu.id 
                         LEFT JOIN users lu ON tu.users_id = lu.id
                         WHERE tu.tickets_id = t.id AND tu.type = 1 
                         LIMIT 1) as requester_name"),
                DB::raw("(SELECT COALESCE(
                            (SELECT CONCAT(gu.firstname, ' ', gu.realname)
                             FROM glpi_itilsolutions sol
                             LEFT JOIN glpi_users gu ON sol.users_id = gu.id
                             WHERE sol.items_id = t.id AND sol.itemtype = 'Ticket'
                             ORDER BY sol.id DESC LIMIT 1),
                            (SELECT COALESCE(NULLIF(CONCAT(gu.firstname, ' ', gu.realname), ' '), lu.name)
                             FROM glpi_tickets_users tu
                             LEFT JOIN glpi_users gu ON tu.users_id = gu.id
                             LEFT JOIN users lu ON tu.users_id = lu.id
                             WHERE tu.tickets_id = t.id AND tu.type = 2
                             LIMIT 1)
                         )) as assigned_name"),
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

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('t.name', 'LIKE', "%{$search}%")
                  ->orWhere('t.id', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%");
            });
        }

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
            $query->where(function ($q) use ($assignedFilter) {
                $q->whereExists(function ($sub) use ($assignedFilter) {
                    $sub->select(DB::raw(1))
                        ->from('glpi_itilsolutions')
                        ->whereColumn('glpi_itilsolutions.items_id', 't.id')
                        ->where('glpi_itilsolutions.itemtype', 'Ticket')
                        ->where('glpi_itilsolutions.users_id', $assignedFilter);
                })->orWhere(function ($sub) use ($assignedFilter) {
                    $sub->whereExists(function ($inner) use ($assignedFilter) {
                        $inner->select(DB::raw(1))
                              ->from('glpi_tickets_users')
                              ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                              ->where('glpi_tickets_users.type', 2)
                              ->where('glpi_tickets_users.users_id', $assignedFilter);
                    })->whereNotExists(function ($inner) {
                        $inner->select(DB::raw(1))
                              ->from('glpi_itilsolutions')
                              ->whereColumn('glpi_itilsolutions.items_id', 't.id')
                              ->where('glpi_itilsolutions.itemtype', 'Ticket');
                    });
                });
            });
        }
        if ($dateFrom && $dateFrom !== '') {
            $query->where('t.date', '>=', $dateFrom . ' 00:00:00');
        }
        if ($dateTo && $dateTo !== '') {
            $query->where('t.date', '<=', $dateTo . ' 23:59:59');
        }

        // Filtros especiales
        if ($specialFilter === 'unassigned') {
            $query->where('t.status', 1)
                  ->whereNotExists(function ($q) {
                      $q->select(DB::raw(1))
                        ->from('glpi_tickets_users')
                        ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                        ->where('glpi_tickets_users.type', 2);
                  });
        } elseif ($specialFilter === 'my_cases') {
            $user = auth()->user();
            $glpiUser = DB::table('glpi_users')->where('name', $user->username ?? $user->name)->first();
            $glpiUserId = $glpiUser ? $glpiUser->id : 0;
            $query->whereExists(function ($q) use ($glpiUserId) {
                $q->select(DB::raw(1))
                  ->from('glpi_tickets_users')
                  ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                  ->where('glpi_tickets_users.type', 2)
                  ->where('glpi_tickets_users.users_id', $glpiUserId);
            })->where('t.status', '!=', 6);
        } elseif ($specialFilter === 'my_pending') {
            $user = auth()->user();
            $glpiUser = DB::table('glpi_users')->where('name', $user->username ?? $user->name)->first();
            $glpiUserId = $glpiUser ? $glpiUser->id : 0;
            $query->whereExists(function ($q) use ($glpiUserId) {
                $q->select(DB::raw(1))
                  ->from('glpi_tickets_users')
                  ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                  ->where('glpi_tickets_users.type', 2)
                  ->where('glpi_tickets_users.users_id', $glpiUserId);
            })->whereNotIn('t.status', [5, 6]);
        } elseif ($specialFilter === 'my_resolved') {
            $user = auth()->user();
            $glpiUser = DB::table('glpi_users')->where('name', $user->username ?? $user->name)->first();
            $glpiUserId = $glpiUser ? $glpiUser->id : 0;
            $query->whereExists(function ($q) use ($glpiUserId) {
                $q->select(DB::raw(1))
                  ->from('glpi_tickets_users')
                  ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                  ->where('glpi_tickets_users.type', 2)
                  ->where('glpi_tickets_users.users_id', $glpiUserId);
            })->whereIn('t.status', [5, 6]);
        }

        $tickets = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear Excel
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Casos');

        // Propiedades del documento
        $spreadsheet->getProperties()
            ->setCreator('HelpDesk HUV')
            ->setTitle('Listado de Casos')
            ->setSubject('Exportación de casos de soporte');

        // Encabezado
        $sheet->setCellValue('A1', 'HELPDESK HUV - LISTADO DE CASOS');
        $sheet->mergeCells('A1:I1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        $sheet->setCellValue('A2', 'Hospital Universitario del Valle - Gestión de Soporte');
        $sheet->mergeCells('A2:I2');
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        $sheet->setCellValue('A3', 'Generado: ' . date('d/m/Y H:i'));
        $sheet->mergeCells('A3:I3');
        $sheet->getStyle('A3')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        // Headers de tabla
        $row = 5;
        $headers = ['ID', 'Título', 'Estado', 'Prioridad', 'Entidad', 'Categoría', 'Solicitante', 'Asignado a', 'Fecha Apertura', 'Última Actualización'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue("{$col}{$row}", $header);
            $col++;
        }
        $sheet->getStyle("A{$row}:J{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}:J{$row}")->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('2c4370');
        $sheet->getStyle("A{$row}:J{$row}")->getFont()->getColor()->setRGB('FFFFFF');

        // Datos
        $row++;
        foreach ($tickets as $ticket) {
            $sheet->setCellValue("A{$row}", $ticket->id);
            $sheet->setCellValue("B{$row}", $ticket->name ?? '-');
            $sheet->setCellValue("C{$row}", $ticket->status_name ?? '-');
            $sheet->setCellValue("D{$row}", $ticket->priority_name ?? '-');
            $sheet->setCellValue("E{$row}", $ticket->entity_name ?? '-');
            $sheet->setCellValue("F{$row}", $ticket->category_name ?? '-');
            $sheet->setCellValue("G{$row}", $ticket->requester_name ?? '-');
            $sheet->setCellValue("H{$row}", $ticket->assigned_name ?? '-');
            $sheet->setCellValue("I{$row}", $ticket->date ? date('d/m/Y H:i', strtotime($ticket->date)) : '-');
            $sheet->setCellValue("J{$row}", $ticket->date_mod ? date('d/m/Y H:i', strtotime($ticket->date_mod)) : '-');
            $row++;
        }

        // Anchos de columna fijos (evitar autosize que es muy lento)
        $sheet->getColumnDimension('A')->setWidth(8);   // ID
        $sheet->getColumnDimension('B')->setWidth(50);  // Título
        $sheet->getColumnDimension('C')->setWidth(18);  // Estado
        $sheet->getColumnDimension('D')->setWidth(12);  // Prioridad
        $sheet->getColumnDimension('E')->setWidth(20);  // Entidad
        $sheet->getColumnDimension('F')->setWidth(25);  // Categoría
        $sheet->getColumnDimension('G')->setWidth(25);  // Solicitante
        $sheet->getColumnDimension('H')->setWidth(25);  // Asignado
        $sheet->getColumnDimension('I')->setWidth(18);  // Fecha Apertura
        $sheet->getColumnDimension('J')->setWidth(18);  // Última Actualización

        // Generar archivo
        $filename = 'Casos_HelpDesk_' . date('Y-m-d_His') . '.xlsx';
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function create()
    {
        // Obtener usuarios activos de Laravel con su glpi_user_id
        // El ID que se usa en selectores es glpi_user_id para compatibilidad con GLPI
        $users = User::where('is_active', 1)
            ->whereNotNull('glpi_user_id')
            ->select('id', 'glpi_user_id', 'username', 'name', 'email')
            ->orderBy('name')
            ->get()
            ->map(fn($user) => [
                'id' => $user->glpi_user_id, // Usar glpi_user_id como ID para GLPI
                'laravel_id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
            ]);

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
            // Determinar el estado correcto:
            // Si hay técnicos asignados y el estado es "Nuevo" (1), cambiar a "En curso (asignado)" (2)
            $status = $validated['status'];
            if (!empty($validated['assigned_ids']) && count($validated['assigned_ids']) > 0 && $status == 1) {
                $status = 2; // En curso (asignado)
            }

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
                'status' => $status,
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
                    // $assignedId es glpi_user_id, necesitamos buscar el usuario local por glpi_user_id
                    $localUser = User::where('glpi_user_id', $assignedId)->first();
                    if ($localUser && $localUser->id != auth()->id()) {
                        Notification::createTicketAssigned(
                            $localUser->id,
                            $ticketId,
                            $validated['name'],
                            $creatorName
                        );
                    }
                }
                
                // Si es prioridad alta (4), muy alta (5) o urgente (6), notificar a todos los técnicos
                if ($validated['priority'] >= 4) {
                    $technicians = User::where(function($q) {
                            $q->where('role', 'Técnico')
                              ->orWhere('role', 'Administrador');
                        })
                        ->where('id', '!=', auth()->id())
                        ->whereNotNull('glpi_user_id')
                        ->get();
                    
                    foreach ($technicians as $tech) {
                        // Evitar duplicar notificación si ya está asignado (comparar por glpi_user_id)
                        if (!in_array($tech->glpi_user_id, $validated['assigned_ids'])) {
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

        // Obtener solicitante (buscar en glpi_users y si no, en users de Laravel)
        $requester = DB::table('glpi_tickets_users as tu')
            ->select(
                'tu.users_id as id',
                'gu.firstname',
                'gu.realname',
                DB::raw("COALESCE(NULLIF(CONCAT(gu.firstname, ' ', gu.realname), ' '), lu.name) as fullname")
            )
            ->leftJoin('glpi_users as gu', 'tu.users_id', '=', 'gu.id')
            ->leftJoin('users as lu', 'tu.users_id', '=', 'lu.id')
            ->where('tu.tickets_id', $id)
            ->where('tu.type', 1)
            ->first();

        // Obtener técnico asignado (buscar en glpi_users y si no, en users de Laravel)
        $technician = DB::table('glpi_tickets_users as tu')
            ->select(
                'tu.users_id as id',
                'gu.firstname',
                'gu.realname',
                DB::raw("COALESCE(NULLIF(CONCAT(gu.firstname, ' ', gu.realname), ' '), lu.name) as fullname")
            )
            ->leftJoin('glpi_users as gu', 'tu.users_id', '=', 'gu.id')
            ->leftJoin('users as lu', 'tu.users_id', '=', 'lu.id')
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

        // Obtener solución del caso (si existe)
        $solution = DB::table('glpi_itilsolutions')
            ->select(
                'glpi_itilsolutions.id',
                'glpi_itilsolutions.content',
                'glpi_itilsolutions.date_creation',
                'glpi_itilsolutions.users_id',
                DB::raw("COALESCE(NULLIF(CONCAT(gu.firstname, ' ', gu.realname), ' '), lu.name) as solved_by")
            )
            ->leftJoin('glpi_users as gu', 'glpi_itilsolutions.users_id', '=', 'gu.id')
            ->leftJoin('users as lu', 'glpi_itilsolutions.users_id', '=', 'lu.glpi_user_id')
            ->where('glpi_itilsolutions.itemtype', 'Ticket')
            ->where('glpi_itilsolutions.items_id', $id)
            ->orderBy('glpi_itilsolutions.id', 'desc')
            ->first();

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
            'solution' => $solution,
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

        // Obtener elementos asociados con sus nombres
        $ticketItems = DB::table('glpi_items_tickets')
            ->where('tickets_id', $id)
            ->get()
            ->map(function($item) {
                $itemName = null;
                $tableName = 'glpi_' . strtolower($item->itemtype) . 's';
                try {
                    $itemData = DB::table($tableName)->where('id', $item->items_id)->first();
                    $itemName = $itemData->name ?? null;
                } catch (\Exception $e) {}
                $item->item_name = $itemName;
                return $item;
            });

        // Obtener localizaciones (con short_name como en crear)
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

        // Obtener categorías de GLPI
        $categories = DB::table('glpi_itilcategories')
            ->select('id', 'name', 'completename')
            ->where('is_incident', 1)
            ->orderBy('completename')
            ->get();

        // Obtener usuarios de Laravel con glpi_user_id para asignar
        // El ID usado es glpi_user_id para compatibilidad con GLPI
        $users = User::where('is_active', 1)
            ->whereNotNull('glpi_user_id')
            ->select('id', 'glpi_user_id', 'username', 'name', 'email')
            ->orderBy('name')
            ->get()
            ->map(fn($user) => [
                'id' => $user->glpi_user_id, // Usar glpi_user_id como ID para GLPI
                'laravel_id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
            ]);

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

        // Obtener archivos adjuntos existentes
        $attachments = [];
        $attachmentPath = storage_path('app/public/ticket-attachments/' . $id);
        if (is_dir($attachmentPath)) {
            $files = scandir($attachmentPath);
            foreach ($files as $file) {
                if ($file !== '.' && $file !== '..') {
                    $attachments[] = [
                        'name' => $file,
                        'url' => asset('storage/ticket-attachments/' . $id . '/' . $file),
                        'size' => filesize($attachmentPath . '/' . $file),
                    ];
                }
            }
        }

        // Obtener solución del caso (si existe)
        $solution = DB::table('glpi_itilsolutions')
            ->select(
                'glpi_itilsolutions.id',
                'glpi_itilsolutions.content',
                'glpi_itilsolutions.date_creation',
                'glpi_itilsolutions.users_id',
                DB::raw("COALESCE(NULLIF(CONCAT(gu.firstname, ' ', gu.realname), ' '), lu.name) as solved_by")
            )
            ->leftJoin('glpi_users as gu', 'glpi_itilsolutions.users_id', '=', 'gu.id')
            ->leftJoin('users as lu', 'glpi_itilsolutions.users_id', '=', 'lu.glpi_user_id')
            ->where('glpi_itilsolutions.itemtype', 'Ticket')
            ->where('glpi_itilsolutions.items_id', $id)
            ->orderBy('glpi_itilsolutions.id', 'desc')
            ->first();

        return Inertia::render('soporte/editar-caso', [
            'ticket' => $ticket,
            'ticketUsers' => $ticketUsers,
            'ticketItems' => $ticketItems,
            'locations' => $locations,
            'categories' => $categories,
            'users' => $users,
            'itemTypes' => $itemTypes,
            'attachments' => $attachments,
            'solution' => $solution,
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
            'requester_id' => 'nullable|integer',
            'observer_ids' => 'nullable|array',
            'observer_ids.*' => 'integer',
            'assigned_ids' => 'nullable|array',
            'assigned_ids.*' => 'integer',
            'items' => 'nullable|array',
            'items.*.type' => 'string',
            'items.*.id' => 'integer',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:102400', // 100MB
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

            // Actualizar solicitante - siempre actualizar
            DB::table('glpi_tickets_users')
                ->where('tickets_id', $id)
                ->where('type', 1)
                ->delete();
            
            if (!empty($validated['requester_id'])) {
                DB::table('glpi_tickets_users')->insert([
                    'tickets_id' => $id,
                    'users_id' => $validated['requester_id'],
                    'type' => 1, // Requester
                    'use_notification' => 1,
                ]);
            }

            // Actualizar observadores - siempre actualizar
            DB::table('glpi_tickets_users')
                ->where('tickets_id', $id)
                ->where('type', 3)
                ->delete();
            
            if (!empty($validated['observer_ids'])) {
                foreach ($validated['observer_ids'] as $observerId) {
                    DB::table('glpi_tickets_users')->insert([
                        'tickets_id' => $id,
                        'users_id' => $observerId,
                        'type' => 3, // Observer
                        'use_notification' => 1,
                    ]);
                }
            }

            // Actualizar asignados - siempre actualizar si el campo viene en la petición
            // Primero eliminar los asignados existentes
            DB::table('glpi_tickets_users')
                ->where('tickets_id', $id)
                ->where('type', 2)
                ->delete();
            
            // Luego agregar los nuevos asignados si hay
            if (!empty($validated['assigned_ids'])) {
                foreach ($validated['assigned_ids'] as $assignedId) {
                    DB::table('glpi_tickets_users')->insert([
                        'tickets_id' => $id,
                        'users_id' => $assignedId,
                        'type' => 2, // Assigned
                        'use_notification' => 1,
                    ]);
                }
            }

            // Actualizar elementos asociados - siempre actualizar
            DB::table('glpi_items_tickets')
                ->where('tickets_id', $id)
                ->delete();
            
            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    DB::table('glpi_items_tickets')->insert([
                        'tickets_id' => $id,
                        'itemtype' => $item['type'],
                        'items_id' => $item['id'],
                    ]);
                }
            }

            // Manejar archivos adjuntos nuevos
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $file->store('ticket-attachments/' . $id, 'public');
                }
            }

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

                // $requester->users_id es glpi_user_id, buscar usuario local por glpi_user_id
                $localRequester = $requester ? User::where('glpi_user_id', $requester->users_id)->first() : null;
                if ($localRequester && $localRequester->id != auth()->id()) {
                    if ($validated['status'] == 5) {
                        Notification::createTicketResolved($localRequester->id, $id, $validated['name']);
                    } elseif ($validated['status'] == 6) {
                        Notification::createTicketClosed($localRequester->id, $id, $validated['name']);
                    } else {
                        Notification::createTicketStatusChange($localRequester->id, $id, $validated['name'], $newStatusName);
                    }
                }

                // Notificar al técnico asignado (si no es quien hace el cambio)
                $assigned = DB::table('glpi_tickets_users as tu')
                    ->where('tu.tickets_id', $id)
                    ->where('tu.type', 2)
                    ->first();

                // $assigned->users_id es glpi_user_id, buscar usuario local por glpi_user_id
                $localAssigned = $assigned ? User::where('glpi_user_id', $assigned->users_id)->first() : null;
                if ($localAssigned && $localAssigned->id != auth()->id() && $localAssigned->id != ($localRequester->id ?? 0)) {
                    Notification::createTicketStatusChange($localAssigned->id, $id, $validated['name'], $newStatusName);
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
            
            // $requester->users_id es glpi_user_id, buscar usuario local por glpi_user_id
            $localUser = $requester ? User::where('glpi_user_id', $requester->users_id)->first() : null;
            if ($localUser && $localUser->id != auth()->id()) {
                Notification::createTicketClosed(
                    $localUser->id,
                    $id,
                    $ticket->name
                );
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

            // Verificar si el técnico es el creador (requester) o el asignado
            $requesterUserId = DB::table('glpi_tickets_users as tu')
                ->leftJoin('users as lu', 'tu.users_id', '=', 'lu.glpi_user_id')
                ->where('tu.tickets_id', $id)
                ->where('tu.type', 1) // Requester/Creator
                ->value('lu.id');

            $assignedUserId = DB::table('glpi_tickets_users as tu')
                ->leftJoin('users as lu', 'tu.users_id', '=', 'lu.glpi_user_id')
                ->where('tu.tickets_id', $id)
                ->where('tu.type', 2) // Assigned
                ->value('lu.id');

            // También verificar si dio la solución (glpi_itilsolutions)
            $solutionUserId = DB::table('glpi_itilsolutions as sol')
                ->leftJoin('users as lu', 'sol.users_id', '=', 'lu.glpi_user_id')
                ->where('sol.items_id', $id)
                ->where('sol.itemtype', 'Ticket')
                ->orderByDesc('sol.id')
                ->value('lu.id');

            $canDelete = ($requesterUserId == $user->id) || ($assignedUserId == $user->id) || ($solutionUserId == $user->id);

            if (!$canDelete) {
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
