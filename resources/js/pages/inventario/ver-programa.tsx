import { CasosRelacionados, Dato, Datos, FichaEncabezado, FichaSeccion, fechaFicha, useEsAdministrador, type CasoRelacionado } from '@/components/ficha';
import { Pagina } from '@/components/pagina';
import { btn } from '@/lib/ui-classes';
import { Link } from '@inertiajs/react';
import { Package, Pencil, Tag, Ticket } from 'lucide-react';

interface Software {
    id: number;
    name: string;
    comment: string | null;
    date_mod: string | null;
    date_creation: string | null;
    manufacturer_name: string | null;
    category_name: string | null;
    entity_name: string | null;
}

interface Version {
    id: number;
    name: string;
    date_creation: string | null;
}

interface Props {
    software: Software;
    versions: Version[];
    tickets: CasoRelacionado[];
}

export default function VerPrograma({ software: s, versions, tickets }: Props) {
    const esAdmin = useEsAdministrador();
    const nombre = s.name || `#${s.id}`;
    return (
        <Pagina titulo={nombre} migas={[{ texto: 'Inicio', href: '/dashboard' }, { texto: 'Inventario', href: '/inventario/global' }, { texto: 'Programas', href: '/inventario/programas' }, { texto: nombre }]}>
            <FichaEncabezado
                titulo={nombre}
                detalle={<span className="tabular-nums">ID: {s.id}</span>}
                volverHref="/inventario/programas"
                volverTexto="Programas"
                acciones={
                    esAdmin && (
                        <Link href={`/inventario/programas/${s.id}/editar`} className={btn.primary}>
                            <Pencil aria-hidden="true" />
                            Editar
                        </Link>
                    )
                }
            />

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <FichaSeccion titulo="Información general" icono={<Package className="size-5 text-huv-ink" aria-hidden="true" />}>
                    <Datos>
                        <Dato etiqueta="Nombre">{s.name}</Dato>
                        <Dato etiqueta="Entidad">{s.entity_name}</Dato>
                        <Dato etiqueta="Editor">{s.manufacturer_name}</Dato>
                        <Dato etiqueta="Categoría">{s.category_name}</Dato>
                        {s.comment && (
                            <Dato etiqueta="Comentarios" ancho>
                                <span className="whitespace-pre-wrap">{s.comment}</span>
                            </Dato>
                        )}
                        <Dato etiqueta="Fecha de creación">{fechaFicha(s.date_creation)}</Dato>
                        <Dato etiqueta="Última modificación">{fechaFicha(s.date_mod)}</Dato>
                    </Datos>
                </FichaSeccion>

                <div className="min-w-0 space-y-5">
                    <FichaSeccion titulo="Versiones" contador={versions.length} icono={<Tag className="size-5 text-huv-ink" aria-hidden="true" />}>
                        {versions.length > 0 ? (
                            <ul className="max-h-60 divide-y overflow-y-auto">
                                {versions.map((v) => (
                                    <li key={v.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                                        <span className="min-w-0 font-medium break-words text-gray-900">{v.name}</span>
                                        {v.date_creation && <span className="shrink-0 text-xs text-gray-500">{fechaFicha(v.date_creation, false)}</span>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">Sin versiones registradas</p>
                        )}
                    </FichaSeccion>

                    <FichaSeccion titulo="Casos recientes" contador={tickets.length} icono={<Ticket className="size-5 text-huv-ink" aria-hidden="true" />}>
                        <CasosRelacionados casos={tickets} href={(id) => `/soporte/casos/${id}`} />
                    </FichaSeccion>
                </div>
            </div>
        </Pagina>
    );
}
