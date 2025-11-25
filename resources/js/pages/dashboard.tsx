import { GLPIHeader } from '@/components/glpi-header';
import { DashboardCards } from '@/components/dashboard-cards';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router, usePage, Link } from '@inertiajs/react';
import { ViewTabs } from '@/components/view-tabs';
import { TicketIcon, UserPlus, Clock, CheckCircle, AlertTriangle, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

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

interface Stats {
    publicUnassigned: number;
    myTickets: number;
    resolvedToday: number;
}

interface DashboardProps {
    publicTickets: Ticket[];
    myTickets: Ticket[];
    stats: Stats;
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

export default function Dashboard({ publicTickets, myTickets, stats }: DashboardProps) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const [activeTab, setActiveTab] = useState('Reportes Públicos');
    const [taking, setTaking] = useState<number | null>(null);

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
                                                        <Link href={`/soporte/casos/${ticket.id}`}>
                                                            <Button
                                                                variant="outline"
                                                                className="text-sm px-3"
                                                            >
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                Ver
                                                            </Button>
                                                        </Link>
                                                        {isPublicView && (
                                                            <Button
                                                                onClick={() => takeTicket(ticket.id)}
                                                                disabled={taking === ticket.id}
                                                                className="bg-[#2c4370] hover:bg-[#3d5583] text-white text-sm px-3"
                                                            >
                                                                <UserPlus className="w-4 h-4 mr-1" />
                                                                {taking === ticket.id ? 'Tomando...' : 'Tomar'}
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
        </>
    );
}
