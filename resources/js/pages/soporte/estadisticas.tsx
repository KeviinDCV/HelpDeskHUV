import { FilterLabel, SegmentedControl } from '@/components/data-table';
import { GLPIFooter } from '@/components/glpi-footer';
import { GLPIHeader } from '@/components/glpi-header';
import { PageHeader } from '@/components/page-header';
import { ESTADO, NOMBRE_PRIORIDAD, PRIORIDAD, PriorityPill, StatusPill } from '@/components/ticket-pills';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { categoriaCorta, fechaCompleta, haceCuanto } from '@/lib/ticket-format';
import { btn, fieldClass, filterSelectClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronDown, Download, FileSpreadsheet, Filter, SearchX, X } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

const RUTA = '/soporte/estadisticas';

interface Mes {
    key: string;
    month: string;
    count: number;
}

interface StatisticsProps {
    stats: { total: number; nuevos: number; en_curso: number; en_espera: number; resueltos: number };
    byStatus: { code: number; status: string; count: number; percentage: number }[];
    byPriority: { code: number; priority: string; count: number; percentage: number }[];
    byTechnician: { technician: string; total: number; abiertos: number; cerrados: number }[];
    byCategory: { category: string; completename: string | null; count: number }[];
    byMonth: Mes[];
    recentCases: { id: number; name: string; status: string; status_code: number; priority: number; created_at: string }[];
    filters: { date_from: string; date_to: string; status: string; priority: string; technician_id: string; category_id: string };
    technicians: { id: number; name: string | null }[];
    categories: { id: number; name: string; completename: string | null }[];
}

/** Estados de GLPI para el filtro (antes el desplegable mandaba 4 = "Resuelto", que en GLPI es "En espera"). */
const ESTADOS = [
    { value: '1', label: 'Nuevo' },
    { value: '2', label: 'En curso (asignado)' },
    { value: '3', label: 'En curso (planificado)' },
    { value: '4', label: 'En espera' },
    { value: '5', label: 'Resuelto' },
    { value: '6', label: 'Cerrado' },
];

/** De urgente a muy baja. Antes 1 decía "Muy alta": filtraba justo lo contrario y faltaba Urgente. */
const PRIORIDADES = [6, 5, 4, 3, 2, 1].map((p) => ({ value: String(p), label: NOMBRE_PRIORIDAD[p] }));

const numero = (n: number) => n.toLocaleString('es-CO');
const formatoPorcentaje = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 1 });
const porcentaje = (parte: number, total: number) => formatoPorcentaje.format(total > 0 ? parte / total : 0);

function fechaCorta(iso: string) {
    const [a, m, d] = iso.split('-').map(Number);
    return new Date(a, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function etiquetaMes(key: string) {
    const [anio, mes] = key.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, 1);
    return {
        anio,
        mes,
        corto: fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.', ''),
        largo: fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
    };
}

/** Marcas del eje en números redondos (0 · 1.000 · 2.000 · 3.000), nunca en 713 o 1.426. */
function escala(max: number) {
    if (max <= 0) return { tope: 1, marcas: [0, 1] };
    const bruto = max / 4;
    const magnitud = 10 ** Math.floor(Math.log10(bruto));
    const paso = Math.max(1, [1, 2, 5, 10].map((f) => f * magnitud).find((p) => p >= bruto) ?? 10 * magnitud);
    const tope = Math.ceil(max / paso) * paso;
    const marcas: number[] = [];
    for (let t = 0; t <= tope; t += paso) marcas.push(t);
    return { tope, marcas };
}

function Tarjeta({ titulo, descripcion, acciones, children, className }: { titulo: string; descripcion?: ReactNode; acciones?: ReactNode; children: ReactNode; className?: string }) {
    const id = useId();
    return (
        <section aria-labelledby={id} className={cn('surface-card min-w-0 p-5 sm:p-6', className)}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 id={id} className="text-base font-semibold text-gray-900">
                        {titulo}
                    </h2>
                    {descripcion && <p className="mt-0.5 text-sm text-gray-500">{descripcion}</p>}
                </div>
                {acciones}
            </div>
            {children}
        </section>
    );
}

interface FilaBarra {
    clave: string | number;
    etiqueta: string;
    titulo?: string;
    punto?: string;
    valor: number;
}

/**
 * Barras horizontales como tabla: cada valor está escrito (la barra solo lo acompaña), así que
 * la tabla es a la vez la gráfica y su versión accesible. Un solo color: es una sola serie; lo
 * que identifica cada fila es su nombre, con el punto de color que ya usa la lista de casos.
 */
function TablaBarras({ titulo, columna, filas, total }: { titulo: string; columna: string; filas: FilaBarra[]; total: number }) {
    const max = Math.max(1, ...filas.map((f) => f.valor));
    if (filas.length === 0) return <p className="py-6 text-center text-sm text-gray-500">Sin datos con estos filtros.</p>;
    return (
        <table className="tabla-grafica w-full text-sm">
            <caption className="sr-only">{titulo}</caption>
            <thead>
                <tr>
                    <th scope="col" className="p-0">
                        <span className="sr-only">{columna}</span>
                    </th>
                    <td className="hidden p-0 sm:table-cell" />
                    <th scope="col" className="p-0">
                        <span className="sr-only">Casos</span>
                    </th>
                    <th scope="col" className="p-0">
                        <span className="sr-only">Porcentaje del total</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {filas.map((f) => (
                    <tr key={f.clave}>
                        {/* En móvil (sin barra) el rótulo toma el espacio que sobra y se recorta: max-w-0 evita
                            que su texto sin cortes ensanche la tabla por fuera de la tarjeta. */}
                        <th scope="row" className="w-full max-w-0 py-1.5 pr-4 text-left font-normal text-gray-700 sm:w-[1%] sm:max-w-none sm:whitespace-nowrap">
                            <span className="flex max-w-[16rem] items-center gap-2" title={f.titulo}>
                                {f.punto && <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', f.punto)} />}
                                <span className="truncate">{f.etiqueta}</span>
                            </span>
                        </th>
                        <td aria-hidden="true" className="hidden py-1.5 sm:table-cell">
                            <div className="h-2">
                                <div className="h-full rounded-r bg-huv" style={{ width: `${(f.valor / max) * 100}%`, minWidth: f.valor > 0 ? 2 : 0 }} />
                            </div>
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-1.5 pl-4 text-right font-medium tabular-nums text-gray-900">{numero(f.valor)}</td>
                        <td className="w-[1%] whitespace-nowrap py-1.5 pl-3 text-right text-xs tabular-nums text-gray-500">{porcentaje(f.valor, total)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

/**
 * Columnas por mes. Solo se rotulan el máximo y el mes actual (el resto lo dan el eje, el
 * tooltip y la vista de tabla). El mes en curso va en un tono más claro: todavía no termina y
 * sin esa marca su columna, siempre más baja, parece una caída.
 */
function GraficaMensual({ meses }: { meses: Mes[] }) {
    const [vista, setVista] = useState<'grafica' | 'tabla'>('grafica');
    const [activo, setActivo] = useState<number | null>(null);

    const hoy = new Date();
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    const etiquetas = meses.map((m) => etiquetaMes(m.key));
    const max = Math.max(0, ...meses.map((m) => m.count));
    const { tope, marcas } = escala(max);
    const iMax = meses.findIndex((m) => m.count === max);
    const ultimo = meses.length - 1;
    const hayEnCurso = meses[ultimo]?.key === mesActual;

    if (meses.length === 0) return <p className="py-6 text-center text-sm text-gray-500">Sin datos.</p>;

    const resumen =
        `Casos por mes, de ${etiquetas[0].largo} a ${etiquetas[ultimo].largo}. ` +
        `Máximo: ${numero(max)} en ${etiquetas[iMax].largo}.` +
        (hayEnCurso ? ` El mes actual, aún en curso, lleva ${numero(meses[ultimo].count)}.` : '');

    return (
        <Tarjeta
            titulo="Casos por mes"
            descripcion="Casos abiertos en los últimos 12 meses. No usa el rango de fechas; sí los demás filtros."
            acciones={
                <SegmentedControl
                    label="Vista de casos por mes"
                    options={[
                        { value: 'grafica', label: 'Gráfica' },
                        { value: 'tabla', label: 'Tabla' },
                    ]}
                    value={vista}
                    onChange={setVista}
                />
            }
        >
            {vista === 'grafica' && max === 0 ? (
                // Pasa con filtros que dejan casos en otras fechas: el total no es 0, pero estos 12 meses sí
                <p className="py-10 text-center text-sm text-gray-500">Sin casos abiertos en los últimos 12 meses con estos filtros.</p>
            ) : vista === 'grafica' ? (
                <>
                    <div role="img" aria-label={resumen} className="flex gap-2 pt-6">
                        {/* Eje Y */}
                        <div aria-hidden="true" className="relative h-52 w-11 shrink-0">
                            {marcas.map((t) => (
                                <span
                                    key={t}
                                    className="absolute right-0 translate-y-1/2 text-[11px] leading-none tabular-nums text-gray-400"
                                    style={{ bottom: `${(t / tope) * 100}%` }}
                                >
                                    {numero(t)}
                                </span>
                            ))}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="relative h-52">
                                {marcas.map((t) => (
                                    <div
                                        key={t}
                                        aria-hidden="true"
                                        className={cn('absolute inset-x-0 h-px', t === 0 ? 'bg-black/20 dark:bg-white/25' : 'bg-black/[0.06] dark:bg-white/[0.07]')}
                                        style={{ bottom: `${(t / tope) * 100}%` }}
                                    />
                                ))}
                                <div className="relative flex h-full items-end">
                                    {meses.map((m, i) => {
                                        const alto = (m.count / tope) * 100;
                                        const enCurso = i === ultimo && hayEnCurso;
                                        const rotulo = (i === iMax || i === ultimo) && activo !== i;
                                        const lado = i < 2 ? 'left-0' : i > ultimo - 2 ? 'right-0' : 'left-1/2 -translate-x-1/2';
                                        return (
                                            <div
                                                key={m.key}
                                                className="relative flex h-full flex-1 items-end justify-center px-[3px]"
                                                onMouseEnter={() => setActivo(i)}
                                                onMouseLeave={() => setActivo(null)}
                                            >
                                                <div
                                                    className={cn(
                                                        'w-full max-w-6 rounded-t transition-colors',
                                                        enCurso ? 'bg-huv/40 dark:bg-huv/60' : activo === i ? 'bg-huv-hover' : 'bg-huv',
                                                    )}
                                                    style={{ height: `${alto}%`, minHeight: m.count > 0 ? 2 : 0 }}
                                                />
                                                {rotulo && (
                                                    <span
                                                        className="absolute text-[11px] font-medium leading-none tabular-nums text-gray-700"
                                                        style={{ bottom: `calc(${alto}% + 5px)` }}
                                                    >
                                                        {numero(m.count)}
                                                    </span>
                                                )}
                                                {activo === i && (
                                                    <div
                                                        className={cn(
                                                            'pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-[#1f2937] px-2.5 py-1.5 text-xs text-[#fff] shadow-lg dark:bg-[#e4e4e7] dark:text-[#18181b]',
                                                            lado,
                                                        )}
                                                        style={{ bottom: `calc(${alto}% + 8px)` }}
                                                    >
                                                        <p className="first-letter:uppercase opacity-80">{etiquetas[i].largo}</p>
                                                        <p className="font-semibold">
                                                            {numero(m.count)} {m.count === 1 ? 'caso' : 'casos'}
                                                            {enCurso && <span className="font-normal opacity-80"> · en curso</span>}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Eje X: el año solo donde empieza (primer mes y enero). En móvil no caben
                                doce rótulos: va uno sí y uno no, contando desde el último. */}
                            <div aria-hidden="true" className="flex">
                                {meses.map((m, i) => (
                                    <div
                                        key={m.key}
                                        className={cn('min-w-0 flex-1 pt-2 text-center text-[11px] leading-tight text-gray-500', (ultimo - i) % 2 === 1 && 'invisible sm:visible')}
                                    >
                                        <span className="block">{etiquetas[i].corto}</span>
                                        {(i === 0 || etiquetas[i].mes === 1) && <span className="block text-gray-400">{etiquetas[i].anio}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {hayEnCurso && (
                        <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-huv/40 dark:bg-huv/60" />
                            Mes en curso: la cifra sigue sumando
                        </p>
                    )}
                </>
            ) : (
                <div className="max-w-md">
                    <table className="tabla-grafica w-full text-sm">
                        <caption className="sr-only">Casos por mes, últimos 12 meses</caption>
                        <thead>
                            <tr className="text-left text-xs text-gray-500">
                                <th scope="col" className="pb-2 font-medium">
                                    Mes
                                </th>
                                <th scope="col" className="pb-2 text-right font-medium">
                                    Casos
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {meses.map((m, i) => (
                                <tr key={m.key} className="border-t">
                                    <td className="py-2 text-gray-700">
                                        <span className="first-letter:uppercase inline-block">{etiquetas[i].largo}</span>
                                        {i === ultimo && hayEnCurso && <span className="ml-1.5 text-xs text-gray-400"> (en curso)</span>}
                                    </td>
                                    <td className="py-2 text-right font-medium tabular-nums text-gray-900">{numero(m.count)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Tarjeta>
    );
}

export default function Estadisticas({
    stats = { total: 0, nuevos: 0, en_curso: 0, en_espera: 0, resueltos: 0 },
    byStatus = [],
    byPriority = [],
    byTechnician = [],
    byCategory = [],
    byMonth = [],
    recentCases = [],
    filters = { date_from: '', date_to: '', status: '', priority: '', technician_id: '', category_id: '' },
    technicians = [],
    categories = [],
}: StatisticsProps) {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [priorityFilter, setPriorityFilter] = useState(filters.priority || 'all');
    const [technicianFilter, setTechnicianFilter] = useState(filters.technician_id || 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters.category_id || 'all');
    const [verTodosTecnicos, setVerTodosTecnicos] = useState(false);

    // MySQL devuelve los SUM() como texto ("12"): se normaliza antes de sumar o formatear.
    const tecnicos = byTechnician.map((t) => ({ ...t, total: Number(t.total), abiertos: Number(t.abiertos), cerrados: Number(t.cerrados) }));
    const tecnicosVisibles = verTodosTecnicos ? tecnicos : tecnicos.slice(0, 10);

    const rangoInvalido = Boolean(dateFrom && dateTo && dateFrom > dateTo);

    // Todas las acciones (aplicar y exportar) salen del estado actual de los controles.
    const parametros = (): Record<string, string> => {
        const valores: Record<string, string> = {
            date_from: dateFrom,
            date_to: dateTo,
            status: statusFilter,
            priority: priorityFilter,
            technician_id: technicianFilter,
            category_id: categoryFilter,
        };
        return Object.fromEntries(Object.entries(valores).filter(([, v]) => v && v !== 'all'));
    };

    const aplicar = () => {
        if (rangoInvalido) return;
        router.get(RUTA, parametros(), { preserveScroll: true });
    };

    const limpiar = () => {
        setDateFrom('');
        setDateTo('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setTechnicianFilter('all');
        setCategoryFilter('all');
        router.get(RUTA, {}, { preserveScroll: true });
    };

    const exportar = (tipo: 'general' | 'detailed') => {
        window.location.href = `${RUTA}/export?${new URLSearchParams({ export: tipo, ...parametros() })}`;
    };

    // Resumen de lo aplicado (lo que de verdad muestran las cifras, no lo que hay en los controles)
    const nombreTecnico = (id: string) => {
        const t = technicians.find((x) => String(x.id) === id);
        return t ? (t.name ?? `Usuario ${t.id}`) : `Técnico ${id}`;
    };
    const nombreCategoria = (id: string) => {
        const c = categories.find((x) => String(x.id) === id);
        return c ? (categoriaCorta(c.completename) ?? c.name) : `Categoría ${id}`;
    };
    const aplicados: string[] = [];
    if (filters.date_from && filters.date_to) aplicados.push(`${fechaCorta(filters.date_from)} – ${fechaCorta(filters.date_to)}`);
    else if (filters.date_from) aplicados.push(`desde ${fechaCorta(filters.date_from)}`);
    else if (filters.date_to) aplicados.push(`hasta ${fechaCorta(filters.date_to)}`);
    if (filters.status) aplicados.push(ESTADOS.find((e) => e.value === String(filters.status))?.label ?? `Estado ${filters.status}`);
    if (filters.priority) aplicados.push(`Prioridad ${(NOMBRE_PRIORIDAD[Number(filters.priority)] ?? filters.priority).toLowerCase()}`);
    if (filters.technician_id) aplicados.push(nombreTecnico(String(filters.technician_id)));
    if (filters.category_id) aplicados.push(nombreCategoria(String(filters.category_id)));

    const hayCambios = [dateFrom, dateTo].some(Boolean) || [statusFilter, priorityFilter, technicianFilter, categoryFilter].some((v) => v !== 'all');
    const puedeLimpiar = hayCambios || aplicados.length > 0;

    const cifras = [
        { etiqueta: 'Casos', valor: stats.total, punto: 'bg-huv', detalle: aplicados.length ? 'con los filtros aplicados' : 'registrados en total' },
        { etiqueta: 'Nuevos', valor: stats.nuevos, punto: ESTADO[1].punto, detalle: `${porcentaje(stats.nuevos, stats.total)} del total` },
        { etiqueta: 'En curso', valor: stats.en_curso, punto: ESTADO[2].punto, detalle: `${porcentaje(stats.en_curso, stats.total)} · asignados o planificados` },
        { etiqueta: 'En espera', valor: stats.en_espera, punto: ESTADO[4].punto, detalle: `${porcentaje(stats.en_espera, stats.total)} del total` },
        { etiqueta: 'Resueltos o cerrados', valor: stats.resueltos, punto: ESTADO[5].punto, detalle: `${porcentaje(stats.resueltos, stats.total)} del total` },
    ];

    const opcionesTecnicos = [
        { value: 'all', label: 'Todos' },
        ...technicians.map((t) => ({ value: String(t.id), label: t.name ?? `Usuario ${t.id}` })),
    ];
    const opcionesCategorias = [
        { value: 'all', label: 'Todas' },
        ...categories.filter((c) => c.completename || c.name).map((c) => ({ value: String(c.id), label: c.completename || c.name })),
    ];

    return (
        <>
            <Head title="HelpDesk HUV - Estadísticas" />
            <div className="flex min-h-screen flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Inicio
                            </Link>
                            <span className="text-gray-400">/</span>
                            <Link href="/soporte/casos" className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Soporte
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Estadísticas</span>
                        </div>
                    }
                />

                <main className="flex-1">
                    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-6 sm:px-6">
                        <PageHeader
                            title="Estadísticas"
                            description="Volumen de casos, estados, prioridades y carga por técnico."
                            actions={
                                <>
                                    <button
                                        type="button"
                                        onClick={() => exportar('general')}
                                        className={btn.secondary}
                                        title="Excel con las cifras, estados, prioridades, técnicos, categorías y los últimos 12 meses"
                                    >
                                        <Download aria-hidden="true" />
                                        Exportar resumen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => exportar('detailed')}
                                        className={btn.secondary}
                                        title="Excel con un renglón por caso (hasta 5.000), con los filtros de esta página"
                                    >
                                        <FileSpreadsheet aria-hidden="true" />
                                        Exportar detalle
                                    </button>
                                </>
                            }
                        />

                        {/* Filtros: una sola fila para todo lo que hay debajo */}
                        <section aria-label="Filtros" className="surface-card px-4 py-4 sm:px-5">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    aplicar();
                                }}
                            >
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                    <div>
                                        <FilterLabel htmlFor="est-desde">Abierto desde</FilterLabel>
                                        <input
                                            id="est-desde"
                                            type="date"
                                            value={dateFrom}
                                            max={dateTo || undefined}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            aria-invalid={rangoInvalido || undefined}
                                            aria-describedby={rangoInvalido ? 'est-rango-error' : undefined}
                                            className={cn(fieldClass, 'h-9')}
                                        />
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="est-hasta">Abierto hasta</FilterLabel>
                                        <input
                                            id="est-hasta"
                                            type="date"
                                            value={dateTo}
                                            min={dateFrom || undefined}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            aria-invalid={rangoInvalido || undefined}
                                            aria-describedby={rangoInvalido ? 'est-rango-error' : undefined}
                                            className={cn(fieldClass, 'h-9')}
                                        />
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="est-estado">Estado</FilterLabel>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger id="est-estado" className={filterSelectClass}>
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {ESTADOS.map((e) => (
                                                    <SelectItem key={e.value} value={e.value}>
                                                        {e.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="est-prioridad">Prioridad</FilterLabel>
                                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                            <SelectTrigger id="est-prioridad" className={filterSelectClass}>
                                                <SelectValue placeholder="Todas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                {PRIORIDADES.map((p) => (
                                                    <SelectItem key={p.value} value={p.value}>
                                                        {p.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="est-tecnico">Técnico</FilterLabel>
                                        <SearchableSelect
                                            id="est-tecnico"
                                            value={technicianFilter}
                                            onValueChange={setTechnicianFilter}
                                            options={opcionesTecnicos}
                                            placeholder="Todos"
                                            triggerClassName={filterSelectClass}
                                        />
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="est-categoria">Categoría</FilterLabel>
                                        <SearchableSelect
                                            id="est-categoria"
                                            value={categoryFilter}
                                            onValueChange={setCategoryFilter}
                                            options={opcionesCategorias}
                                            placeholder="Todas"
                                            triggerClassName={filterSelectClass}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                                    {rangoInvalido && (
                                        <p id="est-rango-error" role="alert" className="mr-auto text-sm text-red-600">
                                            La fecha «desde» es posterior a la fecha «hasta».
                                        </p>
                                    )}
                                    {puedeLimpiar && (
                                        <button type="button" onClick={limpiar} className={cn(btn.ghost, 'h-8 px-3')}>
                                            <X aria-hidden="true" />
                                            Limpiar filtros
                                        </button>
                                    )}
                                    <button type="submit" disabled={rangoInvalido} className={cn(btn.primary, 'h-8 px-3')}>
                                        Aplicar filtros
                                    </button>
                                </div>
                            </form>
                        </section>

                        {aplicados.length > 0 && (
                            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-huv-soft px-4 py-2.5 text-sm text-huv-ink">
                                <Filter className="size-4 shrink-0" aria-hidden="true" />
                                <span>
                                    Mostrando <strong className="font-semibold">{aplicados.join(' · ')}</strong>
                                </span>
                            </p>
                        )}

                        {/* Cifras */}
                        <section aria-label="Resumen de casos" className="surface-card overflow-hidden">
                            <ul className="grid grid-cols-2 lg:grid-cols-5">
                                {cifras.map((c, i) => (
                                    <li
                                        key={c.etiqueta}
                                        // En móvil la primera ocupa toda la fila y las demás van de a dos; en escritorio, cinco columnas.
                                        className={cn(
                                            'flex flex-col px-5 py-4 sm:px-6',
                                            i === 0 && 'col-span-2 lg:col-span-1',
                                            i > 0 && 'border-t lg:border-t-0 lg:border-l',
                                            i > 0 && i % 2 === 0 && 'border-l',
                                        )}
                                    >
                                        <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                            <span aria-hidden="true" className={cn('size-2 rounded-full', c.punto)} />
                                            {c.etiqueta}
                                        </span>
                                        <span className="mt-2 text-[2rem] font-semibold leading-none tracking-tight text-gray-900">{numero(c.valor)}</span>
                                        <span className="mt-2 text-xs text-gray-500">{c.detalle}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {stats.total === 0 ? (
                            <section className="surface-card flex flex-col items-center px-6 py-14 text-center">
                                <SearchX className="size-8 text-gray-400" aria-hidden="true" />
                                <h2 className="mt-3 text-base font-semibold text-gray-900">No hay casos con estos filtros</h2>
                                <p className="mt-1 max-w-sm text-sm text-gray-500">Amplía el rango de fechas o quita algún filtro para ver las estadísticas.</p>
                                {aplicados.length > 0 && (
                                    <button type="button" onClick={limpiar} className={cn(btn.secondary, 'mt-5')}>
                                        Limpiar filtros
                                    </button>
                                )}
                            </section>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                    <Tarjeta titulo="Por estado" descripcion="Estado actual de los casos.">
                                        <TablaBarras
                                            titulo="Casos por estado"
                                            columna="Estado"
                                            total={stats.total}
                                            filas={byStatus.map((s) => ({ clave: s.code, etiqueta: s.status, punto: ESTADO[s.code]?.punto, valor: Number(s.count) }))}
                                        />
                                    </Tarjeta>
                                    <Tarjeta titulo="Por prioridad" descripcion="De urgente a muy baja.">
                                        <TablaBarras
                                            titulo="Casos por prioridad"
                                            columna="Prioridad"
                                            total={stats.total}
                                            filas={byPriority.map((p) => ({ clave: p.code, etiqueta: p.priority, punto: PRIORIDAD[p.code]?.punto, valor: Number(p.count) }))}
                                        />
                                    </Tarjeta>
                                </div>

                                <GraficaMensual meses={byMonth.map((m) => ({ ...m, count: Number(m.count) }))} />

                                {/* Técnicos */}
                                <section aria-labelledby="est-tecnicos" className="surface-card overflow-hidden">
                                    <div className="px-5 pt-5 pb-4 sm:px-6">
                                        <h2 id="est-tecnicos" className="text-base font-semibold text-gray-900">
                                            Carga por técnico
                                        </h2>
                                        <p className="mt-0.5 text-sm text-gray-500">
                                            Casos asignados a cada técnico. «Sin resolver» reúne los nuevos, en curso y en espera.
                                        </p>
                                    </div>
                                    {tecnicos.length === 0 ? (
                                        <p className="px-6 pb-6 text-sm text-gray-500">Sin casos asignados con estos filtros.</p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="first:pl-5 sm:first:pl-6">Técnico</TableHead>
                                                    <TableHead className="text-right">Asignados</TableHead>
                                                    <TableHead className="text-right">Sin resolver</TableHead>
                                                    <TableHead className="text-right">Resueltos o cerrados</TableHead>
                                                    <TableHead className="w-48 last:pr-5 sm:last:pr-6">Resolución</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {tecnicosVisibles.map((t, i) => {
                                                    const tasa = t.total > 0 ? t.cerrados / t.total : 0;
                                                    const sinAsignar = t.technician === 'Sin asignar';
                                                    return (
                                                        <TableRow key={`${t.technician}-${i}`}>
                                                            <TableCell className={cn('font-medium first:pl-5 sm:first:pl-6', sinAsignar ? 'text-gray-500' : 'text-gray-900')}>
                                                                {t.technician}
                                                            </TableCell>
                                                            <TableCell className="text-right tabular-nums text-gray-900">{numero(t.total)}</TableCell>
                                                            <TableCell className="text-right tabular-nums text-gray-700">{numero(t.abiertos)}</TableCell>
                                                            <TableCell className="text-right tabular-nums text-gray-700">{numero(t.cerrados)}</TableCell>
                                                            <TableCell className="last:pr-5 sm:last:pr-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div aria-hidden="true" className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-huv/15">
                                                                        <div className="h-full rounded-full bg-huv" style={{ width: `${tasa * 100}%` }} />
                                                                    </div>
                                                                    <span className="text-sm tabular-nums text-gray-700">{porcentaje(t.cerrados, t.total)}</span>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    )}
                                    {tecnicos.length > 10 && (
                                        <div className="border-t px-5 py-2.5 sm:px-6">
                                            <button
                                                type="button"
                                                aria-expanded={verTodosTecnicos}
                                                onClick={() => setVerTodosTecnicos((v) => !v)}
                                                className={cn(btn.ghost, 'h-8 w-full px-3 text-huv-ink hover:text-huv-ink')}
                                            >
                                                <ChevronDown aria-hidden="true" className={cn('transition-transform', verTodosTecnicos && 'rotate-180')} />
                                                {verTodosTecnicos ? 'Ver menos' : `Ver los ${tecnicos.length - 10} restantes`}
                                            </button>
                                        </div>
                                    )}
                                </section>

                                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                    <Tarjeta titulo="Categorías más frecuentes" descripcion="Las 10 con más casos.">
                                        <TablaBarras
                                            titulo="Categorías con más casos"
                                            columna="Categoría"
                                            total={stats.total}
                                            filas={byCategory.map((c, i) => ({
                                                clave: `${c.completename ?? c.category}-${i}`,
                                                // GLPI tiene alguna categoría con el nombre vacío
                                                etiqueta: categoriaCorta(c.completename) || c.category || 'Sin nombre',
                                                titulo: c.completename || c.category || 'Sin nombre',
                                                valor: Number(c.count),
                                            }))}
                                        />
                                    </Tarjeta>

                                    <Tarjeta titulo="Últimos casos" descripcion="Los 10 más recientes con estos filtros.">
                                        <ul className="-mx-2">
                                            {recentCases.map((c) => (
                                                <li key={c.id}>
                                                    <Link
                                                        href={`/soporte/casos/${c.id}`}
                                                        className="focus-ring block rounded-lg px-2 py-2 text-gray-900 transition-colors hover:bg-gray-50"
                                                    >
                                                        <span className="block truncate text-sm font-medium" title={c.name}>
                                                            {c.name}
                                                        </span>
                                                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                            <span className="tabular-nums">#{c.id}</span>
                                                            <StatusPill status={c.status_code} name={c.status} />
                                                            <PriorityPill priority={Number(c.priority)} name={NOMBRE_PRIORIDAD[Number(c.priority)] ?? 'Sin definir'} />
                                                            <time dateTime={c.created_at.replace(' ', 'T')} title={fechaCompleta(c.created_at)} className="ml-auto">
                                                                {haceCuanto(c.created_at)}
                                                            </time>
                                                        </span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </Tarjeta>
                                </div>
                            </>
                        )}
                    </div>
                </main>

                <GLPIFooter />
            </div>
        </>
    );
}
