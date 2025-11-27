import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from 'lucide-react';
import React, { useState } from 'react';

interface Option { id: number; name: string; completename?: string; }
interface Phone { id: number; name: string; serial: string | null; otherserial: string | null; states_id: number; manufacturers_id: number; phonetypes_id: number; phonemodels_id: number; locations_id: number; entities_id: number; comment: string | null; }
interface Props { phone: Phone; states: Option[]; manufacturers: Option[]; types: Option[]; models: Option[]; locations: Option[]; entities: Option[]; }

export default function EditarTelefono({ phone, states, manufacturers, types, models, locations, entities }: Props) {
    const [formData, setFormData] = useState({
        name: phone.name || '', serial: phone.serial || '', otherserial: phone.otherserial || '',
        states_id: phone.states_id ? phone.states_id.toString() : '', manufacturers_id: phone.manufacturers_id ? phone.manufacturers_id.toString() : '',
        phonetypes_id: phone.phonetypes_id ? phone.phonetypes_id.toString() : '', phonemodels_id: phone.phonemodels_id ? phone.phonemodels_id.toString() : '',
        locations_id: phone.locations_id ? phone.locations_id.toString() : '', entities_id: phone.entities_id ? phone.entities_id.toString() : '', comment: phone.comment || '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); setProcessing(true); setErrors({});
        router.put(`/inventario/telefonos/${phone.id}`, formData, {
            onSuccess: () => setProcessing(false),
            onError: (errs) => { setErrors(errs as Record<string, string>); setProcessing(false); },
        });
    };

    return (
        <>
            <Head title="Editar Teléfono - HelpDesk HUV" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={<div className="flex items-center gap-2 text-sm"><span className="text-gray-600">Inicio</span><span className="text-gray-400">/</span><span className="text-gray-600">Inventario</span><span className="text-gray-400">/</span><button onClick={() => router.visit('/inventario/telefonos')} className="text-gray-600 hover:text-gray-900">Teléfonos</button><span className="text-gray-400">/</span><span className="font-medium text-gray-900">Editar</span></div>} />
                <main className="flex-1 px-6 py-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b"><h1 className="text-xl font-semibold text-gray-900">Editar Teléfono</h1><p className="text-sm text-gray-500 mt-1">Modifique los campos del teléfono</p></div>
                            <form onSubmit={handleSubmit} className="p-4">
                                <div className="mb-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Información Básica</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-2"><Label htmlFor="name" className="text-xs">Nombre *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="mt-1 h-8 text-sm" />{errors.name && <p className="text-red-600 text-xs mt-0.5">{errors.name}</p>}</div>
                                        <div><Label htmlFor="serial" className="text-xs">Número de Serie</Label><Input id="serial" value={formData.serial} onChange={(e) => setFormData({ ...formData, serial: e.target.value })} className="mt-1 h-8 text-sm" /></div>
                                        <div><Label htmlFor="otherserial" className="text-xs">Nº Inventario</Label><Input id="otherserial" value={formData.otherserial} onChange={(e) => setFormData({ ...formData, otherserial: e.target.value })} className="mt-1 h-8 text-sm" /></div>
                                    </div>
                                </div>
                                <div className="mb-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Clasificación</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div><Label className="text-xs">Estado</Label><Select value={formData.states_id} onValueChange={(v) => setFormData({ ...formData, states_id: v })}><SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{states.map((s) => (<SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>))}</SelectContent></Select></div>
                                        <div><Label className="text-xs">Tipo</Label><Select value={formData.phonetypes_id} onValueChange={(v) => setFormData({ ...formData, phonetypes_id: v })}><SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{types.map((t) => (<SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>))}</SelectContent></Select></div>
                                        <div><Label className="text-xs">Fabricante</Label><Select value={formData.manufacturers_id} onValueChange={(v) => setFormData({ ...formData, manufacturers_id: v })}><SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{manufacturers.map((m) => (<SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>))}</SelectContent></Select></div>
                                        <div><Label className="text-xs">Modelo</Label><Select value={formData.phonemodels_id} onValueChange={(v) => setFormData({ ...formData, phonemodels_id: v })}><SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{models.map((m) => (<SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>))}</SelectContent></Select></div>
                                    </div>
                                </div>
                                <div className="mb-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ubicación</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><Label className="text-xs">Ubicación</Label><Select value={formData.locations_id} onValueChange={(v) => setFormData({ ...formData, locations_id: v })}><SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{locations.map((l) => (<SelectItem key={l.id} value={l.id.toString()}>{l.completename || l.name}</SelectItem>))}</SelectContent></Select></div>
                                        <div><Label className="text-xs">Entidad</Label><Select value={formData.entities_id} onValueChange={(v) => setFormData({ ...formData, entities_id: v })}><SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{entities.map((e) => (<SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>))}</SelectContent></Select></div>
                                    </div>
                                </div>
                                <div className="mb-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Notas</h3><Textarea id="comment" value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} rows={2} className="text-sm" /></div>
                                <div className="flex justify-end gap-3 pt-4 border-t"><Button type="button" variant="outline" size="sm" onClick={() => router.visit('/inventario/telefonos')}>Cancelar</Button><Button type="submit" size="sm" disabled={processing} className="bg-[#2c4370] hover:bg-[#3d5583] text-white"><Save className="h-4 w-4 mr-1" />{processing ? 'Guardando...' : 'Guardar'}</Button></div>
                            </form>
                        </div>
                    </div>
                </main>
                <GLPIFooter />
            </div>
        </>
    );
}
