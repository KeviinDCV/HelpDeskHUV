<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Rutas de Inventario
    Route::get('/inventario/computadores', [App\Http\Controllers\ComputerController::class, 'index'])->name('inventario.computadores');
    Route::get('/inventario/computadores/export', [App\Http\Controllers\ComputerController::class, 'export'])->name('inventario.computadores.export');
});

require __DIR__.'/settings.php';
