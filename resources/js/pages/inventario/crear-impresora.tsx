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
import { Save, Plus, X } from 'lucide-react';
import React, { useState } from 'react';

interface Option {
    id: number;
    name: string;
    completename?: string;
}

interface Props {
    states: Option[];
    manufacturers: Option[];
    types: Option[];
    models: Option[];
    locations: Option[];
    entities: Option[];
    users: Option[];
    groups: Option[];
}

export default function CrearImpresora({ states, manufacturers, types, models, locations, entities, users, groups }: Props) {
    const [formData, setFormData] = useState({
        name: '',
        serial: '',
        otherserial: '',
        contact: '',
        contact_num: '',
        states_id: '',
        manufacturers_id: '',
        printertypes_id: '',
        printermodels_id: '',
        locations_id: '',
        entities_id: '',
        users_id_tech: '',
        groups_id_tech: '',
        memory_size: '',
        have_serial: false,
        have_parallel: false,
        have_usb: false,
        have_ethernet: false,
        have_wifi: false,
        comment: '',
        ip_addresses: [] as string[],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [newIp, setNewIp] = useState('');

    const addIp = () => {
        if (newIp.trim() && !formData.ip_addresses.includes(newIp.trim())) {
            setFormData({ ...formData, ip_addresses: [...formData.ip_addresses, newIp.trim()] });
            setNewIp('');
        }
    };

    const removeIp = (ip: string) => {
        setFormData({ ...formData, ip_addresses: formData.ip_addresses.filter(i => i !== ip) });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post('/inventario/impresoras', formData, {
            onSuccess: () => setProcessing(false),
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                setProcessing(false);
            },
        });
    };

    return (
        <>
            <Head title="Crear Impresora - HelpDesk HUV" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/inventario/impresoras" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inventario</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/inventario/impresoras" className="text-gray-600 hover:text-[#2c4370] hover:underline">Impresoras</Link>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">Crear</span>
                    </div>
                } />

                <main className="flex-1 px-6 py-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b">
                                <h1 className="text-xl font-semibold text-gray-900">Nueva Impresora</h1>
                                <p className="text-sm text-gray-500 mt-1">Complete los campos para registrar una nueva impresora</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4">
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Información Básica</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-2">
                                            <Label htmlFor="name" className="text-xs">Nombre *</Label>
                                            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: IMPRESORA-HP-PISO2" required className="mt-1 h-8 text-sm" />
                                            {errors.name && <p className="text-red-600 text-xs mt-0.5">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor="serial" className="text-xs">Número de Serie</Label>
                                            <Input id="serial" value={formData.serial} onChange={(e) => setFormData({ ...formData, serial: e.target.value })} placeholder="Ej: SN123456" className="mt-1 h-8 text-sm" />
                                        </div>
                                        <div>
                                            <Label htmlFor="otherserial" className="text-xs">Nº Inventario</Label>
                                            <Input id="otherserial" value={formData.otherserial} onChange={(e) => setFormData({ ...formData, otherserial: e.target.value })} placeholder="Ej: INV-2024-001" className="mt-1 h-8 text-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Clasificación</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <Label className="text-xs">Estado</Label>
                                            <Select value={formData.states_id} onValueChange={(v) => setFormData({ ...formData, states_id: v })}>
                                                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>{states.map((s) => (<SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Tipo</Label>
                                            <Select value={formData.printertypes_id} onValueChange={(v) => setFormData({ ...formData, printertypes_id: v })}>
                                                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>{types.map((t) => (<SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Fabricante</Label>
                                            <Select value={formData.manufacturers_id} onValueChange={(v) => setFormData({ ...formData, manufacturers_id: v })}>
                                                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>{manufacturers.map((m) => (<SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Modelo</Label>
                                            <Select value={formData.printermodels_id} onValueChange={(v) => setFormData({ ...formData, printermodels_id: v })}>
                                                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>{models.map((m) => (<SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ubicación y Responsables</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <Label className="text-xs">Ubicación</Label>
                                            <Select value={formData.locations_id} onValueChange={(v) => setFormData({ ...formData, locations_id: v })}>
                                                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>{locations.map((l) => (<SelectItem key={l.id} value={l.id.toString()}>{l.completename || l.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Entidad</Label>
                                            <Select value={formData.entities_id} onValueChange={(v) => setFormData({ ...formData, entities_id: v })}>
                                                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>{entities.map((e) => (<SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Técnico a cargo</Label>
                                            <Select value={formData.users_id_tech} onValueChange={(v) => setFormData({ ...formData, users_id_tech: v })}>
                                                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>{users?.map((u) => (<SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Grupo a cargo</Label>
                                            <Select value={formData.groups_id_tech} onValueChange={(v) => setFormData({ ...formData, groups_id_tech: v })}>
                                                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>{groups?.map((g) => (<SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Conexiones</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="have_serial" checked={formData.have_serial} onChange={(e) => setFormData({ ...formData, have_serial: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                                            <Label htmlFor="have_serial" className="text-xs cursor-pointer">Puerto Serial</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="have_parallel" checked={formData.have_parallel} onChange={(e) => setFormData({ ...formData, have_parallel: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                                            <Label htmlFor="have_parallel" className="text-xs cursor-pointer">Puerto Paralelo</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="have_usb" checked={formData.have_usb} onChange={(e) => setFormData({ ...formData, have_usb: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                                            <Label htmlFor="have_usb" className="text-xs cursor-pointer">Puerto USB</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="have_ethernet" checked={formData.have_ethernet} onChange={(e) => setFormData({ ...formData, have_ethernet: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                                            <Label htmlFor="have_ethernet" className="text-xs cursor-pointer">Ethernet</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="have_wifi" checked={formData.have_wifi} onChange={(e) => setFormData({ ...formData, have_wifi: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                                            <Label htmlFor="have_wifi" className="text-xs cursor-pointer">Wi-Fi</Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Direcciones IP</h3>
                                    <div className="flex gap-2 mb-2">
                                        <Input 
                                            value={newIp} 
                                            onChange={(e) => setNewIp(e.target.value)} 
                                            placeholder="Ej: 192.168.1.100" 
                                            className="h-8 text-sm flex-1"
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIp(); } }}
                                        />
                                        <Button type="button" size="sm" onClick={addIp} className="h-8 bg-[#2c4370] hover:bg-[#3d5583]">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {formData.ip_addresses.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formData.ip_addresses.map((ip, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    {ip}
                                                    <button type="button" onClick={() => removeIp(ip)} className="hover:text-blue-600">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Información Adicional</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="contact" className="text-xs">Contacto</Label>
                                            <Input id="contact" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="Nombre del contacto" className="mt-1 h-8 text-sm" />
                                        </div>
                                        <div>
                                            <Label htmlFor="contact_num" className="text-xs">Teléfono Contacto</Label>
                                            <Input id="contact_num" value={formData.contact_num} onChange={(e) => setFormData({ ...formData, contact_num: e.target.value })} placeholder="Ej: 3001234567" className="mt-1 h-8 text-sm" />
                                        </div>
                                        <div>
                                            <Label htmlFor="memory_size" className="text-xs">Memoria</Label>
                                            <Input id="memory_size" value={formData.memory_size} onChange={(e) => setFormData({ ...formData, memory_size: e.target.value })} placeholder="Ej: 256 MB" className="mt-1 h-8 text-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Notas</h3>
                                    <Textarea id="comment" value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} placeholder="Información adicional..." rows={2} className="text-sm" />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button type="button" variant="outline" size="sm" onClick={() => router.visit('/inventario/impresoras')}>Cancelar</Button>
                                    <Button type="submit" size="sm" disabled={processing} className="bg-[#2c4370] hover:bg-[#3d5583] text-white">
                                        <Save className="h-4 w-4 mr-1" />{processing ? 'Guardando...' : 'Guardar'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>

                <GLPIFooter />
            </div>
        </>
    );
}
