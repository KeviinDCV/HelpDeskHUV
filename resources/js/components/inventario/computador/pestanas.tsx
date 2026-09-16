/**
 * Pestañas de Ver y Editar computador: una columna a la izquierda en pantallas anchas y una fila
 * que se desliza en el celular. Patrón de pestañas de ARIA: flechas, Inicio y Fin entre pestañas;
 * solo la activa entra en el orden de tabulación.
 */
import { cn } from '@/lib/utils';
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface Pestana<T extends string> {
    clave: T;
    texto: string;
    /** Cuántos registros tiene (se omite en las pestañas que no son listas) */
    contador?: number;
}

export function Pestanas<T extends string>({
    pestanas,
    activa,
    onCambiar,
    etiqueta,
    children,
}: {
    pestanas: Pestana<T>[];
    activa: T;
    onCambiar: (clave: T) => void;
    etiqueta: string;
    children: ReactNode;
}) {
    const lista = useRef<HTMLDivElement>(null);

    // En el celular la fila de pestañas se desliza: la activa (p. ej. al volver con ?tab=infocom)
    // debe quedar a la vista. Solo se mueve la fila, nunca la página.
    useEffect(() => {
        const fila = lista.current;
        const boton = fila?.querySelector<HTMLElement>('[aria-selected=true]');
        if (!fila || !boton || fila.scrollWidth <= fila.clientWidth) return;
        const rf = fila.getBoundingClientRect();
        const rb = boton.getBoundingClientRect();
        if (rb.left < rf.left || rb.right > rf.right) fila.scrollLeft += rb.left - rf.left - (rf.width - rb.width) / 2;
    }, [activa]);

    const mover = (e: KeyboardEvent<HTMLButtonElement>, indice: number) => {
        const ultimo = pestanas.length - 1;
        const destino = {
            ArrowDown: indice === ultimo ? 0 : indice + 1,
            ArrowRight: indice === ultimo ? 0 : indice + 1,
            ArrowUp: indice === 0 ? ultimo : indice - 1,
            ArrowLeft: indice === 0 ? ultimo : indice - 1,
            Home: 0,
            End: ultimo,
        }[e.key];
        if (destino === undefined) return;
        e.preventDefault();
        onCambiar(pestanas[destino].clave);
        lista.current?.querySelectorAll<HTMLButtonElement>('[role=tab]')[destino]?.focus();
    };

    return (
        <div className="grid items-start gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
            <div
                ref={lista}
                role="tablist"
                aria-label={etiqueta}
                className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:sticky lg:top-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
            >
                {pestanas.map((p, i) => {
                    const seleccionada = p.clave === activa;
                    return (
                        <button
                            key={p.clave}
                            type="button"
                            role="tab"
                            id={`pestana-${p.clave}`}
                            aria-selected={seleccionada}
                            aria-controls={`panel-${p.clave}`}
                            tabIndex={seleccionada ? 0 : -1}
                            onClick={() => onCambiar(p.clave)}
                            onKeyDown={(e) => mover(e, i)}
                            className={cn(
                                'focus-ring flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm whitespace-nowrap transition-colors',
                                seleccionada ? 'bg-huv-soft font-semibold text-huv-ink' : 'text-gray-600 hover:bg-[#f3f4f6] hover:text-gray-900 dark:hover:bg-white/5',
                            )}
                        >
                            {p.texto}
                            {p.contador !== undefined && (
                                <span className={cn('text-xs tabular-nums', seleccionada ? 'text-huv-ink' : p.contador > 0 ? 'text-gray-700' : 'text-gray-500')}>
                                    {p.contador.toLocaleString('es-CO')}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            <div role="tabpanel" id={`panel-${activa}`} aria-labelledby={`pestana-${activa}`} className="min-w-0">
                {children}
            </div>
        </div>
    );
}

/** La pestaña inicial: la de ?tab= (los guardados del servidor vuelven con ella) o la primera. */
export function pestanaInicial<T extends string>(validas: readonly T[], porDefecto: T): T {
    if (typeof window === 'undefined') return porDefecto;
    const tab = new URLSearchParams(window.location.search).get('tab');
    return (validas as readonly string[]).includes(tab ?? '') ? (tab as T) : porDefecto;
}
