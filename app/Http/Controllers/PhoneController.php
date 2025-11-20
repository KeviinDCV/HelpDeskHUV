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

        // Mapeo de campos para ordenamiento
        $sortableFields = [
            'name' => 'p.name',
            'entity_name' => 'e.name',
            'manufacturers_id' => 'p.manufacturers_id',
            'locations_id' => 'p.locations_id',
            'states_id' => 'p.states_id',
            'phonetypes_id' => 'p.phonetypes_id',
            'phonemodels_id' => 'p.phonemodels_id',
            'otherserial' => 'p.otherserial',
            'date_mod' => 'p.date_mod',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'p.name';
        
        $query = DB::table('glpi_phones as p')
            ->select(
                'p.id',
                'p.name',
                'p.date_mod',
                'p.manufacturers_id',
                'p.locations_id',
                'p.states_id',
                'p.phonetypes_id',
                'p.phonemodels_id',
                'p.otherserial',
                'e.name as entity_name'
            )
            ->leftJoin('glpi_entities as e', 'p.entities_id', '=', 'e.id')
            ->where('p.is_deleted', 0);

        // Aplicar búsqueda si existe
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('p.name', 'LIKE', "%{$search}%")
                  ->orWhere('p.otherserial', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%");
            });
        }
        
        $phones = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search
            ]);

        return Inertia::render('inventario/telefonos', [
            'phones' => $phones,
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
            'phonetypes_id' => 'p.phonetypes_id',
            'phonemodels_id' => 'p.phonemodels_id',
            'otherserial' => 'p.otherserial',
            'date_mod' => 'p.date_mod',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'p.name';
        
        $query = DB::table('glpi_phones as p')
            ->select(
                'p.name',
                'e.name as entity_name',
                'p.states_id',
                'p.manufacturers_id',
                'p.locations_id',
                'p.phonetypes_id',
                'p.phonemodels_id',
                'p.otherserial',
                'p.date_mod'
            )
            ->leftJoin('glpi_entities as e', 'p.entities_id', '=', 'e.id')
            ->where('p.is_deleted', 0);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('p.name', 'LIKE', "%{$search}%")
                  ->orWhere('p.otherserial', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%");
            });
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
            'Nombre de usuario alternativo'
        ]);

        // Datos
        foreach ($phones as $phone) {
            fputcsv($handle, [
                $phone->name ?? '-',
                $phone->entity_name ?? '-',
                $phone->states_id ?? '-',
                $phone->manufacturers_id ?? '-',
                $phone->locations_id ?? '-',
                $phone->phonetypes_id ?? '-',
                $phone->phonemodels_id ?? '-',
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
}

