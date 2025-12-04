import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Printer as PrinterIcon, Ticket } from 'lucide-react';

interface Printer {
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
    tech_name: string | null;
    tech_group_name: string | null;
    ip_addresses: string[];
    ip_networks: string[];
}

interface TicketItem {
    id: number;
    name: string;
    status: number;
    date: string;
}

interface Props {
    printer: Printer;
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

export default function VerImpresora({ printer, tickets }: Props) {
    return (
        <>
            <Head title={`${printer.name} - HelpDesk HUV`} />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/inventario/impresoras" className="text-[#2c4370] hover:underline">Impresoras</Link>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">{printer.name}</span>
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
                                    onClick={() => router.visit('/inventario/impresoras')}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Volver
                                </Button>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{printer.name}</h1>
                                    <p className="text-sm text-gray-500">ID: {printer.id}</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => router.visit(`/inventario/impresoras/${printer.id}/editar`)}
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
                                        <PrinterIcon className="h-5 w-5 text-[#2c4370]" />
                                        Información General
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Nombre</label>
                                            <p className="text-sm font-medium text-gray-900">{printer.name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Entidad</label>
                                            <p className="text-sm font-medium text-gray-900">{printer.entity_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Estado</label>
                                            <p className="text-sm font-medium text-gray-900">{printer.state_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Tipo</label>
                                            <p className="text-sm font-medium text-gray-900">{printer.type_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Fabricante</label>
                                            <p className="text-sm font-medium text-gray-900">{printer.manufacturer_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Modelo</label>
                                            <p className="text-sm font-medium text-gray-900">{printer.model_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Número de Serie</label>
                                            <p className="text-sm font-mono font-medium text-gray-900">{printer.serial || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Número de Inventario</label>
                                            <p className="text-sm font-mono font-medium text-gray-900">{printer.otherserial || '-'}</p>
                                        </div>
                                        {printer.ip_addresses && printer.ip_addresses.length > 0 && (
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase tracking-wide">Direcciones IP</label>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {printer.ip_addresses.map((ip, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono">
                                                            {ip}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="sm:col-span-2">
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Localización</label>
                                            <p className="text-sm font-medium text-gray-900">{printer.location_name || '-'}</p>
                                        </div>
                                        {printer.tech_name && (
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase tracking-wide">Técnico</label>
                                                <p className="text-sm font-medium text-gray-900">{printer.tech_name}</p>
                                            </div>
                                        )}
                                        {printer.tech_group_name && (
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase tracking-wide">Grupo Técnico</label>
                                                <p className="text-sm font-medium text-gray-900">{printer.tech_group_name}</p>
                                            </div>
                                        )}
                                        {printer.comment && (
                                            <div className="sm:col-span-2">
                                                <label className="text-xs text-gray-500 uppercase tracking-wide">Comentarios</label>
                                                <p className="text-sm text-gray-900 whitespace-pre-wrap">{printer.comment}</p>
                                            </div>
                                        )}
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Fecha de Creación</label>
                                            <p className="text-sm text-gray-600">
                                                {printer.date_creation 
                                                    ? new Date(printer.date_creation).toLocaleString('es-CO') 
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Última Modificación</label>
                                            <p className="text-sm text-gray-600">
                                                {printer.date_mod 
                                                    ? new Date(printer.date_mod).toLocaleString('es-CO') 
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
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
