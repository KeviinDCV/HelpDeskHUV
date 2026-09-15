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

interface Software {
    id: number;
    name: string;
    entity_name: string | null;
    manufacturer_name: string | null;
    num_versions: number;
    num_installations: number;
    num_licenses: number;
}

interface Manufacturer {
    id: number;
    name: string;
}

interface SoftwaresProps {
    softwares: Paginator & { data: Software[] };
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

const RUTA = '/inventario/programas';

type Params = Record<string, string | number | undefined>;

// ─── Campos del filtro avanzado ─────────────────────────────────────
const CAMPOS: FieldDef[] = [
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'entidad', label: 'Entidad', type: 'text' },
    { key: 'editor', label: 'Editor', type: 'select' },
];

const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString('es-CO');

export default function Programas({ softwares, manufacturers, filters }: SoftwaresProps) {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const isAdmin = auth?.user?.role === 'Administrador';
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [deleteTarget, setDeleteTarget] = React.useState<Software | null>(null);
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

    const [manufacturerFilter, setManufacturerFilter] = React.useState(filters.manufacturer || 'all');
    const filtrosActivos = manufacturerFilter !== 'all' ? 1 : 0;

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

    const FILTER_SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
        editor: (manufacturers || []).filter((m) => m.name).map((m) => ({ value: m.name, label: m.name })),
    };

    const orden = { sort: filters.sort, direction: filters.direction, onSort: handleSort };

    return (
        <>
            <Head title="HelpDesk HUV - Programas" />
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
                            <span className="font-medium text-gray-900">Programas</span>
                        </div>
                    }
                />

                <main className="flex-1">
                    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-6 sm:px-6">
                        <PageHeader
                            title="Programas"
                            description="Software del inventario con sus versiones, instalaciones y licencias."
                            actions={
                                <>
                                    <button type="button" onClick={handleExport} className={btn.secondary}>
                                        <Download aria-hidden="true" />
                                        Exportar
                                    </button>
                                    <Link href={`${RUTA}/crear`} className={btn.primary}>
                                        <Plus aria-hidden="true" />
                                        Crear programa
                                    </Link>
                                </>
                            }
                        />

                        <FlashBanner />

                        <section aria-label="Lista de programas" className="surface-card overflow-hidden">
                            <DataTableToolbar
                                search={searchValue}
                                onSearchChange={setSearchValue}
                                onSearch={() => go(buildParams())}
                                placeholder="Buscar programa…"
                                filtersOpen={showFilters}
                                onToggleFilters={() => setShowFilters((v) => !v)}
                                activeFilters={filtrosActivos}
                                summary={`${softwares.total.toLocaleString('es-CO')} programas`}
                            />

                            <AdvancedFilterBar
                                initialFilters={advancedFilters.length > 0 ? advancedFilters : undefined}
                                onSearch={handleAdvancedSearch}
                                onReset={handleAdvancedReset}
                                fields={CAMPOS}
                                selectOptions={FILTER_SELECT_OPTIONS}
                                defaultFirstRow={{ field: 'nombre', operator: 'contiene', value: '' }}
                            />

                            {showFilters && (
                                <DataTableFilters label="Filtros rápidos" visibleLabel onApply={() => go(buildParams())} onClear={clearFilters} canClear={filtrosActivos > 0}>
                                    <div>
                                        <FilterLabel htmlFor="filtro-editor">Editor</FilterLabel>
                                        <SearchableSelect
                                            id="filtro-editor"
                                            value={manufacturerFilter}
                                            onValueChange={setManufacturerFilter}
                                            options={[{ value: 'all', label: 'Todos' }, ...(manufacturers || []).map((m) => ({ value: m.id.toString(), label: m.name }))]}
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
                                        <SortableHead field="manufacturer_name" label="Editor" {...orden} />
                                        <SortableHead field="num_versions" label="Versiones" {...orden} className="text-right" />
                                        <SortableHead field="num_installations" label="Instalaciones" {...orden} className="text-right" />
                                        <SortableHead field="num_licenses" label="Licencias" {...orden} className="text-right" />
                                        {isAdmin && (
                                            <TableHead className="text-right">
                                                <span className="sr-only">Acciones</span>
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {softwares.data.length === 0 ? (
                                        <DataTableEmpty
                                            colSpan={isAdmin ? 7 : 6}
                                            title="No hay programas que coincidan"
                                            description="Prueba con otra búsqueda o quita alguno de los filtros."
                                        />
                                    ) : (
                                        softwares.data.map((software) => (
                                            <TableRow key={software.id}>
                                                <TableCell>
                                                    <Link href={`${RUTA}/${software.id}`} className="focus-ring rounded font-medium text-huv-ink hover:underline">
                                                        <TruncatedText value={software.name} lines={2} className="max-w-[24rem]" />
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    <TruncatedText value={software.entity_name} lines={2} className="max-w-[10rem]" />
                                                </TableCell>
                                                <TableCell className="text-gray-700">
                                                    <TruncatedText value={software.manufacturer_name} lines={2} className="max-w-[14rem]" />
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums text-gray-700">{fmt(software.num_versions)}</TableCell>
                                                <TableCell className="text-right tabular-nums text-gray-700">{fmt(software.num_installations)}</TableCell>
                                                <TableCell className="text-right tabular-nums text-gray-700">{fmt(software.num_licenses)}</TableCell>
                                                {isAdmin && (
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-0.5">
                                                            <Link
                                                                href={`${RUTA}/${software.id}/editar`}
                                                                aria-label={`Editar ${software.name}`}
                                                                title="Editar"
                                                                className={cn(btn.ghost, 'size-7 px-0')}
                                                            >
                                                                <Pencil aria-hidden="true" />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteTarget(software)}
                                                                aria-label={`Eliminar ${software.name}`}
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
                                paginator={softwares}
                                count={softwares.data.length}
                                noun="programas"
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
                title="Eliminar programa"
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
