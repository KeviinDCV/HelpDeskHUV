import { CheckSquare, Clock, Eye, Loader2, MapPin, Tag, UserPlus, Users } from 'lucide-react';

import { PRIORIDAD, PriorityPill, StatusPill } from '@/components/ticket-pills';
import { areaCaso, categoriaCorta, fechaCompleta, haceCuanto, parseFecha, resumenCaso } from '@/lib/ticket-format';
import { cn } from '@/lib/utils';

export interface DashboardTicket {
    id: number;
    name: string;
    content: string;
    date: string;
    date_creation: string;
    date_mod?: string;
    priority: number;
    priority_name: string;
    status: number;
    status_name: string;
    category_name: string | null;
}



const BOTON = 'focus-ring inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60';

interface Props {
    ticket: DashboardTicket;
    vistaPublica: boolean;
    esAdmin: boolean;
    tomando: boolean;
    ahora: number;
    onVer: () => void;
    onTomar: () => void;
    onAsignar: () => void;
    onResolver: () => void;
}

export function TicketRow({ ticket, vistaPublica, esAdmin, tomando, ahora, onVer, onTomar, onAsignar, onResolver }: Props) {
    const p = PRIORIDAD[ticket.priority] ?? PRIORIDAD[3];
    const resumen = resumenCaso(ticket.content);
    const area = areaCaso(ticket.content);
    const categoria = categoriaCorta(ticket.category_name);
    const iso = parseFecha(ticket.date_creation).toISOString();
    const hace = haceCuanto(ticket.date_creation, ahora);

    return (
        <li className="relative transition-colors hover:bg-gray-50">
            {p.barra && <span aria-hidden="true" className={`absolute inset-y-3 left-0 w-[3px] rounded-r-full ${p.barra}`} />}

            <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
                <div className="min-w-0 flex-1">
                    {/* Cada dato lleva su ícono en vez de separarse con "·": al envolverse en
                        móvil, un punto separador quedaba colgando al final de la línea. */}
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-2">
                            <PriorityPill priority={ticket.priority} name={ticket.priority_name} />
                            {!vistaPublica && <StatusPill status={ticket.status} name={ticket.status_name} />}
                            <span className="tabular-nums">#{ticket.id}</span>
                        </span>
                        {categoria && (
                            <span title={ticket.category_name ?? undefined} className="inline-flex min-w-0 max-w-[18rem] items-center gap-1">
                                <Tag className="size-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                                <span className="truncate">{categoria}</span>
                            </span>
                        )}
                        {area && (
                            <span className="inline-flex min-w-0 items-center gap-1">
                                <MapPin className="size-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                                <span className="truncate">{area}</span>
                            </span>
                        )}
                        {/* En móvil el tiempo va aquí; desde sm pasa junto a las acciones. */}
                        <time dateTime={iso} title={fechaCompleta(ticket.date_creation)} className="inline-flex items-center gap-1 sm:hidden">
                            <Clock className="size-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                            {hace}
                        </time>
                    </div>

                    {/* h3: h1 es el saludo y h2 el nombre de la lista. Así un lector de pantalla
                        recorre la cola saltando de caso en caso por encabezados. */}
                    <h3 className="mt-1.5 line-clamp-2 text-[15px] font-medium leading-snug text-gray-900 sm:truncate">
                        {ticket.name}
                    </h3>
                    {resumen && <p className="mt-0.5 hidden truncate text-sm text-gray-500 sm:block">{resumen}</p>}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <time
                        dateTime={iso}
                        title={fechaCompleta(ticket.date_creation)}
                        className="mr-1 hidden w-24 items-center justify-end gap-1 whitespace-nowrap text-xs tabular-nums text-gray-500 sm:inline-flex"
                    >
                        <Clock className="size-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                        {hace}
                    </time>
                    <button
                        type="button"
                        onClick={onVer}
                        aria-label={`Ver detalles del caso #${ticket.id}`}
                        title="Ver detalles"
                        className={cn(BOTON, 'w-8 px-0 text-gray-500 hover:bg-gray-100 hover:text-gray-900')}
                    >
                        <Eye className="size-4" aria-hidden="true" />
                    </button>

                    {vistaPublica ? (
                        <>
                            {esAdmin && (
                                <button
                                    type="button"
                                    onClick={onAsignar}
                                    aria-label={`Asignar caso #${ticket.id}`}
                                    className={cn(BOTON, 'flex-1 bg-[#fff] text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:flex-none dark:bg-transparent dark:ring-white/15')}
                                >
                                    <Users className="size-4" aria-hidden="true" />
                                    Asignar
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onTomar}
                                disabled={tomando}
                                aria-label={`Tomar caso #${ticket.id}`}
                                className={cn(BOTON, 'flex-1 bg-huv text-white hover:bg-huv-hover sm:flex-none')}
                            >
                                {tomando ? (
                                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <UserPlus className="size-4" aria-hidden="true" />
                                )}
                                {tomando ? 'Tomando…' : 'Tomar'}
                            </button>
                        </>
                    ) : (
                        /* green-700 y no green-600: blanco sobre green-600 da 3.3:1, por debajo del 4.5:1 de AA. */
                        <button
                            type="button"
                            onClick={onResolver}
                            aria-label={`Resolver caso #${ticket.id}`}
                            className={cn(BOTON, 'flex-1 bg-green-700 text-white hover:bg-green-800 sm:flex-none')}
                        >
                            <CheckSquare className="size-4" aria-hidden="true" />
                            Resolver
                        </button>
                    )}
                </div>
            </div>
        </li>
    );
}
