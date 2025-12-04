import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Monitor as MonitorIcon, Cpu, Ticket } from 'lucide-react';

interface Monitor {
    id: number;
    name: string;
    serial: string | null;
    otherserial: string | null;
    comment: string | null;
    date_mod: string | null;
    date_creation: string | null;
    state_name: string | null;
    manufacturer_name: string | null;
    type_name: string | null;
    model_name: string | null;
    location_name: string | null;
    entity_name: string | null;
    size: number | null;
}

interface Computer {
    id: number;
    name: string;
    serial: string | null;
    location_name: string | null;
}

interface TicketItem {
    id: number;
    name: string;
    status: number;
    date: string;
}

interface Props {
    monitor: Monitor;
    computer: Computer | null;
    tickets: TicketItem[];
}

const getStatusLabel = (status: number) => {
    const statusMap: Record<number, { label: string; color: string }> = {
        1: { label: 'Nuevo', color: 'bg-blue-100 text-blue-800' },
        2: { label: 'En curso', color: 'bg-yellow-100 text-yellow-800' },
        3: { label: 'Planificado', color: 'bg-purple-100 text-purple-800' },
        4: { label: 'En espera', color: 'bg-orange-100 text-orange-800' },
        5: { label: 'Resuelto', color: 'bg-green-100 text-green-800' },
        6: { label: 'Cerrado', color: 'bg-gray-100 text-gray-800' },
    };
    return statusMap[status] || { label: 'Desconocido', color: 'bg-gray-100 text-gray-800' };
};

export default function VerMonitor({ monitor, computer, tickets }: Props) {
    return (
        <>
            <Head title={`${monitor.name} - HelpDesk HUV`} />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/inventario/monitores" className="text-[#2c4370] hover:underline">Monitores</Link>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">{monitor.name}</span>
                    </div>
                } />

                <main className="flex-1 p-4 sm:p-6">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.visit('/inventario/monitores')}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Volver
                                </Button>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{monitor.name}</h1>
                                    <p className="text-sm text-gray-500">ID: {monitor.id}</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => router.visit(`/inventario/monitores/${monitor.id}/editar`)}
                                className="bg-[#2c4370] hover:bg-[#3d5583]"
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Información Principal */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-lg shadow-sm border p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <MonitorIcon className="h-5 w-5 text-[#2c4370]" />
                                        Información General
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Nombre</label>
                                            <p className="text-sm font-medium text-gray-900">{monitor.name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Entidad</label>
                                            <p className="text-sm font-medium text-gray-900">{monitor.entity_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Estado</label>
                                            <p className="text-sm font-medium text-gray-900">{monitor.state_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Tipo</label>
                                            <p className="text-sm font-medium text-gray-900">{monitor.type_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Fabricante</label>
                                            <p className="text-sm font-medium text-gray-900">{monitor.manufacturer_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Modelo</label>
                                            <p className="text-sm font-medium text-gray-900">{monitor.model_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Número de Serie</label>
                                            <p className="text-sm font-mono font-medium text-gray-900">{monitor.serial || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Número de Inventario</label>
                                            <p className="text-sm font-mono font-medium text-gray-900">{monitor.otherserial || '-'}</p>
                                        </div>
                                        {monitor.size && monitor.size > 0 && (
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase tracking-wide">Tamaño</label>
                                                <p className="text-sm font-medium text-gray-900">{monitor.size}"</p>
                                            </div>
                                        )}
                                        <div className="sm:col-span-2">
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Localización</label>
                                            <p className="text-sm font-medium text-gray-900">{monitor.location_name || '-'}</p>
                                        </div>
                                        {monitor.comment && (
                                            <div className="sm:col-span-2">
                                                <label className="text-xs text-gray-500 uppercase tracking-wide">Comentarios</label>
                                                <p className="text-sm text-gray-900 whitespace-pre-wrap">{monitor.comment}</p>
                                            </div>
                                        )}
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Fecha de Creación</label>
                                            <p className="text-sm text-gray-600">
                                                {monitor.date_creation 
                                                    ? new Date(monitor.date_creation).toLocaleString('es-CO') 
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Última Modificación</label>
                                            <p className="text-sm text-gray-600">
                                                {monitor.date_mod 
                                                    ? new Date(monitor.date_mod).toLocaleString('es-CO') 
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Computador Conectado */}
                                <div className="bg-white rounded-lg shadow-sm border p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Cpu className="h-5 w-5 text-[#2c4370]" />
                                        Conectado a
                                    </h2>
                                    {computer ? (
                                        <Link 
                                            href={`/inventario/computadores/${computer.id}`}
                                            className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <p className="font-medium text-gray-900">{computer.name}</p>
                                            {computer.serial && (
                                                <p className="text-xs font-mono text-gray-500">S/N: {computer.serial}</p>
                                            )}
                                            {computer.location_name && (
                                                <p className="text-xs text-gray-500 mt-1">{computer.location_name}</p>
                                            )}
                                        </Link>
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-2">No conectado a ningún equipo</p>
                                    )}
                                </div>

                                {/* Tickets Relacionados */}
                                <div className="bg-white rounded-lg shadow-sm border p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Ticket className="h-5 w-5 text-[#2c4370]" />
                                        Casos Recientes
                                        <span className="text-sm font-normal text-gray-500">({tickets.length})</span>
                                    </h2>
                                    {tickets.length > 0 ? (
                                        <div className="space-y-2">
                                            {tickets.map((ticket) => {
                                                const status = getStatusLabel(ticket.status);
                                                return (
                                                    <Link 
                                                        key={ticket.id} 
                                                        href={`/soporte/casos/${ticket.id}/editar`}
                                                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="font-medium text-gray-900 text-sm line-clamp-2">
                                                                #{ticket.id} - {ticket.name}
                                                            </p>
                                                            <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${status.color}`}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(ticket.date).toLocaleDateString('es-CO')}
                                                        </p>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-2">Sin casos relacionados</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <GLPIFooter />
            </div>
        </>
    );
}
