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

        // Mapeo de campos para ordenamiento
        $sortableFields = [
            'name' => 'c.name',
            'entity_name' => 'e.name',
            'states_id' => 'c.states_id',
            'manufacturers_id' => 'c.manufacturers_id',
            'serial' => 'c.serial',
            'type_name' => 't.name',
            'model_name' => 'cm.name',
            'locations_id' => 'c.locations_id',
            'date_mod' => 'c.date_mod',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'c.name';
        
        $computers = DB::table('glpi_computers as c')
            ->select(
                'c.id',
                'c.name',
                'c.serial',
                'c.date_mod',
                'c.states_id',
                'c.manufacturers_id',
                'c.locations_id',
                'e.name as entity_name',
                't.name as type_name',
                'cm.name as model_name'
            )
            ->leftJoin('glpi_entities as e', 'c.entities_id', '=', 'e.id')
            ->leftJoin('glpi_computertypes as t', 'c.computertypes_id', '=', 't.id')
            ->leftJoin('glpi_computermodels as cm', 'c.computermodels_id', '=', 'cm.id')
            ->where('c.is_deleted', 0)
            ->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection
            ]);

        return Inertia::render('inventario/computadores', [
            'computers' => $computers,
            'filters' => [
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection
            ]
        ]);
    }
}
