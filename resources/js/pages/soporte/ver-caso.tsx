import { FlashBanner } from '@/components/flash-banner';
import { GLPIFooter } from '@/components/glpi-footer';
import { GLPIHeader } from '@/components/glpi-header';
import { ResolverCasoDialog } from '@/components/resolver-caso-dialog';
import { PriorityPill, StatusPill } from '@/components/ticket-pills';
import { htmlToText } from '@/lib/strip-html';
import { fechaCompleta, haceCuanto, parseFecha } from '@/lib/ticket-format';
import { btn } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowUpRight, CheckCircle2, CheckSquare, Download, FileText, Monitor, Paperclip, Pencil } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

interface Ticket {
    id: number;
    name: string;
    content: string;
    date: string;
    date_creation: string;
    date_mod: string;
    time_to_resolve: string | null;
    solvedate?: string | null;
    closedate?: string | null;
    status: number;
    status_name: string;
    priority: number;
    priority_name: string;
    urgency: number;
    urgency_name: string;
    impact: number;
    impact_name: string;
    entity_name: string | null;
    location_name: string | null;
    category_name: string | null;
}

interface Person {
    id: number;
    firstname: string | null;
    realname: string | null;
    fullname: string | null;
}

interface TicketItem {
    itemtype: string;
    items_id: number;
    name: string;
}

interface Attachment {
    name: string;
    url: string;
    size: number;
    mime?: string | null;
    source?: 'local' | 'glpi';
    glpi_id?: number;
}

interface Solution {
    id: number;
    content: string;
    date_creation: string;
    users_id: number;
    solved_by: string | null;
}

interface VerCasoProps {
    ticket: Ticket;
    requester: Person | null;
    technician: Person | null;
    technicians?: Person[];
    observers?: Person[];
    permissions?: { canEdit: boolean; canResolve: boolean };
    ticketItems: TicketItem[];
    attachments: Attachment[];
    solution: Solution | null;
    auth: { user: { name: string; role: string } };
}

const TIPO_ELEMENTO: Record<string, string> = {
    Computer: 'Computador',
    Monitor: 'Monitor',
    NetworkEquipment: 'Dispositivo de red',
    Peripheral: 'Periférico',
    Printer: 'Impresora',
    Phone: 'Teléfono',
    Enclosure: 'Gabinete',
    Software: 'Programa',
};

/** Tipos de elemento con página de detalle en Inventario. */
const RUTA_ELEMENTO: Record<string, string> = {
    Computer: '/inventario/computadores',
    Monitor: '/inventario/monitores',
    NetworkEquipment: '/inventario/dispositivos-red',
    Printer: '/inventario/impresoras',
    Software: '/inventario/programas',
};

/** "15 sept 2026, 07:12 a. m." — sin los "de" de es-CO, para que quepa en la ficha lateral. */
function fecha(valor: string | null | undefined): string {
    if (!valor) return '—';
    const d = parseFecha(valor);
    if (Number.isNaN(d.getTime())) return '—';
    const mes = d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
    const hora = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    return `${d.getDate()} ${mes} ${d.getFullYear()}, ${hora}`;
}

function tamano(bytes: number): string | null {
    if (!bytes) return null; // GLPI no guarda el tamaño: 0 = el archivo no está en disco
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

const esImagen = (a: Attachment) => /\.(jpe?g|png|gif|webp|bmp)$/i.test(a.name) || a.mime?.startsWith('image/');

/** Miniatura de las imágenes; si el archivo no carga (p. ej. un documento de GLPI que ya no está en disco), el ícono. */
function Miniatura({ adjunto }: { adjunto: Attachment }) {
    const [fallo, setFallo] = useState(false);
    if (esImagen(adjunto) && adjunto.size > 0 && !fallo) {
        return <img src={adjunto.url} alt="" loading="lazy" onError={() => setFallo(true)} className="size-10 shrink-0 rounded-lg bg-gray-100 object-cover" />;
    }
    return (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <FileText className="size-5 text-gray-500" aria-hidden="true" />
        </span>
    );
}

function Seccion({ titulo, icono, acciones, children, className }: { titulo: string; icono?: ReactNode; acciones?: ReactNode; children: ReactNode; className?: string }) {
    const id = useId();
    return (
        <section aria-labelledby={id} className={cn('surface-card min-w-0 p-5 sm:p-6', className)}>
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id={id} className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    {icono}
                    {titulo}
                </h2>
                {acciones}
            </div>
            {children}
        </section>
    );
}

/** Una fila de la ficha lateral. `vacio` = el texto gris que se ve cuando no hay dato. */
function Dato({ etiqueta, children, vacio = '—', aviso = false }: { etiqueta: string; children?: ReactNode; vacio?: string; aviso?: boolean }) {
    const tiene = children !== null && children !== undefined && children !== '' && children !== false;
    return (
        <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 py-2.5 text-sm">
            <dt className="text-gray-500">{etiqueta}</dt>
            <dd className={cn('min-w-0 break-words', tiene ? 'text-gray-900' : aviso ? 'font-medium text-amber-700 dark:text-amber-400' : 'text-gray-500')}>{tiene ? children : vacio}</dd>
        </div>
    );
}

function nombres(personas: Person[]): ReactNode {
    const lista = personas.map((p) => p.fullname?.trim()).filter(Boolean) as string[];
    if (lista.length === 0) return null;
    return lista.length === 1 ? (
        lista[0]
    ) : (
        <ul className="space-y-0.5">
            {lista.map((n) => (
                <li key={n}>{n}</li>
            ))}
        </ul>
    );
}

export default function VerCaso({
    ticket,
    requester,
    technician,
    technicians,
    observers = [],
    permissions,
    ticketItems = [],
    attachments = [],
    solution,
    auth,
}: VerCasoProps) {
    const [resolviendo, setResolviendo] = useState(false);
    // El error que el servidor devolvió al resolver ya se ve en el modal: la página no lo repite.
    const [errorDelModal, setErrorDelModal] = useState<string | null>(null);
    // La hora de referencia para "vencido": la de cuando se abrió la página
    const [ahora] = useState(() => Date.now());

    const asignados = technicians ?? (technician ? [technician] : []);
    const cerrado = ticket.status === 5 || ticket.status === 6;
    // Sin el prop (servidor anterior) se cae a lo que hacía la página: editar siempre, resolver si está abierto
    const puedeEditar = permissions?.canEdit ?? ['Administrador', 'Técnico'].includes(auth.user.role);
    const puedeResolver = permissions?.canResolve ?? !cerrado;

    const descripcion = htmlToText(ticket.content);
    const vencido = !cerrado && !!ticket.time_to_resolve && parseFecha(ticket.time_to_resolve).getTime() < ahora;

    return (
        <>
            <Head title={`HelpDesk HUV - Caso #${ticket.id}`} />
            <div className="flex min-h-screen flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Inicio
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">Soporte</span>
                            <span className="text-gray-400">/</span>
                            <Link href="/soporte/casos" className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Casos
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Caso #{ticket.id}</span>
                        </div>
                    }
                />

                <main className="flex-1">
                    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6">
                        <FlashBanner ignoreError={errorDelModal} />

                        {/* Encabezado: número, estado, título y acciones */}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm tabular-nums text-gray-500">Caso #{ticket.id}</span>
                                    <StatusPill status={ticket.status} name={ticket.status_name} />
                                    <PriorityPill priority={ticket.priority} name={ticket.priority_name} />
                                </div>
                                <h1 className="mt-2 text-2xl font-semibold tracking-tight break-words text-gray-900">{ticket.name}</h1>
                                <p className="mt-1.5 text-sm text-gray-500">
                                    Abierto el <time dateTime={ticket.date.replace(' ', 'T')}>{fecha(ticket.date)}</time>
                                    {ticket.date_mod && (
                                        <>
                                            {' · '}actualizado{' '}
                                            <time dateTime={ticket.date_mod.replace(' ', 'T')} title={fechaCompleta(ticket.date_mod)}>
                                                {haceCuanto(ticket.date_mod)}
                                            </time>
                                        </>
                                    )}
                                </p>
                            </div>
                            {(puedeResolver || puedeEditar) && (
                                <div className="flex shrink-0 flex-wrap gap-2">
                                    {puedeResolver && (
                                        <button type="button" onClick={() => setResolviendo(true)} className={cn(btn.primary, 'bg-green-700 hover:bg-green-800')}>
                                            <CheckSquare aria-hidden="true" />
                                            Resolver
                                        </button>
                                    )}
                                    {puedeEditar && (
                                        <Link href={`/soporte/casos/${ticket.id}/editar`} className={btn.secondary}>
                                            <Pencil aria-hidden="true" />
                                            Editar
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                            {/* Columna principal */}
                            <div className="min-w-0 space-y-5">
                                <Seccion titulo="Descripción">
                                    {descripcion ? (
                                        <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap text-gray-800">{descripcion}</p>
                                    ) : (
                                        <p className="text-sm text-gray-500">Sin descripción.</p>
                                    )}
                                </Seccion>

                                {solution && (
                                    <Seccion titulo="Solución" icono={<CheckCircle2 className="size-5 text-green-700" aria-hidden="true" />}>
                                        <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap text-gray-800">{htmlToText(solution.content)}</p>
                                        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-3 text-sm text-gray-500">
                                            <span>
                                                Resuelto por <span className="font-medium text-gray-900">{solution.solved_by || 'Usuario del sistema'}</span>
                                            </span>
                                            <span aria-hidden="true">·</span>
                                            <time dateTime={solution.date_creation.replace(' ', 'T')}>{fecha(solution.date_creation)}</time>
                                        </p>
                                    </Seccion>
                                )}

                                {attachments.length > 0 && (
                                    <Seccion titulo={`Adjuntos (${attachments.length})`} icono={<Paperclip className="size-4 text-gray-500" aria-hidden="true" />}>
                                        {/* grid-cols-1 (minmax(0,1fr)): sin él, un nombre largo ensanchaba la columna y la página en móvil */}
                                        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            {attachments.map((a, i) => (
                                                <li key={`${a.url}-${i}`}>
                                                    <a
                                                        href={a.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="focus-ring group flex items-center gap-3 rounded-xl p-2.5 text-gray-900 ring-1 ring-inset ring-gray-200 transition-colors hover:bg-gray-50 dark:ring-white/10"
                                                    >
                                                        <Miniatura adjunto={a} />
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate text-sm font-medium" title={a.name}>
                                                                {a.name}
                                                            </span>
                                                            <span className="block text-xs text-gray-500">{tamano(a.size) ?? (a.source === 'glpi' ? 'Documento de GLPI' : 'Archivo')}</span>
                                                        </span>
                                                        <Download className="size-4 shrink-0 text-gray-400 group-hover:text-gray-600" aria-hidden="true" />
                                                        <span className="sr-only">(se abre en una pestaña nueva)</span>
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </Seccion>
                                )}
                            </div>

                            {/* Ficha lateral */}
                            <aside className="min-w-0 space-y-5">
                                <section aria-label="Datos del caso" className="surface-card px-5 py-2 sm:px-6">
                                    <dl className="divide-y">
                                        <Dato etiqueta="Solicitante" vacio="Reporte público">
                                            {requester?.fullname?.trim()}
                                        </Dato>
                                        {/* Un caso abierto sin técnico pide acción: el aviso va en ámbar, como en el panel */}
                                        <Dato etiqueta="Asignado a" vacio="Sin asignar" aviso={!cerrado}>
                                            {nombres(asignados)}
                                        </Dato>
                                        {observers.length > 0 && <Dato etiqueta="Observadores">{nombres(observers)}</Dato>}
                                        <Dato etiqueta="Categoría" vacio="Sin categoría">
                                            {ticket.category_name}
                                        </Dato>
                                        <Dato etiqueta="Localización">{ticket.location_name}</Dato>
                                        {ticket.entity_name && <Dato etiqueta="Entidad">{ticket.entity_name}</Dato>}
                                        <Dato etiqueta="Urgencia">{ticket.urgency_name}</Dato>
                                        <Dato etiqueta="Impacto">{ticket.impact_name}</Dato>
                                    </dl>
                                </section>

                                <section aria-label="Fechas del caso" className="surface-card px-5 py-2 sm:px-6">
                                    <dl className="divide-y">
                                        <Dato etiqueta="Apertura">{fecha(ticket.date)}</Dato>
                                        <Dato etiqueta="Actualizado">{fecha(ticket.date_mod)}</Dato>
                                        {ticket.time_to_resolve && (
                                            <Dato etiqueta="Tiempo de solución">
                                                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    {fecha(ticket.time_to_resolve)}
                                                    {vencido && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                                                            <AlertTriangle className="size-3.5" aria-hidden="true" />
                                                            Vencido
                                                        </span>
                                                    )}
                                                </span>
                                            </Dato>
                                        )}
                                        {ticket.solvedate && <Dato etiqueta="Resuelto">{fecha(ticket.solvedate)}</Dato>}
                                        {ticket.closedate && ticket.closedate !== ticket.solvedate && <Dato etiqueta="Cerrado">{fecha(ticket.closedate)}</Dato>}
                                    </dl>
                                </section>

                                {ticketItems.length > 0 && (
                                    <Seccion titulo="Elementos asociados" icono={<Monitor className="size-4 text-gray-500" aria-hidden="true" />}>
                                        <ul className="-mx-2 space-y-0.5">
                                            {ticketItems.map((item, i) => {
                                                const tipo = TIPO_ELEMENTO[item.itemtype] ?? item.itemtype;
                                                const ruta = RUTA_ELEMENTO[item.itemtype];
                                                const encontrado = item.name && item.name !== 'N/A';
                                                const contenido = (
                                                    <>
                                                        <span className="min-w-0 flex-1">
                                                            <span className={cn('block truncate text-sm font-medium', encontrado ? 'text-gray-900' : 'text-gray-500')}>
                                                                {encontrado ? item.name : `#${item.items_id} (ya no existe)`}
                                                            </span>
                                                            <span className="block text-xs text-gray-500">{tipo}</span>
                                                        </span>
                                                        {ruta && encontrado && <ArrowUpRight className="size-4 shrink-0 text-gray-400" aria-hidden="true" />}
                                                    </>
                                                );
                                                return (
                                                    <li key={`${item.itemtype}-${item.items_id}-${i}`}>
                                                        {ruta && encontrado ? (
                                                            <Link
                                                                href={`${ruta}/${item.items_id}`}
                                                                className="focus-ring flex items-center gap-3 rounded-lg px-2 py-1.5 text-gray-900 transition-colors hover:bg-gray-50"
                                                            >
                                                                {contenido}
                                                            </Link>
                                                        ) : (
                                                            <div className="flex items-center gap-3 px-2 py-1.5">{contenido}</div>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </Seccion>
                                )}
                            </aside>
                        </div>
                    </div>
                </main>

                <GLPIFooter />
            </div>

            <ResolverCasoDialog
                caso={resolviendo ? { id: ticket.id, name: ticket.name, date: ticket.date } : null}
                onClose={() => setResolviendo(false)}
                onServerError={setErrorDelModal}
            />
        </>
    );
}
