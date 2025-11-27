<?php

namespace App\Http\Controllers;

use App\Models\Monitor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MonitorController extends Controller
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
            'name' => 'm.name',
            'entity_name' => 'e.name',
            'state_name' => 's.name',
            'manufacturer_name' => 'mf.name',
            'location_name' => 'l.completename',
            'type_name' => 't.name',
            'model_name' => 'md.name',
            'date_mod' => 'm.date_mod',
            'otherserial' => 'm.otherserial',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'm.name';
        
        $query = DB::table('glpi_monitors as m')
            ->select(
                'm.id',
                'm.name',
                'm.otherserial',
                'm.date_mod',
                's.name as state_name',
                'mf.name as manufacturer_name',
                'l.completename as location_name',
                't.name as type_name',
                'md.name as model_name',
                'e.name as entity_name'
            )
            ->leftJoin('glpi_entities as e', 'm.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'm.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as mf', 'm.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_locations as l', 'm.locations_id', '=', 'l.id')
            ->leftJoin('glpi_monitortypes as t', 'm.monitortypes_id', '=', 't.id')
            ->leftJoin('glpi_monitormodels as md', 'm.monitormodels_id', '=', 'md.id')
            ->where('m.is_deleted', 0);

        // Aplicar búsqueda si existe
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('m.name', 'LIKE', "%{$search}%")
                  ->orWhere('m.otherserial', 'LIKE', "%{$search}%")
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
            $query->where('m.states_id', $stateFilter);
        }
        if ($manufacturerFilter && $manufacturerFilter !== 'all') {
            $query->where('m.manufacturers_id', $manufacturerFilter);
        }
        if ($typeFilter && $typeFilter !== 'all') {
            $query->where('m.monitortypes_id', $typeFilter);
        }
        if ($locationFilter && $locationFilter !== 'all') {
            $query->where('m.locations_id', $locationFilter);
        }
        if ($dateFrom) {
            $query->whereDate('m.date_mod', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('m.date_mod', '<=', $dateTo);
        }
        
        $monitors = $query->orderBy($orderByField, $sortDirection)
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
        $types = DB::table('glpi_monitortypes')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();

        return Inertia::render('inventario/monitores', [
            'monitors' => $monitors,
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
            'name' => 'm.name',
            'entity_name' => 'e.name',
            'state_name' => 's.name',
            'manufacturer_name' => 'mf.name',
            'location_name' => 'l.completename',
            'type_name' => 't.name',
            'model_name' => 'md.name',
            'date_mod' => 'm.date_mod',
            'otherserial' => 'm.otherserial',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'm.name';
        
        $query = DB::table('glpi_monitors as m')
            ->select(
                'm.name',
                'e.name as entity_name',
                's.name as state_name',
                'mf.name as manufacturer_name',
                'l.completename as location_name',
                't.name as type_name',
                'md.name as model_name',
                'm.date_mod',
                'm.otherserial'
            )
            ->leftJoin('glpi_entities as e', 'm.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'm.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as mf', 'm.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_locations as l', 'm.locations_id', '=', 'l.id')
            ->leftJoin('glpi_monitortypes as t', 'm.monitortypes_id', '=', 't.id')
            ->leftJoin('glpi_monitormodels as md', 'm.monitormodels_id', '=', 'md.id')
            ->where('m.is_deleted', 0);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('m.name', 'LIKE', "%{$search}%")
                  ->orWhere('m.otherserial', 'LIKE', "%{$search}%")
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
            $query->where('m.states_id', $stateFilter);
        }
        if ($manufacturerFilter && $manufacturerFilter !== 'all') {
            $query->where('m.manufacturers_id', $manufacturerFilter);
        }
        if ($typeFilter && $typeFilter !== 'all') {
            $query->where('m.monitortypes_id', $typeFilter);
        }
        if ($locationFilter && $locationFilter !== 'all') {
            $query->where('m.locations_id', $locationFilter);
        }
        if ($dateFrom) {
            $query->whereDate('m.date_mod', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('m.date_mod', '<=', $dateTo);
        }

        $monitors = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear CSV
        $filename = 'monitores_' . date('Y-m-d_His') . '.csv';
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
        foreach ($monitors as $monitor) {
            fputcsv($handle, [
                $monitor->name ?? '-',
                $monitor->entity_name ?? '-',
                $monitor->state_name ?? '-',
                $monitor->manufacturer_name ?? '-',
                $monitor->location_name ?? '-',
                $monitor->type_name ?? '-',
                $monitor->model_name ?? '-',
                $monitor->date_mod ? date('Y-m-d H:i', strtotime($monitor->date_mod)) : '-',
                $monitor->otherserial ?? '-'
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
        $types = DB::table('glpi_monitortypes')->select('id', 'name')->orderBy('name')->get();
        $models = DB::table('glpi_monitormodels')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('inventario/crear-monitor', [
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
            'monitortypes_id' => 'nullable',
            'monitormodels_id' => 'nullable',
            'locations_id' => 'nullable',
            'entities_id' => 'nullable',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_monitors')->insert([
            'name' => $validated['name'],
            'serial' => $validated['serial'] ?: '',
            'otherserial' => $validated['otherserial'] ?: '',
            'contact' => '',
            'contact_num' => '',
            'users_id_tech' => 0,
            'groups_id_tech' => 0,
            'states_id' => !empty($validated['states_id']) ? (int)$validated['states_id'] : 0,
            'manufacturers_id' => !empty($validated['manufacturers_id']) ? (int)$validated['manufacturers_id'] : 0,
            'monitortypes_id' => !empty($validated['monitortypes_id']) ? (int)$validated['monitortypes_id'] : 0,
            'monitormodels_id' => !empty($validated['monitormodels_id']) ? (int)$validated['monitormodels_id'] : 0,
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
            'size' => 0,
            'have_micro' => 0,
            'have_speaker' => 0,
            'have_subd' => 0,
            'have_bnc' => 0,
            'have_dvi' => 0,
            'have_pivot' => 0,
            'have_hdmi' => 0,
            'have_displayport' => 0,
            'template_name' => '',
            'ticket_tco' => 0,
            'date_creation' => now(),
            'date_mod' => now(),
        ]);

        return redirect()->route('inventario.monitores')->with('success', 'Monitor creado exitosamente');
    }

    public function edit($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        $monitor = DB::table('glpi_monitors')->where('id', $id)->first();
        if (!$monitor) {
            abort(404);
        }

        $states = DB::table('glpi_states')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $types = DB::table('glpi_monitortypes')->select('id', 'name')->orderBy('name')->get();
        $models = DB::table('glpi_monitormodels')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('inventario/editar-monitor', [
            'monitor' => $monitor,
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
            'monitortypes_id' => 'nullable|integer',
            'monitormodels_id' => 'nullable|integer',
            'locations_id' => 'nullable|integer',
            'entities_id' => 'nullable|integer',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_monitors')->where('id', $id)->update([
            'name' => $validated['name'],
            'serial' => $validated['serial'] ?? null,
            'otherserial' => $validated['otherserial'] ?? null,
            'states_id' => $validated['states_id'] ?? 0,
            'manufacturers_id' => $validated['manufacturers_id'] ?? 0,
            'monitortypes_id' => $validated['monitortypes_id'] ?? 0,
            'monitormodels_id' => $validated['monitormodels_id'] ?? 0,
            'locations_id' => $validated['locations_id'] ?? 0,
            'entities_id' => $validated['entities_id'] ?? 0,
            'comment' => $validated['comment'] ?? null,
            'date_mod' => now(),
        ]);

        return redirect()->route('inventario.monitores')->with('success', 'Monitor actualizado exitosamente');
    }

    public function destroy($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        DB::table('glpi_monitors')->where('id', $id)->update(['is_deleted' => 1]);

        return redirect()->route('inventario.monitores')->with('success', 'Monitor eliminado exitosamente');
    }
}
