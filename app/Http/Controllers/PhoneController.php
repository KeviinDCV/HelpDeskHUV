<?php

namespace App\Http\Controllers;

use App\Models\Phone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PhoneController extends Controller
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
        
        $phones = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage, 'sort' => $sortField, 'direction' => $sortDirection, 'search' => $search,
                'state' => $stateFilter, 'manufacturer' => $manufacturerFilter, 'type' => $typeFilter,
                'location' => $locationFilter, 'date_from' => $dateFrom, 'date_to' => $dateTo
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
            'Nombre de usuario alternativo'
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
}
