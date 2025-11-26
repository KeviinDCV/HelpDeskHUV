<?php

namespace App\Http\Controllers;

use App\Models\Computer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ComputerController extends Controller
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

        // Crear CSV
        $filename = 'computadores_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'r+');
        
        // Agregar BOM para UTF-8
        fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Headers
        fputcsv($handle, [
            'Nombre',
            'Entidad',
            'Estado',
            'Fabricante',
            'Número de serie',
            'Tipo',
            'Modelo',
            'Localización',
            'Última actualización'
        ]);

        // Datos
        foreach ($computers as $computer) {
            fputcsv($handle, [
                $computer->name ?? '-',
                $computer->entity_name ?? '-',
                $computer->state_name ?? '-',
                $computer->manufacturer_name ?? '-',
                $computer->serial ?? '-',
                $computer->type_name ?? '-',
                $computer->model_name ?? '-',
                $computer->location_name ?? '-',
                $computer->date_mod ? date('Y-m-d H:i', strtotime($computer->date_mod)) : '-'
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
