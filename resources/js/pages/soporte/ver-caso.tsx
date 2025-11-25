import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, Link } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Clock, User, UserCheck, MapPin, Tag, AlertTriangle, Monitor } from 'lucide-react';

interface Ticket {
    id: number;
    name: string;
    content: string;
    date: string;
    date_creation: string;
    date_mod: string;
    time_to_resolve: string | null;
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
    firstname: string;
    realname: string;
    fullname: string;
}

interface TicketItem {
    itemtype: string;
    items_id: number;
    name: string;
}

interface VerCasoProps {
    ticket: Ticket;
    requester: Person | null;
    technician: Person | null;
    ticketItems: TicketItem[];
    auth: { user: { name: string; role: string } };
}

const statusColors: Record<number, string> = {
    1: 'bg-blue-100 text-blue-700 border-blue-200',
    2: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    3: 'bg-purple-100 text-purple-700 border-purple-200',
    4: 'bg-orange-100 text-orange-700 border-orange-200',
    5: 'bg-green-100 text-green-700 border-green-200',
    6: 'bg-gray-100 text-gray-600 border-gray-200',
};

const priorityColors: Record<number, string> = {
    1: 'bg-gray-100 text-gray-600',
    2: 'bg-blue-100 text-blue-600',
    3: 'bg-yellow-100 text-yellow-700',
    4: 'bg-orange-100 text-orange-600',
    5: 'bg-red-100 text-red-600',
    6: 'bg-red-200 text-red-700',
};

const itemTypeLabels: Record<string, string> = {
    'Computer': 'Computador',
    'Monitor': 'Monitor',
    'NetworkEquipment': 'Dispositivo de Red',
    'Peripheral': 'Periférico',
    'Printer': 'Impresora',
    'Phone': 'Teléfono',
    'Enclosure': 'Gabinete',
};

export default function VerCaso({ ticket, requester, technician, ticketItems }: VerCasoProps) {
    const stripHtml = (html: string) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'No especificada';
        return new Date(dateStr).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <Head title={`Caso #${ticket.id} - ${ticket.name}`} />
            <div className="min-h-screen flex flex-col">
                <GLPIHeader />
                <main className="flex-1 bg-gray-50 p-6">
                    {/* Header */}
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <Link href="/dashboard">
                                    <Button variant="outline" size="sm">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Volver
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Caso #{ticket.id}</h1>
                                    <p className="text-sm text-gray-500">Creado: {formatDate(ticket.date_creation)}</p>
                                </div>
                            </div>
                            <Link href={`/soporte/casos/${ticket.id}/editar`}>
                                <Button className="bg-[#2c4370] hover:bg-[#3d5583]">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar Caso
                                </Button>
                            </Link>
                        </div>

                        {/* Main Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Ticket Details */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Title and Status */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <CardTitle className="text-xl">{ticket.name}</CardTitle>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[ticket.status]}`}>
                                                {ticket.status_name}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[ticket.priority]}`}>
                                                Prioridad: {ticket.priority_name}
                                            </span>
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                Urgencia: {ticket.urgency_name}
                                            </span>
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                Impacto: {ticket.impact_name}
                                            </span>
                                        </div>
                                        {ticket.category_name && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                                <Tag className="w-4 h-4" />
                                                <span>Categoría: {ticket.category_name}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Description */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Descripción del Problema</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                            {stripHtml(ticket.content)}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Associated Items */}
                                {ticketItems.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Monitor className="w-5 h-5" />
                                                Elementos Asociados
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {ticketItems.map((item, index) => (
                                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                        <Monitor className="w-4 h-4 text-gray-500" />
                                                        <div>
                                                            <span className="font-medium">{item.name}</span>
                                                            <span className="text-sm text-gray-500 ml-2">
                                                                ({itemTypeLabels[item.itemtype] || item.itemtype})
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Right Column - Sidebar */}
                            <div className="space-y-6">
                                {/* People */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Personas</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <User className="w-5 h-5 text-blue-500 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Solicitante</p>
                                                <p className="font-medium">
                                                    {requester?.fullname || 'Reporte Público'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <UserCheck className="w-5 h-5 text-green-500 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Técnico Asignado</p>
                                                <p className="font-medium">
                                                    {technician?.fullname || (
                                                        <span className="text-orange-500">Sin asignar</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Location */}
                                {ticket.location_name && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <MapPin className="w-5 h-5" />
                                                Ubicación
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-700">{ticket.location_name}</p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Dates */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Clock className="w-5 h-5" />
                                            Fechas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <div>
                                            <p className="text-gray-500">Fecha de Apertura</p>
                                            <p className="font-medium">{formatDate(ticket.date)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Última Modificación</p>
                                            <p className="font-medium">{formatDate(ticket.date_mod)}</p>
                                        </div>
                                        {ticket.time_to_resolve && (
                                            <div>
                                                <p className="text-gray-500">Fecha Límite</p>
                                                <p className="font-medium">{formatDate(ticket.time_to_resolve)}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Entity */}
                                {ticket.entity_name && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Entidad</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-700">{ticket.entity_name}</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
                <GLPIFooter />
            </div>
        </>
    );
}
