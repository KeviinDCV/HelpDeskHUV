/**
 * Piezas comunes de los formularios del rediseño (Inventario y demás): secciones, resumen de
 * errores, barra de acciones fija y estilos de los selectores. Mismo aspecto en todas las páginas.
 */
import { btn, selectTriggerClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode, type Ref } from 'react';

/** Radix Select y el selector con búsqueda, a la altura de los campos y con el rojo de error. */
export const disparador = cn(selectTriggerClass, 'text-sm aria-invalid:ring-2 aria-invalid:ring-red-500');

/** Clases del <form>: al tabular, el navegador deja el campo por encima de la barra fija de acciones. */
export const formularioClase = '[&_:is(input,textarea,button)]:scroll-mb-24';

/** Lleva el foco a un control por id (cuando el botón pulsado desaparece, el foco no cae en <body>). */
export const enfocar = (id: string) => document.getElementById(id)?.focus();

/** Errores de Laravel por campo: "items.0.type" se agrupa en "items". */
export function erroresPorCampo(errors: Record<string, string | undefined>): Record<string, string> {
    const porCampo: Record<string, string> = {};
    for (const [clave, mensaje] of Object.entries(errors)) {
        if (!mensaje) continue;
        porCampo[clave.split('.')[0]] ??= mensaje;
    }
    return porCampo;
}

/** Sección del formulario en su tarjeta, con título y una línea opcional de contexto. */
export function Seccion({ titulo, descripcion, children, className }: { titulo: string; descripcion?: ReactNode; children: ReactNode; className?: string }) {
    const id = useId();
    return (
        <section aria-labelledby={id} className={cn('surface-card min-w-0 space-y-5 p-5 sm:p-6', className)}>
            <div>
                <h2 id={id} className="text-base font-semibold text-gray-900">
                    {titulo}
                </h2>
                {descripcion && <p className="mt-0.5 text-sm text-gray-500">{descripcion}</p>}
            </div>
            {children}
        </section>
    );
}

/**
 * Sección con el título y su explicación a la izquierda y los campos en tarjeta a la derecha (el
 * mismo patrón de Perfil). Para formularios de varias secciones de campos sencillos (Inventario).
 */
export function SeccionLateral({ titulo, descripcion, children }: { titulo: string; descripcion?: ReactNode; children: ReactNode }) {
    const id = useId();
    return (
        <section aria-labelledby={id} className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
            <div className="lg:pt-1">
                <h2 id={id} className="text-base font-semibold text-gray-900">
                    {titulo}
                </h2>
                {descripcion && <p className="mt-1 text-sm text-gray-500">{descripcion}</p>}
            </div>
            <div className="surface-card grid min-w-0 gap-5 p-5 sm:grid-cols-2 sm:p-6">{children}</div>
        </section>
    );
}

/**
 * Resumen de errores al principio del formulario: cada uno lleva a su campo. `etiquetas` traduce
 * la clave de Laravel ("states_id") a lo que se ve en pantalla ("Estado"); el id del campo es la clave.
 */
export function ResumenErrores({ errores, etiquetas, accion, ref }: { errores: Record<string, string>; etiquetas: Record<string, string>; accion: string; ref?: Ref<HTMLDivElement> }) {
    const lista = Object.entries(errores);
    if (lista.length === 0) return null;
    return (
        <div
            ref={ref}
            role="alert"
            tabIndex={-1}
            className="rounded-xl bg-red-50 px-4 py-3 ring-1 ring-inset ring-red-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
        >
            <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                No se pudo {accion}. Revisa {lista.length === 1 ? 'este campo' : 'estos campos'}:
            </p>
            <ul className="mt-1.5 space-y-0.5 pl-6 text-sm text-red-700">
                {lista.map(([campo, mensaje]) => (
                    <li key={campo}>
                        <a
                            href={`#${campo}`}
                            onClick={(e) => {
                                e.preventDefault();
                                enfocar(campo);
                            }}
                            className="text-red-700 underline underline-offset-2 hover:text-red-900"
                        >
                            <span className="font-medium">{etiquetas[campo] ?? campo}:</span> {mensaje}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Mueve el foco al resumen de errores después de que se pinte (no antes, como con requestAnimationFrame). */
export function useFocoResumen() {
    const ref = useRef<HTMLDivElement>(null);
    const [pedido, setPedido] = useState(0);
    useEffect(() => {
        if (pedido) ref.current?.focus();
    }, [pedido]);
    return { ref, enfocarResumen: () => setPedido((n) => n + 1) };
}

/** Acciones al pie, fijas abajo mientras se llena el formulario. */
export function AccionesFormulario({ cancelarHref, enviando, texto, textoEnviando }: { cancelarHref: string; enviando: boolean; texto: string; textoEnviando: string }) {
    return (
        <div className="sticky bottom-0 z-10 -mx-4 mt-5 border-t bg-[#f9fafb]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:bg-[#09090b]/95">
            <div className="flex flex-wrap items-center justify-end gap-2">
                <Link href={cancelarHref} className={btn.secondary}>
                    Cancelar
                </Link>
                <button type="submit" disabled={enviando} className={btn.primary}>
                    {enviando && <Loader2 className="animate-spin" aria-hidden="true" />}
                    {enviando ? textoEnviando : texto}
                </button>
            </div>
        </div>
    );
}

/** Aviso de error que devolvió el servidor como flash (fallo al guardar). */
export function AvisoError({ mensaje }: { mensaje?: string | null }) {
    if (!mensaje) return null;
    return (
        <p role="alert" className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-inset ring-red-600/20">
            <AlertTriangle className="size-5 shrink-0 text-red-700" aria-hidden="true" />
            {mensaje}
        </p>
    );
}
