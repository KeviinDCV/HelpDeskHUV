import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Ticket {
    id: number;
    name: string;
    entity_name: string;
    date: string;
    date_mod: string;
    status: number;
    status_name: string;
    priority: number;
    priority_name: string;
    requester_name: string | null;
    assigned_name: string | null;
    category_name: string | null;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface TicketsProps {
    tickets: {
        data: Ticket[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLinks[];
    };
    filters: {
        per_page: number;
        sort: string;
        direction: string;
        search: string;
    };
}

export default function Casos({ tickets, filters }: TicketsProps) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get('/soporte/casos', { 
            ...filters, 
            sort: field, 
            direction: newDirection
        }, { 
            preserveState: false,
            preserveScroll: true 
        });
    };

    const handlePageChange = (url: string | null) => {
        if (url) {
            router.get(url, filters, { 
                preserveState: true,
                preserveScroll: true 
            });
        }
    };

    const handleSearch = () => {
        router.get('/soporte/casos', { 
            ...filters, 
            search: searchValue,
            page: 1 
        }, { 
            preserveState: false,
            preserveScroll: true
        });
    };

    const handlePerPageChange = (value: string) => {
        router.get('/soporte/casos', { 
            ...filters, 
            per_page: value,
            page: 1
        }, { 
            preserveState: false,
            preserveScroll: true 
        });
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) return <ChevronsUpDown className="h-3 w-3 ml-1 text-gray-400" />;
        return filters.direction === 'asc' 
            ? <ArrowUp className="h-3 w-3 ml-1 text-[#2c4370]" />
            : <ArrowDown className="h-3 w-3 ml-1 text-[#2c4370]" />;
    };

    // Función para obtener el color del estado
    const getStatusColor = (status: number) => {
        switch (status) {
            case 1: return 'bg-blue-100 text-blue-800'; // Nuevo
            case 2: return 'bg-yellow-100 text-yellow-800'; // En curso (asignado)
            case 3: return 'bg-yellow-100 text-yellow-800'; // En curso (planificado)
            case 4: return 'bg-orange-100 text-orange-800'; // En espera
            case 5: return 'bg-green-100 text-green-800'; // Resuelto
            case 6: return 'bg-gray-100 text-gray-800'; // Cerrado
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <>
            <Head title="HelpDesk HUV - Casos" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader 
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Inicio</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">Soporte</span>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Casos</span>
                        </div>
                    }
                />
                
                <main className="flex-1 px-6 py-6">
                    <div className="bg-white rounded-lg shadow">
                        {/* Header */}
                        <div className="px-6 py-4 border-b">
                            <div className="flex items-center justify-between">
                                <h1 className="text-xl font-semibold text-gray-900">Casos</h1>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Buscar..."
                                            className="w-64 pr-10"
                                            value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSearch();
                                                }
                                            }}
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={handleSearch}
                                        >
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button 
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white"
                                    >
                                        Exportar
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">Mostrar</span>
                                <Select 
                                    value={filters.per_page.toString()} 
                                    onValueChange={handlePerPageChange}
                                >
                                    <SelectTrigger className="w-20 h-8">
                                        <SelectValue placeholder="15" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-sm text-gray-600">elementos</span>
                            </div>
                            <p className="text-sm text-gray-600">
                                Mostrando <span className="font-medium">{tickets.data.length}</span> de{' '}
                                <span className="font-medium">{tickets.total}</span> casos
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100 w-16"
                                            onClick={() => handleSort('id')}
                                        >
                                            <div className="flex items-center">
                                                ID
                                                {getSortIcon('id')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center">
                                                Título
                                                {getSortIcon('name')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('status')}
                                        >
                                            <div className="flex items-center">
                                                Estado
                                                {getSortIcon('status')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('priority')}
                                        >
                                            <div className="flex items-center">
                                                Prioridad
                                                {getSortIcon('priority')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('entity_name')}
                                        >
                                            <div className="flex items-center">
                                                Entidad
                                                {getSortIcon('entity_name')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('date')}
                                        >
                                            <div className="flex items-center">
                                                Fecha de apertura
                                                {getSortIcon('date')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('date_mod')}
                                        >
                                            <div className="flex items-center">
                                                Última actualización
                                                {getSortIcon('date_mod')}
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs">
                                            Solicitante
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs">
                                            Asignado a
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs">
                                            Categoría
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.data.map((ticket) => (
                                        <TableRow key={ticket.id} className="hover:bg-gray-50">
                                            <TableCell className="text-xs font-medium">{ticket.id}</TableCell>
                                            <TableCell className="font-medium text-xs">
                                                <a href={`/soporte/casos/${ticket.id}`} className="text-[#2c4370] hover:underline block truncate max-w-md" title={ticket.name}>
                                                    {ticket.name || '(Sin título)'}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status_name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs">{ticket.priority_name}</TableCell>
                                            <TableCell className="text-xs">{ticket.entity_name || '-'}</TableCell>
                                            <TableCell className="text-xs text-gray-600">
                                                {ticket.date ? new Date(ticket.date).toLocaleDateString('es-CO', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}</TableCell>
                                            <TableCell className="text-xs text-gray-600">
                                                {ticket.date_mod ? new Date(ticket.date_mod).toLocaleDateString('es-CO', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}</TableCell>
                                            <TableCell className="text-xs">{ticket.requester_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{ticket.assigned_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{ticket.category_name || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                    {tickets.data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                                No se encontraron casos
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Página <span className="font-medium">{tickets.current_page}</span> de{' '}
                                <span className="font-medium">{tickets.last_page}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {tickets.links.map((link, index) => {
                                    if (index === 0) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50"
                                                onClick={() => link.url && handlePageChange(link.url)}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    if (index === tickets.links.length - 1) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50"
                                                onClick={() => link.url && handlePageChange(link.url)}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    
                                    // Renderizar elipsis o números de página
                                    return (
                                        <Button
                                            key={index}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            disabled={!link.url}
                                            className={link.active 
                                                ? "bg-[#2c4370] hover:!bg-[#3d5583] text-white border-[#2c4370]" 
                                                : "border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white"
                                            }
                                            onClick={() => link.url && handlePageChange(link.url)}
                                        >
                                            <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </main>
                <GLPIFooter />
            </div>
        </>
    );
}
