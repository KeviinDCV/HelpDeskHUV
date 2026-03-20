import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import {
    ArrowLeft, Pencil, Monitor as MonitorIcon, Package, Cpu, Ticket,
    HardDrive, MemoryStick, Wifi, MonitorSpeaker, CircuitBoard, Shield,
    Server, FileText, AlertTriangle, RefreshCw, Award, ScrollText,
    Info, Disc3, Grip, Volume2, Waypoints, Printer, Phone
} from 'lucide-react';

// ============ INTERFACES ============

interface Computer {
    id: number;
    name: string;
    serial: string | null;
    otherserial: string | null;
    comment: string | null;
    contact: string | null;
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

interface OperatingSystem {
    os_name: string | null;
    version_name: string | null;
    arch_name: string | null;
    servicepack_name: string | null;
    kernel_version: string | null;
    edition_name: string | null;
    license_number: string | null;
    license_id: string | null;
}

interface ProcessorItem { designation: string | null; frequency: number | null; nbcores: number | null; nbthreads: number | null; serial: string | null; }
interface MemoryItem { designation: string | null; size: number | null; serial: string | null; busID: string | null; }
interface HardDriveItem { designation: string | null; capacity: number | null; serial: string | null; }
interface NetworkCard { designation: string | null; mac: string | null; }
interface GraphicCard { designation: string | null; memory: number | null; }
interface SoundCard { designation: string | null; serial: string | null; }
interface ControllerItem { designation: string | null; serial: string | null; }
interface DriveItem { designation: string | null; serial: string | null; }
interface FirmwareItem { designation: string | null; serial: string | null; type_name: string | null; }
interface MotherboardItem { designation: string | null; serial: string | null; }
interface VolumeItem { name: string | null; mountpoint: string | null; totalsize: number | null; freesize: number | null; filesystem_name: string | null; device: string | null; }
interface SoftwareItem { name: string; version: string | null; }
interface MonitorItem { id: number; name: string; serial: string | null; manufacturer_name: string | null; }
interface PeripheralItem { id: number; name: string; serial: string | null; }
interface PrinterItem { id: number; name: string; serial: string | null; }
interface PhoneItem { id: number; name: string; serial: string | null; }
interface TicketItem { id: number; name: string; status: number; date: string; }
interface AntivirusItem { id: number; name: string | null; antivirus_version: string | null; signature_version: string | null; is_active: number; is_uptodate: number; }
interface VirtualMachine { id: number; name: string | null; uuid: string | null; }
interface DocumentItem { id: number; name: string | null; filename: string | null; mime: string | null; date_mod: string | null; }
interface ProblemItem { id: number; name: string; status: number; date: string; }
interface ChangeItem { id: number; name: string; status: number; date: string; }
interface CertificateItem { id: number; name: string | null; serial: string | null; date_expiration: string | null; }
interface ContractItem { id: number; name: string | null; num: string | null; begin_date: string | null; duration: number | null; }
interface InfocomItem {
    buy_date: string | null; use_date: string | null; warranty_date: string | null;
    warranty_duration: number | null; order_number: string | null; delivery_number: string | null;
    immo_number: string | null; value: number | null;
}

interface Props {
    computer: Computer;
    operatingSystems: OperatingSystem[];
    processors: ProcessorItem[];
    memories: MemoryItem[];
    hardDrives: HardDriveItem[];
    networkCards: NetworkCard[];
    graphicCards: GraphicCard[];
    soundCards: SoundCard[];
    controllers: ControllerItem[];
    drives: DriveItem[];
    firmwares: FirmwareItem[];
    motherboards: MotherboardItem[];
    volumes: VolumeItem[];
    software: SoftwareItem[];
    monitors: MonitorItem[];
    peripherals: PeripheralItem[];
    printers: PrinterItem[];
    phones: PhoneItem[];
    tickets: TicketItem[];
    antivirus: AntivirusItem[];
    virtualMachines: VirtualMachine[];
    documents: DocumentItem[];
    problems: ProblemItem[];
    changes: ChangeItem[];
    certificates: CertificateItem[];
    contracts: ContractItem[];
    infocom: InfocomItem | null;
}

// ============ HELPERS ============

const getStatusLabel = (status: number) => {
    const statusMap: Record<number, { label: string; color: string }> = {
        1: { label: 'Nuevo', color: 'bg-blue-100 text-blue-800' },
        2: { label: 'En curso', color: 'bg-yellow-100 text-yellow-800' },
        3: { label: 'Planificado', color: 'bg-purple-100 text-purple-800' },
        4: { label: 'En espera', color: 'bg-orange-100 text-orange-800' },
        5: { label: 'Resuelto', color: 'bg-green-100 text-green-800' },
        6: { label: 'Cerrado', color: 'bg-gray-100 text-gray-800' },
    };
    return statusMap[status] || { label: 'Desconocido', color: 'bg-gray-100 text-gray-800' };
};

const formatSize = (mb: number | null) => {
    if (!mb) return '-';
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
};

const EmptyState = ({ message }: { message: string }) => (
    <p className="text-sm text-gray-500 text-center py-6">{message}</p>
);

const DataTable = ({ headers, children, maxHeight }: { headers: string[]; children: React.ReactNode; maxHeight?: string }) => (
    <div className={maxHeight ? `overflow-y-auto ${maxHeight}` : ''}>
        <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
                <tr>
                    {headers.map((h, i) => (
                        <th key={i} className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">{children}</tbody>
        </table>
    </div>
);

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <label className="text-xs text-gray-500 uppercase tracking-wide">{label}</label>
        <p className="text-sm font-medium text-gray-900">{value || '-'}</p>
    </div>
);

// ============ TAB DEFINITIONS ============

type TabKey = 'general' | 'os' | 'components' | 'volumes' | 'software' | 'connections' | 'tickets' | 'antivirus' | 'virtualization' | 'documents' | 'problems' | 'changes' | 'certificates' | 'contracts' | 'infocom';

interface TabDef {
    key: TabKey;
    label: string;
    icon: React.ReactNode;
    count?: number;
}

// ============ MAIN COMPONENT ============

export default function VerComputador(props: Props) {
    const {
        computer, operatingSystems, processors, memories, hardDrives,
        networkCards, graphicCards, soundCards, controllers, drives,
        firmwares, motherboards, volumes, software, monitors, peripherals,
        printers, phones, tickets, antivirus, virtualMachines, documents,
        problems, changes, certificates, contracts, infocom,
    } = props;

    const [activeTab, setActiveTab] = useState<TabKey>('general');

    const totalComponents = processors.length + memories.length + hardDrives.length +
        networkCards.length + graphicCards.length + soundCards.length +
        controllers.length + drives.length + firmwares.length + motherboards.length;

    const totalConnections = monitors.length + peripherals.length + printers.length + phones.length;

    const tabs: TabDef[] = [
        { key: 'general', label: 'Computador', icon: <Cpu className="h-4 w-4" /> },
        { key: 'os', label: 'Sistemas Operativos', icon: <MonitorIcon className="h-4 w-4" />, count: operatingSystems.length },
        { key: 'components', label: 'Componentes', icon: <CircuitBoard className="h-4 w-4" />, count: totalComponents },
        { key: 'volumes', label: 'Volúmenes', icon: <HardDrive className="h-4 w-4" />, count: volumes.length },
        { key: 'software', label: 'Software', icon: <Package className="h-4 w-4" />, count: software.length },
        { key: 'connections', label: 'Conexiones', icon: <Waypoints className="h-4 w-4" />, count: totalConnections },
        { key: 'tickets', label: 'Casos', icon: <Ticket className="h-4 w-4" />, count: tickets.length },
        { key: 'antivirus', label: 'Antivirus', icon: <Shield className="h-4 w-4" />, count: antivirus.length },
        { key: 'virtualization', label: 'Virtualización', icon: <Server className="h-4 w-4" />, count: virtualMachines.length },
        { key: 'documents', label: 'Documentos', icon: <FileText className="h-4 w-4" />, count: documents.length },
        { key: 'problems', label: 'Problemas', icon: <AlertTriangle className="h-4 w-4" />, count: problems.length },
        { key: 'changes', label: 'Cambios', icon: <RefreshCw className="h-4 w-4" />, count: changes.length },
        { key: 'certificates', label: 'Certificados', icon: <Award className="h-4 w-4" />, count: certificates.length },
        { key: 'contracts', label: 'Contratos', icon: <ScrollText className="h-4 w-4" />, count: contracts.length },
        { key: 'infocom', label: 'Info. Financiera', icon: <Info className="h-4 w-4" />, count: infocom ? 1 : 0 },
    ];

    return (
        <>
            <Head title={`${computer.name} - HelpDesk HUV`} />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/inventario/computadores" className="text-[#2c4370] hover:underline">Computadores</Link>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">{computer.name}</span>
                    </div>
                } />

                <main className="flex-1 p-4 sm:p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="sm" onClick={() => router.visit('/inventario/computadores')}>
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Volver
                                </Button>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{computer.name}</h1>
                                    <p className="text-sm text-gray-500">ID: {computer.id}</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => router.visit(`/inventario/computadores/${computer.id}/editar`)}
                                className="bg-[#2c4370] hover:bg-[#3d5583]"
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                            </Button>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Sidebar Navigation */}
                            <nav className="lg:w-64 shrink-0">
                                <div className="bg-white rounded-lg shadow-sm border overflow-hidden lg:sticky lg:top-4">
                                    <div className="p-3 bg-[#2c4370] text-white text-sm font-semibold">
                                        Secciones
                                    </div>
                                    <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
                                        {tabs.map((tab) => (
                                            <button
                                                key={tab.key}
                                                onClick={() => setActiveTab(tab.key)}
                                                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                                                    activeTab === tab.key
                                                        ? 'bg-blue-50 text-[#2c4370] font-semibold border-l-3 border-[#2c4370]'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {tab.icon}
                                                <span className="flex-1 truncate">{tab.label}</span>
                                                {tab.count !== undefined && (
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                        tab.count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {tab.count}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </nav>

                            {/* Content Area */}
                            <div className="flex-1 min-w-0">
                                <div className="bg-white rounded-lg shadow-sm border p-6">
                                    {activeTab === 'general' && <TabGeneral computer={computer} />}
                                    {activeTab === 'os' && <TabOperatingSystems data={operatingSystems} />}
                                    {activeTab === 'components' && (
                                        <TabComponents
                                            processors={processors} memories={memories} hardDrives={hardDrives}
                                            networkCards={networkCards} graphicCards={graphicCards} soundCards={soundCards}
                                            controllers={controllers} drives={drives} firmwares={firmwares} motherboards={motherboards}
                                        />
                                    )}
                                    {activeTab === 'volumes' && <TabVolumes data={volumes} />}
                                    {activeTab === 'software' && <TabSoftware data={software} />}
                                    {activeTab === 'connections' && (
                                        <TabConnections monitors={monitors} peripherals={peripherals} printers={printers} phones={phones} />
                                    )}
                                    {activeTab === 'tickets' && <TabTickets data={tickets} />}
                                    {activeTab === 'antivirus' && <TabAntivirus data={antivirus} />}
                                    {activeTab === 'virtualization' && <TabVirtualization data={virtualMachines} />}
                                    {activeTab === 'documents' && <TabDocuments data={documents} />}
                                    {activeTab === 'problems' && <TabProblems data={problems} />}
                                    {activeTab === 'changes' && <TabChanges data={changes} />}
                                    {activeTab === 'certificates' && <TabCertificates data={certificates} />}
                                    {activeTab === 'contracts' && <TabContracts data={contracts} />}
                                    {activeTab === 'infocom' && <TabInfocom data={infocom} />}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <GLPIFooter />
            </div>
        </>
    );
}

// ============ TAB COMPONENTS ============

function TabGeneral({ computer }: { computer: Computer }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-[#2c4370]" />
                Información General
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Nombre" value={computer.name} />
                <InfoRow label="Entidad" value={computer.entity_name} />
                <InfoRow label="Estado" value={computer.state_name} />
                <InfoRow label="Tipo" value={computer.type_name} />
                <InfoRow label="Fabricante" value={computer.manufacturer_name} />
                <InfoRow label="Modelo" value={computer.model_name} />
                <InfoRow label="Número de Serie" value={computer.serial ? <span className="font-mono">{computer.serial}</span> : null} />
                <InfoRow label="Número de Inventario" value={computer.otherserial ? <span className="font-mono">{computer.otherserial}</span> : null} />
                <InfoRow label="Dominio" value={computer.domain_name} />
                <InfoRow label="Contacto" value={computer.contact} />
                <div className="sm:col-span-2">
                    <InfoRow label="Localización" value={computer.location_name} />
                </div>
                {computer.uuid && <div className="sm:col-span-2"><InfoRow label="UUID" value={<span className="font-mono text-xs">{computer.uuid}</span>} /></div>}
                {computer.comment && (
                    <div className="sm:col-span-2">
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Comentarios</label>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{computer.comment}</p>
                    </div>
                )}
                <InfoRow label="Fecha de Creación" value={computer.date_creation ? new Date(computer.date_creation).toLocaleString('es-CO') : null} />
                <InfoRow label="Última Modificación" value={computer.date_mod ? new Date(computer.date_mod).toLocaleString('es-CO') : null} />
            </div>
        </>
    );
}

function TabOperatingSystems({ data }: { data: OperatingSystem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MonitorIcon className="h-5 w-5 text-[#2c4370]" />
                Sistemas Operativos
                <span className="text-sm font-normal text-gray-500">({data.length})</span>
            </h2>
            {data.length > 0 ? (
                <div className="space-y-4">
                    {data.map((os, idx) => (
                        <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                            <h3 className="font-semibold text-gray-900 mb-3">{os.os_name || 'Sistema Operativo desconocido'}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InfoRow label="Versión" value={os.version_name} />
                                <InfoRow label="Arquitectura" value={os.arch_name} />
                                <InfoRow label="Edición" value={os.edition_name} />
                                <InfoRow label="Service Pack" value={os.servicepack_name} />
                                <InfoRow label="Kernel" value={os.kernel_version} />
                                <InfoRow label="N° Licencia" value={os.license_number ? <span className="font-mono text-xs">{os.license_number}</span> : null} />
                                <InfoRow label="ID Licencia" value={os.license_id ? <span className="font-mono text-xs">{os.license_id}</span> : null} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState message="No hay sistemas operativos registrados" />
            )}
        </>
    );
}

function TabComponents({ processors, memories, hardDrives, networkCards, graphicCards, soundCards, controllers, drives, firmwares, motherboards }: {
    processors: ProcessorItem[]; memories: MemoryItem[]; hardDrives: HardDriveItem[]; networkCards: NetworkCard[];
    graphicCards: GraphicCard[]; soundCards: SoundCard[]; controllers: ControllerItem[]; drives: DriveItem[];
    firmwares: FirmwareItem[]; motherboards: MotherboardItem[];
}) {
    const total = processors.length + memories.length + hardDrives.length + networkCards.length +
        graphicCards.length + soundCards.length + controllers.length + drives.length + firmwares.length + motherboards.length;

    const Section = ({ title, icon, children, count }: { title: string; icon: React.ReactNode; children: React.ReactNode; count: number }) => (
        count > 0 ? (
            <div className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2 pb-2 border-b">
                    {icon} {title} <span className="text-xs font-normal text-gray-500">({count})</span>
                </h3>
                {children}
            </div>
        ) : null
    );

    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CircuitBoard className="h-5 w-5 text-[#2c4370]" />
                Componentes
                <span className="text-sm font-normal text-gray-500">({total})</span>
            </h2>
            {total === 0 ? <EmptyState message="No hay componentes registrados" /> : (
                <>
                    <Section title="Procesadores" icon={<Cpu className="h-4 w-4 text-blue-600" />} count={processors.length}>
                        <DataTable headers={['Nombre', 'Frecuencia', 'Núcleos', 'Hilos', 'Serial']}>
                            {processors.map((p, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-900">{p.designation || '-'}</td>
                                    <td className="py-2 px-3 text-gray-600">{p.frequency ? `${p.frequency} MHz` : '-'}</td>
                                    <td className="py-2 px-3 text-gray-600">{p.nbcores ?? '-'}</td>
                                    <td className="py-2 px-3 text-gray-600">{p.nbthreads ?? '-'}</td>
                                    <td className="py-2 px-3 text-gray-500 font-mono text-xs">{p.serial || '-'}</td>
                                </tr>
                            ))}
                        </DataTable>
                    </Section>

                    <Section title="Memoria RAM" icon={<MemoryStick className="h-4 w-4 text-green-600" />} count={memories.length}>
                        <DataTable headers={['Nombre', 'Tamaño', 'Serial', 'Bus ID']}>
                            {memories.map((m, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-900">{m.designation || '-'}</td>
                                    <td className="py-2 px-3 text-gray-600">{formatSize(m.size)}</td>
                                    <td className="py-2 px-3 text-gray-500 font-mono text-xs">{m.serial || '-'}</td>
                                    <td className="py-2 px-3 text-gray-500">{m.busID || '-'}</td>
                                </tr>
                            ))}
                        </DataTable>
                    </Section>

                    <Section title="Discos Duros" icon={<HardDrive className="h-4 w-4 text-orange-600" />} count={hardDrives.length}>
                        <DataTable headers={['Nombre', 'Capacidad', 'Serial']}>
                            {hardDrives.map((h, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-900">{h.designation || '-'}</td>
                                    <td className="py-2 px-3 text-gray-600">{h.capacity ? formatSize(h.capacity) : '-'}</td>
                                    <td className="py-2 px-3 text-gray-500 font-mono text-xs">{h.serial || '-'}</td>
                                </tr>
                            ))}
                        </DataTable>
                    </Section>

                    <Section title="Tarjetas de Red" icon={<Wifi className="h-4 w-4 text-cyan-600" />} count={networkCards.length}>
                        <DataTable headers={['Nombre', 'Dirección MAC']}>
                            {networkCards.map((n, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-900">{n.designation || '-'}</td>
                                    <td className="py-2 px-3 text-gray-500 font-mono text-xs">{n.mac || '-'}</td>
                                </tr>
                            ))}
                        </DataTable>
                    </Section>

                    <Section title="Tarjetas Gráficas" icon={<MonitorSpeaker className="h-4 w-4 text-purple-600" />} count={graphicCards.length}>
                        <DataTable headers={['Nombre', 'Memoria']}>
                            {graphicCards.map((g, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-900">{g.designation || '-'}</td>
                                    <td className="py-2 px-3 text-gray-600">{formatSize(g.memory)}</td>
                                </tr>
                            ))}
                        </DataTable>
                    </Section>

                    <Section title="Tarjetas de Sonido" icon={<Volume2 className="h-4 w-4 text-pink-600" />} count={soundCards.length}>
                        <DataTable headers={['Nombre', 'Serial']}>
                            {soundCards.map((s, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-900">{s.designation || '-'}</td>
                                    <td className="py-2 px-3 text-gray-500 font-mono text-xs">{s.serial || '-'}</td>
                                </tr>
                            ))}
                        </DataTable>
                    </Section>

                    <Section title="Controladores" icon={<Grip className="h-4 w-4 text-amber-600" />} count={controllers.length}>
                        <DataTable headers={['Nombre', 'Serial']}>
                            {controllers.map((c, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-900">{c.designation || '-'}</td>
                                    <td className="py-2 px-3 text-gray-500 font-mono text-xs">{c.serial || '-'}</td>
                                </tr>
                            ))}
                        </DataTable>
                    </Section>

                    <Section title="Unidades" icon={<Disc3 className="h-4 w-4 text-teal-600" />} count={drives.length}>
                        <DataTable headers={['Nombre', 'Serial']}>
                            {drives.map((d, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-900">{d.designation || '-'}</td>
                                    <td className="py-2 px-3 text-gray-500 font-mono text-xs">{d.serial || '-'}</td>
                                </tr>
                            ))}
                        </DataTable>
                    </Section>

                    <Section title="Firmware/BIOS" icon={<CircuitBoard className="h-4 w-4 text-red-600" />} count={firmwares.length}>
                        <DataTable headers={['Nombre', 'Tipo', 'Serial']}>
                            {firmwares.map((f, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-900">{f.designation || '-'}</td>
                                    <td className="py-2 px-3 text-gray-600">{f.type_name || '-'}</td>
                                    <td className="py-2 px-3 text-gray-500 font-mono text-xs">{f.serial || '-'}</td>
                                </tr>
                            ))}
                        </DataTable>
                    </Section>

                    <Section title="Placa Base" icon={<CircuitBoard className="h-4 w-4 text-indigo-600" />} count={motherboards.length}>
                        <DataTable headers={['Nombre', 'Serial']}>
                            {motherboards.map((mb, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-900">{mb.designation || '-'}</td>
                                    <td className="py-2 px-3 text-gray-500 font-mono text-xs">{mb.serial || '-'}</td>
                                </tr>
                            ))}
                        </DataTable>
                    </Section>
                </>
            )}
        </>
    );
}

function TabVolumes({ data }: { data: VolumeItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-[#2c4370]" />
                Volúmenes
                <span className="text-sm font-normal text-gray-500">({data.length})</span>
            </h2>
            {data.length > 0 ? (
                <div className="space-y-4">
                    {data.map((vol, idx) => {
                        const usedSize = vol.totalsize && vol.freesize ? vol.totalsize - vol.freesize : null;
                        const usagePercent = vol.totalsize && vol.freesize
                            ? ((vol.totalsize - vol.freesize) / vol.totalsize * 100)
                            : null;
                        const barColor = usagePercent !== null
                            ? usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                            : 'bg-gray-300';

                        return (
                            <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900">{vol.name || vol.mountpoint || 'Volumen'}</h3>
                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{vol.filesystem_name || '-'}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                    <InfoRow label="Punto de montaje" value={vol.mountpoint} />
                                    <InfoRow label="Total" value={formatSize(vol.totalsize)} />
                                    <InfoRow label="Usado" value={usedSize !== null ? formatSize(usedSize) : '-'} />
                                    <InfoRow label="Libre" value={formatSize(vol.freesize)} />
                                </div>
                                {usagePercent !== null && (
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Uso del disco</span>
                                            <span>{usagePercent.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState message="No hay volúmenes registrados" />
            )}
        </>
    );
}

function TabSoftware({ data }: { data: SoftwareItem[] }) {
    const [search, setSearch] = useState('');
    const filtered = data.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.version?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );

    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-[#2c4370]" />
                Software Instalado
                <span className="text-sm font-normal text-gray-500">({data.length})</span>
            </h2>
            {data.length > 0 ? (
                <>
                    <div className="mb-3">
                        <input
                            type="text"
                            placeholder="Buscar software..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-64 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c4370]/20 focus:border-[#2c4370]"
                        />
                    </div>
                    <DataTable headers={['Nombre', 'Versión']} maxHeight="max-h-96">
                        {filtered.map((soft, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="py-2 px-3 text-gray-900">{soft.name}</td>
                                <td className="py-2 px-3 text-gray-600">{soft.version || '-'}</td>
                            </tr>
                        ))}
                    </DataTable>
                    {search && filtered.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No se encontraron resultados</p>
                    )}
                </>
            ) : (
                <EmptyState message="No hay software registrado" />
            )}
        </>
    );
}

function TabConnections({ monitors, peripherals, printers, phones }: {
    monitors: MonitorItem[]; peripherals: PeripheralItem[]; printers: PrinterItem[]; phones: PhoneItem[];
}) {
    const total = monitors.length + peripherals.length + printers.length + phones.length;

    const ConnectionSection = ({ title, icon, items }: { title: string; icon: React.ReactNode; items: { id: number; name: string; serial: string | null; extra?: string | null }[] }) => (
        items.length > 0 ? (
            <div className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2 pb-2 border-b">
                    {icon} {title} <span className="text-xs font-normal text-gray-500">({items.length})</span>
                </h3>
                <div className="space-y-2">
                    {items.map((item) => (
                        <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                            {item.extra && <p className="text-xs text-gray-500">{item.extra}</p>}
                            {item.serial && <p className="text-xs font-mono text-gray-500">S/N: {item.serial}</p>}
                        </div>
                    ))}
                </div>
            </div>
        ) : null
    );

    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Waypoints className="h-5 w-5 text-[#2c4370]" />
                Conexiones
                <span className="text-sm font-normal text-gray-500">({total})</span>
            </h2>
            {total === 0 ? <EmptyState message="No hay conexiones registradas" /> : (
                <>
                    <ConnectionSection
                        title="Monitores"
                        icon={<MonitorIcon className="h-4 w-4 text-blue-600" />}
                        items={monitors.map(m => ({ id: m.id, name: m.name, serial: m.serial, extra: m.manufacturer_name }))}
                    />
                    <ConnectionSection
                        title="Periféricos"
                        icon={<Grip className="h-4 w-4 text-orange-600" />}
                        items={peripherals.map(p => ({ id: p.id, name: p.name, serial: p.serial }))}
                    />
                    <ConnectionSection
                        title="Impresoras"
                        icon={<Printer className="h-4 w-4 text-green-600" />}
                        items={printers.map(p => ({ id: p.id, name: p.name, serial: p.serial }))}
                    />
                    <ConnectionSection
                        title="Teléfonos"
                        icon={<Phone className="h-4 w-4 text-purple-600" />}
                        items={phones.map(p => ({ id: p.id, name: p.name, serial: p.serial }))}
                    />
                </>
            )}
        </>
    );
}

function TabTickets({ data }: { data: TicketItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-[#2c4370]" />
                Casos
                <span className="text-sm font-normal text-gray-500">({data.length})</span>
            </h2>
            {data.length > 0 ? (
                <div className="space-y-2">
                    {data.map((ticket) => {
                        const status = getStatusLabel(ticket.status);
                        return (
                            <Link
                                key={ticket.id}
                                href={`/soporte/casos/${ticket.id}/editar`}
                                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="font-medium text-gray-900 text-sm line-clamp-2">
                                        #{ticket.id} - {ticket.name}
                                    </p>
                                    <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(ticket.date).toLocaleDateString('es-CO')}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <EmptyState message="No hay casos relacionados" />
            )}
        </>
    );
}

function TabAntivirus({ data }: { data: AntivirusItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#2c4370]" />
                Antivirus
                <span className="text-sm font-normal text-gray-500">({data.length})</span>
            </h2>
            {data.length > 0 ? (
                <div className="space-y-4">
                    {data.map((av) => (
                        <div key={av.id} className="border rounded-lg p-4 bg-gray-50">
                            <h3 className="font-semibold text-gray-900 mb-3">{av.name || 'Antivirus'}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InfoRow label="Versión" value={av.antivirus_version} />
                                <InfoRow label="Versión de firmas" value={av.signature_version} />
                                <InfoRow label="Activo" value={
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${av.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {av.is_active ? 'Sí' : 'No'}
                                    </span>
                                } />
                                <InfoRow label="Actualizado" value={
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${av.is_uptodate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {av.is_uptodate ? 'Sí' : 'No'}
                                    </span>
                                } />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState message="No hay antivirus registrados" />
            )}
        </>
    );
}

function TabVirtualization({ data }: { data: VirtualMachine[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Server className="h-5 w-5 text-[#2c4370]" />
                Virtualización
                <span className="text-sm font-normal text-gray-500">({data.length})</span>
            </h2>
            {data.length > 0 ? (
                <DataTable headers={['Nombre', 'UUID']}>
                    {data.map((vm) => (
                        <tr key={vm.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-900">{vm.name || '-'}</td>
                            <td className="py-2 px-3 text-gray-500 font-mono text-xs">{vm.uuid || '-'}</td>
                        </tr>
                    ))}
                </DataTable>
            ) : (
                <EmptyState message="No hay máquinas virtuales registradas" />
            )}
        </>
    );
}

function TabDocuments({ data }: { data: DocumentItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#2c4370]" />
                Documentos
                <span className="text-sm font-normal text-gray-500">({data.length})</span>
            </h2>
            {data.length > 0 ? (
                <DataTable headers={['Nombre', 'Archivo', 'Tipo', 'Fecha']}>
                    {data.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-900">{doc.name || '-'}</td>
                            <td className="py-2 px-3 text-gray-600">{doc.filename || '-'}</td>
                            <td className="py-2 px-3 text-gray-500 text-xs">{doc.mime || '-'}</td>
                            <td className="py-2 px-3 text-gray-500">{doc.date_mod ? new Date(doc.date_mod).toLocaleDateString('es-CO') : '-'}</td>
                        </tr>
                    ))}
                </DataTable>
            ) : (
                <EmptyState message="No hay documentos asociados" />
            )}
        </>
    );
}

function TabProblems({ data }: { data: ProblemItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#2c4370]" />
                Problemas
                <span className="text-sm font-normal text-gray-500">({data.length})</span>
            </h2>
            {data.length > 0 ? (
                <div className="space-y-2">
                    {data.map((prob) => {
                        const status = getStatusLabel(prob.status);
                        return (
                            <div key={prob.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="font-medium text-gray-900 text-sm">#{prob.id} - {prob.name}</p>
                                    <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${status.color}`}>{status.label}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{new Date(prob.date).toLocaleDateString('es-CO')}</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState message="No hay problemas asociados" />
            )}
        </>
    );
}

function TabChanges({ data }: { data: ChangeItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-[#2c4370]" />
                Cambios
                <span className="text-sm font-normal text-gray-500">({data.length})</span>
            </h2>
            {data.length > 0 ? (
                <div className="space-y-2">
                    {data.map((ch) => {
                        const status = getStatusLabel(ch.status);
                        return (
                            <div key={ch.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="font-medium text-gray-900 text-sm">#{ch.id} - {ch.name}</p>
                                    <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${status.color}`}>{status.label}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{new Date(ch.date).toLocaleDateString('es-CO')}</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState message="No hay cambios asociados" />
            )}
        </>
    );
}

function TabCertificates({ data }: { data: CertificateItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-[#2c4370]" />
                Certificados
                <span className="text-sm font-normal text-gray-500">({data.length})</span>
            </h2>
            {data.length > 0 ? (
                <DataTable headers={['Nombre', 'Serial', 'Fecha expiración']}>
                    {data.map((cert) => (
                        <tr key={cert.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-900">{cert.name || '-'}</td>
                            <td className="py-2 px-3 text-gray-500 font-mono text-xs">{cert.serial || '-'}</td>
                            <td className="py-2 px-3 text-gray-500">{cert.date_expiration ? new Date(cert.date_expiration).toLocaleDateString('es-CO') : '-'}</td>
                        </tr>
                    ))}
                </DataTable>
            ) : (
                <EmptyState message="No hay certificados asociados" />
            )}
        </>
    );
}

function TabContracts({ data }: { data: ContractItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-[#2c4370]" />
                Contratos
                <span className="text-sm font-normal text-gray-500">({data.length})</span>
            </h2>
            {data.length > 0 ? (
                <DataTable headers={['Nombre', 'Número', 'Fecha inicio', 'Duración (meses)']}>
                    {data.map((con) => (
                        <tr key={con.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-900">{con.name || '-'}</td>
                            <td className="py-2 px-3 text-gray-500">{con.num || '-'}</td>
                            <td className="py-2 px-3 text-gray-500">{con.begin_date ? new Date(con.begin_date).toLocaleDateString('es-CO') : '-'}</td>
                            <td className="py-2 px-3 text-gray-500">{con.duration ?? '-'}</td>
                        </tr>
                    ))}
                </DataTable>
            ) : (
                <EmptyState message="No hay contratos asociados" />
            )}
        </>
    );
}

function TabInfocom({ data }: { data: InfocomItem | null }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-[#2c4370]" />
                Información Financiera
            </h2>
            {data ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow label="Fecha de compra" value={data.buy_date ? new Date(data.buy_date).toLocaleDateString('es-CO') : null} />
                    <InfoRow label="Fecha de uso" value={data.use_date ? new Date(data.use_date).toLocaleDateString('es-CO') : null} />
                    <InfoRow label="N° de pedido" value={data.order_number} />
                    <InfoRow label="N° de entrega" value={data.delivery_number} />
                    <InfoRow label="N° de inmovilización" value={data.immo_number} />
                    <InfoRow label="Valor" value={data.value != null ? `$${Number(data.value).toLocaleString('es-CO')}` : null} />
                    <InfoRow label="Fecha de garantía" value={data.warranty_date ? new Date(data.warranty_date).toLocaleDateString('es-CO') : null} />
                    <InfoRow label="Duración garantía (meses)" value={data.warranty_duration?.toString()} />
                </div>
            ) : (
                <EmptyState message="No hay información financiera registrada" />
            )}
        </>
    );
}
