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
    realname?: string;
    firstname?: string;
}

interface CrearComputadorProps {
    states: Option[];
    manufacturers: Option[];
    types: Option[];
    models: Option[];
    locations: Option[];
    entities: Option[];
    users: Option[];
    groups: Option[];
    networks: Option[];
    domains: Option[];
    autoupdatesystems: Option[];
}

export default function CrearComputador({ states, manufacturers, types, models, locations, entities, users, groups, networks, domains, autoupdatesystems }: CrearComputadorProps) {
    const [formData, setFormData] = useState({
        name: '',
        serial: '',
        otherserial: '',
        contact: '',
        contact_num: '',
        states_id: '',
        manufacturers_id: '',
        computertypes_id: '',
        computermodels_id: '',
        locations_id: '',
        entities_id: '',
        users_id_tech: '',
        groups_id_tech: '',
        users_id: '',
        groups_id: '',
        networks_id: '',
        domains_id: '',
        uuid: '',
        autoupdatesystems_id: '',
        comment: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post('/inventario/computadores', formData, {
            onSuccess: () => setProcessing(false),
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                setProcessing(false);
            },
        });
    };

    return (
        <>
            <Head title="Crear Computador - HelpDesk HUV" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/inventario/global" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inventario</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/inventario/computadores" className="text-gray-600 hover:text-[#2c4370] hover:underline">Computadores</Link>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">Crear</span>
                    </div>
                } />

                <main className="flex-1 px-6 py-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b">
                                <h1 className="text-xl font-semibold text-gray-900">Nuevo Computador</h1>
                                <p className="text-sm text-gray-500 mt-1">Complete los campos para registrar un nuevo equipo en el inventario</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4">
                                {/* Información básica */}
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Información Básica</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-2">
                                            <Label htmlFor="name" className="text-xs">Nombre *</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Ej: PC-CONTABILIDAD-001"
                                                required
                                                aria-invalid={!!errors.name}
                                                aria-describedby={errors.name ? 'name-error' : undefined}
                                                className="mt-1 h-8 text-sm"
                                            />
                                            {errors.name && <p id="name-error" role="alert" className="text-red-600 text-xs mt-0.5">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor="serial" className="text-xs">Número de Serie</Label>
                                            <Input
                                                id="serial"
                                                value={formData.serial}
                                                onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                                                placeholder="Ej: ABC123456"
                                                className="mt-1 h-8 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="otherserial" className="text-xs">Número de Inventario</Label>
                                            <Input
                                                id="otherserial"
                                                value={formData.otherserial}
                                                onChange={(e) => setFormData({ ...formData, otherserial: e.target.value })}
                                                placeholder="Ej: INV-2024-001"
                                                className="mt-1 h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Clasificación */}
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Clasificación</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <Label htmlFor="states_id" className="text-xs">Estado</Label>
                                            <Select value={formData.states_id} onValueChange={(v) => setFormData({ ...formData, states_id: v })}>
                                                <SelectTrigger id="states_id" className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>
                                                    {states.map((s) => (
                                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="computertypes_id" className="text-xs">Tipo</Label>
                                            <Select value={formData.computertypes_id} onValueChange={(v) => setFormData({ ...formData, computertypes_id: v })}>
                                                <SelectTrigger id="computertypes_id" className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>
                                                    {types.map((t) => (
                                                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="manufacturers_id" className="text-xs">Fabricante</Label>
                                            <Select value={formData.manufacturers_id} onValueChange={(v) => setFormData({ ...formData, manufacturers_id: v })}>
                                                <SelectTrigger id="manufacturers_id" className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>
                                                    {manufacturers.map((m) => (
                                                        <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="computermodels_id" className="text-xs">Modelo</Label>
                                            <Select value={formData.computermodels_id} onValueChange={(v) => setFormData({ ...formData, computermodels_id: v })}>
                                                <SelectTrigger id="computermodels_id" className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>
                                                    {models.map((m) => (
                                                        <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Ubicación y Entidad */}
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ubicación</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="locations_id" className="text-xs">Localización</Label>
                                            <Select value={formData.locations_id} onValueChange={(v) => setFormData({ ...formData, locations_id: v })}>
                                                <SelectTrigger id="locations_id" className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar ubicación..." /></SelectTrigger>
                                                <SelectContent>
                                                    {locations.map((l) => (
                                                        <SelectItem key={l.id} value={l.id.toString()}>{l.completename || l.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="entities_id" className="text-xs">Entidad</Label>
                                            <Select value={formData.entities_id} onValueChange={(v) => setFormData({ ...formData, entities_id: v })}>
                                                <SelectTrigger id="entities_id" className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar entidad..." /></SelectTrigger>
                                                <SelectContent>
                                                    {entities.map((e) => (
                                                        <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Gestión / Responsables */}
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Gestión</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <Label htmlFor="users_id_tech" className="text-xs">Técnico a cargo del hardware</Label>
                                            <Select value={formData.users_id_tech} onValueChange={(v) => setFormData({ ...formData, users_id_tech: v })}>
                                                <SelectTrigger id="users_id_tech" className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>
                                                    {users.map((u) => (
                                                        <SelectItem key={u.id} value={u.id.toString()}>
                                                            {u.realname ? `${u.realname} ${u.firstname || ''}`.trim() : u.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="groups_id_tech" className="text-xs">Grupo a cargo del hardware</Label>
                                            <Select value={formData.groups_id_tech} onValueChange={(v) => setFormData({ ...formData, groups_id_tech: v })}>
                                                <SelectTrigger id="groups_id_tech" className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>
                                                    {groups.map((g) => (
                                                        <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="users_id" className="text-xs">Usuario</Label>
                                            <Select value={formData.users_id} onValueChange={(v) => setFormData({ ...formData, users_id: v })}>
                                                <SelectTrigger id="users_id" className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>
                                                    {users.map((u) => (
                                                        <SelectItem key={u.id} value={u.id.toString()}>
                                                            {u.realname ? `${u.realname} ${u.firstname || ''}`.trim() : u.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="groups_id" className="text-xs">Grupo</Label>
                                            <Select value={formData.groups_id} onValueChange={(v) => setFormData({ ...formData, groups_id: v })}>
                                                <SelectTrigger id="groups_id" className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>
                                                    {groups.map((g) => (
                                                        <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <Label htmlFor="contact" className="text-xs">Nombre de usuario alternativo</Label>
                                            <Input
                                                id="contact"
                                                value={formData.contact}
                                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                                placeholder=""
                                                className="mt-1 h-8 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="contact_num" className="text-xs">Número de contacto</Label>
                                            <Input
                                                id="contact_num"
                                                value={formData.contact_num}
                                                onChange={(e) => setFormData({ ...formData, contact_num: e.target.value })}
                                                placeholder=""
                                                className="mt-1 h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Red y Sistema */}
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Red y Sistema</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <Label htmlFor="networks_id" className="text-xs">Red</Label>
                                            <Select value={formData.networks_id} onValueChange={(v) => setFormData({ ...formData, networks_id: v })}>
                                                <SelectTrigger id="networks_id" className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>
                                                    {networks.map((n) => (
                                                        <SelectItem key={n.id} value={n.id.toString()}>{n.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="domains_id" className="text-xs">Dominio</Label>
                                            <Select value={formData.domains_id} onValueChange={(v) => setFormData({ ...formData, domains_id: v })}>
                                                <SelectTrigger id="domains_id" className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>
                                                    {domains.map((d) => (
                                                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="uuid" className="text-xs">UUID</Label>
                                            <Input
                                                id="uuid"
                                                value={formData.uuid}
                                                onChange={(e) => setFormData({ ...formData, uuid: e.target.value })}
                                                placeholder="Se genera automáticamente si se deja vacío"
                                                className="mt-1 h-8 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="autoupdatesystems_id" className="text-xs">Fuente de actualización</Label>
                                            <Select value={formData.autoupdatesystems_id} onValueChange={(v) => setFormData({ ...formData, autoupdatesystems_id: v })}>
                                                <SelectTrigger id="autoupdatesystems_id" className="mt-1 h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                <SelectContent>
                                                    {autoupdatesystems.map((a) => (
                                                        <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Comentarios */}
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Comentarios</h3>
                                    <Label htmlFor="comment" className="sr-only">Comentarios</Label>
                                    <Textarea
                                        id="comment"
                                        value={formData.comment}
                                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                        placeholder="Información adicional sobre el equipo..."
                                        rows={2}
                                        className="text-sm"
                                    />
                                </div>

                                {/* Botones */}
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.visit('/inventario/computadores')}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        size="sm"
                                        disabled={processing}
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white"
                                    >
                                        <Save className="h-4 w-4 mr-1" />
                                        {processing ? 'Guardando...' : 'Guardar'}
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
