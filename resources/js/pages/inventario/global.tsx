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

interface GlobalItem {
    name: string;
    entity_name: string;
    state_name: string | null;
    item_type: string;
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

interface GlobalInventoryProps {
    items: {
        data: GlobalItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLinks[];
    };
    states: State[];
    itemTypes: string[];
    filters: {
        per_page: number;
        sort: string;
        direction: string;
        search: string;
        state: string;
        item_type: string;
    };
}

export default function Global({ items, states, itemTypes, filters }: GlobalInventoryProps) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [showFilters, setShowFilters] = React.useState(false);
    
    const [stateFilter, setStateFilter] = React.useState(filters.state || 'all');
    const [itemTypeFilter, setItemTypeFilter] = React.useState(filters.item_type || 'all');
    
    const hasActiveFilters = (stateFilter && stateFilter !== 'all') || (itemTypeFilter && itemTypeFilter !== 'all');

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        const params: Record<string, any> = { per_page: filters.per_page, sort: field, direction: newDirection };
        if (filters.search) params.search = filters.search;
        if (filters.state && filters.state !== 'all') params.state = filters.state;
        if (filters.item_type && filters.item_type !== 'all') params.item_type = filters.item_type;
        router.get('/inventario/global', params, { preserveState: false });
    };

    const handleSearch = () => {
        const params: Record<string, any> = { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 };
        if (searchValue) params.search = searchValue;
        if (stateFilter && stateFilter !== 'all') params.state = stateFilter;
        if (itemTypeFilter && itemTypeFilter !== 'all') params.item_type = itemTypeFilter;
        router.get('/inventario/global', params, { preserveState: false });
    };

    const applyFilters = () => {
        const params: Record<string, any> = { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 };
        if (searchValue) params.search = searchValue;
        if (stateFilter && stateFilter !== 'all') params.state = stateFilter;
        if (itemTypeFilter && itemTypeFilter !== 'all') params.item_type = itemTypeFilter;
        router.get('/inventario/global', params, { preserveState: false, replace: true });
    };

    const clearFilters = () => {
        setStateFilter('all'); setItemTypeFilter('all'); setSearchValue('');
        router.get('/inventario/global', { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 }, { preserveState: false, replace: true });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        params.append('sort', filters.sort); params.append('direction', filters.direction);
        if (filters.search) params.append('search', filters.search);
        if (filters.state && filters.state !== 'all') params.append('state', filters.state);
        if (filters.item_type && filters.item_type !== 'all') params.append('item_type', filters.item_type);
        window.location.href = `/inventario/global/export?${params}`;
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
            <Head title="HelpDesk HUV - Inventario Global" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader 
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Inicio</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">Inventario</span>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Global</span>
                        </div>
                    }
                />

                <main className="flex-1 px-6 py-6">
                    <div className="bg-white rounded-lg shadow">
                        {/* Header */}
                        <div className="px-6 py-4 border-b">
                            <div className="flex items-center justify-between">
                                <h1 className="text-xl font-semibold text-gray-900">Inventario Global</h1>
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
                                        <label className="text-xs text-gray-600 mb-1 block">Tipo de elemento</label>
                                        <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {itemTypes?.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
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
                                        router.get('/inventario/global', { 
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
                                Mostrando <span className="font-medium">{items.data.length}</span> de{' '}
                                <span className="font-medium">{items.total}</span> elementos
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
                                            onClick={() => handleSort('item_type')}
                                        >
                                            <div className="flex items-center">
                                                Tipo de elemento
                                                {getSortIcon('item_type')}
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.data.map((item, index) => (
                                        <TableRow key={index} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-xs">
                                                {item.name || '-'}
                                            </TableCell>
                                            <TableCell className="text-xs">{item.entity_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{item.state_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{item.item_type || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Página <span className="font-medium">{items.current_page}</span> de{' '}
                                <span className="font-medium">{items.last_page}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {items.links.map((link: PaginationLinks, index: number) => {
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
                                    if (index === items.links.length - 1) {
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
