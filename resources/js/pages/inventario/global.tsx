import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router, Link } from '@inertiajs/react';
import AdvancedFilterBar, { FilterRow, FieldDef, activeFilterRows } from '@/components/AdvancedFilterBar';
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
import { SearchableSelect } from '@/components/ui/searchable-select';

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
        advanced_filters: string;
    };
}

export default function Global({ items, states, itemTypes, filters }: GlobalInventoryProps) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [showFilters, setShowFilters] = React.useState(false);

    const [stateFilter, setStateFilter] = React.useState(filters.state || 'all');
    const [itemTypeFilter, setItemTypeFilter] = React.useState(filters.item_type || 'all');

    const [advancedFilters, setAdvancedFilters] = React.useState<FilterRow[]>(() => {
        try { return filters.advanced_filters ? JSON.parse(filters.advanced_filters) : []; } catch { return []; }
    });

    const hasActiveFilters = (stateFilter && stateFilter !== 'all') || (itemTypeFilter && itemTypeFilter !== 'all') || advancedFilters.length > 0;

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        const params: Record<string, any> = { per_page: filters.per_page, sort: field, direction: newDirection };
        if (filters.search) params.search = filters.search;
        if (filters.state && filters.state !== 'all') params.state = filters.state;
        if (filters.item_type && filters.item_type !== 'all') params.item_type = filters.item_type;
        if (filters.advanced_filters) params.advanced_filters = filters.advanced_filters;
        router.get('/inventario/global', params, { preserveState: false });
    };

    /**
     * Junta TODOS los filtros activos en un solo juego de parámetros.
     *
     * La pantalla tiene dos zonas de filtrado —la barra avanzada de arriba y el panel
     * "Filtros"— y cada acción construía su propia lista a mano. Se olvidaban la de la otra
     * zona, así que aplicar unos borraba los otros en silencio: ponías Estado y Tipo de
     * elemento en el panel, usabas "Buscar" arriba, y volvías con solo el filtro de arriba.
     *
     * Ahora toda acción parte de aquí y solo sobrescribe lo suyo, así que ninguna puede
     * descartar lo que el usuario configuró en la otra zona. Mismo patrón que casos.tsx.
     */
    const buildParams = (overrides: Record<string, any> = {}): Record<string, any> => {
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1,
        };

        // Panel "Filtros" (básicos)
        if (searchValue) params.search = searchValue;
        if (stateFilter && stateFilter !== 'all') params.state = stateFilter;
        if (itemTypeFilter && itemTypeFilter !== 'all') params.item_type = itemTypeFilter;

        // Barra avanzada. Se podan las filas sin valor: el backend las traduciría a
        // `columna = ''` y devolvería cero resultados sin decir por qué.
        const avanzados = activeFilterRows(advancedFilters);
        if (avanzados.length > 0) params.advanced_filters = JSON.stringify(avanzados);

        return { ...params, ...overrides };
    };

    const go = (params: Record<string, any>) => {
        // Se descartan las claves en undefined para que un override pueda QUITAR un filtro
        // (p. ej. "Restablecer" de la barra avanzada) sin depender de cómo serialice Inertia.
        const limpios = Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
        );
        router.get('/inventario/global', limpios, {
            preserveState: false,
            preserveScroll: false,
            replace: true,
        });
    };

    const handleSearch = () => go(buildParams());

    const applyFilters = () => go(buildParams());

    /** "Limpiar filtros": vacía SOLO el panel de filtros; la barra avanzada se respeta. */
    const clearFilters = () => {
        setStateFilter('all');
        setItemTypeFilter('all');
        setSearchValue('');

        const avanzados = activeFilterRows(advancedFilters);
        go({
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1,
            ...(avanzados.length > 0 ? { advanced_filters: JSON.stringify(avanzados) } : {}),
        });
    };

    /**
     * Exporta exactamente lo que el usuario tiene filtrado, de las DOS zonas.
     *
     * Usa el mismo buildParams() que "Aplicar filtros" y "Buscar", así que el Excel no puede
     * volver a quedarse a medias: antes leía solo los filtros ya aplicados en el servidor, de
     * modo que lo configurado en el panel sin haber pulsado "Aplicar" no llegaba a la
     * exportación. `page` y `per_page` no aplican a un export: se descartan.
     */
    const handleExport = () => {
        const { page: _p, per_page: _pp, ...exportables } = buildParams();
        const params = new URLSearchParams(
            Object.entries(exportables).map(([k, v]) => [k, String(v)])
        );
        window.location.href = `/inventario/global/export?${params}`;
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) {
            return <ChevronsUpDown className="h-3 w-3 ml-1 text-gray-500" />;
        }
        return filters.direction === 'asc'
            ? <ArrowUp className="h-3 w-3 ml-1 text-[#2c4370]" />
            : <ArrowDown className="h-3 w-3 ml-1 text-[#2c4370]" />;
    };

    /** "Buscar" de la barra avanzada: aplica sus filas SIN tocar el panel de filtros. */
    const handleAdvancedSearch = (rows: FilterRow[]) => {
        setAdvancedFilters(rows);

        const avanzados = activeFilterRows(rows);
        go(buildParams(
            avanzados.length > 0
                ? { advanced_filters: JSON.stringify(avanzados) }
                : { advanced_filters: undefined }
        ));
    };

    /** "Restablecer" de la barra avanzada: vacía SOLO sus filas; el panel se respeta. */
    const handleAdvancedReset = () => {
        setAdvancedFilters([]);
        go(buildParams({ advanced_filters: undefined }));
    };

    const GLOBAL_FIELDS: FieldDef[] = [
        { key: 'nombre', label: 'Nombre', type: 'text' },
        { key: 'entidad', label: 'Entidad', type: 'text' },
        { key: 'estado', label: 'Estado', type: 'select' },
        { key: 'tipo_elemento', label: 'Tipo de elemento', type: 'select' },
    ];

    const FILTER_SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
        estado: (states || []).filter(s => s.name).map(s => ({ value: s.name, label: s.name })),
        tipo_elemento: (itemTypes || []).map(t => ({ value: t, label: t })),
    };

    return (
        <>
            <Head title="HelpDesk HUV - Inventario Global" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                            <span className="text-gray-400">/</span>
                            <Link href="/inventario/global" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inventario</Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Global</span>
                        </div>
                    }
                />

                <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6">
                    <div className="bg-white shadow border border-gray-200">
                        {/* Header */}
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Inventario Global</h1>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                    <div className="relative flex-1 sm:flex-initial">
                                        <Input type="text" placeholder="Buscar..." className="w-full sm:w-64 pr-10 h-9" value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} />
                                        <Button aria-label="Buscar" size="sm" variant="ghost" className="absolute right-0 top-0 h-full px-3" onClick={handleSearch}>
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                                            className={`h-9 flex-1 sm:flex-initial ${hasActiveFilters ? 'border-[#2c4370] text-[#2c4370]' : ''}`}>
                                            <Filter className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Filtros</span>
                                            {hasActiveFilters && <span className="ml-1 bg-[#2c4370] text-white text-xs w-5 h-5 flex items-center justify-center">!</span>}
                                        </Button>
                                        <Button size="sm" className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-9 flex-1 sm:flex-initial" onClick={handleExport}>
                                            <span className="hidden sm:inline">Exportar</span><span className="sm:hidden">Excel</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <AdvancedFilterBar
                            initialFilters={advancedFilters.length > 0 ? advancedFilters : undefined}
                            onSearch={handleAdvancedSearch}
                            onReset={handleAdvancedReset}
                            fields={GLOBAL_FIELDS}
                            selectOptions={FILTER_SELECT_OPTIONS}
                        />

                        {showFilters && (
                            <div className="px-6 py-4 bg-gray-50 border-b">
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                    <div>
                                        <label htmlFor="filtro-estado" className="text-xs text-gray-600 mb-1 block">Estado</label>
                                        <SearchableSelect
                                            id="filtro-estado"
                                            value={stateFilter}
                                            onValueChange={setStateFilter}
                                            options={[{ value: 'all', label: 'Todos' }, ...(states || []).map((s) => ({ value: s.id.toString(), label: s.name }))]}
                                            placeholder="Todos"
                                            triggerClassName="h-8 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="filtro-tipo-elemento" className="text-xs text-gray-600 mb-1 block">Tipo de elemento</label>
                                        <SearchableSelect
                                            id="filtro-tipo-elemento"
                                            value={itemTypeFilter}
                                            onValueChange={setItemTypeFilter}
                                            options={[{ value: 'all', label: 'Todos' }, ...(itemTypes || []).map((type) => ({ value: type, label: type }))]}
                                            placeholder="Todos"
                                            triggerClassName="h-8 text-xs"
                                        />
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
                                        router.get('/inventario/global', { ...filters, per_page: value }, { preserveState: false })
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
                                <span className="font-medium">{items.data.length}</span> de{' '}
                                <span className="font-medium">{items.total}</span>
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
                                            aria-sort={filters.sort === 'item_type' ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            <button type="button" onClick={() => handleSort('item_type')} className="flex items-center w-full text-left cursor-pointer hover:text-[#2c4370]">
                                                Tipo de elemento
                                                {getSortIcon('item_type')}
                                            </button>
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
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                                Página {items.current_page} de {items.last_page}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
                                {items.links.map((link: PaginationLinks, index: number) => {
                                    const isMobileVisible = index === 0 || index === items.links.length - 1 || link.active;
                                    if (index === 0) {
                                        return (
                                            <Button key={index} aria-label="Página anterior" variant="outline" size="sm" disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0"
                                                onClick={() => link.url && router.visit(link.url)}>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    if (index === items.links.length - 1) {
                                        return (
                                            <Button key={index} aria-label="Página siguiente" variant="outline" size="sm" disabled={!link.url}
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
        </>
    );
}
