import { Link } from '@inertiajs/react';
import { ArrowUpRight, MessageSquare, Plus } from 'lucide-react';

export interface DashboardStats {
    publicUnassigned: number;
    myTickets: number;
    myPending: number;
    myResolved: number;
}

interface Props {
    stats: DashboardStats;
}

/**
 * Título de la página, acciones principales y el tablero de cifras. Deliberadamente sobrio:
 * una herramienta de trabajo muestra el estado de la cola, no saluda.
 */
export function DashboardHeader({ stats }: Props) {
    const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const cifras = [
        {
            etiqueta: 'Sin asignar',
            valor: stats.publicUnassigned,
            detalle: 'reportes públicos esperando técnico',
            href: '/soporte/casos?filter=unassigned',
            // Naranja solo si hay algo esperando: es la cifra que pide acción.
            punto: stats.publicUnassigned > 0 ? 'bg-orange-500' : 'bg-gray-300',
        },
        { etiqueta: 'Mis casos', valor: stats.myTickets, detalle: 'asignados a ti, sin cerrar', href: '/soporte/casos?filter=my_cases', punto: 'bg-huv' },
        { etiqueta: 'Sin resolver', valor: stats.myPending, detalle: 'tuyos, todavía abiertos', href: '/soporte/casos?filter=my_pending', punto: 'bg-yellow-500' },
        { etiqueta: 'Resueltos', valor: stats.myResolved, detalle: 'solucionados por ti', href: '/soporte/casos?filter=my_resolved', punto: 'bg-green-600' },
    ];

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Mesa de ayuda</h1>
                    <p className="mt-1 text-sm text-gray-500 first-letter:uppercase">{fecha}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <a
                        href="/reportar?from=dashboard"
                        target="_blank"
                        rel="noopener"
                        className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fff] px-3.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 dark:bg-transparent dark:ring-white/15"
                    >
                        <MessageSquare className="size-4 text-gray-500" aria-hidden="true" />
                        Portal de reportes (IA)
                        <ArrowUpRight className="size-3.5 text-gray-400" aria-hidden="true" />
                        <span className="sr-only">(se abre en una pestaña nueva)</span>
                    </a>
                    <Link
                        href="/soporte/crear-caso"
                        className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-huv px-3.5 text-sm font-medium text-white transition-colors hover:bg-huv-hover"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        Crear caso
                    </Link>
                </div>
            </div>

            <section aria-label="Cifras de la mesa de ayuda" className="surface-card overflow-hidden">
                <ul className="grid grid-cols-2 lg:grid-cols-4">
                    {cifras.map((c, i) => (
                        <li
                            key={c.etiqueta}
                            // Divisorias: vertical entre columnas, horizontal entre filas en la rejilla 2×2.
                            className={`${i % 2 === 1 ? 'border-l' : ''} ${i >= 2 ? 'border-t lg:border-t-0 lg:border-l' : ''}`}
                        >
                            <Link
                                href={c.href}
                                aria-label={`${c.etiqueta}: ${c.valor.toLocaleString('es-CO')}, ${c.detalle}. Ver en Casos`}
                                className="focus-ring group flex h-full flex-col px-5 py-4 text-gray-900 transition-colors hover:bg-gray-50 sm:px-6"
                            >
                                <span className="flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                        <span aria-hidden="true" className={`size-2 rounded-full ${c.punto}`} />
                                        {c.etiqueta}
                                    </span>
                                    <ArrowUpRight
                                        aria-hidden="true"
                                        className="size-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                                    />
                                </span>
                                <span className="mt-2 text-[2rem] font-semibold leading-none tracking-tight tabular-nums text-gray-900">
                                    {c.valor.toLocaleString('es-CO')}
                                </span>
                                <span className="mt-2 text-xs text-gray-500">{c.detalle}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
