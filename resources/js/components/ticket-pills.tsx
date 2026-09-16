/**
 * Etiquetas de prioridad y estado de un caso, iguales en el dashboard y en la lista de casos.
 *
 * Misma escala de color que ya usaba el panel (media amarilla, alta naranja, muy alta roja),
 * con una corrección: "Muy alta" y "Urgente" eran red-100 y red-200, casi indistinguibles.
 * Urgente pasa a rojo sólido (blanco encima: 4.8:1), el único caso que debe gritar.
 * Todas las clases tienen su override de modo oscuro en app.css.
 */
export const PRIORIDAD: Record<number, { pill: string; punto: string; barra?: string }> = {
    6: { pill: 'bg-red-600 text-white', punto: 'bg-red-600', barra: 'bg-red-600' },
    5: { pill: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/15', punto: 'bg-red-400', barra: 'bg-red-400' },
    4: { pill: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/15', punto: 'bg-orange-400' },
    3: { pill: 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20', punto: 'bg-yellow-400' },
    2: { pill: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/15', punto: 'bg-blue-400' },
    1: { pill: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/15', punto: 'bg-gray-400' },
};

/** Escala de GLPI: 1 = muy baja … 6 = urgente. */
export const NOMBRE_PRIORIDAD: Record<number, string> = { 1: 'Muy baja', 2: 'Baja', 3: 'Media', 4: 'Alta', 5: 'Muy alta', 6: 'Urgente' };

/** El estado va en gris con un punto: así no compite en color con la prioridad. */
export const ESTADO: Record<number, { corto: string; punto: string }> = {
    1: { corto: 'Nuevo', punto: 'bg-blue-500' },
    2: { corto: 'En curso', punto: 'bg-emerald-500' },
    3: { corto: 'Planificado', punto: 'bg-violet-500' },
    4: { corto: 'En espera', punto: 'bg-amber-500' },
    5: { corto: 'Resuelto', punto: 'bg-green-600' },
    6: { corto: 'Cerrado', punto: 'bg-gray-400' },
};

export function PriorityPill({ priority, name }: { priority: number; name: string }) {
    const p = PRIORIDAD[priority] ?? PRIORIDAD[3];
    return (
        <span className={`inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-4 ${p.pill}`}>
            {name}
        </span>
    );
}

/** Texto corto ("En curso") con el nombre completo de GLPI ("En curso (asignado)") al pasar el mouse. */
export function StatusPill({ status, name }: { status: number; name: string }) {
    // Un estado fuera de 1–6 se muestra con su nombre (antes decía "Nuevo")
    const e = ESTADO[status] ?? { corto: name || 'Desconocido', punto: 'bg-gray-300' };
    return (
        <span title={name} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium leading-4 text-gray-700">
            <span aria-hidden="true" className={`size-1.5 rounded-full ${e.punto}`} />
            {e.corto}
        </span>
    );
}
