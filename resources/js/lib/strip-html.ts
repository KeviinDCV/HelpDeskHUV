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
 *
 * Solo se quitan etiquetas HTML de verdad. Un texto como «Juan <jperez@huv.gov.co>» o
 * «Llama <EDWARD A PEDIR…» no es marcado: el navegador lo tomaría por una etiqueta y lo borraría,
 * así que todo «<» que no abre una etiqueta conocida se escapa antes de interpretar.
 */

// Etiquetas que se reconocen como marcado (las de GLPI y las de un texto pegado de Word, "o:p")
const NOMBRES =
    'a|abbr|address|article|aside|b|bdi|bdo|big|blockquote|body|br|caption|center|cite|code|col|colgroup|dd|del|details|dfn|div|dl|dt|em|figcaption|figure|font|footer|h[1-6]|head|header|hr|html|i|img|ins|kbd|label|li|main|mark|meta|nav|ol|p|pre|q|s|samp|section|small|span|strike|strong|sub|summary|sup|table|tbody|td|tfoot|th|thead|time|tr|tt|u|ul|var|wbr|[a-z]+:[a-z]+';
// Atributos nombre="valor": «<A PEDIR>» (palabras sueltas) no es una etiqueta
const ATRIBUTOS = `(?:\\s+[\\w:.-]+\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s"'<>=\`]+))*`;
const FUENTE_ETIQUETA = `<\\/?(?:${NOMBRES})(?=[\\s/>])${ATRIBUTOS}\\s*\\/?>`;
const ETIQUETA = new RegExp(FUENTE_ETIQUETA, 'i');
const ETIQUETA_AQUI = new RegExp(FUENTE_ETIQUETA, 'iy');
const ENTIDAD = /&(?:lt|gt|amp|nbsp|quot|apos|#\d+|#x[0-9a-f]+);/i;

/** Escapa cada «<» que no abre una etiqueta conocida (ni un comentario), para que se lea como texto. */
function escaparSueltos(texto: string): string {
    let salida = '';
    let i = 0;
    while (i < texto.length) {
        const j = texto.indexOf('<', i);
        if (j === -1) {
            salida += texto.slice(i);
            break;
        }
        salida += texto.slice(i, j);
        ETIQUETA_AQUI.lastIndex = j;
        const etiqueta = ETIQUETA_AQUI.exec(texto);
        let fin = etiqueta ? j + etiqueta[0].length : -1;
        if (fin === -1 && texto.startsWith('<!--', j)) {
            const cierre = texto.indexOf('-->', j + 4);
            if (cierre !== -1) fin = cierre + 3;
        }
        if (fin === -1) {
            salida += '&lt;';
            i = j + 1;
        } else {
            salida += texto.slice(j, fin);
            i = fin;
        }
    }
    return salida;
}

/** ¿Trae marcado de GLPI (etiquetas, escapadas o no, o entidades como &amp;)? */
export function tieneMarcado(texto: string | null | undefined): boolean {
    if (!texto) return false;
    return ETIQUETA.test(texto) || ENTIDAD.test(texto);
}

export function stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    return new DOMParser().parseFromString(escaparSueltos(html), 'text/html').body.textContent ?? '';
}

/**
 * Texto de un contenido que puede venir con el HTML escapado de GLPI (&lt;p&gt;…): tras una
 * pasada quedan etiquetas de verdad y hace falta otra. Solo si de verdad hay etiquetas.
 */
export function stripHtmlDoble(html: string | null | undefined): string {
    const una = stripHtml(html);
    return ETIQUETA.test(una) ? stripHtml(una) : una;
}

/** Texto de un documento inerte, con un salto de línea donde había <br> o terminaba un bloque. */
function textoConSaltos(html: string): string {
    const body = new DOMParser().parseFromString(escaparSueltos(html), 'text/html').body;
    body.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
    body.querySelectorAll('li').forEach((li) => li.prepend('• '));
    // Las celdas de una tabla, separadas por un tabulador (antes salían pegadas: «yellantenW015A01»)
    body.querySelectorAll('td, th').forEach((celda) => celda.append('\t'));
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
    if (ETIQUETA.test(texto)) texto = textoConSaltos(texto);
    return texto
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
