import AdvancedFilterBar, { FilterRow, FieldDef, activeFilterRows } from '@/components/AdvancedFilterBar';
import {
    DataTableEmpty,
    DataTableFilters,
    DataTablePagination,
    DataTableToolbar,
    FilterLabel,
    SortableHead,
    TruncatedText,
    type Paginator,
} from '@/components/data-table';
import { FlashBanner } from '@/components/flash-banner';
import { GLPIFooter } from '@/components/glpi-footer';
import { GLPIHeader } from '@/components/glpi-header';
import { PageHeader } from '@/components/page-header';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { btn, filterSelectClass } from '@/lib/ui-classes';
import { Head, Link, router } from '@inertiajs/react';
import { Download } from 'lucide-react';
import React from 'react';

interface GlobalItem {
    name: string;
    entity_name: string | null;
    state_name: string | null;
    item_type: string;
}

interface State {
    id: number;
    name: string;
}

interface GlobalInventoryProps {
    items: Paginator & { data: GlobalItem[] };
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

const RUTA = '/inventario/global';

type Params = Record<string, string | number | undefined>;

// ─── Campos del filtro avanzado ─────────────────────────────────────
const CAMPOS: FieldDef[] = [
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'entidad', label: 'Entidad', type: 'text' },
    { key: 'estado', label: 'Estado', type: 'select' },
    { key: 'tipo_elemento', label: 'Tipo de elemento', type: 'select' },
];

export default function Global({ items, states, itemTypes, filters }: GlobalInventoryProps) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [showFilters, setShowFilters] = React.useState(false);

    const [stateFilter, setStateFilter] = React.useState(filters.state || 'all');
    const [itemTypeFilter, setItemTypeFilter] = React.useState(filters.item_type || 'all');
    const filtrosActivos = [stateFilter !== 'all', itemTypeFilter !== 'all'].filter(Boolean).length;

    const [advancedFilters, setAdvancedFilters] = React.useState<FilterRow[]>(() => {
        try {
            return filters.advanced_filters ? JSON.parse(filters.advanced_filters) : [];
        } catch {
            return [];
        }
    });

    /**
     * Junta TODOS los filtros activos en un solo juego de parámetros: el panel "Filtros" y la
     * barra avanzada. Cada acción parte de aquí y solo sobrescribe lo suyo, así que ninguna
     * descarta lo configurado en la otra zona. Mismo patrón que casos.tsx.
     */
    const buildParams = (overrides: Params = {}): Params => {
        const params: Params = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1,
        };
        if (searchValue) params.search = searchValue;
        if (stateFilter && stateFilter !== 'all') params.state = stateFilter;
        if (itemTypeFilter && itemTypeFilter !== 'all') params.item_type = itemTypeFilter;

        // Se podan las filas sin valor: el backend las traduciría a `columna = ''`.
        const avanzados = activeFilterRows(advancedFilters);
        if (avanzados.length > 0) params.advanced_filters = JSON.stringify(avanzados);

        return { ...params, ...overrides };
    };

    const go = (params: Params) => {
        const limpios = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
        router.get(RUTA, limpios, { preserveState: false, preserveScroll: false, replace: true });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        go(buildParams({ sort: field, direction }));
    };

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

    /** Exporta exactamente lo filtrado en las DOS zonas; `page` y `per_page` no aplican. */
    const handleExport = () => {
        const exportables = buildParams();
        delete exportables.page;
        delete exportables.per_page;
        const params = new URLSearchParams(Object.entries(exportables).map(([k, v]) => [k, String(v)]));
        window.location.href = `${RUTA}/export?${params}`;
    };

    /** "Buscar" de la barra avanzada: aplica sus filas SIN tocar el panel de filtros. */
    const handleAdvancedSearch = (rows: FilterRow[]) => {
        setAdvancedFilters(rows);
        const avanzados = activeFilterRows(rows);
        go(buildParams(avanzados.length > 0 ? { advanced_filters: JSON.stringify(avanzados) } : { advanced_filters: undefined }));
    };

    /** "Restablecer" de la barra avanzada: vacía SOLO sus filas; el panel se respeta. */
    const handleAdvancedReset = () => {
        setAdvancedFilters([]);
        go(buildParams({ advanced_filters: undefined }));
    };

    const FILTER_SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
        estado: (states || []).filter((s) => s.name).map((s) => ({ value: s.name, label: s.name })),
        tipo_elemento: (itemTypes || []).map((t) => ({ value: t, label: t })),
    };

    const orden = { sort: filters.sort, direction: filters.direction, onSort: handleSort };

    return (
        <>
            <Head title="HelpDesk HUV - Inventario global" />
            <div className="flex min-h-screen flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Inicio
                            </Link>
                            <span className="text-gray-400">/</span>
                            <Link href="/inventario/global" className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Inventario
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Global</span>
                        </div>
                    }
                />

                <main className="flex-1">
                    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-6 sm:px-6">
                        <PageHeader
                            title="Inventario global"
                            description="Todos los elementos del inventario en una sola lista, de cualquier tipo."
                            actions={
                                <button type="button" onClick={handleExport} className={btn.secondary}>
                                    <Download aria-hidden="true" />
                                    Exportar
                                </button>
                            }
                        />

                        <FlashBanner />

                        <section aria-label="Lista del inventario" className="surface-card overflow-hidden">
                            <DataTableToolbar
                                search={searchValue}
                                onSearchChange={setSearchValue}
                                onSearch={() => go(buildParams())}
                                placeholder="Buscar en todo el inventario…"
                                filtersOpen={showFilters}
                                onToggleFilters={() => setShowFilters((v) => !v)}
                                activeFilters={filtrosActivos}
                                summary={`${items.total.toLocaleString('es-CO')} elementos`}
                            />

                            <AdvancedFilterBar
                                initialFilters={advancedFilters.length > 0 ? advancedFilters : undefined}
                                onSearch={handleAdvancedSearch}
                                onReset={handleAdvancedReset}
                                fields={CAMPOS}
                                selectOptions={FILTER_SELECT_OPTIONS}
                            />

                            {showFilters && (
                                <DataTableFilters label="Filtros rápidos" visibleLabel onApply={() => go(buildParams())} onClear={clearFilters} canClear={filtrosActivos > 0}>
                                    <div>
                                        <FilterLabel htmlFor="filtro-estado">Estado</FilterLabel>
                                        <SearchableSelect
                                            id="filtro-estado"
                                            value={stateFilter}
                                            onValueChange={setStateFilter}
                                            options={[{ value: 'all', label: 'Todos' }, ...(states || []).map((s) => ({ value: s.id.toString(), label: s.name }))]}
                                            placeholder="Todos"
                                            triggerClassName={filterSelectClass}
                                        />
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-tipo-elemento">Tipo de elemento</FilterLabel>
                                        <SearchableSelect
                                            id="filtro-tipo-elemento"
                                            value={itemTypeFilter}
                                            onValueChange={setItemTypeFilter}
                                            options={[{ value: 'all', label: 'Todos' }, ...(itemTypes || []).map((t) => ({ value: t, label: t }))]}
                                            placeholder="Todos"
                                            triggerClassName={filterSelectClass}
                                        />
                                    </div>
                                </DataTableFilters>
                            )}

                            <Table className="text-[13px]">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <SortableHead field="name" label="Nombre" {...orden} />
                                        <SortableHead field="entity_name" label="Entidad" {...orden} />
                                        <SortableHead field="state_name" label="Estado" {...orden} />
                                        <SortableHead field="item_type" label="Tipo de elemento" {...orden} />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.data.length === 0 ? (
                                        <DataTableEmpty colSpan={4} title="No hay elementos que coincidan" description="Prueba con otra búsqueda o quita alguno de los filtros." />
                                    ) : (
                                        // Sin id: el inventario global mezcla tablas de GLPI distintas.
                                        items.data.map((item, index) => (
                                            <TableRow key={`${item.item_type}-${item.name}-${index}`}>
                                                <TableCell className="font-medium text-gray-900">
                                                    <TruncatedText value={item.name} lines={2} className="max-w-[28rem]" />
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    <TruncatedText value={item.entity_name} lines={2} className="max-w-[14rem]" />
                                                </TableCell>
                                                <TableCell className="text-gray-700">{item.state_name || '—'}</TableCell>
                                                <TableCell>
                                                    <span className="inline-flex rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700">{item.item_type || '—'}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            <DataTablePagination
                                paginator={items}
                                count={items.data.length}
                                noun="elementos"
                                onPerPageChange={(value) => go(buildParams({ per_page: value }))}
                            />
                        </section>
                    </div>
                </main>

                <GLPIFooter />
            </div>
        </>
    );
}
