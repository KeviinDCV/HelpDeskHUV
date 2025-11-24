<?php

namespace App\Http\Controllers;

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

        $sortableFields = [
            'name' => 'u.name',
            'entity_name' => 'e.name',
            'profile_name' => 'p.name',
            'realname' => 'u.realname',
            'email' => 'ue.email',
            'phone' => 'u.phone',
            'location_name' => 'l.completename',
            'is_active' => 'u.is_active',
            'id' => 'u.id',
            'firstname' => 'u.firstname',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'u.name';
        
        $query = DB::table('glpi_users as u')
            ->select(
                'u.id',
                'u.name',
                'e.name as entity_name',
                DB::raw('(SELECT GROUP_CONCAT(p2.name SEPARATOR ", ") FROM glpi_profiles_users pu2 LEFT JOIN glpi_profiles p2 ON pu2.profiles_id = p2.id WHERE pu2.users_id = u.id) as profile_name'),
                'u.realname',
                DB::raw('(SELECT GROUP_CONCAT(ue2.email SEPARATOR ", ") FROM glpi_useremails ue2 WHERE ue2.users_id = u.id) as email'),
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
            'entity_name' => 'e.name',
            'profile_name' => 'p.name',
            'realname' => 'u.realname',
            'email' => 'ue.email',
            'phone' => 'u.phone',
            'location_name' => 'l.completename',
            'is_active' => 'u.is_active',
            'id' => 'u.id',
            'firstname' => 'u.firstname',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'u.name';
        
        $query = DB::table('glpi_users as u')
            ->select(
                'u.name',
                'e.name as entity_name',
                DB::raw('(SELECT GROUP_CONCAT(p2.name SEPARATOR ", ") FROM glpi_profiles_users pu2 LEFT JOIN glpi_profiles p2 ON pu2.profiles_id = p2.id WHERE pu2.users_id = u.id) as profile_name'),
                'u.realname',
                DB::raw('(SELECT GROUP_CONCAT(ue2.email SEPARATOR ", ") FROM glpi_useremails ue2 WHERE ue2.users_id = u.id) as email'),
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
            'Entidades',
            'Perfil',
            'Apellidos',
            'Correos electrónicos',
            'Teléfono',
            'Localización',
            'Activar',
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
