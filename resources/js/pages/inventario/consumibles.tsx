import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router, usePage, Link } from '@inertiajs/react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ChevronsUpDown, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import React from 'react';
import {
    InventoryFilterBar, PerPageSelect, parseSavedCriteria, createDefaultCriterion,
    type FilterCriterion, type FilterFieldDefinition,
} from '@/components/inventory-filter-bar';

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

interface PaginationLinks { url: string | null; label: string; active: boolean; }
interface ConsumableType { id: number; name: string; }
interface Manufacturer { id: number; name: string; }

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
        criteria: string;
    };
}

export default function Consumibles({ consumables, types, manufacturers, filters }: ConsumablesProps) {
    const { auth } = usePage().props as any;
    const isAdmin = auth?.user?.role === 'Administrador';
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [deleteModal, setDeleteModal] = React.useState<{ open: boolean, id: number | null, name: string }>({ open: false, id: null, name: '' });

    const filterFields: FilterFieldDefinition[] = React.useMemo(() => [
        { value: 'name', label: 'Nombre', type: 'text' as const },
        { value: 'entity_name', label: 'Entidad', type: 'text' as const },
        { value: 'ref', label: 'Referencia', type: 'text' as const },
        { value: 'manufacturer', label: 'Fabricante', type: 'select' as const, options: manufacturers?.map(m => ({ value: m.id.toString(), label: m.name })) || [] },
        { value: 'type', label: 'Tipo', type: 'select' as const, options: types?.map(t => ({ value: t.id.toString(), label: t.name })) || [] },
        { value: 'tech_name', label: 'Técnico a cargo', type: 'text' as const },
    ], [manufacturers, types]);

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
        router.get('/inventario/consumibles', buildFilterParams({ sort: field, direction: newDirection }), { preserveState: false });
    };

    const applyFilters = () => {
        const params: Record<string, any> = { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 };
        if (searchValue) params.search = searchValue;
        if (filterCriteria.length > 0) params.criteria = JSON.stringify(filterCriteria);
        router.get('/inventario/consumibles', params, { preserveState: false, replace: true });
    };

    const clearFilters = () => {
        setFilterCriteria([createDefaultCriterion(filterFields)]);
        setSearchValue('');
        router.get('/inventario/consumibles', { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 }, { preserveState: false, replace: true });
    };

    const handlePerPageChange = (value: string) => {
        router.get('/inventario/consumibles', buildFilterParams({ per_page: value, page: 1 }), { preserveState: false });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        params.append('sort', filters.sort); params.append('direction', filters.direction);
        if (filters.search) params.append('search', filters.search);
        if (filterCriteria.length > 0) params.append('criteria', JSON.stringify(filterCriteria));
        window.location.href = `/inventario/consumibles/export?${params}`;
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) return <ChevronsUpDown className="h-3 w-3 ml-1 text-gray-400" />;
        return filters.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-[#2c4370]" /> : <ArrowDown className="h-3 w-3 ml-1 text-[#2c4370]" />;
    };

    const confirmDelete = () => {
        if (deleteModal.id) router.delete(`/inventario/consumibles/${deleteModal.id}`);
        setDeleteModal({ open: false, id: null, name: '' });
    };

    return (
        <>
            <Head title="HelpDesk HUV - Consumibles" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/inventario/global" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inventario</Link>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">Consumibles</span>
                    </div>
                } />

                <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6">
                    <div className="bg-white shadow border border-gray-200">
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Consumibles</h1>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-9" onClick={handleExport}>
                                        <span className="hidden sm:inline">Exportar</span><span className="sm:hidden">Excel</span>
                                    </Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-9" onClick={() => router.visit('/inventario/consumibles/crear')}>
                                        <Plus className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Crear</span>
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
                                <span className="font-medium">{consumables.data.length}</span> de <span className="font-medium">{consumables.total}</span>
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}><div className="flex items-center">Nombre{getSortIcon('name')}</div></TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('entity_name')}><div className="flex items-center">Entidad{getSortIcon('entity_name')}</div></TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('ref')}><div className="flex items-center">Referencia{getSortIcon('ref')}</div></TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('type_name')}><div className="flex items-center">Tipo{getSortIcon('type_name')}</div></TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('manufacturer_name')}><div className="flex items-center">Fabricante{getSortIcon('manufacturer_name')}</div></TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('total')}><div className="flex items-center">Total{getSortIcon('total')}</div></TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('nuevo')}><div className="flex items-center">Nuevos{getSortIcon('nuevo')}</div></TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('usado')}><div className="flex items-center">Usados{getSortIcon('usado')}</div></TableHead>
                                        {isAdmin && <TableHead className="font-semibold text-gray-900 text-xs text-center">Acciones</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {consumables.data.map((c) => (
                                        <TableRow key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.visit(`/inventario/consumibles/${c.id}`)}>
                                            <TableCell className="font-medium text-xs text-[#2c4370] hover:underline">
                                                {c.name || '-'}
                                            </TableCell>
                                            <TableCell className="text-xs">{c.entity_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{c.ref || '-'}</TableCell>
                                            <TableCell className="text-xs">{c.type_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{c.manufacturer_name || '-'}</TableCell>
                                            <TableCell className="text-xs">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                    {c.total}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-green-600 font-medium">{c.nuevo}</TableCell>
                                            <TableCell className="text-xs text-blue-600 font-medium">{c.usado}</TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => router.visit(`/inventario/consumibles/${c.id}/editar`)} title="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => setDeleteModal({ open: true, id: c.id, name: c.name || '' })} title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">Página {consumables.current_page} de {consumables.last_page}</div>
                            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
                                {consumables.links.map((link: PaginationLinks, index: number) => {
                                    const isMobileVisible = index === 0 || index === consumables.links.length - 1 || link.active;
                                    if (index === 0) return <Button key={index} variant="outline" size="sm" disabled={!link.url} className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0" onClick={() => link.url && router.visit(link.url)}><ChevronLeft className="h-4 w-4" /></Button>;
                                    if (index === consumables.links.length - 1) return <Button key={index} variant="outline" size="sm" disabled={!link.url} className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0" onClick={() => link.url && router.visit(link.url)}><ChevronRight className="h-4 w-4" /></Button>;
                                    return <Button key={index} variant={link.active ? "default" : "outline"} size="sm" disabled={!link.url} className={`${!isMobileVisible ? 'hidden sm:inline-flex' : ''} h-8 min-w-[32px] px-2 text-xs sm:text-sm ${link.active ? "bg-[#2c4370] hover:!bg-[#3d5583] text-white border-[#2c4370]" : "border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white"}`} onClick={() => link.url && router.visit(link.url)}>{link.label}</Button>;
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
                            <DialogTitle>Eliminar Consumible</DialogTitle>
                        </div>
                        <DialogDescription className="pt-2">¿Está seguro de eliminar el consumible <span className="font-semibold text-gray-900">"{deleteModal.name}"</span>? Esta acción no se puede deshacer.</DialogDescription>
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
