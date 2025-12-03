<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OptimizeResponse
{
    /**
     * Handle an incoming request.
     * Agrega headers de cache y optimización para mejorar el rendimiento.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Solo aplicar a respuestas exitosas
        if ($response->getStatusCode() !== 200) {
            return $response;
        }

        // Headers de seguridad y rendimiento
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        
        // Cache para assets estáticos (CSS, JS, imágenes)
        $path = $request->path();
        if (preg_match('/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/i', $path)) {
            $response->headers->set('Cache-Control', 'public, max-age=31536000, immutable');
            $response->headers->set('Vary', 'Accept-Encoding');
        }
        
        // Para páginas HTML, usar cache más conservador
        $contentType = $response->headers->get('Content-Type', '');
        if (str_contains($contentType, 'text/html')) {
            $response->headers->set('Cache-Control', 'no-cache, must-revalidate');
        }

        return $response;
    }
}
