import { btn } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { Check, CheckCircle2, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Cabecera } from './cabecera';
import { SIN_EXTENSION, borrarBorrador, leerBorrador } from './reporte';

/** El flash de éxito de PublicTicketController::store. */
export interface Exito {
    message: string;
    ticket_id: number | string;
    titulo?: string | null;
    reporter_name?: string | null;
    reporter_service?: string | null;
    reporter_extension?: string | null;
}

/**
 * Confirmación tras enviar: el número de caso (la única forma de hacerle seguimiento), qué va a
 * pasar y lo que se envió. El foco va al título y el lector de pantalla dicta el número.
 */
export function Enviado({ exito }: { exito: Exito }) {
    const ticketId = exito.ticket_id;
    // Lo enviado llega con la confirmación; el borrador del navegador queda de respaldo (por si
    // el servidor es de una versión anterior) y se borra aquí: ya no hace falta.
    const [borrador] = useState(() => leerBorrador()?.datos ?? null);
    const enviado = {
        titulo: exito.titulo ?? borrador?.name ?? '',
        nombre: exito.reporter_name ?? borrador?.reporter_name ?? '',
        servicio: exito.reporter_service ?? borrador?.reporter_service ?? '',
        extension:
            exito.reporter_extension ?? borrador?.reporter_extension ?? '',
    };
    const [copiado, setCopiado] = useState(false);
    const titulo = useRef<HTMLHeadingElement>(null);
    const puedeCopiar =
        typeof navigator !== 'undefined' && !!navigator.clipboard;

    useEffect(() => {
        borrarBorrador();
        titulo.current?.focus();
    }, []);

    useEffect(() => {
        if (!copiado) return;
        const reloj = setTimeout(() => setCopiado(false), 2500);
        return () => clearTimeout(reloj);
    }, [copiado]);

    const copiar = () => {
        navigator.clipboard
            .writeText(String(ticketId))
            .then(() => setCopiado(true))
            .catch(() => undefined);
    };

    const extension =
        enviado.extension && enviado.extension !== SIN_EXTENSION
            ? enviado.extension
            : null;

    return (
        <>
            <Head title="Reporte enviado" />
            <div className="min-h-dvh bg-gray-50">
                <Cabecera />
                <main className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-14">
                    <div className="surface-card p-6 sm:p-8">
                        <span className="flex size-11 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400">
                            <CheckCircle2
                                className="size-6"
                                aria-hidden="true"
                            />
                        </span>
                        <h1
                            ref={titulo}
                            tabIndex={-1}
                            aria-describedby="numero-caso"
                            className="mt-4 rounded text-2xl font-semibold tracking-tight text-gray-900 focus:outline-none"
                        >
                            Reporte enviado
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            El equipo de Sistemas ya lo recibió.
                        </p>

                        <div className="mt-6 flex items-center justify-between gap-4 rounded-xl bg-huv-soft px-5 py-4">
                            <div>
                                <p className="text-xs font-medium text-gray-600">
                                    Número de caso
                                </p>
                                <p
                                    className="mt-0.5 text-3xl font-semibold tracking-tight text-huv-ink tabular-nums"
                                    aria-hidden="true"
                                >
                                    #{ticketId}
                                </p>
                                {/* Dígito por dígito: «#60215» se lee mal en voz alta */}
                                <span id="numero-caso" className="sr-only">
                                    Tu número de caso es{' '}
                                    {String(ticketId).split('').join(' ')}.
                                </span>
                            </div>
                            {puedeCopiar && (
                                <button
                                    type="button"
                                    onClick={copiar}
                                    className={cn(btn.secondary, 'shrink-0')}
                                >
                                    {copiado ? (
                                        <Check aria-hidden="true" />
                                    ) : (
                                        <Copy aria-hidden="true" />
                                    )}
                                    {copiado ? 'Copiado' : 'Copiar'}
                                    <span className="sr-only">
                                        {' '}
                                        el número de caso
                                    </span>
                                </button>
                            )}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Guárdalo: con este número puedes preguntar por tu
                            caso.
                        </p>

                        {(enviado.titulo || enviado.nombre) && (
                            <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <dt className="text-xs text-gray-500">
                                        Problema
                                    </dt>
                                    <dd className="text-gray-900">
                                        {enviado.titulo}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">
                                        Reportado por
                                    </dt>
                                    <dd className="text-gray-900">
                                        {enviado.nombre}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">
                                        Servicio o área
                                    </dt>
                                    <dd className="text-gray-900">
                                        {enviado.servicio}
                                    </dd>
                                </div>
                            </dl>
                        )}

                        <div
                            aria-hidden="true"
                            className="mt-6 h-px bg-gray-900/[0.07] dark:bg-white/10"
                        />
                        <h2 className="mt-5 text-sm font-semibold text-gray-900">
                            Qué sigue
                        </h2>
                        <ol className="mt-3 space-y-3 text-sm text-gray-600">
                            {[
                                'Un técnico de Sistemas revisa el reporte y lo toma.',
                                extension
                                    ? `Si necesita más información, te contacta a la extensión ${extension}.`
                                    : 'Si necesita más información, te contacta en tu servicio.',
                                'Cuando quede resuelto, el caso se cierra con la solución.',
                            ].map((paso, i) => (
                                <li key={i} className="flex gap-3">
                                    <span
                                        aria-hidden="true"
                                        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-900/[0.06] text-[0.6875rem] font-semibold text-gray-600 dark:bg-white/10"
                                    >
                                        {i + 1}
                                    </span>
                                    {paso}
                                </li>
                            ))}
                        </ol>

                        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
                            <button
                                type="button"
                                onClick={() =>
                                    router.visit(
                                        window.location.pathname +
                                            window.location.search,
                                    )
                                }
                                className={cn(btn.primary, 'h-10')}
                            >
                                Reportar otro problema
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
