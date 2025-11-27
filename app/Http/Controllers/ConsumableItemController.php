<?php

namespace App\Http\Controllers;

use App\Models\ConsumableItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ConsumableItemController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');
        $typeFilter = $request->input('type', '');
        $manufacturerFilter = $request->input('manufacturer', '');

        // Mapeo de campos para ordenamiento
        $sortableFields = [
            'name' => 'ci.name',
            'entity_name' => 'e.name',
            'ref' => 'ci.ref',
            'type_name' => 't.name',
            'manufacturer_name' => 'mf.name',
            'total' => 'total',
            'tech_name' => 'u.name',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'ci.name';
        
        $query = DB::table('glpi_consumableitems as ci')
            ->select(
                'ci.id',
                'ci.name',
                'ci.ref',
                't.name as type_name',
                'mf.name as manufacturer_name',
                'u.name as tech_name',
                'ci.comment',
                'e.name as entity_name',
                DB::raw('COUNT(c.id) as total'),
                DB::raw('SUM(CASE WHEN c.date_out IS NULL THEN 1 ELSE 0 END) as nuevo'),
                DB::raw('SUM(CASE WHEN c.date_out IS NOT NULL THEN 1 ELSE 0 END) as usado')
            )
            ->leftJoin('glpi_entities as e', 'ci.entities_id', '=', 'e.id')
            ->leftJoin('glpi_consumableitemtypes as t', 'ci.consumableitemtypes_id', '=', 't.id')
            ->leftJoin('glpi_manufacturers as mf', 'ci.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_users as u', 'ci.users_id_tech', '=', 'u.id')
            ->leftJoin('glpi_consumables as c', 'ci.id', '=', 'c.consumableitems_id')
            ->where('ci.is_deleted', 0);

        if ($typeFilter && $typeFilter !== 'all') { $query->where('ci.consumableitemtypes_id', $typeFilter); }
        if ($manufacturerFilter && $manufacturerFilter !== 'all') { $query->where('ci.manufacturers_id', $manufacturerFilter); }

        $query->groupBy('ci.id', 'ci.name', 'ci.ref', 't.name', 'mf.name', 'u.name', 'ci.comment', 'e.name');

        // Aplicar búsqueda si existe
        if ($search) {
            $query->having(DB::raw('LOWER(ci.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(ci.ref)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(e.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(t.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(mf.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(u.name)'), 'LIKE', "%".strtolower($search)."%");
        }
        
        $consumables = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage, 'sort' => $sortField, 'direction' => $sortDirection, 'search' => $search,
                'type' => $typeFilter, 'manufacturer' => $manufacturerFilter
            ]);

        $types = DB::table('glpi_consumableitemtypes')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('inventario/consumibles', [
            'consumables' => $consumables, 'types' => $types, 'manufacturers' => $manufacturers,
            'filters' => [
                'per_page' => $perPage, 'sort' => $sortField, 'direction' => $sortDirection, 'search' => $search,
                'type' => $typeFilter, 'manufacturer' => $manufacturerFilter
            ]
        ]);
    }

    public function export(Request $request)
    {
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');
        $typeFilter = $request->input('type', '');
        $manufacturerFilter = $request->input('manufacturer', '');

        $sortableFields = [
            'name' => 'ci.name',
            'entity_name' => 'e.name',
            'ref' => 'ci.ref',
            'type_name' => 't.name',
            'manufacturer_name' => 'mf.name',
            'total' => 'total',
            'tech_name' => 'u.name',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'ci.name';
        
        $query = DB::table('glpi_consumableitems as ci')
            ->select(
                'ci.name',
                'e.name as entity_name',
                'ci.ref',
                't.name as type_name',
                'mf.name as manufacturer_name',
                'ci.comment',
                'u.name as tech_name',
                DB::raw('COUNT(c.id) as total'),
                DB::raw('SUM(CASE WHEN c.date_out IS NULL THEN 1 ELSE 0 END) as nuevo'),
                DB::raw('SUM(CASE WHEN c.date_out IS NOT NULL THEN 1 ELSE 0 END) as usado')
            )
            ->leftJoin('glpi_entities as e', 'ci.entities_id', '=', 'e.id')
            ->leftJoin('glpi_consumableitemtypes as t', 'ci.consumableitemtypes_id', '=', 't.id')
            ->leftJoin('glpi_manufacturers as mf', 'ci.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_users as u', 'ci.users_id_tech', '=', 'u.id')
            ->leftJoin('glpi_consumables as c', 'ci.id', '=', 'c.consumableitems_id')
            ->where('ci.is_deleted', 0);

        if ($typeFilter && $typeFilter !== 'all') { $query->where('ci.consumableitemtypes_id', $typeFilter); }
        if ($manufacturerFilter && $manufacturerFilter !== 'all') { $query->where('ci.manufacturers_id', $manufacturerFilter); }

        $query->groupBy('ci.id', 'ci.name', 'e.name', 'ci.ref', 't.name', 'mf.name', 'ci.comment', 'u.name');

        if ($search) {
            $query->having(DB::raw('LOWER(ci.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(ci.ref)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(e.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(t.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(mf.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(u.name)'), 'LIKE', "%".strtolower($search)."%");
        }

        $consumables = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear CSV
        $filename = 'consumibles_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'r+');
        
        // Agregar BOM para UTF-8
        fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Headers
        fputcsv($handle, [
            'Nombre',
            'Entidad',
            'Referencia',
            'Tipo',
            'Fabricante',
            'Consumibles',
            'Comentarios',
            'Técnico a cargo'
        ]);

        // Datos
        foreach ($consumables as $consumable) {
            $consumiblesInfo = "Total: {$consumable->total}, Nuevo: {$consumable->nuevo}, Usado: {$consumable->usado}";
            
            fputcsv($handle, [
                $consumable->name ?? '-',
                $consumable->entity_name ?? '-',
                $consumable->ref ?? '-',
                $consumable->type_name ?? '-',
                $consumable->manufacturer_name ?? '-',
                $consumiblesInfo,
                $consumable->comment ?? '-',
                $consumable->tech_name ?? '-'
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
        $types = DB::table('glpi_consumableitemtypes')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();

        return Inertia::render('inventario/crear-consumible', [
            'types' => $types,
            'manufacturers' => $manufacturers,
            'entities' => $entities,
            'locations' => $locations,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'ref' => 'nullable|string|max:255',
            'consumableitemtypes_id' => 'nullable',
            'manufacturers_id' => 'nullable',
            'entities_id' => 'nullable',
            'locations_id' => 'nullable',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_consumableitems')->insert([
            'name' => $validated['name'],
            'ref' => $validated['ref'] ?: '',
            'consumableitemtypes_id' => !empty($validated['consumableitemtypes_id']) ? (int)$validated['consumableitemtypes_id'] : 0,
            'manufacturers_id' => !empty($validated['manufacturers_id']) ? (int)$validated['manufacturers_id'] : 0,
            'entities_id' => !empty($validated['entities_id']) ? (int)$validated['entities_id'] : 0,
            'locations_id' => !empty($validated['locations_id']) ? (int)$validated['locations_id'] : 0,
            'comment' => $validated['comment'] ?: '',
            'users_id_tech' => 0,
            'groups_id_tech' => 0,
            'is_deleted' => 0,
            'is_recursive' => 0,
            'alarm_threshold' => 10,
            'date_creation' => now(),
            'date_mod' => now(),
        ]);

        return redirect()->route('inventario.consumibles')->with('success', 'Consumible creado exitosamente');
    }

    public function edit($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        $consumable = DB::table('glpi_consumableitems')->where('id', $id)->first();
        if (!$consumable) {
            abort(404);
        }

        $types = DB::table('glpi_consumableitemtypes')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();

        return Inertia::render('inventario/editar-consumible', [
            'consumable' => $consumable,
            'types' => $types,
            'manufacturers' => $manufacturers,
            'entities' => $entities,
            'locations' => $locations,
        ]);
    }

    public function update(Request $request, $id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'ref' => 'nullable|string|max:255',
            'consumableitemtypes_id' => 'nullable|integer',
            'manufacturers_id' => 'nullable|integer',
            'entities_id' => 'nullable|integer',
            'locations_id' => 'nullable|integer',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_consumableitems')->where('id', $id)->update([
            'name' => $validated['name'],
            'ref' => $validated['ref'] ?? null,
            'consumableitemtypes_id' => $validated['consumableitemtypes_id'] ?? 0,
            'manufacturers_id' => $validated['manufacturers_id'] ?? 0,
            'entities_id' => $validated['entities_id'] ?? 0,
            'locations_id' => $validated['locations_id'] ?? 0,
            'comment' => $validated['comment'] ?? null,
            'date_mod' => now(),
        ]);

        return redirect()->route('inventario.consumibles')->with('success', 'Consumible actualizado exitosamente');
    }

    public function destroy($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        DB::table('glpi_consumableitems')->where('id', $id)->update(['is_deleted' => 1]);

        return redirect()->route('inventario.consumibles')->with('success', 'Consumible eliminado exitosamente');
    }
}
