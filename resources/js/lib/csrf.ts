/**
 * Cabeceras CSRF para peticiones fetch.
 *
 * Se prefiere la cookie XSRF-TOKEN porque Laravel la renueva en cada respuesta,
 * mientras que el <meta name="csrf-token"> solo trae el token de la carga inicial:
 * en una SPA (Inertia) ese meta queda obsoleto cuando la sesión rota o expira,
 * y las peticiones POST/DELETE empiezan a fallar con 419 hasta recargar la página.
 */
export function csrfHeaders(): Record<string, string> {
    const cookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='));

    if (cookie) {
        // El valor viene URL-encodeado; se envía por X-XSRF-TOKEN (Laravel lo desencripta).
        return { 'X-XSRF-TOKEN': decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) };
    }

    const meta = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    return meta ? { 'X-CSRF-TOKEN': meta } : {};
}
