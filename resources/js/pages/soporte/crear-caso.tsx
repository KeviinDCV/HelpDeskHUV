import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import React from 'react';
import { Upload, X, CheckCircle } from 'lucide-react';

interface User {
    id: number;
    username: string;
    name: string;
    email: string;
}


interface Location {
    id: number;
    name: string;
    completename: string;
    short_name: string;
}

interface ItemType {
    value: string;
    label: string;
}

interface Item {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
    completename: string;
}

interface CreateTicketProps {
    users: User[];
    locations: Location[];
    categories: Category[];
    itemTypes: ItemType[];
    auth: {
        user: User;
    };
}

export default function CrearCaso({ users, locations, categories, itemTypes, auth }: CreateTicketProps) {
    const { flash } = usePage<any>().props;
    const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
    const [observerIds, setObserverIds] = React.useState<number[]>([]);
    const [assignedIds, setAssignedIds] = React.useState<number[]>([]);
    const [selectedItemType, setSelectedItemType] = React.useState<string>('');
    const [availableItems, setAvailableItems] = React.useState<Item[]>([]);
    const [selectedItems, setSelectedItems] = React.useState<{ type: string, id: number, name: string }[]>([]);
    const [loadingItems, setLoadingItems] = React.useState(false);
    const [showSuccessModal, setShowSuccessModal] = React.useState(false);

    React.useEffect(() => {
        if (flash.success) {
            setShowSuccessModal(true);
            // Auto cerrar después de 3 segundos si se prefiere, pero dejaremos que el usuario lo cierre
        }
    }, [flash.success]);

    // Función para obtener fecha/hora local en formato datetime-local
    const getLocalDateTime = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const local = new Date(now.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        content: '',
        date: getLocalDateTime(),
        time_to_resolve: '',
        internal_time_to_resolve: '',
        status: '1',
        priority: '3',
        locations_id: '',
        itilcategories_id: '',
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

    const handleItemTypeChange = async (type: string) => {
        setSelectedItemType(type);
        setAvailableItems([]);

        if (type) {
            setLoadingItems(true);
            try {
                const response = await fetch(`/soporte/items/${type}`, {
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json',
                    }
                });
                const items = await response.json();
                setAvailableItems(items);
            } catch (error) {
                console.error('Error loading items:', error);
            } finally {
                setLoadingItems(false);
            }
        }
    };

    const addSelectedItem = (itemId: string) => {
        const item = availableItems.find(i => i.id === parseInt(itemId));
        const typeLabel = itemTypes.find(t => t.value === selectedItemType)?.label || selectedItemType;

        if (item && !selectedItems.some(s => s.type === selectedItemType && s.id === item.id)) {
            setSelectedItems([...selectedItems, { type: selectedItemType, id: item.id, name: `${typeLabel}: ${item.name}` }]);
        }
    };

    const removeSelectedItem = (type: string, id: number) => {
        setSelectedItems(selectedItems.filter(item => !(item.type === type && item.id === id)));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Preparar datos para enviar (Inertia maneja automáticamente FormData cuando hay archivos)
        const submitData = {
            ...data,
            observer_ids: observerIds,
            assigned_ids: assignedIds,
            items: selectedItems.map(item => ({ type: item.type, id: item.id })),
            attachments: selectedFiles,
        };

        router.post('/soporte/casos', submitData, {
            forceFormData: true,
            onSuccess: () => {
                // Reset form manual
                reset('name', 'content'); // Solo reseteamos campos básicos para permitir entrada rápida
                // No reseteamos fecha, ubicación ni asignados porque suelen ser los mismos
                setSelectedFiles([]);
                setSelectedItems([]);
                setSelectedItemType('');
                setAvailableItems([]);
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
                        <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/soporte/casos" className="text-gray-600 hover:text-[#2c4370] hover:underline">Soporte</Link>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">Crear Caso</span>
                    </div>
                } />

                <main className="flex-1 px-6 py-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white shadow border border-gray-200">
                            <div className="px-6 py-4 border-b">
                                <h1 className="text-xl font-semibold text-gray-900">Crear Nuevo Caso</h1>
                                <p className="text-sm text-gray-600 mt-1">Complete el formulario para registrar un nuevo caso en el sistema</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* Título - Fila 1 (Full width) */}
                                    <div className="md:col-span-4">
                                        <Label htmlFor="name" className="text-xs">Título *</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            autoComplete="off"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Título del caso"
                                            required
                                            className="mt-1 h-8 text-sm"
                                        />
                                        {errors.name && <p className="text-red-600 text-xs mt-0.5">{errors.name}</p>}
                                    </div>

                                    {/* Fila 2: Fecha, Estado, Prioridad, Localización */}
                                    <div>
                                        <Label htmlFor="date" className="text-xs">Fecha Apertura *</Label>
                                        <Input
                                            id="date"
                                            name="date"
                                            autoComplete="off"
                                            type="datetime-local"
                                            value={data.date}
                                            onChange={(e) => setData('date', e.target.value)}
                                            required
                                            className="mt-1 h-8 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="status" className="text-xs">Estado *</Label>
                                        <Select value={data.status} onValueChange={(value) => setData('status', value)} name="status">
                                            <SelectTrigger id="status" className="mt-1 h-8 text-xs">
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
                                    </div>

                                    <div>
                                        <Label htmlFor="priority" className="text-xs">Prioridad *</Label>
                                        <Select value={data.priority} onValueChange={(value) => setData('priority', value)} name="priority">
                                            <SelectTrigger id="priority" className="mt-1 h-8 text-xs">
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
                                    </div>

                                    <div>
                                        <Label htmlFor="locations_id" className="text-xs">Localización</Label>
                                        <SearchableSelect
                                            options={locations.map(loc => ({ value: loc.id.toString(), label: loc.short_name }))}
                                            value={data.locations_id}
                                            onValueChange={(value) => setData('locations_id', value)}
                                            placeholder="Seleccione..."
                                            searchPlaceholder="Buscar ubicación..."
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Fila 2.5: Categoría */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="itilcategories_id" className="text-xs">Categoría *</Label>
                                        <SearchableSelect
                                            options={categories.map(cat => ({ value: cat.id.toString(), label: cat.completename }))}
                                            value={data.itilcategories_id}
                                            onValueChange={(value) => setData('itilcategories_id', value)}
                                            placeholder="Seleccione categoría..."
                                            searchPlaceholder="Buscar categoría..."
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Fila 3: Personas (Solicitante, Observador, Asignado) */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="requester_id" className="text-xs">Solicitante</Label>
                                        <Select value={data.requester_id} onValueChange={(value) => setData('requester_id', value)} name="requester_id">
                                            <SelectTrigger id="requester_id" className="mt-1 h-8 text-xs">
                                                <SelectValue placeholder="Buscar solicitante..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map((user: User) => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="observer" className="text-xs">Observador</Label>
                                        <Select onValueChange={(value) => {
                                            const id = parseInt(value);
                                            if (!observerIds.includes(id)) {
                                                setObserverIds([...observerIds, id]);
                                                setData('observer_ids', [...observerIds, id]);
                                            }
                                        }} name="observer">
                                            <SelectTrigger id="observer" className="mt-1 h-8 text-xs">
                                                <SelectValue placeholder="Agregar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.filter((u: User) => !observerIds.includes(u.id)).map((user: User) => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {observerIds.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {observerIds.map(id => {
                                                    const user = users.find((u: User) => u.id === id);
                                                    return user ? (
                                                        <span key={id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] border border-blue-100">
                                                            {user.name}
                                                            <button
                                                                type="button"
                                                                onClick={(e: React.MouseEvent) => {
                                                                    e.preventDefault();
                                                                    const newIds = observerIds.filter(i => i !== id);
                                                                    setObserverIds(newIds);
                                                                    setData('observer_ids', newIds);
                                                                }}
                                                                className="hover:text-blue-900"
                                                            >
                                                                <X className="h-2.5 w-2.5" />
                                                            </button>
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="assigned" className="text-xs">Asignado a *</Label>
                                        <Select onValueChange={(value) => {
                                            const id = parseInt(value);
                                            if (!assignedIds.includes(id)) {
                                                setAssignedIds([...assignedIds, id]);
                                                setData('assigned_ids', [...assignedIds, id]);
                                            }
                                        }} name="assigned">
                                            <SelectTrigger id="assigned" className="mt-1 h-8 text-xs">
                                                <SelectValue placeholder="Asignar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.filter((u: User) => !assignedIds.includes(u.id)).map((user: User) => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {assignedIds.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {assignedIds.map(id => {
                                                    const user = users.find((u: User) => u.id === id);
                                                    return user ? (
                                                        <span key={id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] border border-green-100">
                                                            {user.name}
                                                            <button
                                                                type="button"
                                                                onClick={(e: React.MouseEvent) => {
                                                                    e.preventDefault();
                                                                    const newIds = assignedIds.filter(i => i !== id);
                                                                    setAssignedIds(newIds);
                                                                    setData('assigned_ids', newIds);
                                                                }}
                                                                className="hover:text-green-900"
                                                            >
                                                                <X className="h-2.5 w-2.5" />
                                                            </button>
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Fila 4: Elementos Asociados */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="item_type" className="text-xs">Elementos Asociados</Label>
                                        <Select value={selectedItemType} onValueChange={handleItemTypeChange} name="item_type">
                                            <SelectTrigger id="item_type" className="mt-1 h-8 text-xs">
                                                <SelectValue placeholder="Tipo de elemento..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {itemTypes.map(type => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <Label htmlFor="item_id" className="text-xs text-gray-500">Seleccionar elemento</Label>
                                        <SearchableSelect
                                            options={availableItems.map(item => ({ value: item.id.toString(), label: item.name }))}
                                            onValueChange={addSelectedItem}
                                            placeholder="Buscar elemento..."
                                            searchPlaceholder="Escriba para buscar..."
                                            disabled={!selectedItemType}
                                            loading={loadingItems}
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Lista de elementos seleccionados */}
                                    {selectedItems.length > 0 && (
                                        <div className="md:col-span-4 flex flex-wrap gap-1">
                                            {selectedItems.map((item, idx) => (
                                                <span key={`${item.type}-${item.id}-${idx}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] border border-purple-100">
                                                    {item.name}
                                                    <button
                                                        type="button"
                                                        onClick={(e: React.MouseEvent) => {
                                                            e.preventDefault();
                                                            removeSelectedItem(item.type, item.id);
                                                        }}
                                                        className="hover:text-purple-900"
                                                    >
                                                        <X className="h-2.5 w-2.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Fila 5: Tiempos (Opcionales, colapsados visualmente) */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="time_to_resolve" className="text-xs text-gray-500">Tiempo Solución (Opcional)</Label>
                                        <Input
                                            id="time_to_resolve"
                                            name="time_to_resolve"
                                            autoComplete="off"
                                            type="datetime-local"
                                            value={data.time_to_resolve}
                                            onChange={(e) => setData('time_to_resolve', e.target.value)}
                                            className="mt-1 h-8 text-xs"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="internal_time_to_resolve" className="text-xs text-gray-500">Tiempo Interno (Opcional)</Label>
                                        <Input
                                            id="internal_time_to_resolve"
                                            name="internal_time_to_resolve"
                                            autoComplete="off"
                                            type="datetime-local"
                                            value={data.internal_time_to_resolve}
                                            onChange={(e) => setData('internal_time_to_resolve', e.target.value)}
                                            className="mt-1 h-8 text-xs"
                                        />
                                    </div>

                                    {/* Descripción y Adjuntos en paralelo */}
                                    <div className="md:col-span-3">
                                        <Label htmlFor="content" className="text-xs">Descripción *</Label>
                                        <Textarea
                                            id="content"
                                            name="content"
                                            autoComplete="off"
                                            value={data.content}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('content', e.target.value)}
                                            placeholder="Detalle el caso..."
                                            required
                                            rows={4}
                                            className="mt-1 text-sm resize-none"
                                        />
                                    </div>

                                    <div className="md:col-span-1 flex flex-col">
                                        <Label className="text-xs mb-1">Adjuntos</Label>
                                        <div className="flex-1 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-2 hover:border-gray-400 transition-colors bg-gray-50/50">
                                            <Upload className="h-6 w-6 text-gray-400 mb-1" />
                                            <label htmlFor="file-upload" className="cursor-pointer text-center">
                                                <span className="text-xs font-medium text-[#2c4370] hover:underline block">
                                                    Subir archivos
                                                </span>
                                                <span className="text-[10px] text-gray-400 block leading-tight">
                                                    Máx 100MB
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
                                    </div>

                                    {/* Lista de archivos adjuntos (Full width) */}
                                    {selectedFiles.length > 0 && (
                                        <div className="md:col-span-4 flex flex-wrap gap-2">
                                            {selectedFiles.map((file, index) => (
                                                <div key={index} className="flex items-center gap-2 bg-gray-100 px-2 py-1 border border-gray-200">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-medium text-gray-700 truncate max-w-[150px]">{file.name}</span>
                                                        <span className="text-[9px] text-gray-500">{formatFileSize(file.size)}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.visit('/soporte/casos')}
                                        className="h-8 text-xs"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        size="sm"
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-8 text-xs px-6"
                                    >
                                        {processing ? 'Creando...' : 'Crear Caso'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>

                <GLPIFooter />

                {/* Modal de éxito */}
                <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-6 w-6" />
                                Caso Creado Exitosamente
                            </DialogTitle>
                            <DialogDescription>
                                {flash.success || 'El caso ha sido registrado correctamente.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-center py-4 bg-gray-50 rounded-md border border-gray-100">
                            <p className="text-sm text-gray-600 text-center px-4">
                                El formulario se ha limpiado parcialmente para que pueda registrar otro caso inmediatamente.
                            </p>
                        </div>
                        <DialogFooter className="sm:justify-center">
                            <Button
                                onClick={() => setShowSuccessModal(false)}
                                className="bg-[#2c4370] text-white hover:bg-[#1e2e4f] min-w-[100px]"
                            >
                                Aceptar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
