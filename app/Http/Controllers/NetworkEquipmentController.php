<?php

namespace App\Http\Controllers;

use App\Models\NetworkEquipment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use App\Traits\ExcelExportStyles;

class NetworkEquipmentController extends Controller
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
            'name' => 'n.name',
            'entity_name' => 'e.name',
            'state_name' => 's.name',
            'manufacturer_name' => 'mf.name',
            'location_name' => 'l.completename',
            'type_name' => 't.name',
            'model_name' => 'md.name',
            'date_mod' => 'n.date_mod',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'n.name';
        
        $query = DB::table('glpi_networkequipments as n')
            ->select(
                'n.id',
                'n.name',
                'n.date_mod',
                's.name as state_name',
                'mf.name as manufacturer_name',
                'l.completename as location_name',
                't.name as type_name',
                'md.name as model_name',
                'e.name as entity_name'
            )
            ->leftJoin('glpi_entities as e', 'n.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'n.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as mf', 'n.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_locations as l', 'n.locations_id', '=', 'l.id')
            ->leftJoin('glpi_networkequipmenttypes as t', 'n.networkequipmenttypes_id', '=', 't.id')
            ->leftJoin('glpi_networkequipmentmodels as md', 'n.networkequipmentmodels_id', '=', 'md.id')
            ->where('n.is_deleted', 0);

        // Aplicar búsqueda si existe
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('n.name', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%")
                  ->orWhere('s.name', 'LIKE', "%{$search}%")
                  ->orWhere('mf.name', 'LIKE', "%{$search}%")
                  ->orWhere('l.completename', 'LIKE', "%{$search}%")
                  ->orWhere('t.name', 'LIKE', "%{$search}%")
                  ->orWhere('md.name', 'LIKE', "%{$search}%");
            });
        }

        // Aplicar filtros
        if ($stateFilter && $stateFilter !== 'all') {
            $query->where('n.states_id', $stateFilter);
        }
        if ($manufacturerFilter && $manufacturerFilter !== 'all') {
            $query->where('n.manufacturers_id', $manufacturerFilter);
        }
        if ($typeFilter && $typeFilter !== 'all') {
            $query->where('n.networkequipmenttypes_id', $typeFilter);
        }
        if ($locationFilter && $locationFilter !== 'all') {
            $query->where('n.locations_id', $locationFilter);
        }
        if ($dateFrom) {
            $query->whereDate('n.date_mod', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('n.date_mod', '<=', $dateTo);
        }
        
        $networkequipments = $query->orderBy($orderByField, $sortDirection)
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
        $types = DB::table('glpi_networkequipmenttypes')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();

        return Inertia::render('inventario/dispositivos-red', [
            'networkequipments' => $networkequipments,
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
            'name' => 'n.name',
            'entity_name' => 'e.name',
            'state_name' => 's.name',
            'manufacturer_name' => 'mf.name',
            'location_name' => 'l.completename',
            'type_name' => 't.name',
            'model_name' => 'md.name',
            'date_mod' => 'n.date_mod',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'n.name';
        
        $query = DB::table('glpi_networkequipments as n')
            ->select(
                'n.name',
                'e.name as entity_name',
                's.name as state_name',
                'mf.name as manufacturer_name',
                'l.completename as location_name',
                't.name as type_name',
                'md.name as model_name',
                'n.date_mod'
            )
            ->leftJoin('glpi_entities as e', 'n.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'n.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as mf', 'n.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_locations as l', 'n.locations_id', '=', 'l.id')
            ->leftJoin('glpi_networkequipmenttypes as t', 'n.networkequipmenttypes_id', '=', 't.id')
            ->leftJoin('glpi_networkequipmentmodels as md', 'n.networkequipmentmodels_id', '=', 'md.id')
            ->where('n.is_deleted', 0);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('n.name', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%")
                  ->orWhere('s.name', 'LIKE', "%{$search}%")
                  ->orWhere('mf.name', 'LIKE', "%{$search}%")
                  ->orWhere('l.completename', 'LIKE', "%{$search}%")
                  ->orWhere('t.name', 'LIKE', "%{$search}%")
                  ->orWhere('md.name', 'LIKE', "%{$search}%");
            });
        }

        // Aplicar filtros
        if ($stateFilter && $stateFilter !== 'all') {
            $query->where('n.states_id', $stateFilter);
        }
        if ($manufacturerFilter && $manufacturerFilter !== 'all') {
            $query->where('n.manufacturers_id', $manufacturerFilter);
        }
        if ($typeFilter && $typeFilter !== 'all') {
            $query->where('n.networkequipmenttypes_id', $typeFilter);
        }
        if ($locationFilter && $locationFilter !== 'all') {
            $query->where('n.locations_id', $locationFilter);
        }
        if ($dateFrom) {
            $query->whereDate('n.date_mod', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('n.date_mod', '<=', $dateTo);
        }

        $networkequipments = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear Excel
        $spreadsheet = new Spreadsheet();
        $this->setDocumentProperties($spreadsheet, 'Inventario de Equipos de Red', 'Listado de dispositivos de red');
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Dispositivos Red');

        $this->createDocumentHeader($sheet, 'HELPDESK HUV - DISPOSITIVOS DE RED', 'Hospital Universitario del Valle - Gestión de Activos TI', 'H', '');

        $row = 5;
        $total = $networkequipments->count();
        $sheet->setCellValue("A{$row}", "📊 TOTAL: {$total} dispositivos de red registrados");
        $sheet->mergeCells("A{$row}:H{$row}");
        $this->applySectionStyle($sheet, "A{$row}:H{$row}");
        $sheet->getRowDimension($row)->setRowHeight(28);

        $row = 7;
        $headers = ['Nombre', 'Entidad', 'Estado', 'Fabricante', 'Localización', 'Tipo', 'Modelo', 'Últ. Actualización'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue("{$col}{$row}", $header);
            $col++;
        }
        $this->applyHeaderStyle($sheet, "A{$row}:H{$row}");
        $sheet->getRowDimension($row)->setRowHeight(25);

        $row++;
        $startDataRow = $row;
        foreach ($networkequipments as $equipment) {
            $sheet->setCellValue("A{$row}", $equipment->name ?? '-');
            $sheet->setCellValue("B{$row}", $equipment->entity_name ?? '-');
            $sheet->setCellValue("C{$row}", $equipment->state_name ?? '-');
            $sheet->setCellValue("D{$row}", $equipment->manufacturer_name ?? '-');
            $sheet->setCellValue("E{$row}", $equipment->location_name ?? '-');
            $sheet->setCellValue("F{$row}", $equipment->type_name ?? '-');
            $sheet->setCellValue("G{$row}", $equipment->model_name ?? '-');
            $sheet->setCellValue("H{$row}", $equipment->date_mod ? date('d/m/Y H:i', strtotime($equipment->date_mod)) : '-');
            $row++;
        }

        $this->applyAlternateRowStyles($sheet, $startDataRow, $row - 1, 'A', 'H');
        $this->autoSizeColumns($sheet, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);

        $filename = 'DispositivosRed_HelpDesk_' . date('Y-m-d_His') . '.xlsx';
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
        $types = DB::table('glpi_networkequipmenttypes')->select('id', 'name')->orderBy('name')->get();
        $models = DB::table('glpi_networkequipmentmodels')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('inventario/crear-dispositivo-red', [
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
            'networkequipmenttypes_id' => 'nullable',
            'networkequipmentmodels_id' => 'nullable',
            'locations_id' => 'nullable',
            'entities_id' => 'nullable',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_networkequipments')->insert([
            'name' => $validated['name'],
            'serial' => $validated['serial'] ?: '',
            'otherserial' => $validated['otherserial'] ?: '',
            'ram' => '',
            'contact' => '',
            'contact_num' => '',
            'users_id_tech' => 0,
            'groups_id_tech' => 0,
            'states_id' => !empty($validated['states_id']) ? (int)$validated['states_id'] : 0,
            'manufacturers_id' => !empty($validated['manufacturers_id']) ? (int)$validated['manufacturers_id'] : 0,
            'networkequipmenttypes_id' => !empty($validated['networkequipmenttypes_id']) ? (int)$validated['networkequipmenttypes_id'] : 0,
            'networkequipmentmodels_id' => !empty($validated['networkequipmentmodels_id']) ? (int)$validated['networkequipmentmodels_id'] : 0,
            'locations_id' => !empty($validated['locations_id']) ? (int)$validated['locations_id'] : 0,
            'entities_id' => !empty($validated['entities_id']) ? (int)$validated['entities_id'] : 0,
            'comment' => $validated['comment'] ?: '',
            'is_deleted' => 0,
            'is_template' => 0,
            'is_dynamic' => 0,
            'is_recursive' => 0,
            'users_id' => 0,
            'groups_id' => 0,
            'domains_id' => 0,
            'networks_id' => 0,
            'template_name' => '',
            'ticket_tco' => 0,
            'date_creation' => now(),
            'date_mod' => now(),
        ]);

        return redirect()->route('inventario.dispositivos-red')->with('success', 'Dispositivo de red creado exitosamente');
    }

    public function show($id)
    {
        $networkequipment = DB::table('glpi_networkequipments as n')
            ->select(
                'n.*',
                's.name as state_name',
                'm.name as manufacturer_name',
                'l.completename as location_name',
                'e.name as entity_name',
                't.name as type_name',
                'md.name as model_name'
            )
            ->leftJoin('glpi_entities as e', 'n.entities_id', '=', 'e.id')
            ->leftJoin('glpi_networkequipmenttypes as t', 'n.networkequipmenttypes_id', '=', 't.id')
            ->leftJoin('glpi_networkequipmentmodels as md', 'n.networkequipmentmodels_id', '=', 'md.id')
            ->leftJoin('glpi_states as s', 'n.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as m', 'n.manufacturers_id', '=', 'm.id')
            ->leftJoin('glpi_locations as l', 'n.locations_id', '=', 'l.id')
            ->where('n.id', $id)
            ->where('n.is_deleted', 0)
            ->first();

        if (!$networkequipment) {
            abort(404);
        }

        // Obtener tickets relacionados
        $tickets = DB::table('glpi_items_tickets as it')
            ->join('glpi_tickets as t', 'it.tickets_id', '=', 't.id')
            ->select('t.id', 't.name', 't.status', 't.date')
            ->where('it.items_id', $id)
            ->where('it.itemtype', 'NetworkEquipment')
            ->where('t.is_deleted', 0)
            ->orderBy('t.date', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('inventario/ver-dispositivo-red', [
            'networkequipment' => $networkequipment,
            'tickets' => $tickets,
        ]);
    }

    public function edit($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        $networkequipment = DB::table('glpi_networkequipments')->where('id', $id)->first();
        if (!$networkequipment) {
            abort(404);
        }

        $states = DB::table('glpi_states')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $types = DB::table('glpi_networkequipmenttypes')->select('id', 'name')->orderBy('name')->get();
        $models = DB::table('glpi_networkequipmentmodels')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('inventario/editar-dispositivo-red', [
            'networkequipment' => $networkequipment,
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
            'networkequipmenttypes_id' => 'nullable|integer',
            'networkequipmentmodels_id' => 'nullable|integer',
            'locations_id' => 'nullable|integer',
            'entities_id' => 'nullable|integer',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_networkequipments')->where('id', $id)->update([
            'name' => $validated['name'],
            'serial' => $validated['serial'] ?? null,
            'otherserial' => $validated['otherserial'] ?? null,
            'states_id' => $validated['states_id'] ?? 0,
            'manufacturers_id' => $validated['manufacturers_id'] ?? 0,
            'networkequipmenttypes_id' => $validated['networkequipmenttypes_id'] ?? 0,
            'networkequipmentmodels_id' => $validated['networkequipmentmodels_id'] ?? 0,
            'locations_id' => $validated['locations_id'] ?? 0,
            'entities_id' => $validated['entities_id'] ?? 0,
            'comment' => $validated['comment'] ?? null,
            'date_mod' => now(),
        ]);

        return redirect()->route('inventario.dispositivos-red')->with('success', 'Dispositivo de red actualizado exitosamente');
    }

    public function destroy($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        DB::table('glpi_networkequipments')->where('id', $id)->update(['is_deleted' => 1]);

        return redirect()->route('inventario.dispositivos-red')->with('success', 'Dispositivo de red eliminado exitosamente');
    }
}
