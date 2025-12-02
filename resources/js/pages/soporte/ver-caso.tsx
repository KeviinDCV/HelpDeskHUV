import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wrench, Edit, Monitor, Paperclip, Download, FileText, FileImage } from 'lucide-react';
import { useState } from 'react';

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

interface Attachment {
    name: string;
    url: string;
    size: number;
    mime?: string;
    source?: 'local' | 'glpi';
    glpi_id?: number;
}

interface VerCasoProps {
    ticket: Ticket;
    requester: Person | null;
    technician: Person | null;
    ticketItems: TicketItem[];
    attachments: Attachment[];
    auth: { user: { name: string; role: string } };
}

const statusColors: Record<number, string> = {
    1: 'bg-blue-100 text-blue-700',
    2: 'bg-yellow-100 text-yellow-700',
    3: 'bg-purple-100 text-purple-700',
    4: 'bg-orange-100 text-orange-700',
    5: 'bg-green-100 text-green-700',
    6: 'bg-gray-100 text-gray-600',
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

export default function VerCaso({ ticket, requester, technician, ticketItems, attachments }: VerCasoProps) {
    const [showSolution, setShowSolution] = useState(false);
    const [solution, setSolution] = useState('');
    const [processing, setProcessing] = useState(false);

    const stripHtml = (html: string) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const handleAddSolution = async () => {
        if (!solution.trim() || solution.length < 10) {
            alert('La solución debe tener al menos 10 caracteres');
            return;
        }
        setProcessing(true);
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await fetch(`/soporte/casos/${ticket.id}/solucion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify({ solution }),
            });

            if (response.status === 419) {
                alert('Tu sesión ha expirado. La página se recargará.');
                window.location.reload();
                return;
            }

            if (response.ok || response.redirected) {
                // Redirigir al dashboard con éxito
                router.visit('/dashboard', { 
                    preserveState: false,
                    replace: true,
                });
            } else {
                const data = await response.json().catch(() => ({}));
                alert(data.message || 'Error al cerrar el caso. Intenta de nuevo.');
            }
        } catch {
            alert('Error de conexión. Verifica tu internet e intenta de nuevo.');
        } finally {
            setProcessing(false);
        }
    };

    const canProcess = ticket.status !== 5 && ticket.status !== 6;

    return (
        <>
            <Head title={`Caso #${ticket.id} - HelpDesk HUV`} />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Inicio</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">Soporte</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">Casos</span>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">Ver #{ticket.id}</span>
                    </div>
                } />

                <main className="flex-1 px-6 py-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white rounded-lg shadow">
                            {/* Header */}
                            <div className="px-6 py-4 border-b flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-xl font-semibold text-gray-900">Caso #{ticket.id}</h1>
                                        <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[ticket.status]}`}>
                                            {ticket.status_name}
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-1 rounded ${priorityColors[ticket.priority]}`}>
                                            {ticket.priority_name}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{ticket.name}</p>
                                </div>
                                <div className="flex gap-2">
                                    {canProcess && (
                                        <Button
                                            size="sm"
                                            onClick={() => setShowSolution(!showSolution)}
                                            className={`h-8 text-xs ${showSolution ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'}`}
                                        >
                                            <Wrench className="w-3.5 h-3.5 mr-1" />
                                            {showSolution ? 'Cancelar' : 'Procesar caso'}
                                        </Button>
                                    )}
                                    <Link href={`/soporte/casos/${ticket.id}/editar`}>
                                        <Button size="sm" className="bg-[#2c4370] hover:bg-[#3d5583] h-8 text-xs">
                                            <Edit className="w-3.5 h-3.5 mr-1" />
                                            Editar
                                        </Button>
                                    </Link>
                                </div>
                            </div>


                            {/* Content */}
                            <div className="p-4">
                                {/* Sección Solución */}
                                {showSolution && (
                                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <Label className="text-xs font-semibold text-green-800">Solución *</Label>
                                        <Textarea
                                            value={solution}
                                            onChange={(e) => setSolution(e.target.value)}
                                            placeholder="Describe cómo se solucionó el problema (mínimo 10 caracteres)..."
                                            rows={3}
                                            className="mt-1 text-sm bg-white"
                                        />
                                        <div className="mt-2 flex items-center justify-between">
                                            <p className="text-xs text-green-700">Al agregar la solución, el caso se cerrará automáticamente.</p>
                                            <Button
                                                size="sm"
                                                onClick={handleAddSolution}
                                                disabled={processing || solution.length < 10}
                                                className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                                            >
                                                {processing ? 'Cerrando...' : 'Cerrar Caso'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* Información General */}
                                    <div className="md:col-span-2 space-y-3">
                                        <div>
                                            <Label className="text-xs text-gray-500">Solicitante</Label>
                                            <p className="text-sm font-medium">{requester?.fullname || 'Reporte Público'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-500">Técnico Asignado</Label>
                                            <p className="text-sm font-medium">{technician?.fullname || <span className="text-orange-500">Sin asignar</span>}</p>
                                        </div>
                                        {ticket.category_name && (
                                            <div>
                                                <Label className="text-xs text-gray-500">Categoría</Label>
                                                <p className="text-sm">{ticket.category_name}</p>
                                            </div>
                                        )}
                                        {ticket.location_name && (
                                            <div>
                                                <Label className="text-xs text-gray-500">Ubicación</Label>
                                                <p className="text-sm">{ticket.location_name}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Fechas y Métricas */}
                                    <div className="md:col-span-2 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs text-gray-500">Fecha Apertura</Label>
                                                <p className="text-sm">{formatDate(ticket.date)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Última Modificación</Label>
                                                <p className="text-sm">{formatDate(ticket.date_mod)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Urgencia</Label>
                                                <p className="text-sm">{ticket.urgency_name}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Impacto</Label>
                                                <p className="text-sm">{ticket.impact_name}</p>
                                            </div>
                                        </div>
                                        {ticket.time_to_resolve && (
                                            <div>
                                                <Label className="text-xs text-gray-500">Fecha Límite</Label>
                                                <p className="text-sm">{formatDate(ticket.time_to_resolve)}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Descripción */}
                                    <div className="md:col-span-4">
                                        <Label className="text-xs text-gray-500">Descripción del Problema</Label>
                                        <div className="mt-1 p-3 bg-gray-50 rounded border text-sm whitespace-pre-wrap">
                                            {stripHtml(ticket.content)}
                                        </div>
                                    </div>

                                    {/* Elementos Asociados */}
                                    {ticketItems.length > 0 && (
                                        <div className="md:col-span-4">
                                            <Label className="text-xs text-gray-500">Elementos Asociados</Label>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {ticketItems.map((item, index) => (
                                                    <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-sm">
                                                        <Monitor className="w-3.5 h-3.5 text-blue-600" />
                                                        <span>{item.name}</span>
                                                        <span className="text-xs text-blue-600">({itemTypeLabels[item.itemtype] || item.itemtype})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Archivos Adjuntos */}
                                    {attachments && attachments.length > 0 && (
                                        <div className="md:col-span-4">
                                            <Label className="text-xs text-gray-500 flex items-center gap-1">
                                                <Paperclip className="w-3 h-3" />
                                                Archivos Adjuntos ({attachments.length})
                                            </Label>
                                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {attachments.map((file, index) => {
                                                    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
                                                    const formatSize = (bytes: number) => {
                                                        if (bytes < 1024) return bytes + ' B';
                                                        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                                                        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
                                                    };
                                                    return (
                                                        <a
                                                            key={index}
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 p-2 bg-gray-50 hover:bg-gray-100 border rounded transition-colors"
                                                        >
                                                            {isImage ? (
                                                                <FileImage className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                            ) : (
                                                                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">{file.name}</p>
                                                                <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                                                            </div>
                                                            <Download className="w-4 h-4 text-gray-400" />
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.visit('/dashboard')}
                                        className="h-8 text-xs"
                                    >
                                        Volver al Dashboard
                                    </Button>
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
