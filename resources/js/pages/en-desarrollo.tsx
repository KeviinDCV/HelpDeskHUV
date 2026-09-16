import { GLPIFooter } from '@/components/glpi-footer';
import { GLPIHeader } from '@/components/glpi-header';
import { btn } from '@/lib/ui-classes';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Construction, Home } from 'lucide-react';

interface EnDesarrolloProps {
    moduleName?: string;
}

/** Módulos del menú que todavía no existen (Gestión, Útiles y algunos de Inventario, Administración y Configuración). */
export default function EnDesarrollo({ moduleName = 'Esta página' }: EnDesarrolloProps) {
    // Si se llegó por un enlace directo no hay a dónde volver: se va al inicio
    const volver = () => (window.history.length > 1 ? window.history.back() : router.visit('/dashboard'));

    return (
        <>
            <Head title={`HelpDesk HUV - ${moduleName}`} />
            <div className="flex min-h-screen flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Inicio
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">{moduleName}</span>
                        </div>
                    }
                />

                <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
                    <section aria-labelledby="en-desarrollo-titulo" className="surface-card w-full max-w-md px-6 py-10 text-center sm:px-10">
                        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-huv-soft">
                            <Construction className="size-7 text-huv-ink" aria-hidden="true" />
                        </span>

                        <h1 id="en-desarrollo-titulo" className="mt-5 text-xl font-semibold tracking-tight text-gray-900">
                            Página en desarrollo
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            <strong className="font-semibold text-gray-900">{moduleName}</strong> está actualmente en desarrollo.
                        </p>
                        <p className="mt-1 text-sm text-gray-500">Nuestro equipo está trabajando para traerte esta funcionalidad pronto.</p>

                        <div className="mt-7 flex flex-col-reverse justify-center gap-2 sm:flex-row">
                            <button type="button" onClick={volver} className={btn.secondary}>
                                <ArrowLeft aria-hidden="true" />
                                Volver
                            </button>
                            <Link href="/dashboard" className={btn.primary}>
                                <Home aria-hidden="true" />
                                Ir al inicio
                            </Link>
                        </div>

                        <p className="mt-8 border-t pt-5 text-xs text-gray-500">
                            Si necesitas acceso urgente a esta funcionalidad, contacta al equipo de soporte técnico.
                        </p>
                    </section>
                </main>

                <GLPIFooter />
            </div>
        </>
    );
}
