import { btn } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import {
    AlertCircle,
    ArrowUp,
    CheckCircle2,
    Loader2,
    RotateCcw,
} from 'lucide-react';
import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type FormEvent,
    type KeyboardEvent,
} from 'react';
import {
    CARGOS,
    EQUIPOS,
    SIN_EXTENSION,
    TEXTO_FALLO,
    type Envio,
    type Mensaje,
    type Paso,
} from './reporte';

/** Respuestas de un toque para la pregunta en curso: se mandan como datos, sin pasar por la IA. */
function respuestasRapidas(paso: Paso | null): Envio[] {
    switch (paso) {
        case 'reporter_position':
            return CARGOS.map((cargo) => ({
                texto: cargo,
                campos: { reporter_position: cargo },
            }));
        case 'reporter_extension':
            return [
                {
                    texto: 'No tengo extensión',
                    campos: { reporter_extension: SIN_EXTENSION },
                },
            ];
        case 'device_type':
            return EQUIPOS.map((e) => ({
                texto: e.etiqueta,
                campos: { device_type: e.valor },
            }));
        case 'equipment_ecom':
            return [{ texto: 'No lo sé', omitir: 'equipment_ecom' }];
        default:
            return [];
    }
}

const PISTAS: Record<Paso | 'listo', string> = {
    reporter_name: 'Escribe tu nombre completo',
    reporter_position: 'Elige tu cargo o escríbelo',
    reporter_service: 'Por ejemplo: Urgencias, UCI adultos, Farmacia',
    reporter_extension: 'Escribe la extensión',
    content: 'Describe el problema con tus palabras',
    device_type: 'Elige el equipo o escríbelo',
    equipment_ecom: 'Por ejemplo: ECOM02708',
    listo: 'Si quieres agregar algún detalle, escríbelo aquí',
};

const reducirMovimiento = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Conversacion({
    mensajes,
    paso,
    cargando,
    sinIA,
    hayProgreso,
    puedeEnviar,
    enviando,
    onEnviar,
    onReintentar,
    onEmpezarDeNuevo,
    onEnviarReporte,
    onIrAlFormulario,
}: {
    mensajes: Mensaje[];
    paso: Paso | null;
    cargando: boolean;
    sinIA: boolean;
    hayProgreso: boolean;
    puedeEnviar: boolean;
    enviando: boolean;
    onEnviar: (envio: Envio) => void;
    onReintentar: (mensaje: Mensaje) => void;
    onEmpezarDeNuevo: () => void;
    onEnviarReporte: () => void;
    onIrAlFormulario: () => void;
}) {
    const [texto, setTexto] = useState('');
    const hilo = useRef<HTMLDivElement>(null);
    const campo = useRef<HTMLTextAreaElement>(null);
    // Si la persona estaba escribiendo, el foco vuelve al campo cuando llega la respuesta. Con
    // las respuestas rápidas no: en el celular abriría el teclado sin que nadie lo pidiera.
    const volverAlCampo = useRef(false);

    const rapidas = cargando ? [] : respuestasRapidas(paso);
    const yaEscribio = mensajes.some((m) => m.autor === 'persona');
    const terminado = paso === null && puedeEnviar;

    // Cada mensaje nuevo se ve: el hilo baja hasta el final (solo el hilo, no la página).
    useEffect(() => {
        const el = hilo.current;
        if (!el) return;
        el.scrollTo({
            top: el.scrollHeight,
            behavior: reducirMovimiento() ? 'auto' : 'smooth',
        });
    }, [mensajes.length, cargando, terminado]);

    useEffect(() => {
        if (!cargando && volverAlCampo.current) {
            volverAlCampo.current = false;
            campo.current?.focus();
        }
    }, [cargando]);

    // El campo crece con el texto, hasta unas seis líneas; de ahí en adelante se desplaza.
    // Vacío vuelve a una línea: Chrome cuenta el texto de ayuda en scrollHeight, y medido antes
    // de que cargue la fuente o el ancho final daba seis líneas para un campo sin nada.
    useLayoutEffect(() => {
        const el = campo.current;
        if (!el) return;
        el.style.height = '';
        if (!texto) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
    }, [texto]);

    const mandar = (e?: FormEvent) => {
        e?.preventDefault();
        const limpio = texto.trim();
        if (!limpio || cargando) return;
        volverAlCampo.current = true;
        setTexto('');
        onEnviar({ texto: limpio.slice(0, 1000) });
    };

    const alTeclear = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter envía; Shift+Enter hace salto de línea. Mientras se compone un carácter (teclados
        // con acentos muertos o IME), Enter confirma el carácter y no debe enviar.
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            mandar();
        }
    };

    return (
        <section
            aria-labelledby="titulo-asistente"
            className="flex h-[78dvh] max-h-[46rem] min-h-[28rem] flex-col overflow-hidden surface-card lg:h-[calc(100dvh-14.5rem)] lg:max-h-[52rem] lg:min-h-[34rem]"
        >
            {/* Cabecera del asistente */}
            <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <img
                    src="/images/evaris-avatar.webp"
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 shrink-0 rounded-full bg-huv-soft object-cover"
                />
                <div className="min-w-0 flex-1">
                    <h2
                        id="titulo-asistente"
                        className="text-sm font-semibold text-gray-900"
                    >
                        Evarisbot
                    </h2>
                    <p className="truncate text-xs text-gray-500">
                        {sinIA
                            ? 'Modo básico: responde una cosa a la vez'
                            : 'Asistente para reportes a Sistemas'}
                    </p>
                </div>
                {hayProgreso && (
                    <button
                        type="button"
                        onClick={onEmpezarDeNuevo}
                        className={cn(
                            btn.ghost,
                            'h-8 px-2.5 text-gray-600 sm:px-3',
                        )}
                    >
                        <RotateCcw aria-hidden="true" />
                        <span className="hidden sm:inline">
                            Empezar de nuevo
                        </span>
                        <span className="sr-only sm:hidden">
                            Empezar de nuevo
                        </span>
                    </button>
                )}
            </div>
            <div
                aria-hidden="true"
                className="h-px shrink-0 bg-gray-900/[0.07] dark:bg-white/10"
            />

            {sinIA && (
                <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 bg-amber-50/70 px-4 py-2.5 text-[0.8125rem] text-amber-900 sm:px-5 dark:bg-amber-400/10 dark:text-amber-200">
                    <p className="flex-1">
                        El asistente inteligente no está disponible ahora.
                        Responde cada pregunta por separado, o usa el
                        formulario.
                    </p>
                    <button
                        type="button"
                        onClick={onIrAlFormulario}
                        className="rounded font-medium text-amber-900 underline underline-offset-2 focus-ring hover:no-underline dark:text-amber-200"
                    >
                        Llenar formulario
                    </button>
                </div>
            )}

            {/* tabIndex: el hilo se desplaza solo hacia el final; enfocable, el teclado puede
                volver a leer lo anterior con las flechas. role="log" anuncia lo nuevo. */}
            <div
                ref={hilo}
                tabIndex={0}
                role="log"
                aria-label="Conversación"
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 focus-ring [scrollbar-width:thin] sm:px-5"
            >
                <ol className="space-y-3">
                    {mensajes.map((m) => (
                        <li
                            key={m.id}
                            className="motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1"
                        >
                            <Burbuja
                                mensaje={m}
                                onReintentar={() => onReintentar(m)}
                                onIrAlFormulario={onIrAlFormulario}
                            />
                        </li>
                    ))}
                </ol>

                {!yaEscribio && !sinIA && (
                    <p className="mt-4 ml-10 max-w-md rounded-xl bg-huv-soft px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-gray-700">
                        <span className="font-medium text-huv-ink">
                            Consejo:
                        </span>{' '}
                        puedes escribirlo todo en un mensaje, por ejemplo: «Soy
                        Ana Ruiz, enfermera de UCI adultos, extensión 4521. El
                        computador del puesto 3 no enciende».
                    </p>
                )}

                {cargando && (
                    <div className="mt-3 flex items-end gap-2.5">
                        <img
                            src="/images/evaris-avatar.webp"
                            alt=""
                            width={28}
                            height={28}
                            className="size-7 shrink-0 rounded-full bg-huv-soft object-cover"
                        />
                        <div
                            role="status"
                            className="rounded-2xl rounded-bl-md bg-[#f3f4f6] px-4 py-3 dark:bg-white/[0.06]"
                        >
                            <span className="sr-only">
                                Evarisbot está escribiendo…
                            </span>
                            <span
                                aria-hidden="true"
                                className="flex items-center gap-1"
                            >
                                {[0, 150, 300].map((retraso) => (
                                    <span
                                        key={retraso}
                                        className="size-1.5 rounded-full bg-gray-400 motion-safe:animate-bounce"
                                        style={{
                                            animationDelay: `${retraso}ms`,
                                        }}
                                    />
                                ))}
                            </span>
                        </div>
                    </div>
                )}

                {terminado && !cargando && (
                    <div className="mt-5 rounded-xl bg-[#fff] p-4 ring-1 ring-emerald-600/25 ring-inset sm:ml-10 dark:bg-emerald-400/[0.06] dark:ring-emerald-400/25">
                        <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <CheckCircle2
                                className="size-4 text-emerald-600 dark:text-emerald-400"
                                aria-hidden="true"
                            />
                            Tu reporte está listo para enviar
                        </p>
                        <p className="mt-1 text-[0.8125rem] text-gray-600">
                            Si algo quedó mal, escríbelo aquí y lo corrijo, o
                            cámbialo en el formulario.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={onEnviarReporte}
                                disabled={enviando}
                                className={btn.primary}
                            >
                                {enviando && (
                                    <Loader2
                                        className="animate-spin"
                                        aria-hidden="true"
                                    />
                                )}
                                {enviando ? 'Enviando…' : 'Enviar reporte'}
                            </button>
                            <button
                                type="button"
                                onClick={onIrAlFormulario}
                                className={btn.secondary}
                            >
                                Revisar en el formulario
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Respuestas rápidas y campo de texto */}
            <div
                aria-hidden="true"
                className="h-px shrink-0 bg-gray-900/[0.07] dark:bg-white/10"
            />
            <form onSubmit={mandar} className="shrink-0 px-3 pt-3 pb-3 sm:px-4">
                {rapidas.length > 0 && (
                    <div
                        role="group"
                        aria-label="Respuestas rápidas"
                        className="-mx-1 mb-2.5 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible"
                    >
                        {rapidas.map((r) => (
                            <button
                                key={r.texto}
                                type="button"
                                onClick={() => onEnviar(r)}
                                className="h-8 shrink-0 rounded-full bg-[#fff] px-3.5 text-[0.8125rem] font-medium text-huv-ink ring-1 ring-huv/30 focus-ring transition-colors ring-inset hover:bg-huv-soft dark:bg-transparent dark:ring-huv-ink/30"
                            >
                                {r.texto}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex items-end gap-2 rounded-xl bg-[#fff] py-1.5 pr-1.5 pl-3.5 ring-1 ring-gray-300 transition-shadow ring-inset focus-within:ring-2 focus-within:ring-huv dark:bg-transparent dark:ring-white/15">
                    <label htmlFor="mensaje-asistente" className="sr-only">
                        Tu respuesta
                    </label>
                    <textarea
                        ref={campo}
                        id="mensaje-asistente"
                        rows={1}
                        value={texto}
                        maxLength={1000}
                        onChange={(e) => setTexto(e.target.value)}
                        onKeyDown={alTeclear}
                        placeholder={PISTAS[paso ?? 'listo']}
                        inputMode={
                            paso === 'reporter_extension' ? 'numeric' : 'text'
                        }
                        autoComplete={paso === 'reporter_name' ? 'name' : 'off'}
                        enterKeyHint="send"
                        className="max-h-42 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm leading-5 text-gray-900 outline-none placeholder:text-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={!texto.trim() || cargando}
                        aria-label="Enviar mensaje"
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-huv text-white focus-ring transition-colors hover:bg-huv-hover disabled:bg-gray-900/10 disabled:text-gray-400 dark:disabled:bg-white/10"
                    >
                        <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                </div>
                <p className="mt-1.5 hidden px-1 text-xs text-gray-500 sm:block">
                    Enter para enviar · Shift + Enter para un salto de línea
                </p>
            </form>
        </section>
    );
}

function Burbuja({
    mensaje,
    onReintentar,
    onIrAlFormulario,
}: {
    mensaje: Mensaje;
    onReintentar: () => void;
    onIrAlFormulario: () => void;
}) {
    if (mensaje.autor === 'persona') {
        return (
            <div className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-huv px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-line text-white">
                    <span className="sr-only">Tú: </span>
                    {mensaje.texto}
                </p>
            </div>
        );
    }

    if (mensaje.autor === 'aviso') {
        return (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 px-3.5 py-3 text-[0.8125rem] text-red-800 ring-1 ring-red-600/15 ring-inset sm:ml-10 dark:bg-red-500/10 dark:text-red-200">
                <AlertCircle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                    <p>
                        {mensaje.fallo
                            ? TEXTO_FALLO[mensaje.fallo]
                            : mensaje.texto}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-medium">
                        {mensaje.envio && (
                            <button
                                type="button"
                                onClick={onReintentar}
                                className="rounded text-red-800 underline underline-offset-2 focus-ring hover:no-underline dark:text-red-200"
                            >
                                Reintentar
                            </button>
                        )}
                        {mensaje.fallo === 'servidor' && (
                            <button
                                type="button"
                                onClick={onIrAlFormulario}
                                className="rounded text-red-800 underline underline-offset-2 focus-ring hover:no-underline dark:text-red-200"
                            >
                                Llenar formulario
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-end gap-2.5">
            <img
                src="/images/evaris-avatar.webp"
                alt=""
                width={28}
                height={28}
                className="size-7 shrink-0 rounded-full bg-huv-soft object-cover"
            />
            <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#f3f4f6] px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-line text-gray-800 dark:bg-white/[0.06]">
                <span className="sr-only">Evarisbot: </span>
                {mensaje.texto}
            </p>
        </div>
    );
}
