import { Dato, Datos, FichaEncabezado, FichaSeccion, fechaFicha, useEsAdministrador } from '@/components/ficha';
import { Pagina } from '@/components/pagina';
import { btn } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { AlertTriangle, Box, Package, Pencil } from 'lucide-react';

interface Consumable {
    id: number;
    name: string;
    ref: string | null;
    comment: string | null;
    date_mod: string | null;
    date_creation: string | null;
    type_name: string | null;
    manufacturer_name: string | null;
    location_name: string | null;
    entity_name: string | null;
    alarm_threshold: number | null;
}

interface Props {
    consumable: Consumable;
    stockTotal: number;
    stockDisponible: number;
    stockUsado: number;
}

export default function VerConsumible({ consumable: c, stockTotal, stockDisponible, stockUsado }: Props) {
    const esAdmin = useEsAdministrador();
    const umbral = Number(c.alarm_threshold ?? 0);
    // Alerta solo con un umbral definido (> 0), como antes. Con 0 la página pintaba un "0" suelto.
    const bajoUmbral = umbral > 0 && stockDisponible <= umbral;

    const existencias = [
        { etiqueta: 'Total', valor: stockTotal, punto: 'bg-gray-400' },
        { etiqueta: 'Disponible', valor: stockDisponible, punto: 'bg-green-600' },
        { etiqueta: 'Usado', valor: stockUsado, punto: 'bg-orange-500' },
    ];

    return (
        <Pagina titulo={c.name} migas={[{ texto: 'Inicio', href: '/dashboard' }, { texto: 'Inventario', href: '/inventario/global' }, { texto: 'Consumibles', href: '/inventario/consumibles' }, { texto: c.name }]}>
            <FichaEncabezado
                titulo={c.name}
                detalle={<span className="tabular-nums">ID: {c.id}</span>}
                volverHref="/inventario/consumibles"
                volverTexto="Consumibles"
                acciones={
                    esAdmin && (
                        <Link href={`/inventario/consumibles/${c.id}/editar`} className={btn.primary}>
                            <Pencil aria-hidden="true" />
                            Editar
                        </Link>
                    )
                }
            />

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <FichaSeccion titulo="Información general" icono={<Package className="size-5 text-huv-ink" aria-hidden="true" />}>
                    <Datos>
                        <Dato etiqueta="Nombre">{c.name}</Dato>
                        <Dato etiqueta="Entidad">{c.entity_name}</Dato>
                        <Dato etiqueta="Tipo">{c.type_name}</Dato>
                        <Dato etiqueta="Fabricante">{c.manufacturer_name}</Dato>
                        <Dato etiqueta="Referencia" mono>
                            {c.ref}
                        </Dato>
                        <Dato etiqueta="Umbral de alarma">{c.alarm_threshold !== null && c.alarm_threshold !== undefined ? String(c.alarm_threshold) : null}</Dato>
                        <Dato etiqueta="Localización" ancho>
                            {c.location_name}
                        </Dato>
                        {c.comment && (
                            <Dato etiqueta="Comentarios" ancho>
                                <span className="whitespace-pre-wrap">{c.comment}</span>
                            </Dato>
                        )}
                        <Dato etiqueta="Fecha de creación">{fechaFicha(c.date_creation)}</Dato>
                        <Dato etiqueta="Última modificación">{fechaFicha(c.date_mod)}</Dato>
                    </Datos>
                </FichaSeccion>

                <FichaSeccion titulo="Inventario" icono={<Box className="size-5 text-huv-ink" aria-hidden="true" />}>
                    <dl className="divide-y">
                        {existencias.map((e) => (
                            <div key={e.etiqueta} className="flex items-center justify-between py-2.5 text-sm">
                                <dt className="flex items-center gap-2 text-gray-600">
                                    <span aria-hidden="true" className={cn('size-2 rounded-full', e.punto)} />
                                    {e.etiqueta}
                                </dt>
                                <dd className="text-xl font-semibold text-gray-900">{e.valor.toLocaleString('es-CO')}</dd>
                            </div>
                        ))}
                    </dl>
                    {bajoUmbral && (
                        <p role="status" className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-inset ring-red-600/20">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            Stock bajo el umbral de alarma
                        </p>
                    )}
                </FichaSeccion>
            </div>
        </Pagina>
    );
}
