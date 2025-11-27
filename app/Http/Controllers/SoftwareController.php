<?php

namespace App\Http\Controllers;

use App\Models\Software;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SoftwareController extends Controller
{
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
        
        $query = DB::table('glpi_softwares as s')
            ->select(
                's.id',
                's.name',
                'm.name as manufacturer_name',
                'e.name as entity_name',
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

        // Aplicar búsqueda si existe
        if ($search) {
            $query->having(DB::raw('LOWER(s.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(e.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(m.name)'), 'LIKE', "%".strtolower($search)."%");
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

        // Obtener datos para filtros
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();

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

        // Crear CSV
        $filename = 'programas_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'r+');
        
        // Agregar BOM para UTF-8
        fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Headers
        fputcsv($handle, [
            'Nombre',
            'Entidad',
            'Editor',
            'Número de versiones',
            'Número de instalaciones',
            'Número de licencias'
        ]);

        // Datos
        foreach ($softwares as $software) {
            fputcsv($handle, [
                $software->name ?? '-',
                $software->entity_name ?? '-',
                $software->manufacturer_name ?? '-',
                $software->num_versions ?? '0',
                $software->num_installations ?? '0',
                $software->num_licenses ?? '0'
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
