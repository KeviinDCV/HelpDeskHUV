<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GlobalInventoryController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');
        $stateFilter = $request->input('state', '');
        $itemTypeFilter = $request->input('item_type', '');

        // Construir query UNION de todos los tipos de activos
        $computersQuery = DB::table('glpi_computers as c')
            ->select(
                'c.name',
                'e.name as entity_name',
                's.name as state_name',
                DB::raw("'Computadores' as item_type")
            )
            ->leftJoin('glpi_entities as e', 'c.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'c.states_id', '=', 's.id')
            ->where('c.is_deleted', 0);

        $monitorsQuery = DB::table('glpi_monitors as m')
            ->select(
                'm.name',
                'e.name as entity_name',
                's.name as state_name',
                DB::raw("'Monitores' as item_type")
            )
            ->leftJoin('glpi_entities as e', 'm.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'm.states_id', '=', 's.id')
            ->where('m.is_deleted', 0);

        $networkQuery = DB::table('glpi_networkequipments as n')
            ->select(
                'n.name',
                'e.name as entity_name',
                's.name as state_name',
                DB::raw("'Dispositivos para redes' as item_type")
            )
            ->leftJoin('glpi_entities as e', 'n.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'n.states_id', '=', 's.id')
            ->where('n.is_deleted', 0);

        $peripheralsQuery = DB::table('glpi_peripherals as p')
            ->select(
                'p.name',
                'e.name as entity_name',
                's.name as state_name',
                DB::raw("'Dispositivos' as item_type")
            )
            ->leftJoin('glpi_entities as e', 'p.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'p.states_id', '=', 's.id')
            ->where('p.is_deleted', 0);

        $printersQuery = DB::table('glpi_printers as pr')
            ->select(
                'pr.name',
                'e.name as entity_name',
                's.name as state_name',
                DB::raw("'Impresoras' as item_type")
            )
            ->leftJoin('glpi_entities as e', 'pr.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'pr.states_id', '=', 's.id')
            ->where('pr.is_deleted', 0);

        $phonesQuery = DB::table('glpi_phones as ph')
            ->select(
                'ph.name',
                'e.name as entity_name',
                's.name as state_name',
                DB::raw("'Teléfonos' as item_type")
            )
            ->leftJoin('glpi_entities as e', 'ph.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'ph.states_id', '=', 's.id')
            ->where('ph.is_deleted', 0);

        // Aplicar filtro de tipo de elemento antes del UNION
        $itemTypeMap = [
            'Computadores' => $computersQuery,
            'Monitores' => $monitorsQuery,
            'Dispositivos para redes' => $networkQuery,
            'Dispositivos' => $peripheralsQuery,
            'Impresoras' => $printersQuery,
            'Teléfonos' => $phonesQuery,
        ];

        if ($itemTypeFilter && $itemTypeFilter !== 'all' && isset($itemTypeMap[$itemTypeFilter])) {
            $query = $itemTypeMap[$itemTypeFilter];
        } else {
            $query = $computersQuery
                ->unionAll($monitorsQuery)
                ->unionAll($networkQuery)
                ->unionAll($peripheralsQuery)
                ->unionAll($printersQuery)
                ->unionAll($phonesQuery);
        }

        // Aplicar búsqueda y filtro de estado
        $query = DB::table(DB::raw("({$query->toSql()}) as items"))
            ->mergeBindings($query);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('entity_name', 'LIKE', "%{$search}%")
                  ->orWhere('state_name', 'LIKE', "%{$search}%")
                  ->orWhere('item_type', 'LIKE', "%{$search}%");
            });
        }

        if ($stateFilter && $stateFilter !== 'all') {
            $stateName = DB::table('glpi_states')->where('id', $stateFilter)->value('name');
            if ($stateName) {
                $query->where('state_name', $stateName);
            }
        }

        // Mapeo de campos para ordenamiento
        $sortableFields = [
            'name' => 'name',
            'entity_name' => 'entity_name',
            'state_name' => 'state_name',
            'item_type' => 'item_type',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'name';

        $items = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage, 'sort' => $sortField, 'direction' => $sortDirection, 'search' => $search,
                'state' => $stateFilter, 'item_type' => $itemTypeFilter
            ]);

        $states = DB::table('glpi_states')->select('id', 'name')->orderBy('name')->get();
        $itemTypes = ['Computadores', 'Monitores', 'Dispositivos para redes', 'Dispositivos', 'Impresoras', 'Teléfonos'];

        return Inertia::render('inventario/global', [
            'items' => $items, 'states' => $states, 'itemTypes' => $itemTypes,
            'filters' => [
                'per_page' => $perPage, 'sort' => $sortField, 'direction' => $sortDirection, 'search' => $search,
                'state' => $stateFilter, 'item_type' => $itemTypeFilter
            ]
        ]);
    }

    public function export(Request $request)
    {
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');
        $stateFilter = $request->input('state', '');
        $itemTypeFilter = $request->input('item_type', '');

        // Construir query UNION de todos los tipos de activos
        $computersQuery = DB::table('glpi_computers as c')
            ->select(
                'c.name',
                'e.name as entity_name',
                's.name as state_name',
                DB::raw("'Computadores' as item_type")
            )
            ->leftJoin('glpi_entities as e', 'c.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'c.states_id', '=', 's.id')
            ->where('c.is_deleted', 0);

        $monitorsQuery = DB::table('glpi_monitors as m')
            ->select(
                'm.name',
                'e.name as entity_name',
                's.name as state_name',
                DB::raw("'Monitores' as item_type")
            )
            ->leftJoin('glpi_entities as e', 'm.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'm.states_id', '=', 's.id')
            ->where('m.is_deleted', 0);

        $networkQuery = DB::table('glpi_networkequipments as n')
            ->select(
                'n.name',
                'e.name as entity_name',
                's.name as state_name',
                DB::raw("'Dispositivos para redes' as item_type")
            )
            ->leftJoin('glpi_entities as e', 'n.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'n.states_id', '=', 's.id')
            ->where('n.is_deleted', 0);

        $peripheralsQuery = DB::table('glpi_peripherals as p')
            ->select(
                'p.name',
                'e.name as entity_name',
                's.name as state_name',
                DB::raw("'Dispositivos' as item_type")
            )
            ->leftJoin('glpi_entities as e', 'p.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'p.states_id', '=', 's.id')
            ->where('p.is_deleted', 0);

        $printersQuery = DB::table('glpi_printers as pr')
            ->select(
                'pr.name',
                'e.name as entity_name',
                's.name as state_name',
                DB::raw("'Impresoras' as item_type")
            )
            ->leftJoin('glpi_entities as e', 'pr.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'pr.states_id', '=', 's.id')
            ->where('pr.is_deleted', 0);

        $phonesQuery = DB::table('glpi_phones as ph')
            ->select(
                'ph.name',
                'e.name as entity_name',
                's.name as state_name',
                DB::raw("'Teléfonos' as item_type")
            )
            ->leftJoin('glpi_entities as e', 'ph.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'ph.states_id', '=', 's.id')
            ->where('ph.is_deleted', 0);

        // Aplicar filtro de tipo de elemento antes del UNION
        $itemTypeMap = [
            'Computadores' => $computersQuery,
            'Monitores' => $monitorsQuery,
            'Dispositivos para redes' => $networkQuery,
            'Dispositivos' => $peripheralsQuery,
            'Impresoras' => $printersQuery,
            'Teléfonos' => $phonesQuery,
        ];

        if ($itemTypeFilter && $itemTypeFilter !== 'all' && isset($itemTypeMap[$itemTypeFilter])) {
            $query = $itemTypeMap[$itemTypeFilter];
        } else {
            $query = $computersQuery
                ->unionAll($monitorsQuery)
                ->unionAll($networkQuery)
                ->unionAll($peripheralsQuery)
                ->unionAll($printersQuery)
                ->unionAll($phonesQuery);
        }

        $query = DB::table(DB::raw("({$query->toSql()}) as items"))
            ->mergeBindings($query);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('entity_name', 'LIKE', "%{$search}%")
                  ->orWhere('state_name', 'LIKE', "%{$search}%")
                  ->orWhere('item_type', 'LIKE', "%{$search}%");
            });
        }

        if ($stateFilter && $stateFilter !== 'all') {
            $stateName = DB::table('glpi_states')->where('id', $stateFilter)->value('name');
            if ($stateName) {
                $query->where('state_name', $stateName);
            }
        }

        $sortableFields = [
            'name' => 'name',
            'entity_name' => 'entity_name',
            'state_name' => 'state_name',
            'item_type' => 'item_type',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'name';

        $items = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear CSV
        $filename = 'inventario_global_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'r+');
        
        // Agregar BOM para UTF-8
        fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Headers
        fputcsv($handle, [
            'Nombre',
            'Entidad',
            'Estado',
            'Tipo de elemento'
        ]);

        // Datos
        foreach ($items as $item) {
            fputcsv($handle, [
                $item->name ?? '-',
                $item->entity_name ?? '-',
                $item->state_name ?? '-',
                $item->item_type ?? '-'
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
