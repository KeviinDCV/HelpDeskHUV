import { TableCell, TableHead, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { btn, fieldClass, selectTriggerClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { useId, type ReactNode } from 'react';

/*
 * Piezas comunes de las páginas de listado (usuarios, inventario, casos…). Hasta ahora cada
 * página copiaba a mano su barra de búsqueda, su paginación y sus encabezados ordenables, así
 * que un cambio en una no llegaba a las demás. Todo lo que es igual en todas vive aquí.
 */

export type SortDirection = 'asc' | 'desc' | string;

export interface PaginatorLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginator {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
    links: PaginatorLink[];
}

/** Barra superior: búsqueda a la izquierda; filtros y acciones extra a la derecha. */
export function DataTableToolbar({
    search,
    onSearchChange,
    onSearch,
    placeholder = 'Buscar…',
    filtersOpen,
    onToggleFilters,
    activeFilters = 0,
    filtersId = 'panel-filtros',
    summary,
    children,
}: {
    search: string;
    onSearchChange: (value: string) => void;
    onSearch: () => void;
    placeholder?: string;
    filtersOpen?: boolean;
    onToggleFilters?: () => void;
    activeFilters?: number;
    filtersId?: string;
    /** Texto corto a la derecha, p. ej. "1.284 computadores". */
    summary?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <form
                role="search"
                onSubmit={(e) => {
                    e.preventDefault();
                    onSearch();
                }}
                className="relative w-full sm:max-w-sm"
            >
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    aria-label={placeholder.replace(/…$/, '')}
                    className={cn(fieldClass, 'h-9 pr-10')}
                />
                <button
                    type="submit"
                    aria-label="Buscar"
                    className="focus-ring absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-gray-500 hover:text-gray-900"
                >
                    <Search className="size-4" aria-hidden="true" />
                </button>
            </form>

            <div className="flex items-center gap-2 sm:ml-auto">
                {summary && <p className="mr-1 hidden text-sm text-gray-500 tabular-nums md:block">{summary}</p>}
                {children}
                {onToggleFilters && (
                    <button
                        type="button"
                        onClick={onToggleFilters}
                        aria-expanded={filtersOpen}
                        aria-controls={filtersId}
                        className={cn(btn.secondary, 'h-9', activeFilters > 0 && 'text-huv-ink ring-huv/40')}
                    >
                        <SlidersHorizontal aria-hidden="true" />
                        Filtros
                        {activeFilters > 0 && (
                            <>
                                <span aria-hidden="true" className="min-w-5 rounded-full bg-huv px-1.5 text-[11px] font-semibold leading-5 text-white">
                                    {activeFilters}
                                </span>
                                <span className="sr-only">({activeFilters} activos)</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

/** Panel desplegable de filtros, con los mismos botones y textos en todas las páginas. */
export function DataTableFilters({
    id = 'panel-filtros',
    label = 'Filtros',
    onApply,
    onClear,
    canClear,
    visibleLabel = false,
    gridClassName = 'lg:grid-cols-4',
    children,
}: {
    id?: string;
    label?: string;
    onApply: () => void;
    onClear: () => void;
    canClear: boolean;
    /** Muestra el nombre de la zona. Hace falta donde conviven con la "Búsqueda avanzada":
     *  sin rótulo, su "Aplicar filtros" y el "Buscar" de arriba parecen el mismo control. */
    visibleLabel?: boolean;
    gridClassName?: string;
    children: ReactNode;
}) {
    return (
        <section id={id} aria-label={label} className="border-b bg-gray-50 px-4 py-4 sm:px-5">
            {visibleLabel && (
                <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                    {label}
                </p>
            )}
            <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', gridClassName)}>{children}</div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
                {canClear && (
                    <button type="button" onClick={onClear} className={cn(btn.ghost, 'h-8 px-3')}>
                        <X aria-hidden="true" />
                        Limpiar filtros
                    </button>
                )}
                <button type="button" onClick={onApply} className={cn(btn.primary, 'h-8 px-3')}>
                    Aplicar filtros
                </button>
            </div>
        </section>
    );
}

/** Etiqueta de un control dentro del panel de filtros. */
export function FilterLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
    return (
        <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-gray-600">
            {children}
        </label>
    );
}

/**
 * Pestañas que filtran la lista (p. ej. Todos / Switches / Platos WiFi). aria-pressed y no
 * role="tab": no conmutan paneles, filtran la misma tabla.
 */
export function SegmentedControl<T extends string>({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: { value: T; label: string; icon?: ReactNode }[];
    value: T;
    onChange: (value: T) => void;
}) {
    return (
        <div role="group" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-xl bg-gray-100 p-1">
            {options.map((o) => {
                const activa = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        aria-pressed={activa}
                        onClick={() => onChange(o.value)}
                        className={cn(
                            'focus-ring inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors [&_svg]:size-4',
                            activa ? 'elev-1 bg-[#fff] text-gray-900 dark:bg-white/10' : 'text-gray-500 hover:text-gray-900',
                        )}
                    >
                        {o.icon}
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

/** Encabezado de columna ordenable. aria-sort le dice al lector de pantalla cuál manda. */
export function SortableHead({
    field,
    label,
    sort,
    direction,
    onSort,
    className,
}: {
    field: string;
    label: string;
    sort: string;
    direction: SortDirection;
    onSort: (field: string) => void;
    className?: string;
}) {
    const activo = sort === field;
    const Icono = !activo ? ChevronsUpDown : direction === 'asc' ? ArrowUp : ArrowDown;
    return (
        <TableHead aria-sort={activo ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'} className={className}>
            <button
                type="button"
                onClick={() => onSort(field)}
                className={cn('focus-ring -mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 hover:text-gray-900', activo && 'text-gray-900')}
            >
                {label}
                <Icono className={cn('size-3.5', activo ? 'text-huv-ink' : 'text-gray-400')} aria-hidden="true" />
            </button>
        </TableHead>
    );
}

/** Fila de "no hay resultados" que ocupa todo el ancho de la tabla. */
export function DataTableEmpty({ colSpan, title, description, action }: { colSpan: number; title: string; description?: string; action?: ReactNode }) {
    return (
        <TableRow className="hover:bg-transparent">
            <TableCell colSpan={colSpan} className="py-14 text-center whitespace-normal">
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                {description && <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
                {action && <div className="mt-4">{action}</div>}
            </TableCell>
        </TableRow>
    );
}

/**
 * Fecha y hora compactas para celdas ("10/01/2026, 10:20 a. m."), el mismo formato que ya
 * usaban las tablas. GLPI entrega "YYYY-MM-DD HH:mm:ss": con el espacio, Safari no la entiende.
 */
export function formatTableDate(value: string | null | undefined, withTime = true): string {
    if (!value) return '—';
    const d = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('es-CO', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
}

/**
 * Texto de celda que se recorta con "…" pasado cierto ancho, con el valor completo al pasar el
 * mouse. Las localizaciones de GLPI ("Hospital > Subgerencia … > Consulta Externa") estiraban
 * la tabla hasta sacarle scroll lateral. Con lines={2} pasa a una segunda línea antes de
 * recortar, que en columnas de texto libre muestra más sin ensanchar la tabla.
 * (max-width no funciona en el <td>: va en el span.)
 */
export function TruncatedText({ value, lines = 1, className }: { value: string | null | undefined; lines?: 1 | 2; className?: string }) {
    if (!value) return <>—</>;
    return (
        <span
            title={value}
            className={cn('block max-w-[14rem]', lines === 2 ? 'line-clamp-2 whitespace-normal break-words' : 'truncate', className)}
        >
            {value}
        </span>
    );
}

/**
 * Fecha arriba y hora debajo, más tenue. Para tablas con muchas columnas cuyas filas ya
 * ocupan dos líneas: la fecha en una sola línea ("15/09/2026, 07:10 a. m.") pedía 160 px.
 */
export function DateTimeCell({ value }: { value: string | null | undefined }) {
    if (!value) return <>—</>;
    const d = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return <>{value}</>;
    return (
        <time dateTime={d.toISOString()} className="block leading-tight tabular-nums">
            <span className="block">{d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
            <span className="block text-xs text-gray-400">{d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
        </time>
    );
}

export const PER_PAGE_OPTIONS = [10, 15, 25, 50, 100, 500, 1000, 5000, 10000, 50000];

/**
 * Pie de la tabla: rango mostrado, filas por página y navegación. Toma el paginador de Laravel
 * tal cual; el primer y el último enlace son "anterior" y "siguiente".
 */
export function DataTablePagination({
    paginator,
    count,
    noun = 'registros',
    onPerPageChange,
    perPageOptions = PER_PAGE_OPTIONS,
}: {
    paginator: Paginator;
    /** Filas en la página actual, por si el paginador no trae `from`/`to`. */
    count: number;
    noun?: string;
    onPerPageChange: (perPage: string) => void;
    perPageOptions?: number[];
}) {
    const { current_page, last_page, per_page, total, links } = paginator;
    const desde = paginator.from ?? (total === 0 ? 0 : (current_page - 1) * per_page + 1);
    const hasta = paginator.to ?? (total === 0 ? 0 : desde + count - 1);
    const fmt = (n: number) => n.toLocaleString('es-CO');
    const anterior = links[0];
    const siguiente = links[links.length - 1];
    const paginas = links.slice(1, -1);
    const ir = (url: string | null) => url && router.visit(url);
    const etiquetaFilas = useId();

    return (
        <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm text-gray-600 sm:flex-row sm:px-5">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                <p>
                    {total === 0 ? (
                        <>Sin {noun}</>
                    ) : (
                        <>
                            <span className="font-medium text-gray-900 tabular-nums">
                                {fmt(desde)}–{fmt(hasta)}
                            </span>{' '}
                            de <span className="font-medium text-gray-900 tabular-nums">{fmt(total)}</span> {noun}
                        </>
                    )}
                </p>
                <div className="flex items-center gap-2">
                    <span id={etiquetaFilas}>Filas por página</span>
                    <Select value={String(per_page)} onValueChange={onPerPageChange}>
                        <SelectTrigger aria-labelledby={etiquetaFilas} className={cn(selectTriggerClass, 'h-8 w-[5.5rem]')}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {perPageOptions.map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                    {fmt(n)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {last_page > 1 && (
                <nav aria-label="Paginación" className="flex items-center gap-1">
                    <button
                        type="button"
                        aria-label="Página anterior"
                        disabled={!anterior?.url}
                        onClick={() => ir(anterior?.url ?? null)}
                        className={cn(btn.ghost, 'size-8 px-0')}
                    >
                        <ChevronLeft aria-hidden="true" />
                    </button>
                    {paginas.map((link, i) => {
                        // En móvil solo la página actual; el resto desde sm.
                        const visibleEnMovil = link.active;
                        if (!link.url) {
                            return (
                                <span key={`e${i}`} aria-hidden="true" className="hidden px-1 text-gray-400 sm:inline">
                                    …
                                </span>
                            );
                        }
                        return (
                            <button
                                key={link.label}
                                type="button"
                                onClick={() => ir(link.url)}
                                aria-current={link.active ? 'page' : undefined}
                                aria-label={`Página ${link.label}`}
                                className={cn(
                                    'focus-ring h-8 min-w-8 rounded-lg px-2 text-sm font-medium tabular-nums transition-colors',
                                    link.active ? 'bg-huv text-white' : 'text-gray-700 hover:bg-gray-100',
                                    !visibleEnMovil && 'hidden sm:inline-flex sm:items-center sm:justify-center',
                                )}
                            >
                                {link.label}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        aria-label="Página siguiente"
                        disabled={!siguiente?.url}
                        onClick={() => ir(siguiente?.url ?? null)}
                        className={cn(btn.ghost, 'size-8 px-0')}
                    >
                        <ChevronRight aria-hidden="true" />
                    </button>
                </nav>
            )}
        </div>
    );
}
