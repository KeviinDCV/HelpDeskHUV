<?php

namespace App\Http\Controllers;

use App\Models\Computer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use App\Traits\ExcelExportStyles;

class ComputerController extends Controller
{
    use ExcelExportStyles;
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');
        $stateFilter = $request->input('state', '');
        $manufacturerFilter = $request->input('manufacturer', '');
        $typeFilter = $request->input('type', '');
        $locationFilter = $request->input('location', '');
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');

        // Mapeo de campos para ordenamiento
        $sortableFields = [
            'name' => 'c.name',
            'entity_name' => 'e.name',
            'state_name' => 's.name',
            'manufacturer_name' => 'm.name',
            'serial' => 'c.serial',
            'type_name' => 't.name',
            'model_name' => 'cm.name',
            'location_name' => 'l.completename',
            'date_mod' => 'c.date_mod',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'c.name';
        
        $query = DB::table('glpi_computers as c')
            ->select(
                'c.id',
                'c.name',
                'c.serial',
                'c.date_mod',
                's.name as state_name',
                'm.name as manufacturer_name',
                'l.completename as location_name',
                'e.name as entity_name',
                't.name as type_name',
                'cm.name as model_name'
            )
            ->leftJoin('glpi_entities as e', 'c.entities_id', '=', 'e.id')
            ->leftJoin('glpi_computertypes as t', 'c.computertypes_id', '=', 't.id')
            ->leftJoin('glpi_computermodels as cm', 'c.computermodels_id', '=', 'cm.id')
            ->leftJoin('glpi_states as s', 'c.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as m', 'c.manufacturers_id', '=', 'm.id')
            ->leftJoin('glpi_locations as l', 'c.locations_id', '=', 'l.id')
            ->where('c.is_deleted', 0);

        // Aplicar búsqueda si existe
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('c.name', 'LIKE', "%{$search}%")
                  ->orWhere('c.serial', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%")
                  ->orWhere('s.name', 'LIKE', "%{$search}%")
                  ->orWhere('m.name', 'LIKE', "%{$search}%")
                  ->orWhere('t.name', 'LIKE', "%{$search}%")
                  ->orWhere('cm.name', 'LIKE', "%{$search}%")
                  ->orWhere('l.completename', 'LIKE', "%{$search}%");
            });
        }

        // Aplicar filtros
        if ($stateFilter && $stateFilter !== 'all') {
            $query->where('c.states_id', $stateFilter);
        }
        if ($manufacturerFilter && $manufacturerFilter !== 'all') {
            $query->where('c.manufacturers_id', $manufacturerFilter);
        }
        if ($typeFilter && $typeFilter !== 'all') {
            $query->where('c.computertypes_id', $typeFilter);
        }
        if ($locationFilter && $locationFilter !== 'all') {
            $query->where('c.locations_id', $locationFilter);
        }
        if ($dateFrom) {
            $query->whereDate('c.date_mod', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('c.date_mod', '<=', $dateTo);
        }
        
        $computers = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search,
                'state' => $stateFilter,
                'manufacturer' => $manufacturerFilter,
                'type' => $typeFilter,
                'location' => $locationFilter,
                'date_from' => $dateFrom,
                'date_to' => $dateTo
            ]);

        // Obtener datos para filtros
        $states = DB::table('glpi_states')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $types = DB::table('glpi_computertypes')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();

        return Inertia::render('inventario/computadores', [
            'computers' => $computers,
            'states' => $states,
            'manufacturers' => $manufacturers,
            'types' => $types,
            'locations' => $locations,
            'filters' => [
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search,
                'state' => $stateFilter,
                'manufacturer' => $manufacturerFilter,
                'type' => $typeFilter,
                'location' => $locationFilter,
                'date_from' => $dateFrom,
                'date_to' => $dateTo
            ]
        ]);
    }

    public function export(Request $request)
    {
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');
        $stateFilter = $request->input('state', '');
        $manufacturerFilter = $request->input('manufacturer', '');
        $typeFilter = $request->input('type', '');
        $locationFilter = $request->input('location', '');
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');

        $sortableFields = [
            'name' => 'c.name',
            'entity_name' => 'e.name',
            'state_name' => 's.name',
            'manufacturer_name' => 'm.name',
            'serial' => 'c.serial',
            'type_name' => 't.name',
            'model_name' => 'cm.name',
            'location_name' => 'l.completename',
            'date_mod' => 'c.date_mod',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'c.name';
        
        $query = DB::table('glpi_computers as c')
            ->select(
                'c.name',
                'e.name as entity_name',
                's.name as state_name',
                'm.name as manufacturer_name',
                'c.serial',
                't.name as type_name',
                'cm.name as model_name',
                'l.completename as location_name',
                'c.date_mod'
            )
            ->leftJoin('glpi_entities as e', 'c.entities_id', '=', 'e.id')
            ->leftJoin('glpi_computertypes as t', 'c.computertypes_id', '=', 't.id')
            ->leftJoin('glpi_computermodels as cm', 'c.computermodels_id', '=', 'cm.id')
            ->leftJoin('glpi_states as s', 'c.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as m', 'c.manufacturers_id', '=', 'm.id')
            ->leftJoin('glpi_locations as l', 'c.locations_id', '=', 'l.id')
            ->where('c.is_deleted', 0);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('c.name', 'LIKE', "%{$search}%")
                  ->orWhere('c.serial', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%")
                  ->orWhere('s.name', 'LIKE', "%{$search}%")
                  ->orWhere('m.name', 'LIKE', "%{$search}%")
                  ->orWhere('t.name', 'LIKE', "%{$search}%")
                  ->orWhere('cm.name', 'LIKE', "%{$search}%")
                  ->orWhere('l.completename', 'LIKE', "%{$search}%");
            });
        }

        // Aplicar filtros
        if ($stateFilter && $stateFilter !== 'all') {
            $query->where('c.states_id', $stateFilter);
        }
        if ($manufacturerFilter && $manufacturerFilter !== 'all') {
            $query->where('c.manufacturers_id', $manufacturerFilter);
        }
        if ($typeFilter && $typeFilter !== 'all') {
            $query->where('c.computertypes_id', $typeFilter);
        }
        if ($locationFilter && $locationFilter !== 'all') {
            $query->where('c.locations_id', $locationFilter);
        }
        if ($dateFrom) {
            $query->whereDate('c.date_mod', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('c.date_mod', '<=', $dateTo);
        }

        $computers = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear Excel
        $spreadsheet = new Spreadsheet();
        $this->setDocumentProperties($spreadsheet, 'Inventario de Computadores', 'Listado de equipos de cómputo');
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Computadores');

        // Encabezado del documento
        $filterInfo = '';
        if ($stateFilter && $stateFilter !== 'all') $filterInfo .= "Estado filtrado ";
        if ($manufacturerFilter && $manufacturerFilter !== 'all') $filterInfo .= "Fabricante filtrado ";
        $this->createDocumentHeader($sheet, 'HELPDESK HUV - INVENTARIO DE COMPUTADORES', 'Hospital Universitario del Valle - Gestión de Activos TI', 'I', $filterInfo);

        // Resumen
        $row = 5;
        $total = $computers->count();
        $sheet->setCellValue("A{$row}", "📊 TOTAL: {$total} computadores registrados");
        $sheet->mergeCells("A{$row}:I{$row}");
        $this->applySectionStyle($sheet, "A{$row}:I{$row}");
        $sheet->getRowDimension($row)->setRowHeight(28);

        // Headers de tabla
        $row = 7;
        $headers = ['Nombre', 'Entidad', 'Estado', 'Fabricante', 'N° Serie', 'Tipo', 'Modelo', 'Localización', 'Últ. Actualización'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue("{$col}{$row}", $header);
            $col++;
        }
        $this->applyHeaderStyle($sheet, "A{$row}:I{$row}");
        $sheet->getRowDimension($row)->setRowHeight(25);

        // Datos
        $row++;
        $startDataRow = $row;
        foreach ($computers as $computer) {
            $sheet->setCellValue("A{$row}", $computer->name ?? '-');
            $sheet->setCellValue("B{$row}", $computer->entity_name ?? '-');
            $sheet->setCellValue("C{$row}", $computer->state_name ?? '-');
            $sheet->setCellValue("D{$row}", $computer->manufacturer_name ?? '-');
            $sheet->setCellValue("E{$row}", $computer->serial ?? '-');
            $sheet->setCellValue("F{$row}", $computer->type_name ?? '-');
            $sheet->setCellValue("G{$row}", $computer->model_name ?? '-');
            $sheet->setCellValue("H{$row}", $computer->location_name ?? '-');
            $sheet->setCellValue("I{$row}", $computer->date_mod ? date('d/m/Y H:i', strtotime($computer->date_mod)) : '-');
            $row++;
        }

        // Aplicar estilos alternados
        $this->applyAlternateRowStyles($sheet, $startDataRow, $row - 1, 'A', 'I');

        // Auto-ajustar columnas
        $this->autoSizeColumns($sheet, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);

        // Generar archivo
        $filename = 'Computadores_HelpDesk_' . date('Y-m-d_His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function create()
    {
        $states = DB::table('glpi_states')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $types = DB::table('glpi_computertypes')->select('id', 'name')->orderBy('name')->get();
        $models = DB::table('glpi_computermodels')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('inventario/crear-computador', [
            'states' => $states,
            'manufacturers' => $manufacturers,
            'types' => $types,
            'models' => $models,
            'locations' => $locations,
            'entities' => $entities,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'serial' => 'nullable|string|max:255',
            'otherserial' => 'nullable|string|max:255',
            'states_id' => 'nullable',
            'manufacturers_id' => 'nullable',
            'computertypes_id' => 'nullable',
            'computermodels_id' => 'nullable',
            'locations_id' => 'nullable',
            'entities_id' => 'nullable',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_computers')->insert([
            'name' => $validated['name'],
            'serial' => $validated['serial'] ?: '',
            'otherserial' => $validated['otherserial'] ?: '',
            'contact' => '',
            'contact_num' => '',
            'users_id_tech' => 0,
            'groups_id_tech' => 0,
            'states_id' => !empty($validated['states_id']) ? (int)$validated['states_id'] : 0,
            'manufacturers_id' => !empty($validated['manufacturers_id']) ? (int)$validated['manufacturers_id'] : 0,
            'computertypes_id' => !empty($validated['computertypes_id']) ? (int)$validated['computertypes_id'] : 0,
            'computermodels_id' => !empty($validated['computermodels_id']) ? (int)$validated['computermodels_id'] : 0,
            'locations_id' => !empty($validated['locations_id']) ? (int)$validated['locations_id'] : 0,
            'entities_id' => !empty($validated['entities_id']) ? (int)$validated['entities_id'] : 0,
            'comment' => $validated['comment'] ?: '',
            'is_deleted' => 0,
            'is_template' => 0,
            'is_dynamic' => 0,
            'is_recursive' => 0,
            'users_id' => 0,
            'groups_id' => 0,
            'networks_id' => 0,
            'domains_id' => 0,
            'autoupdatesystems_id' => 0,
            'template_name' => '',
            'ticket_tco' => 0,
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'date_creation' => now(),
            'date_mod' => now(),
        ]);

        return redirect()->route('inventario.computadores')->with('success', 'Computador creado exitosamente');
    }

    public function show($id)
    {
        $computer = DB::table('glpi_computers as c')
            ->select(
                'c.*',
                's.name as state_name',
                'm.name as manufacturer_name',
                'l.completename as location_name',
                'e.name as entity_name',
                't.name as type_name',
                'cm.name as model_name'
            )
            ->leftJoin('glpi_entities as e', 'c.entities_id', '=', 'e.id')
            ->leftJoin('glpi_computertypes as t', 'c.computertypes_id', '=', 't.id')
            ->leftJoin('glpi_computermodels as cm', 'c.computermodels_id', '=', 'cm.id')
            ->leftJoin('glpi_states as s', 'c.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as m', 'c.manufacturers_id', '=', 'm.id')
            ->leftJoin('glpi_locations as l', 'c.locations_id', '=', 'l.id')
            ->where('c.id', $id)
            ->where('c.is_deleted', 0)
            ->first();

        if (!$computer) {
            abort(404);
        }

        // Obtener monitores conectados
        $monitors = DB::table('glpi_computers_items as ci')
            ->join('glpi_monitors as mon', function($join) {
                $join->on('ci.items_id', '=', 'mon.id')
                     ->where('ci.itemtype', '=', 'Monitor');
            })
            ->select('mon.id', 'mon.name', 'mon.serial', 'mon.manufacturers_id')
            ->leftJoin('glpi_manufacturers as m', 'mon.manufacturers_id', '=', 'm.id')
            ->addSelect('m.name as manufacturer_name')
            ->where('ci.computers_id', $id)
            ->where('mon.is_deleted', 0)
            ->get();

        // Obtener software instalado (puede no existir en algunas versiones de GLPI)
        $software = collect();
        try {
            $software = DB::table('glpi_items_softwareversions as isv')
                ->join('glpi_softwareversions as sv', 'isv.softwareversions_id', '=', 'sv.id')
                ->join('glpi_softwares as soft', 'sv.softwares_id', '=', 'soft.id')
                ->select('soft.name', 'sv.name as version')
                ->where('isv.items_id', $id)
                ->where('isv.itemtype', 'Computer')
                ->where('soft.is_deleted', 0)
                ->orderBy('soft.name')
                ->limit(50)
                ->get();
        } catch (\Exception $e) {
            // Tabla no existe en esta versión de GLPI, usar colección vacía
            $software = collect();
        }

        // Obtener periféricos conectados
        $peripherals = DB::table('glpi_computers_items as ci')
            ->join('glpi_peripherals as p', function($join) {
                $join->on('ci.items_id', '=', 'p.id')
                     ->where('ci.itemtype', '=', 'Peripheral');
            })
            ->select('p.id', 'p.name', 'p.serial')
            ->where('ci.computers_id', $id)
            ->where('p.is_deleted', 0)
            ->get();

        // Obtener tickets relacionados
        $tickets = DB::table('glpi_items_tickets as it')
            ->join('glpi_tickets as t', 'it.tickets_id', '=', 't.id')
            ->select('t.id', 't.name', 't.status', 't.date')
            ->where('it.items_id', $id)
            ->where('it.itemtype', 'Computer')
            ->where('t.is_deleted', 0)
            ->orderBy('t.date', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('inventario/ver-computador', [
            'computer' => $computer,
            'monitors' => $monitors,
            'software' => $software,
            'peripherals' => $peripherals,
            'tickets' => $tickets,
        ]);
    }

    public function edit($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        $computer = DB::table('glpi_computers')->where('id', $id)->first();
        if (!$computer) {
            abort(404);
        }

        $states = DB::table('glpi_states')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $types = DB::table('glpi_computertypes')->select('id', 'name')->orderBy('name')->get();
        $models = DB::table('glpi_computermodels')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('inventario/editar-computador', [
            'computer' => $computer,
            'states' => $states,
            'manufacturers' => $manufacturers,
            'types' => $types,
            'models' => $models,
            'locations' => $locations,
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
            'serial' => 'nullable|string|max:255',
            'otherserial' => 'nullable|string|max:255',
            'states_id' => 'nullable|integer',
            'manufacturers_id' => 'nullable|integer',
            'computertypes_id' => 'nullable|integer',
            'computermodels_id' => 'nullable|integer',
            'locations_id' => 'nullable|integer',
            'entities_id' => 'nullable|integer',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_computers')->where('id', $id)->update([
            'name' => $validated['name'],
            'serial' => $validated['serial'] ?? null,
            'otherserial' => $validated['otherserial'] ?? null,
            'states_id' => $validated['states_id'] ?? 0,
            'manufacturers_id' => $validated['manufacturers_id'] ?? 0,
            'computertypes_id' => $validated['computertypes_id'] ?? 0,
            'computermodels_id' => $validated['computermodels_id'] ?? 0,
            'locations_id' => $validated['locations_id'] ?? 0,
            'entities_id' => $validated['entities_id'] ?? 0,
            'comment' => $validated['comment'] ?? null,
            'date_mod' => now(),
        ]);

        return redirect()->route('inventario.computadores')->with('success', 'Computador actualizado exitosamente');
    }

    public function destroy($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        DB::table('glpi_computers')->where('id', $id)->update(['is_deleted' => 1]);

        return redirect()->route('inventario.computadores')->with('success', 'Computador eliminado exitosamente');
    }
}
