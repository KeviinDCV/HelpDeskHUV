<?php

namespace App\Http\Controllers;

use App\Models\Software;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use App\Traits\ExcelExportStyles;

class SoftwareController extends Controller
{
    use ExcelExportStyles;
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');
        $manufacturerFilter = $request->input('manufacturer', '');

        // Mapeo de campos para ordenamiento
        $sortableFields = [
            'name' => 's.name',
            'entity_name' => 'e.name',
            'manufacturer_name' => 'm.name',
            'num_versions' => 'num_versions',
            'num_installations' => 'num_installations',
            'num_licenses' => 'num_licenses',
        ];

        $orderByField = $sortableFields[$sortField] ?? 's.name';
        
        // Query optimizada usando subconsultas en lugar de JOINs pesados
        $query = DB::table('glpi_softwares as s')
            ->select(
                's.id',
                's.name',
                'm.name as manufacturer_name',
                'e.name as entity_name',
                DB::raw('(SELECT COUNT(*) FROM glpi_softwareversions WHERE softwares_id = s.id) as num_versions'),
                DB::raw('(SELECT COUNT(*) FROM glpi_softwareversions sv 
                          INNER JOIN glpi_computers_softwareversions csv ON sv.id = csv.softwareversions_id 
                          WHERE sv.softwares_id = s.id) as num_installations'),
                DB::raw('(SELECT COALESCE(SUM(number), 0) FROM glpi_softwarelicenses WHERE softwares_id = s.id) as num_licenses')
            )
            ->leftJoin('glpi_entities as e', 's.entities_id', '=', 'e.id')
            ->leftJoin('glpi_manufacturers as m', 's.manufacturers_id', '=', 'm.id')
            ->where('s.is_deleted', 0);

        // Aplicar filtro de fabricante
        if ($manufacturerFilter && $manufacturerFilter !== 'all') {
            $query->where('s.manufacturers_id', $manufacturerFilter);
        }

        // Aplicar búsqueda si existe (usando WHERE en lugar de HAVING)
        if ($search) {
            $searchLower = strtolower($search);
            $query->where(function($q) use ($searchLower) {
                $q->whereRaw('LOWER(s.name) LIKE ?', ["%{$searchLower}%"])
                  ->orWhereRaw('LOWER(e.name) LIKE ?', ["%{$searchLower}%"])
                  ->orWhereRaw('LOWER(m.name) LIKE ?', ["%{$searchLower}%"]);
            });
        }
        
        $softwares = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search,
                'manufacturer' => $manufacturerFilter
            ]);

        // Obtener datos para filtros (con cache)
        $manufacturers = cache()->remember('software_manufacturers', 300, function() {
            return DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        });

        return Inertia::render('inventario/programas', [
            'softwares' => $softwares,
            'manufacturers' => $manufacturers,
            'filters' => [
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search,
                'manufacturer' => $manufacturerFilter
            ]
        ]);
    }

    public function export(Request $request)
    {
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');
        $manufacturerFilter = $request->input('manufacturer', '');

        $sortableFields = [
            'name' => 's.name',
            'entity_name' => 'e.name',
            'manufacturer_name' => 'm.name',
            'num_versions' => 'num_versions',
            'num_installations' => 'num_installations',
            'num_licenses' => 'num_licenses',
        ];

        $orderByField = $sortableFields[$sortField] ?? 's.name';
        
        $query = DB::table('glpi_softwares as s')
            ->select(
                's.name',
                'e.name as entity_name',
                'm.name as manufacturer_name',
                DB::raw('COUNT(DISTINCT sv.id) as num_versions'),
                DB::raw('COUNT(DISTINCT csv.id) as num_installations'),
                DB::raw('COALESCE(SUM(sl.number), 0) as num_licenses')
            )
            ->leftJoin('glpi_entities as e', 's.entities_id', '=', 'e.id')
            ->leftJoin('glpi_manufacturers as m', 's.manufacturers_id', '=', 'm.id')
            ->leftJoin('glpi_softwareversions as sv', 's.id', '=', 'sv.softwares_id')
            ->leftJoin('glpi_computers_softwareversions as csv', 'sv.id', '=', 'csv.softwareversions_id')
            ->leftJoin('glpi_softwarelicenses as sl', 's.id', '=', 'sl.softwares_id')
            ->where('s.is_deleted', 0);

        // Aplicar filtro de fabricante antes del groupBy
        if ($manufacturerFilter && $manufacturerFilter !== 'all') {
            $query->where('s.manufacturers_id', $manufacturerFilter);
        }

        $query->groupBy('s.id', 's.name', 'm.name', 'e.name');

        if ($search) {
            $query->having(DB::raw('LOWER(s.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(e.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(m.name)'), 'LIKE', "%".strtolower($search)."%");
        }

        $softwares = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear Excel
        $spreadsheet = new Spreadsheet();
        $this->setDocumentProperties($spreadsheet, 'Inventario de Software', 'Listado de programas instalados');
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Programas');

        $this->createDocumentHeader($sheet, 'HELPDESK HUV - INVENTARIO DE SOFTWARE', 'Hospital Universitario del Valle - Gestión de Activos TI', 'F', '');

        // Resumen
        $row = 5;
        $total = $softwares->count();
        $totalInstalls = $softwares->sum('num_installations');
        $totalLicenses = $softwares->sum('num_licenses');
        $sheet->setCellValue("A{$row}", "📊 TOTAL: {$total} programas | 💻 Instalaciones: {$totalInstalls} | 📜 Licencias: {$totalLicenses}");
        $sheet->mergeCells("A{$row}:F{$row}");
        $this->applySectionStyle($sheet, "A{$row}:F{$row}");
        $sheet->getRowDimension($row)->setRowHeight(28);

        // Headers
        $row = 7;
        $headers = ['Nombre', 'Entidad', 'Editor', 'Versiones', 'Instalaciones', 'Licencias'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue("{$col}{$row}", $header);
            $col++;
        }
        $this->applyHeaderStyle($sheet, "A{$row}:F{$row}");
        $sheet->getRowDimension($row)->setRowHeight(25);

        // Datos
        $row++;
        $startDataRow = $row;
        foreach ($softwares as $software) {
            $sheet->setCellValue("A{$row}", $software->name ?? '-');
            $sheet->setCellValue("B{$row}", $software->entity_name ?? '-');
            $sheet->setCellValue("C{$row}", $software->manufacturer_name ?? '-');
            $sheet->setCellValue("D{$row}", $software->num_versions ?? '0');
            $sheet->setCellValue("E{$row}", $software->num_installations ?? '0');
            $sheet->setCellValue("F{$row}", $software->num_licenses ?? '0');
            $row++;
        }

        $this->applyAlternateRowStyles($sheet, $startDataRow, $row - 1, 'A', 'F');
        $this->autoSizeColumns($sheet, ['A', 'B', 'C', 'D', 'E', 'F']);

        $filename = 'Programas_HelpDesk_' . date('Y-m-d_His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function create()
    {
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $categories = DB::table('glpi_softwarecategories')->select('id', 'name')->orderBy('name')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('inventario/crear-programa', [
            'manufacturers' => $manufacturers,
            'categories' => $categories,
            'entities' => $entities,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'manufacturers_id' => 'nullable',
            'softwarecategories_id' => 'nullable',
            'entities_id' => 'nullable',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_softwares')->insert([
            'name' => $validated['name'],
            'manufacturers_id' => !empty($validated['manufacturers_id']) ? (int)$validated['manufacturers_id'] : 0,
            'softwarecategories_id' => !empty($validated['softwarecategories_id']) ? (int)$validated['softwarecategories_id'] : 0,
            'entities_id' => !empty($validated['entities_id']) ? (int)$validated['entities_id'] : 0,
            'comment' => $validated['comment'] ?: '',
            'locations_id' => 0,
            'users_id_tech' => 0,
            'groups_id_tech' => 0,
            'users_id' => 0,
            'groups_id' => 0,
            'is_deleted' => 0,
            'is_template' => 0,
            'is_update' => 0,
            'is_recursive' => 0,
            'is_helpdesk_visible' => 1,
            'is_valid' => 1,
            'softwares_id' => 0,
            'template_name' => '',
            'ticket_tco' => 0,
            'date_creation' => now(),
            'date_mod' => now(),
        ]);

        return redirect()->route('inventario.programas')->with('success', 'Programa creado exitosamente');
    }

    public function show($id)
    {
        $software = DB::table('glpi_softwares as s')
            ->select(
                's.*',
                'm.name as manufacturer_name',
                'c.name as category_name',
                'e.name as entity_name'
            )
            ->leftJoin('glpi_manufacturers as m', 's.manufacturers_id', '=', 'm.id')
            ->leftJoin('glpi_softwarecategories as c', 's.softwarecategories_id', '=', 'c.id')
            ->leftJoin('glpi_entities as e', 's.entities_id', '=', 'e.id')
            ->where('s.id', $id)
            ->where('s.is_deleted', 0)
            ->first();

        if (!$software) {
            abort(404);
        }

        // Obtener versiones del software
        $versions = DB::table('glpi_softwareversions')
            ->select('id', 'name', 'date_creation')
            ->where('softwares_id', $id)
            ->orderBy('name', 'desc')
            ->limit(20)
            ->get();

        // Obtener tickets relacionados
        $tickets = DB::table('glpi_items_tickets as it')
            ->join('glpi_tickets as t', 'it.tickets_id', '=', 't.id')
            ->select('t.id', 't.name', 't.status', 't.date')
            ->where('it.items_id', $id)
            ->where('it.itemtype', 'Software')
            ->where('t.is_deleted', 0)
            ->orderBy('t.date', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('inventario/ver-programa', [
            'software' => $software,
            'versions' => $versions,
            'tickets' => $tickets,
        ]);
    }

    public function edit($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        $software = DB::table('glpi_softwares')->where('id', $id)->first();
        if (!$software) {
            abort(404);
        }

        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $categories = DB::table('glpi_softwarecategories')->select('id', 'name')->orderBy('name')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('inventario/editar-programa', [
            'software' => $software,
            'manufacturers' => $manufacturers,
            'categories' => $categories,
            'entities' => $entities,
        ]);
    }

    public function update(Request $request, $id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'manufacturers_id' => 'nullable|integer',
            'softwarecategories_id' => 'nullable|integer',
            'entities_id' => 'nullable|integer',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_softwares')->where('id', $id)->update([
            'name' => $validated['name'],
            'manufacturers_id' => $validated['manufacturers_id'] ?? 0,
            'softwarecategories_id' => $validated['softwarecategories_id'] ?? 0,
            'entities_id' => $validated['entities_id'] ?? 0,
            'comment' => $validated['comment'] ?? null,
            'date_mod' => now(),
        ]);

        return redirect()->route('inventario.programas')->with('success', 'Programa actualizado exitosamente');
    }

    public function destroy($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        DB::table('glpi_softwares')->where('id', $id)->update(['is_deleted' => 1]);

        return redirect()->route('inventario.programas')->with('success', 'Programa eliminado exitosamente');
    }
}
