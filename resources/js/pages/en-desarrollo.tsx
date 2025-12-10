import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router } from '@inertiajs/react';
import { Construction, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnDesarrolloProps {
    moduleName?: string;
}

export default function EnDesarrollo({ moduleName = 'Esta página' }: EnDesarrolloProps) {
    return (
        <>
            <Head title="En Desarrollo - HelpDesk HUV" />
            <div className="min-h-screen flex flex-col">
                <GLPIHeader />
                <main className="flex-1 bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white shadow-lg border border-gray-200 p-8 text-center">
                        {/* Ícono de construcción */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <Construction className="w-20 h-20 text-[#2c4370]" />
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold">!</span>
                                </div>
                            </div>
                        </div>

                        {/* Título */}
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">
                            Página en Desarrollo
                        </h1>

                        {/* Mensaje */}
                        <p className="text-gray-600 mb-2">
                            <strong>{moduleName}</strong> está actualmente en desarrollo.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Nuestro equipo está trabajando para traerte esta funcionalidad pronto.
                        </p>

                        {/* Acciones */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={() => router.visit('/dashboard')}
                                className="bg-[#2c4370] hover:bg-[#3d5583] text-white"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Ir al Dashboard
                            </Button>
                            <Button
                                onClick={() => window.history.back()}
                                variant="outline"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver
                            </Button>
                        </div>

                        {/* Información adicional */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-xs text-gray-400">
                                Si necesitas acceso urgente a esta funcionalidad,<br />
                                contacta al equipo de soporte técnico.
                            </p>
                        </div>
                    </div>
                </main>
                <GLPIFooter />
            </div>
        </>
    );
}
