import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from 'lucide-react';
import React, { useState } from 'react';

interface Option { id: number; name: string; }
interface Software { id: number; name: string; manufacturers_id: number; softwarecategories_id: number; entities_id: number; comment: string | null; }
interface Props { software: Software; manufacturers: Option[]; categories: Option[]; entities: Option[]; }

export default function EditarPrograma({ software, manufacturers, categories, entities }: Props) {
    const [formData, setFormData] = useState({
        name: software.name || '', manufacturers_id: software.manufacturers_id ? software.manufacturers_id.toString() : '',
        softwarecategories_id: software.softwarecategories_id ? software.softwarecategories_id.toString() : '',
        entities_id: software.entities_id ? software.entities_id.toString() : '', comment: software.comment || '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); setProcessing(true); setErrors({});
        router.put(`/inventario/programas/${software.id}`, formData, {
            onSuccess: () => setProcessing(false),
            onError: (errs) => { setErrors(errs as Record<string, string>); setProcessing(false); },
        });
    };

    return (
        <>
            <Head title="Editar Programa - HelpDesk HUV" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={<div className="flex items-center gap-2 text-sm"><Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link><span className="text-gray-400">/</span><Link href="/inventario/programas" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inventario</Link><span className="text-gray-400">/</span><Link href="/inventario/programas" className="text-gray-600 hover:text-[#2c4370] hover:underline">Programas</Link><span className="text-gray-400">/</span><span className="font-medium text-gray-900">Editar</span></div>} />
                <main className="flex-1 px-6 py-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b"><h1 className="text-xl font-semibold text-gray-900">Editar Programa</h1><p className="text-sm text-gray-500 mt-1">Modifique los campos del programa</p></div>
                            <form onSubmit={handleSubmit} className="p-4">
                                <div className="mb-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Información Básica</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2"><Label htmlFor="name" className="text-xs">Nombre *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="mt-1 h-8 text-sm" />{errors.name && <p className="text-red-600 text-xs mt-0.5">{errors.name}</p>}</div>
                                        <div><Label className="text-xs">Editor</Label><Select value={formData.manufacturers_id} onValueChange={(v) => setFormData({ ...formData, manufacturers_id: v })}><SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{manufacturers.map((m) => (<SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>))}</SelectContent></Select></div>
                                    </div>
                                </div>
                                <div className="mb-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Clasificación</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><Label className="text-xs">Categoría</Label><Select value={formData.softwarecategories_id} onValueChange={(v) => setFormData({ ...formData, softwarecategories_id: v })}><SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{categories.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>))}</SelectContent></Select></div>
                                        <div><Label className="text-xs">Entidad</Label><Select value={formData.entities_id} onValueChange={(v) => setFormData({ ...formData, entities_id: v })}><SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{entities.map((e) => (<SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>))}</SelectContent></Select></div>
                                    </div>
                                </div>
                                <div className="mb-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Notas</h3><Textarea id="comment" value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} rows={2} className="text-sm" /></div>
                                <div className="flex justify-end gap-3 pt-4 border-t"><Button type="button" variant="outline" size="sm" onClick={() => router.visit('/inventario/programas')}>Cancelar</Button><Button type="submit" size="sm" disabled={processing} className="bg-[#2c4370] hover:bg-[#3d5583] text-white"><Save className="h-4 w-4 mr-1" />{processing ? 'Guardando...' : 'Guardar'}</Button></div>
                            </form>
                        </div>
                    </div>
                </main>
                <GLPIFooter />
            </div>
        </>
    );
}
