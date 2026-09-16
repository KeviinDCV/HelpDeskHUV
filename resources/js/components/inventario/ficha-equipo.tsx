/**
 * Ficha de un equipo (monitor, teléfono, dispositivo, dispositivo de red): los datos comunes en el
 * mismo orden que ya mostraban sus páginas, más los propios de cada tipo, los computadores a los
 * que está conectado y sus casos recientes.
 */
import { CasosRelacionados, Dato, Datos, EquiposConectados, FichaEncabezado, FichaSeccion, fechaFicha, useEsAdministrador, type CasoRelacionado, type EquipoConectado } from '@/components/ficha';
import { Pagina } from '@/components/pagina';
import { btn } from '@/lib/ui-classes';
import { Link } from '@inertiajs/react';
import { Cpu, Pencil, Ticket } from 'lucide-react';
import type { ReactNode } from 'react';

export interface RegistroEquipo {
    id: number;
    name: string;
    serial: string | null;
    otherserial: string | null;
    comment: string | null;
    date_mod: string | null;
    date_creation: string | null;
    state_name: string | null;
    manufacturer_name: string | null;
    type_name: string | null;
    model_name: string | null;
    location_name: string | null;
    entity_name: string | null;
}

interface Props {
    registro: RegistroEquipo;
    /** "/inventario/monitores" */
    ruta: string;
    /** "Monitores" */
    lista: string;
    icono: ReactNode;
    /** Datos propios del tipo que van antes de la localización (p. ej. Tamaño) */
    antesDeLocalizacion?: ReactNode;
    /** Datos propios que van después (p. ej. Dominio, Técnico a cargo…) */
    despuesDeLocalizacion?: ReactNode;
    /** Computadores conectados; `undefined` = este tipo no muestra la tarjeta */
    equipos?: EquipoConectado[];
    tickets: CasoRelacionado[];
}

export function FichaEquipo({ registro: r, ruta, lista, icono, antesDeLocalizacion, despuesDeLocalizacion, equipos, tickets }: Props) {
    const esAdmin = useEsAdministrador();
    return (
        <Pagina titulo={r.name || `#${r.id}`} migas={[{ texto: 'Inicio', href: '/dashboard' }, { texto: 'Inventario', href: '/inventario/global' }, { texto: lista, href: ruta }, { texto: r.name || `#${r.id}` }]}>
            <FichaEncabezado
                titulo={r.name || `#${r.id}`}
                detalle={<span className="tabular-nums">ID: {r.id}</span>}
                volverHref={ruta}
                volverTexto={lista}
                acciones={
                    // Solo el Administrador puede editar: a los demás el botón los llevaba a un 403
                    esAdmin && (
                        <Link href={`${ruta}/${r.id}/editar`} className={btn.primary}>
                            <Pencil aria-hidden="true" />
                            Editar
                        </Link>
                    )
                }
            />

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <FichaSeccion titulo="Información general" icono={icono}>
                    <Datos>
                        <Dato etiqueta="Nombre">{r.name}</Dato>
                        <Dato etiqueta="Entidad">{r.entity_name}</Dato>
                        <Dato etiqueta="Estado">{r.state_name}</Dato>
                        <Dato etiqueta="Tipo">{r.type_name}</Dato>
                        <Dato etiqueta="Fabricante">{r.manufacturer_name}</Dato>
                        <Dato etiqueta="Modelo">{r.model_name}</Dato>
                        <Dato etiqueta="Número de serie" mono>
                            {r.serial}
                        </Dato>
                        <Dato etiqueta="Número de inventario" mono>
                            {r.otherserial}
                        </Dato>
                        {antesDeLocalizacion}
                        <Dato etiqueta="Localización" ancho>
                            {r.location_name}
                        </Dato>
                        {despuesDeLocalizacion}
                        {r.comment && (
                            <Dato etiqueta="Comentarios" ancho>
                                <span className="whitespace-pre-wrap">{r.comment}</span>
                            </Dato>
                        )}
                        <Dato etiqueta="Fecha de creación">{fechaFicha(r.date_creation)}</Dato>
                        <Dato etiqueta="Última modificación">{fechaFicha(r.date_mod)}</Dato>
                    </Datos>
                </FichaSeccion>

                <div className="min-w-0 space-y-5">
                    {equipos !== undefined && (
                        <FichaSeccion titulo="Conectado a" icono={<Cpu className="size-5 text-huv-ink" aria-hidden="true" />}>
                            <EquiposConectados equipos={equipos} />
                        </FichaSeccion>
                    )}
                    <FichaSeccion titulo="Casos recientes" contador={tickets.length} icono={<Ticket className="size-5 text-huv-ink" aria-hidden="true" />}>
                        {/* A la vista del caso: su edición rechaza a quien no es técnico */}
                        <CasosRelacionados casos={tickets} href={(id) => `/soporte/casos/${id}`} />
                    </FichaSeccion>
                </div>
            </div>
        </Pagina>
    );
}

/** Datos de responsables y contacto que GLPI guarda en casi todos los equipos. */
export function DatosResponsables({ r }: { r: { tech_user_name?: string | null; tech_group_name?: string | null; user_name?: string | null; group_name?: string | null; contact?: string | null; contact_num?: string | null } }) {
    return (
        <>
            <Dato etiqueta="Técnico a cargo">{r.tech_user_name}</Dato>
            <Dato etiqueta="Grupo a cargo">{r.tech_group_name}</Dato>
            <Dato etiqueta="Usuario">{r.user_name}</Dato>
            <Dato etiqueta="Grupo">{r.group_name}</Dato>
            <Dato etiqueta="Contacto">{r.contact}</Dato>
            <Dato etiqueta="Número de contacto">{r.contact_num}</Dato>
        </>
    );
}
