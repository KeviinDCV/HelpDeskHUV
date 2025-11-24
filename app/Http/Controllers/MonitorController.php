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
        
        $monitors = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search
            ]);

        return Inertia::render('inventario/monitores', [
            'monitors' => $monitors,
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
}

