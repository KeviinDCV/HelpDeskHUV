/**
 * Piezas de las páginas de detalle (Ver computador, monitor, impresora…): encabezado, secciones,
 * pares etiqueta/dato y listas relacionadas. Mismo aspecto en todas; cada página decide QUÉ datos
 * muestra (los mismos que ya mostraba).
 */
import { StatusPill } from '@/components/ticket-pills';
import { parseFecha } from '@/lib/ticket-format';
import { btn } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useId, type ReactNode } from 'react';

/** "15 sept 2026, 07:12 a. m." a partir de "2026-09-15 07:12:00" (sin conversiones de zona). */
export function fechaFicha(valor: string | null | undefined, conHora = true): string {
    if (!valor) return '';
    const d = parseFecha(valor);
    if (Number.isNaN(d.getTime())) return valor;
    const mes = d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
    const base = `${d.getDate()} ${mes} ${d.getFullYear()}`;
    return conHora ? `${base}, ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}` : base;
}

/** Título de la página de detalle, con "Volver" y las acciones (Editar…). */
export function FichaEncabezado({ titulo, detalle, volverHref, volverTexto = 'Volver', acciones }: { titulo: string; detalle?: ReactNode; volverHref: string; volverTexto?: string; acciones?: ReactNode }) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <Link href={volverHref} className="focus-ring inline-flex items-center gap-1.5 rounded text-sm font-medium text-gray-500 hover:text-gray-900">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {volverTexto}
                </Link>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight break-words text-gray-900">{titulo}</h1>
                {detalle && <div className="mt-1 text-sm text-gray-500">{detalle}</div>}
            </div>
            {acciones && <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div>}
        </div>
    );
}

/** Tarjeta con título (y un ícono o un contador opcionales). */
export function FichaSeccion({ titulo, icono, contador, acciones, children, className, sinRelleno = false }: {
    titulo: string;
    icono?: ReactNode;
    contador?: number;
    acciones?: ReactNode;
    children: ReactNode;
    className?: string;
    /** Para tablas que van de borde a borde */
    sinRelleno?: boolean;
}) {
    const id = useId();
    return (
        <section aria-labelledby={id} className={cn('surface-card min-w-0', sinRelleno ? 'overflow-hidden' : 'p-5 sm:p-6', className)}>
            <div className={cn('flex items-center justify-between gap-3', sinRelleno ? 'px-5 pt-5 pb-3 sm:px-6' : 'mb-4')}>
                <h2 id={id} className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    {icono}
                    {titulo}
                    {contador !== undefined && <span className="text-sm font-normal tabular-nums text-gray-500">({contador})</span>}
                </h2>
                {acciones}
            </div>
            {children}
        </section>
    );
}

/** Rejilla de pares etiqueta/dato. Un dato vacío se muestra como "—" en gris legible. */
export function Datos({ children, columnas = 2 }: { children: ReactNode; columnas?: 1 | 2 | 3 }) {
    return (
        <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-4', columnas >= 2 && 'sm:grid-cols-2', columnas === 3 && 'lg:grid-cols-3')}>{children}</dl>
    );
}

export function Dato({ etiqueta, children, mono = false, ancho = false, vacio = '—' }: { etiqueta: string; children?: ReactNode; mono?: boolean; ancho?: boolean; vacio?: string }) {
    const tiene = children !== null && children !== undefined && children !== '' && children !== false;
    return (
        <div className={cn('min-w-0', ancho && 'sm:col-span-full')}>
            <dt className="text-xs font-medium text-gray-500">{etiqueta}</dt>
            <dd className={cn('mt-1 text-sm break-words', tiene ? 'text-gray-900' : 'text-gray-500', mono && tiene && 'font-mono')}>{tiene ? children : vacio}</dd>
        </div>
    );
}

export interface CasoRelacionado {
    id: number;
    name: string;
    status: number;
    date: string;
}

const NOMBRE_ESTADO: Record<number, string> = { 1: 'Nuevo', 2: 'En curso (asignado)', 3: 'En curso (planificado)', 4: 'En espera', 5: 'Resuelto', 6: 'Cerrado' };

/** Casos relacionados con el equipo: número, título, estado y fecha. */
export function CasosRelacionados({ casos, href, vacio = 'Sin casos relacionados' }: { casos: CasoRelacionado[]; href: (id: number) => string; vacio?: string }) {
    if (casos.length === 0) return <p className="text-sm text-gray-500">{vacio}</p>;
    return (
        <ul className="-mx-2 space-y-0.5">
            {casos.map((c) => (
                <li key={c.id}>
                    <Link href={href(c.id)} className="focus-ring block rounded-lg px-2 py-2 text-gray-900 transition-colors hover:bg-gray-50">
                        <span className="line-clamp-2 text-sm font-medium">
                            <span className="tabular-nums text-gray-500">#{c.id}</span> {c.name}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <StatusPill status={c.status} name={NOMBRE_ESTADO[c.status] ?? 'Desconocido'} />
                            {c.date && <time dateTime={c.date.replace(' ', 'T')}>{fechaFicha(c.date, false)}</time>}
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

export interface EquipoConectado {
    id: number;
    name: string;
    serial: string | null;
    location_name: string | null;
}

/** Computadores a los que está conectado un equipo (monitor, impresora…), con enlace a su ficha. */
export function EquiposConectados({ equipos, vacio = 'No conectado a ningún equipo' }: { equipos: EquipoConectado[]; vacio?: string }) {
    if (equipos.length === 0) return <p className="text-sm text-gray-500">{vacio}</p>;
    return (
        <ul className="-mx-2 space-y-0.5">
            {equipos.map((c) => (
                <li key={c.id}>
                    <Link href={`/inventario/computadores/${c.id}`} className="focus-ring block rounded-lg px-2 py-2 text-gray-900 transition-colors hover:bg-gray-50">
                        <span className="block text-sm font-medium">{c.name}</span>
                        {c.serial && <span className="block font-mono text-xs text-gray-500">S/N: {c.serial}</span>}
                        {c.location_name && <span className="mt-0.5 block text-xs text-gray-500">{c.location_name}</span>}
                    </Link>
                </li>
            ))}
        </ul>
    );
}

/** Solo el Administrador edita equipos (edit/update devuelven 403 a los demás). */
export function useEsAdministrador(): boolean {
    const { auth } = usePage<{ auth?: { user?: { role?: string } } }>().props;
    return auth?.user?.role === 'Administrador';
}

/** Botón secundario "Editar" de las fichas. */
export const botonEditar = btn.primary;
