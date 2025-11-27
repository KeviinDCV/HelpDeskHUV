import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router, usePage } from '@inertiajs/react';
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

interface Consumable {
    id: number;
    name: string;
    entity_name: string;
    ref: string;
    type_name: string | null;
    manufacturer_name: string | null;
    total: number;
    nuevo: number;
    usado: number;
    comment: string;
    tech_name: string | null;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface ConsumableType {
    id: number;
    name: string;
}

interface Manufacturer {
    id: number;
    name: string;
}

interface ConsumablesProps {
    consumables: {
        data: Consumable[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLinks[];
    };
    types: ConsumableType[];
    manufacturers: Manufacturer[];
    filters: {
        per_page: number;
        sort: string;
        direction: string;
        search: string;
        type: string;
        manufacturer: string;
    };
}

export default function Consumibles({ consumables, types, manufacturers, filters }: ConsumablesProps) {
    const { auth } = usePage().props as any;
    const isAdmin = auth?.user?.role === 'Administrador';
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [deleteModal, setDeleteModal] = React.useState<{open: boolean, id: number | null, name: string}>({open: false, id: null, name: ''});
    const [showFilters, setShowFilters] = React.useState(false);
    
    const [typeFilter, setTypeFilter] = React.useState(filters.type || 'all');
    const [manufacturerFilter, setManufacturerFilter] = React.useState(filters.manufacturer || 'all');
    
    const hasActiveFilters = (typeFilter && typeFilter !== 'all') || (manufacturerFilter && manufacturerFilter !== 'all');

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        const params: Record<string, any> = { per_page: filters.per_page, sort: field, direction: newDirection };
        if (filters.search) params.search = filters.search;
        if (filters.type && filters.type !== 'all') params.type = filters.type;
        if (filters.manufacturer && filters.manufacturer !== 'all') params.manufacturer = filters.manufacturer;
        router.get('/inventario/consumibles', params, { preserveState: false });
    };

    const handleSearch = () => {
        const params: Record<string, any> = { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 };
        if (searchValue) params.search = searchValue;
        if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
        if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;
        router.get('/inventario/consumibles', params, { preserveState: false });
    };

    const applyFilters = () => {
        const params: Record<string, any> = { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 };
        if (searchValue) params.search = searchValue;
        if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
        if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;
        router.get('/inventario/consumibles', params, { preserveState: false, replace: true });
    };

    const clearFilters = () => {
        setTypeFilter('all'); setManufacturerFilter('all'); setSearchValue('');
        router.get('/inventario/consumibles', { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 }, { preserveState: false, replace: true });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        params.append('sort', filters.sort); params.append('direction', filters.direction);
        if (filters.search) params.append('search', filters.search);
        if (filters.type && filters.type !== 'all') params.append('type', filters.type);
        if (filters.manufacturer && filters.manufacturer !== 'all') params.append('manufacturer', filters.manufacturer);
        window.location.href = `/inventario/consumibles/export?${params}`;
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
            router.delete(`/inventario/consumibles/${deleteModal.id}`);
        }
        setDeleteModal({open: false, id: null, name: ''});
    };

    return (
        <>
            <Head title="HelpDesk HUV - Consumibles" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader 
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Inicio</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">Inventario</span>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Consumibles</span>
                        </div>
                    }
                />

                <main className="flex-1 px-6 py-6">
                    <div className="bg-white rounded-lg shadow">
                        {/* Header */}
                        <div className="px-6 py-4 border-b">
                            <div className="flex items-center justify-between">
                                <h1 className="text-xl font-semibold text-gray-900">Consumibles</h1>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Input type="text" placeholder="Buscar..." className="w-64 pr-10 h-9" value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} />
                                        <Button size="sm" variant="ghost" className="absolute right-0 top-0 h-full px-3" onClick={handleSearch}>
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                                        className={`h-9 ${hasActiveFilters ? 'border-[#2c4370] text-[#2c4370]' : ''}`}>
                                        <Filter className="h-4 w-4 mr-1" /> Filtros
                                        {hasActiveFilters && <span className="ml-1 bg-[#2c4370] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">!</span>}
                                    </Button>
                                    <Button size="sm" className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-9" onClick={handleExport}>Exportar</Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-9" onClick={() => router.visit('/inventario/consumibles/crear')}>
                                        <Plus className="h-4 w-4 mr-1" />Crear
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="px-6 py-4 bg-gray-50 border-b">
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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
                                        <label className="text-xs text-gray-600 mb-1 block">Fabricante</label>
                                        <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {manufacturers?.map((m) => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
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
                        <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">Mostrar</span>
                                <Select 
                                    value={filters.per_page.toString()}
                                    onValueChange={(value) => {
                                        router.get('/inventario/consumibles', { 
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
                                Mostrando <span className="font-medium">{consumables.data.length}</span> de{' '}
                                <span className="font-medium">{consumables.total}</span> consumibles
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
                                            onClick={() => handleSort('ref')}
                                        >
                                            <div className="flex items-center">
                                                Referencia
                                                {getSortIcon('ref')}
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
                                            onClick={() => handleSort('manufacturer_name')}
                                        >
                                            <div className="flex items-center">
                                                Fabricante
                                                {getSortIcon('manufacturer_name')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('total')}
                                        >
                                            <div className="flex items-center">
                                                Consumibles
                                                {getSortIcon('total')}
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs">
                                            Comentarios
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('tech_name')}
                                        >
                                            <div className="flex items-center">
                                                Técnico a cargo
                                                {getSortIcon('tech_name')}
                                            </div>
                                        </TableHead>
                                        {isAdmin && (<TableHead className="font-semibold text-gray-900 text-xs text-center">Acciones</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {consumables.data.map((consumable) => (
                                        <TableRow key={consumable.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-xs">
                                                <a href={`/inventario/consumibles/${consumable.id}`} className="text-[#2c4370] hover:underline">
                                                    {consumable.name || '-'}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-xs">{consumable.entity_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{consumable.ref || '-'}</TableCell>
                                            <TableCell className="text-xs">{consumable.type_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{consumable.manufacturer_name || '-'}</TableCell>
                                            <TableCell className="text-xs">
                                                Total: {consumable.total || 0}, Nuevo: {consumable.nuevo || 0}, Usado: {consumable.usado || 0}
                                            </TableCell>
                                            <TableCell className="text-xs truncate max-w-xs" title={consumable.comment || ''}>
                                                {consumable.comment || '-'}
                                            </TableCell>
                                            <TableCell className="text-xs">{consumable.tech_name || '-'}</TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => router.visit(`/inventario/consumibles/${consumable.id}/editar`)} title="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => handleDelete(consumable.id, consumable.name || '')} title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Página <span className="font-medium">{consumables.current_page}</span> de{' '}
                                <span className="font-medium">{consumables.last_page}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {consumables.links.map((link: PaginationLinks, index: number) => {
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
                                    if (index === consumables.links.length - 1) {
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

            <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({...deleteModal, open})}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
                            <DialogTitle>Eliminar Consumible</DialogTitle>
                        </div>
                        <DialogDescription className="pt-2">¿Está seguro de eliminar el consumible <span className="font-semibold text-gray-900">"{deleteModal.name}"</span>? Esta acción no se puede deshacer.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteModal({open: false, id: null, name: ''})}>Cancelar</Button>
                        <Button variant="destructive" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
