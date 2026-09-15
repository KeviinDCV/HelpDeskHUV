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
    children,
}: {
    id?: string;
    label?: string;
    onApply: () => void;
    onClear: () => void;
    canClear: boolean;
    children: ReactNode;
}) {
    return (
        <section id={id} aria-label={label} className="border-b bg-gray-50 px-4 py-4 sm:px-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
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
