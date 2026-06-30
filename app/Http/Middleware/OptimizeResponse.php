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

        // === Cabeceras de seguridad — en TODAS las respuestas (incluidas las de error 4xx/5xx) ===
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        // CSP en modo Report-Only para no romper nada: detecta violaciones sin bloquear.
        // (La app usa script/estilo inline en el blade y la fuente externa fonts.bunny.net.)
        if (!$response->headers->has('Content-Security-Policy-Report-Only')) {
            $response->headers->set('Content-Security-Policy-Report-Only',
                "default-src 'self'; "
                . "script-src 'self' 'unsafe-inline'; "
                . "style-src 'self' 'unsafe-inline' https://fonts.bunny.net; "
                . "font-src 'self' https://fonts.bunny.net data:; "
                . "img-src 'self' data: https:; "
                . "connect-src 'self'; "
                . "object-src 'none'; "
                . "base-uri 'self'; "
                . "frame-ancestors 'self'");
        }

        // HSTS sólo cuando la conexión es HTTPS (no tiene efecto/utilidad sobre HTTP).
        if ($request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // === Cache (solo respuestas exitosas) ===
        if ($response->getStatusCode() !== 200) {
            return $response;
        }

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
