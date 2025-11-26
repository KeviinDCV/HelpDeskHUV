<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StatisticsController extends Controller
{
    public function index(Request $request)
    {
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');
        $status = $request->input('status', '');
        $priority = $request->input('priority', '');
        $technicianId = $request->input('technician_id', '');
        $categoryId = $request->input('category_id', '');

        // Query base
        $baseQuery = DB::table('glpi_tickets')
            ->where('glpi_tickets.is_deleted', 0);

        // Filtro por técnico (requiere join)
        if ($technicianId && $technicianId !== 'all') {
            $baseQuery->whereIn('glpi_tickets.id', function($q) use ($technicianId) {
                $q->select('tickets_id')
                    ->from('glpi_tickets_users')
                    ->where('type', 2) // type 2 = técnico asignado
                    ->where('users_id', $technicianId);
            });
        }

        // Aplicar otros filtros
        if ($dateFrom) {
            $baseQuery->whereDate('glpi_tickets.date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $baseQuery->whereDate('glpi_tickets.date', '<=', $dateTo);
        }
        if ($status && $status !== 'all') {
            $baseQuery->where('glpi_tickets.status', $status);
        }
        if ($priority && $priority !== 'all') {
            $baseQuery->where('glpi_tickets.priority', $priority);
        }
        if ($categoryId && $categoryId !== 'all') {
            $baseQuery->where('glpi_tickets.itilcategories_id', $categoryId);
        }

        // Stats generales
        $stats = [
            'total' => (clone $baseQuery)->count(),
            'abiertos' => (clone $baseQuery)->where('status', 1)->count(),
            'en_proceso' => (clone $baseQuery)->where('status', 2)->count(),
            'pendientes' => (clone $baseQuery)->whereIn('status', [3, 4])->count(),
            'cerrados' => (clone $baseQuery)->whereIn('status', [5, 6])->count(),
        ];

        // Por estado
        $statusNames = [1 => 'Nuevo', 2 => 'En proceso', 3 => 'Pendiente', 4 => 'Pendiente', 5 => 'Resuelto', 6 => 'Cerrado'];
        $byStatusRaw = (clone $baseQuery)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();
        
        $byStatus = $byStatusRaw->map(function($item) use ($statusNames, $stats) {
            return [
                'status' => $statusNames[$item->status] ?? 'Desconocido',
                'count' => $item->count,
                'percentage' => $stats['total'] > 0 ? ($item->count / $stats['total']) * 100 : 0
            ];
        })->values()->toArray();

        // Por prioridad
        $priorityNames = [1 => 'Muy alta', 2 => 'Alta', 3 => 'Media', 4 => 'Baja', 5 => 'Muy baja', 6 => 'Muy baja'];
        $byPriorityRaw = (clone $baseQuery)
            ->select('priority', DB::raw('COUNT(*) as count'))
            ->groupBy('priority')
            ->get();
        
        $byPriority = $byPriorityRaw->map(function($item) use ($priorityNames, $stats) {
            return [
                'priority' => $priorityNames[$item->priority] ?? 'Sin definir',
                'count' => $item->count,
                'percentage' => $stats['total'] > 0 ? ($item->count / $stats['total']) * 100 : 0
            ];
        })->values()->toArray();

        // Por técnico
        $byTechnician = DB::table('glpi_tickets')
            ->leftJoin('glpi_tickets_users', function($join) {
                $join->on('glpi_tickets.id', '=', 'glpi_tickets_users.tickets_id')
                    ->where('glpi_tickets_users.type', '=', 2);
            })
            ->leftJoin('glpi_users', 'glpi_tickets_users.users_id', '=', 'glpi_users.id')
            ->where('glpi_tickets.is_deleted', 0)
            ->when($dateFrom, fn($q) => $q->whereDate('glpi_tickets.date', '>=', $dateFrom))
            ->when($dateTo, fn($q) => $q->whereDate('glpi_tickets.date', '<=', $dateTo))
            ->when($status && $status !== 'all', fn($q) => $q->where('glpi_tickets.status', $status))
            ->when($priority && $priority !== 'all', fn($q) => $q->where('glpi_tickets.priority', $priority))
            ->when($categoryId && $categoryId !== 'all', fn($q) => $q->where('glpi_tickets.itilcategories_id', $categoryId))
            ->select(
                DB::raw("COALESCE(CONCAT(glpi_users.firstname, ' ', glpi_users.realname), 'Sin asignar') as technician"),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN glpi_tickets.status IN (1, 2) THEN 1 ELSE 0 END) as abiertos'),
                DB::raw('SUM(CASE WHEN glpi_tickets.status IN (5, 6) THEN 1 ELSE 0 END) as cerrados')
            )
            ->groupBy('glpi_users.id', 'glpi_users.firstname', 'glpi_users.realname')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->toArray();

        // Por categoría
        $byCategory = (clone $baseQuery)
            ->leftJoin('glpi_itilcategories', 'glpi_tickets.itilcategories_id', '=', 'glpi_itilcategories.id')
            ->select(
                DB::raw("COALESCE(glpi_itilcategories.name, 'Sin categoría') as category"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('glpi_itilcategories.id', 'glpi_itilcategories.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->toArray();

        // Por mes (últimos 12 meses)
        $byMonth = DB::table('glpi_tickets')
            ->where('is_deleted', 0)
            ->whereDate('date', '>=', now()->subMonths(12))
            ->when($status && $status !== 'all', fn($q) => $q->where('status', $status))
            ->when($priority && $priority !== 'all', fn($q) => $q->where('priority', $priority))
            ->when($categoryId && $categoryId !== 'all', fn($q) => $q->where('itilcategories_id', $categoryId))
            ->select(
                DB::raw("DATE_FORMAT(date, '%Y-%m') as month"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw("DATE_FORMAT(date, '%Y-%m')"))
            ->orderBy('month')
            ->get()
            ->map(function($item) {
                $date = \Carbon\Carbon::createFromFormat('Y-m', $item->month);
                return [
                    'month' => $date->translatedFormat('M Y'),
                    'count' => $item->count
                ];
            })
            ->toArray();

        // Últimos casos
        $recentCases = (clone $baseQuery)
            ->select('id', 'name', 'status', 'priority', 'date as created_at')
            ->orderByDesc('date')
            ->limit(10)
            ->get()
            ->map(function($item) use ($statusNames) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'status' => $statusNames[$item->status] ?? 'Desconocido',
                    'priority' => $item->priority,
                    'created_at' => $item->created_at
                ];
            })
            ->toArray();

        // Técnicos disponibles
        $technicians = DB::table('glpi_users')
            ->whereIn('id', function($q) {
                $q->select('users_id')
                    ->from('glpi_tickets_users')
                    ->where('type', 2);
            })
            ->select('id', DB::raw("CONCAT(firstname, ' ', realname) as name"))
            ->orderBy('name')
            ->get()
            ->toArray();

        // Categorías
        $categories = DB::table('glpi_itilcategories')
            ->where('is_incident', 1)
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->toArray();

        return Inertia::render('soporte/estadisticas', [
            'stats' => $stats,
            'byStatus' => $byStatus,
            'byPriority' => $byPriority,
            'byTechnician' => $byTechnician,
            'byCategory' => $byCategory,
            'byMonth' => $byMonth,
            'recentCases' => $recentCases,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'status' => $status,
                'priority' => $priority,
                'technician_id' => $technicianId,
                'category_id' => $categoryId,
            ],
            'technicians' => $technicians,
            'categories' => $categories,
        ]);
    }

    public function export(Request $request)
    {
        $type = $request->input('export', 'general');
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');
        $status = $request->input('status', '');
        $priority = $request->input('priority', '');
        $categoryId = $request->input('category_id', '');

        $statusNames = [1 => 'Nuevo', 2 => 'En proceso', 3 => 'Pendiente', 4 => 'Pendiente', 5 => 'Resuelto', 6 => 'Cerrado'];
        $priorityNames = [1 => 'Muy alta', 2 => 'Alta', 3 => 'Media', 4 => 'Baja', 5 => 'Muy baja', 6 => 'Muy baja'];

        $query = DB::table('glpi_tickets')
            ->leftJoin('glpi_tickets_users', function($join) {
                $join->on('glpi_tickets.id', '=', 'glpi_tickets_users.tickets_id')
                    ->where('glpi_tickets_users.type', '=', 2);
            })
            ->leftJoin('glpi_users', 'glpi_tickets_users.users_id', '=', 'glpi_users.id')
            ->leftJoin('glpi_itilcategories', 'glpi_tickets.itilcategories_id', '=', 'glpi_itilcategories.id')
            ->where('glpi_tickets.is_deleted', 0)
            ->when($dateFrom, fn($q) => $q->whereDate('glpi_tickets.date', '>=', $dateFrom))
            ->when($dateTo, fn($q) => $q->whereDate('glpi_tickets.date', '<=', $dateTo))
            ->when($status && $status !== 'all', fn($q) => $q->where('glpi_tickets.status', $status))
            ->when($priority && $priority !== 'all', fn($q) => $q->where('glpi_tickets.priority', $priority))
            ->when($categoryId && $categoryId !== 'all', fn($q) => $q->where('glpi_tickets.itilcategories_id', $categoryId))
            ->select(
                'glpi_tickets.id',
                'glpi_tickets.name',
                'glpi_tickets.status',
                'glpi_tickets.priority',
                'glpi_tickets.date',
                'glpi_tickets.solvedate',
                'glpi_itilcategories.name as category',
                DB::raw("CONCAT(glpi_users.firstname, ' ', glpi_users.realname) as technician")
            )
            ->orderByDesc('glpi_tickets.date')
            ->get();

        $filename = 'estadisticas_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'r+');
        fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

        if ($type === 'detailed') {
            fputcsv($handle, ['ID', 'Título', 'Estado', 'Prioridad', 'Categoría', 'Técnico', 'Fecha Creación', 'Fecha Solución']);
            foreach ($query as $row) {
                fputcsv($handle, [
                    $row->id,
                    $row->name,
                    $statusNames[$row->status] ?? $row->status,
                    $priorityNames[$row->priority] ?? $row->priority,
                    $row->category ?? 'Sin categoría',
                    $row->technician ?? 'Sin asignar',
                    $row->date,
                    $row->solvedate ?? '-'
                ]);
            }
        } else {
            // Resumen general
            $total = $query->count();
            $byStatusCount = $query->groupBy('status')->map->count();
            
            fputcsv($handle, ['Estadísticas Generales - HelpDesk HUV']);
            fputcsv($handle, ['Fecha de exportación', date('Y-m-d H:i:s')]);
            fputcsv($handle, []);
            fputcsv($handle, ['Métrica', 'Valor']);
            fputcsv($handle, ['Total de casos', $total]);
            foreach ($byStatusCount as $st => $count) {
                fputcsv($handle, [$statusNames[$st] ?? "Estado $st", $count]);
            }
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }
}
