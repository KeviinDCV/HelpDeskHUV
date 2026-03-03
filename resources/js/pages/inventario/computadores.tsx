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
import { ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, ChevronsUpDown, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import React from 'react';
import {
    InventoryFilterBar,
    PerPageSelect,
    parseSavedCriteria,
    createDefaultCriterion,
    type FilterCriterion,
    type FilterFieldDefinition,
} from '@/components/inventory-filter-bar';

interface Computer {
    id: number;
    name: string;
    entity_name: string | null;
    state_name: string | null;
    manufacturer_name: string | null;
    serial: string | null;
    type_name: string | null;
    model_name: string | null;
    location_name: string | null;
    date_mod: string | null;
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

interface ComputerType {
    id: number;
    name: string;
}

interface Location {
    id: number;
    name: string;
    completename: string;
}

interface ComputersProps {
    computers: {
        data: Computer[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLinks[];
    };
    states: State[];
    manufacturers: Manufacturer[];
    types: ComputerType[];
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
        criteria: string;
    };
}

export default function Computadores({ computers, states, manufacturers, types, locations, filters }: ComputersProps) {
    const { auth } = usePage().props as any;
    const isAdmin = auth?.user?.role === 'Administrador';
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [deleteModal, setDeleteModal] = React.useState<{ open: boolean, id: number | null, name: string }>({ open: false, id: null, name: '' });

    // Build filter field definitions from server-provided data
    const filterFields: FilterFieldDefinition[] = React.useMemo(() => [
        { value: 'name', label: 'Nombre', type: 'text' as const },
        { value: 'entity_name', label: 'Entidad', type: 'text' as const },
        { value: 'state', label: 'Estado', type: 'select' as const, options: states?.map(s => ({ value: s.id.toString(), label: s.name })) || [] },
        { value: 'manufacturer', label: 'Fabricante', type: 'select' as const, options: manufacturers?.map(m => ({ value: m.id.toString(), label: m.name })) || [] },
        { value: 'serial', label: 'Número de serie', type: 'text' as const },
        { value: 'type', label: 'Tipo', type: 'select' as const, options: types?.map(t => ({ value: t.id.toString(), label: t.name })) || [] },
        { value: 'model_name', label: 'Modelo', type: 'text' as const },
        { value: 'location', label: 'Localización', type: 'select' as const, options: locations?.map(l => ({ value: l.id.toString(), label: l.completename })) || [] },
        { value: 'date_mod', label: 'Última actualización', type: 'date' as const },
    ], [states, manufacturers, types, locations]);

    // Initialize criteria from URL or default
    const initialCriteria = parseSavedCriteria(filters.criteria);
    const [filterCriteria, setFilterCriteria] = React.useState<FilterCriterion[]>(
        initialCriteria.length > 0 ? initialCriteria : [createDefaultCriterion(filterFields)]
    );

    // Build params helper
    const buildFilterParams = (overrides: Record<string, any> = {}): Record<string, any> => {
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            ...overrides,
        };
        if (searchValue) params.search = searchValue;
        if (filterCriteria.length > 0) params.criteria = JSON.stringify(filterCriteria);
        return params;
    };

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        const params = buildFilterParams({ sort: field, direction: newDirection });
        router.get('/inventario/computadores', params, { preserveState: false });
    };

    const handleSearch = () => {
        const params = buildFilterParams({ page: 1 });
        router.get('/inventario/computadores', params, { preserveState: false });
    };

    const applyFilters = () => {
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1,
        };
        if (searchValue) params.search = searchValue;
        if (filterCriteria.length > 0) params.criteria = JSON.stringify(filterCriteria);
        router.get('/inventario/computadores', params, { preserveState: false, replace: true });
    };

    const clearFilters = () => {
        const defaultCriteria = [createDefaultCriterion(filterFields)];
        setFilterCriteria(defaultCriteria);
        setSearchValue('');
        router.get('/inventario/computadores', {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1,
        }, { preserveState: false, replace: true });
    };

    const handlePerPageChange = (value: string) => {
        const params = buildFilterParams({ per_page: value, page: 1 });
        router.get('/inventario/computadores', params, { preserveState: false });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        params.append('sort', filters.sort);
        params.append('direction', filters.direction);
        if (filters.search) params.append('search', filters.search);
        if (filterCriteria.length > 0) params.append('criteria', JSON.stringify(filterCriteria));
        window.location.href = `/inventario/computadores/export?${params}`;
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
        setDeleteModal({ open: true, id, name });
    };

    const confirmDelete = () => {
        if (deleteModal.id) {
            router.delete(`/inventario/computadores/${deleteModal.id}`);
        }
        setDeleteModal({ open: false, id: null, name: '' });
    };

    return (
        <>
            <Head title="HelpDesk HUV - Computadores" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                            <span className="text-gray-400">/</span>
                            <Link href="/inventario/global" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inventario</Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Computadores</span>
                        </div>
                    }
                />

                <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6">
                    <div className="bg-white shadow border border-gray-200">
                        {/* Header */}
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Computadores</h1>
                                <div className="flex items-center gap-2">
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
                                        onClick={() => router.visit('/inventario/computadores/crear')}
                                    >
                                        <Plus className="h-4 w-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Crear</span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* GLPI-style Filter Bar */}
                        <InventoryFilterBar
                            fields={filterFields}
                            criteria={filterCriteria}
                            onCriteriaChange={setFilterCriteria}
                            onApply={applyFilters}
                            onReset={clearFilters}
                        />

                        {/* Stats */}
                        <div className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-50 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xs sm:text-sm text-gray-600">Mostrar</span>
                                <PerPageSelect
                                    value={filters.per_page.toString()}
                                    onChange={handlePerPageChange}
                                />
                                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">elementos</span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">
                                <span className="font-medium">{computers.data.length}</span> de{' '}
                                <span className="font-medium">{computers.total}</span> <span className="hidden sm:inline">computadores</span>
                            </p>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                                            <div className="flex items-center">Nombre{getSortIcon('name')}</div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('entity_name')}>
                                            <div className="flex items-center">Entidad{getSortIcon('entity_name')}</div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('state_name')}>
                                            <div className="flex items-center">Estado{getSortIcon('state_name')}</div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('manufacturer_name')}>
                                            <div className="flex items-center">Fabricante{getSortIcon('manufacturer_name')}</div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('serial')}>
                                            <div className="flex items-center">Número de serie{getSortIcon('serial')}</div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('type_name')}>
                                            <div className="flex items-center">Tipo{getSortIcon('type_name')}</div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('model_name')}>
                                            <div className="flex items-center">Modelo{getSortIcon('model_name')}</div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('location_name')}>
                                            <div className="flex items-center">Localización{getSortIcon('location_name')}</div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date_mod')}>
                                            <div className="flex items-center">Última actualización{getSortIcon('date_mod')}</div>
                                        </TableHead>
                                        {isAdmin && (<TableHead className="font-semibold text-gray-900 text-xs text-center">Acciones</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {computers.data.map((computer) => (
                                        <TableRow key={computer.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-xs">
                                                <a href={`/inventario/computadores/${computer.id}`} className="text-[#2c4370] hover:underline">
                                                    {computer.name || '-'}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-xs">{computer.entity_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{computer.state_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{computer.manufacturer_name || '-'}</TableCell>
                                            <TableCell className="font-mono text-xs">{computer.serial || '-'}</TableCell>
                                            <TableCell className="text-xs">{computer.type_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{computer.model_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{computer.location_name || '-'}</TableCell>
                                            <TableCell className="text-xs text-gray-600">
                                                {computer.date_mod
                                                    ? new Date(computer.date_mod).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                                                    : '-'
                                                }
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => router.visit(`/inventario/computadores/${computer.id}/editar`)} title="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => handleDelete(computer.id, computer.name || '')} title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></Button>
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
                                Página {computers.current_page} de {computers.last_page}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
                                {computers.links.map((link, index) => {
                                    const isMobileVisible = index === 0 || index === computers.links.length - 1 || link.active;
                                    if (index === 0) {
                                        return (
                                            <Button key={index} variant="outline" size="sm" disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0"
                                                onClick={() => link.url && router.visit(link.url)}>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    if (index === computers.links.length - 1) {
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

            {/* Modal de confirmación de eliminación */}
            <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
                            <DialogTitle>Eliminar Computador</DialogTitle>
                        </div>
                        <DialogDescription className="pt-2">¿Está seguro de eliminar el computador <span className="font-semibold text-gray-900">"{deleteModal.name}"</span>? Esta acción no se puede deshacer.</DialogDescription>
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
