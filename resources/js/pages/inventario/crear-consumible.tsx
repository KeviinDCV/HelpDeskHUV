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
import { Save } from 'lucide-react';
import React, { useState } from 'react';

interface Option {
    id: number;
    name: string;
    completename?: string;
}

interface Props {
    types: Option[];
    manufacturers: Option[];
    entities: Option[];
    locations: Option[];
}

export default function CrearConsumible({ types, manufacturers, entities, locations }: Props) {
    const [formData, setFormData] = useState({
        name: '',
        ref: '',
        consumableitemtypes_id: '',
        manufacturers_id: '',
        entities_id: '',
        locations_id: '',
        comment: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post('/inventario/consumibles', formData, {
            onSuccess: () => setProcessing(false),
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                setProcessing(false);
            },
        });
    };

    return (
        <>
            <Head title="Crear Consumible - HelpDesk HUV" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/inventario/consumibles" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inventario</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/inventario/consumibles" className="text-gray-600 hover:text-[#2c4370] hover:underline">Consumibles</Link>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">Crear</span>
                    </div>
                } />

                <main className="flex-1 px-6 py-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b">
                                <h1 className="text-xl font-semibold text-gray-900">Nuevo Consumible</h1>
                                <p className="text-sm text-gray-500 mt-1">Complete los campos para registrar un nuevo consumible</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4">
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Información del Consumible</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <Label htmlFor="name" className="text-xs">Nombre *</Label>
                                            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Tóner HP 85A" required className="mt-1 h-8 text-sm" />
                                            {errors.name && <p className="text-red-600 text-xs mt-0.5">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor="ref" className="text-xs">Referencia</Label>
                                            <Input id="ref" value={formData.ref} onChange={(e) => setFormData({ ...formData, ref: e.target.value })} placeholder="Ej: CE285A" className="mt-1 h-8 text-sm" />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Tipo</Label>
                                            <Select value={formData.consumableitemtypes_id} onValueChange={(v) => setFormData({ ...formData, consumableitemtypes_id: v })}>
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
                                            <Label className="text-xs">Entidad</Label>
                                            <Select value={formData.entities_id} onValueChange={(v) => setFormData({ ...formData, entities_id: v })}>
                                                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>{entities.map((e) => (<SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ubicación</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs">Ubicación</Label>
                                            <Select value={formData.locations_id} onValueChange={(v) => setFormData({ ...formData, locations_id: v })}>
                                                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar ubicación..." /></SelectTrigger>
                                                <SelectContent>{locations.map((l) => (<SelectItem key={l.id} value={l.id.toString()}>{l.completename || l.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Notas</h3>
                                    <Textarea id="comment" value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} placeholder="Información adicional..." rows={2} className="text-sm" />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button type="button" variant="outline" size="sm" onClick={() => router.visit('/inventario/consumibles')}>Cancelar</Button>
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
