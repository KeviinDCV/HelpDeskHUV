<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use App\Models\User;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $sortField = $request->input('sort', 'username');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');

        $sortableFields = [
            'username' => 'username',
            'name' => 'name',
            'email' => 'email',
            'role' => 'role',
            'is_active' => 'is_active',
            'created_at' => 'created_at',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'username';
        
        $query = User::query();

        // Aplicar búsqueda si existe
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('username', 'LIKE', "%{$search}%")
                  ->orWhere('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('role', 'LIKE', "%{$search}%");
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
            ],
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    }

    public function export(Request $request)
    {
        $sortField = $request->input('sort', 'username');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');

        $sortableFields = [
            'username' => 'username',
            'name' => 'name',
            'email' => 'email',
            'role' => 'role',
            'is_active' => 'is_active',
            'created_at' => 'created_at',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'username';
        
        $query = User::query();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('username', 'LIKE', "%{$search}%")
                  ->orWhere('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('role', 'LIKE', "%{$search}%");
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
            'ID',
            'Usuario',
            'Nombre Completo',
            'Email',
            'Rol',
            'Activo',
            'Fecha de Creación'
        ]);

        // Datos
        foreach ($users as $user) {
            fputcsv($handle, [
                $user->id,
                $user->username,
                $user->name,
                $user->email,
                $user->role,
                $user->is_active ? 'Sí' : 'No',
                $user->created_at ? $user->created_at->format('Y-m-d H:i:s') : '-'
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    public function toggleActive($id)
    {
        $user = User::findOrFail($id);
        $user->is_active = !$user->is_active;
        $user->save();

        return redirect()->back()->with('success', 'Estado del usuario actualizado correctamente');
    }

    public function update(Request $request, $id)
    {
        // Solo administradores pueden editar usuarios
        if (auth()->user()->role !== 'Administrador') {
            return redirect()->back()->with('error', 'No tienes permisos para realizar esta acción');
        }

        $request->validate([
            'username' => 'required|string|max:255|unique:users,username,' . $id,
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $id,
            'role' => 'required|in:Administrador,Técnico,Usuario',
            'is_active' => 'required|boolean',
        ]);

        $user = User::findOrFail($id);
        $user->username = $request->username;
        $user->name = $request->name;
        $user->email = $request->email;
        $user->role = $request->role;
        $user->is_active = $request->is_active;
        
        // Si se proporciona una nueva contraseña
        if ($request->filled('password')) {
            $request->validate([
                'password' => 'min:6|confirmed'
            ]);
            $user->password = Hash::make($request->password);
        }
        
        $user->save();

        return redirect()->back()->with('success', 'Usuario actualizado correctamente');
    }
}
