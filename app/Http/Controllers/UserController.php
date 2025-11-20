<?php

namespace App\Http\Controllers;

use App\Models\GlpiUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');

        // Mapeo de campos para ordenamiento
        $sortableFields = [
            'name' => 'u.name',
            'firstname' => 'u.firstname',
            'realname' => 'u.realname',
            'entity_name' => 'e.name',
            'phone' => 'u.phone',
            'location_name' => 'l.completename',
            'is_active' => 'u.is_active',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'u.name';
        
        $query = DB::table('glpi_users as u')
            ->select(
                'u.id',
                'u.name',
                'e.name as entity_name',
                DB::raw('NULL as profile_name'),  // TODO: Necesita tabla glpi_profiles_users
                'u.realname',
                DB::raw('NULL as email'),  // TODO: Necesita tabla glpi_useremails
                'u.phone',
                'l.completename as location_name',
                'u.is_active',
                'u.firstname'
            )
            ->leftJoin('glpi_entities as e', 'u.entities_id', '=', 'e.id')
            ->leftJoin('glpi_locations as l', 'u.locations_id', '=', 'l.id')
            ->where('u.is_deleted', 0);

        // Aplicar búsqueda si existe
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('u.name', 'LIKE', "%{$search}%")
                  ->orWhere('u.firstname', 'LIKE', "%{$search}%")
                  ->orWhere('u.realname', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%");
            });
        }
        
        $users = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'search' => $search
            ]);

        return Inertia::render('administracion/usuarios', [
            'users' => $users,
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
            'name' => 'u.name',
            'firstname' => 'u.firstname',
            'realname' => 'u.realname',
            'entity_name' => 'e.name',
            'phone' => 'u.phone',
            'location_name' => 'l.completename',
            'is_active' => 'u.is_active',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'u.name';
        
        $query = DB::table('glpi_users as u')
            ->select(
                'u.name',
                'e.name as entity_name',
                DB::raw('NULL as profile_name'),
                'u.realname',
                DB::raw('NULL as email'),
                'u.phone',
                'l.completename as location_name',
                'u.is_active',
                'u.id',
                'u.firstname'
            )
            ->leftJoin('glpi_entities as e', 'u.entities_id', '=', 'e.id')
            ->leftJoin('glpi_locations as l', 'u.locations_id', '=', 'l.id')
            ->where('u.is_deleted', 0);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('u.name', 'LIKE', "%{$search}%")
                  ->orWhere('u.firstname', 'LIKE', "%{$search}%")
                  ->orWhere('u.realname', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%");
            });
        }

        $users = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear CSV
        $filename = 'usuarios_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'r+');
        
        // Agregar BOM para UTF-8
        fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Headers
        fputcsv($handle, [
            'Usuario',
            'Entidad',
            'Perfil',
            'Apellidos',
            'Correos electrónicos',
            'Teléfono',
            'Localización',
            'Activo',
            'ID',
            'Nombre'
        ]);

        // Datos
        foreach ($users as $user) {
            fputcsv($handle, [
                $user->name ?? '-',
                $user->entity_name ?? '-',
                $user->profile_name ?? '-',
                $user->realname ?? '-',
                $user->email ?? '-',
                $user->phone ?? '-',
                $user->location_name ?? '-',
                $user->is_active ? 'Sí' : 'No',
                $user->id ?? '-',
                $user->firstname ?? '-'
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
