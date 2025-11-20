<?php

namespace App\Http\Controllers;

use App\Models\ConsumableItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ConsumableItemController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');

        // Mapeo de campos para ordenamiento
        $sortableFields = [
            'name' => 'ci.name',
            'entity_name' => 'e.name',
            'ref' => 'ci.ref',
            'consumableitemtypes_id' => 'ci.consumableitemtypes_id',
            'manufacturers_id' => 'ci.manufacturers_id',
            'total' => 'total',
            'users_id_tech' => 'ci.users_id_tech',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'ci.name';
        
        $query = DB::table('glpi_consumableitems as ci')
            ->select(
                'ci.id',
                'ci.name',
                'ci.ref',
                'ci.comment',
                'e.name as entity_name',
                'ct.name as type_name',
                'mf.name as manufacturer_name',
                DB::raw('CONCAT(u.firstname, " ", u.realname) as tech_name'),
                DB::raw('COUNT(c.id) as total'),
                DB::raw('SUM(CASE WHEN c.date_out IS NULL THEN 1 ELSE 0 END) as nuevo'),
                DB::raw('SUM(CASE WHEN c.date_out IS NOT NULL THEN 1 ELSE 0 END) as usado')
            )
            ->leftJoin('glpi_entities as e', 'ci.entities_id', '=', 'e.id')
            ->leftJoin('glpi_consumableitemtypes as ct', 'ci.consumableitemtypes_id', '=', 'ct.id')
            ->leftJoin('glpi_manufacturers as mf', 'ci.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_users as u', 'ci.users_id_tech', '=', 'u.id')
            ->leftJoin('glpi_consumables as c', 'ci.id', '=', 'c.consumableitems_id')
            ->where('ci.is_deleted', 0)
            ->groupBy('ci.id', 'ci.name', 'ci.ref', 'ci.comment', 'e.name', 'ct.name', 'mf.name', 'u.firstname', 'u.realname');

        // Aplicar búsqueda si existe
        if ($search) {
            $query->having(DB::raw('LOWER(ci.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(ci.ref)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(e.name)'), 'LIKE', "%".strtolower($search)."%");
        }
        
        $consumables = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search
            ]);

        return Inertia::render('inventario/consumibles', [
            'consumables' => $consumables,
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
            'name' => 'ci.name',
            'entity_name' => 'e.name',
            'ref' => 'ci.ref',
            'consumableitemtypes_id' => 'ci.consumableitemtypes_id',
            'manufacturers_id' => 'ci.manufacturers_id',
            'total' => 'total',
            'users_id_tech' => 'ci.users_id_tech',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'ci.name';
        
        $query = DB::table('glpi_consumableitems as ci')
            ->select(
                'ci.name',
                'e.name as entity_name',
                'ci.ref',
                'ct.name as type_name',
                'mf.name as manufacturer_name',
                'ci.comment',
                DB::raw('CONCAT(u.firstname, " ", u.realname) as tech_name'),
                DB::raw('COUNT(c.id) as total'),
                DB::raw('SUM(CASE WHEN c.date_out IS NULL THEN 1 ELSE 0 END) as nuevo'),
                DB::raw('SUM(CASE WHEN c.date_out IS NOT NULL THEN 1 ELSE 0 END) as usado')
            )
            ->leftJoin('glpi_entities as e', 'ci.entities_id', '=', 'e.id')
            ->leftJoin('glpi_consumableitemtypes as ct', 'ci.consumableitemtypes_id', '=', 'ct.id')
            ->leftJoin('glpi_manufacturers as mf', 'ci.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_users as u', 'ci.users_id_tech', '=', 'u.id')
            ->leftJoin('glpi_consumables as c', 'ci.id', '=', 'c.consumableitems_id')
            ->where('ci.is_deleted', 0)
            ->groupBy('ci.id', 'ci.name', 'e.name', 'ci.ref', 'ct.name', 'mf.name', 'ci.comment', 'u.firstname', 'u.realname');

        if ($search) {
            $query->having(DB::raw('LOWER(ci.name)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(ci.ref)'), 'LIKE', "%".strtolower($search)."%")
                  ->orHaving(DB::raw('LOWER(e.name)'), 'LIKE', "%".strtolower($search)."%");
        }

        $consumables = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear CSV
        $filename = 'consumibles_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'r+');
        
        // Agregar BOM para UTF-8
        fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Headers
        fputcsv($handle, [
            'Nombre',
            'Entidad',
            'Referencia',
            'Tipo',
            'Fabricante',
            'Consumibles',
            'Comentarios',
            'Técnico a cargo'
        ]);

        // Datos
        foreach ($consumables as $consumable) {
            $consumiblesInfo = "Total: {$consumable->total}, Nuevo: {$consumable->nuevo}, Usado: {$consumable->usado}";
            
            fputcsv($handle, [
                $consumable->name ?? '-',
                $consumable->entity_name ?? '-',
                $consumable->ref ?? '-',
                $consumable->type_name ?? '-',
                $consumable->manufacturer_name ?? '-',
                $consumiblesInfo,
                $consumable->comment ?? '-',
                $consumable->tech_name ?? '-'
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
