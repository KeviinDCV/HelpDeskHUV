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
import { ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, ChevronsUpDown, Filter, X, Plus, Pencil, Trash2, AlertTriangle, Wifi, Network } from 'lucide-react';
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
import AdvancedFilterBar, { FilterRow, FieldDef } from '@/components/AdvancedFilterBar';

interface NetworkEquipment {
    id: number;
    name: string;
    entity_name: string;
    state_name: string | null;
    manufacturer_name: string | null;
    location_name: string | null;
    type_name: string | null;
    model_name: string | null;
    date_mod: string;
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

interface NetworkEquipmentType {
    id: number;
    name: string;
}

interface Location {
    id: number;
    name: string;
    completename: string;
}

interface NetworkEquipmentsProps {
    networkequipments: {
        data: NetworkEquipment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLinks[];
    };
    states: State[];
    manufacturers: Manufacturer[];
    types: NetworkEquipmentType[];
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
        advanced_filters: string;
        device_category: string;
    };
}

export default function DispositivosRed({ networkequipments, states, manufacturers, types, locations, filters }: NetworkEquipmentsProps) {
    const { auth } = usePage().props as any;
    const isAdmin = auth?.user?.role === 'Administrador';
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [deleteModal, setDeleteModal] = React.useState<{ open: boolean, id: number | null, name: string }>({ open: false, id: null, name: '' });
    const [showFilters, setShowFilters] = React.useState(false);
    const [deviceCategory, setDeviceCategory] = React.useState(filters.device_category || 'all');

    // Filtros avanzados
    const [advancedFilters, setAdvancedFilters] = React.useState<FilterRow[]>(() => {
        if (filters.advanced_filters) {
            try {
                const parsed = JSON.parse(filters.advanced_filters);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) {}
        }
        return [];
    });

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
        dateFrom || dateTo || advancedFilters.length > 0;

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
        if (filters.advanced_filters) params.advanced_filters = filters.advanced_filters;
        if (filters.device_category && filters.device_category !== 'all') params.device_category = filters.device_category;
        router.get('/inventario/dispositivos-red', params, { preserveState: false });
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
        if (filters.advanced_filters) params.advanced_filters = filters.advanced_filters;
        if (deviceCategory && deviceCategory !== 'all') params.device_category = deviceCategory;
        router.get('/inventario/dispositivos-red', params, { preserveState: false });
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
        if (filters.advanced_filters) params.advanced_filters = filters.advanced_filters;
        if (deviceCategory && deviceCategory !== 'all') params.device_category = deviceCategory;
        router.get('/inventario/dispositivos-red', params, { preserveState: false, replace: true });
    };

    const clearFilters = () => {
        setStateFilter('all');
        setManufacturerFilter('all');
        setTypeFilter('all');
        setLocationFilter('all');
        setDateFrom('');
        setDateTo('');
        setSearchValue('');
        setAdvancedFilters([]);
        router.get('/inventario/dispositivos-red', {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1,
            device_category: deviceCategory !== 'all' ? deviceCategory : undefined
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
        if (filters.advanced_filters) params.append('advanced_filters', filters.advanced_filters);
        if (filters.device_category && filters.device_category !== 'all') params.append('device_category', filters.device_category);
        window.location.href = `/inventario/dispositivos-red/export?${params}`;
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) {
            return <ChevronsUpDown className="h-3 w-3 ml-1 text-gray-500" />;
        }
        return filters.direction === 'asc'
            ? <ArrowUp className="h-3 w-3 ml-1 text-[#2c4370]" />
            : <ArrowDown className="h-3 w-3 ml-1 text-[#2c4370]" />;
    };

    const handleDelete = (id: number, name: string) => {
        setDeleteModal({ open: true, id, name });
    };

    const confirmDelete = () => {
        if (deleteModal.id) {
            router.delete(`/inventario/dispositivos-red/${deleteModal.id}`);
        }
        setDeleteModal({ open: false, id: null, name: '' });
    };

    // ─── Advanced Filter Handlers ────────────────────────────────────
    const handleAdvancedSearch = (filterRows: FilterRow[]) => {
        setAdvancedFilters(filterRows);
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1,
            advanced_filters: JSON.stringify(filterRows),
        };
        if (searchValue) params.search = searchValue;
        if (stateFilter && stateFilter !== 'all') params.state = stateFilter;
        if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;
        if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
        if (locationFilter && locationFilter !== 'all') params.location = locationFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (deviceCategory && deviceCategory !== 'all') params.device_category = deviceCategory;
        router.get('/inventario/dispositivos-red', params, { preserveState: false });
    };

    const handleAdvancedReset = () => {
        setAdvancedFilters([]);
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1,
        };
        if (searchValue) params.search = searchValue;
        if (stateFilter && stateFilter !== 'all') params.state = stateFilter;
        if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;
        if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
        if (locationFilter && locationFilter !== 'all') params.location = locationFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (deviceCategory && deviceCategory !== 'all') params.device_category = deviceCategory;
        router.get('/inventario/dispositivos-red', params, { preserveState: false });
    };

    // ─── Network Equipment Field Definitions for Advanced Filter ─────
    const NETWORK_EQUIPMENT_FIELDS: FieldDef[] = [
        { key: 'nombre', label: 'Nombre', type: 'text' },
        { key: 'id', label: 'ID', type: 'number' },
        { key: 'entidad', label: 'Entidad', type: 'text' },
        { key: 'estado', label: 'Estado', type: 'select' },
        { key: 'fabricante', label: 'Fabricante', type: 'select' },
        { key: 'localizacion', label: 'Localización', type: 'select' },
        { key: 'tipo', label: 'Tipo', type: 'select' },
        { key: 'modelo', label: 'Modelo', type: 'text' },
        { key: 'fecha_mod', label: 'Última actualización', type: 'date' },
    ];

    // Opciones de catálogos para el filtro avanzado (value = nombre, para comparación por texto en backend)
    const FILTER_SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
        estado: (states || []).filter(s => s.name).map(s => ({ value: s.name, label: s.name })),
        fabricante: (manufacturers || []).filter(m => m.name).map(m => ({ value: m.name, label: m.name })),
        tipo: (types || []).filter(t => t.name).map(t => ({ value: t.name, label: t.name })),
        localizacion: (locations || []).map(l => ({ value: (l.completename || l.name), label: (l.completename || l.name) })),
    };

    return (
        <>
            <Head title="HelpDesk HUV - Dispositivos de Red" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                            <span className="text-gray-400">/</span>
                            <Link href="/inventario/global" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inventario</Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Dispositivos de Red</span>
                        </div>
                    }
                />

                <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6">
                    {/* Category Filter - Always Visible */}
                    <div className="mb-4 flex items-center gap-2">
                        {[
                            { key: 'all', label: 'Todos', icon: null },
                            { key: 'switches', label: 'Switches', icon: <Network className="h-4 w-4" /> },
                            { key: 'wifi', label: 'Platos WiFi', icon: <Wifi className="h-4 w-4" /> },
                        ].map((cat) => (
                            <button
                                key={cat.key}
                                onClick={() => {
                                    setDeviceCategory(cat.key);
                                    const params: Record<string, any> = {
                                        per_page: filters.per_page,
                                        sort: filters.sort,
                                        direction: filters.direction,
                                        page: 1,
                                        device_category: cat.key,
                                    };
                                    if (searchValue) params.search = searchValue;
                                    if (stateFilter && stateFilter !== 'all') params.state = stateFilter;
                                    if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;
                                    if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
                                    if (locationFilter && locationFilter !== 'all') params.location = locationFilter;
                                    if (dateFrom) params.date_from = dateFrom;
                                    if (dateTo) params.date_to = dateTo;
                                    if (filters.advanced_filters) params.advanced_filters = filters.advanced_filters;
                                    router.get('/inventario/dispositivos-red', params, { preserveState: false });
                                }}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    deviceCategory === cat.key
                                        ? 'bg-[#2c4370] text-white shadow-sm'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {cat.icon}
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white shadow border border-gray-200">
                        {/* Header */}
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Dispositivos de Red</h1>
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
                                            aria-label="Buscar"
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
                                            onClick={handleExport}
                                        >
                                            <span className="hidden sm:inline">Exportar</span>
                                            <span className="sm:hidden">Excel</span>
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white h-9 flex-1 sm:flex-initial"
                                            onClick={() => router.visit('/inventario/dispositivos-red/crear')}
                                        >
                                            <Plus className="h-4 w-4 sm:mr-1" />
                                            <span className="hidden sm:inline">Crear</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Filter Bar */}
                        <AdvancedFilterBar
                            initialFilters={advancedFilters.length > 0 ? advancedFilters : undefined}
                            onSearch={handleAdvancedSearch}
                            onReset={handleAdvancedReset}
                            fields={NETWORK_EQUIPMENT_FIELDS}
                            selectOptions={FILTER_SELECT_OPTIONS}
                            defaultFirstRow={{ field: 'nombre', operator: 'contiene', value: '' }}
                        />

                        {/* Panel de Filtros */}
                        {showFilters && (
                            <div className="px-6 py-4 bg-gray-50 border-b">
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                    <div>
                                        <label htmlFor="filtro-estado" className="text-xs text-gray-600 mb-1 block">Estado</label>
                                        <Select value={stateFilter} onValueChange={setStateFilter}>
                                            <SelectTrigger id="filtro-estado" className="h-8 text-xs">
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
                                        <label htmlFor="filtro-fabricante" className="text-xs text-gray-600 mb-1 block">Fabricante</label>
                                        <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                                            <SelectTrigger id="filtro-fabricante" className="h-8 text-xs">
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
                                        <label htmlFor="filtro-tipo" className="text-xs text-gray-600 mb-1 block">Tipo</label>
                                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                                            <SelectTrigger id="filtro-tipo" className="h-8 text-xs">
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
                                        <label htmlFor="filtro-localizacion" className="text-xs text-gray-600 mb-1 block">Localización</label>
                                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                                            <SelectTrigger id="filtro-localizacion" className="h-8 text-xs">
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
                                        <label htmlFor="filtro-desde" className="text-xs text-gray-600 mb-1 block">Desde</label>
                                        <Input
                                            id="filtro-desde"
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="filtro-hasta" className="text-xs text-gray-600 mb-1 block">Hasta</label>
                                        <Input
                                            id="filtro-hasta"
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
                        <div className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-50 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xs sm:text-sm text-gray-600">Mostrar</span>
                                <Select
                                    value={filters.per_page.toString()}
                                    onValueChange={(value) => {
                                        router.get('/inventario/dispositivos-red', { ...filters, per_page: value }, { preserveState: false })
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
                                        <SelectItem value="500">500</SelectItem>
                                        <SelectItem value="1000">1.000</SelectItem>
                                        <SelectItem value="5000">5.000</SelectItem>
                                        <SelectItem value="10000">10.000</SelectItem>
                                        <SelectItem value="50000">50.000</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">elementos</span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">
                                <span className="font-medium">{networkequipments.data.length}</span> de{' '}
                                <span className="font-medium">{networkequipments.total}</span>
                            </p>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs"
                                            aria-sort={filters.sort === 'name' ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            <button type="button" onClick={() => handleSort('name')} className="flex items-center w-full text-left cursor-pointer hover:text-[#2c4370]">
                                                Nombre
                                                {getSortIcon('name')}
                                            </button>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs"
                                            aria-sort={filters.sort === 'entity_name' ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            <button type="button" onClick={() => handleSort('entity_name')} className="flex items-center w-full text-left cursor-pointer hover:text-[#2c4370]">
                                                Entidad
                                                {getSortIcon('entity_name')}
                                            </button>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs"
                                            aria-sort={filters.sort === 'state_name' ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            <button type="button" onClick={() => handleSort('state_name')} className="flex items-center w-full text-left cursor-pointer hover:text-[#2c4370]">
                                                Estado
                                                {getSortIcon('state_name')}
                                            </button>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs"
                                            aria-sort={filters.sort === 'manufacturer_name' ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            <button type="button" onClick={() => handleSort('manufacturer_name')} className="flex items-center w-full text-left cursor-pointer hover:text-[#2c4370]">
                                                Fabricante
                                                {getSortIcon('manufacturer_name')}
                                            </button>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs"
                                            aria-sort={filters.sort === 'location_name' ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            <button type="button" onClick={() => handleSort('location_name')} className="flex items-center w-full text-left cursor-pointer hover:text-[#2c4370]">
                                                Localización
                                                {getSortIcon('location_name')}
                                            </button>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs"
                                            aria-sort={filters.sort === 'type_name' ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            <button type="button" onClick={() => handleSort('type_name')} className="flex items-center w-full text-left cursor-pointer hover:text-[#2c4370]">
                                                Tipo
                                                {getSortIcon('type_name')}
                                            </button>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs"
                                            aria-sort={filters.sort === 'model_name' ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            <button type="button" onClick={() => handleSort('model_name')} className="flex items-center w-full text-left cursor-pointer hover:text-[#2c4370]">
                                                Modelo
                                                {getSortIcon('model_name')}
                                            </button>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs"
                                            aria-sort={filters.sort === 'date_mod' ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            <button type="button" onClick={() => handleSort('date_mod')} className="flex items-center w-full text-left cursor-pointer hover:text-[#2c4370]">
                                                Última actualización
                                                {getSortIcon('date_mod')}
                                            </button>
                                        </TableHead>
                                        {isAdmin && (<TableHead className="font-semibold text-gray-900 text-xs text-center">Acciones</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {networkequipments.data.map((equipment) => (
                                        <TableRow key={equipment.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-xs">
                                                <a href={`/inventario/dispositivos-red/${equipment.id}`} className="text-[#2c4370] hover:underline">
                                                    {equipment.name || '-'}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-xs">{equipment.entity_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{equipment.state_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{equipment.manufacturer_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{equipment.location_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{equipment.type_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{equipment.model_name || '-'}</TableCell>
                                            <TableCell className="text-xs">
                                                {equipment.date_mod ? new Date(equipment.date_mod).toLocaleString('es-CO', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => router.visit(`/inventario/dispositivos-red/${equipment.id}/editar`)} title="Editar" aria-label="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => handleDelete(equipment.id, equipment.name || '')} title="Eliminar" aria-label="Eliminar"><Trash2 className="h-3.5 w-3.5" /></Button>
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
                                Página {networkequipments.current_page} de {networkequipments.last_page}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
                                {networkequipments.links.map((link: PaginationLinks, index: number) => {
                                    const isMobileVisible = index === 0 || index === networkequipments.links.length - 1 || link.active;
                                    if (index === 0) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                aria-label="Página anterior"
                                                disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0"
                                                onClick={() => link.url && router.visit(link.url)}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    if (index === networkequipments.links.length - 1) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                aria-label="Página siguiente"
                                                disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0"
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
                                            className={`${!isMobileVisible ? 'hidden sm:inline-flex' : ''} h-8 min-w-[32px] px-2 text-xs sm:text-sm ${link.active
                                                ? "bg-[#2c4370] hover:!bg-[#3d5583] text-white border-[#2c4370]"
                                                : "border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white"}`}
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

            <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
                            <DialogTitle>Eliminar Dispositivo de Red</DialogTitle>
                        </div>
                        <DialogDescription className="pt-2">¿Está seguro de eliminar el dispositivo <span className="font-semibold text-gray-900">"{deleteModal.name}"</span>? Esta acción no se puede deshacer.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteModal({ open: false, id: null, name: '' })}>Cancelar</Button>
                        <Button variant="destructive" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
