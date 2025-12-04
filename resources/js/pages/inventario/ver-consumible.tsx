import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Package, Box } from 'lucide-react';

interface Consumable {
    id: number;
    name: string;
    ref: string | null;
    comment: string | null;
    date_mod: string | null;
    date_creation: string | null;
    type_name: string | null;
    manufacturer_name: string | null;
    location_name: string | null;
    entity_name: string | null;
    alarm_threshold: number | null;
}

interface Props {
    consumable: Consumable;
    stockTotal: number;
    stockDisponible: number;
    stockUsado: number;
}

export default function VerConsumible({ consumable, stockTotal, stockDisponible, stockUsado }: Props) {
    return (
        <>
            <Head title={`${consumable.name} - HelpDesk HUV`} />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/inventario/consumibles" className="text-[#2c4370] hover:underline">Consumibles</Link>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">{consumable.name}</span>
                    </div>
                } />

                <main className="flex-1 p-4 sm:p-6">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.visit('/inventario/consumibles')}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Volver
                                </Button>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{consumable.name}</h1>
                                    <p className="text-sm text-gray-500">ID: {consumable.id}</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => router.visit(`/inventario/consumibles/${consumable.id}/editar`)}
                                className="bg-[#2c4370] hover:bg-[#3d5583]"
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Información Principal */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-lg shadow-sm border p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Package className="h-5 w-5 text-[#2c4370]" />
                                        Información General
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Nombre</label>
                                            <p className="text-sm font-medium text-gray-900">{consumable.name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Entidad</label>
                                            <p className="text-sm font-medium text-gray-900">{consumable.entity_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Tipo</label>
                                            <p className="text-sm font-medium text-gray-900">{consumable.type_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Fabricante</label>
                                            <p className="text-sm font-medium text-gray-900">{consumable.manufacturer_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Referencia</label>
                                            <p className="text-sm font-mono font-medium text-gray-900">{consumable.ref || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Umbral de Alarma</label>
                                            <p className="text-sm font-medium text-gray-900">{consumable.alarm_threshold ?? '-'}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Localización</label>
                                            <p className="text-sm font-medium text-gray-900">{consumable.location_name || '-'}</p>
                                        </div>
                                        {consumable.comment && (
                                            <div className="sm:col-span-2">
                                                <label className="text-xs text-gray-500 uppercase tracking-wide">Comentarios</label>
                                                <p className="text-sm text-gray-900 whitespace-pre-wrap">{consumable.comment}</p>
                                            </div>
                                        )}
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Fecha de Creación</label>
                                            <p className="text-sm text-gray-600">
                                                {consumable.date_creation 
                                                    ? new Date(consumable.date_creation).toLocaleString('es-CO') 
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Última Modificación</label>
                                            <p className="text-sm text-gray-600">
                                                {consumable.date_mod 
                                                    ? new Date(consumable.date_mod).toLocaleString('es-CO') 
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar - Stock */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-lg shadow-sm border p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Box className="h-5 w-5 text-[#2c4370]" />
                                        Inventario
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm text-gray-600">Total</span>
                                            <span className="text-lg font-bold text-gray-900">{stockTotal}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                            <span className="text-sm text-green-700">Disponible</span>
                                            <span className="text-lg font-bold text-green-700">{stockDisponible}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                            <span className="text-sm text-orange-700">Usado</span>
                                            <span className="text-lg font-bold text-orange-700">{stockUsado}</span>
                                        </div>
                                        {consumable.alarm_threshold && stockDisponible <= consumable.alarm_threshold && (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-sm text-red-700 font-medium">
                                                    ⚠️ Stock bajo el umbral de alarma
                                                </p>
                                            </div>
                                        )}
                                    </div>
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
