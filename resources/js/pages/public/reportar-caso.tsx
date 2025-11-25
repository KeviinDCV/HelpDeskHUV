import { Head, router, usePage } from '@inertiajs/react';
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CheckCircle, AlertCircle, User, Monitor, X } from 'lucide-react';
import React, { useState } from 'react';
import { Evarisbot } from '@/components/evarisbot';

interface Location {
    id: number;
    name: string;
    completename: string;
}

interface Category {
    id: number;
    name: string;
    completename: string;
}

interface ItemType {
    value: string;
    label: string;
}

interface Item {
    id: number;
    name: string;
}

interface PageProps {
    locations: Location[];
    categories: Category[];
    itemTypes: ItemType[];
    flash?: {
        success?: {
            message: string;
            ticket_id: number;
        };
    };
}

export default function ReportarCaso({ locations, categories, itemTypes }: PageProps) {
    const { props } = usePage<{ flash?: { success?: { message: string; ticket_id: number } } }>();
    const flash = props.flash;

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Estados para elementos asociados
    const [selectedItemType, setSelectedItemType] = useState<string>('');
    const [availableItems, setAvailableItems] = useState<Item[]>([]);
    const [selectedItems, setSelectedItems] = useState<{type: string, id: number, name: string}[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);
    
    const [formData, setFormData] = useState({
        reporter_name: '',
        reporter_position: '',
        reporter_service: '',
        reporter_extension: '',
        reporter_email: '',
        name: '',
        content: '',
        priority: '3',
        locations_id: '',
        itilcategories_id: '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Funciones para elementos asociados
    const handleItemTypeChange = async (type: string) => {
        setSelectedItemType(type);
        setAvailableItems([]);
        
        if (type) {
            setLoadingItems(true);
            try {
                const response = await fetch(`/soporte/items/${type}`, {
                    credentials: 'same-origin',
                    headers: { 'Accept': 'application/json' }
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
        const typeLabel = itemTypes?.find(t => t.value === selectedItemType)?.label || selectedItemType;
        
        if (item && !selectedItems.some(s => s.type === selectedItemType && s.id === item.id)) {
            setSelectedItems([...selectedItems, { type: selectedItemType, id: item.id, name: `${typeLabel}: ${item.name}` }]);
        }
    };

    const removeSelectedItem = (type: string, id: number) => {
        setSelectedItems(selectedItems.filter(item => !(item.type === type && item.id === id)));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const submitData = {
            ...formData,
            items: selectedItems.map(item => ({ type: item.type, id: item.id })),
        };

        router.post('/reportar', submitData, {
            onSuccess: () => {
                setFormData({
                    reporter_name: '',
                    reporter_position: '',
                    reporter_service: '',
                    reporter_extension: '',
                    reporter_email: '',
                    name: '',
                    content: '',
                    priority: '3',
                    locations_id: '',
                    itilcategories_id: '',
                });
                setSelectedItems([]);
                setSelectedItemType('');
                setAvailableItems([]);
                setProcessing(false);
            },
            onError: (errors) => {
                setErrors(errors as Record<string, string>);
                setProcessing(false);
            }
        });
    };

    return (
        <>
            <Head title="Reportar Problema - HelpDesk HUV" />
            <div className="min-h-screen bg-gradient-to-br from-[#2c4370] to-[#1a2a4a] flex items-center justify-center p-4">
                {/* Contenido principal */}
                <div className="w-full max-w-4xl">
                        {/* Mensaje de éxito */}
                        {flash?.success && (
                            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-green-800">{flash.success.message}</h3>
                                    <p className="text-green-700 text-sm mt-1">
                                        Su número de caso es: <strong>#{flash.success.ticket_id}</strong>
                                    </p>
                                    <p className="text-green-600 text-xs mt-2">
                                        Guarde este número para hacer seguimiento a su reporte.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                            {/* Encabezado del formulario */}
                            <div className="bg-[#2c4370] px-5 py-4">
                                <h2 className="text-lg font-semibold text-white">¿Tiene un problema con su equipo o sistema?</h2>
                                <p className="text-white/80 text-sm">
                                    Cuéntenos qué sucede y lo ayudaremos a solucionarlo
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-5">
                                {/* Sección: Información del Reportante */}
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        ¿Quién reporta?
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg">
                                        <div>
                                            <Label htmlFor="reporter_name" className="text-xs">
                                                Nombre Completo *
                                            </Label>
                                            <Input
                                                id="reporter_name"
                                                value={formData.reporter_name}
                                                onChange={(e) => handleChange('reporter_name', e.target.value)}
                                                placeholder="Ej: Juan Pérez García"
                                                required
                                                className="mt-1 h-9 text-sm"
                                            />
                                            {errors.reporter_name && (
                                                <p className="text-red-600 text-xs mt-1">{errors.reporter_name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="reporter_position" className="text-xs">
                                                Cargo *
                                            </Label>
                                            <Input
                                                id="reporter_position"
                                                value={formData.reporter_position}
                                                onChange={(e) => handleChange('reporter_position', e.target.value)}
                                                placeholder="Ej: Enfermero, Médico, Auxiliar"
                                                required
                                                className="mt-1 h-9 text-sm"
                                            />
                                            {errors.reporter_position && (
                                                <p className="text-red-600 text-xs mt-1">{errors.reporter_position}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="reporter_service" className="text-xs">
                                                Servicio / Área *
                                            </Label>
                                            <Input
                                                id="reporter_service"
                                                value={formData.reporter_service}
                                                onChange={(e) => handleChange('reporter_service', e.target.value)}
                                                placeholder="Ej: Urgencias, UCI, Farmacia"
                                                required
                                                className="mt-1 h-9 text-sm"
                                            />
                                            {errors.reporter_service && (
                                                <p className="text-red-600 text-xs mt-1">{errors.reporter_service}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="reporter_extension" className="text-xs">
                                                Extensión
                                            </Label>
                                            <Input
                                                id="reporter_extension"
                                                value={formData.reporter_extension}
                                                onChange={(e) => handleChange('reporter_extension', e.target.value)}
                                                placeholder="Ej: 1234"
                                                className="mt-1 h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Sección: Información del Problema */}
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        ¿Qué problema tiene?
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <Label htmlFor="name" className="text-xs">
                                                ¿Qué está pasando? (resumen corto) *
                                            </Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                placeholder="Ej: No puedo imprimir, El computador no enciende, No tengo internet"
                                                required
                                                className="mt-1 h-9 text-sm"
                                            />
                                            {errors.name && (
                                                <p className="text-red-600 text-xs mt-1">{errors.name}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <Label htmlFor="priority" className="text-xs">
                                                    ¿Qué tan urgente es? *
                                                </Label>
                                                <Select 
                                                    value={formData.priority} 
                                                    onValueChange={(value) => handleChange('priority', value)}
                                                >
                                                    <SelectTrigger className="mt-1 h-9 text-sm">
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
                                                <Label htmlFor="locations_id" className="text-xs">
                                                    ¿Dónde está el problema?
                                                </Label>
                                                <SearchableSelect
                                                    options={locations.map(loc => ({ 
                                                        value: loc.id.toString(), 
                                                        label: loc.completename 
                                                    }))}
                                                    value={formData.locations_id}
                                                    onValueChange={(value) => handleChange('locations_id', value)}
                                                    placeholder="Seleccione..."
                                                    searchPlaceholder="Buscar ubicación..."
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="itilcategories_id" className="text-xs">
                                                    Tipo de problema
                                                </Label>
                                                <SearchableSelect
                                                    options={categories.map(cat => ({ 
                                                        value: cat.id.toString(), 
                                                        label: cat.completename 
                                                    }))}
                                                    value={formData.itilcategories_id}
                                                    onValueChange={(value) => handleChange('itilcategories_id', value)}
                                                    placeholder="Seleccione..."
                                                    searchPlaceholder="Buscar categoría..."
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>

                                        {/* Elementos asociados */}
                                        {itemTypes && itemTypes.length > 0 && (
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <Label className="text-xs flex items-center gap-1 mb-2">
                                                    <Monitor className="w-3 h-3" />
                                                    ¿Qué equipo tiene el problema? (opcional)
                                                </Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Select value={selectedItemType} onValueChange={handleItemTypeChange}>
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="Tipo de equipo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {itemTypes.map(type => (
                                                                <SelectItem key={type.value} value={type.value}>
                                                                    {type.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <SearchableSelect
                                                        options={availableItems.map(item => ({
                                                            value: item.id.toString(),
                                                            label: item.name
                                                        }))}
                                                        value=""
                                                        onValueChange={addSelectedItem}
                                                        placeholder={loadingItems ? "Cargando..." : "Seleccionar equipo"}
                                                        searchPlaceholder="Buscar..."
                                                        disabled={!selectedItemType || loadingItems}
                                                    />
                                                </div>
                                                {selectedItems.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {selectedItems.map((item, idx) => (
                                                            <span key={idx} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                                                                {item.name}
                                                                <button type="button" onClick={() => removeSelectedItem(item.type, item.id)}>
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <Label htmlFor="content" className="text-xs">
                                                Cuéntenos más detalles *
                                            </Label>
                                            <Textarea
                                                id="content"
                                                value={formData.content}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                                                    handleChange('content', e.target.value)
                                                }
                                                placeholder="Cuéntenos con detalle qué está pasando:\n- ¿Qué estaba haciendo cuando ocurrió?\n- ¿Aparece algún mensaje de error?\n- ¿Desde cuándo tiene este problema?"
                                                required
                                                rows={3}
                                                className="mt-1 text-sm"
                                            />
                                            {errors.content && (
                                                <p className="text-red-600 text-xs mt-1">{errors.content}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Botón de envío */}
                                <div className="flex justify-end pt-3 border-t">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white px-8"
                                    >
                                        {processing ? 'Enviando...' : 'Enviar Reporte'}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Footer informativo */}
                        <div className="mt-4 text-center text-white/60 text-xs">
                            <p>Hospital Universitario del Valle - Gestión de la Información</p>
                        </div>
                </div>

                {/* Chatbot Evarisbot */}
                <Evarisbot 
                    formData={formData}
                    onFillField={handleChange}
                />
            </div>
        </>
    );
}
