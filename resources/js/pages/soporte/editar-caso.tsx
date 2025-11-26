import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router, useForm } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import React from 'react';

interface User {
    id: number;
    username: string;
    name: string;
    email: string;
    role: string;
}

interface GLPIUser {
    id: number;
    name: string;
    firstname: string;
    realname: string;
    fullname: string;
}

interface Location {
    id: number;
    name: string;
    completename: string;
}

interface ItemType {
    value: string;
    label: string;
}

interface Category {
    id: number;
    name: string;
    completename: string;
}

interface Ticket {
    id: number;
    name: string;
    content: string;
    date: string;
    time_to_resolve: string | null;
    internal_time_to_resolve: string | null;
    status: number;
    priority: number;
    locations_id: number;
    itilcategories_id: number;
}

interface TicketUser {
    id: number;
    tickets_id: number;
    users_id: number;
    type: number;
}

interface TicketItem {
    id: number;
    tickets_id: number;
    itemtype: string;
    items_id: number;
}

interface EditTicketProps {
    ticket: Ticket;
    ticketUsers: TicketUser[];
    ticketItems: TicketItem[];
    locations: Location[];
    categories: Category[];
    glpiUsers: GLPIUser[];
    itemTypes: ItemType[];
    auth: {
        user: User;
    };
}

export default function EditarCaso({ ticket, ticketUsers, ticketItems, locations, categories, glpiUsers, itemTypes, auth }: EditTicketProps) {
    // Formatear fecha para input datetime-local
    const formatDateForInput = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
    };

    const { data, setData, put, processing, errors } = useForm({
        name: ticket.name || '',
        content: ticket.content || '',
        date: formatDateForInput(ticket.date),
        time_to_resolve: formatDateForInput(ticket.time_to_resolve),
        internal_time_to_resolve: formatDateForInput(ticket.internal_time_to_resolve),
        status: ticket.status.toString(),
        priority: ticket.priority.toString(),
        locations_id: ticket.locations_id?.toString() || '',
        itilcategories_id: ticket.itilcategories_id?.toString() || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        router.put(`/soporte/casos/${ticket.id}`, data, {
            onSuccess: () => {
                // Redirect handled by backend
            }
        });
    };

    return (
        <>
            <Head title={`Editar Caso #${ticket.id} - HelpDesk HUV`} />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Inicio</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">Soporte</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">Casos</span>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">Editar #{ticket.id}</span>
                    </div>
                } />

                <main className="flex-1 px-6 py-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b">
                                <h1 className="text-xl font-semibold text-gray-900">Editar Caso #{ticket.id}</h1>
                                <p className="text-sm text-gray-600 mt-1">Modifique los datos del caso</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* Título */}
                                    <div className="md:col-span-4">
                                        <Label htmlFor="name" className="text-xs">Título *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Título del caso"
                                            required
                                            className="mt-1 h-8 text-sm"
                                        />
                                        {errors.name && <p className="text-red-600 text-xs mt-0.5">{errors.name}</p>}
                                    </div>

                                    {/* Fecha, Estado, Prioridad, Localización */}
                                    <div>
                                        <Label htmlFor="date" className="text-xs">Fecha Apertura *</Label>
                                        <Input
                                            id="date"
                                            type="datetime-local"
                                            value={data.date}
                                            onChange={(e) => setData('date', e.target.value)}
                                            required
                                            className="mt-1 h-8 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="status" className="text-xs">Estado *</Label>
                                        <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                            <SelectTrigger className="mt-1 h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Nuevo</SelectItem>
                                                <SelectItem value="2">En curso (asignado)</SelectItem>
                                                <SelectItem value="3">En curso (planificado)</SelectItem>
                                                <SelectItem value="4">En espera</SelectItem>
                                                <SelectItem value="5">Resuelto</SelectItem>
                                                <SelectItem value="6">Cerrado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="priority" className="text-xs">Prioridad *</Label>
                                        <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                                            <SelectTrigger className="mt-1 h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Muy baja</SelectItem>
                                                <SelectItem value="2">Baja</SelectItem>
                                                <SelectItem value="3">Media</SelectItem>
                                                <SelectItem value="4">Alta</SelectItem>
                                                <SelectItem value="5">Muy alta</SelectItem>
                                                <SelectItem value="6">Urgente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="locations_id" className="text-xs">Localización</Label>
                                        <SearchableSelect
                                            options={locations.map(loc => ({ value: loc.id.toString(), label: loc.completename }))}
                                            value={data.locations_id}
                                            onValueChange={(value) => setData('locations_id', value)}
                                            placeholder="Seleccione..."
                                            searchPlaceholder="Buscar ubicación..."
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Categoría */}
                                    <div className="md:col-span-4">
                                        <Label htmlFor="itilcategories_id" className="text-xs">Categoría</Label>
                                        <SearchableSelect
                                            options={categories.map(cat => ({ value: cat.id.toString(), label: cat.completename }))}
                                            value={data.itilcategories_id}
                                            onValueChange={(value) => setData('itilcategories_id', value)}
                                            placeholder="Seleccione una categoría..."
                                            searchPlaceholder="Buscar categoría..."
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Tiempos */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="time_to_resolve" className="text-xs text-gray-500">Tiempo Solución (Opcional)</Label>
                                        <Input
                                            id="time_to_resolve"
                                            type="datetime-local"
                                            value={data.time_to_resolve}
                                            onChange={(e) => setData('time_to_resolve', e.target.value)}
                                            className="mt-1 h-8 text-xs"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="internal_time_to_resolve" className="text-xs text-gray-500">Tiempo Interno (Opcional)</Label>
                                        <Input
                                            id="internal_time_to_resolve"
                                            type="datetime-local"
                                            value={data.internal_time_to_resolve}
                                            onChange={(e) => setData('internal_time_to_resolve', e.target.value)}
                                            className="mt-1 h-8 text-xs"
                                        />
                                    </div>

                                    {/* Descripción */}
                                    <div className="md:col-span-4">
                                        <Label htmlFor="content" className="text-xs">Descripción *</Label>
                                        <Textarea
                                            id="content"
                                            value={data.content}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('content', e.target.value)}
                                            placeholder="Detalle el caso..."
                                            required
                                            rows={5}
                                            className="mt-1 text-sm"
                                        />
                                        {errors.content && <p className="text-red-600 text-xs mt-0.5">{errors.content}</p>}
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.visit('/soporte/casos')}
                                        className="h-8 text-xs"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        size="sm"
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-8 text-xs px-6"
                                    >
                                        {processing ? 'Guardando...' : 'Guardar Cambios'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>

                <GLPIFooter />
            </div>
        </>
    );
}
