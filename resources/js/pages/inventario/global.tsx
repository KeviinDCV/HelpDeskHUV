import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router, Link } from '@inertiajs/react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import React from 'react';
import {
    InventoryFilterBar, PerPageSelect, parseSavedCriteria, createDefaultCriterion,
    type FilterCriterion, type FilterFieldDefinition,
} from '@/components/inventory-filter-bar';

interface GlobalItem {
    name: string;
    entity_name: string;
    state_name: string | null;
    item_type: string;
}

interface PaginationLinks { url: string | null; label: string; active: boolean; }
interface State { id: number; name: string; }

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
        criteria: string;
    };
}

export default function Global({ items, states, itemTypes, filters }: GlobalInventoryProps) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');

    const filterFields: FilterFieldDefinition[] = React.useMemo(() => [
        { value: 'name', label: 'Nombre', type: 'text' as const },
        { value: 'entity_name', label: 'Entidad', type: 'text' as const },
        { value: 'state', label: 'Estado', type: 'select' as const, options: states?.map(s => ({ value: s.id.toString(), label: s.name })) || [] },
        { value: 'item_type', label: 'Tipo de elemento', type: 'select' as const, options: itemTypes?.map(t => ({ value: t, label: t })) || [] },
    ], [states, itemTypes]);

    const initialCriteria = parseSavedCriteria(filters.criteria);
    const [filterCriteria, setFilterCriteria] = React.useState<FilterCriterion[]>(
        initialCriteria.length > 0 ? initialCriteria : [createDefaultCriterion(filterFields)]
    );

    const buildFilterParams = (overrides: Record<string, any> = {}): Record<string, any> => {
        const params: Record<string, any> = { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, ...overrides };
        if (searchValue) params.search = searchValue;
        if (filterCriteria.length > 0) params.criteria = JSON.stringify(filterCriteria);
        return params;
    };

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get('/inventario/global', buildFilterParams({ sort: field, direction: newDirection }), { preserveState: false });
    };

    const applyFilters = () => {
        const params: Record<string, any> = { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 };
        if (searchValue) params.search = searchValue;
        if (filterCriteria.length > 0) params.criteria = JSON.stringify(filterCriteria);
        router.get('/inventario/global', params, { preserveState: false, replace: true });
    };

    const clearFilters = () => {
        setFilterCriteria([createDefaultCriterion(filterFields)]);
        setSearchValue('');
        router.get('/inventario/global', { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 }, { preserveState: false, replace: true });
    };

    const handlePerPageChange = (value: string) => {
        router.get('/inventario/global', buildFilterParams({ per_page: value, page: 1 }), { preserveState: false });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        params.append('sort', filters.sort); params.append('direction', filters.direction);
        if (filters.search) params.append('search', filters.search);
        if (filterCriteria.length > 0) params.append('criteria', JSON.stringify(filterCriteria));
        window.location.href = `/inventario/global/export?${params}`;
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) return <ChevronsUpDown className="h-3 w-3 ml-1 text-gray-400" />;
        return filters.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-[#2c4370]" /> : <ArrowDown className="h-3 w-3 ml-1 text-[#2c4370]" />;
    };

    return (
        <>
            <Head title="HelpDesk HUV - Inventario Global" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/inventario/global" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inventario</Link>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">Global</span>
                    </div>
                } />

                <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6">
                    <div className="bg-white shadow border border-gray-200">
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Inventario Global</h1>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-9" onClick={handleExport}>
                                        <span className="hidden sm:inline">Exportar</span><span className="sm:hidden">Excel</span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <InventoryFilterBar fields={filterFields} criteria={filterCriteria} onCriteriaChange={setFilterCriteria} onApply={applyFilters} onReset={clearFilters} />

                        <div className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-50 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xs sm:text-sm text-gray-600">Mostrar</span>
                                <PerPageSelect value={filters.per_page.toString()} onChange={handlePerPageChange} />
                                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">elementos</span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">
                                <span className="font-medium">{items.data.length}</span> de <span className="font-medium">{items.total}</span>
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}><div className="flex items-center">Nombre{getSortIcon('name')}</div></TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('entity_name')}><div className="flex items-center">Entidad{getSortIcon('entity_name')}</div></TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('state_name')}><div className="flex items-center">Estado{getSortIcon('state_name')}</div></TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('item_type')}><div className="flex items-center">Tipo de elemento{getSortIcon('item_type')}</div></TableHead>
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

                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">Página {items.current_page} de {items.last_page}</div>
                            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
                                {items.links.map((link: PaginationLinks, index: number) => {
                                    const isMobileVisible = index === 0 || index === items.links.length - 1 || link.active;
                                    if (index === 0) return <Button key={index} variant="outline" size="sm" disabled={!link.url} className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0" onClick={() => link.url && router.visit(link.url)}><ChevronLeft className="h-4 w-4" /></Button>;
                                    if (index === items.links.length - 1) return <Button key={index} variant="outline" size="sm" disabled={!link.url} className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0" onClick={() => link.url && router.visit(link.url)}><ChevronRight className="h-4 w-4" /></Button>;
                                    return <Button key={index} variant={link.active ? "default" : "outline"} size="sm" disabled={!link.url} className={`${!isMobileVisible ? 'hidden sm:inline-flex' : ''} h-8 min-w-[32px] px-2 text-xs sm:text-sm ${link.active ? "bg-[#2c4370] hover:!bg-[#3d5583] text-white border-[#2c4370]" : "border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white"}`} onClick={() => link.url && router.visit(link.url)}>{link.label}</Button>;
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
