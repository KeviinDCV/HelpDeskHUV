<?php

namespace App\Http\Controllers;

use App\Models\Peripheral;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PeripheralController extends Controller
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
            'peripheraltypes_id' => 'p.peripheraltypes_id',
            'peripheralmodels_id' => 'p.peripheralmodels_id',
            'date_mod' => 'p.date_mod',
            'otherserial' => 'p.otherserial',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'p.name';
        
        $query = DB::table('glpi_peripherals as p')
            ->select(
                'p.id',
                'p.name',
                'p.date_mod',
                'p.otherserial',
                'e.name as entity_name',
                'mf.name as manufacturer_name',
                'l.completename as location_name',
                'pt.name as type_name',
                'pm.name as model_name'
            )
            ->leftJoin('glpi_entities as e', 'p.entities_id', '=', 'e.id')
            ->leftJoin('glpi_manufacturers as mf', 'p.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_locations as l', 'p.locations_id', '=', 'l.id')
            ->leftJoin('glpi_peripheraltypes as pt', 'p.peripheraltypes_id', '=', 'pt.id')
            ->leftJoin('glpi_peripheralmodels as pm', 'p.peripheralmodels_id', '=', 'pm.id')
            ->where('p.is_deleted', 0);

        // Aplicar búsqueda si existe
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('p.name', 'LIKE', "%{$search}%")
                  ->orWhere('p.otherserial', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%");
            });
        }
        
        $peripherals = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search
            ]);

        return Inertia::render('inventario/dispositivos', [
            'peripherals' => $peripherals,
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
            'peripheraltypes_id' => 'p.peripheraltypes_id',
            'peripheralmodels_id' => 'p.peripheralmodels_id',
            'date_mod' => 'p.date_mod',
            'otherserial' => 'p.otherserial',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'p.name';
        
        $query = DB::table('glpi_peripherals as p')
            ->select(
                'p.name',
                'e.name as entity_name',
                'mf.name as manufacturer_name',
                'l.completename as location_name',
                'pt.name as type_name',
                'pm.name as model_name',
                'p.date_mod',
                'p.otherserial'
            )
            ->leftJoin('glpi_entities as e', 'p.entities_id', '=', 'e.id')
            ->leftJoin('glpi_manufacturers as mf', 'p.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_locations as l', 'p.locations_id', '=', 'l.id')
            ->leftJoin('glpi_peripheraltypes as pt', 'p.peripheraltypes_id', '=', 'pt.id')
            ->leftJoin('glpi_peripheralmodels as pm', 'p.peripheralmodels_id', '=', 'pm.id')
            ->where('p.is_deleted', 0);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('p.name', 'LIKE', "%{$search}%")
                  ->orWhere('p.otherserial', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%");
            });
        }

        $peripherals = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear CSV
        $filename = 'dispositivos_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'r+');
        
        // Agregar BOM para UTF-8
        fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Headers
        fputcsv($handle, [
            'Nombre',
            'Entidad',
            'Fabricante',
            'Localización',
            'Tipo',
            'Modelo',
            'Última actualización',
            'Nombre de usuario alternativo'
        ]);

        // Datos
        foreach ($peripherals as $peripheral) {
            fputcsv($handle, [
                $peripheral->name ?? '-',
                $peripheral->entity_name ?? '-',
                $peripheral->manufacturer_name ?? '-',
                $peripheral->location_name ?? '-',
                $peripheral->type_name ?? '-',
                $peripheral->model_name ?? '-',
                $peripheral->date_mod ? date('Y-m-d H:i', strtotime($peripheral->date_mod)) : '-',
                $peripheral->otherserial ?? '-'
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

