import { DashboardHeader, type DashboardStats } from '@/components/dashboard/dashboard-header';
import { HuvBuilding } from '@/components/dashboard/huv-building';
import { QueueSummary } from '@/components/dashboard/queue-summary';
import { TicketRow, type DashboardTicket } from '@/components/dashboard/ticket-row';
import { PriorityPill, StatusPill } from '@/components/ticket-pills';
import { GLPIFooter } from '@/components/glpi-footer';
import { GLPIHeader } from '@/components/glpi-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Head, Link, router, usePage } from '@inertiajs/react';
import gsap from 'gsap';
import { AlertTriangle, CheckCircle, CheckSquare, ChevronRight, Clock, Loader2, MapPin, RefreshCw, Tag, User, UserPlus, Users } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface Solution {
    id: number;
    content: string;
    date_creation: string;
    solved_by: string | null;
}

interface TicketDetail extends DashboardTicket {
    location_name: string | null;
    assigned_tech: string | null;
    solution: Solution | null;
}

interface Technician {
    id: number;
    name: string;
}

interface DashboardProps {
    publicTickets: DashboardTicket[];
    myTickets: DashboardTicket[];
    stats: DashboardStats;
    technicians: Technician[];
    auth: { user: { name: string; role: string } };
}

type Lista = 'publicos' | 'mios';

const reducirMovimiento = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function actualizadoHace(desde: number, ahora: number): string {
    const s = Math.round((ahora - desde) / 1000);
    if (s < 60) return 'hace un momento';
    const min = Math.floor(s / 60);
    return min === 1 ? 'hace 1 min' : `hace ${min} min`;
}

export default function Dashboard({ publicTickets: initialPublicTickets, myTickets: initialMyTickets, stats: initialStats, technicians, auth }: DashboardProps) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const [lista, setLista] = useState<Lista>('publicos');
    const [taking, setTaking] = useState<number | null>(null);
    const listaRef = useRef<HTMLDivElement>(null);

    // Estados para datos actualizables
    const [publicTickets, setPublicTickets] = useState(initialPublicTickets);
    const [myTickets, setMyTickets] = useState(initialMyTickets);
    const [stats, setStats] = useState(initialStats);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Reloj para los tiempos relativos ("hace 12 min") y el sello de la última actualización.
    const [ahora, setAhora] = useState(() => Date.now());
    const [actualizado, setActualizado] = useState(() => Date.now());

    // Modal de detalles
    const [detailModal, setDetailModal] = useState<{ open: boolean; ticket: TicketDetail | null; loading: boolean }>({ open: false, ticket: null, loading: false });

    // Modal de asignación
    const [assignModal, setAssignModal] = useState<{ open: boolean; ticketId: number | null; ticketName: string }>({ open: false, ticketId: null, ticketName: '' });
    const [selectedTech, setSelectedTech] = useState('');
    const [assigning, setAssigning] = useState(false);

    // Modal de solución
    const [solveModal, setSolveModal] = useState<{ open: boolean; ticketId: number | null; ticketName: string }>({ open: false, ticketId: null, ticketName: '' });
    const [solution, setSolution] = useState('');
    const [solveDate, setSolveDate] = useState('');
    const [solving, setSolving] = useState(false);

    const isAdmin = auth?.user?.role === 'Administrador';

    // Función para actualizar tickets (reutilizable)
    const fetchTickets = async () => {
        // No hacer fetch si la página no está visible
        if (document.visibilityState !== 'visible') return;

        setIsRefreshing(true);
        try {
            const response = await fetch('/dashboard/tickets');
            if (response.ok) {
                const data = await response.json();
                setPublicTickets(data.publicTickets);
                setMyTickets(data.myTickets);
                setStats(data.stats);
                setActualizado(Date.now());
                setAhora(Date.now());
            }
        } catch (error) {
            // Silenciar errores de conexión cuando la página está en segundo plano
            if (document.visibilityState === 'visible' && import.meta.env.DEV) {
                console.warn('Dashboard polling error:', error);
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    // Polling cada 30 segundos para actualizar tickets (solo cuando la pestaña está activa)
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        const startPolling = () => {
            if (!intervalId) {
                intervalId = setInterval(fetchTickets, 30000); // 30 segundos
            }
        };

        const stopPolling = () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchTickets(); // Actualizar inmediatamente al volver
                startPolling();
            } else {
                stopPolling();
            }
        };

        // Iniciar polling
        startPolling();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        const id = setInterval(() => setAhora(Date.now()), 30_000);
        return () => clearInterval(id);
    }, []);

    const openDetailModal = async (ticketId: number) => {
        setDetailModal({ open: true, ticket: null, loading: true });
        try {
            const response = await fetch(`/dashboard/ticket/${ticketId}`);
            if (response.ok) {
                const data = await response.json();
                setDetailModal({ open: true, ticket: data, loading: false });
            }
        } catch {
            setDetailModal({ open: false, ticket: null, loading: false });
        }
    };

    const openAssignModal = (ticketId: number, ticketName: string) => {
        setAssignModal({ open: true, ticketId, ticketName });
        setSelectedTech('');
    };

    const assignTicket = () => {
        if (!assignModal.ticketId || !selectedTech) return;
        setAssigning(true);
        router.post(`/dashboard/assign-ticket/${assignModal.ticketId}`, { technician_id: selectedTech }, {
            onFinish: () => {
                setAssigning(false);
                setAssignModal({ open: false, ticketId: null, ticketName: '' });
                // Actualizar tickets inmediatamente
                fetchTickets();
            },
        });
    };

    const openSolveModal = (ticketId: number, ticketName: string) => {
        setSolveModal({ open: true, ticketId, ticketName });
        setSolution('');
        // Por defecto, usar fecha y hora actual en zona horaria local
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        setSolveDate(localDateTime);
    };

    const solveTicket = () => {
        if (!solveModal.ticketId || !solution.trim()) return;
        setSolving(true);
        router.post(`/dashboard/solve-ticket/${solveModal.ticketId}`, {
            solution: solution.trim(),
            solve_date: solveDate || undefined
        }, {
            onFinish: () => {
                setSolving(false);
                setSolveModal({ open: false, ticketId: null, ticketName: '' });
                setSolution('');
                setSolveDate('');
                // Actualizar tickets inmediatamente
                fetchTickets();
            },
        });
    };

    const takeTicket = (id: number) => {
        setTaking(id);
        router.post(`/dashboard/take-ticket/${id}`, {}, {
            onFinish: () => {
                setTaking(null);
                // Actualizar tickets inmediatamente
                fetchTickets();
            },
        });
    };

    // Cambio de lista: la actual se desvanece y las filas nuevas entran escalonadas. Antes la
    // tarjeta entera se deslizaba 100 px de lado a lado; con esto el cambio se nota sin marear.
    const cambiarLista = (nueva: Lista) => {
        if (nueva === lista) return;
        if (!listaRef.current || reducirMovimiento()) {
            setLista(nueva);
            return;
        }
        gsap.to(listaRef.current, { opacity: 0, y: 4, duration: 0.12, ease: 'power1.in', onComplete: () => setLista(nueva) });
    };

    useLayoutEffect(() => {
        const el = listaRef.current;
        if (!el) return;
        gsap.set(el, { opacity: 1, y: 0 });
        if (reducirMovimiento()) return;
        gsap.fromTo(
            el.querySelectorAll(':scope > ul > li, :scope > [data-vacio]'),
            { opacity: 0, y: 6 },
            { opacity: 1, y: 0, duration: 0.24, stagger: 0.03, ease: 'power2.out', clearProps: 'opacity,transform' },
        );
    }, [lista]);

    const vistaPublica = lista === 'publicos';
    const currentTickets = vistaPublica ? publicTickets : myTickets;

    const pestanas: { id: Lista; nombre: string; total: number }[] = [
        { id: 'publicos', nombre: 'Reportes públicos', total: stats.publicUnassigned },
        { id: 'mios', nombre: 'Mis reportes', total: stats.myPending },
    ];

    return (
        <>
            <Head title="HelpDesk HUV - Dashboard" />
            <div className="min-h-screen flex flex-col">
                <GLPIHeader />
                <main className="flex-1 bg-gray-50">
                    <div className="mx-auto w-full max-w-[1440px] space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
                        {/* Flash Messages */}
                        {props.flash?.success && (
                            <div role="status" className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 ring-1 ring-inset ring-green-600/20">
                                <CheckCircle className="size-5 shrink-0 text-green-700" aria-hidden="true" />
                                <span className="text-sm text-green-800">{props.flash.success}</span>
                            </div>
                        )}
                        {props.flash?.error && (
                            <div role="alert" className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-inset ring-red-600/20">
                                <AlertTriangle className="size-5 shrink-0 text-red-700" aria-hidden="true" />
                                <span className="text-sm text-red-800">{props.flash.error}</span>
                            </div>
                        )}

                        <DashboardHeader stats={stats} />

                        {/* minmax(0,1fr) también en móvil: sin él, una fila larga ensancha la
                            columna y el tablero se desplazaba a lo ancho en pantallas de 320–375 px */}
                        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
                            <section aria-labelledby="lista-titulo" className="surface-card overflow-hidden">
                                <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                                    <div className="min-w-0">
                                        <h2 id="lista-titulo" className="sr-only">
                                            {vistaPublica ? 'Reportes públicos' : 'Mis reportes'}
                                        </h2>
                                        {/* aria-pressed y no role="tab": filtran una lista en la misma página,
                                            no conmutan paneles. */}
                                        {/* Por debajo de 400 px los dos nombres no caben uno al lado del otro: se apilan */}
                                        <div role="group" aria-label="Lista de casos" className="inline-flex w-full max-w-full flex-col rounded-xl bg-gray-100 p-1 min-[400px]:flex-row sm:w-auto">
                                            {pestanas.map((p) => {
                                                const activa = lista === p.id;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        aria-pressed={activa}
                                                        onClick={() => cambiarLista(p.id)}
                                                        className={`focus-ring inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors sm:flex-none sm:gap-2 sm:px-3.5 sm:text-sm ${
                                                            activa ? 'elev-1 bg-[#fff] text-gray-900 dark:bg-white/10' : 'text-gray-500 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        {p.nombre}
                                                        <span
                                                            aria-hidden="true"
                                                            className={`min-w-5 rounded-full px-1.5 text-[11px] font-semibold leading-5 tabular-nums ${
                                                                activa ? 'bg-huv text-white' : 'bg-gray-200 text-gray-600'
                                                            }`}
                                                        >
                                                            {p.total}
                                                        </span>
                                                        <span className="sr-only">({p.total} {p.total === 1 ? 'caso' : 'casos'})</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">
                                            {vistaPublica
                                                ? 'Llegan del portal de reportes y aún no tienen técnico. Ordenados por prioridad.'
                                                : 'Asignados a ti y todavía sin resolver. Ordenados por prioridad.'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-500 sm:pt-1.5">
                                        <span className="relative flex size-2" aria-hidden="true">
                                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-60 motion-reduce:hidden" />
                                            <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                                        </span>
                                        <span>Actualizado {actualizadoHace(actualizado, ahora)}</span>
                                        <button
                                            type="button"
                                            onClick={fetchTickets}
                                            disabled={isRefreshing}
                                            aria-label="Actualizar la lista ahora"
                                            title="Actualizar ahora"
                                            className="focus-ring inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-60"
                                        >
                                            <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>

                                <div ref={listaRef}>
                                    {currentTickets.length === 0 ? (
                                        <div data-vacio className="px-6 py-14 text-center">
                                            <HuvBuilding className="mx-auto h-24 w-auto text-huv-ink opacity-30" />
                                            <h3 className="mt-5 text-base font-semibold text-gray-900">
                                                {vistaPublica ? 'Todo al día' : 'No tienes casos abiertos'}
                                            </h3>
                                            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                                                {vistaPublica
                                                    ? 'No hay reportes públicos esperando técnico. Esta lista se actualiza sola cada 30 segundos.'
                                                    : 'Cuando tomes un reporte o te asignen un caso, aparecerá aquí.'}
                                            </p>
                                            <Link
                                                href="/soporte/casos"
                                                className="focus-ring mt-5 inline-flex h-9 items-center gap-1 rounded-lg px-3.5 text-sm font-medium text-huv-ink ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 dark:ring-white/15"
                                            >
                                                Ver todos los casos
                                                <ChevronRight className="size-4" aria-hidden="true" />
                                            </Link>
                                        </div>
                                    ) : (
                                        <ul className="divide-y">
                                            {currentTickets.map((ticket) => (
                                                <TicketRow
                                                    key={ticket.id}
                                                    ticket={ticket}
                                                    vistaPublica={vistaPublica}
                                                    esAdmin={isAdmin}
                                                    tomando={taking === ticket.id}
                                                    ahora={ahora}
                                                    onVer={() => openDetailModal(ticket.id)}
                                                    onTomar={() => takeTicket(ticket.id)}
                                                    onAsignar={() => openAssignModal(ticket.id, ticket.name)}
                                                    onResolver={() => openSolveModal(ticket.id, ticket.name)}
                                                />
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </section>

                            <aside aria-label="Resumen y accesos" className="lg:sticky lg:top-28">
                                <QueueSummary tickets={currentTickets} vistaPublica={vistaPublica} ahora={ahora} onVer={openDetailModal} />
                            </aside>
                        </div>
                    </div>
                </main>
                <GLPIFooter />
            </div>

            {/* Modal de Detalles */}
            <Dialog
                open={detailModal.open}
                onOpenChange={(abierto) => {
                    if (!abierto) setDetailModal({ open: false, ticket: null, loading: false });
                }}
            >
                <DialogContent className="bg-white shadow-xl sm:max-w-2xl max-h-[90vh] border border-gray-200 rounded-2xl p-0 gap-0 flex flex-col overflow-hidden">
                    <DialogHeader className="p-4 pr-10 border-b bg-white rounded-t-2xl shrink-0 text-left">
                        <DialogTitle className="text-lg font-semibold text-gray-900">Detalles del Caso</DialogTitle>
                    </DialogHeader>
                    {detailModal.loading ? (
                        <div className="p-12 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-huv-ink" aria-hidden="true" />
                        </div>
                    ) : detailModal.ticket && (
                        <div className="p-4 space-y-4 overflow-y-auto">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm tabular-nums text-gray-500">#{detailModal.ticket.id}</span>
                                <PriorityPill priority={detailModal.ticket.priority} name={detailModal.ticket.priority_name} />
                                <StatusPill status={detailModal.ticket.status} name={detailModal.ticket.status_name} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">{detailModal.ticket.name}</h3>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {detailModal.ticket.category_name && (
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-gray-400" aria-hidden="true" />
                                        <span className="text-gray-600">{detailModal.ticket.category_name}</span>
                                    </div>
                                )}
                                {detailModal.ticket.location_name && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" aria-hidden="true" />
                                        <span className="text-gray-600">{detailModal.ticket.location_name}</span>
                                    </div>
                                )}
                                {detailModal.ticket.assigned_tech && (
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" aria-hidden="true" />
                                        <span className="text-gray-600">{detailModal.ticket.assigned_tech}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" aria-hidden="true" />
                                    <span className="text-gray-600">
                                        {new Date(detailModal.ticket.date_creation).toLocaleString('es-CO')}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h4>
                                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-200">{detailModal.ticket.content}</div>
                            </div>

                            {/* Solución del caso */}
                            {detailModal.ticket.solution && (
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-semibold text-green-700 mb-2">Solución</h4>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">{detailModal.ticket.solution.content}</div>
                                        <div className="mt-3 pt-3 border-t border-green-200 flex items-center justify-between text-xs text-green-700">
                                            <span>Resuelto por: <strong>{detailModal.ticket.solution.solved_by || 'Usuario del sistema'}</strong></span>
                                            <span>{new Date(detailModal.ticket.solution.date_creation).toLocaleString('es-CO')}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" className="rounded-lg" onClick={() => setDetailModal({ open: false, ticket: null, loading: false })}>
                                    Cerrar
                                </Button>
                                {detailModal.ticket.status === 1 && (
                                    <>
                                        {isAdmin && (
                                            <Button
                                                variant="outline"
                                                className="rounded-lg"
                                                onClick={() => { setDetailModal({ open: false, ticket: null, loading: false }); openAssignModal(detailModal.ticket!.id, detailModal.ticket!.name); }}
                                            >
                                                <Users className="w-4 h-4 mr-1" aria-hidden="true" />
                                                Asignar
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => { setDetailModal({ open: false, ticket: null, loading: false }); takeTicket(detailModal.ticket!.id); }}
                                            className="rounded-lg bg-huv hover:bg-huv-hover text-white"
                                        >
                                            <UserPlus className="w-4 h-4 mr-1" aria-hidden="true" />
                                            Tomar
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Asignación */}
            <Dialog
                open={assignModal.open}
                onOpenChange={(abierto) => {
                    if (!abierto) setAssignModal({ open: false, ticketId: null, ticketName: '' });
                }}
            >
                <DialogContent
                    aria-describedby="assign-modal-description"
                    className="bg-white shadow-xl sm:max-w-md border border-gray-200 rounded-2xl p-0 gap-0"
                >
                    <DialogHeader className="p-4 pr-10 border-b text-left">
                        <DialogTitle className="text-lg font-semibold text-gray-900">Asignar Caso</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                        <DialogDescription id="assign-modal-description" className="text-sm text-gray-600">
                            Asignar el caso <strong>"{assignModal.ticketName}"</strong> a:
                        </DialogDescription>
                        <Select value={selectedTech} onValueChange={setSelectedTech}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar técnico..." />
                            </SelectTrigger>
                            <SelectContent>
                                {technicians?.map((tech) => (
                                    <SelectItem key={tech.id} value={tech.id.toString()}>
                                        {tech.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2 p-4 border-t">
                        <Button variant="outline" className="rounded-lg" onClick={() => setAssignModal({ open: false, ticketId: null, ticketName: '' })}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={assignTicket}
                            disabled={!selectedTech || assigning}
                            className="rounded-lg bg-huv hover:bg-huv-hover text-white"
                        >
                            {assigning ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" aria-hidden="true" />
                                    Asignando...
                                </>
                            ) : (
                                <>
                                    <Users className="w-4 h-4 mr-1" aria-hidden="true" />
                                    Asignar
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Solución */}
            <Dialog
                open={solveModal.open}
                onOpenChange={(abierto) => {
                    if (!abierto) {
                        setSolveModal({ open: false, ticketId: null, ticketName: '' });
                        setSolveDate('');
                    }
                }}
            >
                <DialogContent
                    aria-describedby="solve-modal-description"
                    className="bg-white shadow-xl sm:max-w-lg border border-gray-200 rounded-2xl p-0 gap-0"
                >
                    <DialogHeader className="p-4 pr-10 border-b text-left">
                        <DialogTitle className="text-lg font-semibold text-gray-900">Resolver Caso</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                        <DialogDescription id="solve-modal-description" className="text-sm text-gray-600">
                            Resolver el caso <strong>"{solveModal.ticketName}"</strong>
                        </DialogDescription>
                        <div>
                            <label htmlFor="solve-solution" className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción de la solución <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="solve-solution"
                                value={solution}
                                onChange={(e) => setSolution(e.target.value)}
                                placeholder="Describe cómo se resolvió el problema..."
                                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[120px]"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label htmlFor="solve-date" className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha y hora de solución
                            </label>
                            <input
                                id="solve-date"
                                type="datetime-local"
                                value={solveDate}
                                onChange={(e) => setSolveDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Por defecto se usa la fecha y hora actual. Puede modificarla si la solución fue en otro momento.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 p-4 border-t">
                        <Button variant="outline" className="rounded-lg" onClick={() => { setSolveModal({ open: false, ticketId: null, ticketName: '' }); setSolveDate(''); }}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={solveTicket}
                            disabled={!solution.trim() || solving}
                            className="rounded-lg bg-green-700 hover:bg-green-800 text-white"
                        >
                            {solving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" aria-hidden="true" />
                                    Resolviendo...
                                </>
                            ) : (
                                <>
                                    <CheckSquare className="w-4 h-4 mr-1" aria-hidden="true" />
                                    Resolver
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
