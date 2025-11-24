import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router, useForm } from '@inertiajs/react';
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
import React from 'react';
import { Upload, X } from 'lucide-react';

interface User {
    id: number;
    username: string;
    name: string;
    email: string;
}

interface GLPIUser {
    id: number;
    name: string;
    firstname: string;
    realname: string;
    fullname: string;
}

interface Location {
    id: number;
    name: string;
    completename: string;
}

interface CreateTicketProps {
    users: User[];
    glpiUsers: GLPIUser[];
    locations: Location[];
    auth: {
        user: User;
    };
}

export default function CrearCaso({ users, glpiUsers, locations, auth }: CreateTicketProps) {
    const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
    const [observerIds, setObserverIds] = React.useState<number[]>([]);
    const [assignedIds, setAssignedIds] = React.useState<number[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        content: '',
        date: new Date().toISOString().slice(0, 16),
        time_to_resolve: '',
        internal_time_to_resolve: '',
        status: '1',
        priority: '3',
        locations_id: '',
        requester_id: '',
        observer_ids: [] as number[],
        assigned_ids: [] as number[],
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('content', data.content);
        formData.append('date', data.date);
        formData.append('status', data.status);
        formData.append('priority', data.priority);
        
        if (data.time_to_resolve) formData.append('time_to_resolve', data.time_to_resolve);
        if (data.internal_time_to_resolve) formData.append('internal_time_to_resolve', data.internal_time_to_resolve);
        if (data.locations_id) formData.append('locations_id', data.locations_id);
        if (data.requester_id) formData.append('requester_id', data.requester_id);

        // Agregar observadores
        observerIds.forEach((id, index) => {
            formData.append(`observer_ids[${index}]`, id.toString());
        });

        // Agregar asignados
        assignedIds.forEach((id, index) => {
            formData.append(`assigned_ids[${index}]`, id.toString());
        });

        // Agregar archivos
        selectedFiles.forEach((file, index) => {
            formData.append(`attachments[${index}]`, file);
        });

        router.post('/soporte/casos', formData, {
            forceFormData: true,
            onSuccess: () => {
                // Reset form
                setSelectedFiles([]);
                setObserverIds([]);
                setAssignedIds([]);
            }
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <>
            <Head title="Crear Caso - HelpDesk HUV" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Inicio</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">Soporte</span>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">Crear Caso</span>
                    </div>
                } />

                <main className="flex-1 px-6 py-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b">
                                <h1 className="text-xl font-semibold text-gray-900">Crear Nuevo Caso</h1>
                                <p className="text-sm text-gray-600 mt-1">Complete el formulario para registrar un nuevo caso en el sistema</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Título */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="name">Título *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Título del caso"
                                            required
                                            className="mt-1"
                                        />
                                        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                                    </div>

                                    {/* Fecha de Apertura */}
                                    <div>
                                        <Label htmlFor="date">Fecha de Apertura *</Label>
                                        <Input
                                            id="date"
                                            type="datetime-local"
                                            value={data.date}
                                            onChange={(e) => setData('date', e.target.value)}
                                            required
                                            className="mt-1"
                                        />
                                        {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date}</p>}
                                    </div>

                                    {/* Estado */}
                                    <div>
                                        <Label htmlFor="status">Estado *</Label>
                                        <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Nuevo</SelectItem>
                                                <SelectItem value="2">En curso (asignado)</SelectItem>
                                                <SelectItem value="3">En curso (planificado)</SelectItem>
                                                <SelectItem value="4">En espera</SelectItem>
                                                <SelectItem value="5">Resuelto</SelectItem>
                                                <SelectItem value="6">Cerrado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.status && <p className="text-red-600 text-sm mt-1">{errors.status}</p>}
                                    </div>

                                    {/* Prioridad */}
                                    <div>
                                        <Label htmlFor="priority">Prioridad *</Label>
                                        <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Muy baja</SelectItem>
                                                <SelectItem value="2">Baja</SelectItem>
                                                <SelectItem value="3">Media</SelectItem>
                                                <SelectItem value="4">Alta</SelectItem>
                                                <SelectItem value="5">Muy alta</SelectItem>
                                                <SelectItem value="6">Urgente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.priority && <p className="text-red-600 text-sm mt-1">{errors.priority}</p>}
                                    </div>

                                    {/* Localización */}
                                    <div>
                                        <Label htmlFor="locations_id">Localización</Label>
                                        <Select value={data.locations_id} onValueChange={(value) => setData('locations_id', value)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Seleccione una localización" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {locations.map(location => (
                                                    <SelectItem key={location.id} value={location.id.toString()}>
                                                        {location.completename}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.locations_id && <p className="text-red-600 text-sm mt-1">{errors.locations_id}</p>}
                                    </div>

                                    {/* Tiempo de solución */}
                                    <div>
                                        <Label htmlFor="time_to_resolve">Tiempo de Solución</Label>
                                        <Input
                                            id="time_to_resolve"
                                            type="datetime-local"
                                            value={data.time_to_resolve}
                                            onChange={(e) => setData('time_to_resolve', e.target.value)}
                                            className="mt-1"
                                        />
                                        {errors.time_to_resolve && <p className="text-red-600 text-sm mt-1">{errors.time_to_resolve}</p>}
                                    </div>

                                    {/* Tiempo interno para resolver */}
                                    <div>
                                        <Label htmlFor="internal_time_to_resolve">Tiempo Interno para Resolver</Label>
                                        <Input
                                            id="internal_time_to_resolve"
                                            type="datetime-local"
                                            value={data.internal_time_to_resolve}
                                            onChange={(e) => setData('internal_time_to_resolve', e.target.value)}
                                            className="mt-1"
                                        />
                                        {errors.internal_time_to_resolve && <p className="text-red-600 text-sm mt-1">{errors.internal_time_to_resolve}</p>}
                                    </div>

                                    {/* Solicitante */}
                                    <div>
                                        <Label htmlFor="requester_id">Solicitante *</Label>
                                        <Select value={data.requester_id} onValueChange={(value) => setData('requester_id', value)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Seleccione un solicitante" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {glpiUsers.map(user => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.fullname}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.requester_id && <p className="text-red-600 text-sm mt-1">{errors.requester_id}</p>}
                                    </div>

                                    {/* Observador */}
                                    <div>
                                        <Label htmlFor="observer">Observador</Label>
                                        <Select onValueChange={(value) => {
                                            const id = parseInt(value);
                                            if (!observerIds.includes(id)) {
                                                setObserverIds([...observerIds, id]);
                                                setData('observer_ids', [...observerIds, id]);
                                            }
                                        }}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Agregar observador" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {glpiUsers.filter(u => !observerIds.includes(u.id)).map(user => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.fullname}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {observerIds.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {observerIds.map(id => {
                                                    const user = glpiUsers.find(u => u.id === id);
                                                    return user ? (
                                                        <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                            {user.fullname}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newIds = observerIds.filter(i => i !== id);
                                                                    setObserverIds(newIds);
                                                                    setData('observer_ids', newIds);
                                                                }}
                                                                className="hover:text-blue-900"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Asignado a */}
                                    <div>
                                        <Label htmlFor="assigned">Asignado a</Label>
                                        <Select onValueChange={(value) => {
                                            const id = parseInt(value);
                                            if (!assignedIds.includes(id)) {
                                                setAssignedIds([...assignedIds, id]);
                                                setData('assigned_ids', [...assignedIds, id]);
                                            }
                                        }}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Asignar técnico" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {glpiUsers.filter(u => !assignedIds.includes(u.id)).map(user => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.fullname}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {assignedIds.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {assignedIds.map(id => {
                                                    const user = glpiUsers.find(u => u.id === id);
                                                    return user ? (
                                                        <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                                            {user.fullname}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newIds = assignedIds.filter(i => i !== id);
                                                                    setAssignedIds(newIds);
                                                                    setData('assigned_ids', newIds);
                                                                }}
                                                                className="hover:text-green-900"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Descripción */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="content">Descripción *</Label>
                                        <Textarea
                                            id="content"
                                            value={data.content}
                                            onChange={(e) => setData('content', e.target.value)}
                                            placeholder="Describa el caso en detalle..."
                                            required
                                            rows={6}
                                            className="mt-1"
                                        />
                                        {errors.content && <p className="text-red-600 text-sm mt-1">{errors.content}</p>}
                                    </div>

                                    {/* Archivos adjuntos */}
                                    <div className="md:col-span-2">
                                        <Label>Archivos Adjuntos (Máx. 100MB cada uno)</Label>
                                        <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="mt-2">
                                                <label htmlFor="file-upload" className="cursor-pointer">
                                                    <span className="text-sm font-medium text-[#2c4370] hover:text-[#3d5583]">
                                                        Seleccionar archivos
                                                    </span>
                                                    <input
                                                        id="file-upload"
                                                        type="file"
                                                        multiple
                                                        onChange={handleFileChange}
                                                        className="sr-only"
                                                    />
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                PNG, JPG, PDF, DOC, VIDEO hasta 100MB
                                            </p>
                                        </div>

                                        {selectedFiles.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {selectedFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(index)}
                                                            className="ml-2 text-red-600 hover:text-red-800"
                                                        >
                                                            <X className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.visit('/soporte/casos')}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white"
                                    >
                                        {processing ? 'Creando...' : 'Crear Caso'}
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
