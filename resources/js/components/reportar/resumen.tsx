import { btn } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import {
    ChevronDown,
    CircleCheck,
    CircleDashed,
    Loader2,
    Pencil,
} from 'lucide-react';
import { useState } from 'react';
import {
    ETIQUETAS,
    OBLIGATORIOS,
    SIN_EXTENSION,
    etiquetaEquipo,
    faltantes,
    type Campo,
    type Datos,
} from './reporte';

const GRUPOS: { titulo: string; campos: Campo[] }[] = [
    {
        titulo: 'Quién reporta',
        campos: [
            'reporter_name',
            'reporter_position',
            'reporter_service',
            'reporter_extension',
        ],
    },
    {
        titulo: 'El problema',
        campos: ['name', 'content', 'device_type', 'equipment_ecom'],
    },
];

const ETIQUETA_CORTA: Partial<Record<Campo, string>> = {
    reporter_name: 'Nombre',
};

function valorVisible(campo: Campo, valor: string) {
    if (campo === 'reporter_extension' && valor === SIN_EXTENSION)
        return 'No tiene extensión';
    if (campo === 'device_type') return etiquetaEquipo(valor);
    return valor;
}

interface Props {
    datos: Datos;
    /** Los campos que acaba de llenar el asistente: se resaltan un momento. */
    recientes: Campo[];
    enviando: boolean;
    onEnviar: () => void;
    onEditar: (campo: Campo) => void;
}

/** «Tu reporte»: lo que se va a enviar, qué falta y el botón de envío. */
export function Resumen(props: Props) {
    const hechos = OBLIGATORIOS.length - faltantes(props.datos).length;
    return (
        <section aria-labelledby="titulo-resumen" className="surface-card">
            <div className="px-5 pt-5 pb-4">
                <div className="flex items-baseline justify-between gap-3">
                    <h2
                        id="titulo-resumen"
                        className="text-base font-semibold text-gray-900"
                    >
                        Tu reporte
                    </h2>
                    <Avance hechos={hechos} />
                </div>
                <Barra hechos={hechos} className="mt-3" />
            </div>
            <Cuerpo {...props} />
        </section>
    );
}

/** En pantallas pequeñas el resumen va plegado encima del chat, para que el chat quepa. */
export function ResumenPlegable(props: Props) {
    const [abierto, setAbierto] = useState(false);
    const hechos = OBLIGATORIOS.length - faltantes(props.datos).length;
    return (
        <section
            aria-labelledby="titulo-resumen-movil"
            className="surface-card"
        >
            <h2 id="titulo-resumen-movil">
                <button
                    type="button"
                    aria-expanded={abierto}
                    aria-controls="resumen-movil"
                    onClick={() => setAbierto(!abierto)}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left focus-ring"
                >
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-gray-900">
                            Tu reporte
                        </span>
                        <Avance hechos={hechos} />
                    </span>
                    <Barra hechos={hechos} className="w-20" />
                    <ChevronDown
                        className={cn(
                            'size-4 shrink-0 text-gray-500 transition-transform',
                            abierto && 'rotate-180',
                        )}
                        aria-hidden="true"
                    />
                </button>
            </h2>
            <div id="resumen-movil" hidden={!abierto}>
                <Cuerpo {...props} />
            </div>
        </section>
    );
}

function Avance({ hechos }: { hechos: number }) {
    return (
        <span className="text-xs text-gray-500 tabular-nums">
            {hechos === OBLIGATORIOS.length
                ? 'Completo'
                : `${hechos} de ${OBLIGATORIOS.length} datos obligatorios`}
        </span>
    );
}

function Barra({ hechos, className }: { hechos: number; className?: string }) {
    return (
        <span aria-hidden="true" className={cn('flex gap-1', className)}>
            {OBLIGATORIOS.map((_, i) => (
                <span
                    key={i}
                    className={cn(
                        'h-1.5 flex-1 rounded-full transition-colors duration-500',
                        i < hechos
                            ? 'bg-huv dark:bg-huv-ink'
                            : 'bg-gray-900/10 dark:bg-white/10',
                    )}
                />
            ))}
        </span>
    );
}

function Cuerpo({ datos, recientes, enviando, onEnviar, onEditar }: Props) {
    const faltan = faltantes(datos);
    return (
        <>
            {GRUPOS.map((grupo) => (
                <div key={grupo.titulo}>
                    <div
                        aria-hidden="true"
                        className="h-px bg-gray-900/[0.07] dark:bg-white/10"
                    />
                    <div className="px-5 pt-3.5 pb-2">
                        <h3 className="text-xs font-medium text-gray-500">
                            {grupo.titulo}
                        </h3>
                        <dl className="mt-1">
                            {grupo.campos.map((campo) => {
                                const valor = datos[campo].trim();
                                const obligatorio =
                                    OBLIGATORIOS.includes(campo);
                                const etiqueta =
                                    ETIQUETA_CORTA[campo] ?? ETIQUETAS[campo];
                                return (
                                    <div
                                        // La clave cambia con el valor: así el resaltado se repite cada vez que el asistente lo llena
                                        key={`${campo}:${valor}`}
                                        className={cn(
                                            '-mx-2 flex items-start gap-2.5 rounded-lg px-2 py-2',
                                            valor &&
                                                recientes.includes(campo) &&
                                                'motion-safe:campo-nuevo',
                                        )}
                                    >
                                        {valor ? (
                                            <CircleCheck
                                                className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <CircleDashed
                                                className={cn(
                                                    'mt-0.5 size-4 shrink-0',
                                                    obligatorio
                                                        ? 'text-gray-400'
                                                        : 'text-gray-300 dark:text-white/20',
                                                )}
                                                aria-hidden="true"
                                            />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <dt className="text-xs text-gray-500">
                                                {etiqueta}
                                            </dt>
                                            <dd
                                                className={cn(
                                                    'text-sm break-words',
                                                    valor
                                                        ? 'text-gray-900'
                                                        : 'text-gray-400',
                                                    campo === 'content' &&
                                                        'line-clamp-4 whitespace-pre-line',
                                                )}
                                            >
                                                {valor
                                                    ? valorVisible(campo, valor)
                                                    : obligatorio
                                                      ? 'Pendiente'
                                                      : 'Opcional'}
                                            </dd>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onEditar(campo)}
                                            className="-mr-1 flex size-7 shrink-0 items-center justify-center rounded-md text-gray-400 focus-ring transition-colors hover:bg-gray-900/5 hover:text-gray-700 dark:hover:bg-white/10"
                                        >
                                            <Pencil
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                            <span className="sr-only">
                                                {valor ? 'Cambiar' : 'Escribir'}{' '}
                                                {etiqueta.toLowerCase()}
                                            </span>
                                        </button>
                                    </div>
                                );
                            })}
                        </dl>
                    </div>
                </div>
            ))}

            <div
                aria-hidden="true"
                className="h-px bg-gray-900/[0.07] dark:bg-white/10"
            />
            <div className="p-5">
                <button
                    type="button"
                    onClick={onEnviar}
                    disabled={faltan.length > 0 || enviando}
                    className={cn(btn.primary, 'h-11 w-full')}
                >
                    {enviando && (
                        <Loader2 className="animate-spin" aria-hidden="true" />
                    )}
                    {enviando ? 'Enviando…' : 'Enviar reporte'}
                </button>
                <p className="mt-2.5 text-center text-xs text-gray-500">
                    {faltan.length > 0
                        ? `Falta: ${faltan.map((c) => (ETIQUETA_CORTA[c] ?? ETIQUETAS[c]).toLowerCase()).join(', ')}.`
                        : 'Revisa que todo esté bien antes de enviarlo.'}
                </p>
            </div>
        </>
    );
}
