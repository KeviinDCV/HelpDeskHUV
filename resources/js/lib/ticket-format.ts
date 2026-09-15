import { stripHtml } from '@/lib/strip-html';

/**
 * GLPI guarda las fechas como "YYYY-MM-DD HH:mm:ss" en hora local de Bogotá, sin zona.
 * `new Date()` con el espacio solo funciona en Chrome (Safari devuelve Invalid Date); con la
 * "T" es ISO sin desfase, que el estándar obliga a leer como hora local en todos los motores.
 */
export function parseFecha(fecha: string): Date {
    return new Date(fecha.includes('T') ? fecha : fecha.replace(' ', 'T'));
}

/** "hace 12 min", "hace 3 h", "hace 2 días"; a partir de una semana, la fecha corta. */
export function haceCuanto(fecha: string, ahora: number = Date.now()): string {
    const t = parseFecha(fecha).getTime();
    if (Number.isNaN(t)) return '';
    const min = Math.floor((ahora - t) / 60_000);
    if (min < 1) return 'ahora';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return d === 1 ? 'hace 1 día' : `hace ${d} días`;
    return parseFecha(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export function fechaCompleta(fecha: string): string {
    return parseFecha(fecha).toLocaleString('es-CO', {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    });
}

/**
 * Texto plano del caso. Los casos creados desde GLPI pueden venir con el HTML escapado
 * (&lt;p&gt;…): el primer paso lo decodifica a etiquetas literales y el segundo las quita.
 */
function textoPlano(content: string): string {
    const una = stripHtml(content);
    return /<[a-z][\s\S]*>/i.test(una) ? stripHtml(una) : una;
}

/**
 * Solo la descripción del problema. Los casos de /reportar llevan detrás el equipo y los datos
 * del reportante (PublicTicketController::formatContent); recortar a 150 caracteres a ciegas
 * metía "Tipo de equipo: Computador --- Datos de…" en la vista previa de la lista.
 */
export function resumenCaso(content: string): string {
    const texto = textoPlano(content);
    const corte = texto.search(/\n\s*\n|^\s*(ECOM:|Tipo de equipo:|---)/m);
    return (corte === -1 ? texto : texto.slice(0, corte)).replace(/\s+/g, ' ').trim();
}

/** El servicio desde el que se reportó, si el caso lo trae (los de /reportar sí). */
export function areaCaso(content: string): string | null {
    const m = textoPlano(content).match(/^\s*Área:\s*(.+)$/m);
    return m ? m[1].trim() : null;
}

/** "Software > Servinte > Clinico" → "Servinte › Clinico": lo que distingue está al final. */
export function categoriaCorta(completename: string | null): string | null {
    if (!completename) return null;
    return completename.split('>').map((s) => s.trim()).filter(Boolean).slice(-2).join(' › ');
}
