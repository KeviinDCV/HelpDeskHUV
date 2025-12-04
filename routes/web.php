<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('home');

// Ruta GET de logout (evita problemas de CSRF)
Route::get('/salir', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect('/login');
})->name('salir');

// Rutas públicas (sin autenticación)
Route::get('/reportar', [App\Http\Controllers\PublicTicketController::class, 'create'])->name('reportar');
Route::post('/reportar', [App\Http\Controllers\PublicTicketController::class, 'store'])->name('reportar.store');
Route::post('/chatbot', [App\Http\Controllers\ChatbotController::class, 'chat'])->name('chatbot');

Route::middleware(['auth', 'verified'])->group(function () {
    // Búsqueda global
    Route::get('/api/search', [App\Http\Controllers\SearchController::class, 'search'])->name('api.search');

    Route::get('dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    Route::get('dashboard/tickets', [App\Http\Controllers\DashboardController::class, 'getTickets'])->name('dashboard.tickets');
    Route::get('dashboard/ticket/{id}', [App\Http\Controllers\DashboardController::class, 'getTicketDetails'])->name('dashboard.ticket-details');
    Route::post('dashboard/take-ticket/{id}', [App\Http\Controllers\DashboardController::class, 'takeTicket'])->name('dashboard.take-ticket');
    Route::post('dashboard/assign-ticket/{id}', [App\Http\Controllers\DashboardController::class, 'assignTicket'])->name('dashboard.assign-ticket');
    Route::post('dashboard/solve-ticket/{id}', [App\Http\Controllers\DashboardController::class, 'solveTicket'])->name('dashboard.solve-ticket');

    // Rutas de Inventario
    Route::get('/inventario/computadores', [App\Http\Controllers\ComputerController::class, 'index'])->name('inventario.computadores');
    Route::get('/inventario/computadores/export', [App\Http\Controllers\ComputerController::class, 'export'])->name('inventario.computadores.export');
    Route::get('/inventario/computadores/crear', [App\Http\Controllers\ComputerController::class, 'create'])->name('inventario.computadores.crear');
    Route::post('/inventario/computadores', [App\Http\Controllers\ComputerController::class, 'store'])->name('inventario.computadores.store');
    Route::get('/inventario/computadores/{id}/editar', [App\Http\Controllers\ComputerController::class, 'edit'])->name('inventario.computadores.edit');
    Route::get('/inventario/computadores/{id}', [App\Http\Controllers\ComputerController::class, 'show'])->name('inventario.computadores.show');
    Route::put('/inventario/computadores/{id}', [App\Http\Controllers\ComputerController::class, 'update'])->name('inventario.computadores.update');
    Route::delete('/inventario/computadores/{id}', [App\Http\Controllers\ComputerController::class, 'destroy'])->name('inventario.computadores.destroy');
    Route::get('/inventario/monitores', [App\Http\Controllers\MonitorController::class, 'index'])->name('inventario.monitores');
    Route::get('/inventario/monitores/export', [App\Http\Controllers\MonitorController::class, 'export'])->name('inventario.monitores.export');
    Route::get('/inventario/monitores/crear', [App\Http\Controllers\MonitorController::class, 'create'])->name('inventario.monitores.crear');
    Route::post('/inventario/monitores', [App\Http\Controllers\MonitorController::class, 'store'])->name('inventario.monitores.store');
    Route::get('/inventario/monitores/{id}/editar', [App\Http\Controllers\MonitorController::class, 'edit'])->name('inventario.monitores.edit');
    Route::get('/inventario/monitores/{id}', [App\Http\Controllers\MonitorController::class, 'show'])->name('inventario.monitores.show');
    Route::put('/inventario/monitores/{id}', [App\Http\Controllers\MonitorController::class, 'update'])->name('inventario.monitores.update');
    Route::delete('/inventario/monitores/{id}', [App\Http\Controllers\MonitorController::class, 'destroy'])->name('inventario.monitores.destroy');
    Route::get('/inventario/programas', [App\Http\Controllers\SoftwareController::class, 'index'])->name('inventario.programas');
    Route::get('/inventario/programas/export', [App\Http\Controllers\SoftwareController::class, 'export'])->name('inventario.programas.export');
    Route::get('/inventario/programas/crear', [App\Http\Controllers\SoftwareController::class, 'create'])->name('inventario.programas.crear');
    Route::post('/inventario/programas', [App\Http\Controllers\SoftwareController::class, 'store'])->name('inventario.programas.store');
    Route::get('/inventario/programas/{id}/editar', [App\Http\Controllers\SoftwareController::class, 'edit'])->name('inventario.programas.edit');
    Route::get('/inventario/programas/{id}', [App\Http\Controllers\SoftwareController::class, 'show'])->name('inventario.programas.show');
    Route::put('/inventario/programas/{id}', [App\Http\Controllers\SoftwareController::class, 'update'])->name('inventario.programas.update');
    Route::delete('/inventario/programas/{id}', [App\Http\Controllers\SoftwareController::class, 'destroy'])->name('inventario.programas.destroy');
    Route::get('/inventario/dispositivos-red', [App\Http\Controllers\NetworkEquipmentController::class, 'index'])->name('inventario.dispositivos-red');
    Route::get('/inventario/dispositivos-red/export', [App\Http\Controllers\NetworkEquipmentController::class, 'export'])->name('inventario.dispositivos-red.export');
    Route::get('/inventario/dispositivos-red/crear', [App\Http\Controllers\NetworkEquipmentController::class, 'create'])->name('inventario.dispositivos-red.crear');
    Route::post('/inventario/dispositivos-red', [App\Http\Controllers\NetworkEquipmentController::class, 'store'])->name('inventario.dispositivos-red.store');
    Route::get('/inventario/dispositivos-red/{id}/editar', [App\Http\Controllers\NetworkEquipmentController::class, 'edit'])->name('inventario.dispositivos-red.edit');
    Route::get('/inventario/dispositivos-red/{id}', [App\Http\Controllers\NetworkEquipmentController::class, 'show'])->name('inventario.dispositivos-red.show');
    Route::put('/inventario/dispositivos-red/{id}', [App\Http\Controllers\NetworkEquipmentController::class, 'update'])->name('inventario.dispositivos-red.update');
    Route::delete('/inventario/dispositivos-red/{id}', [App\Http\Controllers\NetworkEquipmentController::class, 'destroy'])->name('inventario.dispositivos-red.destroy');
    Route::get('/inventario/dispositivos', [App\Http\Controllers\PeripheralController::class, 'index'])->name('inventario.dispositivos');
    Route::get('/inventario/dispositivos/export', [App\Http\Controllers\PeripheralController::class, 'export'])->name('inventario.dispositivos.export');
    Route::get('/inventario/dispositivos/crear', [App\Http\Controllers\PeripheralController::class, 'create'])->name('inventario.dispositivos.crear');
    Route::post('/inventario/dispositivos', [App\Http\Controllers\PeripheralController::class, 'store'])->name('inventario.dispositivos.store');
    Route::get('/inventario/dispositivos/{id}/editar', [App\Http\Controllers\PeripheralController::class, 'edit'])->name('inventario.dispositivos.edit');
    Route::put('/inventario/dispositivos/{id}', [App\Http\Controllers\PeripheralController::class, 'update'])->name('inventario.dispositivos.update');
    Route::delete('/inventario/dispositivos/{id}', [App\Http\Controllers\PeripheralController::class, 'destroy'])->name('inventario.dispositivos.destroy');
    Route::get('/inventario/impresoras', [App\Http\Controllers\PrinterController::class, 'index'])->name('inventario.impresoras');
    Route::get('/inventario/impresoras/export', [App\Http\Controllers\PrinterController::class, 'export'])->name('inventario.impresoras.export');
    Route::get('/inventario/impresoras/crear', [App\Http\Controllers\PrinterController::class, 'create'])->name('inventario.impresoras.crear');
    Route::post('/inventario/impresoras', [App\Http\Controllers\PrinterController::class, 'store'])->name('inventario.impresoras.store');
    Route::get('/inventario/impresoras/{id}', [App\Http\Controllers\PrinterController::class, 'show'])->name('inventario.impresoras.show');
    Route::get('/inventario/impresoras/{id}/editar', [App\Http\Controllers\PrinterController::class, 'edit'])->name('inventario.impresoras.edit');
    Route::put('/inventario/impresoras/{id}', [App\Http\Controllers\PrinterController::class, 'update'])->name('inventario.impresoras.update');
    Route::delete('/inventario/impresoras/{id}', [App\Http\Controllers\PrinterController::class, 'destroy'])->name('inventario.impresoras.destroy');
    Route::get('/inventario/consumibles', [App\Http\Controllers\ConsumableItemController::class, 'index'])->name('inventario.consumibles');
    Route::get('/inventario/consumibles/export', [App\Http\Controllers\ConsumableItemController::class, 'export'])->name('inventario.consumibles.export');
    Route::get('/inventario/consumibles/crear', [App\Http\Controllers\ConsumableItemController::class, 'create'])->name('inventario.consumibles.crear');
    Route::post('/inventario/consumibles', [App\Http\Controllers\ConsumableItemController::class, 'store'])->name('inventario.consumibles.store');
    Route::get('/inventario/consumibles/{id}/editar', [App\Http\Controllers\ConsumableItemController::class, 'edit'])->name('inventario.consumibles.edit');
    Route::get('/inventario/consumibles/{id}', [App\Http\Controllers\ConsumableItemController::class, 'show'])->name('inventario.consumibles.show');
    Route::put('/inventario/consumibles/{id}', [App\Http\Controllers\ConsumableItemController::class, 'update'])->name('inventario.consumibles.update');
    Route::delete('/inventario/consumibles/{id}', [App\Http\Controllers\ConsumableItemController::class, 'destroy'])->name('inventario.consumibles.destroy');
    Route::get('/inventario/telefonos', [App\Http\Controllers\PhoneController::class, 'index'])->name('inventario.telefonos');
    Route::get('/inventario/telefonos/export', [App\Http\Controllers\PhoneController::class, 'export'])->name('inventario.telefonos.export');
    Route::get('/inventario/telefonos/crear', [App\Http\Controllers\PhoneController::class, 'create'])->name('inventario.telefonos.crear');
    Route::post('/inventario/telefonos', [App\Http\Controllers\PhoneController::class, 'store'])->name('inventario.telefonos.store');
    Route::get('/inventario/telefonos/{id}/editar', [App\Http\Controllers\PhoneController::class, 'edit'])->name('inventario.telefonos.edit');
    Route::put('/inventario/telefonos/{id}', [App\Http\Controllers\PhoneController::class, 'update'])->name('inventario.telefonos.update');
    Route::delete('/inventario/telefonos/{id}', [App\Http\Controllers\PhoneController::class, 'destroy'])->name('inventario.telefonos.destroy');
    Route::get('/inventario/global', [App\Http\Controllers\GlobalInventoryController::class, 'index'])->name('inventario.global');
    Route::get('/inventario/global/export', [App\Http\Controllers\GlobalInventoryController::class, 'export'])->name('inventario.global.export');
    
    // Rutas de Soporte
    Route::get('/soporte/casos', [App\Http\Controllers\TicketController::class, 'index'])->name('soporte.casos');
    Route::get('/soporte/crear-caso', [App\Http\Controllers\TicketController::class, 'create'])->name('soporte.crear-caso');
    Route::post('/soporte/casos', [App\Http\Controllers\TicketController::class, 'store'])->name('soporte.casos.store');
    Route::get('/soporte/casos/{id}', [App\Http\Controllers\TicketController::class, 'show'])->name('soporte.casos.show');
    Route::get('/soporte/casos/{id}/editar', [App\Http\Controllers\TicketController::class, 'edit'])->name('soporte.casos.edit');
    Route::put('/soporte/casos/{id}', [App\Http\Controllers\TicketController::class, 'update'])->name('soporte.casos.update');
    Route::delete('/soporte/casos/{id}', [App\Http\Controllers\TicketController::class, 'destroy'])->name('soporte.casos.destroy');
    Route::post('/soporte/casos/{id}/solucion', [App\Http\Controllers\TicketController::class, 'addSolution'])->name('soporte.casos.solution');
    Route::get('/soporte/items/{type}', [App\Http\Controllers\TicketController::class, 'getItemsByType'])->name('soporte.items');
    Route::get('/soporte/estadisticas', [App\Http\Controllers\StatisticsController::class, 'index'])->name('soporte.estadisticas');
    Route::get('/soporte/estadisticas/export', [App\Http\Controllers\StatisticsController::class, 'export'])->name('soporte.estadisticas.export');

    // Administración
    Route::get('/administracion/usuarios', [App\Http\Controllers\UserController::class, 'index'])->name('administracion.usuarios');
    Route::post('/administracion/usuarios', [App\Http\Controllers\UserController::class, 'store'])->name('administracion.usuarios.store');
    Route::get('/administracion/usuarios/export', [App\Http\Controllers\UserController::class, 'export'])->name('administracion.usuarios.export');
    Route::post('/administracion/usuarios/{id}/toggle-active', [App\Http\Controllers\UserController::class, 'toggleActive'])->name('administracion.usuarios.toggle-active');
    Route::put('/administracion/usuarios/{id}', [App\Http\Controllers\UserController::class, 'update'])->name('administracion.usuarios.update');

    // Archivos de GLPI
    Route::get('/glpi-files/{path}', [App\Http\Controllers\TicketController::class, 'serveGlpiFile'])->where('path', '.*')->name('glpi.file');

    // Notificaciones
    Route::get('/api/notifications', [App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/api/notifications/unread-count', [App\Http\Controllers\NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
    Route::post('/api/notifications/{id}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/api/notifications/read-all', [App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::delete('/api/notifications/{id}', [App\Http\Controllers\NotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::post('/api/notifications/clear-read', [App\Http\Controllers\NotificationController::class, 'clearRead'])->name('notifications.clear-read');
});

require __DIR__.'/settings.php';
