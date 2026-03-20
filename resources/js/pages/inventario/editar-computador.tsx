import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Save, Monitor as MonitorIcon, Cpu, HardDrive, Package,
    Plus, Trash2, Pencil, X, Check, Shield, Server, FileText,
    AlertTriangle, RefreshCw, Award, ScrollText, Info, Ticket,
    Network, Printer, Phone, Wifi, Volume2, Waypoints, Disc3,
    Grip, CircuitBoard, MonitorSpeaker
} from 'lucide-react';
import React, { useState } from 'react';

// ============ INTERFACES ============
interface Option { id: number; name: string; completename?: string; }
interface UserOption { id: number; name: string; realname: string | null; firstname: string | null; }

interface Computer {
    id: number; name: string; serial: string | null; otherserial: string | null;
    states_id: number; manufacturers_id: number; computertypes_id: number; computermodels_id: number;
    locations_id: number; entities_id: number; comment: string | null;
    users_id_tech: number; groups_id_tech: number; contact: string | null; contact_num: string | null;
    users_id: number; groups_id: number; domains_id: number;
    date_creation: string | null; date_mod: string | null;
}

interface OSItem {
    id: number; operatingsystems_id: number; operatingsystemversions_id: number;
    operatingsystemarchitectures_id: number; operatingsystemservicepacks_id: number;
    operatingsystemkernelversions_id: number; operatingsystemeditions_id: number;
    license_number: string | null; license_id: string | null;
    os_name: string | null; version_name: string | null; arch_name: string | null;
    servicepack_name: string | null; kernel_version: string | null; edition_name: string | null;
}

interface VolumeItem {
    id: number; name: string | null; mountpoint: string | null; device: string | null;
    filesystems_id: number; totalsize: number | null; freesize: number | null;
    filesystem_name: string | null;
}

interface ComponentItem { designation: string | null; frequency?: number | null; nbcores?: number | null; nbthreads?: number | null; serial?: string | null; size?: string | null; manufacturer_name?: string | null; mac?: string | null; type_name?: string | null; }
interface SoftwareItem { id?: number; name: string; version: string | null; }
interface MonitorItem { id: number; name: string; serial: string | null; manufacturer_name: string | null; }
interface PeripheralItem { id: number; name: string; serial: string | null; }
interface PrinterItem { id: number; name: string; serial: string | null; }
interface PhoneItem { id: number; name: string; serial: string | null; }
interface TicketItem { id: number; name: string; status: number; date: string; }
interface AntivirusItem { id: number; name: string | null; manufacturers_id: number; antivirus_version: string | null; signature_version: string | null; is_active: number; is_uptodate: number; date_expiration: string | null; }
interface VirtualMachine { id: number; name: string | null; uuid: string | null; vcpu?: number | null; ram?: number | null; }
interface DocumentItem { id: number; name: string | null; filename: string | null; mime: string | null; date_mod: string | null; link_id?: number; }
interface ProblemItem { id: number; name: string; status: number; date: string; }
interface ChangeItem { id: number; name: string; status: number; date: string; }
interface CertificateItem { id: number; name: string | null; serial: string | null; date_expiration: string | null; link_id?: number; }
interface ContractItem { id: number; name: string | null; num: string | null; begin_date: string | null; duration: number | null; link_id?: number; }
interface NetworkPortItem {
    id: number; name: string | null; mac: string | null; logical_number: number | null;
    instantiation_type: string | null; ip_address: string | null; network_name: string | null;
    network_address: string | null; network_netmask: string | null; network_gateway: string | null;
}
interface InfocomItem {
    id?: number; buy_date: string | null; use_date: string | null; warranty_date: string | null;
    warranty_duration: number | null; warranty_info?: string | null; order_number: string | null;
    delivery_number: string | null; immo_number: string | null; value: number | null;
    warranty_value?: number | null; suppliers_id?: number; order_date?: string | null;
    delivery_date?: string | null; inventory_date?: string | null; decommission_date?: string | null;
    comment?: string | null; bill?: string | null;
}

interface Props {
    computer: Computer;
    states: Option[]; manufacturers: Option[]; types: Option[]; models: Option[];
    locations: Option[]; entities: Option[]; users: UserOption[]; groups: Option[]; domains: Option[];
    operatingSystems: OSItem[];
    osList: Option[]; osVersions: Option[]; osArchitectures: Option[];
    osServicePacks: Option[]; osKernelVersions: Option[]; osEditions: Option[];
    volumes: VolumeItem[]; filesystems: Option[];
    processors: ComponentItem[]; memories: ComponentItem[]; hardDrives: ComponentItem[];
    networkCards: ComponentItem[]; graphicCards: ComponentItem[];
    soundCards: ComponentItem[]; controllers: ComponentItem[]; drives: ComponentItem[];
    firmwares: ComponentItem[]; motherboards: ComponentItem[];
    software: SoftwareItem[];
    monitors: MonitorItem[]; peripherals: PeripheralItem[]; printers: PrinterItem[]; phones: PhoneItem[];
    networkPorts: NetworkPortItem[];
    tickets: TicketItem[];
    antivirus: AntivirusItem[]; antivirusManufacturers: Option[];
    virtualMachines: VirtualMachine[];
    documents: DocumentItem[];
    problems: ProblemItem[];
    changes: ChangeItem[];
    certificates: CertificateItem[];
    contracts: ContractItem[];
    infocom: InfocomItem | null;
}

type TabKey = 'general' | 'os' | 'components' | 'volumes' | 'software' | 'connections' | 'networkPorts' | 'tickets' | 'antivirus' | 'virtualization' | 'documents' | 'problems' | 'changes' | 'certificates' | 'contracts' | 'infocom';

const tabConfig: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'general', label: 'Computador', icon: MonitorIcon },
    { key: 'os', label: 'Sistemas operativos', icon: Package },
    { key: 'components', label: 'Componentes', icon: Cpu },
    { key: 'volumes', label: 'Volúmenes', icon: HardDrive },
    { key: 'software', label: 'Software', icon: Disc3 },
    { key: 'connections', label: 'Conexiones', icon: Waypoints },
    { key: 'networkPorts', label: 'Puertos de red', icon: Network },
    { key: 'tickets', label: 'Casos', icon: Ticket },
    { key: 'antivirus', label: 'Antivirus', icon: Shield },
    { key: 'virtualization', label: 'Virtualización', icon: Server },
    { key: 'documents', label: 'Documentos', icon: FileText },
    { key: 'problems', label: 'Problemas', icon: AlertTriangle },
    { key: 'changes', label: 'Cambios', icon: RefreshCw },
    { key: 'certificates', label: 'Certificados', icon: Award },
    { key: 'contracts', label: 'Contratos', icon: ScrollText },
    { key: 'infocom', label: 'Info. Financiera', icon: Info },
];

// ============ HELPER: Select dropdown ============
function SearchSelect({ value, onValueChange, options, placeholder }: {
    value: string; onValueChange: (v: string) => void; options: { id: number; label: string }[];
    placeholder: string;
}) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder={placeholder} /></SelectTrigger>
            <SelectContent>
                <SelectItem value="0">-- Ninguno --</SelectItem>
                {options.map((o) => (
                    <SelectItem key={o.id} value={o.id.toString()}>{o.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

// ============ TAB: GENERAL ============
function TabGeneral({ computer, states, manufacturers, types, models, locations, entities, users, groups, domains }: {
    computer: Computer; states: Option[]; manufacturers: Option[]; types: Option[]; models: Option[];
    locations: Option[]; entities: Option[]; users: UserOption[]; groups: Option[]; domains: Option[];
}) {
    const [formData, setFormData] = useState({
        name: computer.name || '',
        serial: computer.serial || '',
        otherserial: computer.otherserial || '',
        states_id: computer.states_id ? computer.states_id.toString() : '0',
        manufacturers_id: computer.manufacturers_id ? computer.manufacturers_id.toString() : '0',
        computertypes_id: computer.computertypes_id ? computer.computertypes_id.toString() : '0',
        computermodels_id: computer.computermodels_id ? computer.computermodels_id.toString() : '0',
        locations_id: computer.locations_id ? computer.locations_id.toString() : '0',
        entities_id: computer.entities_id ? computer.entities_id.toString() : '0',
        users_id_tech: computer.users_id_tech ? computer.users_id_tech.toString() : '0',
        groups_id_tech: computer.groups_id_tech ? computer.groups_id_tech.toString() : '0',
        contact: computer.contact || '',
        contact_num: computer.contact_num || '',
        users_id: computer.users_id ? computer.users_id.toString() : '0',
        groups_id: computer.groups_id ? computer.groups_id.toString() : '0',
        domains_id: computer.domains_id ? computer.domains_id.toString() : '0',
        comment: computer.comment || '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        router.put(`/inventario/computadores/${computer.id}`, formData, {
            onSuccess: () => setProcessing(false),
            onError: (errs) => { setErrors(errs as Record<string, string>); setProcessing(false); },
        });
    };

    const userOptions = users.map(u => ({
        id: u.id,
        label: u.realname && u.firstname ? `${u.realname} ${u.firstname} (${u.name})` : u.name,
    }));

    const set = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

    return (
        <form onSubmit={handleSubmit}>
            {/* Información Básica */}
            <div className="mb-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-1">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3">
                    <div className="md:col-span-2">
                        <Label htmlFor="name" className="text-xs">Nombre *</Label>
                        <Input id="name" value={formData.name} onChange={e => set('name', e.target.value)} required className="mt-1 h-8 text-sm" />
                        {errors.name && <p className="text-red-600 text-xs mt-0.5">{errors.name}</p>}
                    </div>
                    <div>
                        <Label className="text-xs">Número de Serie</Label>
                        <Input value={formData.serial} onChange={e => set('serial', e.target.value)} className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                        <Label className="text-xs">Nº Inventario</Label>
                        <Input value={formData.otherserial} onChange={e => set('otherserial', e.target.value)} className="mt-1 h-8 text-sm" />
                    </div>
                </div>
            </div>

            {/* Clasificación */}
            <div className="mb-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-1">Clasificación</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3">
                    <div>
                        <Label className="text-xs">Estado</Label>
                        <SearchSelect value={formData.states_id} onValueChange={v => set('states_id', v)}
                            options={states.map(s => ({ id: s.id, label: s.name }))} placeholder="Seleccionar..." />
                    </div>
                    <div>
                        <Label className="text-xs">Tipo</Label>
                        <SearchSelect value={formData.computertypes_id} onValueChange={v => set('computertypes_id', v)}
                            options={types.map(t => ({ id: t.id, label: t.name }))} placeholder="Seleccionar..." />
                    </div>
                    <div>
                        <Label className="text-xs">Fabricante</Label>
                        <SearchSelect value={formData.manufacturers_id} onValueChange={v => set('manufacturers_id', v)}
                            options={manufacturers.map(m => ({ id: m.id, label: m.name }))} placeholder="Seleccionar..." />
                    </div>
                    <div>
                        <Label className="text-xs">Modelo</Label>
                        <SearchSelect value={formData.computermodels_id} onValueChange={v => set('computermodels_id', v)}
                            options={models.map(m => ({ id: m.id, label: m.name }))} placeholder="Seleccionar..." />
                    </div>
                </div>
            </div>

            {/* Ubicación y Entidad */}
            <div className="mb-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-1">Ubicación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                        <Label className="text-xs">Ubicación</Label>
                        <SearchSelect value={formData.locations_id} onValueChange={v => set('locations_id', v)}
                            options={locations.map(l => ({ id: l.id, label: l.completename || l.name }))} placeholder="Seleccionar ubicación..." />
                    </div>
                    <div>
                        <Label className="text-xs">Entidad</Label>
                        <SearchSelect value={formData.entities_id} onValueChange={v => set('entities_id', v)}
                            options={entities.map(e => ({ id: e.id, label: e.name }))} placeholder="Seleccionar entidad..." />
                    </div>
                </div>
            </div>

            {/* Responsables */}
            <div className="mb-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-1">Responsables</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3">
                    <div>
                        <Label className="text-xs">Técnico a cargo</Label>
                        <SearchSelect value={formData.users_id_tech} onValueChange={v => set('users_id_tech', v)}
                            options={userOptions} placeholder="Seleccionar técnico..." />
                    </div>
                    <div>
                        <Label className="text-xs">Grupo a cargo</Label>
                        <SearchSelect value={formData.groups_id_tech} onValueChange={v => set('groups_id_tech', v)}
                            options={groups.map(g => ({ id: g.id, label: g.name }))} placeholder="Seleccionar grupo..." />
                    </div>
                    <div>
                        <Label className="text-xs">Usuario</Label>
                        <SearchSelect value={formData.users_id} onValueChange={v => set('users_id', v)}
                            options={userOptions} placeholder="Seleccionar usuario..." />
                    </div>
                    <div>
                        <Label className="text-xs">Grupo</Label>
                        <SearchSelect value={formData.groups_id} onValueChange={v => set('groups_id', v)}
                            options={groups.map(g => ({ id: g.id, label: g.name }))} placeholder="Seleccionar grupo..." />
                    </div>
                    <div>
                        <Label className="text-xs">Nombre de contacto</Label>
                        <Input value={formData.contact} onChange={e => set('contact', e.target.value)} className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                        <Label className="text-xs">Número de contacto</Label>
                        <Input value={formData.contact_num} onChange={e => set('contact_num', e.target.value)} className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                        <Label className="text-xs">Dominio</Label>
                        <SearchSelect value={formData.domains_id} onValueChange={v => set('domains_id', v)}
                            options={domains.map(d => ({ id: d.id, label: d.name }))} placeholder="Seleccionar dominio..." />
                    </div>
                </div>
            </div>

            {/* Comentarios */}
            <div className="mb-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-1">Comentarios</h3>
                <Textarea value={formData.comment} onChange={e => set('comment', e.target.value)} rows={2} className="text-sm" />
            </div>

            {/* Fechas (solo lectura) */}
            <div className="mb-4 flex items-center gap-6 text-xs text-gray-500">
                {computer.date_creation && <span>Creado: {computer.date_creation}</span>}
                {computer.date_mod && <span>Última actualización: {computer.date_mod}</span>}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="submit" size="sm" disabled={processing} className="bg-[#2c4370] hover:bg-[#3d5583] text-white">
                    <Save className="h-4 w-4 mr-1" />{processing ? 'Guardando...' : 'Guardar'}
                </Button>
            </div>
        </form>
    );
}

// ============ TAB: SISTEMA OPERATIVO ============
function TabOS({ computerId, items, osList, osVersions, osArchitectures, osServicePacks, osKernelVersions, osEditions }: {
    computerId: number; items: OSItem[];
    osList: Option[]; osVersions: Option[]; osArchitectures: Option[];
    osServicePacks: Option[]; osKernelVersions: Option[]; osEditions: Option[];
}) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const emptyForm = {
        operatingsystems_id: '0', operatingsystemversions_id: '0', operatingsystemarchitectures_id: '0',
        operatingsystemservicepacks_id: '0', operatingsystemkernelversions_id: '0', operatingsystemeditions_id: '0',
        license_number: '', licenseid: '',
    };
    const [form, setForm] = useState(emptyForm);
    const [processing, setProcessing] = useState(false);

    const startEdit = (item: OSItem) => {
        setEditingId(item.id);
        setShowAdd(false);
        setForm({
            operatingsystems_id: item.operatingsystems_id?.toString() || '0',
            operatingsystemversions_id: item.operatingsystemversions_id?.toString() || '0',
            operatingsystemarchitectures_id: item.operatingsystemarchitectures_id?.toString() || '0',
            operatingsystemservicepacks_id: item.operatingsystemservicepacks_id?.toString() || '0',
            operatingsystemkernelversions_id: item.operatingsystemkernelversions_id?.toString() || '0',
            operatingsystemeditions_id: item.operatingsystemeditions_id?.toString() || '0',
            license_number: item.license_number || '',
            licenseid: item.license_id || '',
        });
    };

    const startAdd = () => {
        setEditingId(null);
        setShowAdd(true);
        setForm(emptyForm);
    };

    const cancel = () => { setEditingId(null); setShowAdd(false); };

    const submitAdd = () => {
        setProcessing(true);
        router.post(`/inventario/computadores/${computerId}/os`, form, {
            onSuccess: () => { setShowAdd(false); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    };

    const submitEdit = () => {
        if (!editingId) return;
        setProcessing(true);
        router.put(`/inventario/computadores/${computerId}/os/${editingId}`, form, {
            onSuccess: () => { setEditingId(null); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    };

    const deleteItem = (osId: number) => {
        if (!confirm('¿Eliminar este sistema operativo?')) return;
        router.delete(`/inventario/computadores/${computerId}/os/${osId}`);
    };

    const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

    const renderForm = (isEditing: boolean) => (
        <div className="bg-gray-50 border rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">{isEditing ? 'Editar' : 'Nuevo'} Sistema Operativo</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                <div>
                    <Label className="text-xs">Nombre</Label>
                    <SearchSelect value={form.operatingsystems_id} onValueChange={v => set('operatingsystems_id', v)}
                        options={osList.map(o => ({ id: o.id, label: o.name }))} placeholder="Seleccionar OS..." />
                </div>
                <div>
                    <Label className="text-xs">Versión</Label>
                    <SearchSelect value={form.operatingsystemversions_id} onValueChange={v => set('operatingsystemversions_id', v)}
                        options={osVersions.map(o => ({ id: o.id, label: o.name }))} placeholder="Seleccionar..." />
                </div>
                <div>
                    <Label className="text-xs">Arquitectura</Label>
                    <SearchSelect value={form.operatingsystemarchitectures_id} onValueChange={v => set('operatingsystemarchitectures_id', v)}
                        options={osArchitectures.map(o => ({ id: o.id, label: o.name }))} placeholder="Seleccionar..." />
                </div>
                <div>
                    <Label className="text-xs">Paquete de servicio</Label>
                    <SearchSelect value={form.operatingsystemservicepacks_id} onValueChange={v => set('operatingsystemservicepacks_id', v)}
                        options={osServicePacks.map(o => ({ id: o.id, label: o.name }))} placeholder="Seleccionar..." />
                </div>
                <div>
                    <Label className="text-xs">Núcleo</Label>
                    <SearchSelect value={form.operatingsystemkernelversions_id} onValueChange={v => set('operatingsystemkernelversions_id', v)}
                        options={osKernelVersions.map(o => ({ id: o.id, label: o.name }))} placeholder="Seleccionar..." />
                </div>
                <div>
                    <Label className="text-xs">Edición</Label>
                    <SearchSelect value={form.operatingsystemeditions_id} onValueChange={v => set('operatingsystemeditions_id', v)}
                        options={osEditions.map(o => ({ id: o.id, label: o.name }))} placeholder="Seleccionar..." />
                </div>
                <div>
                    <Label className="text-xs">Número de serie</Label>
                    <Input value={form.license_number} onChange={e => set('license_number', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                    <Label className="text-xs">ID del producto</Label>
                    <Input value={form.licenseid} onChange={e => set('licenseid', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
                <Button type="button" variant="outline" size="sm" onClick={cancel}><X className="h-3 w-3 mr-1" />Cancelar</Button>
                <Button type="button" size="sm" disabled={processing} onClick={isEditing ? submitEdit : submitAdd} className="bg-[#2c4370] hover:bg-[#3d5583] text-white">
                    <Check className="h-3 w-3 mr-1" />{processing ? 'Guardando...' : 'Guardar'}
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#2c4370]" />
                    Sistemas operativos
                    <span className="text-sm font-normal text-gray-500">({items.length})</span>
                </h2>
                {!showAdd && !editingId && (
                    <Button type="button" size="sm" variant="outline" onClick={startAdd}>
                        <Plus className="h-3 w-3 mr-1" />Agregar
                    </Button>
                )}
            </div>

            {showAdd && renderForm(false)}

            {items.length > 0 ? (
                <div className="space-y-2">
                    {items.map((item) => (
                        <div key={item.id}>
                            {editingId === item.id ? (
                                renderForm(true)
                            ) : (
                                <div className="bg-white border rounded-lg p-3 flex items-start justify-between gap-4 hover:bg-gray-50">
                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                                        <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{item.os_name || '-'}</span></div>
                                        <div><span className="text-gray-500">Versión:</span> {item.version_name || '-'}</div>
                                        <div><span className="text-gray-500">Arquitectura:</span> {item.arch_name || '-'}</div>
                                        <div><span className="text-gray-500">Edición:</span> {item.edition_name || '-'}</div>
                                        <div><span className="text-gray-500">Paquete servicio:</span> {item.servicepack_name || '-'}</div>
                                        <div><span className="text-gray-500">Núcleo:</span> {item.kernel_version || '-'}</div>
                                        <div><span className="text-gray-500">Nº Serie:</span> {item.license_number || '-'}</div>
                                        <div><span className="text-gray-500">ID Producto:</span> {item.license_id || '-'}</div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(item)} className="h-7 w-7 p-0">
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => deleteItem(item.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : !showAdd ? (
                <p className="text-sm text-gray-500 text-center py-8">No hay sistemas operativos registrados</p>
            ) : null}
        </>
    );
}

// ============ TAB: VOLÚMENES ============
function TabVolumes({ computerId, items, filesystems }: { computerId: number; items: VolumeItem[]; filesystems: Option[] }) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const emptyForm = { name: '', mountpoint: '', device: '', filesystems_id: '0', totalsize: '', freesize: '' };
    const [form, setForm] = useState(emptyForm);
    const [processing, setProcessing] = useState(false);

    const startEdit = (item: VolumeItem) => {
        setEditingId(item.id);
        setShowAdd(false);
        setForm({
            name: item.name || '', mountpoint: item.mountpoint || '', device: item.device || '',
            filesystems_id: item.filesystems_id?.toString() || '0',
            totalsize: item.totalsize?.toString() || '', freesize: item.freesize?.toString() || '',
        });
    };

    const startAdd = () => { setEditingId(null); setShowAdd(true); setForm(emptyForm); };
    const cancel = () => { setEditingId(null); setShowAdd(false); };

    const submitAdd = () => {
        setProcessing(true);
        router.post(`/inventario/computadores/${computerId}/volumenes`, form, {
            onSuccess: () => { setShowAdd(false); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    };

    const submitEdit = () => {
        if (!editingId) return;
        setProcessing(true);
        router.put(`/inventario/computadores/${computerId}/volumenes/${editingId}`, form, {
            onSuccess: () => { setEditingId(null); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    };

    const deleteItem = (volId: number) => {
        if (!confirm('¿Eliminar este volumen?')) return;
        router.delete(`/inventario/computadores/${computerId}/volumenes/${volId}`);
    };

    const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

    const renderForm = (isEditing: boolean) => (
        <div className="bg-gray-50 border rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">{isEditing ? 'Editar' : 'Nuevo'} Volumen</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                <div>
                    <Label className="text-xs">Nombre</Label>
                    <Input value={form.name} onChange={e => set('name', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                    <Label className="text-xs">Partición</Label>
                    <Input value={form.device} onChange={e => set('device', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                    <Label className="text-xs">Punto de montaje</Label>
                    <Input value={form.mountpoint} onChange={e => set('mountpoint', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                    <Label className="text-xs">Sistema de archivos</Label>
                    <SearchSelect value={form.filesystems_id} onValueChange={v => set('filesystems_id', v)}
                        options={filesystems.map(f => ({ id: f.id, label: f.name }))} placeholder="Seleccionar..." />
                </div>
                <div>
                    <Label className="text-xs">Tamaño global (MB)</Label>
                    <Input type="number" value={form.totalsize} onChange={e => set('totalsize', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                    <Label className="text-xs">Espacio libre (MB)</Label>
                    <Input type="number" value={form.freesize} onChange={e => set('freesize', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
                <Button type="button" variant="outline" size="sm" onClick={cancel}><X className="h-3 w-3 mr-1" />Cancelar</Button>
                <Button type="button" size="sm" disabled={processing} onClick={isEditing ? submitEdit : submitAdd} className="bg-[#2c4370] hover:bg-[#3d5583] text-white">
                    <Check className="h-3 w-3 mr-1" />{processing ? 'Guardando...' : 'Guardar'}
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-[#2c4370]" />
                    Volúmenes
                    <span className="text-sm font-normal text-gray-500">({items.length})</span>
                </h2>
                {!showAdd && !editingId && (
                    <Button type="button" size="sm" variant="outline" onClick={startAdd}>
                        <Plus className="h-3 w-3 mr-1" />Agregar
                    </Button>
                )}
            </div>

            {showAdd && renderForm(false)}

            {items.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b bg-gray-50 text-gray-600">
                                <th className="py-2 px-3 text-left">Nombre</th>
                                <th className="py-2 px-3 text-left">Partición</th>
                                <th className="py-2 px-3 text-left">Punto montaje</th>
                                <th className="py-2 px-3 text-left">Sist. archivos</th>
                                <th className="py-2 px-3 text-right">Tamaño (MB)</th>
                                <th className="py-2 px-3 text-right">Libre (MB)</th>
                                <th className="py-2 px-3 text-center w-20">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <React.Fragment key={item.id}>
                                    {editingId === item.id ? (
                                        <tr><td colSpan={7} className="p-0">{renderForm(true)}</td></tr>
                                    ) : (
                                        <tr className="border-b hover:bg-gray-50">
                                            <td className="py-2 px-3">{item.name || '-'}</td>
                                            <td className="py-2 px-3 font-mono">{item.device || '-'}</td>
                                            <td className="py-2 px-3 font-mono">{item.mountpoint || '-'}</td>
                                            <td className="py-2 px-3">{item.filesystem_name || '-'}</td>
                                            <td className="py-2 px-3 text-right">{item.totalsize?.toLocaleString() || '-'}</td>
                                            <td className="py-2 px-3 text-right">{item.freesize?.toLocaleString() || '-'}</td>
                                            <td className="py-2 px-3 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(item)} className="h-7 w-7 p-0">
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => deleteItem(item.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : !showAdd ? (
                <p className="text-sm text-gray-500 text-center py-8">No hay volúmenes registrados</p>
            ) : null}
        </>
    );
}

// ============ TAB: COMPONENTES (solo lectura) ============
function TabComponents({ processors, memories, hardDrives, networkCards, graphicCards, soundCards, controllers, drives, firmwares, motherboards }: {
    processors: ComponentItem[]; memories: ComponentItem[]; hardDrives: ComponentItem[];
    networkCards: ComponentItem[]; graphicCards: ComponentItem[];
    soundCards: ComponentItem[]; controllers: ComponentItem[]; drives: ComponentItem[];
    firmwares: ComponentItem[]; motherboards: ComponentItem[];
}) {
    const ComponentTable = ({ title, icon: Icon, items, columns }: {
        title: string; icon: React.ElementType; items: ComponentItem[];
        columns: { key: string; label: string; align?: string }[];
    }) => (
        <div className="mb-5">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Icon className="h-3.5 w-3.5" /> {title} <span className="text-gray-400">({items.length})</span>
            </h3>
            {items.length > 0 ? (
                <table className="w-full text-xs">
                    <thead><tr className="border-b bg-gray-50 text-gray-600">
                        {columns.map(c => <th key={c.key} className={`py-2 px-3 ${c.align === 'right' ? 'text-right' : 'text-left'}`}>{c.label}</th>)}
                    </tr></thead>
                    <tbody>{items.map((item, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                            {columns.map(c => (
                                <td key={c.key} className={`py-2 px-3 ${c.align === 'right' ? 'text-right' : ''} ${c.key === 'serial' || c.key === 'mac' ? 'font-mono' : ''}`}>
                                    {(item as Record<string, unknown>)[c.key]?.toString() || '-'}
                                </td>
                            ))}
                        </tr>
                    ))}</tbody>
                </table>
            ) : <p className="text-xs text-gray-400 py-2">Sin datos</p>}
        </div>
    );

    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-[#2c4370]" /> Componentes
            </h2>
            <p className="text-xs text-gray-500 mb-4">Los componentes se sincronizan automáticamente desde el agente GLPI. Vista solo lectura.</p>

            <ComponentTable title="Procesadores" icon={Cpu} items={processors}
                columns={[{ key: 'designation', label: 'Nombre' }, { key: 'manufacturer_name', label: 'Fabricante' }, { key: 'frequency', label: 'Frecuencia (MHz)', align: 'right' }, { key: 'nbcores', label: 'Núcleos', align: 'right' }, { key: 'nbthreads', label: 'Hilos', align: 'right' }]} />
            <ComponentTable title="Memorias" icon={CircuitBoard} items={memories}
                columns={[{ key: 'designation', label: 'Nombre' }, { key: 'size', label: 'Tamaño (MiB)', align: 'right' }, { key: 'serial', label: 'Serial' }]} />
            <ComponentTable title="Discos duros" icon={HardDrive} items={hardDrives}
                columns={[{ key: 'designation', label: 'Nombre' }, { key: 'size', label: 'Capacidad (MiB)', align: 'right' }, { key: 'serial', label: 'Serial' }]} />
            <ComponentTable title="Tarjetas de red" icon={Wifi} items={networkCards}
                columns={[{ key: 'designation', label: 'Nombre' }, { key: 'mac', label: 'MAC' }]} />
            <ComponentTable title="Tarjetas gráficas" icon={MonitorSpeaker} items={graphicCards}
                columns={[{ key: 'designation', label: 'Nombre' }, { key: 'size', label: 'Memoria (MiB)', align: 'right' }]} />
            <ComponentTable title="Tarjetas de sonido" icon={Volume2} items={soundCards}
                columns={[{ key: 'designation', label: 'Nombre' }, { key: 'serial', label: 'Serial' }]} />
            <ComponentTable title="Controladores" icon={Grip} items={controllers}
                columns={[{ key: 'designation', label: 'Nombre' }, { key: 'serial', label: 'Serial' }]} />
            <ComponentTable title="Unidades" icon={Disc3} items={drives}
                columns={[{ key: 'designation', label: 'Nombre' }, { key: 'serial', label: 'Serial' }]} />
            <ComponentTable title="Firmware" icon={Package} items={firmwares}
                columns={[{ key: 'designation', label: 'Nombre' }, { key: 'type_name', label: 'Tipo' }, { key: 'serial', label: 'Serial' }]} />
            <ComponentTable title="Tarjetas madre" icon={CircuitBoard} items={motherboards}
                columns={[{ key: 'designation', label: 'Nombre' }, { key: 'serial', label: 'Serial' }]} />
        </>
    );
}

// ============ TAB: SOFTWARE (solo lectura) ============
function TabSoftware({ items }: { items: SoftwareItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Disc3 className="h-5 w-5 text-[#2c4370]" /> Software
                <span className="text-sm font-normal text-gray-500">({items.length})</span>
            </h2>
            <p className="text-xs text-gray-500 mb-4">El software se sincroniza automáticamente desde el agente GLPI.</p>
            {items.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead><tr className="border-b bg-gray-50 text-gray-600">
                            <th className="py-2 px-3 text-left">Nombre</th>
                            <th className="py-2 px-3 text-left">Versión</th>
                        </tr></thead>
                        <tbody>{items.map((s, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3 font-medium">{s.name}</td>
                                <td className="py-2 px-3">{s.version || '-'}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : <p className="text-sm text-gray-500 text-center py-8">No hay software registrado</p>}
        </>
    );
}

// ============ TAB: CONEXIONES (solo lectura) ============
function TabConnections({ monitors, peripherals, printers, phones }: {
    monitors: MonitorItem[]; peripherals: PeripheralItem[]; printers: PrinterItem[]; phones: PhoneItem[];
}) {
    const total = monitors.length + peripherals.length + printers.length + phones.length;
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Waypoints className="h-5 w-5 text-[#2c4370]" /> Conexiones
                <span className="text-sm font-normal text-gray-500">({total})</span>
            </h2>

            {/* Monitores */}
            <div className="mb-5">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <MonitorIcon className="h-3.5 w-3.5" /> Monitores <span className="text-gray-400">({monitors.length})</span>
                </h3>
                {monitors.length > 0 ? (
                    <table className="w-full text-xs">
                        <thead><tr className="border-b bg-gray-50 text-gray-600">
                            <th className="py-2 px-3 text-left">Nombre</th>
                            <th className="py-2 px-3 text-left">Serial</th>
                            <th className="py-2 px-3 text-left">Fabricante</th>
                        </tr></thead>
                        <tbody>{monitors.map(m => (
                            <tr key={m.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3 font-medium">{m.name}</td>
                                <td className="py-2 px-3 font-mono">{m.serial || '-'}</td>
                                <td className="py-2 px-3">{m.manufacturer_name || '-'}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                ) : <p className="text-xs text-gray-400 py-2">Sin monitores conectados</p>}
            </div>

            {/* Periféricos */}
            <div className="mb-5">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Grip className="h-3.5 w-3.5" /> Periféricos <span className="text-gray-400">({peripherals.length})</span>
                </h3>
                {peripherals.length > 0 ? (
                    <table className="w-full text-xs">
                        <thead><tr className="border-b bg-gray-50 text-gray-600">
                            <th className="py-2 px-3 text-left">Nombre</th>
                            <th className="py-2 px-3 text-left">Serial</th>
                        </tr></thead>
                        <tbody>{peripherals.map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3 font-medium">{p.name}</td>
                                <td className="py-2 px-3 font-mono">{p.serial || '-'}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                ) : <p className="text-xs text-gray-400 py-2">Sin periféricos conectados</p>}
            </div>

            {/* Impresoras */}
            <div className="mb-5">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Printer className="h-3.5 w-3.5" /> Impresoras <span className="text-gray-400">({printers.length})</span>
                </h3>
                {printers.length > 0 ? (
                    <table className="w-full text-xs">
                        <thead><tr className="border-b bg-gray-50 text-gray-600">
                            <th className="py-2 px-3 text-left">Nombre</th>
                            <th className="py-2 px-3 text-left">Serial</th>
                        </tr></thead>
                        <tbody>{printers.map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3 font-medium">{p.name}</td>
                                <td className="py-2 px-3 font-mono">{p.serial || '-'}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                ) : <p className="text-xs text-gray-400 py-2">Sin impresoras conectadas</p>}
            </div>

            {/* Teléfonos */}
            <div className="mb-5">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> Teléfonos <span className="text-gray-400">({phones.length})</span>
                </h3>
                {phones.length > 0 ? (
                    <table className="w-full text-xs">
                        <thead><tr className="border-b bg-gray-50 text-gray-600">
                            <th className="py-2 px-3 text-left">Nombre</th>
                            <th className="py-2 px-3 text-left">Serial</th>
                        </tr></thead>
                        <tbody>{phones.map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3 font-medium">{p.name}</td>
                                <td className="py-2 px-3 font-mono">{p.serial || '-'}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                ) : <p className="text-xs text-gray-400 py-2">Sin teléfonos conectados</p>}
            </div>
        </>
    );
}

// ============ TAB: PUERTOS DE RED (solo lectura) ============
function TabNetworkPorts({ items }: { items: NetworkPortItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Network className="h-5 w-5 text-[#2c4370]" /> Puertos de red
                <span className="text-sm font-normal text-gray-500">({items.length})</span>
            </h2>
            {items.length > 0 ? (
                <div className="space-y-3">
                    {items.map(port => (
                        <div key={port.id} className="bg-white border rounded-lg p-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                                <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{port.name || '-'}</span></div>
                                <div><span className="text-gray-500">MAC:</span> <span className="font-mono">{port.mac || '-'}</span></div>
                                <div><span className="text-gray-500">IP:</span> <span className="font-mono font-medium text-blue-700">{port.ip_address || '-'}</span></div>
                                <div><span className="text-gray-500">Nº Lógico:</span> {port.logical_number ?? '-'}</div>
                                <div><span className="text-gray-500">Tipo:</span> {port.instantiation_type?.replace('NetworkPort', '') || '-'}</div>
                                <div><span className="text-gray-500">Red:</span> {port.network_name || '-'}</div>
                                <div><span className="text-gray-500">Máscara:</span> <span className="font-mono">{port.network_netmask || '-'}</span></div>
                                <div><span className="text-gray-500">Gateway:</span> <span className="font-mono">{port.network_gateway || '-'}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-sm text-gray-500 text-center py-8">No hay puertos de red registrados</p>}
        </>
    );
}

// ============ HELPER: Status label ============
const getStatusLabel = (status: number) => {
    const labels: Record<number, { text: string; color: string }> = {
        1: { text: 'Nuevo', color: 'bg-blue-100 text-blue-700' },
        2: { text: 'En curso (asignado)', color: 'bg-yellow-100 text-yellow-700' },
        3: { text: 'En curso (planificado)', color: 'bg-orange-100 text-orange-700' },
        4: { text: 'En espera', color: 'bg-gray-100 text-gray-700' },
        5: { text: 'Resuelto', color: 'bg-green-100 text-green-700' },
        6: { text: 'Cerrado', color: 'bg-gray-200 text-gray-600' },
    };
    const l = labels[status] || { text: `Estado ${status}`, color: 'bg-gray-100 text-gray-700' };
    return <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${l.color}`}>{l.text}</span>;
};

// ============ TAB: CASOS (solo lectura) ============
function TabTickets({ items }: { items: TicketItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-[#2c4370]" /> Casos
                <span className="text-sm font-normal text-gray-500">({items.length})</span>
            </h2>
            {items.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead><tr className="border-b bg-gray-50 text-gray-600">
                            <th className="py-2 px-3 text-left w-16">ID</th>
                            <th className="py-2 px-3 text-left">Título</th>
                            <th className="py-2 px-3 text-left w-36">Estado</th>
                            <th className="py-2 px-3 text-left w-40">Fecha</th>
                        </tr></thead>
                        <tbody>{items.map(t => (
                            <tr key={t.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3 font-mono">{t.id}</td>
                                <td className="py-2 px-3 font-medium">{t.name}</td>
                                <td className="py-2 px-3">{getStatusLabel(t.status)}</td>
                                <td className="py-2 px-3">{t.date}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : <p className="text-sm text-gray-500 text-center py-8">No hay casos vinculados</p>}
        </>
    );
}

// ============ TAB: ANTIVIRUS (CRUD) ============
function TabAntivirus({ computerId, items, antivirusManufacturers }: {
    computerId: number; items: AntivirusItem[]; antivirusManufacturers: Option[];
}) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const emptyForm = { name: '', manufacturers_id: '0', antivirus_version: '', signature_version: '', is_active: '1', is_uptodate: '1', date_expiration: '' };
    const [form, setForm] = useState(emptyForm);
    const [processing, setProcessing] = useState(false);

    const startEdit = (item: AntivirusItem) => {
        setEditingId(item.id);
        setShowAdd(false);
        setForm({
            name: item.name || '',
            manufacturers_id: item.manufacturers_id?.toString() || '0',
            antivirus_version: item.antivirus_version || '',
            signature_version: item.signature_version || '',
            is_active: item.is_active?.toString() || '0',
            is_uptodate: item.is_uptodate?.toString() || '0',
            date_expiration: item.date_expiration || '',
        });
    };

    const startAdd = () => { setEditingId(null); setShowAdd(true); setForm(emptyForm); };
    const cancel = () => { setEditingId(null); setShowAdd(false); };
    const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

    const submitAdd = () => {
        setProcessing(true);
        router.post(`/inventario/computadores/${computerId}/antivirus`, form, {
            onSuccess: () => { setShowAdd(false); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    };

    const submitEdit = () => {
        if (!editingId) return;
        setProcessing(true);
        router.put(`/inventario/computadores/${computerId}/antivirus/${editingId}`, form, {
            onSuccess: () => { setEditingId(null); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    };

    const deleteItem = (avId: number) => {
        if (!confirm('¿Eliminar este antivirus?')) return;
        router.delete(`/inventario/computadores/${computerId}/antivirus/${avId}`);
    };

    const renderForm = (isEditing: boolean) => (
        <div className="bg-gray-50 border rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">{isEditing ? 'Editar' : 'Nuevo'} Antivirus</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                <div>
                    <Label className="text-xs">Nombre</Label>
                    <Input value={form.name} onChange={e => set('name', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                    <Label className="text-xs">Fabricante</Label>
                    <SearchSelect value={form.manufacturers_id} onValueChange={v => set('manufacturers_id', v)}
                        options={antivirusManufacturers.map(m => ({ id: m.id, label: m.name }))} placeholder="Seleccionar..." />
                </div>
                <div>
                    <Label className="text-xs">Versión antivirus</Label>
                    <Input value={form.antivirus_version} onChange={e => set('antivirus_version', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                    <Label className="text-xs">Versión firma</Label>
                    <Input value={form.signature_version} onChange={e => set('signature_version', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                    <Label className="text-xs">Activo</Label>
                    <Select value={form.is_active} onValueChange={v => set('is_active', v)}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Sí</SelectItem>
                            <SelectItem value="0">No</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs">Actualizado</Label>
                    <Select value={form.is_uptodate} onValueChange={v => set('is_uptodate', v)}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Sí</SelectItem>
                            <SelectItem value="0">No</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs">Fecha expiración</Label>
                    <Input type="date" value={form.date_expiration} onChange={e => set('date_expiration', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
                <Button type="button" variant="outline" size="sm" onClick={cancel}><X className="h-3 w-3 mr-1" />Cancelar</Button>
                <Button type="button" size="sm" disabled={processing} onClick={isEditing ? submitEdit : submitAdd} className="bg-[#2c4370] hover:bg-[#3d5583] text-white">
                    <Check className="h-3 w-3 mr-1" />{processing ? 'Guardando...' : 'Guardar'}
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#2c4370]" /> Antivirus
                    <span className="text-sm font-normal text-gray-500">({items.length})</span>
                </h2>
                {!showAdd && !editingId && (
                    <Button type="button" size="sm" variant="outline" onClick={startAdd}>
                        <Plus className="h-3 w-3 mr-1" />Agregar
                    </Button>
                )}
            </div>

            {showAdd && renderForm(false)}

            {items.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead><tr className="border-b bg-gray-50 text-gray-600">
                            <th className="py-2 px-3 text-left">Nombre</th>
                            <th className="py-2 px-3 text-left">Versión</th>
                            <th className="py-2 px-3 text-left">Firma</th>
                            <th className="py-2 px-3 text-center">Activo</th>
                            <th className="py-2 px-3 text-center">Actualizado</th>
                            <th className="py-2 px-3 text-left">Expiración</th>
                            <th className="py-2 px-3 text-center w-20">Acciones</th>
                        </tr></thead>
                        <tbody>{items.map(item => (
                            <React.Fragment key={item.id}>
                                {editingId === item.id ? (
                                    <tr><td colSpan={7} className="p-0">{renderForm(true)}</td></tr>
                                ) : (
                                    <tr className="border-b hover:bg-gray-50">
                                        <td className="py-2 px-3 font-medium">{item.name || '-'}</td>
                                        <td className="py-2 px-3">{item.antivirus_version || '-'}</td>
                                        <td className="py-2 px-3">{item.signature_version || '-'}</td>
                                        <td className="py-2 px-3 text-center">{item.is_active ? <span className="text-green-600">✓</span> : <span className="text-red-500">✗</span>}</td>
                                        <td className="py-2 px-3 text-center">{item.is_uptodate ? <span className="text-green-600">✓</span> : <span className="text-red-500">✗</span>}</td>
                                        <td className="py-2 px-3">{item.date_expiration || '-'}</td>
                                        <td className="py-2 px-3 text-center">
                                            <div className="flex justify-center gap-1">
                                                <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(item)} className="h-7 w-7 p-0"><Pencil className="h-3 w-3" /></Button>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => deleteItem(item.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700"><Trash2 className="h-3 w-3" /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}</tbody>
                    </table>
                </div>
            ) : !showAdd ? (
                <p className="text-sm text-gray-500 text-center py-8">No hay antivirus registrados</p>
            ) : null}
        </>
    );
}

// ============ TAB: VIRTUALIZACIÓN (solo lectura) ============
function TabVirtualization({ items }: { items: VirtualMachine[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Server className="h-5 w-5 text-[#2c4370]" /> Máquinas virtuales
                <span className="text-sm font-normal text-gray-500">({items.length})</span>
            </h2>
            {items.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead><tr className="border-b bg-gray-50 text-gray-600">
                            <th className="py-2 px-3 text-left">Nombre</th>
                            <th className="py-2 px-3 text-left">UUID</th>
                            <th className="py-2 px-3 text-right">vCPU</th>
                            <th className="py-2 px-3 text-right">RAM (MB)</th>
                        </tr></thead>
                        <tbody>{items.map(vm => (
                            <tr key={vm.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3 font-medium">{vm.name || '-'}</td>
                                <td className="py-2 px-3 font-mono text-[11px]">{vm.uuid || '-'}</td>
                                <td className="py-2 px-3 text-right">{vm.vcpu || '-'}</td>
                                <td className="py-2 px-3 text-right">{vm.ram?.toLocaleString() || '-'}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : <p className="text-sm text-gray-500 text-center py-8">No hay máquinas virtuales registradas</p>}
        </>
    );
}

// ============ TAB: DOCUMENTOS (solo lectura) ============
function TabDocuments({ items }: { items: DocumentItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#2c4370]" /> Documentos
                <span className="text-sm font-normal text-gray-500">({items.length})</span>
            </h2>
            {items.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead><tr className="border-b bg-gray-50 text-gray-600">
                            <th className="py-2 px-3 text-left">Nombre</th>
                            <th className="py-2 px-3 text-left">Archivo</th>
                            <th className="py-2 px-3 text-left">Tipo MIME</th>
                            <th className="py-2 px-3 text-left">Fecha mod.</th>
                        </tr></thead>
                        <tbody>{items.map(d => (
                            <tr key={d.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3 font-medium">{d.name || '-'}</td>
                                <td className="py-2 px-3">{d.filename || '-'}</td>
                                <td className="py-2 px-3">{d.mime || '-'}</td>
                                <td className="py-2 px-3">{d.date_mod || '-'}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : <p className="text-sm text-gray-500 text-center py-8">No hay documentos vinculados</p>}
        </>
    );
}

// ============ TAB: PROBLEMAS (solo lectura) ============
function TabProblems({ items }: { items: ProblemItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#2c4370]" /> Problemas
                <span className="text-sm font-normal text-gray-500">({items.length})</span>
            </h2>
            {items.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead><tr className="border-b bg-gray-50 text-gray-600">
                            <th className="py-2 px-3 text-left w-16">ID</th>
                            <th className="py-2 px-3 text-left">Título</th>
                            <th className="py-2 px-3 text-left w-36">Estado</th>
                            <th className="py-2 px-3 text-left w-40">Fecha</th>
                        </tr></thead>
                        <tbody>{items.map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3 font-mono">{p.id}</td>
                                <td className="py-2 px-3 font-medium">{p.name}</td>
                                <td className="py-2 px-3">{getStatusLabel(p.status)}</td>
                                <td className="py-2 px-3">{p.date}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : <p className="text-sm text-gray-500 text-center py-8">No hay problemas vinculados</p>}
        </>
    );
}

// ============ TAB: CAMBIOS (solo lectura) ============
function TabChanges({ items }: { items: ChangeItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-[#2c4370]" /> Cambios
                <span className="text-sm font-normal text-gray-500">({items.length})</span>
            </h2>
            {items.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead><tr className="border-b bg-gray-50 text-gray-600">
                            <th className="py-2 px-3 text-left w-16">ID</th>
                            <th className="py-2 px-3 text-left">Título</th>
                            <th className="py-2 px-3 text-left w-36">Estado</th>
                            <th className="py-2 px-3 text-left w-40">Fecha</th>
                        </tr></thead>
                        <tbody>{items.map(c => (
                            <tr key={c.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3 font-mono">{c.id}</td>
                                <td className="py-2 px-3 font-medium">{c.name}</td>
                                <td className="py-2 px-3">{getStatusLabel(c.status)}</td>
                                <td className="py-2 px-3">{c.date}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : <p className="text-sm text-gray-500 text-center py-8">No hay cambios vinculados</p>}
        </>
    );
}

// ============ TAB: CERTIFICADOS (solo lectura) ============
function TabCertificates({ items }: { items: CertificateItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-[#2c4370]" /> Certificados
                <span className="text-sm font-normal text-gray-500">({items.length})</span>
            </h2>
            {items.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead><tr className="border-b bg-gray-50 text-gray-600">
                            <th className="py-2 px-3 text-left">Nombre</th>
                            <th className="py-2 px-3 text-left">Serial</th>
                            <th className="py-2 px-3 text-left">Expiración</th>
                        </tr></thead>
                        <tbody>{items.map(c => (
                            <tr key={c.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3 font-medium">{c.name || '-'}</td>
                                <td className="py-2 px-3 font-mono">{c.serial || '-'}</td>
                                <td className="py-2 px-3">{c.date_expiration || '-'}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : <p className="text-sm text-gray-500 text-center py-8">No hay certificados vinculados</p>}
        </>
    );
}

// ============ TAB: CONTRATOS (solo lectura) ============
function TabContracts({ items }: { items: ContractItem[] }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-[#2c4370]" /> Contratos
                <span className="text-sm font-normal text-gray-500">({items.length})</span>
            </h2>
            {items.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead><tr className="border-b bg-gray-50 text-gray-600">
                            <th className="py-2 px-3 text-left">Nombre</th>
                            <th className="py-2 px-3 text-left">Número</th>
                            <th className="py-2 px-3 text-left">Fecha inicio</th>
                            <th className="py-2 px-3 text-right">Duración (meses)</th>
                        </tr></thead>
                        <tbody>{items.map(c => (
                            <tr key={c.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3 font-medium">{c.name || '-'}</td>
                                <td className="py-2 px-3">{c.num || '-'}</td>
                                <td className="py-2 px-3">{c.begin_date || '-'}</td>
                                <td className="py-2 px-3 text-right">{c.duration || '-'}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : <p className="text-sm text-gray-500 text-center py-8">No hay contratos vinculados</p>}
        </>
    );
}

// ============ TAB: INFO FINANCIERA (CRUD) ============
function TabInfocom({ computerId, infocom }: { computerId: number; infocom: InfocomItem | null }) {
    const [editing, setEditing] = useState(false);
    const [processing, setProcessing] = useState(false);
    const defaults = {
        buy_date: '', use_date: '', warranty_date: '', warranty_duration: '',
        warranty_info: '', order_number: '', delivery_number: '', immo_number: '',
        value: '', warranty_value: '', order_date: '', delivery_date: '',
        inventory_date: '', decommission_date: '', comment: '', bill: '',
    };
    const [form, setForm] = useState(infocom ? {
        buy_date: infocom.buy_date || '', use_date: infocom.use_date || '',
        warranty_date: infocom.warranty_date || '', warranty_duration: infocom.warranty_duration?.toString() || '',
        warranty_info: infocom.warranty_info || '', order_number: infocom.order_number || '',
        delivery_number: infocom.delivery_number || '', immo_number: infocom.immo_number || '',
        value: infocom.value?.toString() || '', warranty_value: infocom.warranty_value?.toString() || '',
        order_date: infocom.order_date || '', delivery_date: infocom.delivery_date || '',
        inventory_date: infocom.inventory_date || '', decommission_date: infocom.decommission_date || '',
        comment: infocom.comment || '', bill: infocom.bill || '',
    } : defaults);

    const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

    const submit = () => {
        setProcessing(true);
        if (infocom?.id) {
            router.put(`/inventario/computadores/${computerId}/infocom/${infocom.id}`, form, {
                onSuccess: () => { setEditing(false); setProcessing(false); },
                onError: () => setProcessing(false),
            });
        } else {
            router.post(`/inventario/computadores/${computerId}/infocom`, form, {
                onSuccess: () => { setEditing(false); setProcessing(false); },
                onError: () => setProcessing(false),
            });
        }
    };

    if (!infocom && !editing) {
        return (
            <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5 text-[#2c4370]" /> Información financiera y administrativa
                </h2>
                <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-3">No hay información financiera registrada</p>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
                        <Plus className="h-3 w-3 mr-1" />Agregar
                    </Button>
                </div>
            </>
        );
    }

    if (editing || !infocom) {
        return (
            <>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Info className="h-5 w-5 text-[#2c4370]" /> {infocom ? 'Editar' : 'Nueva'} información financiera
                    </h2>
                </div>
                <div className="bg-gray-50 border rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-1">Fechas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3 mb-5">
                        <div><Label className="text-xs">Fecha de compra</Label><Input type="date" value={form.buy_date} onChange={e => set('buy_date', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                        <div><Label className="text-xs">Fecha puesta en uso</Label><Input type="date" value={form.use_date} onChange={e => set('use_date', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                        <div><Label className="text-xs">Fecha de pedido</Label><Input type="date" value={form.order_date} onChange={e => set('order_date', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                        <div><Label className="text-xs">Fecha de entrega</Label><Input type="date" value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                        <div><Label className="text-xs">Fecha de inventario</Label><Input type="date" value={form.inventory_date} onChange={e => set('inventory_date', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                        <div><Label className="text-xs">Fecha baja</Label><Input type="date" value={form.decommission_date} onChange={e => set('decommission_date', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                    </div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-1">Garantía</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3 mb-5">
                        <div><Label className="text-xs">Inicio de garantía</Label><Input type="date" value={form.warranty_date} onChange={e => set('warranty_date', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                        <div><Label className="text-xs">Duración (meses)</Label><Input type="number" value={form.warranty_duration} onChange={e => set('warranty_duration', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                        <div className="md:col-span-2"><Label className="text-xs">Info garantía</Label><Input value={form.warranty_info} onChange={e => set('warranty_info', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                    </div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-1">Valores</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3 mb-5">
                        <div><Label className="text-xs">Valor</Label><Input type="number" step="0.01" value={form.value} onChange={e => set('value', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                        <div><Label className="text-xs">Valor garantía</Label><Input type="number" step="0.01" value={form.warranty_value} onChange={e => set('warranty_value', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                    </div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-1">Números y referencias</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3 mb-5">
                        <div><Label className="text-xs">Nº de pedido</Label><Input value={form.order_number} onChange={e => set('order_number', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                        <div><Label className="text-xs">Nº de entrega</Label><Input value={form.delivery_number} onChange={e => set('delivery_number', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                        <div><Label className="text-xs">Nº de inmovilización</Label><Input value={form.immo_number} onChange={e => set('immo_number', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                        <div><Label className="text-xs">Factura</Label><Input value={form.bill} onChange={e => set('bill', e.target.value)} className="mt-1 h-8 text-sm" /></div>
                    </div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-1">Comentarios</h3>
                    <Textarea value={form.comment} onChange={e => set('comment', e.target.value)} rows={2} className="text-sm mb-4" />
                    <div className="flex justify-end gap-2">
                        {infocom && <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}><X className="h-3 w-3 mr-1" />Cancelar</Button>}
                        <Button type="button" size="sm" disabled={processing} onClick={submit} className="bg-[#2c4370] hover:bg-[#3d5583] text-white">
                            <Check className="h-3 w-3 mr-1" />{processing ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </div>
                </div>
            </>
        );
    }

    // View mode
    const Row = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
        <div className="flex items-baseline gap-2 py-1">
            <span className="text-gray-500 text-xs w-40 shrink-0">{label}:</span>
            <span className="text-sm">{value || '-'}</span>
        </div>
    );

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Info className="h-5 w-5 text-[#2c4370]" /> Información financiera y administrativa
                </h2>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
                    <Pencil className="h-3 w-3 mr-1" />Editar
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 border-b pb-1">Fechas</h3>
                    <Row label="Fecha de compra" value={infocom.buy_date} />
                    <Row label="Fecha puesta en uso" value={infocom.use_date} />
                    <Row label="Fecha de pedido" value={infocom.order_date} />
                    <Row label="Fecha de entrega" value={infocom.delivery_date} />
                    <Row label="Fecha de inventario" value={infocom.inventory_date} />
                    <Row label="Fecha baja" value={infocom.decommission_date} />
                </div>
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 border-b pb-1">Garantía y valores</h3>
                    <Row label="Inicio garantía" value={infocom.warranty_date} />
                    <Row label="Duración (meses)" value={infocom.warranty_duration} />
                    <Row label="Info garantía" value={infocom.warranty_info} />
                    <Row label="Valor" value={infocom.value} />
                    <Row label="Valor garantía" value={infocom.warranty_value} />
                </div>
                <div className="md:col-span-2 mt-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 border-b pb-1">Números y referencias</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4">
                        <Row label="Nº de pedido" value={infocom.order_number} />
                        <Row label="Nº de entrega" value={infocom.delivery_number} />
                        <Row label="Nº inmovilización" value={infocom.immo_number} />
                        <Row label="Factura" value={infocom.bill} />
                    </div>
                </div>
            </div>
        </>
    );
}

// ============ MAIN PAGE ============
export default function EditarComputador(props: Props) {
    const { computer } = props;

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialTab = (params?.get('tab') as TabKey) || 'general';
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

    return (
        <>
            <Head title={`Editar ${computer.name} - HelpDesk HUV`} />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/inventario/global" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inventario</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/inventario/computadores" className="text-gray-600 hover:text-[#2c4370] hover:underline">Computadores</Link>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">Editar: {computer.name}</span>
                    </div>
                } />

                <main className="flex-1 px-6 py-6">
                    <div className="max-w-7xl mx-auto flex gap-6">
                        {/* Sidebar de tabs */}
                        <div className="w-56 shrink-0">
                            <div className="bg-white rounded-lg shadow sticky top-6">
                                <div className="p-3 border-b">
                                    <h2 className="text-sm font-semibold text-gray-900 truncate">{computer.name}</h2>
                                    <p className="text-xs text-gray-500">ID: {computer.id}</p>
                                </div>
                                <nav className="p-1">
                                    {tabConfig.map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => setActiveTab(key)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs transition-colors text-left ${
                                                activeTab === key
                                                    ? 'bg-[#2c4370] text-white font-medium'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <Icon className="h-3.5 w-3.5 shrink-0" />
                                            {label}
                                        </button>
                                    ))}
                                </nav>
                                <div className="p-2 border-t">
                                    <Link href={`/inventario/computadores/${computer.id}`}
                                        className="w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-100 transition-colors">
                                        Ver detalle
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Contenido principal */}
                        <div className="flex-1 min-w-0">
                            <div className="bg-white rounded-lg shadow p-5">
                                {activeTab === 'general' && (
                                    <TabGeneral computer={computer} states={props.states} manufacturers={props.manufacturers}
                                        types={props.types} models={props.models} locations={props.locations}
                                        entities={props.entities} users={props.users} groups={props.groups} domains={props.domains} />
                                )}
                                {activeTab === 'os' && (
                                    <TabOS computerId={computer.id} items={props.operatingSystems}
                                        osList={props.osList} osVersions={props.osVersions} osArchitectures={props.osArchitectures}
                                        osServicePacks={props.osServicePacks} osKernelVersions={props.osKernelVersions} osEditions={props.osEditions} />
                                )}
                                {activeTab === 'components' && (
                                    <TabComponents processors={props.processors} memories={props.memories}
                                        hardDrives={props.hardDrives} networkCards={props.networkCards} graphicCards={props.graphicCards}
                                        soundCards={props.soundCards} controllers={props.controllers} drives={props.drives}
                                        firmwares={props.firmwares} motherboards={props.motherboards} />
                                )}
                                {activeTab === 'volumes' && (
                                    <TabVolumes computerId={computer.id} items={props.volumes} filesystems={props.filesystems} />
                                )}
                                {activeTab === 'software' && (
                                    <TabSoftware items={props.software} />
                                )}
                                {activeTab === 'connections' && (
                                    <TabConnections monitors={props.monitors} peripherals={props.peripherals}
                                        printers={props.printers} phones={props.phones} />
                                )}
                                {activeTab === 'networkPorts' && (
                                    <TabNetworkPorts items={props.networkPorts} />
                                )}
                                {activeTab === 'tickets' && (
                                    <TabTickets items={props.tickets} />
                                )}
                                {activeTab === 'antivirus' && (
                                    <TabAntivirus computerId={computer.id} items={props.antivirus}
                                        antivirusManufacturers={props.antivirusManufacturers} />
                                )}
                                {activeTab === 'virtualization' && (
                                    <TabVirtualization items={props.virtualMachines} />
                                )}
                                {activeTab === 'documents' && (
                                    <TabDocuments items={props.documents} />
                                )}
                                {activeTab === 'problems' && (
                                    <TabProblems items={props.problems} />
                                )}
                                {activeTab === 'changes' && (
                                    <TabChanges items={props.changes} />
                                )}
                                {activeTab === 'certificates' && (
                                    <TabCertificates items={props.certificates} />
                                )}
                                {activeTab === 'contracts' && (
                                    <TabContracts items={props.contracts} />
                                )}
                                {activeTab === 'infocom' && (
                                    <TabInfocom computerId={computer.id} infocom={props.infocom} />
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                <GLPIFooter />
            </div>
        </>
    );
}
