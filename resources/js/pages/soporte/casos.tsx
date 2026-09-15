import AdvancedFilterBar, { FilterRow, activeFilterRows } from '@/components/AdvancedFilterBar';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ResolverCasoDialog } from '@/components/resolver-caso-dialog';
import {
    DataTableEmpty,
    DateTimeCell,
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
import { PriorityPill, StatusPill } from '@/components/ticket-pills';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { categoriaCorta } from '@/lib/ticket-format';
import { btn, fieldClass, filterSelectClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckSquare, Download, Filter, Loader2, Pencil, Plus, Trash2, Wrench, X } from 'lucide-react';
import React from 'react';

interface User {
    id: number;
    username: string;
    name: string;
    role: string;
}

interface Category {
    id: number;
    name: string;
    completename: string;
}

interface Technician {
    id: number;
    name: string;
    firstname: string;
    realname: string;
    fullname: string;
}

interface Ticket {
    id: number;
    name: string;
    entity_name: string | null;
    date: string;
    date_mod: string;
    status: number;
    status_name: string;
    priority: number;
    priority_name: string;
    requester_name: string | null;
    requester_user_id: number | null;
    assigned_name: string | null;
    assigned_user_id: number | null;
    assigned_glpi_id: number | null;
    category_name: string | null;
    item_name: string | null;
    users_id_recipient: number;
}

interface TicketsProps {
    tickets: Paginator & { data: Ticket[] };
    categories: Category[];
    technicians: Technician[];
    filters: {
        per_page: number;
        sort: string;
        direction: string;
        search: string;
        status: string;
        priority: string;
        category: string;
        assigned: string;
        date_from: string;
        date_to: string;
        filter: string;
        exclude_maintenance: string;
        advanced_filters: string;
    };
    auth: {
        user: User;
    };
}

const RUTA = '/soporte/casos';

type Params = Record<string, string | number | undefined>;

const ESTADOS = [
    ['1', 'Nuevo'],
    ['2', 'En curso (asignado)'],
    ['3', 'En curso (planificado)'],
    ['4', 'En espera'],
    ['5', 'Resuelto'],
    ['6', 'Cerrado'],
];
const PRIORIDADES = [
    ['1', 'Muy baja'],
    ['2', 'Baja'],
    ['3', 'Media'],
    ['4', 'Alta'],
    ['5', 'Muy alta'],
    ['6', 'Urgente'],
];

// Las mismas opciones que ya tenía esta página.
const FILAS = [15, 20, 50, 100, 500, 1000, 5000, 10000, 50000];

const FILTRO_ESPECIAL: Record<string, string> = {
    unassigned: 'Sin asignar',
    my_cases: 'Mis casos',
    my_pending: 'Sin resolver',
    my_resolved: 'Resueltos',
};

export default function Casos({ tickets, categories, technicians, filters, auth }: TicketsProps) {
    // Aviso de exportación rechazada por tamaño. Llega como flash tras el redirect del
    // servidor: sin este banner el usuario pulsaba "Exportar" y no pasaba absolutamente nada.
    const exportError = usePage<{ flash?: { export_error?: string } }>().props.flash?.export_error;
    const [exportErrorVisible, setExportErrorVisible] = React.useState(true);
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [ticketToDelete, setTicketToDelete] = React.useState<Ticket | null>(null);
    const [deleting, setDeleting] = React.useState(false);
    const [ticketToView, setTicketToView] = React.useState<Ticket | null>(null);
    const [ticketSolution, setTicketSolution] = React.useState<{ content: string; solved_by: string | null; date_creation: string } | null>(null);
    const [loadingSolution, setLoadingSolution] = React.useState(false);
    const [showFilters, setShowFilters] = React.useState(false);

    // Caso que se está resolviendo (el modal es components/resolver-caso-dialog)
    const [ticketToSolve, setTicketToSolve] = React.useState<Ticket | null>(null);
    // El error que el servidor devolvió al resolver ya se muestra en el modal: la página no lo repite.
    const [errorDelModal, setErrorDelModal] = React.useState<string | null>(null);

    // Estados de filtros
    const [statusFilter, setStatusFilter] = React.useState(filters.status || 'all');
    const [priorityFilter, setPriorityFilter] = React.useState(filters.priority || 'all');
    const [categoryFilter, setCategoryFilter] = React.useState(filters.category || 'all');
    const [assignedFilter, setAssignedFilter] = React.useState(filters.assigned || 'all');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');
    const [excludeMaintenance, setExcludeMaintenance] = React.useState(filters.exclude_maintenance === '1');

    // Estado de filtros avanzados (GLPI-style)
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

    const filtrosActivos = [
        statusFilter !== 'all',
        priorityFilter !== 'all',
        categoryFilter !== 'all',
        assignedFilter !== 'all',
        !!dateFrom,
        !!dateTo,
        excludeMaintenance,
    ].filter(Boolean).length;

    const filtroEspecial = filters.filter ? FILTRO_ESPECIAL[filters.filter] ?? null : null;

    // Verificar si el usuario puede eliminar un ticket
    const canDelete = (ticket: Ticket) => {
        if (auth.user.role === 'Administrador') return true;
        if (auth.user.role === 'Técnico') {
            // Técnico puede eliminar tickets donde es el asignado (resolvió) o el solicitante
            return ticket.assigned_user_id === auth.user.id || ticket.requester_user_id === auth.user.id;
        }
        return false;
    };

    // Admin y Técnico pueden editar
    const canEdit = auth.user.role === 'Administrador' || auth.user.role === 'Técnico';

    // Resolver: asignado a él (o admin) y que no esté ya resuelto o cerrado
    const canResolve = (ticket: Ticket) => {
        if (ticket.status === 5 || ticket.status === 6) return false;
        return auth.user.role === 'Administrador' || ticket.assigned_user_id === auth.user.id;
    };

    /**
     * Junta TODOS los filtros activos en un solo juego de parámetros.
     *
     * La pantalla tiene dos zonas de filtrado —la barra avanzada de arriba y el panel
     * "Filtros"— y cada acción construía su propia lista a mano. Se olvidaban la de la otra
     * zona, así que aplicar unos borraba los otros en silencio: ponías Categoría y fechas,
     * usabas "Buscar" arriba, y volvías con solo el filtro de arriba puesto.
     *
     * Ahora toda acción parte de aquí y solo sobrescribe lo suyo, así que ninguna puede
     * descartar lo que el usuario configuró en la otra zona.
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
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (priorityFilter && priorityFilter !== 'all') params.priority = priorityFilter;
        if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
        if (assignedFilter && assignedFilter !== 'all') params.assigned = assignedFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (excludeMaintenance) params.exclude_maintenance = '1';

        // Filtro especial (llega desde el dashboard: sin asignar, mis casos…)
        if (filters.filter) params.filter = filters.filter;

        // Barra avanzada. Se podan las filas sin valor: el backend las traduciría a
        // `columna = ''` y devolvería cero resultados sin decir por qué.
        const avanzados = activeFilterRows(advancedFilters);
        if (avanzados.length > 0) params.advanced_filters = JSON.stringify(avanzados);

        return { ...params, ...overrides };
    };

    const go = (params: Params) => {
        // Se descartan las claves en undefined para que un override pueda QUITAR un filtro.
        const limpios = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
        router.get(RUTA, limpios, { preserveState: false, preserveScroll: false, replace: true });
    };

    // Ordenar y cambiar filas por página también pasan por buildParams: antes leían los filtros
    // ya aplicados en el servidor, con la misma trampa que buildParams vino a quitar.
    const handleSort = (field: string) => {
        const direction = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        go(buildParams({ sort: field, direction }));
    };

    /** "Limpiar filtros": vacía SOLO el panel; la barra avanzada y el filtro especial se respetan. */
    const clearFilters = () => {
        setStatusFilter('all');
        setPriorityFilter('all');
        setCategoryFilter('all');
        setAssignedFilter('all');
        setDateFrom('');
        setDateTo('');
        setSearchValue('');
        setExcludeMaintenance(false);

        const avanzados = activeFilterRows(advancedFilters);
        go({
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1,
            ...(filters.filter ? { filter: filters.filter } : {}),
            ...(avanzados.length > 0 ? { advanced_filters: JSON.stringify(avanzados) } : {}),
        });
    };

    // Quitar el filtro especial conserva los demás (antes los descartaba todos).
    const clearSpecialFilter = () => go(buildParams({ filter: undefined }));

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

    /**
     * Exporta exactamente lo que el usuario tiene filtrado, de las DOS zonas: el mismo
     * buildParams() que "Aplicar filtros" y "Buscar". `page` y `per_page` no aplican.
     */
    const handleExport = () => {
        const exportables = buildParams();
        delete exportables.page;
        delete exportables.per_page;
        const params = new URLSearchParams(Object.entries(exportables).map(([k, v]) => [k, String(v)]));
        window.location.href = `${RUTA}/export?${params}`;
    };

    // Reporte de Mantenimiento Preventivo + Repotenciación/Actualización de computadores.
    // Por defecto abarca desde el 1 de enero del año actual hasta hoy; respeta el rango
    // de fechas si el usuario lo definió en los filtros.
    const handleExportMantenimiento = () => {
        const params = new URLSearchParams();
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);
        const qs = params.toString();
        window.location.href = `${RUTA}/export-mantenimiento${qs ? `?${qs}` : ''}`;
    };

    const openView = async (ticket: Ticket) => {
        setTicketToView(ticket);
        setTicketSolution(null);
        // La solución solo existe si el caso está resuelto o cerrado
        if (ticket.status === 5 || ticket.status === 6) {
            setLoadingSolution(true);
            try {
                const response = await fetch(`/dashboard/ticket/${ticket.id}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.solution) setTicketSolution(data.solution);
                }
            } catch {
                /* sin conexión: el modal dice que no hay solución registrada */
            } finally {
                setLoadingSolution(false);
            }
        }
    };

    const confirmDelete = () => {
        if (!ticketToDelete) return;
        setDeleting(true);
        router.delete(`${RUTA}/${ticketToDelete.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setTicketToDelete(null);
            },
        });
    };

    const orden = { sort: filters.sort, direction: filters.direction, onSort: handleSort };
    const columnas = canEdit ? 12 : 11;

    return (
        <>
            <Head title="HelpDesk HUV - Casos" />
            <div className="flex min-h-screen flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Inicio
                            </Link>
                            <span className="text-gray-400">/</span>
                            <Link href={RUTA} className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Soporte
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Casos</span>
                        </div>
                    }
                />

                <main className="flex-1">
                    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-6 sm:px-6">
                        <PageHeader
                            title={filtroEspecial ?? 'Casos'}
                            description={filtroEspecial ? 'Vista filtrada desde las cifras del panel principal.' : 'Todos los casos de la mesa de ayuda, con sus filtros y exportaciones.'}
                            actions={
                                <>
                                    <button type="button" onClick={handleExport} className={btn.secondary}>
                                        <Download aria-hidden="true" />
                                        Exportar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleExportMantenimiento}
                                        className={btn.secondary}
                                        title="Excel de Mantenimiento Preventivo y Repotenciación/Actualización de computadores (equipos activos, del 1 de enero a hoy, o el rango de fechas filtrado)"
                                    >
                                        <Wrench aria-hidden="true" />
                                        Informe de mantenimiento
                                    </button>
                                    <Link href="/soporte/crear-caso" className={btn.primary}>
                                        <Plus aria-hidden="true" />
                                        Crear caso
                                    </Link>
                                </>
                            }
                        />

                        {/* Aviso: la exportación superó el límite de filas */}
                        {exportError && exportErrorVisible && (
                            <div role="alert" className="flex items-start justify-between gap-3 rounded-xl bg-yellow-50 px-4 py-3 ring-1 ring-inset ring-yellow-600/25">
                                <div className="flex items-start gap-3 text-sm text-yellow-800">
                                    <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                                    <p>{exportError}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setExportErrorVisible(false)}
                                    aria-label="Cerrar aviso"
                                    className="focus-ring shrink-0 rounded text-yellow-800 hover:text-yellow-900"
                                >
                                    <X className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                        )}

                        <FlashBanner ignoreError={errorDelModal} />

                        {/* Filtro especial: llega desde las cifras del dashboard */}
                        {filtroEspecial && (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-huv-soft px-4 py-2.5 text-sm text-huv-ink">
                                <p className="flex items-center gap-2">
                                    <Filter className="size-4 shrink-0" aria-hidden="true" />
                                    Mostrando <strong className="font-semibold">{filtroEspecial.toLowerCase()}</strong>
                                    <span className="opacity-80">· {tickets.total.toLocaleString('es-CO')} casos</span>
                                </p>
                                <button type="button" onClick={clearSpecialFilter} className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium hover:bg-white/70 dark:hover:bg-white/10">
                                    <X className="size-4" aria-hidden="true" />
                                    Quitar filtro
                                </button>
                            </div>
                        )}

                        <section aria-label="Lista de casos" className="surface-card overflow-hidden">
                            <DataTableToolbar
                                search={searchValue}
                                onSearchChange={setSearchValue}
                                onSearch={() => go(buildParams())}
                                placeholder="Buscar caso…"
                                filtersOpen={showFilters}
                                onToggleFilters={() => setShowFilters((v) => !v)}
                                activeFilters={filtrosActivos}
                                summary={`${tickets.total.toLocaleString('es-CO')} casos`}
                            />

                            <AdvancedFilterBar
                                initialFilters={advancedFilters.length > 0 ? advancedFilters : undefined}
                                onSearch={handleAdvancedSearch}
                                onReset={handleAdvancedReset}
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
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger id="filtro-estado" className={filterSelectClass}>
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {ESTADOS.map(([v, l]) => (
                                                    <SelectItem key={v} value={v}>
                                                        {l}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-prioridad">Prioridad</FilterLabel>
                                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                            <SelectTrigger id="filtro-prioridad" className={filterSelectClass}>
                                                <SelectValue placeholder="Todas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                {PRIORIDADES.map(([v, l]) => (
                                                    <SelectItem key={v} value={v}>
                                                        {l}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-asignado">Asignado a</FilterLabel>
                                        <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                                            <SelectTrigger id="filtro-asignado" className={filterSelectClass}>
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {technicians.map((tech) => (
                                                    <SelectItem key={tech.id} value={tech.id.toString()}>
                                                        {tech.fullname}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-categoria">Categoría</FilterLabel>
                                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                            <SelectTrigger id="filtro-categoria" className={filterSelectClass}>
                                                <SelectValue placeholder="Todas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                                        {cat.completename}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-desde">Abierto desde</FilterLabel>
                                        <input id="filtro-desde" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={cn(fieldClass, 'h-9')} />
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-hasta">Abierto hasta</FilterLabel>
                                        <input id="filtro-hasta" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={cn(fieldClass, 'h-9')} />
                                    </div>
                                    <label className="flex cursor-pointer select-none items-start gap-2.5 sm:col-span-2 lg:col-span-3 xl:col-span-6">
                                        <input
                                            type="checkbox"
                                            checked={excludeMaintenance}
                                            onChange={(e) => setExcludeMaintenance(e.target.checked)}
                                            className="mt-0.5 size-4 cursor-pointer rounded accent-[var(--huv)]"
                                        />
                                        <span className="text-sm">
                                            <span className="font-medium text-gray-700">Excluir mantenimientos</span>
                                            <span className="ml-2 text-xs text-gray-500">Oculta los casos de mantenimiento preventivo y correctivo</span>
                                        </span>
                                    </label>
                                </DataTableFilters>
                            )}

                            <Table className="text-[13px]">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <SortableHead field="id" label="ID" {...orden} className="w-16" />
                                        <SortableHead field="name" label="Título" {...orden} />
                                        <SortableHead field="status" label="Estado" {...orden} />
                                        <SortableHead field="priority" label="Prioridad" {...orden} />
                                        <SortableHead field="entity_name" label="Entidad" {...orden} />
                                        <SortableHead field="date" label="Apertura" {...orden} />
                                        <SortableHead field="date_mod" label="Actualizado" {...orden} />
                                        <TableHead>Solicitante</TableHead>
                                        <TableHead>Asignado a</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Elemento</TableHead>
                                        {canEdit && (
                                            <TableHead className="text-right">
                                                <span className="sr-only">Acciones</span>
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.data.length === 0 ? (
                                        <DataTableEmpty colSpan={columnas} title="No se encontraron casos" description="Prueba con otra búsqueda o quita alguno de los filtros." />
                                    ) : (
                                        tickets.data.map((ticket) => (
                                            <TableRow key={ticket.id}>
                                                <TableCell className="tabular-nums text-gray-500">{ticket.id}</TableCell>
                                                {/* El título es lo que se lee primero: ancho mínimo garantizado, y las demás columnas se ajustan. */}
                                                <TableCell className="min-w-[12.5rem] min-[1360px]:min-w-[15rem]">
                                                    <button
                                                        type="button"
                                                        onClick={() => openView(ticket)}
                                                        className="focus-ring rounded text-left font-medium text-huv-ink hover:underline"
                                                    >
                                                        <TruncatedText value={ticket.name || '(Sin título)'} lines={2} className="max-w-[24rem]" />
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusPill status={ticket.status} name={ticket.status_name} />
                                                </TableCell>
                                                <TableCell>
                                                    <PriorityPill priority={ticket.priority} name={ticket.priority_name} />
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    <TruncatedText value={ticket.entity_name} lines={2} className="max-w-[8rem]" />
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    <DateTimeCell value={ticket.date} />
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    <DateTimeCell value={ticket.date_mod} />
                                                </TableCell>
                                                <TableCell className="min-w-[6rem] text-gray-700">
                                                    <TruncatedText value={ticket.requester_name} lines={2} className="max-w-[9rem]" />
                                                </TableCell>
                                                <TableCell className="min-w-[6rem] text-gray-700">
                                                    <TruncatedText value={ticket.assigned_name} lines={2} className="max-w-[9rem]" />
                                                </TableCell>
                                                <TableCell className="text-gray-700">
                                                    {/* Lo que distingue está al final ("Servinte › Clinico"); la ruta completa, al pasar el mouse. */}
                                                    <span title={ticket.category_name ?? undefined}>
                                                        <TruncatedText value={categoriaCorta(ticket.category_name)} lines={2} className="max-w-[10rem]" />
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    <TruncatedText value={ticket.item_name} lines={2} className="max-w-[8rem]" />
                                                </TableCell>
                                                {canEdit && (
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-0.5">
                                                            {canResolve(ticket) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setTicketToSolve(ticket)}
                                                                    aria-label={`Resolver caso #${ticket.id}`}
                                                                    title="Resolver"
                                                                    className={cn(btn.ghost, 'size-7 px-0 text-green-700 hover:bg-green-50 hover:text-green-800')}
                                                                >
                                                                    <CheckSquare aria-hidden="true" />
                                                                </button>
                                                            )}
                                                            <Link
                                                                href={`${RUTA}/${ticket.id}/editar`}
                                                                aria-label={`Editar caso #${ticket.id}`}
                                                                title="Editar"
                                                                className={cn(btn.ghost, 'size-7 px-0')}
                                                            >
                                                                <Pencil aria-hidden="true" />
                                                            </Link>
                                                            {canDelete(ticket) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setTicketToDelete(ticket)}
                                                                    aria-label={`Eliminar caso #${ticket.id}`}
                                                                    title="Eliminar"
                                                                    className={cn(btn.ghost, 'size-7 px-0 text-red-600 hover:bg-red-50 hover:text-red-700')}
                                                                >
                                                                    <Trash2 aria-hidden="true" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            <DataTablePagination
                                paginator={tickets}
                                count={tickets.data.length}
                                noun="casos"
                                perPageOptions={FILAS}
                                onPerPageChange={(value) => go(buildParams({ per_page: value }))}
                            />
                        </section>
                    </div>
                </main>
                <GLPIFooter />
            </div>

            <ConfirmDialog
                open={!!ticketToDelete}
                onOpenChange={(abierto) => !abierto && setTicketToDelete(null)}
                title={`Eliminar el caso #${ticketToDelete?.id ?? ''}`}
                description={
                    <>
                        ¿Eliminar <strong className="font-semibold text-gray-900">{ticketToDelete?.name}</strong>? No se puede deshacer.
                    </>
                }
                confirmLabel="Eliminar"
                onConfirm={confirmDelete}
                processing={deleting}
            />

            {/* Modal de visualización del caso */}
            <Dialog open={!!ticketToView} onOpenChange={(abierto) => !abierto && setTicketToView(null)}>
                <DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[600px]">
                    {ticketToView && (
                        <div className="flex max-h-[90vh] flex-col">
                            <DialogHeader className="border-b px-6 py-4 pr-12 text-left">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm tabular-nums text-gray-500">Caso #{ticketToView.id}</span>
                                    <StatusPill status={ticketToView.status} name={ticketToView.status_name} />
                                    <PriorityPill priority={ticketToView.priority} name={ticketToView.priority_name} />
                                </div>
                                <DialogTitle className="mt-1.5 text-lg font-semibold text-gray-900">{ticketToView.name}</DialogTitle>
                                <DialogDescription className="sr-only">Resumen del caso #{ticketToView.id}</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-5 overflow-y-auto px-6 py-5">
                                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                                    {[
                                        ['Entidad', ticketToView.entity_name],
                                        ['Categoría', ticketToView.category_name],
                                        ['Apertura', formatTableDate(ticketToView.date)],
                                        ['Última actualización', formatTableDate(ticketToView.date_mod)],
                                        ['Solicitante', ticketToView.requester_name],
                                        ['Asignado a', ticketToView.assigned_name],
                                    ].map(([etiqueta, valor]) => (
                                        <div key={etiqueta}>
                                            <dt className="text-xs text-gray-500">{etiqueta}</dt>
                                            <dd className="mt-0.5 font-medium text-gray-900">{valor || '—'}</dd>
                                        </div>
                                    ))}
                                </dl>

                                {/* Solución del caso */}
                                {(ticketToView.status === 5 || ticketToView.status === 6) && (
                                    <div className="border-t pt-4">
                                        <h3 className="mb-2 text-sm font-semibold text-green-700">Solución</h3>
                                        {loadingSolution ? (
                                            <p className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                                                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                                Cargando solución…
                                            </p>
                                        ) : ticketSolution ? (
                                            <div className="rounded-xl bg-green-50 p-4 ring-1 ring-inset ring-green-600/20">
                                                <p className="whitespace-pre-wrap text-sm text-gray-700">{ticketSolution.content}</p>
                                                <p className="mt-3 flex flex-wrap justify-between gap-2 border-t border-green-200 pt-2 text-xs text-green-700">
                                                    <span>
                                                        Resuelto por: <strong>{ticketSolution.solved_by || 'Usuario del sistema'}</strong>
                                                    </span>
                                                    <span>{ticketSolution.date_creation ? new Date(ticketSolution.date_creation).toLocaleString('es-CO') : '—'}</span>
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500">No se encontró solución registrada.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-3">
                                <button type="button" onClick={() => setTicketToView(null)} className={btn.secondary}>
                                    Cerrar
                                </button>
                                {canResolve(ticketToView) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const t = ticketToView;
                                            setTicketToView(null);
                                            setTicketToSolve(t);
                                        }}
                                        className={cn(btn.primary, 'bg-green-700 hover:bg-green-800')}
                                    >
                                        <CheckSquare aria-hidden="true" />
                                        Resolver
                                    </button>
                                )}
                                {canEdit && (
                                    <Link href={`${RUTA}/${ticketToView.id}/editar`} className={btn.primary}>
                                        <Pencil aria-hidden="true" />
                                        Editar caso
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ResolverCasoDialog caso={ticketToSolve} onClose={() => setTicketToSolve(null)} onServerError={setErrorDelModal} />
        </>
    );
}
