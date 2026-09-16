import { fechaFicha } from '@/components/ficha';
import { FlashBanner } from '@/components/flash-banner';
import { seccionesComputador, valoresComputador, type OpcionesComputador } from '@/components/inventario/computador/campos-computador';
import {
    EditorAntivirus,
    EditorInfoFinanciera,
    EditorSistemasOperativos,
    EditorVolumenes,
    type CatalogosSO,
    type SistemaOperativoEditable,
    type VolumenEditable,
} from '@/components/inventario/computador/editores';
import { Pestanas, pestanaInicial, type Pestana } from '@/components/inventario/computador/pestanas';
import {
    SeccionCambios,
    SeccionCasos,
    SeccionCertificados,
    SeccionComponentes,
    SeccionConexiones,
    SeccionContratos,
    SeccionDocumentos,
    SeccionProblemas,
    SeccionPuertosRed,
    SeccionSoftware,
    SeccionVirtualizacion,
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
} from '@/components/inventario/computador/secciones';
import { FormularioInventario, type FormularioBase } from '@/components/inventario-formulario';
import { PageHeader } from '@/components/page-header';
import { Pagina } from '@/components/pagina';
import type { DropdownOption } from '@/components/select-with-create';
import { btn } from '@/lib/ui-classes';
import { Link, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, Eye } from 'lucide-react';
import { useState } from 'react';

type Props = OpcionesComputador &
    CatalogosSO &
    Componentes &
    Conexiones & {
        computer: { id: number; name: string; is_deleted?: number | string; date_creation: string | null; date_mod: string | null } & Record<string, unknown>;
        operatingSystems: SistemaOperativoEditable[];
        volumes: VolumenEditable[];
        filesystems: DropdownOption[];
        software: Programa[];
        networkPorts: PuertoRed[];
        tickets: Registro[];
        antivirus: Antivirus[];
        antivirusManufacturers: DropdownOption[];
        virtualMachines: MaquinaVirtual[];
        documents: Documento[];
        problems: Registro[];
        changes: Registro[];
        certificates: Certificado[];
        contracts: Contrato[];
        infocom: (InfoFinanciera & { id: number }) | null;
    };

// Las claves de las pestañas son las que usan los guardados del servidor (?tab=os, volumes, antivirus, infocom)
const CLAVES = ['general', 'os', 'components', 'volumes', 'software', 'connections', 'networkPorts', 'tickets', 'antivirus', 'virtualization', 'documents', 'problems', 'changes', 'certificates', 'contracts', 'infocom'] as const;
type Clave = (typeof CLAVES)[number];

export default function EditarComputador(props: Props) {
    const { computer: c } = props;
    const { flash } = usePage<{ flash?: { error?: string | null } }>().props;
    const [pestana, setPestana] = useState<Clave>(() => pestanaInicial(CLAVES, 'general'));
    const form = useForm(valoresComputador(c));

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
    ];

    const fechas = [c.date_creation && `Creado el ${fechaFicha(c.date_creation)}`, c.date_mod && `actualizado el ${fechaFicha(c.date_mod)}`].filter(Boolean).join(' · ');

    return (
        <Pagina
            titulo={`Editar ${c.name}`}
            ancho="max-w-7xl"
            migas={[{ texto: 'Inicio', href: '/dashboard' }, { texto: 'Inventario', href: '/inventario/global' }, { texto: 'Computadores', href: '/inventario/computadores' }, { texto: `Editar: ${c.name}` }]}
        >
            <PageHeader
                title="Editar computador"
                description={
                    <>
                        <span className="block">
                            <span className="font-medium text-gray-700">{c.name}</span> <span className="tabular-nums">· ID {c.id}</span>
                        </span>
                        {fechas && <span className="block">{fechas}</span>}
                    </>
                }
                actions={
                    <Link href={`/inventario/computadores/${c.id}`} className={btn.secondary}>
                        <Eye aria-hidden="true" />
                        Ver computador
                    </Link>
                }
            />

            {Number(c.is_deleted) === 1 && (
                <p role="status" className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-600/20 dark:text-amber-200">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    Este computador está eliminado (en la papelera): no aparece en la lista del inventario.
                </p>
            )}

            {/* El error de guardar los datos generales ya lo muestra su formulario */}
            <FlashBanner ignoreError={pestana === 'general' ? flash?.error : undefined} />

            <Pestanas pestanas={pestanas} activa={pestana} onCambiar={setPestana} etiqueta="Secciones del computador">
                {pestana === 'general' && (
                    <FormularioInventario
                        secciones={seccionesComputador(props, form.data, 'editar')}
                        form={form as unknown as FormularioBase}
                        enviar={() => form.put(`/inventario/computadores/${c.id}`, { preserveScroll: true, preserveState: 'errors' })}
                        accion="guardar los cambios"
                        cancelarHref={`/inventario/computadores/${c.id}`}
                        textoEnviar="Guardar"
                        textoEnviando="Guardando…"
                    />
                )}
                {pestana === 'os' && <EditorSistemasOperativos computerId={c.id} items={props.operatingSystems} catalogos={props} />}
                {pestana === 'components' && <SeccionComponentes componentes={componentes} />}
                {pestana === 'volumes' && <EditorVolumenes computerId={c.id} items={props.volumes} filesystems={props.filesystems} />}
                {pestana === 'software' && <SeccionSoftware items={props.software} />}
                {pestana === 'connections' && <SeccionConexiones conexiones={conexiones} />}
                {pestana === 'networkPorts' && <SeccionPuertosRed items={props.networkPorts} />}
                {pestana === 'tickets' && <SeccionCasos items={props.tickets} />}
                {pestana === 'antivirus' && <EditorAntivirus computerId={c.id} items={props.antivirus} fabricantes={props.antivirusManufacturers} />}
                {pestana === 'virtualization' && <SeccionVirtualizacion items={props.virtualMachines} />}
                {pestana === 'documents' && <SeccionDocumentos items={props.documents} />}
                {pestana === 'problems' && <SeccionProblemas items={props.problems} />}
                {pestana === 'changes' && <SeccionCambios items={props.changes} />}
                {pestana === 'certificates' && <SeccionCertificados items={props.certificates} />}
                {pestana === 'contracts' && <SeccionContratos items={props.contracts} />}
                {pestana === 'infocom' && <EditorInfoFinanciera computerId={c.id} info={props.infocom} />}
            </Pestanas>
        </Pagina>
    );
}
