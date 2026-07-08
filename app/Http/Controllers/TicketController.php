<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Notification;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 15), 50000);
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
        $excludeMaintenance = $request->input('exclude_maintenance', '');
        $advancedFilters = $request->input('advanced_filters', '');

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

        // Excluir mantenimientos si el filtro está activo
        if ($excludeMaintenance === '1') {
            $maintenanceCategoryIds = DB::table('glpi_itilcategories')
                ->where(function($q) {
                    $q->where('name', 'LIKE', '%mantenimiento%')
                      ->orWhere('completename', 'LIKE', '%mantenimiento%');
                })
                ->pluck('id')
                ->toArray();
            
            if (!empty($maintenanceCategoryIds)) {
                $query->whereNotIn('t.itilcategories_id', $maintenanceCategoryIds);
            }
            
            // También excluir tickets cuyo título contenga "mantenimiento preventivo" o "mantenimiento"
            $query->where(function($q) {
                $q->where('t.name', 'NOT LIKE', '%mantenimiento preventivo%')
                  ->where('t.name', 'NOT LIKE', '%mantenimiento correctivo%');
            });
        }

        // Aplicar búsqueda si existe
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('t.name', 'LIKE', "%{$search}%")
                  ->orWhere('t.id', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%");
            });
        }

        // Aplicar filtros selectivos
        if ($statusFilter && $statusFilter !== 'all') {
            $query->where('t.status', $statusFilter);
        }
        
        if ($priorityFilter && $priorityFilter !== 'all') {
            $query->where('t.priority', $priorityFilter);
        }
        
        if ($categoryFilter && $categoryFilter !== 'all') {
            // Obtener el name de la categoría seleccionada
            $selectedCategoryName = DB::table('glpi_itilcategories')
                ->where('id', $categoryFilter)
                ->value('name');
            
            if ($selectedCategoryName) {
                // Buscar TODOS los IDs que contengan TODAS las palabras del nombre en el completename
                // Esto unifica "Mantenimiento Preventivo" con "Hardware > Mantenimiento > Preventivo"
                $words = preg_split('/\s+/', trim($selectedCategoryName));
                
                $categoryQuery = DB::table('glpi_itilcategories');
                foreach ($words as $word) {
                    if (strlen($word) > 2) { // Ignorar palabras muy cortas
                        $categoryQuery->where('completename', 'LIKE', '%' . $word . '%');
                    }
                }
                $categoryIds = $categoryQuery->pluck('id')->toArray();
                
                if (!empty($categoryIds)) {
                    $query->whereIn('t.itilcategories_id', $categoryIds);
                } else {
                    $query->where('t.itilcategories_id', $categoryFilter);
                }
            } else {
                $query->where('t.itilcategories_id', $categoryFilter);
            }
        }
        
        if ($assignedFilter && $assignedFilter !== 'all') {
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
            $glpiUserId = $user->glpi_user_id;
            
            if ($glpiUserId) {
                $query->whereExists(function ($q) use ($glpiUserId) {
                    $q->select(DB::raw(1))
                      ->from('glpi_tickets_users')
                      ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                      ->where('glpi_tickets_users.type', 2)
                      ->where('glpi_tickets_users.users_id', $glpiUserId);
                })->where('t.status', '!=', 6);
            } else {
                // Si no tiene glpi_user_id, no mostrar nada
                $query->whereRaw('1 = 0');
            }
        } elseif ($specialFilter === 'my_pending') {
            // Mis casos sin resolver (asignados a mí, pendientes)
            $user = auth()->user();
            $glpiUserId = $user->glpi_user_id;
            
            if ($glpiUserId) {
                $query->whereExists(function ($q) use ($glpiUserId) {
                    $q->select(DB::raw(1))
                      ->from('glpi_tickets_users')
                      ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                      ->where('glpi_tickets_users.type', 2)
                      ->where('glpi_tickets_users.users_id', $glpiUserId);
                })->whereNotIn('t.status', [5, 6]); // Excluir resueltos y cerrados
            } else {
                // Si no tiene glpi_user_id, no mostrar nada
                $query->whereRaw('1 = 0');
            }
        } elseif ($specialFilter === 'my_resolved') {
            // Mis casos resueltos (donde di la solución O donde estaba asignado y están resueltos/cerrados)
            $user = auth()->user();
            $glpiUserId = $user->glpi_user_id;
            
            if ($glpiUserId) {
                $query->whereIn('t.status', [5, 6]) // Solo resueltos y cerrados
                      ->where(function($q) use ($glpiUserId) {
                          // Tickets donde el usuario dio la solución
                          $q->whereExists(function($sub) use ($glpiUserId) {
                              $sub->select(DB::raw(1))
                                  ->from('glpi_itilsolutions')
                                  ->whereColumn('glpi_itilsolutions.items_id', 't.id')
                                  ->where('glpi_itilsolutions.itemtype', 'Ticket')
                                  ->where('glpi_itilsolutions.users_id', $glpiUserId);
                          })
                          // O tickets donde el usuario estaba asignado
                          ->orWhereExists(function($sub) use ($glpiUserId) {
                              $sub->select(DB::raw(1))
                                  ->from('glpi_tickets_users')
                                  ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                                  ->where('glpi_tickets_users.type', 2)
                                  ->where('glpi_tickets_users.users_id', $glpiUserId);
                          });
                      });
            } else {
                // Si no tiene glpi_user_id, no mostrar nada
                $query->whereRaw('1 = 0');
            }
        }

        // ─── Filtros avanzados GLPI-style ───────────────────────────────────
        if ($advancedFilters) {
            $parsedFilters = json_decode($advancedFilters, true);
            if (is_array($parsedFilters) && count($parsedFilters) > 0) {
                $this->applyAdvancedFilters($query, $parsedFilters);
            }
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
                'exclude_maintenance' => $excludeMaintenance,
                'advanced_filters' => $advancedFilters,
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
                'exclude_maintenance' => $excludeMaintenance,
                'advanced_filters' => $advancedFilters,
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
        $excludeMaintenance = $request->input('exclude_maintenance', '');

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

        // Excluir mantenimientos si el filtro está activo
        if ($excludeMaintenance === '1') {
            $maintenanceCategoryIds = DB::table('glpi_itilcategories')
                ->where(function($q) {
                    $q->where('name', 'LIKE', '%mantenimiento%')
                      ->orWhere('completename', 'LIKE', '%mantenimiento%');
                })
                ->pluck('id')
                ->toArray();
            
            if (!empty($maintenanceCategoryIds)) {
                $query->whereNotIn('t.itilcategories_id', $maintenanceCategoryIds);
            }
            
            // También excluir tickets cuyo título contenga "mantenimiento preventivo" o "mantenimiento"
            $query->where(function($q) {
                $q->where('t.name', 'NOT LIKE', '%mantenimiento preventivo%')
                  ->where('t.name', 'NOT LIKE', '%mantenimiento correctivo%');
            });
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('t.name', 'LIKE', "%{$search}%")
                  ->orWhere('t.id', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%");
            });
        }

        if ($statusFilter && $statusFilter !== 'all') {
            $query->where('t.status', $statusFilter);
        }
        if ($priorityFilter && $priorityFilter !== 'all') {
            $query->where('t.priority', $priorityFilter);
        }
        if ($categoryFilter && $categoryFilter !== 'all') {
            // Usar la misma lógica de búsqueda por palabras que en index()
            $selectedCategoryName = DB::table('glpi_itilcategories')
                ->where('id', $categoryFilter)
                ->value('name');
            
            if ($selectedCategoryName) {
                $words = preg_split('/\s+/', trim($selectedCategoryName));
                
                $categoryQuery = DB::table('glpi_itilcategories');
                foreach ($words as $word) {
                    if (strlen($word) > 2) {
                        $categoryQuery->where('completename', 'LIKE', '%' . $word . '%');
                    }
                }
                $categoryIds = $categoryQuery->pluck('id')->toArray();
                
                if (!empty($categoryIds)) {
                    $query->whereIn('t.itilcategories_id', $categoryIds);
                } else {
                    $query->where('t.itilcategories_id', $categoryFilter);
                }
            } else {
                $query->where('t.itilcategories_id', $categoryFilter);
            }
        }
        if ($assignedFilter && $assignedFilter !== 'all') {
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
            $glpiUserId = $user->glpi_user_id;
            
            if ($glpiUserId) {
                $query->whereExists(function ($q) use ($glpiUserId) {
                    $q->select(DB::raw(1))
                      ->from('glpi_tickets_users')
                      ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                      ->where('glpi_tickets_users.type', 2)
                      ->where('glpi_tickets_users.users_id', $glpiUserId);
                })->where('t.status', '!=', 6);
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($specialFilter === 'my_pending') {
            $user = auth()->user();
            $glpiUserId = $user->glpi_user_id;
            
            if ($glpiUserId) {
                $query->whereExists(function ($q) use ($glpiUserId) {
                    $q->select(DB::raw(1))
                      ->from('glpi_tickets_users')
                      ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                      ->where('glpi_tickets_users.type', 2)
                      ->where('glpi_tickets_users.users_id', $glpiUserId);
                })->whereNotIn('t.status', [5, 6]);
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($specialFilter === 'my_resolved') {
            $user = auth()->user();
            $glpiUserId = $user->glpi_user_id;
            
            if ($glpiUserId) {
                $query->whereIn('t.status', [5, 6])
                      ->where(function($q) use ($glpiUserId) {
                          $q->whereExists(function($sub) use ($glpiUserId) {
                              $sub->select(DB::raw(1))
                                  ->from('glpi_itilsolutions')
                                  ->whereColumn('glpi_itilsolutions.items_id', 't.id')
                                  ->where('glpi_itilsolutions.itemtype', 'Ticket')
                                  ->where('glpi_itilsolutions.users_id', $glpiUserId);
                          })
                          ->orWhereExists(function($sub) use ($glpiUserId) {
                              $sub->select(DB::raw(1))
                                  ->from('glpi_tickets_users')
                                  ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                                  ->where('glpi_tickets_users.type', 2)
                                  ->where('glpi_tickets_users.users_id', $glpiUserId);
                          });
                      });
            } else {
                $query->whereRaw('1 = 0');
            }
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

    /**
     * Exporta a Excel (una sola tabla) el inventario de computadores OPERATIVOS de
     * las sedes HUV y Cartago, mostrando en la fila de cada ECOM sus casos de
     * Mantenimiento Preventivo y Repotenciación/Actualización del periodo.
     * Rango por defecto: 1 de enero del año actual → hoy.
     */
    public function exportMantenimiento(Request $request)
    {
        $dateFrom = $request->input('date_from') ?: date('Y') . '-01-01';
        $dateTo = $request->input('date_to') ?: date('Y-m-d');

        // ── 1) Inventario: computadores OPERATIVOS de HUV y Cartago ──
        // "Operativos" = estado en operación (nombre contiene "Operac").
        // HUV/Cartago se resuelve por entidad O por ubicación (sede), para que
        // funcione sin importar cómo esté modelado en cada servidor.
        $computers = DB::table('glpi_computers as c')
            ->leftJoin('glpi_entities as e', 'c.entities_id', '=', 'e.id')
            ->leftJoin('glpi_computertypes as tp', 'c.computertypes_id', '=', 'tp.id')
            ->leftJoin('glpi_computermodels as cm', 'c.computermodels_id', '=', 'cm.id')
            ->leftJoin('glpi_states as s', 'c.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as m', 'c.manufacturers_id', '=', 'm.id')
            ->leftJoin('glpi_locations as l', 'c.locations_id', '=', 'l.id')
            ->where('c.is_deleted', 0)
            ->where('s.name', 'LIKE', '%perac%') // operativos (Operación)
            ->where(function ($q) {
                $q->where('e.completename', 'LIKE', 'HUV%')
                    ->orWhere('e.completename', 'LIKE', '%CARTAGO%')
                    ->orWhere('e.name', 'LIKE', '%CARTAGO%')
                    ->orWhere('l.completename', 'LIKE', '%Cartago%')
                    ->orWhere('l.completename', 'LIKE', '%HUV%');
            })
            // Excluir AGESOC (por ubicación o por entidad): no va en este reporte
            ->where(function ($q) {
                $q->whereNull('l.completename')->orWhere('l.completename', 'NOT LIKE', '%Agesoc%');
            })
            ->where(function ($q) {
                $q->whereNull('e.completename')->orWhere('e.completename', 'NOT LIKE', '%AGESOC%');
            })
            ->select(
                'c.id',
                'c.name as ecom',
                'c.serial',
                's.name as estado',
                'tp.name as tipo',
                'm.name as fabricante',
                'cm.name as modelo',
                'e.name as entidad',
                'l.completename as ubicacion',
                'c.date_creation',
                'c.date_mod'
            )
            ->orderBy('c.name')
            ->get();

        // ── 2) Casos de Mant. Preventivo / Repotenciación del periodo, por computador ──
        $computerIds = $computers->pluck('id')->all();
        $casesByComputer = [];
        if (!empty($computerIds)) {
            $cases = DB::table('glpi_tickets as t')
                ->join('glpi_items_tickets as it', function ($j) {
                    $j->on('it.tickets_id', '=', 't.id')->where('it.itemtype', '=', 'Computer');
                })
                ->join('glpi_itilcategories as cat', 'cat.id', '=', 't.itilcategories_id')
                ->where('t.is_deleted', 0)
                ->whereIn('it.items_id', $computerIds)
                ->whereDate('t.date', '>=', $dateFrom)
                ->whereDate('t.date', '<=', $dateTo)
                ->where(function ($q) {
                    $q->where('cat.completename', 'LIKE', '%Mantenimiento > Preventivo%')
                        ->orWhere('cat.completename', '=', 'Mantenimiento Preventivo')
                        ->orWhere('cat.completename', 'LIKE', '%Repotenciar Equipo%');
                })
                ->select('it.items_id as computer_id', 't.id as caso', 't.date as fecha', 'cat.completename as categoria', 't.name as titulo')
                ->selectRaw("(SELECT sol.content FROM glpi_itilsolutions sol WHERE sol.items_id = t.id AND sol.itemtype = 'Ticket' ORDER BY sol.id DESC LIMIT 1) as solucion")
                ->selectRaw("(SELECT TRIM(CONCAT(COALESCE(u.realname,''),' ',COALESCE(u.firstname,''))) FROM glpi_tickets_users tu JOIN glpi_users u ON u.id = tu.users_id WHERE tu.tickets_id = t.id AND tu.type = 2 LIMIT 1) as tecnico")
                ->orderBy('t.date')
                ->get();
            foreach ($cases as $cs) {
                $casesByComputer[$cs->computer_id][] = $cs;
            }
        }
        $totalCasos = array_sum(array_map('count', $casesByComputer));

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Inventario y Mantenimientos');

        $spreadsheet->getProperties()
            ->setCreator('HelpDesk HUV')
            ->setTitle('Inventario HUV/Cartago con mantenimiento y repotenciación')
            ->setSubject('Inventario de computadores operativos con sus mantenimientos y repotenciaciones');

        // Título
        $sheet->setCellValue('A1', 'HOSPITAL UNIVERSITARIO DEL VALLE - HelpDesk');
        $sheet->setCellValue('A2', 'Inventario de computadores operativos (HUV y Cartago) con Mantenimiento Preventivo y Repotenciación');
        $sheet->setCellValue('A3', 'Periodo mantenimientos: ' . date('d/m/Y', strtotime($dateFrom)) . ' a ' . date('d/m/Y', strtotime($dateTo)) . '   |   Equipos: ' . count($computers) . '   |   Casos: ' . $totalCasos);
        $sheet->mergeCells('A1:M1');
        $sheet->mergeCells('A2:M2');
        $sheet->mergeCells('A3:M3');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(11);
        $sheet->getStyle('A3')->getFont()->setSize(10)->getColor()->setRGB('555555');

        // Encabezados (una sola tabla: inventario + mantenimiento en la misma fila)
        $headerRow = 5;
        $headers = ['ECOM', 'N° Serie', 'Estado', 'Tipo', 'Fabricante', 'Modelo', 'Entidad', 'Localización', 'Mant. Preventivo', 'Repotenciación / Actualización', 'Técnico(s)', 'Fecha de registro', 'Últ. actualización'];
        $col = 'A';
        foreach ($headers as $h) {
            $sheet->setCellValue("{$col}{$headerRow}", $h);
            $col++;
        }
        $sheet->getStyle("A{$headerRow}:M{$headerRow}")->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '1F4E79']],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
        ]);

        // Datos: una fila por computador, con su mantenimiento/repotenciación
        $r = $headerRow + 1;
        foreach ($computers as $c) {
            $list = $casesByComputer[$c->id] ?? [];
            $mantParts = [];
            $repotParts = [];
            $tecnicos = [];
            foreach ($list as $cs) {
                $fecha = $cs->fecha ? date('d/m/Y', strtotime($cs->fecha)) : '';
                // Limpiar HTML/espacios del título y de la solución (lo que se hizo)
                $titulo = trim(preg_replace('/\s+/', ' ', strip_tags(html_entity_decode((string) ($cs->titulo ?? ''), ENT_QUOTES | ENT_HTML5))));
                $solucion = trim(preg_replace('/\s+/', ' ', strip_tags(html_entity_decode((string) ($cs->solucion ?? ''), ENT_QUOTES | ENT_HTML5))));
                if (mb_strlen($solucion) > 600) {
                    $solucion = mb_substr($solucion, 0, 600) . '…';
                }
                $partes = ['#' . $cs->caso . ($fecha ? " ({$fecha})" : '')];
                if ($titulo !== '') {
                    $partes[] = $titulo;
                }
                if ($solucion !== '') {
                    $partes[] = 'Solución: ' . $solucion;
                }
                $etiqueta = implode("\n", $partes);
                if (stripos($cs->categoria, 'Repotenciar') !== false) {
                    $repotParts[] = $etiqueta;
                } else {
                    $mantParts[] = $etiqueta;
                }
                if (!empty($cs->tecnico)) {
                    $tecnicos[$cs->tecnico] = true;
                }
            }

            $sheet->setCellValueExplicit("A{$r}", (string) $c->ecom, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("B{$r}", (string) $c->serial, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->setCellValue("C{$r}", $c->estado ?: '—');
            $sheet->setCellValue("D{$r}", $c->tipo ?: '—');
            $sheet->setCellValue("E{$r}", $c->fabricante ?: '—');
            $sheet->setCellValue("F{$r}", $c->modelo ?: '—');
            $sheet->setCellValue("G{$r}", $c->entidad ?: '—');
            $sheet->setCellValue("H{$r}", $c->ubicacion ?: '—');
            $sheet->setCellValue("I{$r}", !empty($mantParts) ? implode("\n\n", $mantParts) : 'No');
            $sheet->setCellValue("J{$r}", !empty($repotParts) ? implode("\n\n", $repotParts) : 'No');
            $sheet->setCellValue("K{$r}", !empty($tecnicos) ? implode("\n", array_keys($tecnicos)) : '—');
            $sheet->setCellValue("L{$r}", $c->date_creation ? date('d/m/Y', strtotime($c->date_creation)) : '—');
            $sheet->setCellValue("M{$r}", $c->date_mod ? date('d/m/Y H:i', strtotime($c->date_mod)) : '—');

            // Color de fila según intervención
            if (!empty($repotParts)) {
                $fillColor = 'FCE4D6'; // repotenciación → naranja claro
            } elseif (!empty($mantParts)) {
                $fillColor = 'E2EFDA'; // solo preventivo → verde claro
            } else {
                $fillColor = 'FFFFFF'; // sin intervención en el periodo
            }
            $sheet->getStyle("A{$r}:M{$r}")->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB($fillColor);
            $sheet->getStyle("I{$r}:K{$r}")->getAlignment()
                ->setWrapText(true)
                ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_TOP);
            $r++;
        }
        $lastRow = max($r - 1, $headerRow);

        // Bordes
        $sheet->getStyle("A{$headerRow}:M{$lastRow}")->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => 'BFBFBF']]],
        ]);
        if ($lastRow > $headerRow) {
            $sheet->getStyle("A6:A{$lastRow}")->getFont()->setBold(true);
        }

        // Anchos de columna
        $widths = ['A' => 13, 'B' => 18, 'C' => 13, 'D' => 16, 'E' => 18, 'F' => 24, 'G' => 18, 'H' => 30, 'I' => 50, 'J' => 55, 'K' => 24, 'L' => 15, 'M' => 17];
        foreach ($widths as $cc => $w) {
            $sheet->getColumnDimension($cc)->setWidth($w);
        }

        // Filtros automáticos y encabezado congelado
        if ($lastRow > $headerRow) {
            $sheet->setAutoFilter("A{$headerRow}:M{$lastRow}");
        }
        $sheet->freezePane('A' . ($headerRow + 1));

        $filename = 'Inventario_Mantenimiento_HUV_Cartago_' . date('Y-m-d_His') . '.xlsx';
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_mant_');
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

    /**
     * Crear una nueva categoría ITIL desde el formulario de creación de casos.
     *
     * Devuelve JSON con la categoría creada (o la existente si ya estaba) para que el
     * frontend la agregue a la lista y la seleccione sin recargar la página.
     *
     * Sigue el mismo patrón "column-safe" de la migración de categorías de Redes:
     * solo inserta en columnas que existan realmente en glpi_itilcategories, para
     * mantener compatibilidad con distintas versiones del esquema de GLPI.
     */
    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|integer',
        ]);

        $name = trim($validated['name']);

        if ($name === '') {
            return response()->json([
                'success' => false,
                'message' => 'El nombre de la categoría no puede estar vacío.',
            ], 422);
        }

        // Resolver la categoría padre (si se indicó) para construir completename y nivel
        $parent = null;
        if (!empty($validated['parent_id'])) {
            $parent = DB::table('glpi_itilcategories')
                ->where('id', $validated['parent_id'])
                ->first();

            if (!$parent) {
                return response()->json([
                    'success' => false,
                    'message' => 'La categoría padre seleccionada no existe.',
                ], 422);
            }
        }

        // completename es la ruta jerárquica completa separada por " > "
        $completename = $parent
            ? trim($parent->completename) . ' > ' . $name
            : $name;

        // Evitar duplicados: si ya existe una categoría con el mismo completename,
        // devolverla para que el frontend simplemente la seleccione.
        $existing = DB::table('glpi_itilcategories')
            ->where('completename', $completename)
            ->orderBy('id')
            ->first();

        if ($existing) {
            return response()->json([
                'success' => true,
                'existed' => true,
                'message' => 'La categoría ya existía y fue seleccionada.',
                'category' => [
                    'id' => $existing->id,
                    'name' => $existing->name,
                    'completename' => $existing->completename,
                ],
            ]);
        }

        // Insertar respetando solo las columnas que existen en la tabla (compat. GLPI)
        $columns = collect(DB::select('SHOW COLUMNS FROM glpi_itilcategories'))
            ->pluck('Field')
            ->toArray();

        $data = [
            'entities_id' => $parent->entities_id ?? 0,
            'is_recursive' => 1,
            'itilcategories_id' => $parent->id ?? 0,
            'name' => $name,
            'completename' => $completename,
            'is_helpdeskvisible' => 1,
            'is_incident' => 1,  // requerido para que aparezca en el selector de crear-caso
            'is_request' => 1,
            'is_problem' => 1,
            'is_change' => 0,
            'date_mod' => now(),
        ];

        // Nivel jerárquico: raíz = 1, hijo = nivel del padre + 1
        if (in_array('level', $columns)) {
            $data['level'] = ($parent->level ?? 0) + 1;
        }
        if (in_array('tickettemplates_id_incident', $columns)) {
            $data['tickettemplates_id_incident'] = 0;
        }
        if (in_array('tickettemplates_id_demand', $columns)) {
            $data['tickettemplates_id_demand'] = 0;
        }
        if (in_array('date_creation', $columns)) {
            $data['date_creation'] = now();
        }

        try {
            $newId = DB::table('glpi_itilcategories')->insertGetId($data);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudo crear la categoría. Es posible que ya exista una con ese nombre.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'existed' => false,
            'message' => 'Categoría creada correctamente.',
            'category' => [
                'id' => $newId,
                'name' => $name,
                'completename' => $completename,
            ],
        ], 201);
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

            return redirect()->route('soporte.crear-caso')->with('success', 'Caso creado exitosamente');

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

        // Obtener categorías de GLPI (agrupadas por name para unificar duplicados)
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
                // El frontend envía glpi_user_id directamente
                DB::table('glpi_tickets_users')->insert([
                    'tickets_id' => $id,
                    'users_id' => $validated['requester_id'], // Ya es glpi_user_id
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
                    // El frontend envía glpi_user_id directamente
                    DB::table('glpi_tickets_users')->insert([
                        'tickets_id' => $id,
                        'users_id' => $observerId, // Ya es glpi_user_id
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
                    // El frontend envía glpi_user_id directamente, insertarlo tal cual
                    DB::table('glpi_tickets_users')->insert([
                        'tickets_id' => $id,
                        'users_id' => $assignedId, // Ya es glpi_user_id del frontend
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

    // ═══════════════════════════════════════════════════════════════════════════
    // Filtros Avanzados GLPI-style
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Aplica un conjunto de filtros avanzados a la query.
     * Los filtros se agrupan por conector OR: (F1 AND F2) OR (F3 AND F4)
     */
    private function applyAdvancedFilters($query, array $filters): void
    {
        // Agrupar filtros: cada vez que aparece un conector OR, se crea un nuevo grupo
        $groups = [[]];
        $currentGroup = 0;

        foreach ($filters as $i => $filter) {
            if ($i > 0 && ($filter['connector'] ?? 'AND') === 'OR') {
                $currentGroup++;
                $groups[$currentGroup] = [];
            }
            $groups[$currentGroup][] = $filter;
        }

        $query->where(function ($outerQuery) use ($groups) {
            foreach ($groups as $i => $group) {
                $method = $i === 0 ? 'where' : 'orWhere';
                $outerQuery->$method(function ($q) use ($group) {
                    foreach ($group as $filter) {
                        $this->applyAdvancedFilter($q, $filter);
                    }
                });
            }
        });
    }

    /**
     * Aplica un filtro individual a la query.
     */
    private function applyAdvancedFilter($query, array $filter): void
    {
        $field = $filter['field'] ?? '';
        $operator = $filter['operator'] ?? 'contiene';
        $value = $filter['value'] ?? '';

        switch ($field) {
            case 'id':
                $this->applyNumberFilter($query, 't.id', $operator, $value);
                break;

            case 'titulo':
                $this->applyTextFilter($query, 't.name', $operator, $value);
                break;

            case 'descripcion':
                $this->applyTextFilter($query, 't.content', $operator, $value);
                break;

            case 'estado':
                // Valores especiales compuestos
                if ($value === 'not_resolved') {
                    if ($operator === 'es') {
                        $query->whereNotIn('t.status', [5, 6]);
                    } else {
                        $query->whereIn('t.status', [5, 6]);
                    }
                } elseif ($value === 'not_closed') {
                    if ($operator === 'es') {
                        $query->where('t.status', '!=', 6);
                    } else {
                        $query->where('t.status', '=', 6);
                    }
                } else {
                    $this->applyNumberFilter($query, 't.status', $operator, $value);
                }
                break;

            case 'urgencia':
                $this->applyNumberFilter($query, 't.urgency', $operator, $value);
                break;

            case 'impacto':
                $this->applyNumberFilter($query, 't.impact', $operator, $value);
                break;

            case 'prioridad':
                $this->applyNumberFilter($query, 't.priority', $operator, $value);
                break;

            case 'fecha_apertura':
                $this->applyDateFilter($query, 't.date', $operator, $value);
                break;

            case 'fecha_cierre':
                $this->applyDateFilter($query, 't.closedate', $operator, $value);
                break;

            case 'fecha_solucion':
                $this->applyDateFilter($query, 't.solvedate', $operator, $value);
                break;

            case 'ultima_actualizacion':
                $this->applyDateFilter($query, 't.date_mod', $operator, $value);
                break;

            case 'categoria':
                $this->applyTextFilter($query, 'cat.completename', $operator, $value);
                break;

            case 'entidad':
                $this->applyTextFilter($query, 'e.name', $operator, $value);
                break;

            case 'tipo':
                $this->applyNumberFilter($query, 't.type', $operator, $value);
                break;

            case 'solicitante':
                $this->applySubqueryTextFilter($query, 'requester', $operator, $value);
                break;

            case 'tecnico':
                $this->applySubqueryTextFilter($query, 'assigned', $operator, $value);
                break;

            case 'autor':
                // El autor/creador del ticket
                $this->applySubqueryTextFilter($query, 'author', $operator, $value);
                break;

            case 'grupo_tecnicos':
                $this->applySubqueryTextFilter($query, 'assigned_group', $operator, $value);
                break;

            case 'elementos_mostrados':
                $this->applyMultiColumnFilter($query, $operator, $value);
                break;

            case 'fuente_solicitante':
                $this->applyTextFilter($query, 'rt.name', $operator, $value);
                // Si no hay join de requesttypes, lo agregamos
                break;

            case 'solucion':
                $this->applySolutionFilter($query, $operator, $value);
                break;

            // Campos de fecha adicionales
            case 'fecha_creacion':
                $this->applyDateFilter($query, 't.date_creation', $operator, $value);
                break;

            // Campos que no están directamente implementados se ignoran silenciosamente
            default:
                break;
        }
    }

    /**
     * Filtro de texto: contiene, no contiene, es, no es, empieza con, termina con, vacío, no vacío
     */
    private function applyTextFilter($query, string $column, string $operator, string $value): void
    {
        switch ($operator) {
            case 'contiene':
                $query->where($column, 'LIKE', "%{$value}%");
                break;
            case 'no_contiene':
                $query->where(function($q) use ($column, $value) {
                    $q->where($column, 'NOT LIKE', "%{$value}%")
                      ->orWhereNull($column);
                });
                break;
            case 'es':
                $query->where($column, '=', $value);
                break;
            case 'no_es':
                $query->where($column, '!=', $value);
                break;
            case 'empieza_con':
                $query->where($column, 'LIKE', "{$value}%");
                break;
            case 'termina_con':
                $query->where($column, 'LIKE', "%{$value}");
                break;
            case 'vacio':
                $query->where(function($q) use ($column) {
                    $q->whereNull($column)->orWhere($column, '=', '');
                });
                break;
            case 'no_vacio':
                $query->whereNotNull($column)->where($column, '!=', '');
                break;
        }
    }

    /**
     * Filtro numérico: es, no es, contiene, mayor que, menor que
     */
    private function applyNumberFilter($query, string $column, string $operator, string $value): void
    {
        switch ($operator) {
            case 'es':
                $query->where($column, '=', $value);
                break;
            case 'no_es':
                $query->where($column, '!=', $value);
                break;
            case 'contiene':
                $query->where(DB::raw("CAST({$column} AS CHAR)"), 'LIKE', "%{$value}%");
                break;
            case 'mayor_que':
                $query->where($column, '>', $value);
                break;
            case 'menor_que':
                $query->where($column, '<', $value);
                break;
        }
    }

    /**
     * Filtro de fecha: es, no es, antes, después, contiene
     * Resuelve presets de fecha como 'now', 'today', '-1h', '-3d', etc.
     */
    private function applyDateFilter($query, string $column, string $operator, string $value): void
    {
        // Para "contiene", buscar como texto
        if ($operator === 'contiene') {
            $query->where(DB::raw("CAST({$column} AS CHAR)"), 'LIKE', "%{$value}%");
            return;
        }

        $resolvedDate = $this->resolveDateValue($value);
        if (!$resolvedDate) return;

        // Determinar si es solo fecha (sin hora) para comparar por día
        $isDateOnly = strlen($resolvedDate) === 10;

        switch ($operator) {
            case 'es':
                if ($isDateOnly) {
                    $query->whereDate($column, '=', $resolvedDate);
                } else {
                    // Para fechas con hora, comparar en un rango de ±30 segundos
                    $query->where($column, '>=', Carbon::parse($resolvedDate)->subSeconds(30))
                          ->where($column, '<=', Carbon::parse($resolvedDate)->addSeconds(30));
                }
                break;
            case 'no_es':
                if ($isDateOnly) {
                    $query->whereDate($column, '!=', $resolvedDate);
                } else {
                    $query->where(function($q) use ($column, $resolvedDate) {
                        $q->where($column, '<', Carbon::parse($resolvedDate)->subSeconds(30))
                          ->orWhere($column, '>', Carbon::parse($resolvedDate)->addSeconds(30));
                    });
                }
                break;
            case 'antes':
                if ($isDateOnly) {
                    $query->whereDate($column, '<', $resolvedDate);
                } else {
                    $query->where($column, '<', $resolvedDate);
                }
                break;
            case 'despues':
                if ($isDateOnly) {
                    $query->whereDate($column, '>', $resolvedDate);
                } else {
                    $query->where($column, '>', $resolvedDate);
                }
                break;
        }
    }

    /**
     * Resuelve un preset de fecha a un valor datetime string.
     */
    private function resolveDateValue(string $preset): ?string
    {
        $now = Carbon::now();

        // Fecha específica: "specific:2024-01-15T10:30"
        if (str_starts_with($preset, 'specific:')) {
            $dateStr = substr($preset, 9);
            try {
                return Carbon::parse($dateStr)->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                return null;
            }
        }

        switch ($preset) {
            case 'now':
                return $now->format('Y-m-d H:i:s');
            case 'today':
                return $now->format('Y-m-d');
        }

        // Horas: -1h a -24h
        if (preg_match('/^-(\d+)h$/', $preset, $m)) {
            return $now->subHours((int)$m[1])->format('Y-m-d H:i:s');
        }

        // Días: -1d a -7d
        if (preg_match('/^-(\d+)d$/', $preset, $m)) {
            return $now->subDays((int)$m[1])->format('Y-m-d');
        }

        // Nombres de días: day_lunes, day_martes, etc.
        if (str_starts_with($preset, 'day_')) {
            $dayName = substr($preset, 4);
            $dayMap = [
                'domingo' => Carbon::SUNDAY,
                'lunes' => Carbon::MONDAY,
                'martes' => Carbon::TUESDAY,
                'miércoles' => Carbon::WEDNESDAY,
                'jueves' => Carbon::THURSDAY,
                'viernes' => Carbon::FRIDAY,
                'sábado' => Carbon::SATURDAY,
            ];
            $dayNum = $dayMap[$dayName] ?? null;
            if ($dayNum !== null) {
                // Último día de la semana con ese nombre
                $date = $now->copy();
                while ($date->dayOfWeek !== $dayNum) {
                    $date->subDay();
                }
                return $date->format('Y-m-d');
            }
        }

        // Semanas: -1w a -10w
        if (preg_match('/^-(\d+)w$/', $preset, $m)) {
            return $now->subWeeks((int)$m[1])->format('Y-m-d');
        }

        // Inicio del mes
        if ($preset === 'start_of_month') {
            return $now->startOfMonth()->format('Y-m-d');
        }

        // Meses: -1m a -12m
        if (preg_match('/^-(\d+)m$/', $preset, $m)) {
            return $now->subMonths((int)$m[1])->format('Y-m-d');
        }

        // Inicio de año
        if ($preset === 'start_of_year') {
            return $now->startOfYear()->format('Y-m-d');
        }

        // Años: -1y a -10y
        if (preg_match('/^-(\d+)y$/', $preset, $m)) {
            return $now->subYears((int)$m[1])->format('Y-m-d');
        }

        return null;
    }

    /**
     * Filtro de subconsulta para campos de personas (solicitante, técnico, autor, grupo).
     */
    private function applySubqueryTextFilter($query, string $personType, string $operator, string $value): void
    {
        switch ($personType) {
            case 'requester':
                // Buscar en glpi_tickets_users type=1 → glpi_users
                $this->applyPersonSubquery($query, 1, $operator, $value);
                break;
            case 'assigned':
                // Buscar en glpi_tickets_users type=2 → glpi_users O en glpi_itilsolutions
                $this->applyAssignedSubquery($query, $operator, $value);
                break;
            case 'author':
                // El creador del ticket: users_id_recipient → glpi_users
                $this->applyAuthorSubquery($query, $operator, $value);
                break;
            case 'assigned_group':
                $this->applyGroupSubquery($query, $operator, $value);
                break;
        }
    }

    private function applyPersonSubquery($query, int $type, string $operator, string $value): void
    {
        $likeValue = "%{$value}%";

        $condition = function ($sub) use ($type, $operator, $value, $likeValue) {
            $sub->select(DB::raw(1))
                ->from('glpi_tickets_users as tu_filter')
                ->join('glpi_users as gu_filter', 'tu_filter.users_id', '=', 'gu_filter.id')
                ->whereColumn('tu_filter.tickets_id', 't.id')
                ->where('tu_filter.type', $type);

            switch ($operator) {
                case 'contiene':
                    $sub->where(DB::raw("CONCAT(gu_filter.firstname, ' ', gu_filter.realname)"), 'LIKE', $likeValue);
                    break;
                case 'no_contiene':
                    $sub->where(DB::raw("CONCAT(gu_filter.firstname, ' ', gu_filter.realname)"), 'NOT LIKE', $likeValue);
                    break;
                case 'es':
                    $sub->where(DB::raw("CONCAT(gu_filter.firstname, ' ', gu_filter.realname)"), '=', $value);
                    break;
                case 'no_es':
                    $sub->where(DB::raw("CONCAT(gu_filter.firstname, ' ', gu_filter.realname)"), '!=', $value);
                    break;
                case 'empieza_con':
                    $sub->where(DB::raw("CONCAT(gu_filter.firstname, ' ', gu_filter.realname)"), 'LIKE', "{$value}%");
                    break;
                case 'termina_con':
                    $sub->where(DB::raw("CONCAT(gu_filter.firstname, ' ', gu_filter.realname)"), 'LIKE', "%{$value}");
                    break;
            }
        };

        if ($operator === 'vacio') {
            $query->whereNotExists(function ($sub) use ($type) {
                $sub->select(DB::raw(1))
                    ->from('glpi_tickets_users as tu_filter')
                    ->whereColumn('tu_filter.tickets_id', 't.id')
                    ->where('tu_filter.type', $type);
            });
        } elseif ($operator === 'no_vacio') {
            $query->whereExists(function ($sub) use ($type) {
                $sub->select(DB::raw(1))
                    ->from('glpi_tickets_users as tu_filter')
                    ->whereColumn('tu_filter.tickets_id', 't.id')
                    ->where('tu_filter.type', $type);
            });
        } elseif ($operator === 'no_contiene' || $operator === 'no_es') {
            $query->whereNotExists($condition);
        } else {
            $query->whereExists($condition);
        }
    }

    private function applyAssignedSubquery($query, string $operator, string $value): void
    {
        $likeValue = "%{$value}%";

        if ($operator === 'vacio') {
            // Sin técnico asignado ni solución
            $query->whereNotExists(function ($sub) {
                $sub->select(DB::raw(1))
                    ->from('glpi_tickets_users as tu_filter')
                    ->whereColumn('tu_filter.tickets_id', 't.id')
                    ->where('tu_filter.type', 2);
            })->whereNotExists(function ($sub) {
                $sub->select(DB::raw(1))
                    ->from('glpi_itilsolutions as sol_filter')
                    ->whereColumn('sol_filter.items_id', 't.id')
                    ->where('sol_filter.itemtype', 'Ticket');
            });
            return;
        }

        if ($operator === 'no_vacio') {
            $query->where(function ($q) {
                $q->whereExists(function ($sub) {
                    $sub->select(DB::raw(1))
                        ->from('glpi_tickets_users as tu_filter')
                        ->whereColumn('tu_filter.tickets_id', 't.id')
                        ->where('tu_filter.type', 2);
                })->orWhereExists(function ($sub) {
                    $sub->select(DB::raw(1))
                        ->from('glpi_itilsolutions as sol_filter')
                        ->whereColumn('sol_filter.items_id', 't.id')
                        ->where('sol_filter.itemtype', 'Ticket');
                });
            });
            return;
        }

        // Buscar en asignado O en quien dio la solución
        $isNegative = in_array($operator, ['no_contiene', 'no_es']);

        if ($isNegative) {
            // NOT EXISTS para ambas fuentes
            $query->whereNotExists(function ($sub) use ($value, $operator, $likeValue) {
                $sub->select(DB::raw(1))
                    ->from('glpi_tickets_users as tu_filter')
                    ->join('glpi_users as gu_filter', 'tu_filter.users_id', '=', 'gu_filter.id')
                    ->whereColumn('tu_filter.tickets_id', 't.id')
                    ->where('tu_filter.type', 2);
                $this->applyNameCondition($sub, $operator === 'no_contiene' ? 'contiene' : 'es', $value, $likeValue);
            })->whereNotExists(function ($sub) use ($value, $operator, $likeValue) {
                $sub->select(DB::raw(1))
                    ->from('glpi_itilsolutions as sol_filter')
                    ->join('glpi_users as gu_filter', 'sol_filter.users_id', '=', 'gu_filter.id')
                    ->whereColumn('sol_filter.items_id', 't.id')
                    ->where('sol_filter.itemtype', 'Ticket');
                $this->applyNameCondition($sub, $operator === 'no_contiene' ? 'contiene' : 'es', $value, $likeValue);
            });
        } else {
            $query->where(function ($q) use ($value, $operator, $likeValue) {
                $q->whereExists(function ($sub) use ($value, $operator, $likeValue) {
                    $sub->select(DB::raw(1))
                        ->from('glpi_tickets_users as tu_filter')
                        ->join('glpi_users as gu_filter', 'tu_filter.users_id', '=', 'gu_filter.id')
                        ->whereColumn('tu_filter.tickets_id', 't.id')
                        ->where('tu_filter.type', 2);
                    $this->applyNameCondition($sub, $operator, $value, $likeValue);
                })->orWhereExists(function ($sub) use ($value, $operator, $likeValue) {
                    $sub->select(DB::raw(1))
                        ->from('glpi_itilsolutions as sol_filter')
                        ->join('glpi_users as gu_filter', 'sol_filter.users_id', '=', 'gu_filter.id')
                        ->whereColumn('sol_filter.items_id', 't.id')
                        ->where('sol_filter.itemtype', 'Ticket');
                    $this->applyNameCondition($sub, $operator, $value, $likeValue);
                });
            });
        }
    }

    private function applyNameCondition($sub, string $operator, string $value, string $likeValue): void
    {
        $fullName = DB::raw("CONCAT(gu_filter.firstname, ' ', gu_filter.realname)");
        switch ($operator) {
            case 'contiene':
                $sub->where($fullName, 'LIKE', $likeValue);
                break;
            case 'es':
                $sub->where($fullName, '=', $value);
                break;
            case 'empieza_con':
                $sub->where($fullName, 'LIKE', "{$value}%");
                break;
            case 'termina_con':
                $sub->where($fullName, 'LIKE', "%{$value}");
                break;
        }
    }

    private function applyAuthorSubquery($query, string $operator, string $value): void
    {
        $likeValue = "%{$value}%";
        $fullName = DB::raw("CONCAT(gu_author.firstname, ' ', gu_author.realname)");

        if ($operator === 'vacio') {
            $query->whereNull('t.users_id_recipient');
            return;
        }
        if ($operator === 'no_vacio') {
            $query->whereNotNull('t.users_id_recipient')->where('t.users_id_recipient', '>', 0);
            return;
        }

        // Join con glpi_users para buscar por nombre del autor
        $isNegative = in_array($operator, ['no_contiene', 'no_es']);
        $subCondition = function ($sub) use ($operator, $value, $likeValue, $fullName) {
            $sub->select(DB::raw(1))
                ->from('glpi_users as gu_author')
                ->whereColumn('gu_author.id', 't.users_id_recipient');
            switch ($operator) {
                case 'contiene': case 'no_contiene':
                    $sub->where($fullName, 'LIKE', $likeValue);
                    break;
                case 'es': case 'no_es':
                    $sub->where($fullName, '=', $value);
                    break;
                case 'empieza_con':
                    $sub->where($fullName, 'LIKE', "{$value}%");
                    break;
                case 'termina_con':
                    $sub->where($fullName, 'LIKE', "%{$value}");
                    break;
            }
        };

        if ($isNegative) {
            $query->whereNotExists($subCondition);
        } else {
            $query->whereExists($subCondition);
        }
    }

    private function applyGroupSubquery($query, string $operator, string $value): void
    {
        $likeValue = "%{$value}%";

        if ($operator === 'vacio') {
            $query->whereNotExists(function ($sub) {
                $sub->select(DB::raw(1))
                    ->from('glpi_groups_tickets as gt_filter')
                    ->whereColumn('gt_filter.tickets_id', 't.id')
                    ->where('gt_filter.type', 2);
            });
            return;
        }
        if ($operator === 'no_vacio') {
            $query->whereExists(function ($sub) {
                $sub->select(DB::raw(1))
                    ->from('glpi_groups_tickets as gt_filter')
                    ->whereColumn('gt_filter.tickets_id', 't.id')
                    ->where('gt_filter.type', 2);
            });
            return;
        }

        $isNegative = in_array($operator, ['no_contiene', 'no_es']);
        $condition = function ($sub) use ($operator, $value, $likeValue) {
            $sub->select(DB::raw(1))
                ->from('glpi_groups_tickets as gt_filter')
                ->join('glpi_groups as grp_filter', 'gt_filter.groups_id', '=', 'grp_filter.id')
                ->whereColumn('gt_filter.tickets_id', 't.id')
                ->where('gt_filter.type', 2);
            switch ($operator) {
                case 'contiene': case 'no_contiene':
                    $sub->where('grp_filter.completename', 'LIKE', $likeValue);
                    break;
                case 'es': case 'no_es':
                    $sub->where('grp_filter.completename', '=', $value);
                    break;
                case 'empieza_con':
                    $sub->where('grp_filter.completename', 'LIKE', "{$value}%");
                    break;
                case 'termina_con':
                    $sub->where('grp_filter.completename', 'LIKE', "%{$value}");
                    break;
            }
        };

        if ($isNegative) {
            $query->whereNotExists($condition);
        } else {
            $query->whereExists($condition);
        }
    }

    /**
     * Filtro multi-columna: busca en todas las columnas visibles de la tabla.
     */
    private function applyMultiColumnFilter($query, string $operator, string $value): void
    {
        if (in_array($operator, ['vacio', 'no_vacio'])) return;

        $columns = ['t.id', 't.name', 'e.name', 'cat.completename'];
        $statusCase = "CASE 
            WHEN t.status = 1 THEN 'Nuevo'
            WHEN t.status = 2 THEN 'En curso (asignado)'
            WHEN t.status = 3 THEN 'En curso (planificado)'
            WHEN t.status = 4 THEN 'En espera'
            WHEN t.status = 5 THEN 'Resuelto'
            WHEN t.status = 6 THEN 'Cerrado'
            ELSE 'Desconocido'
        END";
        $priorityCase = "CASE 
            WHEN t.priority = 1 THEN 'Muy baja'
            WHEN t.priority = 2 THEN 'Baja'
            WHEN t.priority = 3 THEN 'Media'
            WHEN t.priority = 4 THEN 'Alta'
            WHEN t.priority = 5 THEN 'Muy alta'
            WHEN t.priority = 6 THEN 'Urgente'
            ELSE 'Media'
        END";

        switch ($operator) {
            case 'contiene':
                $query->where(function ($q) use ($columns, $statusCase, $priorityCase, $value) {
                    foreach ($columns as $col) {
                        $q->orWhere(DB::raw("CAST({$col} AS CHAR)"), 'LIKE', "%{$value}%");
                    }
                    $q->orWhere(DB::raw($statusCase), 'LIKE', "%{$value}%");
                    $q->orWhere(DB::raw($priorityCase), 'LIKE', "%{$value}%");
                    $q->orWhere(DB::raw("CAST(t.date AS CHAR)"), 'LIKE', "%{$value}%");
                    $q->orWhere(DB::raw("CAST(t.date_mod AS CHAR)"), 'LIKE', "%{$value}%");
                });
                break;
            case 'no_contiene':
                $query->where(function ($q) use ($columns, $statusCase, $priorityCase, $value) {
                    foreach ($columns as $col) {
                        $q->where(function($inner) use ($col, $value) {
                            $inner->where(DB::raw("CAST({$col} AS CHAR)"), 'NOT LIKE', "%{$value}%")
                                  ->orWhereNull($col);
                        });
                    }
                    $q->where(DB::raw($statusCase), 'NOT LIKE', "%{$value}%");
                    $q->where(DB::raw($priorityCase), 'NOT LIKE', "%{$value}%");
                });
                break;
            default:
                // Para otros operadores, buscar solo en nombre
                $this->applyTextFilter($query, 't.name', $operator, $value);
                break;
        }
    }

    /**
     * Filtro de solución: busca en la tabla glpi_itilsolutions
     */
    private function applySolutionFilter($query, string $operator, string $value): void
    {
        if ($operator === 'vacio') {
            $query->whereNotExists(function ($sub) {
                $sub->select(DB::raw(1))
                    ->from('glpi_itilsolutions as sol_filter')
                    ->whereColumn('sol_filter.items_id', 't.id')
                    ->where('sol_filter.itemtype', 'Ticket');
            });
            return;
        }
        if ($operator === 'no_vacio') {
            $query->whereExists(function ($sub) {
                $sub->select(DB::raw(1))
                    ->from('glpi_itilsolutions as sol_filter')
                    ->whereColumn('sol_filter.items_id', 't.id')
                    ->where('sol_filter.itemtype', 'Ticket');
            });
            return;
        }

        $likeValue = "%{$value}%";
        $isNegative = in_array($operator, ['no_contiene', 'no_es']);

        $condition = function ($sub) use ($operator, $value, $likeValue) {
            $sub->select(DB::raw(1))
                ->from('glpi_itilsolutions as sol_filter')
                ->whereColumn('sol_filter.items_id', 't.id')
                ->where('sol_filter.itemtype', 'Ticket');
            switch ($operator) {
                case 'contiene': case 'no_contiene':
                    $sub->where('sol_filter.content', 'LIKE', $likeValue);
                    break;
                case 'es': case 'no_es':
                    $sub->where('sol_filter.content', '=', $value);
                    break;
                case 'empieza_con':
                    $sub->where('sol_filter.content', 'LIKE', "{$value}%");
                    break;
                case 'termina_con':
                    $sub->where('sol_filter.content', 'LIKE', "%{$value}");
                    break;
            }
        };

        if ($isNegative) {
            $query->whereNotExists($condition);
        } else {
            $query->whereExists($condition);
        }
    }
}
