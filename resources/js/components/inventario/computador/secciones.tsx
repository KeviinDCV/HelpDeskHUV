/**
 * Secciones de solo lectura del computador, compartidas por Ver y Editar. Antes cada página
 * tenía las suyas con columnas distintas (Editar mostraba el fabricante del procesador y la RAM de
 * las máquinas virtuales; Ver, el serial del procesador y el Bus ID de la memoria): aquí van todas.
 */
import { Dato, Datos, FichaSeccion, fechaFicha } from '@/components/ficha';
import { StatusPill, ESTADO } from '@/components/ticket-pills';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { actionStyle, categoryLabel, formatHistoryDate, type HistoryEntry } from '@/lib/inventory-history';
import { fieldClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState, type ReactNode } from 'react';

// ── Tipos (lo que envía ComputerController en show() y edit()) ──────────────────────────────

export interface SistemaOperativo {
    id?: number;
    os_name: string | null;
    version_name: string | null;
    arch_name: string | null;
    servicepack_name: string | null;
    kernel_version: string | null;
    edition_name: string | null;
    license_number: string | null;
    license_id: string | null;
}

type Fila = Record<string, string | number | null | undefined>;

export interface Componentes {
    processors: Fila[];
    memories: Fila[];
    hardDrives: Fila[];
    networkCards: Fila[];
    graphicCards: Fila[];
    soundCards: Fila[];
    controllers: Fila[];
    drives: Fila[];
    firmwares: Fila[];
    motherboards: Fila[];
}

export interface Volumen {
    id?: number;
    name: string | null;
    mountpoint: string | null;
    device: string | null;
    totalsize: number | null;
    freesize: number | null;
    filesystem_name: string | null;
}

export interface Programa {
    name: string;
    version: string | null;
}

export interface EquipoConectado {
    id: number;
    name: string;
    serial: string | null;
    manufacturer_name?: string | null;
}

export interface Conexiones {
    monitors: EquipoConectado[];
    peripherals: EquipoConectado[];
    printers: EquipoConectado[];
    phones: EquipoConectado[];
}

export interface PuertoRed {
    id: number;
    name: string | null;
    mac: string | null;
    logical_number: number | null;
    instantiation_type: string | null;
    ip_address: string | null;
    network_name: string | null;
    network_address: string | null;
    network_netmask: string | null;
    network_gateway: string | null;
}

export interface Registro {
    id: number;
    name: string;
    status: number;
    date: string;
}

export interface Antivirus {
    id: number;
    name: string | null;
    antivirus_version: string | null;
    signature_version: string | null;
    is_active: number | string | null;
    is_uptodate: number | string | null;
    date_expiration?: string | null;
    manufacturers_id?: number | null;
}

export interface MaquinaVirtual {
    id: number;
    name: string | null;
    uuid: string | null;
    vcpu?: number | null;
    ram?: number | null;
}

export interface Documento {
    id: number;
    name: string | null;
    filename: string | null;
    mime: string | null;
    date_mod: string | null;
}

export interface Certificado {
    id: number;
    name: string | null;
    serial: string | null;
    date_expiration: string | null;
}

export interface Contrato {
    id: number;
    name: string | null;
    num: string | null;
    begin_date: string | null;
    duration: number | null;
}

export interface InfoFinanciera {
    id?: number;
    buy_date: string | null;
    use_date: string | null;
    order_date?: string | null;
    delivery_date?: string | null;
    inventory_date?: string | null;
    decommission_date?: string | null;
    warranty_date: string | null;
    warranty_duration: number | string | null;
    warranty_info?: string | null;
    value: number | string | null;
    warranty_value?: number | string | null;
    order_number: string | null;
    delivery_number: string | null;
    immo_number: string | null;
    bill?: string | null;
    comment?: string | null;
}

// ── Piezas comunes ─────────────────────────────────────────────────────────────────────────

export const VACIO = '—';

/** "8.192 MB (8 GB)": el valor exacto que guarda GLPI y, si es grande, su equivalente. */
export function tamano(mb: number | string | null | undefined): string {
    const n = Number(mb);
    if (mb === null || mb === undefined || mb === '' || Number.isNaN(n) || n === 0) return '';
    const exacto = `${n.toLocaleString('es-CO')} MB`;
    return n >= 1024 ? `${exacto} (${(n / 1024).toLocaleString('es-CO', { maximumFractionDigits: 1 })} GB)` : exacto;
}

const texto = (v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? VACIO : String(v));

export function Vacio({ children }: { children: ReactNode }) {
    return <p className="text-sm text-gray-500">{children}</p>;
}

interface Columna {
    titulo: string;
    derecha?: boolean;
}

/** Tabla de datos dentro de una tarjeta (con desplazamiento horizontal si no cabe). */
export function TablaDatos({ columnas, children, alto }: { columnas: Columna[]; children: ReactNode; alto?: string }) {
    return (
        <div className={cn('-mx-5 sm:-mx-6', alto && 'overflow-y-auto', alto)}>
            <Table>
                <TableHeader className={alto ? 'sticky top-0 z-[1]' : undefined}>
                    <TableRow className="hover:bg-transparent">
                        {columnas.map((c) => (
                            <TableHead key={c.titulo} className={cn('first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6', c.derecha && 'text-right')}>
                                {c.titulo}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>{children}</TableBody>
            </Table>
        </div>
    );
}

export function Celda({ children, derecha, mono, principal }: { children: ReactNode; derecha?: boolean; mono?: boolean; principal?: boolean }) {
    return (
        <TableCell className={cn('first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6', derecha && 'text-right tabular-nums', mono && 'font-mono text-xs', principal ? 'font-medium text-gray-900' : 'text-gray-700')}>
            {children}
        </TableCell>
    );
}

/** Sí/No con su punto (no solo color: el texto dice el estado). */
export function SiNo({ valor }: { valor: number | string | null | undefined }) {
    const si = Number(valor) === 1;
    return (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
            <span aria-hidden="true" className={cn('size-2 rounded-full', si ? 'bg-green-600' : 'bg-red-500')} />
            {si ? 'Sí' : 'No'}
        </span>
    );
}

// Estados de GLPI: casos, problemas y cambios usan códigos distintos a partir del 7
const ESTADO_PROBLEMA: Record<number, string> = { 1: 'Nuevo', 2: 'En curso (asignado)', 3: 'En curso (planificado)', 4: 'En espera', 5: 'Resuelto', 6: 'Cerrado', 7: 'Aceptado', 8: 'Bajo observación' };
const ESTADO_CAMBIO: Record<number, string> = {
    1: 'Nuevo',
    4: 'En espera',
    5: 'Aplicado',
    6: 'Cerrado',
    7: 'Aceptado',
    8: 'Revisión',
    9: 'Evaluación',
    10: 'Aprobación',
    11: 'Prueba',
    12: 'Calificación',
    13: 'Rechazado',
    14: 'Cancelado',
};
const NOMBRE_ESTADO_CASO: Record<number, string> = { 1: 'Nuevo', 2: 'En curso (asignado)', 3: 'En curso (planificado)', 4: 'En espera', 5: 'Resuelto', 6: 'Cerrado' };

function EstadoItil({ status, nombres }: { status: number; nombres: Record<number, string> }) {
    return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-[#f3f4f6] px-1.5 py-0.5 text-[11px] font-medium leading-4 text-gray-700 dark:bg-white/10">
            <span aria-hidden="true" className={cn('size-1.5 rounded-full', ESTADO[status]?.punto ?? 'bg-gray-300')} />
            {nombres[status] ?? `Estado ${status}`}
        </span>
    );
}

// ── Sistemas operativos (lectura) ──────────────────────────────────────────────────────────

export function DatosSistemaOperativo({ so }: { so: SistemaOperativo }) {
    return (
        <Datos>
            <Dato etiqueta="Versión">{so.version_name}</Dato>
            <Dato etiqueta="Arquitectura">{so.arch_name}</Dato>
            <Dato etiqueta="Edición">{so.edition_name}</Dato>
            <Dato etiqueta="Paquete de servicio">{so.servicepack_name}</Dato>
            <Dato etiqueta="Núcleo">{so.kernel_version}</Dato>
            <Dato etiqueta="Número de serie" mono>
                {so.license_number}
            </Dato>
            <Dato etiqueta="ID del producto" mono>
                {so.license_id}
            </Dato>
        </Datos>
    );
}

export function SeccionSistemasOperativos({ items, acciones }: { items: SistemaOperativo[]; acciones?: ReactNode }) {
    return (
        <FichaSeccion titulo="Sistemas operativos" contador={items.length} acciones={acciones}>
            {items.length === 0 ? (
                <Vacio>No hay sistemas operativos registrados</Vacio>
            ) : (
                <ul className="space-y-3">
                    {items.map((so, i) => (
                        <li key={so.id ?? i} className="rounded-xl p-4 ring-1 ring-inset ring-gray-200 dark:ring-white/10">
                            <p className="mb-3 font-medium text-gray-900">{so.os_name || 'Sistema operativo desconocido'}</p>
                            <DatosSistemaOperativo so={so} />
                        </li>
                    ))}
                </ul>
            )}
        </FichaSeccion>
    );
}

// ── Componentes ────────────────────────────────────────────────────────────────────────────

const GRUPOS: { clave: keyof Componentes; titulo: string; columnas: { campo: string; titulo: string; tipo?: 'mono' | 'tamano' | 'numero' | 'mhz' }[] }[] = [
    {
        clave: 'processors',
        titulo: 'Procesadores',
        columnas: [
            { campo: 'designation', titulo: 'Nombre' },
            { campo: 'manufacturer_name', titulo: 'Fabricante' },
            { campo: 'frequency', titulo: 'Frecuencia', tipo: 'mhz' },
            { campo: 'nbcores', titulo: 'Núcleos', tipo: 'numero' },
            { campo: 'nbthreads', titulo: 'Hilos', tipo: 'numero' },
            { campo: 'serial', titulo: 'Serial', tipo: 'mono' },
        ],
    },
    {
        clave: 'memories',
        titulo: 'Memoria RAM',
        columnas: [
            { campo: 'designation', titulo: 'Nombre' },
            { campo: 'size', titulo: 'Tamaño', tipo: 'tamano' },
            { campo: 'serial', titulo: 'Serial', tipo: 'mono' },
            { campo: 'busID', titulo: 'Bus ID' },
        ],
    },
    {
        clave: 'hardDrives',
        titulo: 'Discos duros',
        columnas: [
            { campo: 'designation', titulo: 'Nombre' },
            { campo: 'capacity', titulo: 'Capacidad', tipo: 'tamano' },
            { campo: 'serial', titulo: 'Serial', tipo: 'mono' },
        ],
    },
    {
        clave: 'networkCards',
        titulo: 'Tarjetas de red',
        columnas: [
            { campo: 'designation', titulo: 'Nombre' },
            { campo: 'mac', titulo: 'Dirección MAC', tipo: 'mono' },
        ],
    },
    {
        clave: 'graphicCards',
        titulo: 'Tarjetas gráficas',
        columnas: [
            { campo: 'designation', titulo: 'Nombre' },
            { campo: 'memory', titulo: 'Memoria', tipo: 'tamano' },
        ],
    },
    { clave: 'soundCards', titulo: 'Tarjetas de sonido', columnas: [{ campo: 'designation', titulo: 'Nombre' }, { campo: 'serial', titulo: 'Serial', tipo: 'mono' }] },
    { clave: 'controllers', titulo: 'Controladores', columnas: [{ campo: 'designation', titulo: 'Nombre' }, { campo: 'serial', titulo: 'Serial', tipo: 'mono' }] },
    { clave: 'drives', titulo: 'Unidades', columnas: [{ campo: 'designation', titulo: 'Nombre' }, { campo: 'serial', titulo: 'Serial', tipo: 'mono' }] },
    {
        clave: 'firmwares',
        titulo: 'Firmware / BIOS',
        columnas: [
            { campo: 'designation', titulo: 'Nombre' },
            { campo: 'type_name', titulo: 'Tipo' },
            { campo: 'serial', titulo: 'Serial', tipo: 'mono' },
        ],
    },
    { clave: 'motherboards', titulo: 'Placa base', columnas: [{ campo: 'designation', titulo: 'Nombre' }, { campo: 'serial', titulo: 'Serial', tipo: 'mono' }] },
];

export const totalComponentes = (c: Componentes) => GRUPOS.reduce((n, g) => n + (c[g.clave]?.length ?? 0), 0);

export function SeccionComponentes({ componentes }: { componentes: Componentes }) {
    const conDatos = GRUPOS.filter((g) => (componentes[g.clave]?.length ?? 0) > 0);
    const sinDatos = GRUPOS.filter((g) => (componentes[g.clave]?.length ?? 0) === 0);
    const total = totalComponentes(componentes);
    return (
        <FichaSeccion titulo="Componentes" contador={total}>
            <p className="-mt-2 mb-4 text-sm text-gray-500">Se sincronizan automáticamente desde el agente de inventario. Solo lectura.</p>
            {total === 0 ? (
                <Vacio>No hay componentes registrados</Vacio>
            ) : (
                <div className="space-y-6">
                    {conDatos.map((g) => (
                        <div key={g.clave}>
                            <h3 className="mb-2 text-sm font-semibold text-gray-900">
                                {g.titulo} <span className="font-normal tabular-nums text-gray-500">({componentes[g.clave].length})</span>
                            </h3>
                            <TablaDatos columnas={g.columnas.map((c) => ({ titulo: c.titulo, derecha: c.tipo === 'numero' || c.tipo === 'mhz' || c.tipo === 'tamano' }))}>
                                {componentes[g.clave].map((fila, i) => (
                                    <TableRow key={i}>
                                        {g.columnas.map((c, j) => {
                                            const v = fila[c.campo];
                                            const mostrado = c.tipo === 'tamano' ? tamano(v) || VACIO : c.tipo === 'mhz' ? (v ? `${Number(v).toLocaleString('es-CO')} MHz` : VACIO) : texto(v);
                                            return (
                                                <Celda key={c.campo} principal={j === 0} mono={c.tipo === 'mono' && mostrado !== VACIO} derecha={c.tipo === 'numero' || c.tipo === 'mhz' || c.tipo === 'tamano'}>
                                                    {mostrado}
                                                </Celda>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TablaDatos>
                        </div>
                    ))}
                    {sinDatos.length > 0 && <p className="text-sm text-gray-500">Sin registros: {sinDatos.map((g) => g.titulo.toLowerCase()).join(', ')}.</p>}
                </div>
            )}
        </FichaSeccion>
    );
}

// ── Volúmenes (lectura) ────────────────────────────────────────────────────────────────────

export function UsoVolumen({ v }: { v: Volumen }) {
    const total = Number(v.totalsize) || 0;
    const libre = Number(v.freesize) || 0;
    // Con el disco lleno el libre es 0: antes se tomaba como dato ausente y no se veía el uso
    if (total <= 0 || v.freesize === null || v.freesize === undefined) return null;
    const uso = ((total - libre) / total) * 100;
    const color = uso > 90 ? 'bg-red-500' : uso > 70 ? 'bg-amber-500' : 'bg-green-600';
    return (
        <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>Uso del disco</span>
                <span className="tabular-nums">{uso.toLocaleString('es-CO', { maximumFractionDigits: 1 })} %</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#e5e7eb] dark:bg-white/10" role="presentation">
                <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.min(Math.max(uso, 0), 100)}%` }} />
            </div>
        </div>
    );
}

export function DatosVolumen({ v }: { v: Volumen }) {
    const total = Number(v.totalsize) || 0;
    const libre = Number(v.freesize) || 0;
    const usado = total > 0 && v.freesize !== null && v.freesize !== undefined ? total - libre : null;
    return (
        <>
            <Datos columnas={3}>
                <Dato etiqueta="Partición" mono>
                    {v.device}
                </Dato>
                <Dato etiqueta="Punto de montaje" mono>
                    {v.mountpoint}
                </Dato>
                <Dato etiqueta="Sistema de archivos">{v.filesystem_name}</Dato>
                <Dato etiqueta="Tamaño global">{tamano(v.totalsize)}</Dato>
                <Dato etiqueta="Usado">{usado !== null ? tamano(usado) || '0 MB' : ''}</Dato>
                <Dato etiqueta="Espacio libre">{v.freesize !== null && v.freesize !== undefined ? tamano(v.freesize) || '0 MB' : ''}</Dato>
            </Datos>
            <UsoVolumen v={v} />
        </>
    );
}

export function SeccionVolumenes({ items }: { items: Volumen[] }) {
    return (
        <FichaSeccion titulo="Volúmenes" contador={items.length}>
            {items.length === 0 ? (
                <Vacio>No hay volúmenes registrados</Vacio>
            ) : (
                <ul className="space-y-3">
                    {items.map((v, i) => (
                        <li key={v.id ?? i} className="rounded-xl p-4 ring-1 ring-inset ring-gray-200 dark:ring-white/10">
                            <p className="mb-3 font-medium text-gray-900">{v.name || v.mountpoint || 'Volumen'}</p>
                            <DatosVolumen v={v} />
                        </li>
                    ))}
                </ul>
            )}
        </FichaSeccion>
    );
}

// ── Software ───────────────────────────────────────────────────────────────────────────────

export function SeccionSoftware({ items }: { items: Programa[] }) {
    const [busqueda, setBusqueda] = useState('');
    const q = busqueda.trim().toLowerCase();
    const filtrados = q ? items.filter((s) => s.name.toLowerCase().includes(q) || (s.version?.toLowerCase().includes(q) ?? false)) : items;
    return (
        <FichaSeccion titulo="Software instalado" contador={items.length}>
            <p className="-mt-2 mb-4 text-sm text-gray-500">Se sincroniza automáticamente desde el agente de inventario.</p>
            {items.length === 0 ? (
                <Vacio>No hay software registrado</Vacio>
            ) : (
                <>
                    <div className="relative mb-4 sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                        <input
                            type="search"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar software..."
                            aria-label="Buscar software por nombre o versión"
                            className={cn(fieldClass, 'pl-9')}
                        />
                    </div>
                    {filtrados.length === 0 ? (
                        <Vacio>No se encontraron resultados</Vacio>
                    ) : (
                        <TablaDatos columnas={[{ titulo: 'Nombre' }, { titulo: 'Versión' }]} alto="max-h-[28rem]">
                            {filtrados.map((s, i) => (
                                <TableRow key={`${s.name}-${s.version}-${i}`}>
                                    <Celda principal>{s.name}</Celda>
                                    <Celda>{texto(s.version)}</Celda>
                                </TableRow>
                            ))}
                        </TablaDatos>
                    )}
                    {q && filtrados.length > 0 && (
                        <p className="mt-3 text-xs text-gray-500" role="status">
                            {filtrados.length.toLocaleString('es-CO')} de {items.length.toLocaleString('es-CO')}
                        </p>
                    )}
                </>
            )}
        </FichaSeccion>
    );
}

// ── Conexiones ─────────────────────────────────────────────────────────────────────────────

const GRUPOS_CONEXION: { clave: keyof Conexiones; titulo: string; vacio: string; ruta: string }[] = [
    { clave: 'monitors', titulo: 'Monitores', vacio: 'Sin monitores conectados', ruta: '/inventario/monitores' },
    { clave: 'peripherals', titulo: 'Periféricos', vacio: 'Sin periféricos conectados', ruta: '/inventario/dispositivos' },
    { clave: 'printers', titulo: 'Impresoras', vacio: 'Sin impresoras conectadas', ruta: '/inventario/impresoras' },
    { clave: 'phones', titulo: 'Teléfonos', vacio: 'Sin teléfonos conectados', ruta: '/inventario/telefonos' },
];

export const totalConexiones = (c: Conexiones) => GRUPOS_CONEXION.reduce((n, g) => n + (c[g.clave]?.length ?? 0), 0);

export function SeccionConexiones({ conexiones }: { conexiones: Conexiones }) {
    return (
        <FichaSeccion titulo="Conexiones" contador={totalConexiones(conexiones)}>
            <div className="grid gap-6 md:grid-cols-2">
                {GRUPOS_CONEXION.map((g) => {
                    const items = conexiones[g.clave] ?? [];
                    return (
                        <div key={g.clave} className="min-w-0">
                            <h3 className="mb-2 text-sm font-semibold text-gray-900">
                                {g.titulo} <span className="font-normal tabular-nums text-gray-500">({items.length})</span>
                            </h3>
                            {items.length === 0 ? (
                                <Vacio>{g.vacio}</Vacio>
                            ) : (
                                <ul className="-mx-2 space-y-0.5">
                                    {items.map((e) => (
                                        <li key={e.id}>
                                            <Link href={`${g.ruta}/${e.id}`} className="focus-ring block rounded-lg px-2 py-2 text-gray-900 transition-colors hover:bg-gray-50">
                                                <span className="block text-sm font-medium break-words">{e.name}</span>
                                                {e.manufacturer_name && <span className="block text-xs text-gray-500">{e.manufacturer_name}</span>}
                                                {e.serial && <span className="block font-mono text-xs text-gray-500">S/N: {e.serial}</span>}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
        </FichaSeccion>
    );
}

// ── Puertos de red ─────────────────────────────────────────────────────────────────────────

interface RedPuerto {
    nombre: string;
    mascara: string | null;
    puerta: string | null;
}

/**
 * La consulta devuelve una fila por IP y por red: un puerto con dos IP, o con una IP en dos
 * redes, venía repetido. Aquí se agrupan sin perder nada: cada red con su máscara y su puerta.
 */
export function agruparPuertos(filas: PuertoRed[]) {
    const puertos = new Map<number, PuertoRed & { ips: string[]; redes: RedPuerto[] }>();
    for (const f of filas) {
        const p = puertos.get(f.id) ?? { ...f, ips: [], redes: [] };
        if (f.ip_address && !p.ips.includes(f.ip_address)) p.ips.push(f.ip_address);
        const nombre = f.network_name || (f.network_address ? `${f.network_address}/${f.network_netmask ?? ''}` : '');
        const red = { nombre, mascara: f.network_netmask, puerta: f.network_gateway };
        if ((nombre || red.mascara || red.puerta) && !p.redes.some((r) => r.nombre === red.nombre && r.mascara === red.mascara && r.puerta === red.puerta)) p.redes.push(red);
        puertos.set(f.id, p);
    }
    return [...puertos.values()];
}

export function SeccionPuertosRed({ items }: { items: PuertoRed[] }) {
    const puertos = agruparPuertos(items);
    return (
        <FichaSeccion titulo="Puertos de red" contador={puertos.length}>
            {puertos.length === 0 ? (
                <Vacio>No hay puertos de red registrados</Vacio>
            ) : (
                <ul className="space-y-3">
                    {puertos.map((p, i) => (
                        <li key={p.id} className="rounded-xl p-4 ring-1 ring-inset ring-gray-200 dark:ring-white/10">
                            <p className="mb-3 font-medium text-gray-900">
                                <span className="tabular-nums text-gray-500">{i + 1}.</span> {p.name || 'Puerto sin nombre'}
                            </p>
                            <Datos columnas={3}>
                                <Dato etiqueta="Dirección MAC" mono>
                                    {p.mac}
                                </Dato>
                                <Dato etiqueta={p.ips.length > 1 ? 'Direcciones IP' : 'Dirección IP'} mono>
                                    {p.ips.join(', ')}
                                </Dato>
                                <Dato etiqueta="Número lógico">{p.logical_number !== null && p.logical_number !== undefined ? String(p.logical_number) : ''}</Dato>
                                <Dato etiqueta="Tipo">{p.instantiation_type?.replace('NetworkPort', '')}</Dato>
                                {p.redes.length <= 1 && (
                                    <>
                                        <Dato etiqueta="Red">{p.redes[0]?.nombre}</Dato>
                                        <Dato etiqueta="Máscara" mono>
                                            {p.redes[0]?.mascara}
                                        </Dato>
                                        <Dato etiqueta="Puerta de enlace" mono>
                                            {p.redes[0]?.puerta}
                                        </Dato>
                                    </>
                                )}
                            </Datos>
                            {p.redes.length > 1 && (
                                <div className="mt-4">
                                    <p className="text-xs font-medium text-gray-500">Redes ({p.redes.length})</p>
                                    <ul className="mt-1 divide-y text-sm">
                                        {p.redes.map((r, j) => (
                                            <li key={`${r.nombre}-${r.mascara}-${r.puerta}-${j}`} className="grid gap-x-6 gap-y-0.5 py-2 sm:grid-cols-3">
                                                <span className="break-words text-gray-900">{r.nombre || VACIO}</span>
                                                <span className="text-gray-700">
                                                    <span className="text-gray-500">Máscara </span>
                                                    <span className="font-mono text-xs">{r.mascara || VACIO}</span>
                                                </span>
                                                <span className="text-gray-700">
                                                    <span className="text-gray-500">Puerta de enlace </span>
                                                    <span className="font-mono text-xs">{r.puerta || VACIO}</span>
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </FichaSeccion>
    );
}

// ── Casos, problemas y cambios ─────────────────────────────────────────────────────────────

export function SeccionCasos({ items }: { items: Registro[] }) {
    return (
        <FichaSeccion titulo="Casos" contador={items.length}>
            {items.length === 0 ? (
                <Vacio>No hay casos relacionados</Vacio>
            ) : (
                <TablaDatos columnas={[{ titulo: 'Caso' }, { titulo: 'Título' }, { titulo: 'Estado' }, { titulo: 'Fecha' }]}>
                    {items.map((t) => (
                        <TableRow key={t.id}>
                            <Celda>
                                <span className="tabular-nums text-gray-500">#{t.id}</span>
                            </Celda>
                            <Celda principal>
                                {/* A la vista del caso: su edición rechaza a quien no es técnico */}
                                <Link href={`/soporte/casos/${t.id}`} className="focus-ring rounded hover:underline">
                                    {t.name}
                                </Link>
                            </Celda>
                            <Celda>
                                <StatusPill status={t.status} name={NOMBRE_ESTADO_CASO[t.status] ?? 'Desconocido'} />
                            </Celda>
                            <Celda>
                                <span className="whitespace-nowrap">{fechaFicha(t.date) || VACIO}</span>
                            </Celda>
                        </TableRow>
                    ))}
                </TablaDatos>
            )}
        </FichaSeccion>
    );
}

function SeccionItil({ titulo, items, nombres, vacio }: { titulo: string; items: Registro[]; nombres: Record<number, string>; vacio: string }) {
    return (
        <FichaSeccion titulo={titulo} contador={items.length}>
            {items.length === 0 ? (
                <Vacio>{vacio}</Vacio>
            ) : (
                <TablaDatos columnas={[{ titulo: 'ID' }, { titulo: 'Título' }, { titulo: 'Estado' }, { titulo: 'Fecha' }]}>
                    {items.map((r) => (
                        <TableRow key={r.id}>
                            <Celda>
                                <span className="tabular-nums text-gray-500">#{r.id}</span>
                            </Celda>
                            <Celda principal>{r.name}</Celda>
                            <Celda>
                                <EstadoItil status={r.status} nombres={nombres} />
                            </Celda>
                            <Celda>
                                <span className="whitespace-nowrap">{fechaFicha(r.date) || VACIO}</span>
                            </Celda>
                        </TableRow>
                    ))}
                </TablaDatos>
            )}
        </FichaSeccion>
    );
}

export const SeccionProblemas = ({ items }: { items: Registro[] }) => <SeccionItil titulo="Problemas" items={items} nombres={ESTADO_PROBLEMA} vacio="No hay problemas asociados" />;
export const SeccionCambios = ({ items }: { items: Registro[] }) => <SeccionItil titulo="Cambios" items={items} nombres={ESTADO_CAMBIO} vacio="No hay cambios asociados" />;

// ── Antivirus (lectura) ────────────────────────────────────────────────────────────────────

export const COLUMNAS_ANTIVIRUS = [{ titulo: 'Nombre' }, { titulo: 'Versión' }, { titulo: 'Versión de firmas' }, { titulo: 'Activo' }, { titulo: 'Actualizado' }, { titulo: 'Expiración' }];

export function FilaAntivirus({ a, acciones }: { a: Antivirus; acciones?: ReactNode }) {
    return (
        <TableRow>
            <Celda principal>{texto(a.name)}</Celda>
            <Celda>{texto(a.antivirus_version)}</Celda>
            <Celda>{texto(a.signature_version)}</Celda>
            <Celda>
                <SiNo valor={a.is_active} />
            </Celda>
            <Celda>
                <SiNo valor={a.is_uptodate} />
            </Celda>
            <Celda>
                <span className="whitespace-nowrap">{fechaFicha(a.date_expiration, false) || VACIO}</span>
            </Celda>
            {acciones !== undefined && <Celda derecha>{acciones}</Celda>}
        </TableRow>
    );
}

export function SeccionAntivirus({ items }: { items: Antivirus[] }) {
    return (
        <FichaSeccion titulo="Antivirus" contador={items.length}>
            {items.length === 0 ? (
                <Vacio>No hay antivirus registrados</Vacio>
            ) : (
                <TablaDatos columnas={COLUMNAS_ANTIVIRUS}>
                    {items.map((a) => (
                        <FilaAntivirus key={a.id} a={a} />
                    ))}
                </TablaDatos>
            )}
        </FichaSeccion>
    );
}

// ── Virtualización, documentos, certificados y contratos ───────────────────────────────────

export function SeccionVirtualizacion({ items }: { items: MaquinaVirtual[] }) {
    return (
        <FichaSeccion titulo="Máquinas virtuales" contador={items.length}>
            {items.length === 0 ? (
                <Vacio>No hay máquinas virtuales registradas</Vacio>
            ) : (
                <TablaDatos columnas={[{ titulo: 'Nombre' }, { titulo: 'UUID' }, { titulo: 'vCPU', derecha: true }, { titulo: 'RAM (MB)', derecha: true }]}>
                    {items.map((vm) => (
                        <TableRow key={vm.id}>
                            <Celda principal>{texto(vm.name)}</Celda>
                            <Celda mono={!!vm.uuid}>{texto(vm.uuid)}</Celda>
                            <Celda derecha>{vm.vcpu ? String(vm.vcpu) : VACIO}</Celda>
                            <Celda derecha>{vm.ram ? Number(vm.ram).toLocaleString('es-CO') : VACIO}</Celda>
                        </TableRow>
                    ))}
                </TablaDatos>
            )}
        </FichaSeccion>
    );
}

export function SeccionDocumentos({ items }: { items: Documento[] }) {
    return (
        <FichaSeccion titulo="Documentos" contador={items.length}>
            {items.length === 0 ? (
                <Vacio>No hay documentos asociados</Vacio>
            ) : (
                <TablaDatos columnas={[{ titulo: 'Nombre' }, { titulo: 'Archivo' }, { titulo: 'Tipo MIME' }, { titulo: 'Modificado' }]}>
                    {items.map((d) => (
                        <TableRow key={d.id}>
                            <Celda principal>{texto(d.name)}</Celda>
                            <Celda>{texto(d.filename)}</Celda>
                            <Celda>{texto(d.mime)}</Celda>
                            <Celda>
                                <span className="whitespace-nowrap">{fechaFicha(d.date_mod) || VACIO}</span>
                            </Celda>
                        </TableRow>
                    ))}
                </TablaDatos>
            )}
        </FichaSeccion>
    );
}

export function SeccionCertificados({ items }: { items: Certificado[] }) {
    return (
        <FichaSeccion titulo="Certificados" contador={items.length}>
            {items.length === 0 ? (
                <Vacio>No hay certificados asociados</Vacio>
            ) : (
                <TablaDatos columnas={[{ titulo: 'Nombre' }, { titulo: 'Serial' }, { titulo: 'Expiración' }]}>
                    {items.map((c) => (
                        <TableRow key={c.id}>
                            <Celda principal>{texto(c.name)}</Celda>
                            <Celda mono={!!c.serial}>{texto(c.serial)}</Celda>
                            <Celda>
                                <span className="whitespace-nowrap">{fechaFicha(c.date_expiration, false) || VACIO}</span>
                            </Celda>
                        </TableRow>
                    ))}
                </TablaDatos>
            )}
        </FichaSeccion>
    );
}

export function SeccionContratos({ items }: { items: Contrato[] }) {
    return (
        <FichaSeccion titulo="Contratos" contador={items.length}>
            {items.length === 0 ? (
                <Vacio>No hay contratos asociados</Vacio>
            ) : (
                <TablaDatos columnas={[{ titulo: 'Nombre' }, { titulo: 'Número' }, { titulo: 'Inicio' }, { titulo: 'Duración (meses)', derecha: true }]}>
                    {items.map((c) => (
                        <TableRow key={c.id}>
                            <Celda principal>{texto(c.name)}</Celda>
                            <Celda>{texto(c.num)}</Celda>
                            <Celda>
                                <span className="whitespace-nowrap">{fechaFicha(c.begin_date, false) || VACIO}</span>
                            </Celda>
                            <Celda derecha>{c.duration !== null && c.duration !== undefined ? String(c.duration) : VACIO}</Celda>
                        </TableRow>
                    ))}
                </TablaDatos>
            )}
        </FichaSeccion>
    );
}

// ── Información financiera (lectura) ───────────────────────────────────────────────────────

const pesos = (v: number | string | null | undefined) => {
    if (v === null || v === undefined || v === '') return '';
    const n = Number(v);
    return Number.isNaN(n) ? String(v) : `$ ${n.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`;
};

export function DatosInfoFinanciera({ info }: { info: InfoFinanciera }) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Fechas</h3>
                <Datos columnas={3}>
                    <Dato etiqueta="Fecha de compra">{fechaFicha(info.buy_date, false)}</Dato>
                    <Dato etiqueta="Fecha de puesta en uso">{fechaFicha(info.use_date, false)}</Dato>
                    <Dato etiqueta="Fecha de pedido">{fechaFicha(info.order_date, false)}</Dato>
                    <Dato etiqueta="Fecha de entrega">{fechaFicha(info.delivery_date, false)}</Dato>
                    <Dato etiqueta="Fecha de inventario">{fechaFicha(info.inventory_date, false)}</Dato>
                    <Dato etiqueta="Fecha de baja">{fechaFicha(info.decommission_date, false)}</Dato>
                </Datos>
            </div>
            <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Garantía y valores</h3>
                <Datos columnas={3}>
                    <Dato etiqueta="Inicio de garantía">{fechaFicha(info.warranty_date, false)}</Dato>
                    <Dato etiqueta="Duración de la garantía (meses)">{info.warranty_duration !== null && info.warranty_duration !== undefined ? String(info.warranty_duration) : ''}</Dato>
                    <Dato etiqueta="Información de garantía">{info.warranty_info}</Dato>
                    <Dato etiqueta="Valor">{pesos(info.value)}</Dato>
                    <Dato etiqueta="Valor de la garantía">{pesos(info.warranty_value)}</Dato>
                </Datos>
            </div>
            <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Números y referencias</h3>
                <Datos columnas={3}>
                    <Dato etiqueta="Nº de pedido">{info.order_number}</Dato>
                    <Dato etiqueta="Nº de entrega">{info.delivery_number}</Dato>
                    <Dato etiqueta="Nº de inmovilización">{info.immo_number}</Dato>
                    <Dato etiqueta="Factura">{info.bill}</Dato>
                </Datos>
            </div>
            {info.comment && (
                <Datos>
                    <Dato etiqueta="Comentarios" ancho>
                        <span className="whitespace-pre-wrap">{info.comment}</span>
                    </Dato>
                </Datos>
            )}
        </div>
    );
}

export function SeccionInfoFinanciera({ info }: { info: InfoFinanciera | null }) {
    return (
        <FichaSeccion titulo="Información financiera y administrativa">
            {info ? <DatosInfoFinanciera info={info} /> : <Vacio>No hay información financiera registrada</Vacio>}
        </FichaSeccion>
    );
}

// ── Historial ──────────────────────────────────────────────────────────────────────────────

export function SeccionHistorial({ items }: { items: HistoryEntry[] }) {
    return (
        <FichaSeccion titulo="Historial de cambios" contador={items.length}>
            {items.length === 0 ? (
                <Vacio>
                    Sin cambios registrados todavía. El agente irá registrando aquí los cambios de hardware, software y configuración que detecte en cada
                    sincronización.
                </Vacio>
            ) : (
                <ol className="space-y-0">
                    {items.map((h, i) => {
                        const st = actionStyle(h.action);
                        return (
                            <li key={h.id} className="relative flex gap-3 pb-4 last:pb-0">
                                {i < items.length - 1 && <span aria-hidden="true" className="absolute top-3 left-[4px] h-full w-px bg-[#e5e7eb] dark:bg-white/10" />}
                                <span aria-hidden="true" className={cn('relative mt-1.5 size-2.5 shrink-0 rounded-full', st.dot)} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm break-words text-gray-900">{h.summary}</p>
                                    {(h.old_value || h.new_value) && (
                                        <p className="mt-0.5 text-xs break-words text-gray-500">
                                            {h.field && <span className="font-medium text-gray-600">{h.field}: </span>}
                                            {h.old_value && <span className="line-through decoration-gray-400">{h.old_value}</span>}
                                            {h.old_value && h.new_value && ' → '}
                                            {h.new_value}
                                        </p>
                                    )}
                                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                        <span className="rounded-md bg-[#f3f4f6] px-1.5 py-0.5 font-medium text-gray-700 dark:bg-white/10">{st.label}</span>
                                        <span className="rounded-md bg-[#f3f4f6] px-1.5 py-0.5 text-gray-700 dark:bg-white/10">{categoryLabel(h.category)}</span>
                                        <span className="tabular-nums">{formatHistoryDate(h.changed_at)}</span>
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </FichaSeccion>
    );
}
