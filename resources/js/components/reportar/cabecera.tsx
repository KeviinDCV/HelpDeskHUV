import { AccessibilityMenu } from '@/components/accessibility-menu';
import { btn } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

/** Barra superior de la página pública: logo, accesibilidad y, con sesión, la vuelta al tablero. */
export function Cabecera({ autenticado }: { autenticado: boolean }) {
    return (
        <header className="sticky top-0 z-30 bg-[#fff]/90 backdrop-blur-md dark:bg-[#0c0c0e]/90">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
                {/* En oscuro el logo (azul sobre transparente) se pinta en blanco para que se lea */}
                <img
                    src="/images/huv-h-160.webp"
                    alt="Hospital Universitario del Valle"
                    width={566}
                    height={160}
                    fetchPriority="high"
                    className="h-10 w-auto sm:h-12 dark:brightness-0 dark:invert"
                />
                <span
                    aria-hidden="true"
                    className="hidden h-8 w-px bg-gray-900/10 sm:block dark:bg-white/15"
                />
                <p className="hidden text-sm leading-tight sm:block">
                    <span className="block font-semibold text-gray-900">
                        Mesa de ayuda
                    </span>
                    <span className="block text-xs text-gray-500">
                        Sistemas
                    </span>
                </p>
                <div className="ml-auto flex items-center gap-1.5">
                    <AccessibilityMenu />
                    {autenticado && (
                        <Link
                            href="/dashboard"
                            className={cn(btn.secondary, 'px-3')}
                        >
                            <ArrowLeft aria-hidden="true" />
                            <span className="hidden sm:inline">
                                Volver al tablero
                            </span>
                            <span className="sm:hidden">Tablero</span>
                        </Link>
                    )}
                </div>
            </div>
            <div
                aria-hidden="true"
                className="h-px bg-gray-900/[0.07] dark:bg-white/10"
            />
        </header>
    );
}
