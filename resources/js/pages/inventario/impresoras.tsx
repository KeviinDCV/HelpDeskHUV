import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router, usePage, Link } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, ChevronsUpDown, Filter, X, Plus, Pencil, Trash2, AlertTriangle, Eye, Loader2, Check, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Printer {
    id: number;
    name: string;
    entity_name: string;
    state_name: string | null;
    manufacturer_name: string | null;
    location_name: string | null;
    type_name: string | null;
    model_name: string | null;
    date_mod: string;
    ip_addresses: string[];
}

interface PrinterDetail {
    id: number;
    name: string;
    serial: string;
    otherserial: string;
    comment: string;
    contact: string;
    contact_num: string;
    memory_size: string;
    have_serial: number;
    have_parallel: number;
    have_usb: number;
    have_wifi: number;
    have_ethernet: number;
    init_pages_counter: number;
    last_pages_counter: number;
    date_mod: string;
    date_creation: string;
    entity_name: string | null;
    state_name: string | null;
    manufacturer_name: string | null;
    location_name: string | null;
    type_name: string | null;
    model_name: string | null;
    tech_name: string | null;
    tech_group_name: string | null;
    domain_name: string | null;
    ip_addresses: string[];
    ip_networks: string[];
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface State {
    id: number;
    name: string;
}

interface Manufacturer {
    id: number;
    name: string;
}

interface PrinterType {
    id: number;
    name: string;
}

interface Location {
    id: number;
    name: string;
    completename: string;
}

interface PrintersProps {
    printers: {
        data: Printer[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLinks[];
    };
    states: State[];
    manufacturers: Manufacturer[];
    types: PrinterType[];
    locations: Location[];
    filters: {
        per_page: number;
        sort: string;
        direction: string;
        search: string;
        state: string;
        manufacturer: string;
        type: string;
        location: string;
        date_from: string;
        date_to: string;
    };
}

export default function Impresoras({ printers, states, manufacturers, types, locations, filters }: PrintersProps) {
    const { auth } = usePage().props as any;
    const isAdmin = auth?.user?.role === 'Administrador';
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [deleteModal, setDeleteModal] = React.useState<{open: boolean, id: number | null, name: string}>({open: false, id: null, name: ''});
    const [showFilters, setShowFilters] = React.useState(false);
    const [detailModal, setDetailModal] = React.useState<{open: boolean, loading: boolean, printer: PrinterDetail | null}>({open: false, loading: false, printer: null});
    
    const [stateFilter, setStateFilter] = React.useState(filters.state || 'all');
    const [manufacturerFilter, setManufacturerFilter] = React.useState(filters.manufacturer || 'all');
    const [typeFilter, setTypeFilter] = React.useState(filters.type || 'all');
    const [locationFilter, setLocationFilter] = React.useState(filters.location || 'all');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');
    
    const hasActiveFilters = (stateFilter && stateFilter !== 'all') || 
                            (manufacturerFilter && manufacturerFilter !== 'all') || 
                            (typeFilter && typeFilter !== 'all') || 
                            (locationFilter && locationFilter !== 'all') ||
                            dateFrom || dateTo;

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        const params: Record<string, any> = { per_page: filters.per_page, sort: field, direction: newDirection };
        if (filters.search) params.search = filters.search;
        if (filters.state && filters.state !== 'all') params.state = filters.state;
        if (filters.manufacturer && filters.manufacturer !== 'all') params.manufacturer = filters.manufacturer;
        if (filters.type && filters.type !== 'all') params.type = filters.type;
        if (filters.location && filters.location !== 'all') params.location = filters.location;
        if (filters.date_from) params.date_from = filters.date_from;
        if (filters.date_to) params.date_to = filters.date_to;
        router.get('/inventario/impresoras', params, { preserveState: false });
    };

    const handleSearch = () => {
        const params: Record<string, any> = { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 };
        if (searchValue) params.search = searchValue;
        if (stateFilter && stateFilter !== 'all') params.state = stateFilter;
        if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;
        if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
        if (locationFilter && locationFilter !== 'all') params.location = locationFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        router.get('/inventario/impresoras', params, { preserveState: false });
    };

    const applyFilters = () => {
        const params: Record<string, any> = { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 };
        if (searchValue) params.search = searchValue;
        if (stateFilter && stateFilter !== 'all') params.state = stateFilter;
        if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;
        if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
        if (locationFilter && locationFilter !== 'all') params.location = locationFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        router.get('/inventario/impresoras', params, { preserveState: false, replace: true });
    };

    const clearFilters = () => {
        setStateFilter('all'); setManufacturerFilter('all'); setTypeFilter('all'); setLocationFilter('all');
        setDateFrom(''); setDateTo(''); setSearchValue('');
        router.get('/inventario/impresoras', { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 }, { preserveState: false, replace: true });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        params.append('sort', filters.sort); params.append('direction', filters.direction);
        if (filters.search) params.append('search', filters.search);
        if (filters.state && filters.state !== 'all') params.append('state', filters.state);
        if (filters.manufacturer && filters.manufacturer !== 'all') params.append('manufacturer', filters.manufacturer);
        if (filters.type && filters.type !== 'all') params.append('type', filters.type);
        if (filters.location && filters.location !== 'all') params.append('location', filters.location);
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);
        window.location.href = `/inventario/impresoras/export?${params}`;
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) {
            return <ChevronsUpDown className="h-3 w-3 ml-1 text-gray-400" />;
        }
        return filters.direction === 'asc' 
            ? <ArrowUp className="h-3 w-3 ml-1 text-[#2c4370]" />
            : <ArrowDown className="h-3 w-3 ml-1 text-[#2c4370]" />;
    };

    const handleDelete = (id: number, name: string) => {
        setDeleteModal({open: true, id, name});
    };

    const confirmDelete = () => {
        if (deleteModal.id) {
            router.delete(`/inventario/impresoras/${deleteModal.id}`);
        }
        setDeleteModal({open: false, id: null, name: ''});
    };

    const handleShowDetail = (id: number) => {
        router.visit(`/inventario/impresoras/${id}`);
    };

    return (
        <>
            <Head title="HelpDesk HUV - Impresoras" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader 
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                            <span className="text-gray-400">/</span>
                            <Link href="/inventario/global" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inventario</Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Impresoras</span>
                        </div>
                    }
                />

                <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6">
                    <div className="bg-white rounded-lg shadow">
                        {/* Header */}
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Impresoras</h1>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                    <div className="relative flex-1 sm:flex-initial">
                                        <Input type="text" placeholder="Buscar..." className="w-full sm:w-64 pr-10 h-9" value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} />
                                        <Button size="sm" variant="ghost" className="absolute right-0 top-0 h-full px-3" onClick={handleSearch}>
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                                            className={`h-9 flex-1 sm:flex-initial ${hasActiveFilters ? 'border-[#2c4370] text-[#2c4370]' : ''}`}>
                                            <Filter className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Filtros</span>
                                            {hasActiveFilters && <span className="ml-1 bg-[#2c4370] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">!</span>}
                                        </Button>
                                        <Button size="sm" className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-9 flex-1 sm:flex-initial" onClick={handleExport}>
                                            <span className="hidden sm:inline">Exportar</span><span className="sm:hidden">Excel</span>
                                        </Button>
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-9 flex-1 sm:flex-initial" onClick={() => router.visit('/inventario/impresoras/crear')}>
                                            <Plus className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Crear</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="px-6 py-4 bg-gray-50 border-b">
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Estado</label>
                                        <Select value={stateFilter} onValueChange={setStateFilter}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {states?.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Fabricante</label>
                                        <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {manufacturers?.map((m) => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Tipo</label>
                                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {types?.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Localización</label>
                                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                {locations?.map((l) => <SelectItem key={l.id} value={l.id.toString()}>{l.completename}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Desde</label>
                                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-xs" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Hasta</label>
                                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-3">
                                    {hasActiveFilters && (
                                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-gray-600">
                                            <X className="h-3 w-3 mr-1" /> Limpiar filtros
                                        </Button>
                                    )}
                                    <Button size="sm" onClick={applyFilters} className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-8 text-xs">Aplicar filtros</Button>
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-50 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xs sm:text-sm text-gray-600">Mostrar</span>
                                <Select 
                                    value={filters.per_page.toString()}
                                    onValueChange={(value) => {
                                        router.get('/inventario/impresoras', { 
                                            per_page: value,
                                            sort: filters.sort,
                                            direction: filters.direction,
                                            search: filters.search
                                        }, { preserveState: false })
                                    }}
                                >
                                    <SelectTrigger className="w-16 sm:w-20 h-7 sm:h-8 text-xs sm:text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="15">15</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">elementos</span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">
                                <span className="font-medium">{printers.data.length}</span> de{' '}
                                <span className="font-medium">{printers.total}</span>
                            </p>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center">
                                                Nombre
                                                {getSortIcon('name')}
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
                                            onClick={() => handleSort('state_name')}
                                        >
                                            <div className="flex items-center">
                                                Estado
                                                {getSortIcon('state_name')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('manufacturer_name')}
                                        >
                                            <div className="flex items-center">
                                                Fabricante
                                                {getSortIcon('manufacturer_name')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('location_name')}
                                        >
                                            <div className="flex items-center">
                                                Localización
                                                {getSortIcon('location_name')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('type_name')}
                                        >
                                            <div className="flex items-center">
                                                Tipo
                                                {getSortIcon('type_name')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('model_name')}
                                        >
                                            <div className="flex items-center">
                                                Modelo
                                                {getSortIcon('model_name')}
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs">
                                            <div className="flex items-center">
                                                IP / Red
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
                                        {isAdmin && (<TableHead className="font-semibold text-gray-900 text-xs text-center">Acciones</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {printers.data.map((printer) => (
                                        <TableRow key={printer.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleShowDetail(printer.id)}>
                                            <TableCell className="font-medium text-xs text-[#2c4370]">
                                                {printer.name || '-'}
                                            </TableCell>
                                            <TableCell className="text-xs">{printer.entity_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{printer.state_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{printer.manufacturer_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{printer.location_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{printer.type_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{printer.model_name || '-'}</TableCell>
                                            <TableCell className="text-xs">
                                                {printer.ip_addresses?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {printer.ip_addresses.slice(0, 2).map((ip, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                                                                {ip}
                                                            </span>
                                                        ))}
                                                        {printer.ip_addresses.length > 2 && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                                                +{printer.ip_addresses.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {printer.date_mod ? new Date(printer.date_mod).toLocaleString('es-CO', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => router.visit(`/inventario/impresoras/${printer.id}/editar`)} title="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => handleDelete(printer.id, printer.name || '')} title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                                Página {printers.current_page} de {printers.last_page}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
                                {printers.links.map((link: PaginationLinks, index: number) => {
                                    const isMobileVisible = index === 0 || index === printers.links.length - 1 || link.active;
                                    if (index === 0) {
                                        return (
                                            <Button key={index} variant="outline" size="sm" disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0"
                                                onClick={() => link.url && router.visit(link.url)}>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    if (index === printers.links.length - 1) {
                                        return (
                                            <Button key={index} variant="outline" size="sm" disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0"
                                                onClick={() => link.url && router.visit(link.url)}>
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    return (
                                        <Button key={index} variant={link.active ? "default" : "outline"} size="sm" disabled={!link.url}
                                            className={`${!isMobileVisible ? 'hidden sm:inline-flex' : ''} h-8 min-w-[32px] px-2 text-xs sm:text-sm ${link.active 
                                                ? "bg-[#2c4370] hover:!bg-[#3d5583] text-white border-[#2c4370]" 
                                                : "border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white"}`}
                                            onClick={() => link.url && router.visit(link.url)}>
                                            {link.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </main>
                
                <GLPIFooter />
            </div>

            <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({...deleteModal, open})}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
                            <DialogTitle>Eliminar Impresora</DialogTitle>
                        </div>
                        <DialogDescription className="pt-2">¿Está seguro de eliminar la impresora <span className="font-semibold text-gray-900">"{deleteModal.name}"</span>? Esta acción no se puede deshacer.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteModal({open: false, id: null, name: ''})}>Cancelar</Button>
                        <Button variant="destructive" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Detalles */}
            <Dialog open={detailModal.open} onOpenChange={(open) => setDetailModal({...detailModal, open})}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-[#2c4370]" />
                            Detalles de la Impresora
                        </DialogTitle>
                    </DialogHeader>
                    
                    {detailModal.loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-[#2c4370]" />
                        </div>
                    ) : detailModal.printer && (
                        <div className="space-y-6">
                            {/* Información Básica */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">Información Básica</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Nombre</p>
                                        <p className="text-sm font-medium">{detailModal.printer.name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Entidad</p>
                                        <p className="text-sm font-medium">{detailModal.printer.entity_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Número de Serie</p>
                                        <p className="text-sm font-medium">{detailModal.printer.serial || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Número de Inventario</p>
                                        <p className="text-sm font-medium">{detailModal.printer.otherserial || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Clasificación */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">Clasificación</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Estado</p>
                                        <p className="text-sm font-medium">{detailModal.printer.state_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Tipo</p>
                                        <p className="text-sm font-medium">{detailModal.printer.type_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Fabricante</p>
                                        <p className="text-sm font-medium">{detailModal.printer.manufacturer_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Modelo</p>
                                        <p className="text-sm font-medium">{detailModal.printer.model_name || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Ubicación y Responsables */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">Ubicación y Responsables</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Localización</p>
                                        <p className="text-sm font-medium">{detailModal.printer.location_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Técnico a cargo</p>
                                        <p className="text-sm font-medium">{detailModal.printer.tech_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Grupo a cargo</p>
                                        <p className="text-sm font-medium">{detailModal.printer.tech_group_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Contacto</p>
                                        <p className="text-sm font-medium">{detailModal.printer.contact || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Conexiones */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">Conexiones</h3>
                                <div className="grid grid-cols-5 gap-4">
                                    <div className="flex items-center gap-2">
                                        {detailModal.printer.have_serial ? <Check className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                                        <span className="text-sm">Serial</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {detailModal.printer.have_parallel ? <Check className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                                        <span className="text-sm">Paralelo</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {detailModal.printer.have_usb ? <Check className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                                        <span className="text-sm">USB</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {detailModal.printer.have_ethernet ? <Check className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                                        <span className="text-sm">Ethernet</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {detailModal.printer.have_wifi ? <Check className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                                        <span className="text-sm">Wi-Fi</span>
                                    </div>
                                </div>
                            </div>

                            {/* Información de Red */}
                            {(detailModal.printer.ip_addresses?.length > 0 || detailModal.printer.domain_name) && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">Información de Red</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {detailModal.printer.domain_name && (
                                            <div>
                                                <p className="text-xs text-gray-500">Dominio</p>
                                                <p className="text-sm font-medium">{detailModal.printer.domain_name}</p>
                                            </div>
                                        )}
                                        {detailModal.printer.ip_addresses?.length > 0 && (
                                            <div className={detailModal.printer.domain_name ? '' : 'col-span-2'}>
                                                <p className="text-xs text-gray-500">Direcciones IP</p>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {detailModal.printer.ip_addresses.map((ip, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            {ip}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {detailModal.printer.ip_networks?.length > 0 && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-500">Redes IP</p>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {detailModal.printer.ip_networks.map((net, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                                            {net}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Información Adicional */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">Información Adicional</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Contador Inicial</p>
                                        <p className="text-sm font-medium">{detailModal.printer.init_pages_counter || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Último Contador</p>
                                        <p className="text-sm font-medium">{detailModal.printer.last_pages_counter || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Memoria</p>
                                        <p className="text-sm font-medium">{detailModal.printer.memory_size || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Fecha de Creación</p>
                                        <p className="text-sm font-medium">{detailModal.printer.date_creation ? new Date(detailModal.printer.date_creation).toLocaleString('es-CO') : '-'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500">Última Actualización</p>
                                        <p className="text-sm font-medium">{detailModal.printer.date_mod ? new Date(detailModal.printer.date_mod).toLocaleString('es-CO') : '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Comentarios */}
                            {detailModal.printer.comment && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">Comentarios</h3>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailModal.printer.comment}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        {isAdmin && detailModal.printer && (
                            <Button variant="outline" onClick={() => { setDetailModal({open: false, loading: false, printer: null}); router.visit(`/inventario/impresoras/${detailModal.printer?.id}/editar`); }}>
                                <Pencil className="h-4 w-4 mr-1" /> Editar
                            </Button>
                        )}
                        <Button onClick={() => setDetailModal({open: false, loading: false, printer: null})} className="bg-[#2c4370] hover:bg-[#3d5583]">
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
