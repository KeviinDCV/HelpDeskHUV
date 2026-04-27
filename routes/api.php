<?php

use App\Http\Controllers\Api\InventoryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Agente de Inventario (OCS-like)
|--------------------------------------------------------------------------
|
| Estas rutas son consumidas por el agente Windows que recolecta y envía
| la información de los equipos. La autenticación es por token de Sanctum
| con la habilidad "agent:sync".
|
*/

// Endpoints públicos (no autenticados) - solo para verificar disponibilidad
Route::prefix('inventory')->group(function () {
    Route::get('/health', [InventoryController::class, 'health'])->name('api.inventory.health');
});

// Endpoints autenticados con token Sanctum
Route::middleware(['auth:sanctum', 'ability:agent:sync'])
    ->prefix('inventory')
    ->group(function () {
        // Verifica si un equipo ya existe en GLPI por su UUID/serial
        Route::post('/identify', [InventoryController::class, 'identify'])
            ->name('api.inventory.identify');

        // Recibe el payload completo del agente y hace upsert
        Route::post('/sync', [InventoryController::class, 'sync'])
            ->name('api.inventory.sync');

        // Marca el dispositivo como visto (heartbeat liviano)
        Route::post('/heartbeat', [InventoryController::class, 'heartbeat'])
            ->name('api.inventory.heartbeat');
    });
