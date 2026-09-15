import { Link } from '@inertiajs/react';
import { BarChart3, ChevronRight, Hourglass, LayoutList } from 'lucide-react';

import { categoriaCorta, fechaCompleta, haceCuanto, parseFecha } from '@/lib/ticket-format';

import { PRIORIDAD } from '@/components/ticket-pills';

import { type DashboardTicket } from './ticket-row';

interface Props {
    tickets: DashboardTicket[];
    vistaPublica: boolean;
    ahora: number;
    onVer: (id: number) => void;
}

/**
 * Lectura rápida de la lista activa: cuánto hay de cada prioridad, qué lleva más tiempo
 * esperando y de qué tipo son los casos. Todo sale de los mismos datos que ya trae la
 * página — no hay consultas nuevas.
 */
export function QueueSummary({ tickets, vistaPublica, ahora, onVer }: Props) {
    const porPrioridad = [6, 5, 4, 3, 2, 1]
        .map((nivel) => ({
            nivel,
            nombre: tickets.find((t) => t.priority === nivel)?.priority_name ?? '',
            total: tickets.filter((t) => t.priority === nivel).length,
        }))
        .filter((g) => g.total > 0);

    const masAntiguo = tickets.reduce<DashboardTicket | null>(
        (viejo, t) => (!viejo || parseFecha(t.date_creation) < parseFecha(viejo.date_creation) ? t : viejo),
        null,
    );

    const categorias = Object.entries(
        tickets.reduce<Record<string, number>>((acc, t) => {
            const c = categoriaCorta(t.category_name) ?? 'Sin categoría';
            acc[c] = (acc[c] ?? 0) + 1;
            return acc;
        }, {}),
    )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

    const descripcionBarra = porPrioridad.map((g) => `${g.total} ${g.nombre.toLowerCase()}`).join(', ');

    return (
        <div className="space-y-5">
            <section aria-labelledby="resumen-lista" className="surface-card p-5">
                <div className="flex items-center gap-2">
                    <BarChart3 className="size-4 text-huv-ink" aria-hidden="true" />
                    <h2 id="resumen-lista" className="text-sm font-semibold text-gray-900">
                        Resumen de la lista
                    </h2>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                    {vistaPublica ? 'Reportes públicos sin técnico' : 'Tus casos sin resolver'} · {tickets.length}{' '}
                    {tickets.length === 1 ? 'caso' : 'casos'}
                </p>

                {tickets.length === 0 ? (
                    <p className="mt-4 rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500">Nada pendiente en esta lista.</p>
                ) : (
                    <>
                        <div
                            role="img"
                            aria-label={`Por prioridad: ${descripcionBarra}`}
                            className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full"
                        >
                            {porPrioridad.map((g) => (
                                <span key={g.nivel} className={PRIORIDAD[g.nivel].punto} style={{ flexGrow: g.total }} />
                            ))}
                        </div>
                        <ul className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1.5" aria-hidden="true">
                            {porPrioridad.map((g) => (
                                <li key={g.nivel} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-gray-600">
                                        <span className={`size-2 rounded-full ${PRIORIDAD[g.nivel].punto}`} />
                                        {g.nombre}
                                    </span>
                                    <span className="font-medium tabular-nums text-gray-900">{g.total}</span>
                                </li>
                            ))}
                        </ul>

                        {masAntiguo && (
                            <div className="mt-5 border-t pt-4">
                                <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                    <Hourglass className="size-3.5" aria-hidden="true" />
                                    {vistaPublica ? 'Espera más larga' : 'Tu caso más antiguo'}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => onVer(masAntiguo.id)}
                                    className="focus-ring group mt-2 flex w-full items-start gap-3 rounded-xl bg-gray-50 px-3 py-2.5 text-left transition-colors hover:bg-gray-100"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-gray-900">{masAntiguo.name}</span>
                                        <span className="mt-0.5 block text-xs text-gray-500">
                                            #{masAntiguo.id} ·{' '}
                                            <time dateTime={parseFecha(masAntiguo.date_creation).toISOString()} title={fechaCompleta(masAntiguo.date_creation)}>
                                                {haceCuanto(masAntiguo.date_creation, ahora)}
                                            </time>
                                        </span>
                                    </span>
                                    <ChevronRight className="mt-0.5 size-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                                </button>
                            </div>
                        )}

                        <div className="mt-5 border-t pt-4">
                            <p className="text-xs font-medium text-gray-500">Categorías más frecuentes</p>
                            <ul className="mt-2 flex flex-wrap gap-1.5">
                                {categorias.map(([nombre, total]) => (
                                    <li key={nombre} className="inline-flex items-center gap-1.5 rounded-lg bg-huv-soft px-2 py-1 text-xs text-huv-ink">
                                        {nombre}
                                        <span className="font-semibold tabular-nums">{total}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </section>

            <nav aria-labelledby="accesos-rapidos" className="surface-card p-2">
                <h2 id="accesos-rapidos" className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Accesos rápidos
                </h2>
                <ul>
                    <li>
                        <Link href="/soporte/casos" className="focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-900 transition-colors hover:bg-gray-50">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-huv-soft text-huv-ink">
                                <LayoutList className="size-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-gray-900">Todos los casos</span>
                                <span className="block text-xs text-gray-500">Buscar, filtrar y exportar</span>
                            </span>
                            <ChevronRight className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
                        </Link>
                    </li>
                    <li>
                        <Link href="/soporte/estadisticas" className="focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-900 transition-colors hover:bg-gray-50">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-huv-soft text-huv-ink">
                                <BarChart3 className="size-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-gray-900">Estadísticas</span>
                                <span className="block text-xs text-gray-500">Tendencia, estados y rendimiento</span>
                            </span>
                            <ChevronRight className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
