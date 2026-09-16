import { Dato, Datos, FichaEncabezado, FichaSeccion, fechaFicha, useEsAdministrador } from '@/components/ficha';
import { Pestanas, pestanaInicial, type Pestana } from '@/components/inventario/computador/pestanas';
import {
    SeccionAntivirus,
    SeccionCambios,
    SeccionCasos,
    SeccionCertificados,
    SeccionComponentes,
    SeccionConexiones,
    SeccionContratos,
    SeccionDocumentos,
    SeccionHistorial,
    SeccionInfoFinanciera,
    SeccionProblemas,
    SeccionPuertosRed,
    SeccionSistemasOperativos,
    SeccionSoftware,
    SeccionVirtualizacion,
    SeccionVolumenes,
    agruparPuertos,
    totalComponentes,
    totalConexiones,
    type Antivirus,
    type Certificado,
    type Componentes,
    type Conexiones,
    type Contrato,
    type Documento,
    type InfoFinanciera,
    type MaquinaVirtual,
    type Programa,
    type PuertoRed,
    type Registro,
    type SistemaOperativo,
    type Volumen,
} from '@/components/inventario/computador/secciones';
import { Pagina } from '@/components/pagina';
import type { HistoryEntry } from '@/lib/inventory-history';
import { btn } from '@/lib/ui-classes';
import { Link } from '@inertiajs/react';
import { Cpu, Pencil } from 'lucide-react';
import { useState } from 'react';

interface Computador {
    id: number;
    name: string;
    serial: string | null;
    otherserial: string | null;
    comment: string | null;
    contact: string | null;
    contact_num?: string | null;
    uuid: string | null;
    date_mod: string | null;
    date_creation: string | null;
    state_name: string | null;
    manufacturer_name: string | null;
    type_name: string | null;
    model_name: string | null;
    location_name: string | null;
    entity_name: string | null;
    domain_name: string | null;
}

type Props = Componentes &
    Conexiones & {
        computer: Computador;
        operatingSystems: SistemaOperativo[];
        volumes: Volumen[];
        software: Programa[];
        tickets: Registro[];
        networkPorts: PuertoRed[];
        antivirus: Antivirus[];
        virtualMachines: MaquinaVirtual[];
        documents: Documento[];
        problems: Registro[];
        changes: Registro[];
        certificates: Certificado[];
        contracts: Contrato[];
        infocom: InfoFinanciera | null;
        history: HistoryEntry[];
    };

const CLAVES = ['general', 'os', 'components', 'volumes', 'software', 'connections', 'networkPorts', 'tickets', 'antivirus', 'virtualization', 'documents', 'problems', 'changes', 'certificates', 'contracts', 'infocom', 'history'] as const;
type Clave = (typeof CLAVES)[number];

export default function VerComputador(props: Props) {
    const { computer: c } = props;
    const esAdmin = useEsAdministrador();
    const [pestana, setPestana] = useState<Clave>(() => pestanaInicial(CLAVES, 'general'));

    const componentes: Componentes = {
        processors: props.processors,
        memories: props.memories,
        hardDrives: props.hardDrives,
        networkCards: props.networkCards,
        graphicCards: props.graphicCards,
        soundCards: props.soundCards,
        controllers: props.controllers,
        drives: props.drives,
        firmwares: props.firmwares,
        motherboards: props.motherboards,
    };
    const conexiones: Conexiones = { monitors: props.monitors, peripherals: props.peripherals, printers: props.printers, phones: props.phones };

    const pestanas: Pestana<Clave>[] = [
        { clave: 'general', texto: 'Computador' },
        { clave: 'os', texto: 'Sistemas operativos', contador: props.operatingSystems.length },
        { clave: 'components', texto: 'Componentes', contador: totalComponentes(componentes) },
        { clave: 'volumes', texto: 'Volúmenes', contador: props.volumes.length },
        { clave: 'software', texto: 'Software', contador: props.software.length },
        { clave: 'connections', texto: 'Conexiones', contador: totalConexiones(conexiones) },
        { clave: 'networkPorts', texto: 'Puertos de red', contador: agruparPuertos(props.networkPorts).length },
        { clave: 'tickets', texto: 'Casos', contador: props.tickets.length },
        { clave: 'antivirus', texto: 'Antivirus', contador: props.antivirus.length },
        { clave: 'virtualization', texto: 'Virtualización', contador: props.virtualMachines.length },
        { clave: 'documents', texto: 'Documentos', contador: props.documents.length },
        { clave: 'problems', texto: 'Problemas', contador: props.problems.length },
        { clave: 'changes', texto: 'Cambios', contador: props.changes.length },
        { clave: 'certificates', texto: 'Certificados', contador: props.certificates.length },
        { clave: 'contracts', texto: 'Contratos', contador: props.contracts.length },
        { clave: 'infocom', texto: 'Información financiera', contador: props.infocom ? 1 : 0 },
        { clave: 'history', texto: 'Historial', contador: props.history.length },
    ];

    const nombre = c.name || `#${c.id}`;
    return (
        <Pagina titulo={nombre} ancho="max-w-7xl" migas={[{ texto: 'Inicio', href: '/dashboard' }, { texto: 'Inventario', href: '/inventario/global' }, { texto: 'Computadores', href: '/inventario/computadores' }, { texto: nombre }]}>
            <FichaEncabezado
                titulo={nombre}
                detalle={<span className="tabular-nums">ID: {c.id}</span>}
                volverHref="/inventario/computadores"
                volverTexto="Computadores"
                acciones={
                    // Solo el Administrador puede editar: a los demás el botón los llevaba a un 403
                    esAdmin && (
                        <Link href={`/inventario/computadores/${c.id}/editar`} className={btn.primary}>
                            <Pencil aria-hidden="true" />
                            Editar
                        </Link>
                    )
                }
            />

            <Pestanas pestanas={pestanas} activa={pestana} onCambiar={setPestana} etiqueta="Secciones del computador">
                {pestana === 'general' && (
                    <FichaSeccion titulo="Información general" icono={<Cpu className="size-5 text-huv-ink" aria-hidden="true" />}>
                        <Datos>
                            <Dato etiqueta="Nombre">{c.name}</Dato>
                            <Dato etiqueta="Entidad">{c.entity_name}</Dato>
                            <Dato etiqueta="Estado">{c.state_name}</Dato>
                            <Dato etiqueta="Tipo">{c.type_name}</Dato>
                            <Dato etiqueta="Fabricante">{c.manufacturer_name}</Dato>
                            <Dato etiqueta="Modelo">{c.model_name}</Dato>
                            <Dato etiqueta="Número de serie" mono>
                                {c.serial}
                            </Dato>
                            <Dato etiqueta="Número de inventario" mono>
                                {c.otherserial}
                            </Dato>
                            <Dato etiqueta="Dominio">{c.domain_name}</Dato>
                            <Dato etiqueta="Contacto">{c.contact}</Dato>
                            {c.contact_num && <Dato etiqueta="Número de contacto">{c.contact_num}</Dato>}
                            <Dato etiqueta="Localización" ancho>
                                {c.location_name}
                            </Dato>
                            {c.uuid && (
                                <Dato etiqueta="UUID" mono ancho>
                                    {c.uuid}
                                </Dato>
                            )}
                            {c.comment && (
                                <Dato etiqueta="Comentarios" ancho>
                                    <span className="whitespace-pre-wrap">{c.comment}</span>
                                </Dato>
                            )}
                            <Dato etiqueta="Fecha de creación">{fechaFicha(c.date_creation)}</Dato>
                            <Dato etiqueta="Última modificación">{fechaFicha(c.date_mod)}</Dato>
                        </Datos>
                    </FichaSeccion>
                )}
                {pestana === 'os' && <SeccionSistemasOperativos items={props.operatingSystems} />}
                {pestana === 'components' && <SeccionComponentes componentes={componentes} />}
                {pestana === 'volumes' && <SeccionVolumenes items={props.volumes} />}
                {pestana === 'software' && <SeccionSoftware items={props.software} />}
                {pestana === 'connections' && <SeccionConexiones conexiones={conexiones} />}
                {pestana === 'networkPorts' && <SeccionPuertosRed items={props.networkPorts} />}
                {pestana === 'tickets' && <SeccionCasos items={props.tickets} />}
                {pestana === 'antivirus' && <SeccionAntivirus items={props.antivirus} />}
                {pestana === 'virtualization' && <SeccionVirtualizacion items={props.virtualMachines} />}
                {pestana === 'documents' && <SeccionDocumentos items={props.documents} />}
                {pestana === 'problems' && <SeccionProblemas items={props.problems} />}
                {pestana === 'changes' && <SeccionCambios items={props.changes} />}
                {pestana === 'certificates' && <SeccionCertificados items={props.certificates} />}
                {pestana === 'contracts' && <SeccionContratos items={props.contracts} />}
                {pestana === 'infocom' && <SeccionInfoFinanciera info={props.infocom} />}
                {pestana === 'history' && <SeccionHistorial items={props.history} />}
            </Pestanas>
        </Pagina>
    );
}
