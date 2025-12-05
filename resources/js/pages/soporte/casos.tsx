import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router, Link } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, ChevronsUpDown, Edit, Trash2, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface User {
    id: number;
    username: string;
    name: string;
    role: string;
}

interface Category {
    id: number;
    name: string;
    completename: string;
}

interface Technician {
    id: number;
    name: string;
    firstname: string;
    realname: string;
    fullname: string;
}

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
    item_name: string | null;
    users_id_recipient: number;
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
    categories: Category[];
    technicians: Technician[];
    filters: {
        per_page: number;
        sort: string;
        direction: string;
        search: string;
        status: string;
        priority: string;
        category: string;
        assigned: string;
        date_from: string;
        date_to: string;
        filter: string;
    };
    auth: {
        user: User;
    };
}

export default function Casos({ tickets, categories, technicians, filters, auth }: TicketsProps) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [ticketToDelete, setTicketToDelete] = React.useState<Ticket | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
    const [ticketToView, setTicketToView] = React.useState<Ticket | null>(null);
    const [showFilters, setShowFilters] = React.useState(false);
    
    // Estados de filtros
    const [statusFilter, setStatusFilter] = React.useState(filters.status || 'all');
    const [priorityFilter, setPriorityFilter] = React.useState(filters.priority || 'all');
    const [categoryFilter, setCategoryFilter] = React.useState(filters.category || 'all');
    const [assignedFilter, setAssignedFilter] = React.useState(filters.assigned || 'all');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');
    
    const hasActiveFilters = (statusFilter && statusFilter !== 'all') || 
                            (priorityFilter && priorityFilter !== 'all') || 
                            (categoryFilter && categoryFilter !== 'all') || 
                            (assignedFilter && assignedFilter !== 'all') ||
                            dateFrom || dateTo || filters.filter;

    const getSpecialFilterLabel = () => {
        switch (filters.filter) {
            case 'unassigned': return 'Sin asignar';
            case 'my_cases': return 'Mis casos';
            case 'resolved_today': return 'Resueltos hoy';
            default: return null;
        }
    };

    const clearSpecialFilter = () => {
        router.get('/soporte/casos', {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
        }, { preserveState: false });
    };

    // Verificar si el usuario puede eliminar un ticket
    const canDelete = (ticket: Ticket) => {
        if (auth.user.role === 'Administrador') return true;
        if (auth.user.role === 'Técnico') {
            // Técnico solo puede eliminar tickets que él creó
            return ticket.users_id_recipient === auth.user.id;
        }
        return false;
    };

    // Verificar si el usuario puede editar (Admin y Técnico pueden editar)
    const canEdit = () => {
        return auth.user.role === 'Administrador' || auth.user.role === 'Técnico';
    };

    const handleDeleteClick = (ticket: Ticket) => {
        setTicketToDelete(ticket);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (ticketToDelete) {
            router.delete(`/soporte/casos/${ticketToDelete.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setTicketToDelete(null);
                }
            });
        }
    };

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        
        // Construir parámetros solo con valores no vacíos
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: field,
            direction: newDirection,
        };
        
        // Solo agregar filtros que tengan valor
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        if (filters.priority) params.priority = filters.priority;
        if (filters.category) params.category = filters.category;
        if (filters.assigned) params.assigned = filters.assigned;
        if (filters.date_from) params.date_from = filters.date_from;
        if (filters.date_to) params.date_to = filters.date_to;
        if (filters.filter) params.filter = filters.filter;
        
        router.get('/soporte/casos', params, { 
            preserveState: false,
            preserveScroll: true 
        });
    };

    const handlePageChange = (url: string | null) => {
        if (url) {
            router.visit(url, { 
                preserveScroll: true
            });
        }
    };

    const handleSearch = () => {
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1
        };

        // Solo agregar parámetros si tienen valor
        if (searchValue) params.search = searchValue;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (priorityFilter && priorityFilter !== 'all') params.priority = priorityFilter;
        if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
        if (assignedFilter && assignedFilter !== 'all') params.assigned = assignedFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        router.get('/soporte/casos', params, {
            preserveState: false,
            preserveScroll: false,
            replace: true
        });
    };

    const handlePerPageChange = (value: string) => {
        // Solo enviar parámetros con valores
        const params: Record<string, any> = {
            per_page: value,
            sort: filters.sort,
            direction: filters.direction,
            page: 1
        };
        
        // Agregar solo filtros con valores no vacíos
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        if (filters.priority) params.priority = filters.priority;
        if (filters.category) params.category = filters.category;
        if (filters.assigned) params.assigned = filters.assigned;
        if (filters.date_from) params.date_from = filters.date_from;
        if (filters.date_to) params.date_to = filters.date_to;
        if (filters.filter) params.filter = filters.filter;
        
        router.get('/soporte/casos', params, { 
            preserveState: false,
            preserveScroll: true 
        });
    };

    const applyFilters = () => {
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1
        };

        // Solo agregar parámetros si tienen valor
        if (searchValue) params.search = searchValue;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (priorityFilter && priorityFilter !== 'all') params.priority = priorityFilter;
        if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
        if (assignedFilter && assignedFilter !== 'all') params.assigned = assignedFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        console.log('Applying filters:', params);
        router.get('/soporte/casos', params, {
            preserveState: false,
            preserveScroll: false,
            replace: true
        });
    };

    const clearFilters = () => {
        setStatusFilter('all');
        setPriorityFilter('all');
        setCategoryFilter('all');
        setAssignedFilter('all');
        setDateFrom('');
        setDateTo('');
        setSearchValue('');

        router.get('/soporte/casos', {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1
        }, {
            preserveState: false,
            preserveScroll: false,
            replace: true
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
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                            <span className="text-gray-400">/</span>
                            <Link href="/soporte/casos" className="text-gray-600 hover:text-[#2c4370] hover:underline">Soporte</Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Casos</span>
                        </div>
                    }
                />
                
                <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6">
                    {/* Banner de filtro especial */}
                    {filters.filter && (
                        <div className="mb-4 bg-[#2c4370] text-white px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm sm:text-base">
                                <Filter className="w-4 h-4 shrink-0" />
                                <span className="font-medium">{getSpecialFilterLabel()}</span>
                                <span className="text-white/70">({tickets.total})</span>
                            </div>
                            <button onClick={clearSpecialFilter} className="flex items-center gap-1 hover:bg-white/20 px-2 py-1 transition-colors text-sm">
                                <X className="w-4 h-4" />
                                <span>Quitar</span>
                            </button>
                        </div>
                    )}
                    
                    <div className="bg-white shadow border border-gray-200">
                        {/* Header */}
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                                    {filters.filter ? getSpecialFilterLabel() : 'Casos'}
                                </h1>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                    <div className="relative flex-1 sm:flex-initial">
                                        <Input
                                            type="text"
                                            placeholder="Buscar..."
                                            className="w-full sm:w-64 pr-10 h-9"
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
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowFilters(!showFilters)}
                                            className={`h-9 flex-1 sm:flex-initial ${hasActiveFilters ? 'border-[#2c4370] text-[#2c4370]' : ''}`}
                                        >
                                            <Filter className="h-4 w-4 sm:mr-1" />
                                            <span className="hidden sm:inline">Filtros</span>
                                            {hasActiveFilters && <span className="ml-1 bg-[#2c4370] text-white text-xs w-5 h-5 flex items-center justify-center">!</span>}
                                        </Button>
                                        <Button 
                                            size="sm"
                                            className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-9 flex-1 sm:flex-initial"
                                        >
                                            <span className="hidden sm:inline">Exportar</span>
                                            <span className="sm:hidden">Excel</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Panel de Filtros */}
                        {showFilters && (
                            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Estado</label>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
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
                                        <label className="text-xs text-gray-600 mb-1 block">Prioridad</label>
                                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Todas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
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
                                        <label className="text-xs text-gray-600 mb-1 block">Asignado a</label>
                                        <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {technicians.map((tech) => (
                                                    <SelectItem key={tech.id} value={tech.id.toString()}>
                                                        {tech.fullname}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Categoría</label>
                                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Todas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                                        {cat.completename}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Desde</label>
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Hasta</label>
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3">
                                    {hasActiveFilters && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearFilters}
                                            className="h-8 text-xs text-gray-600"
                                        >
                                            <X className="h-3 w-3 mr-1" />
                                            Limpiar
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={applyFilters}
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-8 text-xs"
                                    >
                                        Aplicar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-50 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xs sm:text-sm text-gray-600">Mostrar</span>
                                <Select 
                                    value={filters.per_page.toString()} 
                                    onValueChange={handlePerPageChange}
                                >
                                    <SelectTrigger className="w-16 sm:w-20 h-7 sm:h-8 text-xs sm:text-sm">
                                        <SelectValue placeholder="15" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">elementos</span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">
                                <span className="font-medium">{tickets.data.length}</span> de{' '}
                                <span className="font-medium">{tickets.total}</span>
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
                                        <TableHead className="font-semibold text-gray-900 text-xs">
                                            Elemento
                                        </TableHead>
                                        {canEdit() && (
                                            <TableHead className="font-semibold text-gray-900 text-xs text-center w-24">
                                                Acciones
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.data.map((ticket) => (
                                        <TableRow key={ticket.id} className="hover:bg-gray-50">
                                            <TableCell className="text-xs font-medium">{ticket.id}</TableCell>
                                            <TableCell className="font-medium text-xs">
                                                <button 
                                                    onClick={() => {
                                                        setTicketToView(ticket);
                                                        setViewDialogOpen(true);
                                                    }}
                                                    className="text-[#2c4370] hover:underline block truncate max-w-md text-left"
                                                    title={ticket.name}
                                                >
                                                    {ticket.name || '(Sin título)'}
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <span className={`px-2 py-1 text-[10px] font-semibold ${getStatusColor(ticket.status)}`}>
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
                                            <TableCell className="text-xs text-gray-600">{ticket.item_name || '-'}</TableCell>
                                            {canEdit() && (
                                                <TableCell className="text-xs">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                            onClick={() => router.visit(`/soporte/casos/${ticket.id}/editar`)}
                                                            title="Editar"
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                        {canDelete(ticket) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                                                onClick={() => handleDeleteClick(ticket)}
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                    {tickets.data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={canEdit() ? 12 : 11} className="text-center py-8 text-gray-500">
                                                No se encontraron casos
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                                Página {tickets.current_page} de {tickets.last_page}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
                                {tickets.links.map((link, index) => {
                                    const isMobileVisible = index === 0 || index === tickets.links.length - 1 || link.active;
                                    if (index === 0) {
                                        return (
                                            <Button key={index} variant="outline" size="sm" disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0"
                                                onClick={() => link.url && handlePageChange(link.url)}>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    if (index === tickets.links.length - 1) {
                                        return (
                                            <Button key={index} variant="outline" size="sm" disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0"
                                                onClick={() => link.url && handlePageChange(link.url)}>
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    return (
                                        <Button key={index} variant={link.active ? "default" : "outline"} size="sm" disabled={!link.url}
                                            className={`${!isMobileVisible ? 'hidden sm:inline-flex' : ''} h-8 min-w-[32px] px-2 text-xs sm:text-sm ${link.active 
                                                ? "bg-[#2c4370] hover:!bg-[#3d5583] text-white border-[#2c4370]" 
                                                : "border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white"}`}
                                            onClick={() => link.url && handlePageChange(link.url)}>
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

            {/* Dialog de confirmación para eliminar */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Eliminar Caso</DialogTitle>
                        <DialogDescription>
                            ¿Está seguro que desea eliminar el caso <strong>#{ticketToDelete?.id}</strong>?
                            <br />
                            <span className="text-gray-600">{ticketToDelete?.name}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de visualización del caso */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="text-[#2c4370]">Caso #{ticketToView?.id}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-semibold ${ticketToView ? getStatusColor(ticketToView.status) : ''}`}>
                                {ticketToView?.status_name}
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                    
                    {ticketToView && (
                        <div className="space-y-4">
                            {/* Título */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">{ticketToView.name}</h3>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-gray-50 p-2">
                                    <span className="text-gray-500 block">Prioridad</span>
                                    <span className="font-medium">{ticketToView.priority_name}</span>
                                </div>
                                <div className="bg-gray-50 p-2">
                                    <span className="text-gray-500 block">Entidad</span>
                                    <span className="font-medium">{ticketToView.entity_name || '-'}</span>
                                </div>
                                <div className="bg-gray-50 p-2">
                                    <span className="text-gray-500 block">Fecha de Apertura</span>
                                    <span className="font-medium">
                                        {ticketToView.date ? new Date(ticketToView.date).toLocaleDateString('es-CO', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : '-'}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-2">
                                    <span className="text-gray-500 block">Última Actualización</span>
                                    <span className="font-medium">
                                        {ticketToView.date_mod ? new Date(ticketToView.date_mod).toLocaleDateString('es-CO', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : '-'}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-2">
                                    <span className="text-gray-500 block">Solicitante</span>
                                    <span className="font-medium">{ticketToView.requester_name || '-'}</span>
                                </div>
                                <div className="bg-gray-50 p-2">
                                    <span className="text-gray-500 block">Asignado a</span>
                                    <span className="font-medium">{ticketToView.assigned_name || '-'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 col-span-2">
                                    <span className="text-gray-500 block">Categoría</span>
                                    <span className="font-medium">{ticketToView.category_name || '-'}</span>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewDialogOpen(false)}
                                    className="h-8 text-xs"
                                >
                                    Cerrar
                                </Button>
                                {canEdit() && (
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setViewDialogOpen(false);
                                            router.visit(`/soporte/casos/${ticketToView.id}/editar`);
                                        }}
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-8 text-xs"
                                    >
                                        Editar Caso
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
