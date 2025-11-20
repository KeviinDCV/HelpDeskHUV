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

        // Mapeo de campos para ordenamiento
        $sortableFields = [
            'name' => 's.name',
            'entity_name' => 'e.name',
            'manufacturers_id' => 's.manufacturers_id',
            'num_versions' => 'num_versions',
            'num_installations' => 'num_installations',
            'num_licenses' => 'num_licenses',
        ];

        $orderByField = $sortableFields[$sortField] ?? 's.name';
        
        $query = DB::table('glpi_softwares as s')
            ->select(
                's.id',
                's.name',
                's.manufacturers_id',
                'e.name as entity_name',
                DB::raw('COUNT(DISTINCT sv.id) as num_versions'),
                DB::raw('COUNT(DISTINCT csv.id) as num_installations'),
                DB::raw('COALESCE(SUM(sl.number), 0) as num_licenses')
            )
            ->leftJoin('glpi_entities as e', 's.entities_id', '=', 'e.id')
            ->leftJoin('glpi_softwareversions as sv', 's.id', '=', 'sv.softwares_id')
            ->leftJoin('glpi_computers_softwareversions as csv', 'sv.id', '=', 'csv.softwareversions_id')
            ->leftJoin('glpi_softwarelicenses as sl', 's.id', '=', 'sl.softwares_id')
            ->where('s.is_deleted', 0)
            ->groupBy('s.id', 's.name', 's.manufacturers_id', 'e.name');

        // Aplicar búsqueda si existe
        if ($search) {
            $query->having(DB::raw('LOWER(s.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(e.name)'), 'LIKE', "%".strtolower($search)."%");
        }
        
        $softwares = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search
            ]);

        return Inertia::render('inventario/programas', [
            'softwares' => $softwares,
            'filters' => [
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search
            ]
        ]);
    }

    public function export(Request $request)
    {
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');

        $sortableFields = [
            'name' => 's.name',
            'entity_name' => 'e.name',
            'manufacturers_id' => 's.manufacturers_id',
            'num_versions' => 'num_versions',
            'num_installations' => 'num_installations',
            'num_licenses' => 'num_licenses',
        ];

        $orderByField = $sortableFields[$sortField] ?? 's.name';
        
        $query = DB::table('glpi_softwares as s')
            ->select(
                's.name',
                'e.name as entity_name',
                's.manufacturers_id',
                DB::raw('COUNT(DISTINCT sv.id) as num_versions'),
                DB::raw('COUNT(DISTINCT csv.id) as num_installations'),
                DB::raw('COALESCE(SUM(sl.number), 0) as num_licenses')
            )
            ->leftJoin('glpi_entities as e', 's.entities_id', '=', 'e.id')
            ->leftJoin('glpi_softwareversions as sv', 's.id', '=', 'sv.softwares_id')
            ->leftJoin('glpi_computers_softwareversions as csv', 'sv.id', '=', 'csv.softwareversions_id')
            ->leftJoin('glpi_softwarelicenses as sl', 's.id', '=', 'sl.softwares_id')
            ->where('s.is_deleted', 0)
            ->groupBy('s.id', 's.name', 's.manufacturers_id', 'e.name');

        if ($search) {
            $query->having(DB::raw('LOWER(s.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(e.name)'), 'LIKE', "%".strtolower($search)."%");
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
                $software->manufacturers_id ?? '-',
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
}

