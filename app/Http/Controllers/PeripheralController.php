<?php

namespace App\Http\Controllers;

use App\Models\Peripheral;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PeripheralController extends Controller
{
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
            'name' => 'p.name',
            'entity_name' => 'e.name',
            'state_name' => 's.name',
            'manufacturer_name' => 'mf.name',
            'location_name' => 'l.completename',
            'type_name' => 't.name',
            'model_name' => 'md.name',
            'date_mod' => 'p.date_mod',
            'otherserial' => 'p.otherserial',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'p.name';
        
        $query = DB::table('glpi_peripherals as p')
            ->select(
                'p.id',
                'p.name',
                'p.date_mod',
                's.name as state_name',
                'mf.name as manufacturer_name',
                'l.completename as location_name',
                't.name as type_name',
                'md.name as model_name',
                'p.otherserial',
                'e.name as entity_name'
            )
            ->leftJoin('glpi_entities as e', 'p.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'p.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as mf', 'p.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_locations as l', 'p.locations_id', '=', 'l.id')
            ->leftJoin('glpi_peripheraltypes as t', 'p.peripheraltypes_id', '=', 't.id')
            ->leftJoin('glpi_peripheralmodels as md', 'p.peripheralmodels_id', '=', 'md.id')
            ->where('p.is_deleted', 0);

        // Aplicar búsqueda si existe
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('p.name', 'LIKE', "%{$search}%")
                  ->orWhere('p.otherserial', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%")
                  ->orWhere('s.name', 'LIKE', "%{$search}%")
                  ->orWhere('mf.name', 'LIKE', "%{$search}%")
                  ->orWhere('l.completename', 'LIKE', "%{$search}%")
                  ->orWhere('t.name', 'LIKE', "%{$search}%")
                  ->orWhere('md.name', 'LIKE', "%{$search}%");
            });
        }

        if ($stateFilter && $stateFilter !== 'all') { $query->where('p.states_id', $stateFilter); }
        if ($manufacturerFilter && $manufacturerFilter !== 'all') { $query->where('p.manufacturers_id', $manufacturerFilter); }
        if ($typeFilter && $typeFilter !== 'all') { $query->where('p.peripheraltypes_id', $typeFilter); }
        if ($locationFilter && $locationFilter !== 'all') { $query->where('p.locations_id', $locationFilter); }
        if ($dateFrom) { $query->whereDate('p.date_mod', '>=', $dateFrom); }
        if ($dateTo) { $query->whereDate('p.date_mod', '<=', $dateTo); }
        
        $peripherals = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage, 'sort' => $sortField, 'direction' => $sortDirection, 'search' => $search,
                'state' => $stateFilter, 'manufacturer' => $manufacturerFilter, 'type' => $typeFilter,
                'location' => $locationFilter, 'date_from' => $dateFrom, 'date_to' => $dateTo
            ]);

        $states = DB::table('glpi_states')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $types = DB::table('glpi_peripheraltypes')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();

        return Inertia::render('inventario/dispositivos', [
            'peripherals' => $peripherals, 'states' => $states, 'manufacturers' => $manufacturers, 'types' => $types, 'locations' => $locations,
            'filters' => [
                'per_page' => $perPage, 'sort' => $sortField, 'direction' => $sortDirection, 'search' => $search,
                'state' => $stateFilter, 'manufacturer' => $manufacturerFilter, 'type' => $typeFilter,
                'location' => $locationFilter, 'date_from' => $dateFrom, 'date_to' => $dateTo
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
            'name' => 'p.name',
            'entity_name' => 'e.name',
            'state_name' => 's.name',
            'manufacturer_name' => 'mf.name',
            'location_name' => 'l.completename',
            'type_name' => 't.name',
            'model_name' => 'md.name',
            'date_mod' => 'p.date_mod',
            'otherserial' => 'p.otherserial',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'p.name';
        
        $query = DB::table('glpi_peripherals as p')
            ->select(
                'p.name',
                'e.name as entity_name',
                's.name as state_name',
                'mf.name as manufacturer_name',
                'l.completename as location_name',
                't.name as type_name',
                'md.name as model_name',
                'p.date_mod',
                'p.otherserial'
            )
            ->leftJoin('glpi_entities as e', 'p.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'p.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as mf', 'p.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_locations as l', 'p.locations_id', '=', 'l.id')
            ->leftJoin('glpi_peripheraltypes as t', 'p.peripheraltypes_id', '=', 't.id')
            ->leftJoin('glpi_peripheralmodels as md', 'p.peripheralmodels_id', '=', 'md.id')
            ->where('p.is_deleted', 0);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('p.name', 'LIKE', "%{$search}%")
                  ->orWhere('p.otherserial', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%")
                  ->orWhere('s.name', 'LIKE', "%{$search}%")
                  ->orWhere('mf.name', 'LIKE', "%{$search}%")
                  ->orWhere('l.completename', 'LIKE', "%{$search}%")
                  ->orWhere('t.name', 'LIKE', "%{$search}%")
                  ->orWhere('md.name', 'LIKE', "%{$search}%");
            });
        }

        if ($stateFilter && $stateFilter !== 'all') { $query->where('p.states_id', $stateFilter); }
        if ($manufacturerFilter && $manufacturerFilter !== 'all') { $query->where('p.manufacturers_id', $manufacturerFilter); }
        if ($typeFilter && $typeFilter !== 'all') { $query->where('p.peripheraltypes_id', $typeFilter); }
        if ($locationFilter && $locationFilter !== 'all') { $query->where('p.locations_id', $locationFilter); }
        if ($dateFrom) { $query->whereDate('p.date_mod', '>=', $dateFrom); }
        if ($dateTo) { $query->whereDate('p.date_mod', '<=', $dateTo); }

        $peripherals = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear CSV
        $filename = 'dispositivos_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'r+');
        
        // Agregar BOM para UTF-8
        fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Headers
        fputcsv($handle, [
            'Nombre',
            'Entidad',
            'Estado',
            'Fabricante',
            'Localización',
            'Tipo',
            'Modelo',
            'Última actualización',
            'Nombre de usuario alternativo'
        ]);

        // Datos
        foreach ($peripherals as $peripheral) {
            fputcsv($handle, [
                $peripheral->name ?? '-',
                $peripheral->entity_name ?? '-',
                $peripheral->state_name ?? '-',
                $peripheral->manufacturer_name ?? '-',
                $peripheral->location_name ?? '-',
                $peripheral->type_name ?? '-',
                $peripheral->model_name ?? '-',
                $peripheral->date_mod ? date('Y-m-d H:i', strtotime($peripheral->date_mod)) : '-',
                $peripheral->otherserial ?? '-'
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    public function create()
    {
        $states = DB::table('glpi_states')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $types = DB::table('glpi_peripheraltypes')->select('id', 'name')->orderBy('name')->get();
        $models = DB::table('glpi_peripheralmodels')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('inventario/crear-dispositivo', [
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
            'peripheraltypes_id' => 'nullable',
            'peripheralmodels_id' => 'nullable',
            'locations_id' => 'nullable',
            'entities_id' => 'nullable',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_peripherals')->insert([
            'name' => $validated['name'],
            'serial' => $validated['serial'] ?: '',
            'otherserial' => $validated['otherserial'] ?: '',
            'contact' => '',
            'contact_num' => '',
            'brand' => '',
            'users_id_tech' => 0,
            'groups_id_tech' => 0,
            'states_id' => !empty($validated['states_id']) ? (int)$validated['states_id'] : 0,
            'manufacturers_id' => !empty($validated['manufacturers_id']) ? (int)$validated['manufacturers_id'] : 0,
            'peripheraltypes_id' => !empty($validated['peripheraltypes_id']) ? (int)$validated['peripheraltypes_id'] : 0,
            'peripheralmodels_id' => !empty($validated['peripheralmodels_id']) ? (int)$validated['peripheralmodels_id'] : 0,
            'locations_id' => !empty($validated['locations_id']) ? (int)$validated['locations_id'] : 0,
            'entities_id' => !empty($validated['entities_id']) ? (int)$validated['entities_id'] : 0,
            'comment' => $validated['comment'] ?: '',
            'is_deleted' => 0,
            'is_template' => 0,
            'is_dynamic' => 0,
            'is_recursive' => 0,
            'is_global' => 0,
            'users_id' => 0,
            'groups_id' => 0,
            'template_name' => '',
            'ticket_tco' => 0,
            'date_creation' => now(),
            'date_mod' => now(),
        ]);

        return redirect()->route('inventario.dispositivos')->with('success', 'Dispositivo creado exitosamente');
    }

    public function edit($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        $peripheral = DB::table('glpi_peripherals')->where('id', $id)->first();
        if (!$peripheral) {
            abort(404);
        }

        $states = DB::table('glpi_states')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $types = DB::table('glpi_peripheraltypes')->select('id', 'name')->orderBy('name')->get();
        $models = DB::table('glpi_peripheralmodels')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('inventario/editar-dispositivo', [
            'peripheral' => $peripheral,
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
            'peripheraltypes_id' => 'nullable|integer',
            'peripheralmodels_id' => 'nullable|integer',
            'locations_id' => 'nullable|integer',
            'entities_id' => 'nullable|integer',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_peripherals')->where('id', $id)->update([
            'name' => $validated['name'],
            'serial' => $validated['serial'] ?? null,
            'otherserial' => $validated['otherserial'] ?? null,
            'states_id' => $validated['states_id'] ?? 0,
            'manufacturers_id' => $validated['manufacturers_id'] ?? 0,
            'peripheraltypes_id' => $validated['peripheraltypes_id'] ?? 0,
            'peripheralmodels_id' => $validated['peripheralmodels_id'] ?? 0,
            'locations_id' => $validated['locations_id'] ?? 0,
            'entities_id' => $validated['entities_id'] ?? 0,
            'comment' => $validated['comment'] ?? null,
            'date_mod' => now(),
        ]);

        return redirect()->route('inventario.dispositivos')->with('success', 'Dispositivo actualizado exitosamente');
    }

    public function destroy($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        DB::table('glpi_peripherals')->where('id', $id)->update(['is_deleted' => 1]);

        return redirect()->route('inventario.dispositivos')->with('success', 'Dispositivo eliminado exitosamente');
    }
}
