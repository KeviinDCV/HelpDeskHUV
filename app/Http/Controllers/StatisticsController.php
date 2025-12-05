<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Color;

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

        // Generar clave de cache basada en filtros
        $cacheKey = 'stats_' . md5(json_encode([
            $dateFrom, $dateTo, $status, $priority, $technicianId, $categoryId
        ]));

        // Si no hay filtros, usar cache de 5 minutos para todo el resultado
        $hasFilters = $dateFrom || $dateTo || $status || $priority || $technicianId || $categoryId;
        
        if (!$hasFilters) {
            $cachedData = cache()->remember('stats_full_data', 180, function() {
                return $this->getStatisticsData('', '', '', '', '', '');
            });
            
            // Obtener técnicos y categorías de cache separado
            $technicians = $this->getCachedTechnicians();
            $categories = $this->getCachedCategories();
            
            return Inertia::render('soporte/estadisticas', array_merge($cachedData, [
                'technicians' => $technicians,
                'categories' => $categories,
            ]));
        }

        // Con filtros, calcular en tiempo real pero con cache corto
        $data = cache()->remember($cacheKey, 60, function() use ($dateFrom, $dateTo, $status, $priority, $technicianId, $categoryId) {
            return $this->getStatisticsData($dateFrom, $dateTo, $status, $priority, $technicianId, $categoryId);
        });

        $technicians = $this->getCachedTechnicians();
        $categories = $this->getCachedCategories();

        return Inertia::render('soporte/estadisticas', array_merge($data, [
            'technicians' => $technicians,
            'categories' => $categories,
        ]));
    }

    private function getCachedTechnicians()
    {
        return cache()->remember('stats_technicians', 600, function() {
            return DB::table('glpi_users')
                ->whereIn('id', function($q) {
                    $q->select('users_id')
                        ->from('glpi_tickets_users')
                        ->where('type', 2);
                })
                ->select('id', DB::raw("CONCAT(firstname, ' ', realname) as name"))
                ->orderBy('name')
                ->get()
                ->toArray();
        });
    }

    private function getCachedCategories()
    {
        return cache()->remember('stats_categories', 600, function() {
            return DB::table('glpi_itilcategories')
                ->where('is_incident', 1)
                ->select('id', 'name')
                ->orderBy('name')
                ->get()
                ->toArray();
        });
    }

    private function getStatisticsData($dateFrom, $dateTo, $status, $priority, $technicianId, $categoryId)
    {
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

        // Por técnico (sin límite para poder expandir y exportar todos)
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
            ->when($technicianId && $technicianId !== 'all', fn($q) => $q->where('glpi_tickets_users.users_id', $technicianId))
            ->when($categoryId && $categoryId !== 'all', fn($q) => $q->where('glpi_tickets.itilcategories_id', $categoryId))
            ->select(
                DB::raw("COALESCE(CONCAT(glpi_users.firstname, ' ', glpi_users.realname), 'Sin asignar') as technician"),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN glpi_tickets.status IN (1, 2) THEN 1 ELSE 0 END) as abiertos'),
                DB::raw('SUM(CASE WHEN glpi_tickets.status IN (5, 6) THEN 1 ELSE 0 END) as cerrados')
            )
            ->groupBy('glpi_users.id', 'glpi_users.firstname', 'glpi_users.realname')
            ->orderByDesc('total')
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

        return [
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
        ];
    }

    public function export(Request $request)
    {
        $type = $request->input('export', 'general');
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');
        $status = $request->input('status', '');
        $priority = $request->input('priority', '');
        $categoryId = $request->input('category_id', '');
        $technicianId = $request->input('technician_id', '');

        $statusNames = [1 => 'Nuevo', 2 => 'En curso (asignado)', 3 => 'En curso (planificado)', 4 => 'En espera', 5 => 'Resuelto', 6 => 'Cerrado'];
        $priorityNames = [1 => 'Muy baja', 2 => 'Baja', 3 => 'Media', 4 => 'Alta', 5 => 'Muy alta', 6 => 'Urgente'];
        
        // Colores de la app
        $primaryColor = '2c4370';
        $secondaryColor = '3d5583';
        $accentColor = '4a6fa5';
        $lightBg = 'f0f4f8';
        $successColor = '10b981';
        $warningColor = 'f59e0b';
        $dangerColor = 'ef4444';

        $spreadsheet = new Spreadsheet();
        
        // Propiedades del documento
        $spreadsheet->getProperties()
            ->setCreator('HelpDesk HUV')
            ->setLastModifiedBy('HelpDesk HUV')
            ->setTitle('Estadísticas de Soporte')
            ->setSubject('Reporte de casos')
            ->setDescription('Reporte generado automáticamente por HelpDesk HUV')
            ->setKeywords('helpdesk soporte tickets estadísticas')
            ->setCategory('Reportes');

        if ($type === 'detailed') {
            $filename = 'HelpDesk_Detallado_' . date('Y-m-d_His') . '.xlsx';
            $this->generateDetailedExport($spreadsheet, $dateFrom, $dateTo, $status, $priority, $categoryId, $technicianId, $statusNames, $priorityNames, $primaryColor, $secondaryColor, $lightBg);
        } else {
            $filename = 'HelpDesk_Resumen_' . date('Y-m-d_His') . '.xlsx';
            $this->generateGeneralExport($spreadsheet, $dateFrom, $dateTo, $status, $priority, $categoryId, $technicianId, $statusNames, $priorityNames, $primaryColor, $secondaryColor, $accentColor, $lightBg, $successColor, $warningColor, $dangerColor);
        }

        // Crear archivo temporal
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    private function applyHeaderStyle($sheet, $range, $bgColor)
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $bgColor],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => $bgColor],
                ],
            ],
        ]);
    }

    private function applyDataStyle($sheet, $range, $lightBg = null)
    {
        $style = [
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'E5E7EB'],
                ],
            ],
        ];
        
        if ($lightBg) {
            $style['fill'] = [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $lightBg],
            ];
        }
        
        $sheet->getStyle($range)->applyFromArray($style);
    }

    private function generateGeneralExport($spreadsheet, $dateFrom, $dateTo, $status, $priority, $categoryId, $technicianId, $statusNames, $priorityNames, $primaryColor, $secondaryColor, $accentColor, $lightBg, $successColor, $warningColor, $dangerColor)
    {
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Resumen General');

        // ========== ENCABEZADO PRINCIPAL ==========
        $sheet->mergeCells('A1:H1');
        $sheet->setCellValue('A1', 'HELPDESK HUV - REPORTE DE ESTADÍSTICAS');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 20,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $primaryColor],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(40);

        // Subtítulo
        $sheet->mergeCells('A2:H2');
        $sheet->setCellValue('A2', 'Hospital Universitario del Valle - Sistema de Gestión de Soporte Técnico');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => [
                'italic' => true,
                'size' => 11,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $secondaryColor],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(25);

        // Información de exportación
        $sheet->mergeCells('A3:H3');
        $filterInfo = 'Generado: ' . date('d/m/Y H:i:s');
        if ($dateFrom || $dateTo) {
            $filterInfo .= ' | Período: ' . ($dateFrom ?: 'Inicio') . ' a ' . ($dateTo ?: 'Hoy');
        }
        $sheet->setCellValue('A3', $filterInfo);
        $sheet->getStyle('A3')->applyFromArray([
            'font' => ['size' => 10, 'color' => ['rgb' => '6B7280']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $lightBg],
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Query base para estadísticas
        $baseQuery = DB::table('glpi_tickets')->where('is_deleted', 0);
        if ($dateFrom) $baseQuery->whereDate('date', '>=', $dateFrom);
        if ($dateTo) $baseQuery->whereDate('date', '<=', $dateTo);
        if ($status && $status !== 'all') $baseQuery->where('status', $status);
        if ($priority && $priority !== 'all') $baseQuery->where('priority', $priority);
        if ($categoryId && $categoryId !== 'all') $baseQuery->where('itilcategories_id', $categoryId);

        $total = (clone $baseQuery)->count();
        $nuevos = (clone $baseQuery)->where('status', 1)->count();
        $enCurso = (clone $baseQuery)->whereIn('status', [2, 3])->count();
        $enEspera = (clone $baseQuery)->where('status', 4)->count();
        $resueltos = (clone $baseQuery)->where('status', 5)->count();
        $cerrados = (clone $baseQuery)->where('status', 6)->count();

        // ========== RESUMEN DE MÉTRICAS ==========
        $row = 5;
        $sheet->setCellValue("A{$row}", '📊 RESUMEN GENERAL');
        $sheet->mergeCells("A{$row}:H{$row}");
        $this->applyHeaderStyle($sheet, "A{$row}:H{$row}", $accentColor);
        $sheet->getRowDimension($row)->setRowHeight(30);

        $row++;
        $metrics = [
            ['Total de Casos', $total, $primaryColor],
            ['Nuevos', $nuevos, '3b82f6'],
            ['En Curso', $enCurso, 'f59e0b'],
            ['En Espera', $enEspera, '8b5cf6'],
            ['Resueltos', $resueltos, $successColor],
            ['Cerrados', $cerrados, '6b7280'],
        ];

        $col = 'A';
        foreach ($metrics as $metric) {
            $sheet->setCellValue("{$col}{$row}", $metric[0]);
            $sheet->getStyle("{$col}{$row}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '374151']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $lightBg]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E5E7EB']]],
            ]);
            $col++;
        }
        $row++;
        $col = 'A';
        foreach ($metrics as $metric) {
            $sheet->setCellValue("{$col}{$row}", $metric[1]);
            $sheet->getStyle("{$col}{$row}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => $metric[2]]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E5E7EB']]],
            ]);
            $col++;
        }
        $sheet->getRowDimension($row)->setRowHeight(35);

        // ========== POR ESTADO ==========
        $row += 2;
        $sheet->setCellValue("A{$row}", '📋 DISTRIBUCIÓN POR ESTADO');
        $sheet->mergeCells("A{$row}:D{$row}");
        $this->applyHeaderStyle($sheet, "A{$row}:D{$row}", $primaryColor);

        $row++;
        $sheet->setCellValue("A{$row}", 'Estado');
        $sheet->setCellValue("B{$row}", 'Cantidad');
        $sheet->setCellValue("C{$row}", 'Porcentaje');
        $sheet->setCellValue("D{$row}", 'Barra Visual');
        $this->applyHeaderStyle($sheet, "A{$row}:D{$row}", $secondaryColor);

        $byStatus = (clone $baseQuery)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        foreach ($byStatus as $item) {
            $row++;
            $pct = $total > 0 ? round(($item->count / $total) * 100, 1) : 0;
            $sheet->setCellValue("A{$row}", $statusNames[$item->status] ?? 'Desconocido');
            $sheet->setCellValue("B{$row}", $item->count);
            $sheet->setCellValue("C{$row}", $pct . '%');
            $sheet->setCellValue("D{$row}", str_repeat('█', min(20, round($pct / 5))));
            $this->applyDataStyle($sheet, "A{$row}:D{$row}", $row % 2 == 0 ? $lightBg : null);
        }

        // ========== POR PRIORIDAD ==========
        $row += 2;
        $sheet->setCellValue("A{$row}", '⚡ DISTRIBUCIÓN POR PRIORIDAD');
        $sheet->mergeCells("A{$row}:D{$row}");
        $this->applyHeaderStyle($sheet, "A{$row}:D{$row}", $primaryColor);

        $row++;
        $sheet->setCellValue("A{$row}", 'Prioridad');
        $sheet->setCellValue("B{$row}", 'Cantidad');
        $sheet->setCellValue("C{$row}", 'Porcentaje');
        $sheet->setCellValue("D{$row}", 'Barra Visual');
        $this->applyHeaderStyle($sheet, "A{$row}:D{$row}", $secondaryColor);

        $byPriority = (clone $baseQuery)
            ->select('priority', DB::raw('COUNT(*) as count'))
            ->groupBy('priority')
            ->orderBy('priority')
            ->get();

        $priorityColors = [1 => '22c55e', 2 => '84cc16', 3 => 'eab308', 4 => 'f97316', 5 => 'ef4444', 6 => 'dc2626'];
        foreach ($byPriority as $item) {
            $row++;
            $pct = $total > 0 ? round(($item->count / $total) * 100, 1) : 0;
            $sheet->setCellValue("A{$row}", $priorityNames[$item->priority] ?? 'Sin definir');
            $sheet->setCellValue("B{$row}", $item->count);
            $sheet->setCellValue("C{$row}", $pct . '%');
            $sheet->setCellValue("D{$row}", str_repeat('█', min(20, round($pct / 5))));
            $this->applyDataStyle($sheet, "A{$row}:D{$row}", $row % 2 == 0 ? $lightBg : null);
            $sheet->getStyle("A{$row}")->getFont()->setColor(new Color($priorityColors[$item->priority] ?? '000000'));
        }

        // ========== POR TÉCNICO ==========
        $row += 2;
        $sheet->setCellValue("A{$row}", '👤 CASOS POR TÉCNICO');
        $sheet->mergeCells("A{$row}:E{$row}");
        $this->applyHeaderStyle($sheet, "A{$row}:E{$row}", $primaryColor);

        $row++;
        $sheet->setCellValue("A{$row}", 'Técnico');
        $sheet->setCellValue("B{$row}", 'Total');
        $sheet->setCellValue("C{$row}", 'Abiertos');
        $sheet->setCellValue("D{$row}", 'Cerrados');
        $sheet->setCellValue("E{$row}", '% Resolución');
        $this->applyHeaderStyle($sheet, "A{$row}:E{$row}", $secondaryColor);

        $byTechnician = DB::table('glpi_tickets')
            ->leftJoin('glpi_tickets_users', function($join) {
                $join->on('glpi_tickets.id', '=', 'glpi_tickets_users.tickets_id')
                    ->where('glpi_tickets_users.type', '=', 2);
            })
            ->leftJoin('glpi_users', 'glpi_tickets_users.users_id', '=', 'glpi_users.id')
            ->where('glpi_tickets.is_deleted', 0)
            ->when($dateFrom, fn($q) => $q->whereDate('glpi_tickets.date', '>=', $dateFrom))
            ->when($dateTo, fn($q) => $q->whereDate('glpi_tickets.date', '<=', $dateTo))
            ->select(
                DB::raw("COALESCE(CONCAT(glpi_users.firstname, ' ', glpi_users.realname), 'Sin asignar') as technician"),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN glpi_tickets.status IN (1, 2, 3, 4) THEN 1 ELSE 0 END) as abiertos'),
                DB::raw('SUM(CASE WHEN glpi_tickets.status IN (5, 6) THEN 1 ELSE 0 END) as cerrados')
            )
            ->groupBy('glpi_users.id', 'glpi_users.firstname', 'glpi_users.realname')
            ->orderByDesc('total')
            ->get();

        foreach ($byTechnician as $tech) {
            $row++;
            $resolution = $tech->total > 0 ? round(($tech->cerrados / $tech->total) * 100, 1) : 0;
            $sheet->setCellValue("A{$row}", $tech->technician);
            $sheet->setCellValue("B{$row}", $tech->total);
            $sheet->setCellValue("C{$row}", $tech->abiertos);
            $sheet->setCellValue("D{$row}", $tech->cerrados);
            $sheet->setCellValue("E{$row}", $resolution . '%');
            $this->applyDataStyle($sheet, "A{$row}:E{$row}", $row % 2 == 0 ? $lightBg : null);
            
            // Color del porcentaje según rendimiento
            $resColor = $resolution >= 80 ? $successColor : ($resolution >= 50 ? $warningColor : $dangerColor);
            $sheet->getStyle("E{$row}")->getFont()->setColor(new Color($resColor));
        }

        // ========== POR CATEGORÍA ==========
        $row += 2;
        $sheet->setCellValue("A{$row}", '📁 CASOS POR CATEGORÍA');
        $sheet->mergeCells("A{$row}:C{$row}");
        $this->applyHeaderStyle($sheet, "A{$row}:C{$row}", $primaryColor);

        $row++;
        $sheet->setCellValue("A{$row}", 'Categoría');
        $sheet->setCellValue("B{$row}", 'Cantidad');
        $sheet->setCellValue("C{$row}", 'Porcentaje');
        $this->applyHeaderStyle($sheet, "A{$row}:C{$row}", $secondaryColor);

        $byCategory = (clone $baseQuery)
            ->leftJoin('glpi_itilcategories', 'glpi_tickets.itilcategories_id', '=', 'glpi_itilcategories.id')
            ->select(
                DB::raw("COALESCE(glpi_itilcategories.name, 'Sin categoría') as category"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('glpi_itilcategories.id', 'glpi_itilcategories.name')
            ->orderByDesc('count')
            ->limit(15)
            ->get();

        foreach ($byCategory as $cat) {
            $row++;
            $pct = $total > 0 ? round(($cat->count / $total) * 100, 1) : 0;
            $sheet->setCellValue("A{$row}", $cat->category);
            $sheet->setCellValue("B{$row}", $cat->count);
            $sheet->setCellValue("C{$row}", $pct . '%');
            $this->applyDataStyle($sheet, "A{$row}:C{$row}", $row % 2 == 0 ? $lightBg : null);
        }

        // ========== TENDENCIA MENSUAL ==========
        $row += 2;
        $sheet->setCellValue("A{$row}", '📈 TENDENCIA MENSUAL (ÚLTIMOS 12 MESES)');
        $sheet->mergeCells("A{$row}:D{$row}");
        $this->applyHeaderStyle($sheet, "A{$row}:D{$row}", $primaryColor);

        $row++;
        $sheet->setCellValue("A{$row}", 'Mes');
        $sheet->setCellValue("B{$row}", 'Casos Creados');
        $sheet->setCellValue("C{$row}", 'Casos Cerrados');
        $sheet->setCellValue("D{$row}", 'Variación');
        $this->applyHeaderStyle($sheet, "A{$row}:D{$row}", $secondaryColor);

        $byMonth = DB::table('glpi_tickets')
            ->where('is_deleted', 0)
            ->whereDate('date', '>=', now()->subMonths(12))
            ->select(
                DB::raw("DATE_FORMAT(date, '%Y-%m') as month"),
                DB::raw('COUNT(*) as created'),
                DB::raw('SUM(CASE WHEN status IN (5, 6) THEN 1 ELSE 0 END) as closed')
            )
            ->groupBy(DB::raw("DATE_FORMAT(date, '%Y-%m')"))
            ->orderBy('month')
            ->get();

        $prevCount = null;
        foreach ($byMonth as $month) {
            $row++;
            $date = \Carbon\Carbon::createFromFormat('Y-m', $month->month);
            $variation = $prevCount !== null ? ($month->created - $prevCount) : 0;
            $variationText = $variation > 0 ? "+{$variation}" : (string)$variation;
            
            $sheet->setCellValue("A{$row}", $date->translatedFormat('F Y'));
            $sheet->setCellValue("B{$row}", $month->created);
            $sheet->setCellValue("C{$row}", $month->closed);
            $sheet->setCellValue("D{$row}", $prevCount !== null ? $variationText : '-');
            $this->applyDataStyle($sheet, "A{$row}:D{$row}", $row % 2 == 0 ? $lightBg : null);
            
            if ($variation > 0) {
                $sheet->getStyle("D{$row}")->getFont()->setColor(new Color($dangerColor));
            } elseif ($variation < 0) {
                $sheet->getStyle("D{$row}")->getFont()->setColor(new Color($successColor));
            }
            
            $prevCount = $month->created;
        }

        // Ajustar anchos de columna
        $sheet->getColumnDimension('A')->setWidth(30);
        $sheet->getColumnDimension('B')->setWidth(15);
        $sheet->getColumnDimension('C')->setWidth(15);
        $sheet->getColumnDimension('D')->setWidth(20);
        $sheet->getColumnDimension('E')->setWidth(15);
        $sheet->getColumnDimension('F')->setWidth(12);
        $sheet->getColumnDimension('G')->setWidth(12);
        $sheet->getColumnDimension('H')->setWidth(12);

        // Congelar fila de título
        $sheet->freezePane('A4');
    }

    private function generateDetailedExport($spreadsheet, $dateFrom, $dateTo, $status, $priority, $categoryId, $technicianId, $statusNames, $priorityNames, $primaryColor, $secondaryColor, $lightBg)
    {
        // Aumentar tiempo de ejecución para exports grandes
        set_time_limit(300);
        
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Detalle de Casos');

        // Colores por prioridad y estado (definir antes para reutilizar)
        $priorityColors = [1 => 'dcfce7', 2 => 'ecfccb', 3 => 'fef9c3', 4 => 'fed7aa', 5 => 'fecaca', 6 => 'fca5a5'];
        $statusColors = [1 => 'dbeafe', 2 => 'fef3c7', 3 => 'fef3c7', 4 => 'ede9fe', 5 => 'd1fae5', 6 => 'e5e7eb'];

        // ========== ENCABEZADO ==========
        $sheet->mergeCells('A1:L1');
        $sheet->setCellValue('A1', 'HELPDESK HUV - REPORTE DETALLADO DE CASOS');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 18, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $primaryColor]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(35);

        // Información de filtros
        $sheet->mergeCells('A2:L2');
        $filterInfo = 'Generado: ' . date('d/m/Y H:i:s');
        if ($dateFrom || $dateTo) {
            $filterInfo .= ' | Período: ' . ($dateFrom ?: 'Inicio') . ' a ' . ($dateTo ?: 'Hoy');
        }
        $sheet->setCellValue('A2', $filterInfo);
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['size' => 10, 'color' => ['rgb' => '6B7280']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $lightBg]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Encabezados de tabla
        $headers = ['ID', 'Título', 'Estado', 'Prioridad', 'Categoría', 'Ubicación', 'Solicitante', 'Técnico Asignado', 'Fecha Creación', 'Fecha Resolución', 'Tiempo Respuesta', 'Descripción'];
        $sheet->fromArray($headers, null, 'A4');
        $this->applyHeaderStyle($sheet, "A4:L4", $secondaryColor);
        $sheet->getRowDimension(4)->setRowHeight(25);

        // Query de datos con limit para evitar timeout
        $maxRecords = 5000; // Límite máximo de registros
        
        $query = DB::table('glpi_tickets as t')
            ->leftJoin('glpi_tickets_users as tu_tech', function($join) {
                $join->on('t.id', '=', 'tu_tech.tickets_id')
                    ->where('tu_tech.type', '=', 2);
            })
            ->leftJoin('glpi_users as tech', 'tu_tech.users_id', '=', 'tech.id')
            ->leftJoin('glpi_tickets_users as tu_req', function($join) {
                $join->on('t.id', '=', 'tu_req.tickets_id')
                    ->where('tu_req.type', '=', 1);
            })
            ->leftJoin('glpi_users as req', 'tu_req.users_id', '=', 'req.id')
            ->leftJoin('glpi_itilcategories as cat', 't.itilcategories_id', '=', 'cat.id')
            ->leftJoin('glpi_locations as loc', 't.locations_id', '=', 'loc.id')
            ->where('t.is_deleted', 0)
            ->when($dateFrom, fn($q) => $q->whereDate('t.date', '>=', $dateFrom))
            ->when($dateTo, fn($q) => $q->whereDate('t.date', '<=', $dateTo))
            ->when($status && $status !== 'all', fn($q) => $q->where('t.status', $status))
            ->when($priority && $priority !== 'all', fn($q) => $q->where('t.priority', $priority))
            ->when($categoryId && $categoryId !== 'all', fn($q) => $q->where('t.itilcategories_id', $categoryId))
            ->when($technicianId && $technicianId !== 'all', fn($q) => $q->where('tu_tech.users_id', $technicianId))
            ->select(
                't.id',
                't.name',
                't.status',
                't.priority',
                't.date',
                't.solvedate',
                'cat.name as category',
                'loc.completename as location',
                DB::raw("CONCAT(req.firstname, ' ', req.realname) as requester"),
                DB::raw("CONCAT(tech.firstname, ' ', tech.realname) as technician")
            )
            ->orderByDesc('t.date')
            ->limit($maxRecords)
            ->get();

        // Preparar datos en array para inserción masiva (más rápido)
        $data = [];
        foreach ($query as $ticket) {
            // Calcular tiempo de respuesta
            $responseTime = '-';
            if ($ticket->solvedate && $ticket->date) {
                $created = \Carbon\Carbon::parse($ticket->date);
                $solved = \Carbon\Carbon::parse($ticket->solvedate);
                $diff = $created->diff($solved);
                $responseTime = $diff->days > 0 
                    ? $diff->days . 'd ' . $diff->h . 'h'
                    : $diff->h . 'h ' . $diff->i . 'm';
            }

            $data[] = [
                $ticket->id,
                $ticket->name ?? '',
                $statusNames[$ticket->status] ?? 'Desconocido',
                $priorityNames[$ticket->priority] ?? 'Sin definir',
                $ticket->category ?? 'Sin categoría',
                $ticket->location ?? 'Sin ubicación',
                $ticket->requester ?? 'Sin solicitante',
                $ticket->technician ?? 'Sin asignar',
                $ticket->date ? \Carbon\Carbon::parse($ticket->date)->format('d/m/Y H:i') : '-',
                $ticket->solvedate ? \Carbon\Carbon::parse($ticket->solvedate)->format('d/m/Y H:i') : '-',
                $responseTime,
                '' // Sin descripción para mejorar rendimiento
            ];
        }

        // Insertar todos los datos de una vez (mucho más rápido)
        if (!empty($data)) {
            $sheet->fromArray($data, null, 'A5');
        }

        $totalRows = count($data);
        $lastDataRow = 4 + $totalRows;

        // Aplicar estilos en bloques (más eficiente)
        if ($totalRows > 0) {
            // Estilo base para todas las celdas de datos
            $dataRange = "A5:L{$lastDataRow}";
            $sheet->getStyle($dataRange)->applyFromArray([
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'E5E7EB'],
                    ],
                ],
            ]);

            // Aplicar colores por estado y prioridad en lotes
            $row = 5;
            foreach ($query as $ticket) {
                // Color de prioridad
                if (isset($priorityColors[$ticket->priority])) {
                    $sheet->getStyle("D{$row}")->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB($priorityColors[$ticket->priority]);
                }
                // Color de estado
                if (isset($statusColors[$ticket->status])) {
                    $sheet->getStyle("C{$row}")->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB($statusColors[$ticket->status]);
                }
                $row++;
            }
        }

        // Total de registros
        $footerRow = $lastDataRow + 1;
        $sheet->setCellValue("A{$footerRow}", "Total de casos: {$totalRows}" . ($totalRows >= $maxRecords ? " (limitado a {$maxRecords})" : ''));
        $sheet->mergeCells("A{$footerRow}:L{$footerRow}");
        $sheet->getStyle("A{$footerRow}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $lightBg]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);

        // Ajustar anchos
        $columnWidths = ['A' => 8, 'B' => 40, 'C' => 18, 'D' => 12, 'E' => 20, 'F' => 25, 'G' => 22, 'H' => 22, 'I' => 16, 'J' => 16, 'K' => 14, 'L' => 15];
        foreach ($columnWidths as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }

        // Congelar encabezados
        $sheet->freezePane('A5');

        // Filtros automáticos
        if ($totalRows > 0) {
            $sheet->setAutoFilter("A4:L{$lastDataRow}");
        }
    }
}
