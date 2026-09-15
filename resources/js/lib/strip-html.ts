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

/** Texto de un documento inerte, con un salto de línea donde había <br> o terminaba un bloque. */
function textoConSaltos(html: string): string {
    const body = new DOMParser().parseFromString(html, 'text/html').body;
    body.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
    body.querySelectorAll('li').forEach((li) => li.prepend('• '));
    // Párrafos y listas quedan separados por una línea en blanco; filas y divs, por un salto
    body.querySelectorAll('div, li, tr').forEach((bloque) => bloque.append('\n'));
    body.querySelectorAll('p, ul, ol, table, h1, h2, h3, h4, h5, h6, blockquote, pre').forEach((bloque) => bloque.append('\n\n'));
    return body.textContent ?? '';
}

/**
 * Como stripHtml, pero para LEER un texto largo (la descripción de un caso):
 *  - conserva los párrafos y saltos de línea; stripHtml los pega ("HolaMundo");
 *  - deshace el HTML escapado de los casos creados en GLPI (&lt;p&gt;…), que en una sola
 *    pasada quedaba como etiquetas literales en pantalla.
 * Usa el mismo DOMParser inerte que stripHtml.
 */
export function htmlToText(html: string | null | undefined): string {
    if (!html) return '';
    let texto = textoConSaltos(html);
    if (/<[a-z][\s\S]*>/i.test(texto)) texto = textoConSaltos(texto);
    return texto
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
