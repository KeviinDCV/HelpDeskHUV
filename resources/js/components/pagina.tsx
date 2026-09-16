import { GLPIFooter } from '@/components/glpi-footer';
import { GLPIHeader } from '@/components/glpi-header';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { Fragment, type ReactNode } from 'react';

export interface Miga {
    texto: string;
    href?: string;
}

/**
 * Marco de las páginas del rediseño: título del navegador, cabecera con migas de pan, contenedor
 * centrado y pie. Las migas sin href son texto; la última es la página actual.
 */
export function Pagina({ titulo, migas, children, ancho = 'max-w-6xl' }: { titulo: string; migas: Miga[]; children: ReactNode; ancho?: string }) {
    return (
        <>
            <Head title={`HelpDesk HUV - ${titulo}`} />
            <div className="flex min-h-screen flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex min-w-0 items-center gap-2 text-sm">
                            {migas.map((m, i) => (
                                <Fragment key={`${m.texto}-${i}`}>
                                    {i > 0 && <span className="text-gray-400">/</span>}
                                    {i === migas.length - 1 ? (
                                        <span className="truncate font-medium text-gray-900">{m.texto}</span>
                                    ) : m.href ? (
                                        <Link href={m.href} className="shrink-0 text-gray-600 hover:text-[#2c4370] hover:underline">
                                            {m.texto}
                                        </Link>
                                    ) : (
                                        <span className="shrink-0 text-gray-600">{m.texto}</span>
                                    )}
                                </Fragment>
                            ))}
                        </div>
                    }
                />
                <main className="flex-1">
                    <div className={cn('mx-auto w-full space-y-6 px-4 py-6 sm:px-6', ancho)}>{children}</div>
                </main>
                <GLPIFooter />
            </div>
        </>
    );
}
