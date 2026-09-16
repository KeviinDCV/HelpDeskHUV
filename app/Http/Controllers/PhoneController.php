<?php

namespace App\Http\Controllers;

use App\Models\Phone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Traits\AdvancedFilterable;

class PhoneController extends Controller
{
    use AdvancedFilterable;
    public function index(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 15), 50000);
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');
        $stateFilter = $request->input('state', '');
        $manufacturerFilter = $request->input('manufacturer', '');
        $typeFilter = $request->input('type', '');
        $locationFilter = $request->input('location', '');
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');
        $advancedFiltersJson = $request->input('advanced_filters', '');

        // Mapeo de campos para ordenamiento
        $sortableFields = [
            'name' => 'p.name',
            'entity_name' => 'e.name',
            'state_name' => 's.name',
            'manufacturer_name' => 'mf.name',
            'location_name' => 'l.completename',
            'type_name' => 't.name',
            'model_name' => 'md.name',
            'otherserial' => 'p.otherserial',
            'date_mod' => 'p.date_mod',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'p.name';
        
        $query = DB::table('glpi_phones as p')
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
            ->leftJoin('glpi_phonetypes as t', 'p.phonetypes_id', '=', 't.id')
            ->leftJoin('glpi_phonemodels as md', 'p.phonemodels_id', '=', 'md.id')
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
        if ($typeFilter && $typeFilter !== 'all') { $query->where('p.phonetypes_id', $typeFilter); }
        if ($locationFilter && $locationFilter !== 'all') { $query->where('p.locations_id', $locationFilter); }
        if ($dateFrom) { $query->whereDate('p.date_mod', '>=', $dateFrom); }
        if ($dateTo) { $query->whereDate('p.date_mod', '<=', $dateTo); }

        // Filtros avanzados
        if ($advancedFiltersJson) {
            $advancedFilters = json_decode($advancedFiltersJson, true);
            if (is_array($advancedFilters) && count($advancedFilters) > 0) {
                $this->applyAdvancedFilters($query, $advancedFilters, $this->getPhoneFieldMap());
            }
        }
        
        $phones = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage, 'sort' => $sortField, 'direction' => $sortDirection, 'search' => $search,
                'state' => $stateFilter, 'manufacturer' => $manufacturerFilter, 'type' => $typeFilter,
                'location' => $locationFilter, 'date_from' => $dateFrom, 'date_to' => $dateTo,
                'advanced_filters' => $advancedFiltersJson
            ]);

        $states = DB::table('glpi_states')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $types = DB::table('glpi_phonetypes')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();

        return Inertia::render('inventario/telefonos', [
            'phones' => $phones, 'states' => $states, 'manufacturers' => $manufacturers, 'types' => $types, 'locations' => $locations,
            'filters' => [
                'per_page' => $perPage, 'sort' => $sortField, 'direction' => $sortDirection, 'search' => $search,
                'state' => $stateFilter, 'manufacturer' => $manufacturerFilter, 'type' => $typeFilter,
                'location' => $locationFilter, 'date_from' => $dateFrom, 'date_to' => $dateTo,
                'advanced_filters' => $advancedFiltersJson
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
        $advancedFiltersJson = $request->input('advanced_filters', '');

        $sortableFields = [
            'name' => 'p.name',
            'entity_name' => 'e.name',
            'state_name' => 's.name',
            'manufacturer_name' => 'mf.name',
            'location_name' => 'l.completename',
            'type_name' => 't.name',
            'model_name' => 'md.name',
            'otherserial' => 'p.otherserial',
            'date_mod' => 'p.date_mod',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'p.name';

        $query = DB::table('glpi_phones as p')
            ->select(
                'p.name',
                'e.name as entity_name',
                's.name as state_name',
                'mf.name as manufacturer_name',
                'l.completename as location_name',
                't.name as type_name',
                'md.name as model_name',
                'p.otherserial',
                'p.date_mod'
            )
            ->leftJoin('glpi_entities as e', 'p.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'p.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as mf', 'p.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_locations as l', 'p.locations_id', '=', 'l.id')
            ->leftJoin('glpi_phonetypes as t', 'p.phonetypes_id', '=', 't.id')
            ->leftJoin('glpi_phonemodels as md', 'p.phonemodels_id', '=', 'md.id')
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
        if ($typeFilter && $typeFilter !== 'all') { $query->where('p.phonetypes_id', $typeFilter); }
        if ($locationFilter && $locationFilter !== 'all') { $query->where('p.locations_id', $locationFilter); }
        if ($dateFrom) { $query->whereDate('p.date_mod', '>=', $dateFrom); }
        if ($dateTo) { $query->whereDate('p.date_mod', '<=', $dateTo); }

        // Filtros avanzados
        if ($advancedFiltersJson) {
            $advancedFilters = json_decode($advancedFiltersJson, true);
            if (is_array($advancedFilters) && count($advancedFilters) > 0) {
                $this->applyAdvancedFilters($query, $advancedFilters, $this->getPhoneFieldMap());
            }
        }

        $phones = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear CSV
        $filename = 'telefonos_' . date('Y-m-d_His') . '.csv';
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
            'Nº de inventario'
        ]);

        // Datos
        foreach ($phones as $phone) {
            fputcsv($handle, [
                $phone->name ?? '-',
                $phone->entity_name ?? '-',
                $phone->state_name ?? '-',
                $phone->manufacturer_name ?? '-',
                $phone->location_name ?? '-',
                $phone->type_name ?? '-',
                $phone->model_name ?? '-',
                $phone->date_mod ? date('Y-m-d H:i', strtotime($phone->date_mod)) : '-',
                $phone->otherserial ?? '-'
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
        $types = DB::table('glpi_phonetypes')->select('id', 'name')->orderBy('name')->get();
        $models = DB::table('glpi_phonemodels')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('inventario/crear-telefono', [
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
            'phonetypes_id' => 'nullable',
            'phonemodels_id' => 'nullable',
            'locations_id' => 'nullable',
            'entities_id' => 'nullable',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_phones')->insert([
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
            'phonetypes_id' => !empty($validated['phonetypes_id']) ? (int)$validated['phonetypes_id'] : 0,
            'phonemodels_id' => !empty($validated['phonemodels_id']) ? (int)$validated['phonemodels_id'] : 0,
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
            'phonepowersupplies_id' => 0,
            'number_line' => '',
            'have_headset' => 0,
            'have_hp' => 0,
            'template_name' => '',
            'ticket_tco' => 0,
            'date_creation' => now(),
            'date_mod' => now(),
        ]);

        return redirect()->route('inventario.telefonos')->with('success', 'Teléfono creado exitosamente');
    }

    /**
     * Ficha de un teléfono. No existía: el nombre en el listado y en la búsqueda global
     * enlazaba a esta URL y respondía 405.
     */
    public function show($id)
    {
        $phone = DB::table('glpi_phones as x')
            ->select(
                'x.*',
                's.name as state_name',
                'm.name as manufacturer_name',
                'l.completename as location_name',
                'e.name as entity_name',
                't.name as type_name',
                'md.name as model_name',
                'u_tech.name as tech_user_name',
                'g_tech.name as tech_group_name',
                'u.name as user_name',
                'g.name as group_name'
            )
            ->leftJoin('glpi_entities as e', 'x.entities_id', '=', 'e.id')
            ->leftJoin('glpi_phonetypes as t', 'x.phonetypes_id', '=', 't.id')
            ->leftJoin('glpi_phonemodels as md', 'x.phonemodels_id', '=', 'md.id')
            ->leftJoin('glpi_states as s', 'x.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as m', 'x.manufacturers_id', '=', 'm.id')
            ->leftJoin('glpi_locations as l', 'x.locations_id', '=', 'l.id')
            ->leftJoin('glpi_users as u_tech', 'x.users_id_tech', '=', 'u_tech.id')
            ->leftJoin('glpi_groups as g_tech', 'x.groups_id_tech', '=', 'g_tech.id')
            ->leftJoin('glpi_users as u', 'x.users_id', '=', 'u.id')
            ->leftJoin('glpi_groups as g', 'x.groups_id', '=', 'g.id')
            ->where('x.id', $id)
            ->where('x.is_deleted', 0)
            ->first();

        if (!$phone) {
            abort(404);
        }

        // Computadores a los que está conectado (solo vínculos vigentes)
        $computers = DB::table('glpi_computers_items as ci')
            ->join('glpi_computers as c', 'ci.computers_id', '=', 'c.id')
            ->leftJoin('glpi_locations as l', 'c.locations_id', '=', 'l.id')
            ->select('c.id', 'c.name', 'c.serial', 'l.completename as location_name')
            ->where('ci.items_id', $id)
            ->where('ci.itemtype', 'Phone')
            ->where('ci.is_deleted', 0)
            ->where('c.is_deleted', 0)
            ->orderBy('c.name')
            ->get();

        $tickets = DB::table('glpi_items_tickets as it')
            ->join('glpi_tickets as t', 'it.tickets_id', '=', 't.id')
            ->select('t.id', 't.name', 't.status', 't.date')
            ->where('it.items_id', $id)
            ->where('it.itemtype', 'Phone')
            ->where('t.is_deleted', 0)
            ->orderBy('t.date', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('inventario/ver-telefono', [
            'phone' => $phone,
            'computers' => $computers,
            'tickets' => $tickets,
        ]);
    }

    public function edit($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        $phone = DB::table('glpi_phones')->where('id', $id)->first();
        if (!$phone) {
            abort(404);
        }

        $states = DB::table('glpi_states')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $types = DB::table('glpi_phonetypes')->select('id', 'name')->orderBy('name')->get();
        $models = DB::table('glpi_phonemodels')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('inventario/editar-telefono', [
            'phone' => $phone,
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
            'phonetypes_id' => 'nullable|integer',
            'phonemodels_id' => 'nullable|integer',
            'locations_id' => 'nullable|integer',
            'entities_id' => 'nullable|integer',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_phones')->where('id', $id)->update([
            'name' => $validated['name'],
            'serial' => $validated['serial'] ?? null,
            'otherserial' => $validated['otherserial'] ?? null,
            'states_id' => $validated['states_id'] ?? 0,
            'manufacturers_id' => $validated['manufacturers_id'] ?? 0,
            'phonetypes_id' => $validated['phonetypes_id'] ?? 0,
            'phonemodels_id' => $validated['phonemodels_id'] ?? 0,
            'locations_id' => $validated['locations_id'] ?? 0,
            'entities_id' => $validated['entities_id'] ?? 0,
            'comment' => $validated['comment'] ?? null,
            'date_mod' => now(),
        ]);

        return redirect()->route('inventario.telefonos')->with('success', 'Teléfono actualizado exitosamente');
    }

    public function destroy($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        DB::table('glpi_phones')->where('id', $id)->update(['is_deleted' => 1]);

        return redirect()->route('inventario.telefonos')->with('success', 'Teléfono eliminado exitosamente');
    }

    private function getPhoneFieldMap(): array
    {
        return [
            'nombre' => ['column' => 'p.name', 'type' => 'text'],
            'entidad' => ['column' => 'e.name', 'type' => 'text'],
            'estado' => ['column' => 's.name', 'type' => 'text'],
            'fabricante' => ['column' => 'mf.name', 'type' => 'text'],
            'localizacion' => ['column' => 'l.completename', 'type' => 'text'],
            'tipo' => ['column' => 't.name', 'type' => 'text'],
            'modelo' => ['column' => 'md.name', 'type' => 'text'],
            'fecha_mod' => ['column' => 'p.date_mod', 'type' => 'date'],
            'otherserial' => ['column' => 'p.otherserial', 'type' => 'text'],
            'id' => ['column' => 'p.id', 'type' => 'number'],
        ];
    }
}
