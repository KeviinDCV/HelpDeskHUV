<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Sin cookie, la aplicación abre en claro; el modo oscuro es una elección de cada persona
        // (el botón de la cabecera guarda 'light', 'dark' o 'system' aquí y en localStorage).
        View::share('appearance', $request->cookie('appearance') ?? 'light');

        return $next($request);
    }
}
