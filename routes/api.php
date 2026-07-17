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

    // Auto-registro de un PC nuevo. Requiere enrollment_secret para evitar abuso.
    // Devuelve un token Sanctum con la habilidad agent:sync.
    //
    // throttle:10,1 — 10 intentos por minuto y por IP. Sin esto el endpoint era anónimo Y sin
    // límite: se podía probar el enrollment_secret a la velocidad que aguantara el servidor, y
    // acertarlo entrega un token Sanctum con agent:sync (lectura y escritura del inventario).
    // El grupo `api` NO trae throttle por defecto en Laravel 11+ (bootstrap/app.php no llama a
    // throttleApi()), así que hay que declararlo aquí.
    //
    // Por qué 10 y no menos: un PC se registra UNA vez, pero si el despliegue masivo saliera por
    // una IP compartida (NAT), 10/min sigue permitiendo ~600 equipos por hora. Es el mismo límite
    // que ya usa la ruta pública /reportar en web.php.
    Route::post('/register', [InventoryController::class, 'register'])
        ->middleware('throttle:10,1')
        ->name('api.inventory.register');
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
