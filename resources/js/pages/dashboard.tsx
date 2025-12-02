import { GLPIHeader } from '@/components/glpi-header';
import { DashboardCards } from '@/components/dashboard-cards';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router, usePage } from '@inertiajs/react';
import { ViewTabs } from '@/components/view-tabs';
import { TicketIcon, UserPlus, Clock, CheckCircle, AlertTriangle, Eye, FileText, X, MapPin, Tag, User, Loader2, Users } from 'lucide-react';
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
                        <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-green-700">{props.flash.success}</span>
                        </div>
                    )}
                    {props.flash?.error && (
                        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <span className="text-red-700">{props.flash.error}</span>
                        </div>
                    )}

                    <div className="flex gap-4 p-4">
                        {/* Main Content */}
                        <div className="flex-1">
                            <div className="bg-white rounded-lg shadow-sm">
                                <div className="px-6 py-4 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {isPublicView ? (
                                            <TicketIcon className="w-5 h-5 text-[#2c4370]" />
                                        ) : (
                                            <FileText className="w-5 h-5 text-[#2c4370]" />
                                        )}
                                        <h2 className="text-lg font-semibold text-gray-800">
                                            {isPublicView ? 'Reportes Públicos Sin Asignar' : 'Mis Reportes Abiertos'}
                                        </h2>
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                            isPublicView ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {isPublicView ? `${stats.publicUnassigned} pendientes` : `${stats.myTickets} activos`}
                                        </span>
                                    </div>
                                </div>
                                
                                {currentTickets.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                        <p className="text-gray-500">
                                            {isPublicView 
                                                ? 'No hay reportes públicos pendientes por asignar' 
                                                : 'No tienes reportes abiertos asignados'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {currentTickets.map((ticket) => (
                                            <div key={ticket.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <span className="text-xs text-gray-400">#{ticket.id}</span>
                                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${priorityColors[ticket.priority]}`}>
                                                                {ticket.priority_name}
                                                            </span>
                                                            {!isPublicView && (
                                                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColors[ticket.status]}`}>
                                                                    {ticket.status_name}
                                                                </span>
                                                            )}
                                                            {ticket.category_name && (
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                                    {ticket.category_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="font-medium text-gray-900 truncate">{ticket.name}</h3>
                                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
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
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            className="text-sm px-3"
                                                            onClick={() => openDetailModal(ticket.id)}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            Ver
                                                        </Button>
                                                        {isPublicView && (
                                                            <>
                                                                <Button
                                                                    onClick={() => takeTicket(ticket.id)}
                                                                    disabled={taking === ticket.id}
                                                                    className="bg-[#2c4370] hover:bg-[#3d5583] text-white text-sm px-3"
                                                                >
                                                                    <UserPlus className="w-4 h-4 mr-1" />
                                                                    {taking === ticket.id ? 'Tomando...' : 'Tomar'}
                                                                </Button>
                                                                {isAdmin && (
                                                                    <Button
                                                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white text-sm px-3"
                                                                        onClick={() => openAssignModal(ticket.id, ticket.name)}
                                                                    >
                                                                        <Users className="w-4 h-4 mr-1" />
                                                                        Asignar
                                                                    </Button>
                                                                )}
                                                            </>
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
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                            <h2 className="text-lg font-semibold text-gray-900">Detalles del Caso</h2>
                            <button onClick={() => setDetailModal({ open: false, ticket: null, loading: false })} className="p-1 hover:bg-gray-100 rounded">
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
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${priorityColors[detailModal.ticket.priority]}`}>
                                        {detailModal.ticket.priority_name}
                                    </span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColors[detailModal.ticket.status]}`}>
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
                                    <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-4 rounded-lg" dangerouslySetInnerHTML={{ __html: detailModal.ticket.content }} />
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
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Asignar Caso</h2>
                            <button onClick={() => setAssignModal({ open: false, ticketId: null, ticketName: '' })} className="p-1 hover:bg-gray-100 rounded">
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
        </>
    );
}
