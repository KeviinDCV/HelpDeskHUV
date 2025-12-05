import { GLPIHeader } from '@/components/glpi-header';
import { DashboardCards } from '@/components/dashboard-cards';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router, usePage } from '@inertiajs/react';
import { ViewTabs } from '@/components/view-tabs';
import { TicketIcon, UserPlus, Clock, CheckCircle, AlertTriangle, Eye, FileText, X, MapPin, Tag, User, Loader2, Users, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Ticket {
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

interface TicketDetail extends Ticket {
    location_name: string | null;
    assigned_tech: string | null;
}

interface Technician {
    id: number;
    name: string;
}

interface Stats {
    publicUnassigned: number;
    myTickets: number;
    resolvedToday: number;
}

interface DashboardProps {
    publicTickets: Ticket[];
    myTickets: Ticket[];
    stats: Stats;
    technicians: Technician[];
    auth: { user: { name: string; role: string } };
}

const priorityColors: Record<number, string> = {
    1: 'bg-gray-100 text-gray-600',
    2: 'bg-blue-100 text-blue-600',
    3: 'bg-yellow-100 text-yellow-700',
    4: 'bg-orange-100 text-orange-600',
    5: 'bg-red-100 text-red-600',
    6: 'bg-red-200 text-red-700',
};

const statusColors: Record<number, string> = {
    1: 'bg-blue-100 text-blue-700',
    2: 'bg-yellow-100 text-yellow-700',
    3: 'bg-purple-100 text-purple-700',
    4: 'bg-orange-100 text-orange-700',
    5: 'bg-green-100 text-green-700',
    6: 'bg-gray-100 text-gray-600',
};

export default function Dashboard({ publicTickets: initialPublicTickets, myTickets: initialMyTickets, stats: initialStats, technicians, auth }: DashboardProps) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const [activeTab, setActiveTab] = useState('Reportes Públicos');
    const [taking, setTaking] = useState<number | null>(null);
    
    // Estados para datos actualizables
    const [publicTickets, setPublicTickets] = useState(initialPublicTickets);
    const [myTickets, setMyTickets] = useState(initialMyTickets);
    const [stats, setStats] = useState(initialStats);
    
    // Modal de detalles
    const [detailModal, setDetailModal] = useState<{ open: boolean; ticket: TicketDetail | null; loading: boolean }>({ open: false, ticket: null, loading: false });
    
    // Modal de asignación
    const [assignModal, setAssignModal] = useState<{ open: boolean; ticketId: number | null; ticketName: string }>({ open: false, ticketId: null, ticketName: '' });
    const [selectedTech, setSelectedTech] = useState('');
    const [assigning, setAssigning] = useState(false);

    // Modal de solución
    const [solveModal, setSolveModal] = useState<{ open: boolean; ticketId: number | null; ticketName: string }>({ open: false, ticketId: null, ticketName: '' });
    const [solution, setSolution] = useState('');
    const [solving, setSolving] = useState(false);

    const isAdmin = auth?.user?.role === 'Administrador';

    // Polling cada 10 segundos para actualizar tickets
    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const response = await fetch('/dashboard/tickets');
                if (response.ok) {
                    const data = await response.json();
                    setPublicTickets(data.publicTickets);
                    setMyTickets(data.myTickets);
                    setStats(data.stats);
                }
            } catch (error) {
                console.error('Error fetching tickets:', error);
            }
        };

        const interval = setInterval(fetchTickets, 10000);
        return () => clearInterval(interval);
    }, []);

    const openDetailModal = async (ticketId: number) => {
        setDetailModal({ open: true, ticket: null, loading: true });
        try {
            const response = await fetch(`/dashboard/ticket/${ticketId}`);
            if (response.ok) {
                const data = await response.json();
                setDetailModal({ open: true, ticket: data, loading: false });
            }
        } catch (error) {
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
            },
        });
    };

    const openSolveModal = (ticketId: number, ticketName: string) => {
        setSolveModal({ open: true, ticketId, ticketName });
        setSolution('');
    };

    const solveTicket = () => {
        if (!solveModal.ticketId || !solution.trim()) return;
        setSolving(true);
        router.post(`/dashboard/solve-ticket/${solveModal.ticketId}`, { solution: solution.trim() }, {
            onFinish: () => {
                setSolving(false);
                setSolveModal({ open: false, ticketId: null, ticketName: '' });
                setSolution('');
            },
        });
    };

    const takeTicket = (id: number) => {
        setTaking(id);
        router.post(`/dashboard/take-ticket/${id}`, {}, {
            onFinish: () => setTaking(null),
        });
    };

    const stripHtml = (html: string) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const currentTickets = activeTab === 'Reportes Públicos' ? publicTickets : myTickets;
    const isPublicView = activeTab === 'Reportes Públicos';

    return (
        <>
            <Head title="HelpDesk HUV - Dashboard" />
            <div className="min-h-screen flex flex-col">
                <GLPIHeader />
                <main className="flex-1 bg-gray-50">
                    <ViewTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    
                    {/* Flash Messages */}
                    {props.flash?.success && (
                        <div className="mx-3 sm:mx-6 mt-4 bg-green-50 border border-green-200 p-3 sm:p-4 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                            <span className="text-green-700 text-sm sm:text-base">{props.flash.success}</span>
                        </div>
                    )}
                    {props.flash?.error && (
                        <div className="mx-3 sm:mx-6 mt-4 bg-red-50 border border-red-200 p-3 sm:p-4 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                            <span className="text-red-700 text-sm sm:text-base">{props.flash.error}</span>
                        </div>
                    )}

                    {/* Main Layout - Stack on mobile, side by side on desktop */}
                    <div className="flex flex-col lg:flex-row gap-4 p-3 sm:p-4">
                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            <div className="bg-white shadow-sm border border-gray-200">
                                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                        {isPublicView ? (
                                            <TicketIcon className="w-5 h-5 text-[#2c4370] shrink-0" />
                                        ) : (
                                            <FileText className="w-5 h-5 text-[#2c4370] shrink-0" />
                                        )}
                                        <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                                            {isPublicView ? 'Reportes Públicos' : 'Mis Reportes'}
                                        </h2>
                                        <span className={`text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 ${
                                            isPublicView ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {isPublicView ? `${stats.publicUnassigned} pendientes` : `${stats.myTickets} activos`}
                                        </span>
                                    </div>
                                </div>
                                
                                {currentTickets.length === 0 ? (
                                    <div className="p-8 sm:p-12 text-center">
                                        <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-400 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm sm:text-base">
                                            {isPublicView 
                                                ? 'No hay reportes públicos pendientes' 
                                                : 'No tienes reportes abiertos'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {currentTickets.map((ticket) => (
                                            <div key={ticket.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                                                            <span className="text-xs text-gray-400">#{ticket.id}</span>
                                                            <span className={`text-xs font-medium px-1.5 sm:px-2 py-0.5 ${priorityColors[ticket.priority]}`}>
                                                                {ticket.priority_name}
                                                            </span>
                                                            {!isPublicView && (
                                                                <span className={`text-xs font-medium px-1.5 sm:px-2 py-0.5 ${statusColors[ticket.status]}`}>
                                                                    {ticket.status_name}
                                                                </span>
                                                            )}
                                                            {ticket.category_name && (
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 hidden sm:inline">
                                                                    {ticket.category_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2 sm:truncate">{ticket.name}</h3>
                                                        <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2 hidden sm:block">
                                                            {stripHtml(ticket.content).substring(0, 150)}...
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(ticket.date_creation).toLocaleDateString('es-CO', { 
                                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {/* Action Buttons - Responsive */}
                                                    <div className="flex gap-1.5 sm:gap-2 shrink-0">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs sm:text-sm px-2 sm:px-3"
                                                            onClick={() => openDetailModal(ticket.id)}
                                                        >
                                                            <Eye className="w-4 h-4 sm:mr-1" />
                                                            <span className="hidden sm:inline">Ver</span>
                                                        </Button>
                                                        {isPublicView ? (
                                                            <>
                                                                <Button
                                                                    onClick={() => takeTicket(ticket.id)}
                                                                    disabled={taking === ticket.id}
                                                                    size="sm"
                                                                    className="bg-[#2c4370] hover:bg-[#3d5583] text-white text-xs sm:text-sm px-2 sm:px-3"
                                                                >
                                                                    <UserPlus className="w-4 h-4 sm:mr-1" />
                                                                    <span className="hidden sm:inline">{taking === ticket.id ? 'Tomando...' : 'Tomar'}</span>
                                                                </Button>
                                                                {isAdmin && (
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white text-xs sm:text-sm px-2 sm:px-3"
                                                                        onClick={() => openAssignModal(ticket.id, ticket.name)}
                                                                    >
                                                                        <Users className="w-4 h-4 sm:mr-1" />
                                                                        <span className="hidden sm:inline">Asignar</span>
                                                                    </Button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            /* Mis Reportes - Botón Resolver */
                                                            <Button
                                                                onClick={() => openSolveModal(ticket.id, ticket.name)}
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-2 sm:px-3"
                                                            >
                                                                <CheckSquare className="w-4 h-4 sm:mr-1" />
                                                                <span className="hidden sm:inline">Resolver</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <DashboardCards stats={stats} />
                    </div>
                </main>
                <GLPIFooter />
            </div>

            {/* Modal de Detalles */}
            {detailModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                            <h2 className="text-lg font-semibold text-gray-900">Detalles del Caso</h2>
                            <button onClick={() => setDetailModal({ open: false, ticket: null, loading: false })} className="p-1 hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {detailModal.loading ? (
                            <div className="p-12 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-[#2c4370]" />
                            </div>
                        ) : detailModal.ticket && (
                            <div className="p-4 space-y-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-gray-500">#{detailModal.ticket.id}</span>
                                    <span className={`text-xs font-medium px-2 py-0.5 ${priorityColors[detailModal.ticket.priority]}`}>
                                        {detailModal.ticket.priority_name}
                                    </span>
                                    <span className={`text-xs font-medium px-2 py-0.5 ${statusColors[detailModal.ticket.status]}`}>
                                        {detailModal.ticket.status_name}
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">{detailModal.ticket.name}</h3>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {detailModal.ticket.category_name && (
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600">{detailModal.ticket.category_name}</span>
                                        </div>
                                    )}
                                    {detailModal.ticket.location_name && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600">{detailModal.ticket.location_name}</span>
                                        </div>
                                    )}
                                    {detailModal.ticket.assigned_tech && (
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600">{detailModal.ticket.assigned_tech}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">
                                            {new Date(detailModal.ticket.date_creation).toLocaleString('es-CO')}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h4>
                                    <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-4 border border-gray-200" dangerouslySetInnerHTML={{ __html: detailModal.ticket.content }} />
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t">
                                    <Button variant="outline" onClick={() => setDetailModal({ open: false, ticket: null, loading: false })}>
                                        Cerrar
                                    </Button>
                                    {detailModal.ticket.status === 1 && (
                                        <>
                                            <Button
                                                onClick={() => { setDetailModal({ open: false, ticket: null, loading: false }); takeTicket(detailModal.ticket!.id); }}
                                                className="bg-[#2c4370] hover:bg-[#3d5583] text-white"
                                            >
                                                <UserPlus className="w-4 h-4 mr-1" />
                                                Tomar
                                            </Button>
                                            {isAdmin && (
                                                <Button
                                                    className="bg-[#2c4370] hover:bg-[#3d5583] text-white"
                                                    onClick={() => { setDetailModal({ open: false, ticket: null, loading: false }); openAssignModal(detailModal.ticket!.id, detailModal.ticket!.name); }}
                                                >
                                                    <Users className="w-4 h-4 mr-1" />
                                                    Asignar
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Asignación */}
            {assignModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-xl max-w-md w-full border border-gray-200">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Asignar Caso</h2>
                            <button onClick={() => setAssignModal({ open: false, ticketId: null, ticketName: '' })} className="p-1 hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-gray-600">
                                Asignar el caso <strong>"{assignModal.ticketName}"</strong> a:
                            </p>
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
                            <Button variant="outline" onClick={() => setAssignModal({ open: false, ticketId: null, ticketName: '' })}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={assignTicket}
                                disabled={!selectedTech || assigning}
                                className="bg-[#2c4370] hover:bg-[#3d5583] text-white"
                            >
                                {assigning ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        Asignando...
                                    </>
                                ) : (
                                    <>
                                        <Users className="w-4 h-4 mr-1" />
                                        Asignar
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Solución */}
            {solveModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-xl max-w-lg w-full border border-gray-200">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Resolver Caso</h2>
                            <button onClick={() => setSolveModal({ open: false, ticketId: null, ticketName: '' })} className="p-1 hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-gray-600">
                                Resolver el caso <strong>"{solveModal.ticketName}"</strong>
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descripción de la solución <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={solution}
                                    onChange={(e) => setSolution(e.target.value)}
                                    placeholder="Describe cómo se resolvió el problema..."
                                    className="w-full px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[120px]"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t">
                            <Button variant="outline" onClick={() => setSolveModal({ open: false, ticketId: null, ticketName: '' })}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={solveTicket}
                                disabled={!solution.trim() || solving}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {solving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        Resolviendo...
                                    </>
                                ) : (
                                    <>
                                        <CheckSquare className="w-4 h-4 mr-1" />
                                        Resolver
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
