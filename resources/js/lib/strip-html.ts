/**
 * Convierte HTML a texto plano de forma segura.
 *
 * El contenido de un ticket puede traer markup legítimo —GLPI lo guarda así desde su editor—,
 * así que hay que limpiarlo en vez de renderizarlo tal cual. Lo que NO se puede hacer es
 * limpiarlo con `innerHTML`:
 *
 *     const tmp = document.createElement('div');
 *     tmp.innerHTML = html;              // ← inseguro
 *     return tmp.textContent;
 *
 * Aunque ese <div> nunca se adjunte al documento, sigue teniendo un `ownerDocument` vivo: el
 * navegador resuelve los recursos, así que `<img src=x onerror=...>` SÍ se ejecuta (de forma
 * asíncrona, cuando falla la carga). textContent devuelve texto limpio y el usuario no ve nada
 * raro, pero el payload ya corrió en su sesión.
 *
 * DOMParser produce un documento inerte, sin contexto de navegación: no carga imágenes ni
 * ejecuta scripts ni manejadores. Es el primitivo correcto para esto.
 */
export function stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    return new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
}
