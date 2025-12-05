<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use App\Models\User;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use App\Traits\ExcelExportStyles;

class UserController extends Controller
{
    use ExcelExportStyles;

    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $sortField = $request->input('sort', 'username');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');
        $roleFilter = $request->input('role', '');
        $statusFilter = $request->input('is_active', '');
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');

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

        if ($roleFilter && $roleFilter !== 'all') { $query->where('role', $roleFilter); }
        if ($statusFilter && $statusFilter !== 'all') { $query->where('is_active', $statusFilter); }
        if ($dateFrom) { $query->whereDate('created_at', '>=', $dateFrom); }
        if ($dateTo) { $query->whereDate('created_at', '<=', $dateTo); }
        
        $users = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage, 'sort' => $sortField, 'direction' => $sortDirection, 'search' => $search,
                'role' => $roleFilter, 'is_active' => $statusFilter, 'date_from' => $dateFrom, 'date_to' => $dateTo
            ]);

        return Inertia::render('administracion/usuarios', [
            'users' => $users,
            'filters' => [
                'per_page' => $perPage, 'sort' => $sortField, 'direction' => $sortDirection, 'search' => $search,
                'role' => $roleFilter, 'is_active' => $statusFilter, 'date_from' => $dateFrom, 'date_to' => $dateTo
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
        $roleFilter = $request->input('role', '');
        $statusFilter = $request->input('is_active', '');
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');

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

        if ($roleFilter && $roleFilter !== 'all') { $query->where('role', $roleFilter); }
        if ($statusFilter && $statusFilter !== 'all') { $query->where('is_active', $statusFilter); }
        if ($dateFrom) { $query->whereDate('created_at', '>=', $dateFrom); }
        if ($dateTo) { $query->whereDate('created_at', '<=', $dateTo); }

        $users = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear Excel
        $spreadsheet = new Spreadsheet();
        $this->setDocumentProperties($spreadsheet, 'Usuarios HelpDesk', 'Listado de usuarios del sistema');
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Usuarios');

        // Encabezado del documento
        $filterInfo = '';
        if ($roleFilter && $roleFilter !== 'all') $filterInfo .= "Rol: {$roleFilter} ";
        if ($statusFilter !== '') $filterInfo .= "Estado: " . ($statusFilter ? 'Activos' : 'Inactivos');
        $this->createDocumentHeader($sheet, 'HELPDESK HUV - USUARIOS DEL SISTEMA', 'Hospital Universitario del Valle - Gestión de Usuarios', 'G', $filterInfo);

        // Resumen rápido
        $row = 5;
        $totalUsers = $users->count();
        $activeUsers = $users->where('is_active', true)->count();
        $adminUsers = $users->where('role', 'Administrador')->count();
        $techUsers = $users->where('role', 'Técnico')->count();

        $sheet->setCellValue("A{$row}", "📊 RESUMEN: {$totalUsers} usuarios | ✅ Activos: {$activeUsers} | 👔 Admins: {$adminUsers} | 🔧 Técnicos: {$techUsers}");
        $sheet->mergeCells("A{$row}:G{$row}");
        $this->applySectionStyle($sheet, "A{$row}:G{$row}");
        $sheet->getRowDimension($row)->setRowHeight(28);

        // Headers de tabla
        $row = 7;
        $headers = ['ID', 'Usuario', 'Nombre Completo', 'Email', 'Rol', 'Estado', 'Fecha Creación'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue("{$col}{$row}", $header);
            $col++;
        }
        $this->applyHeaderStyle($sheet, "A{$row}:G{$row}");
        $sheet->getRowDimension($row)->setRowHeight(25);

        // Datos
        $row++;
        $startDataRow = $row;
        foreach ($users as $user) {
            $sheet->setCellValue("A{$row}", $user->id);
            $sheet->setCellValue("B{$row}", $user->username);
            $sheet->setCellValue("C{$row}", $user->name);
            $sheet->setCellValue("D{$row}", $user->email);
            $sheet->setCellValue("E{$row}", $user->role);
            $sheet->setCellValue("F{$row}", $user->is_active ? '✓ Activo' : '✗ Inactivo');
            $sheet->setCellValue("G{$row}", $user->created_at ? $user->created_at->format('d/m/Y H:i') : '-');
            
            // Estilo para estado
            if ($user->is_active) {
                $this->applyBadgeStyle($sheet, "F{$row}", $this->successColor);
            } else {
                $this->applyBadgeStyle($sheet, "F{$row}", $this->dangerColor);
            }
            
            // Estilo para rol
            $roleColor = match($user->role) {
                'Administrador' => $this->primaryColor,
                'Técnico' => $this->warningColor,
                default => '6B7280'
            };
            $this->applyBadgeStyle($sheet, "E{$row}", $roleColor);
            
            $row++;
        }

        // Aplicar estilos alternados a datos
        $this->applyAlternateRowStyles($sheet, $startDataRow, $row - 1, 'A', 'G');

        // Auto-ajustar columnas
        $this->autoSizeColumns($sheet, ['A', 'B', 'C', 'D', 'E', 'F', 'G']);

        // Generar archivo
        $filename = 'Usuarios_HelpDesk_' . date('Y-m-d_His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function store(Request $request)
    {
        // Solo administradores pueden crear usuarios
        if (auth()->user()->role !== 'Administrador') {
            return redirect()->back()->with('error', 'No tienes permisos para realizar esta acción');
        }

        $request->validate([
            'username' => 'required|string|max:255|unique:users,username',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:Administrador,Técnico,Usuario',
            'is_active' => 'required|boolean',
            'password' => 'required|min:8|confirmed',
        ], [
            'username.required' => 'El nombre de usuario es requerido.',
            'username.unique' => 'Este nombre de usuario ya está en uso.',
            'name.required' => 'El nombre completo es requerido.',
            'email.required' => 'El correo electrónico es requerido.',
            'email.email' => 'El correo electrónico debe ser válido.',
            'email.unique' => 'Este correo electrónico ya está registrado.',
            'role.required' => 'El rol es requerido.',
            'password.required' => 'La contraseña es requerida.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        User::create([
            'username' => $request->username,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'role' => $request->role,
            'is_active' => $request->is_active,
            'password' => Hash::make($request->password),
        ]);

        return redirect()->back()->with('success', 'Usuario creado correctamente');
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
