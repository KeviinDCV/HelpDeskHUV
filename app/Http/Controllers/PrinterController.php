<?php

namespace App\Http\Controllers;

use App\Models\Printer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PrinterController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');

        // Mapeo de campos para ordenamiento
        $sortableFields = [
            'name' => 'p.name',
            'entity_name' => 'e.name',
            'manufacturers_id' => 'p.manufacturers_id',
            'locations_id' => 'p.locations_id',
            'states_id' => 'p.states_id',
            'printertypes_id' => 'p.printertypes_id',
            'printermodels_id' => 'p.printermodels_id',
            'date_mod' => 'p.date_mod',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'p.name';
        
        $query = DB::table('glpi_printers as p')
            ->select(
                'p.id',
                'p.name',
                'p.date_mod',
                'e.name as entity_name',
                'st.name as state_name',
                'mf.name as manufacturer_name',
                'l.completename as location_name',
                'pt.name as type_name',
                'pm.name as model_name'
            )
            ->leftJoin('glpi_entities as e', 'p.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as st', 'p.states_id', '=', 'st.id')
            ->leftJoin('glpi_manufacturers as mf', 'p.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_locations as l', 'p.locations_id', '=', 'l.id')
            ->leftJoin('glpi_printertypes as pt', 'p.printertypes_id', '=', 'pt.id')
            ->leftJoin('glpi_printermodels as pm', 'p.printermodels_id', '=', 'pm.id')
            ->where('p.is_deleted', 0);

        // Aplicar búsqueda si existe
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('p.name', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%");
            });
        }
        
        $printers = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search
            ]);

        return Inertia::render('inventario/impresoras', [
            'printers' => $printers,
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
            'name' => 'p.name',
            'entity_name' => 'e.name',
            'manufacturers_id' => 'p.manufacturers_id',
            'locations_id' => 'p.locations_id',
            'states_id' => 'p.states_id',
            'printertypes_id' => 'p.printertypes_id',
            'printermodels_id' => 'p.printermodels_id',
            'date_mod' => 'p.date_mod',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'p.name';
        
        $query = DB::table('glpi_printers as p')
            ->select(
                'p.name',
                'e.name as entity_name',
                'st.name as state_name',
                'mf.name as manufacturer_name',
                'l.completename as location_name',
                'pt.name as type_name',
                'pm.name as model_name',
                'p.date_mod'
            )
            ->leftJoin('glpi_entities as e', 'p.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as st', 'p.states_id', '=', 'st.id')
            ->leftJoin('glpi_manufacturers as mf', 'p.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_locations as l', 'p.locations_id', '=', 'l.id')
            ->leftJoin('glpi_printertypes as pt', 'p.printertypes_id', '=', 'pt.id')
            ->leftJoin('glpi_printermodels as pm', 'p.printermodels_id', '=', 'pm.id')
            ->where('p.is_deleted', 0);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('p.name', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%");
            });
        }

        $printers = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear CSV
        $filename = 'impresoras_' . date('Y-m-d_His') . '.csv';
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
        foreach ($printers as $printer) {
            fputcsv($handle, [
                $printer->name ?? '-',
                $printer->entity_name ?? '-',
                $printer->state_name ?? '-',
                $printer->manufacturer_name ?? '-',
                $printer->location_name ?? '-',
                $printer->type_name ?? '-',
                $printer->model_name ?? '-',
                $printer->date_mod ? date('Y-m-d H:i', strtotime($printer->date_mod)) : '-'
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

