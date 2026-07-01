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
import { ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, ChevronsUpDown, Filter, X, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
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
import { SearchableSelect } from '@/components/ui/searchable-select';
import AdvancedFilterBar, { FilterRow, FieldDef } from '@/components/AdvancedFilterBar';

interface Software {
    id: number;
    name: string;
    entity_name: string;
    manufacturer_name: string | null;
    num_versions: number;
    num_installations: number;
    num_licenses: number;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface Manufacturer {
    id: number;
    name: string;
}

interface SoftwaresProps {
    softwares: {
        data: Software[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLinks[];
    };
    manufacturers: Manufacturer[];
    filters: {
        per_page: number;
        sort: string;
        direction: string;
        search: string;
        manufacturer: string;
        advanced_filters: string;
    };
}

export default function Programas({ softwares, manufacturers, filters }: SoftwaresProps) {
    const { auth } = usePage().props as any;
    const isAdmin = auth?.user?.role === 'Administrador';
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [deleteModal, setDeleteModal] = React.useState<{ open: boolean, id: number | null, name: string }>({ open: false, id: null, name: '' });
    const [showFilters, setShowFilters] = React.useState(false);

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
    const [manufacturerFilter, setManufacturerFilter] = React.useState(filters.manufacturer || 'all');

    const hasActiveFilters = (manufacturerFilter && manufacturerFilter !== 'all') || advancedFilters.length > 0;

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: field,
            direction: newDirection
        };
        if (filters.search) params.search = filters.search;
        if (filters.manufacturer && filters.manufacturer !== 'all') params.manufacturer = filters.manufacturer;
        if (filters.advanced_filters) params.advanced_filters = filters.advanced_filters;
        router.get('/inventario/programas', params, { preserveState: false });
    };

    const handleSearch = () => {
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1
        };
        if (searchValue) params.search = searchValue;
        if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;
        if (filters.advanced_filters) params.advanced_filters = filters.advanced_filters;
        router.get('/inventario/programas', params, { preserveState: false });
    };

    const applyFilters = () => {
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1
        };
        if (searchValue) params.search = searchValue;
        if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;
        if (filters.advanced_filters) params.advanced_filters = filters.advanced_filters;
        router.get('/inventario/programas', params, { preserveState: false, replace: true });
    };

    const clearFilters = () => {
        setManufacturerFilter('all');
        setSearchValue('');
        setAdvancedFilters([]);
        router.get('/inventario/programas', {
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
        if (filters.manufacturer && filters.manufacturer !== 'all') params.append('manufacturer', filters.manufacturer);
        if (filters.advanced_filters) params.append('advanced_filters', filters.advanced_filters);
        window.location.href = `/inventario/programas/export?${params}`;
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
            router.delete(`/inventario/programas/${deleteModal.id}`);
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
        if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;
        router.get('/inventario/programas', params, { preserveState: false });
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
        if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;
        router.get('/inventario/programas', params, { preserveState: false });
    };

    // ─── Software Field Definitions for Advanced Filter ──────────────
    const SOFTWARE_FIELDS: FieldDef[] = [
        { key: 'nombre', label: 'Nombre', type: 'text' },
        { key: 'id', label: 'ID', type: 'number' },
        { key: 'entidad', label: 'Entidad', type: 'text' },
        { key: 'editor', label: 'Editor', type: 'select' },
    ];

    // ─── Select Options for Advanced Filter (catalog fields) ─────────
    const FILTER_SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
        editor: (manufacturers || []).filter(m => m.name).map(m => ({ value: m.name, label: m.name })),
    };

    return (
        <>
            <Head title="HelpDesk HUV - Programas" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                            <span className="text-gray-400">/</span>
                            <Link href="/inventario/global" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inventario</Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Programas</span>
                        </div>
                    }
                />

                <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6">
                    <div className="bg-white shadow border border-gray-200">
                        {/* Header */}
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Programas</h1>
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
                                            onClick={() => router.visit('/inventario/programas/crear')}
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
                            fields={SOFTWARE_FIELDS}
                            selectOptions={FILTER_SELECT_OPTIONS}
                            defaultFirstRow={{ field: 'nombre', operator: 'contiene', value: '' }}
                        />

                        {/* Panel de Filtros */}
                        {showFilters && (
                            <div className="px-6 py-4 bg-gray-50 border-b">
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                    <div>
                                        <label htmlFor="filtro-editor" className="text-xs text-gray-600 mb-1 block">Editor</label>
                                        <SearchableSelect
                                            id="filtro-editor"
                                            value={manufacturerFilter}
                                            onValueChange={setManufacturerFilter}
                                            options={[{ value: 'all', label: 'Todos' }, ...(manufacturers || []).map((manufacturer) => ({ value: manufacturer.id.toString(), label: manufacturer.name }))]}
                                            placeholder="Todos"
                                            triggerClassName="h-8 text-xs"
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
                                        router.get('/inventario/programas', { ...filters, per_page: value }, { preserveState: false })
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
                                <span className="font-medium">{softwares.data.length}</span> de{' '}
                                <span className="font-medium">{softwares.total}</span>
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
                                            aria-sort={filters.sort === 'manufacturer_name' ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            <button type="button" onClick={() => handleSort('manufacturer_name')} className="flex items-center w-full text-left cursor-pointer hover:text-[#2c4370]">
                                                Editor
                                                {getSortIcon('manufacturer_name')}
                                            </button>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs"
                                            aria-sort={filters.sort === 'num_versions' ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            <button type="button" onClick={() => handleSort('num_versions')} className="flex items-center w-full text-left cursor-pointer hover:text-[#2c4370]">
                                                Número de versiones
                                                {getSortIcon('num_versions')}
                                            </button>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs"
                                            aria-sort={filters.sort === 'num_installations' ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            <button type="button" onClick={() => handleSort('num_installations')} className="flex items-center w-full text-left cursor-pointer hover:text-[#2c4370]">
                                                Número de instalaciones
                                                {getSortIcon('num_installations')}
                                            </button>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs"
                                            aria-sort={filters.sort === 'num_licenses' ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            <button type="button" onClick={() => handleSort('num_licenses')} className="flex items-center w-full text-left cursor-pointer hover:text-[#2c4370]">
                                                Número de licencias
                                                {getSortIcon('num_licenses')}
                                            </button>
                                        </TableHead>
                                        {isAdmin && (
                                            <TableHead className="font-semibold text-gray-900 text-xs text-center">Acciones</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {softwares.data.map((software) => (
                                        <TableRow key={software.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-xs">
                                                <a href={`/inventario/programas/${software.id}`} className="text-[#2c4370] hover:underline">
                                                    {software.name || '-'}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-xs">{software.entity_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{software.manufacturer_name || '-'}</TableCell>
                                            <TableCell className="text-xs text-center">{software.num_versions || 0}</TableCell>
                                            <TableCell className="text-xs text-center">{software.num_installations || 0}</TableCell>
                                            <TableCell className="text-xs text-center">{software.num_licenses || 0}</TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => router.visit(`/inventario/programas/${software.id}/editar`)} title="Editar" aria-label="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => handleDelete(software.id, software.name || '')} title="Eliminar" aria-label="Eliminar"><Trash2 className="h-3.5 w-3.5" /></Button>
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
                                Página {softwares.current_page} de {softwares.last_page}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
                                {softwares.links.map((link: PaginationLinks, index: number) => {
                                    const isMobileVisible = index === 0 || index === softwares.links.length - 1 || link.active;
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
                                    if (index === softwares.links.length - 1) {
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
                            <DialogTitle>Eliminar Programa</DialogTitle>
                        </div>
                        <DialogDescription className="pt-2">¿Está seguro de eliminar el programa <span className="font-semibold text-gray-900">"{deleteModal.name}"</span>? Esta acción no se puede deshacer.</DialogDescription>
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
