<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Rutas de Inventario
    Route::get('/inventario/computadores', [App\Http\Controllers\ComputerController::class, 'index'])->name('inventario.computadores');
    Route::get('/inventario/computadores/export', [App\Http\Controllers\ComputerController::class, 'export'])->name('inventario.computadores.export');
    Route::get('/inventario/monitores', [App\Http\Controllers\MonitorController::class, 'index'])->name('inventario.monitores');
    Route::get('/inventario/monitores/export', [App\Http\Controllers\MonitorController::class, 'export'])->name('inventario.monitores.export');
    Route::get('/inventario/programas', [App\Http\Controllers\SoftwareController::class, 'index'])->name('inventario.programas');
    Route::get('/inventario/programas/export', [App\Http\Controllers\SoftwareController::class, 'export'])->name('inventario.programas.export');
    Route::get('/inventario/dispositivos-red', [App\Http\Controllers\NetworkEquipmentController::class, 'index'])->name('inventario.dispositivos-red');
    Route::get('/inventario/dispositivos-red/export', [App\Http\Controllers\NetworkEquipmentController::class, 'export'])->name('inventario.dispositivos-red.export');
    Route::get('/inventario/dispositivos', [App\Http\Controllers\PeripheralController::class, 'index'])->name('inventario.dispositivos');
    Route::get('/inventario/dispositivos/export', [App\Http\Controllers\PeripheralController::class, 'export'])->name('inventario.dispositivos.export');
    Route::get('/inventario/impresoras', [App\Http\Controllers\PrinterController::class, 'index'])->name('inventario.impresoras');
    Route::get('/inventario/impresoras/export', [App\Http\Controllers\PrinterController::class, 'export'])->name('inventario.impresoras.export');
    Route::get('/inventario/consumibles', [App\Http\Controllers\ConsumableItemController::class, 'index'])->name('inventario.consumibles');
    Route::get('/inventario/consumibles/export', [App\Http\Controllers\ConsumableItemController::class, 'export'])->name('inventario.consumibles.export');
    Route::get('/inventario/telefonos', [App\Http\Controllers\PhoneController::class, 'index'])->name('inventario.telefonos');
    Route::get('/inventario/telefonos/export', [App\Http\Controllers\PhoneController::class, 'export'])->name('inventario.telefonos.export');
    Route::get('/inventario/global', [App\Http\Controllers\GlobalInventoryController::class, 'index'])->name('inventario.global');
    Route::get('/inventario/global/export', [App\Http\Controllers\GlobalInventoryController::class, 'export'])->name('inventario.global.export');
    
    // Administración
    Route::get('/administracion/usuarios', [App\Http\Controllers\UserController::class, 'index'])->name('administracion.usuarios');
    Route::get('/administracion/usuarios/export', [App\Http\Controllers\UserController::class, 'export'])->name('administracion.usuarios.export');
});

require __DIR__.'/settings.php';
