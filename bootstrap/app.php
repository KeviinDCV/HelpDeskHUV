<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\OptimizeResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Excluir rutas públicas del CSRF para evitar errores 419 por token expirado
        $middleware->validateCsrfTokens(except: [
            'reportar',
            'chatbot',
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            // AddLinkHeadersForPreloadedAssets::class, // Deshabilitado: causa warning de preload no usado
            OptimizeResponse::class,
        ]);

        // API: middleware para tokens de Sanctum (agente de inventario)
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        // Aliases de Sanctum para chequeo de habilidades en tokens
        $middleware->alias([
            'ability' => \Laravel\Sanctum\Http\Middleware\CheckAbilities::class,
            'abilities' => \Laravel\Sanctum\Http\Middleware\CheckForAnyAbility::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Errores de base de datos en las páginas públicas (reportar un problema y su asistente):
        // el mensaje de Laravel trae el SQL con los valores puestos, y al crear el caso esos
        // valores son el nombre, el cargo, el servicio, la extensión y la descripción de quien
        // reporta. Aquí se registra el error sin ellos. En el resto de la app, el registro normal.
        $exceptions->report(function (QueryException $e) {
            if (! request()->is('reportar', 'reportar/*', 'chatbot', 'chatbot-puter')) {
                return null;
            }

            // El mensaje del motor puede citar un valor («Duplicate entry 'Ana Ruiz'…»): se
            // conservan los nombres de columna o tabla citados y se tapan los textos con espacios.
            $motor = preg_replace_callback(
                "/'([^']*)'/u",
                fn ($m) => (mb_strlen($m[1]) > 40 || preg_match('/\s/u', $m[1])) ? "'…'" : $m[0],
                $e->getPrevious()?->getMessage() ?? ''
            );
            $origen = collect($e->getTrace())->first(fn ($f) => str_starts_with($f['file'] ?? '', app_path()));

            Log::error('Error de base de datos en /'.request()->path(), [
                'error' => $motor,
                'sql' => $e->getSql(), // con «?» en lugar de los valores
                'conexion' => $e->getConnectionName(),
                'origen' => $origen ? str_replace(base_path().DIRECTORY_SEPARATOR, '', $origen['file']).':'.$origen['line'] : null,
            ]);

            return false;
        });
    })->create();
