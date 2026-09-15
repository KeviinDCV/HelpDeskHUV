import AdvancedFilterBar, { FilterRow, FieldDef, activeFilterRows } from '@/components/AdvancedFilterBar';
import { ConfirmDialog } from '@/components/confirm-dialog';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { btn, filterSelectClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import React from 'react';

interface Consumable {
    id: number;
    name: string;
    entity_name: string | null;
    ref: string | null;
    type_name: string | null;
    manufacturer_name: string | null;
    total: number;
    nuevo: number;
    usado: number;
    comment: string | null;
    tech_name: string | null;
}

interface Option {
    id: number;
    name: string;
}

interface ConsumablesProps {
    consumables: Paginator & { data: Consumable[] };
    types: Option[];
    manufacturers: Option[];
    filters: {
        per_page: number;
        sort: string;
        direction: string;
        search: string;
        type: string;
        manufacturer: string;
        advanced_filters: string;
    };
}

const RUTA = '/inventario/consumibles';

type Params = Record<string, string | number | undefined>;

// ─── Campos del filtro avanzado ─────────────────────────────────────
const CAMPOS: FieldDef[] = [
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'entidad', label: 'Entidad', type: 'text' },
    { key: 'referencia', label: 'Referencia', type: 'text' },
    { key: 'tipo', label: 'Tipo', type: 'select' },
    { key: 'fabricante', label: 'Fabricante', type: 'select' },
    { key: 'tecnico', label: 'Técnico a cargo', type: 'text' },
    { key: 'id', label: 'ID', type: 'number' },
];

const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString('es-CO');

export default function Consumibles({ consumables, types, manufacturers, filters }: ConsumablesProps) {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const isAdmin = auth?.user?.role === 'Administrador';
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [deleteTarget, setDeleteTarget] = React.useState<Consumable | null>(null);
    const [deleting, setDeleting] = React.useState(false);
    const [showFilters, setShowFilters] = React.useState(false);

    // Filtros avanzados
    const [advancedFilters, setAdvancedFilters] = React.useState<FilterRow[]>(() => {
        if (filters.advanced_filters) {
            try {
                const parsed = JSON.parse(filters.advanced_filters);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch {
                /* filtro corrupto en la URL: se ignora */
            }
        }
        return [];
    });

    const [typeFilter, setTypeFilter] = React.useState(filters.type || 'all');
    const [manufacturerFilter, setManufacturerFilter] = React.useState(filters.manufacturer || 'all');
    const filtrosActivos = [typeFilter !== 'all', manufacturerFilter !== 'all'].filter(Boolean).length;

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
        if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
        if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;

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
        setTypeFilter('all');
        setManufacturerFilter('all');
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
    const handleAdvancedSearch = (filterRows: FilterRow[]) => {
        setAdvancedFilters(filterRows);
        const avanzados = activeFilterRows(filterRows);
        go(buildParams(avanzados.length > 0 ? { advanced_filters: JSON.stringify(avanzados) } : { advanced_filters: undefined }));
    };

    /** "Restablecer" de la barra avanzada: vacía SOLO sus filas; el panel se respeta. */
    const handleAdvancedReset = () => {
        setAdvancedFilters([]);
        go(buildParams({ advanced_filters: undefined }));
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`${RUTA}/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    // Opciones de catálogos para el filtro avanzado (value = nombre, comparación por texto en backend)
    const FILTER_SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
        tipo: (types || []).filter((t) => t.name).map((t) => ({ value: t.name, label: t.name })),
        fabricante: (manufacturers || []).filter((m) => m.name).map((m) => ({ value: m.name, label: m.name })),
    };

    const opciones = (lista: Option[]) => [{ value: 'all', label: 'Todos' }, ...(lista || []).map((o) => ({ value: o.id.toString(), label: o.name }))];

    const orden = { sort: filters.sort, direction: filters.direction, onSort: handleSort };

    return (
        <>
            <Head title="HelpDesk HUV - Consumibles" />
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
                            <span className="font-medium text-gray-900">Consumibles</span>
                        </div>
                    }
                />

                <main className="flex-1">
                    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-6 sm:px-6">
                        <PageHeader
                            title="Consumibles"
                            description="Modelos de consumible del inventario y cuántas unidades hay de cada uno."
                            actions={
                                <>
                                    <button type="button" onClick={handleExport} className={btn.secondary}>
                                        <Download aria-hidden="true" />
                                        Exportar
                                    </button>
                                    <Link href={`${RUTA}/crear`} className={btn.primary}>
                                        <Plus aria-hidden="true" />
                                        Crear consumible
                                    </Link>
                                </>
                            }
                        />

                        <FlashBanner />

                        <section aria-label="Lista de consumibles" className="surface-card overflow-hidden">
                            <DataTableToolbar
                                search={searchValue}
                                onSearchChange={setSearchValue}
                                onSearch={() => go(buildParams())}
                                placeholder="Buscar consumible…"
                                filtersOpen={showFilters}
                                onToggleFilters={() => setShowFilters((v) => !v)}
                                activeFilters={filtrosActivos}
                                summary={`${consumables.total.toLocaleString('es-CO')} consumibles`}
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
                                        <FilterLabel htmlFor="filtro-tipo">Tipo</FilterLabel>
                                        <SearchableSelect id="filtro-tipo" value={typeFilter} onValueChange={setTypeFilter} options={opciones(types)} placeholder="Todos" triggerClassName={filterSelectClass} />
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-fabricante">Fabricante</FilterLabel>
                                        <SearchableSelect id="filtro-fabricante" value={manufacturerFilter} onValueChange={setManufacturerFilter} options={opciones(manufacturers)} placeholder="Todos" triggerClassName={filterSelectClass} />
                                    </div>
                                </DataTableFilters>
                            )}

                            <Table className="text-[13px]">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <SortableHead field="name" label="Nombre" {...orden} />
                                        <SortableHead field="entity_name" label="Entidad" {...orden} />
                                        <SortableHead field="ref" label="Referencia" {...orden} />
                                        <SortableHead field="type_name" label="Tipo" {...orden} />
                                        <SortableHead field="manufacturer_name" label="Fabricante" {...orden} />
                                        <SortableHead field="total" label="Unidades" {...orden} />
                                        <TableHead>Comentarios</TableHead>
                                        <SortableHead field="tech_name" label="Técnico a cargo" {...orden} />
                                        {isAdmin && (
                                            <TableHead className="text-right">
                                                <span className="sr-only">Acciones</span>
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {consumables.data.length === 0 ? (
                                        <DataTableEmpty
                                            colSpan={isAdmin ? 9 : 8}
                                            title="No hay consumibles que coincidan"
                                            description="Prueba con otra búsqueda o quita alguno de los filtros."
                                        />
                                    ) : (
                                        consumables.data.map((consumable) => (
                                            <TableRow key={consumable.id}>
                                                <TableCell>
                                                    <Link href={`${RUTA}/${consumable.id}`} className="focus-ring rounded font-medium text-huv-ink hover:underline">
                                                        <TruncatedText value={consumable.name} lines={2} className="max-w-[16rem]" />
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    <TruncatedText value={consumable.entity_name} lines={2} className="max-w-[9rem]" />
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-gray-700">{consumable.ref || '—'}</TableCell>
                                                <TableCell className="text-gray-700">{consumable.type_name || '—'}</TableCell>
                                                <TableCell className="text-gray-700">{consumable.manufacturer_name || '—'}</TableCell>
                                                <TableCell>
                                                    <span className="font-medium tabular-nums text-gray-900">{fmt(consumable.total)}</span>
                                                    <span className="ml-2 text-xs tabular-nums text-gray-500">
                                                        {fmt(consumable.nuevo)} nuevos · {fmt(consumable.usado)} usados
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    <TruncatedText value={consumable.comment} className="max-w-[16rem]" />
                                                </TableCell>
                                                <TableCell className="text-gray-700">{consumable.tech_name || '—'}</TableCell>
                                                {isAdmin && (
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-0.5">
                                                            <Link
                                                                href={`${RUTA}/${consumable.id}/editar`}
                                                                aria-label={`Editar ${consumable.name}`}
                                                                title="Editar"
                                                                className={cn(btn.ghost, 'size-7 px-0')}
                                                            >
                                                                <Pencil aria-hidden="true" />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteTarget(consumable)}
                                                                aria-label={`Eliminar ${consumable.name}`}
                                                                title="Eliminar"
                                                                className={cn(btn.ghost, 'size-7 px-0 text-red-600 hover:bg-red-50 hover:text-red-700')}
                                                            >
                                                                <Trash2 aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            <DataTablePagination
                                paginator={consumables}
                                count={consumables.data.length}
                                noun="consumibles"
                                onPerPageChange={(value) => go(buildParams({ per_page: value }))}
                            />
                        </section>
                    </div>
                </main>

                <GLPIFooter />
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(abierto) => !abierto && setDeleteTarget(null)}
                title="Eliminar consumible"
                description={
                    <>
                        ¿Eliminar <strong className="font-semibold text-gray-900">{deleteTarget?.name}</strong>? No se puede deshacer.
                    </>
                }
                confirmLabel="Eliminar"
                onConfirm={confirmDelete}
                processing={deleting}
            />
        </>
    );
}
