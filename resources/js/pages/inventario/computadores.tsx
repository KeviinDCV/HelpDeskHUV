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
    formatTableDate,
    type Paginator,
} from '@/components/data-table';
import { FlashBanner } from '@/components/flash-banner';
import { GLPIFooter } from '@/components/glpi-footer';
import { GLPIHeader } from '@/components/glpi-header';
import { PageHeader } from '@/components/page-header';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { btn, fieldClass, filterSelectClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import React from 'react';

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

interface Option {
    id: number;
    name: string;
    completename?: string;
}

interface ComputersProps {
    computers: Paginator & { data: Computer[] };
    states: Option[];
    manufacturers: Option[];
    types: Option[];
    locations: Option[];
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
        advanced_filters: string;
    };
}

const RUTA = '/inventario/computadores';

type Params = Record<string, string | number | undefined>;

// ─── Campos del filtro avanzado ─────────────────────────────────────
const COMPUTER_FIELDS: FieldDef[] = [
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'entidad', label: 'Entidad', type: 'text' },
    { key: 'estado', label: 'Estado', type: 'select' },
    { key: 'fabricante', label: 'Fabricante', type: 'select' },
    { key: 'serial', label: 'Número de serie', type: 'text' },
    { key: 'tipo', label: 'Tipo', type: 'select' },
    { key: 'modelo', label: 'Modelo', type: 'text' },
    { key: 'localizacion', label: 'Localización', type: 'select' },
    { key: 'fecha_mod', label: 'Última actualización', type: 'date' },
    { key: 'otherserial', label: 'Nº de inventario', type: 'text' },
    { key: 'contacto', label: 'Contacto', type: 'text' },
    { key: 'contacto_num', label: 'Número de contacto', type: 'text' },
    { key: 'comentarios', label: 'Comentarios', type: 'text' },
];

export default function Computadores({ computers, states, manufacturers, types, locations, filters }: ComputersProps) {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const isAdmin = auth?.user?.role === 'Administrador';
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [deleteTarget, setDeleteTarget] = React.useState<Computer | null>(null);
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

    // Estados de filtros
    const [stateFilter, setStateFilter] = React.useState(filters.state || 'all');
    const [manufacturerFilter, setManufacturerFilter] = React.useState(filters.manufacturer || 'all');
    const [typeFilter, setTypeFilter] = React.useState(filters.type || 'all');
    const [locationFilter, setLocationFilter] = React.useState(filters.location || 'all');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');

    const filtrosActivos = [stateFilter !== 'all', manufacturerFilter !== 'all', typeFilter !== 'all', locationFilter !== 'all', !!dateFrom, !!dateTo].filter(Boolean).length;

    /**
     * Junta TODOS los filtros activos en un solo juego de parámetros.
     *
     * La pantalla tiene dos zonas de filtrado —la barra avanzada de arriba y el panel
     * "Filtros"— y cada acción construía su propia lista a mano. Se olvidaban la de la otra
     * zona, así que aplicar unos borraba los otros en silencio: ponías Estado y fechas,
     * usabas "Buscar" arriba, y volvías con solo el filtro de arriba puesto.
     *
     * Ahora toda acción parte de aquí y solo sobrescribe lo suyo, así que ninguna puede
     * descartar lo que el usuario configuró en la otra zona. Mismo patrón que casos.tsx.
     */
    const buildParams = (overrides: Params = {}): Params => {
        const params: Params = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1,
        };

        // Panel "Filtros" (filtros básicos)
        if (searchValue) params.search = searchValue;
        if (stateFilter && stateFilter !== 'all') params.state = stateFilter;
        if (manufacturerFilter && manufacturerFilter !== 'all') params.manufacturer = manufacturerFilter;
        if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
        if (locationFilter && locationFilter !== 'all') params.location = locationFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        // Barra avanzada. Se podan las filas sin valor: el backend las traduciría a
        // `columna = ''` y devolvería cero resultados sin decir por qué.
        const avanzados = activeFilterRows(advancedFilters);
        if (avanzados.length > 0) params.advanced_filters = JSON.stringify(avanzados);

        return { ...params, ...overrides };
    };

    const go = (params: Params) => {
        // Se descartan las claves en undefined para que un override pueda QUITAR un filtro
        // (p. ej. "Restablecer" de la barra avanzada) sin depender de cómo serialice Inertia.
        const limpios = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
        router.get(RUTA, limpios, { preserveState: false, preserveScroll: false, replace: true });
    };

    // Ordenar y cambiar filas por página también pasan por buildParams: antes leían los filtros
    // ya aplicados en el servidor, con la misma trampa que buildParams vino a quitar.
    const handleSort = (field: string) => {
        const direction = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        go(buildParams({ sort: field, direction }));
    };

    /** "Limpiar filtros": vacía SOLO el panel de filtros; la barra avanzada se respeta. */
    const clearFilters = () => {
        setStateFilter('all');
        setManufacturerFilter('all');
        setTypeFilter('all');
        setLocationFilter('all');
        setDateFrom('');
        setDateTo('');
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
     * volver a quedarse a medias. `page` y `per_page` no aplican a un export: se descartan.
     */
    const handleExport = () => {
        const exportables = buildParams();
        delete exportables.page;
        delete exportables.per_page;
        const params = new URLSearchParams(Object.entries(exportables).map(([k, v]) => [k, String(v)]));
        window.location.href = `${RUTA}/export?${params}`;
    };

    // ─── Barra avanzada ─────────────────────────────────────────────

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

    // Opciones de selección para el filtro avanzado (value = nombre, para comparación por texto en backend)
    const FILTER_SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
        estado: (states || []).filter((s) => s.name).map((s) => ({ value: s.name, label: s.name })),
        fabricante: (manufacturers || []).filter((m) => m.name).map((m) => ({ value: m.name, label: m.name })),
        tipo: (types || []).filter((t) => t.name).map((t) => ({ value: t.name, label: t.name })),
        localizacion: (locations || []).map((l) => ({ value: l.completename || l.name, label: l.completename || l.name })),
    };

    const opciones = (lista: Option[], todos = 'Todos') => [
        { value: 'all', label: todos },
        ...(lista || []).map((o) => ({ value: o.id.toString(), label: o.completename || o.name })),
    ];

    const orden = { sort: filters.sort, direction: filters.direction, onSort: handleSort };

    return (
        <>
            <Head title="HelpDesk HUV - Computadores" />
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
                            <span className="font-medium text-gray-900">Computadores</span>
                        </div>
                    }
                />

                <main className="flex-1">
                    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-6 sm:px-6">
                        <PageHeader
                            title="Computadores"
                            description="Equipos de escritorio, portátiles y todo en uno registrados en el inventario."
                            actions={
                                <>
                                    <button type="button" onClick={handleExport} className={btn.secondary}>
                                        <Download aria-hidden="true" />
                                        Exportar
                                    </button>
                                    <Link href={`${RUTA}/crear`} className={btn.primary}>
                                        <Plus aria-hidden="true" />
                                        Crear computador
                                    </Link>
                                </>
                            }
                        />

                        <FlashBanner />

                        <section aria-label="Lista de computadores" className="surface-card overflow-hidden">
                            <DataTableToolbar
                                search={searchValue}
                                onSearchChange={setSearchValue}
                                onSearch={() => go(buildParams())}
                                placeholder="Buscar computador…"
                                filtersOpen={showFilters}
                                onToggleFilters={() => setShowFilters((v) => !v)}
                                activeFilters={filtrosActivos}
                                summary={`${computers.total.toLocaleString('es-CO')} computadores`}
                            />

                            <AdvancedFilterBar
                                initialFilters={advancedFilters.length > 0 ? advancedFilters : undefined}
                                onSearch={handleAdvancedSearch}
                                onReset={handleAdvancedReset}
                                fields={COMPUTER_FIELDS}
                                selectOptions={FILTER_SELECT_OPTIONS}
                                defaultFirstRow={{ field: 'nombre', operator: 'contiene', value: '' }}
                            />

                            {showFilters && (
                                <DataTableFilters
                                    label="Filtros rápidos"
                                    visibleLabel
                                    gridClassName="lg:grid-cols-3 xl:grid-cols-6"
                                    onApply={() => go(buildParams())}
                                    onClear={clearFilters}
                                    canClear={filtrosActivos > 0}
                                >
                                    <div>
                                        <FilterLabel htmlFor="filtro-estado">Estado</FilterLabel>
                                        <SearchableSelect id="filtro-estado" value={stateFilter} onValueChange={setStateFilter} options={opciones(states)} placeholder="Todos" triggerClassName={filterSelectClass} />
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-fabricante">Fabricante</FilterLabel>
                                        <SearchableSelect id="filtro-fabricante" value={manufacturerFilter} onValueChange={setManufacturerFilter} options={opciones(manufacturers)} placeholder="Todos" triggerClassName={filterSelectClass} />
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-tipo">Tipo</FilterLabel>
                                        <SearchableSelect id="filtro-tipo" value={typeFilter} onValueChange={setTypeFilter} options={opciones(types)} placeholder="Todos" triggerClassName={filterSelectClass} />
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-localizacion">Localización</FilterLabel>
                                        <SearchableSelect id="filtro-localizacion" value={locationFilter} onValueChange={setLocationFilter} options={opciones(locations, 'Todas')} placeholder="Todas" triggerClassName={filterSelectClass} />
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-desde">Actualizado desde</FilterLabel>
                                        <input id="filtro-desde" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={cn(fieldClass, 'h-9')} />
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-hasta">Actualizado hasta</FilterLabel>
                                        <input id="filtro-hasta" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={cn(fieldClass, 'h-9')} />
                                    </div>
                                </DataTableFilters>
                            )}

                            <Table className="text-[13px]">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <SortableHead field="name" label="Nombre" {...orden} />
                                        <SortableHead field="entity_name" label="Entidad" {...orden} />
                                        <SortableHead field="state_name" label="Estado" {...orden} />
                                        <SortableHead field="manufacturer_name" label="Fabricante" {...orden} />
                                        <SortableHead field="serial" label="Número de serie" {...orden} />
                                        <SortableHead field="type_name" label="Tipo" {...orden} />
                                        <SortableHead field="model_name" label="Modelo" {...orden} />
                                        <SortableHead field="location_name" label="Localización" {...orden} />
                                        <SortableHead field="date_mod" label="Última actualización" {...orden} />
                                        {isAdmin && (
                                            <TableHead className="text-right">
                                                <span className="sr-only">Acciones</span>
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {computers.data.length === 0 ? (
                                        <DataTableEmpty
                                            colSpan={isAdmin ? 10 : 9}
                                            title="No hay computadores que coincidan"
                                            description="Prueba con otra búsqueda o quita alguno de los filtros."
                                        />
                                    ) : (
                                        computers.data.map((computer) => (
                                            <TableRow key={computer.id}>
                                                <TableCell>
                                                    <Link href={`${RUTA}/${computer.id}`} className="focus-ring rounded font-medium text-huv-ink hover:underline">
                                                        {computer.name || '—'}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-gray-600"><TruncatedText value={computer.entity_name} lines={2} className="max-w-[9rem]" /></TableCell>
                                                <TableCell className="text-gray-700">{computer.state_name || '—'}</TableCell>
                                                <TableCell className="text-gray-700">{computer.manufacturer_name || '—'}</TableCell>
                                                <TableCell className="font-mono text-xs text-gray-700">{computer.serial || '—'}</TableCell>
                                                <TableCell className="text-gray-700">{computer.type_name || '—'}</TableCell>
                                                <TableCell className="text-gray-700"><TruncatedText value={computer.model_name} lines={2} className="max-w-[10rem]" /></TableCell>
                                                <TableCell className="text-gray-700"><TruncatedText value={computer.location_name} lines={2} className="max-w-[12rem]" /></TableCell>
                                                <TableCell className="text-gray-500 tabular-nums">{formatTableDate(computer.date_mod)}</TableCell>
                                                {isAdmin && (
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-0.5">
                                                            <Link
                                                                href={`${RUTA}/${computer.id}/editar`}
                                                                aria-label={`Editar ${computer.name}`}
                                                                title="Editar"
                                                                className={cn(btn.ghost, 'size-7 px-0')}
                                                            >
                                                                <Pencil aria-hidden="true" />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteTarget(computer)}
                                                                aria-label={`Eliminar ${computer.name}`}
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
                                paginator={computers}
                                count={computers.data.length}
                                noun="computadores"
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
                title="Eliminar computador"
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
