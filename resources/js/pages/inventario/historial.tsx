import {
    DataTableEmpty,
    DataTableFilters,
    DataTablePagination,
    DataTableToolbar,
    FilterLabel,
    type Paginator,
} from '@/components/data-table';
import { FlashBanner } from '@/components/flash-banner';
import { GLPIFooter } from '@/components/glpi-footer';
import { GLPIHeader } from '@/components/glpi-header';
import { PageHeader } from '@/components/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HistoryEntry, actionStyle, categoryLabel, formatHistoryDate } from '@/lib/inventory-history';
import { fieldClass, filterSelectClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import React from 'react';

interface HistorialProps {
    history: Paginator & { data: HistoryEntry[] };
    categories: string[];
    filters: {
        per_page: number;
        search: string;
        category: string;
        action: string;
        date_from: string;
        date_to: string;
    };
}

const RUTA = '/inventario/historial';

type Params = Record<string, string | number | undefined>;

const ACTIONS = [
    { value: 'added', label: 'Agregado' },
    { value: 'removed', label: 'Eliminado' },
    { value: 'modified', label: 'Modificado' },
    { value: 'baseline', label: 'Inicial' },
];

// Las mismas opciones que ya tenía esta página (arranca en 25; no ofrecía 15).
const FILAS = [10, 25, 50, 100, 500, 1000, 5000, 10000, 50000];

export default function Historial({ history, categories, filters }: HistorialProps) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [showFilters, setShowFilters] = React.useState(false);
    const [categoryFilter, setCategoryFilter] = React.useState(filters.category || 'all');
    const [actionFilter, setActionFilter] = React.useState(filters.action || 'all');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');

    const filtrosActivos = [categoryFilter !== 'all', actionFilter !== 'all', !!dateFrom, !!dateTo].filter(Boolean).length;

    const buildParams = (overrides: Params = {}): Params => {
        const params: Params = { per_page: filters.per_page, page: 1 };
        if (searchValue) params.search = searchValue;
        if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
        if (actionFilter && actionFilter !== 'all') params.action = actionFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        return { ...params, ...overrides };
    };

    const go = (params: Params, replace = false) => {
        const limpios = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
        router.get(RUTA, limpios, { preserveState: false, replace });
    };

    const clearFilters = () => {
        setCategoryFilter('all');
        setActionFilter('all');
        setSearchValue('');
        setDateFrom('');
        setDateTo('');
        go({ per_page: filters.per_page, page: 1 }, true);
    };

    return (
        <>
            <Head title="HelpDesk HUV - Historial de inventario" />
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
                            <span className="font-medium text-gray-900">Historial</span>
                        </div>
                    }
                />

                <main className="flex-1">
                    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-6 sm:px-6">
                        <PageHeader title="Historial de cambios" description="Cambios detectados en el hardware, el software y la red de cada equipo del inventario." />

                        <FlashBanner />

                        <section aria-label="Historial de cambios" className="surface-card overflow-hidden">
                            <DataTableToolbar
                                search={searchValue}
                                onSearchChange={setSearchValue}
                                onSearch={() => go(buildParams())}
                                placeholder="Buscar equipo o cambio…"
                                filtersOpen={showFilters}
                                onToggleFilters={() => setShowFilters((v) => !v)}
                                activeFilters={filtrosActivos}
                                summary={`${history.total.toLocaleString('es-CO')} cambios`}
                            />

                            {showFilters && (
                                <DataTableFilters onApply={() => go(buildParams(), true)} onClear={clearFilters} canClear={filtrosActivos > 0}>
                                    <div>
                                        <FilterLabel htmlFor="filtro-categoria">Categoría</FilterLabel>
                                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                            <SelectTrigger id="filtro-categoria" className={filterSelectClass}>
                                                <SelectValue placeholder="Todas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                {categories?.map((c) => (
                                                    <SelectItem key={c} value={c}>
                                                        {categoryLabel(c)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-accion">Acción</FilterLabel>
                                        <Select value={actionFilter} onValueChange={setActionFilter}>
                                            <SelectTrigger id="filtro-accion" className={filterSelectClass}>
                                                <SelectValue placeholder="Todas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                {ACTIONS.map((a) => (
                                                    <SelectItem key={a.value} value={a.value}>
                                                        {a.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-desde">Desde</FilterLabel>
                                        <input id="filtro-desde" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={cn(fieldClass, 'h-9')} />
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-hasta">Hasta</FilterLabel>
                                        <input id="filtro-hasta" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={cn(fieldClass, 'h-9')} />
                                    </div>
                                </DataTableFilters>
                            )}

                            <Table className="text-[13px]">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>Equipo</TableHead>
                                        <TableHead>Cambio</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Acción</TableHead>
                                        <TableHead>Fecha</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.data.length === 0 ? (
                                        <DataTableEmpty colSpan={5} title="No hay cambios registrados" description="Ninguno coincide con la búsqueda o los filtros aplicados." />
                                    ) : (
                                        history.data.map((h) => {
                                            const st = actionStyle(h.action);
                                            return (
                                                <TableRow key={h.id}>
                                                    <TableCell className="font-medium">
                                                        {h.computer_name ? (
                                                            h.itemtype === 'Computer' && h.items_id ? (
                                                                <Link href={`/inventario/computadores/${h.items_id}`} className="focus-ring rounded text-huv-ink hover:underline">
                                                                    {h.computer_name}
                                                                </Link>
                                                            ) : (
                                                                <span className="text-gray-900">{h.computer_name}</span>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-400">#{h.items_id}</span>
                                                        )}
                                                    </TableCell>
                                                    {/* El cambio es la columna que más texto trae: puede ocupar varias líneas. */}
                                                    <TableCell className="min-w-[18rem] whitespace-normal text-gray-900">{h.summary}</TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700">{categoryLabel(h.category)}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700">
                                                            <span aria-hidden="true" className={cn('size-1.5 rounded-full', st.dot)} />
                                                            {st.label}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 tabular-nums">{formatHistoryDate(h.changed_at)}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>

                            <DataTablePagination
                                paginator={history}
                                count={history.data.length}
                                noun="cambios"
                                perPageOptions={FILAS}
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
