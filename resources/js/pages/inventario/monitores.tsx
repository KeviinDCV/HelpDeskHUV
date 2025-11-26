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
import { ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, ChevronsUpDown, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Monitor {
    id: number;
    name: string;
    entity_name: string;
    state_name: string | null;
    manufacturer_name: string | null;
    location_name: string | null;
    type_name: string | null;
    model_name: string | null;
    date_mod: string;
    otherserial: string;
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

interface MonitorType {
    id: number;
    name: string;
}

interface Location {
    id: number;
    name: string;
    completename: string;
}

interface MonitorsProps {
    monitors: {
        data: Monitor[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLinks[];
    };
    states: State[];
    manufacturers: Manufacturer[];
    types: MonitorType[];
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

export default function Monitores({ monitors, states, manufacturers, types, locations, filters }: MonitorsProps) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [showFilters, setShowFilters] = React.useState(false);
    
    // Estados de filtros
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
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: field,
            direction: newDirection
        };
        if (filters.search) params.search = filters.search;
        if (filters.state && filters.state !== 'all') params.state = filters.state;
        if (filters.manufacturer && filters.manufacturer !== 'all') params.manufacturer = filters.manufacturer;
        if (filters.type && filters.type !== 'all') params.type = filters.type;
        if (filters.location && filters.location !== 'all') params.location = filters.location;
        if (filters.date_from) params.date_from = filters.date_from;
        if (filters.date_to) params.date_to = filters.date_to;
        router.get('/inventario/monitores', params, { preserveState: false });
    };

    const handleSearch = () => {
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1
        };
        if (searchValue) params.search = searchValue;
        if (stateFilter && stateFilter !== 'all') params.state = stateFilter;
        if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;
        if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
        if (locationFilter && locationFilter !== 'all') params.location = locationFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        router.get('/inventario/monitores', params, { preserveState: false });
    };

    const applyFilters = () => {
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1
        };
        if (searchValue) params.search = searchValue;
        if (stateFilter && stateFilter !== 'all') params.state = stateFilter;
        if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;
        if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
        if (locationFilter && locationFilter !== 'all') params.location = locationFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        router.get('/inventario/monitores', params, { preserveState: false, replace: true });
    };

    const clearFilters = () => {
        setStateFilter('all');
        setManufacturerFilter('all');
        setTypeFilter('all');
        setLocationFilter('all');
        setDateFrom('');
        setDateTo('');
        setSearchValue('');
        router.get('/inventario/monitores', {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1
        }, { preserveState: false, replace: true });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        params.append('sort', filters.sort);
        params.append('direction', filters.direction);
        if (filters.search) params.append('search', filters.search);
        if (filters.state && filters.state !== 'all') params.append('state', filters.state);
        if (filters.manufacturer && filters.manufacturer !== 'all') params.append('manufacturer', filters.manufacturer);
        if (filters.type && filters.type !== 'all') params.append('type', filters.type);
        if (filters.location && filters.location !== 'all') params.append('location', filters.location);
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);
        window.location.href = `/inventario/monitores/export?${params}`;
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) {
            return <ChevronsUpDown className="h-3 w-3 ml-1 text-gray-400" />;
        }
        return filters.direction === 'asc' 
            ? <ArrowUp className="h-3 w-3 ml-1 text-[#2c4370]" />
            : <ArrowDown className="h-3 w-3 ml-1 text-[#2c4370]" />;
    };

    return (
        <>
            <Head title="HelpDesk HUV - Monitores" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader 
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Inicio</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">Inventario</span>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Monitores</span>
                        </div>
                    }
                />

                <main className="flex-1 px-6 py-6">
                    <div className="bg-white rounded-lg shadow">
                        {/* Header */}
                        <div className="px-6 py-4 border-b">
                            <div className="flex items-center justify-between">
                                <h1 className="text-xl font-semibold text-gray-900">Monitores</h1>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Buscar..."
                                            className="w-64 pr-10 h-9"
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
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`h-9 ${hasActiveFilters ? 'border-[#2c4370] text-[#2c4370]' : ''}`}
                                    >
                                        <Filter className="h-4 w-4 mr-1" />
                                        Filtros
                                        {hasActiveFilters && <span className="ml-1 bg-[#2c4370] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">!</span>}
                                    </Button>
                                    <Button 
                                        size="sm"
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-9"
                                        onClick={handleExport}
                                    >
                                        Exportar
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Panel de Filtros */}
                        {showFilters && (
                            <div className="px-6 py-4 bg-gray-50 border-b">
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Estado</label>
                                        <Select value={stateFilter} onValueChange={setStateFilter}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {states?.map((state) => (
                                                    <SelectItem key={state.id} value={state.id.toString()}>
                                                        {state.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Fabricante</label>
                                        <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {manufacturers?.map((manufacturer) => (
                                                    <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                                                        {manufacturer.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Tipo</label>
                                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {types?.map((type) => (
                                                    <SelectItem key={type.id} value={type.id.toString()}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Localización</label>
                                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Todas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                {locations?.map((location) => (
                                                    <SelectItem key={location.id} value={location.id.toString()}>
                                                        {location.completename}
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
                                <div className="flex justify-end gap-2 mt-3">
                                    {hasActiveFilters && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearFilters}
                                            className="h-8 text-xs text-gray-600"
                                        >
                                            <X className="h-3 w-3 mr-1" />
                                            Limpiar filtros
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={applyFilters}
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-8 text-xs"
                                    >
                                        Aplicar filtros
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">Mostrar</span>
                                <Select 
                                    value={filters.per_page.toString()}
                                    onValueChange={(value) => {
                                        router.get('/inventario/monitores', { 
                                            per_page: value,
                                            sort: filters.sort,
                                            direction: filters.direction,
                                            search: filters.search
                                        }, { preserveState: false })
                                    }}
                                >
                                    <SelectTrigger className="w-20 h-8">
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
                                <span className="text-sm text-gray-600">elementos</span>
                            </div>
                            <p className="text-sm text-gray-600">
                                Mostrando <span className="font-medium">{monitors.data.length}</span> de{' '}
                                <span className="font-medium">{monitors.total}</span> monitores
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
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('date_mod')}
                                        >
                                            <div className="flex items-center">
                                                Última actualización
                                                {getSortIcon('date_mod')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('otherserial')}
                                        >
                                            <div className="flex items-center">
                                                Nombre de usuario alternativo
                                                {getSortIcon('otherserial')}
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {monitors.data.map((monitor) => (
                                        <TableRow key={monitor.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-xs">
                                                <a href={`/inventario/monitores/${monitor.id}`} className="text-[#2c4370] hover:underline">
                                                    {monitor.name || '-'}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-xs">{monitor.entity_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{monitor.state_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{monitor.manufacturer_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{monitor.location_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{monitor.type_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{monitor.model_name || '-'}</TableCell>
                                            <TableCell className="text-xs">
                                                {monitor.date_mod ? new Date(monitor.date_mod).toLocaleString('es-CO', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}
                                            </TableCell>
                                            <TableCell className="text-xs">{monitor.otherserial || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Página <span className="font-medium">{monitors.current_page}</span> de{' '}
                                <span className="font-medium">{monitors.last_page}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {monitors.links.map((link, index) => {
                                    if (index === 0) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50"
                                                onClick={() => link.url && router.visit(link.url)}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    if (index === monitors.links.length - 1) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50"
                                                onClick={() => link.url && router.visit(link.url)}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    return (
                                        <Button
                                            key={index}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            disabled={!link.url}
                                            className={link.active 
                                                ? "bg-[#2c4370] hover:!bg-[#3d5583] text-white border-[#2c4370]" 
                                                : "border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white"}
                                            onClick={() => link.url && router.visit(link.url)}
                                        >
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
        </>
    );
}
