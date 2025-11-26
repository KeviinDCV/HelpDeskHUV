<?php

namespace App\Http\Controllers;

use App\Models\NetworkEquipment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class NetworkEquipmentController extends Controller
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

        // Crear CSV
        $filename = 'dispositivos_red_' . date('Y-m-d_His') . '.csv';
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
            'Última actualización'
        ]);

        // Datos
        foreach ($networkequipments as $equipment) {
            fputcsv($handle, [
                $equipment->name ?? '-',
                $equipment->entity_name ?? '-',
                $equipment->state_name ?? '-',
                $equipment->manufacturer_name ?? '-',
                $equipment->location_name ?? '-',
                $equipment->type_name ?? '-',
                $equipment->model_name ?? '-',
                $equipment->date_mod ? date('Y-m-d H:i', strtotime($equipment->date_mod)) : '-'
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

