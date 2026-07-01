import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router, Link } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Filter, X, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { HistoryEntry, categoryLabel, actionStyle, formatHistoryDate } from '@/lib/inventory-history';

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface HistorialProps {
    history: {
        data: HistoryEntry[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLinks[];
    };
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

const ACTIONS = [
    { value: 'added', label: 'Agregado' },
    { value: 'removed', label: 'Eliminado' },
    { value: 'modified', label: 'Modificado' },
    { value: 'baseline', label: 'Inicial' },
];

export default function Historial({ history, categories, filters }: HistorialProps) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [showFilters, setShowFilters] = React.useState(false);
    const [categoryFilter, setCategoryFilter] = React.useState(filters.category || 'all');
    const [actionFilter, setActionFilter] = React.useState(filters.action || 'all');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');

    const hasActiveFilters =
        (categoryFilter && categoryFilter !== 'all') ||
        (actionFilter && actionFilter !== 'all') ||
        !!dateFrom || !!dateTo;

    const buildParams = (overrides: Record<string, any> = {}): Record<string, any> => {
        const params: Record<string, any> = { per_page: filters.per_page, page: 1 };
        if (searchValue) params.search = searchValue;
        if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
        if (actionFilter && actionFilter !== 'all') params.action = actionFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        return { ...params, ...overrides };
    };

    const go = (params: Record<string, any>, replace = false) => {
        router.get('/inventario/historial', params, { preserveState: false, replace });
    };

    const handleSearch = () => go(buildParams());
    const applyFilters = () => go(buildParams(), true);

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
            <Head title="HelpDesk HUV - Historial de Inventario" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                            <span className="text-gray-400">/</span>
                            <Link href="/inventario/global" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inventario</Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Historial</span>
                        </div>
                    }
                />

                <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6">
                    <div className="bg-white shadow border border-gray-200">
                        {/* Header */}
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <History className="h-5 w-5 text-[#2c4370]" />
                                    Historial de cambios
                                </h1>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                    <div className="relative flex-1 sm:flex-initial">
                                        <Input type="text" placeholder="Buscar equipo o cambio..." className="w-full sm:w-72 pr-10 h-9" value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} />
                                        <Button aria-label="Buscar" size="sm" variant="ghost" className="absolute right-0 top-0 h-full px-3" onClick={handleSearch}>
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                                        className={`h-9 ${hasActiveFilters ? 'border-[#2c4370] text-[#2c4370]' : ''}`}>
                                        <Filter className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Filtros</span>
                                        {hasActiveFilters && <span className="ml-1 bg-[#2c4370] text-white text-xs w-5 h-5 flex items-center justify-center">!</span>}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="px-6 py-4 bg-gray-50 border-b">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                        <label htmlFor="filtro-categoria" className="text-xs text-gray-600 mb-1 block">Categoría</label>
                                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                            <SelectTrigger id="filtro-categoria" className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                {categories?.map((c) => <SelectItem key={c} value={c}>{categoryLabel(c)}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label htmlFor="filtro-accion" className="text-xs text-gray-600 mb-1 block">Acción</label>
                                        <Select value={actionFilter} onValueChange={setActionFilter}>
                                            <SelectTrigger id="filtro-accion" className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                {ACTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label htmlFor="filtro-desde" className="text-xs text-gray-600 mb-1 block">Desde</label>
                                        <Input id="filtro-desde" type="date" className="h-8 text-xs" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                                    </div>
                                    <div>
                                        <label htmlFor="filtro-hasta" className="text-xs text-gray-600 mb-1 block">Hasta</label>
                                        <Input id="filtro-hasta" type="date" className="h-8 text-xs" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
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
                                    onValueChange={(value) => router.get('/inventario/historial', { ...filters, per_page: value }, { preserveState: false })}
                                >
                                    <SelectTrigger className="w-16 sm:w-20 h-7 sm:h-8 text-xs sm:text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
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
                                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">registros</span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">
                                <span className="font-medium">{history.data.length}</span> de{' '}
                                <span className="font-medium">{history.total}</span>
                            </p>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold text-gray-900 text-xs">Equipo</TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs">Cambio</TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs">Categoría</TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs">Acción</TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs whitespace-nowrap">Fecha</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.data.length > 0 ? history.data.map((h) => {
                                        const st = actionStyle(h.action);
                                        return (
                                            <TableRow key={h.id} className="hover:bg-gray-50">
                                                <TableCell className="text-xs font-medium whitespace-nowrap">
                                                    {h.computer_name ? (
                                                        h.itemtype === 'Computer' && h.items_id ? (
                                                            <Link href={`/inventario/computadores/${h.items_id}`} className="text-[#2c4370] hover:underline">{h.computer_name}</Link>
                                                        ) : h.computer_name
                                                    ) : (
                                                        <span className="text-gray-400">#{h.items_id}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-900">{h.summary}</TableCell>
                                                <TableCell className="text-xs">
                                                    <span className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700">{categoryLabel(h.category)}</span>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <span className={`px-2 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-500 whitespace-nowrap">{formatHistoryDate(h.changed_at)}</TableCell>
                                            </TableRow>
                                        );
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-sm text-gray-500 py-8">
                                                No hay cambios registrados con los filtros aplicados.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                                Página {history.current_page} de {history.last_page}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
                                {history.links.map((link: PaginationLinks, index: number) => {
                                    const isMobileVisible = index === 0 || index === history.links.length - 1 || link.active;
                                    if (index === 0) {
                                        return (
                                            <Button key={index} aria-label="Página anterior" variant="outline" size="sm" disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0"
                                                onClick={() => link.url && router.visit(link.url)}>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    if (index === history.links.length - 1) {
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
