import { ConfirmDialog } from '@/components/confirm-dialog';
import { erroresPorCampo } from '@/components/formulario';
import { Cabecera } from '@/components/reportar/cabecera';
import { Conversacion } from '@/components/reportar/conversacion';
import { Enviado, type Exito } from '@/components/reportar/enviado';
import { FormularioReporte } from '@/components/reportar/formulario-reporte';
import {
    DATOS_VACIOS,
    ErrorAsistente,
    LISTO,
    PREGUNTAS,
    SALUDO,
    borrarBorrador,
    faltantes,
    guardarBorrador,
    leerBorrador,
    preguntarAlAsistente,
    siguientePaso,
    tituloDesde,
    type Campo,
    type Datos,
    type Envio,
    type Fallo,
    type Mensaje,
    type Modo,
    type Paso,
} from '@/components/reportar/reporte';
import { Resumen, ResumenPlegable } from '@/components/reportar/resumen';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, ClipboardList, MessageSquareText } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

type Props = SharedData & {
    flash?: { success?: Exito | string | null };
};

export default function ReportarCaso() {
    const { flash } = usePage<Props>().props;
    const exito =
        flash?.success && typeof flash.success === 'object'
            ? flash.success
            : null;

    if (exito) {
        return <Enviado exito={exito} />;
    }
    return <Reporte />;
}

const saludo = (): Mensaje => ({ id: 1, autor: 'bot', texto: SALUDO });

/** Lo que pasó cuando el envío no llegó: los datos siguen en la página. */
const TEXTO_FALLO_ENVIO: Record<Fallo, string> = {
    limite: 'Se enviaron varios reportes seguidos desde este equipo. Espera un minuto y vuelve a intentarlo; tus datos siguen aquí.',
    servidor:
        'Hubo un problema en el sistema. Tus datos siguen aquí: vuelve a intentarlo en unos minutos y, si sigue fallando, llama a Sistemas.',
    red: 'No hubo conexión con el servidor. Revisa tu red y vuelve a intentarlo; tus datos siguen aquí.',
};

function Reporte() {
    // Si la página se recargó a mitad del reporte, se retoma donde iba
    const [inicial] = useState(leerBorrador);
    const [datos, setDatos] = useState<Datos>(inicial?.datos ?? DATOS_VACIOS);
    const [omitidos, setOmitidos] = useState<Paso[]>(inicial?.omitidos ?? []);
    const [mensajes, setMensajes] = useState<Mensaje[]>(
        inicial?.mensajes.length ? inicial.mensajes : [saludo()],
    );
    const [modo, setModo] = useState<Modo>(inicial?.modo ?? 'asistente');
    const [sinIA, setSinIA] = useState(inicial?.sinIA ?? false);
    const [preguntado, setPreguntado] = useState<Paso | null>(
        inicial ? inicial.preguntado : 'reporter_name',
    );
    const [cargando, setCargando] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [recientes, setRecientes] = useState<Campo[]>([]);
    const [reiniciar, setReiniciar] = useState(false);
    const [falloEnvio, setFalloEnvio] = useState<Fallo | null>(null);

    const ultimoId = useRef(Math.max(0, ...mensajes.map((m) => m.id)));
    const nuevoId = () => ++ultimoId.current;
    const resumenErrores = useRef<HTMLDivElement>(null);
    const avisoEnvio = useRef<HTMLDivElement>(null);
    const enfocarDespues = useRef<string | null>(null);

    const paso = siguientePaso(datos, omitidos);
    const faltan = faltantes(datos);
    const hayProgreso =
        mensajes.length > 1 ||
        Object.entries(datos).some(
            ([campo, valor]) => campo !== 'priority' && valor.trim() !== '',
        );

    useEffect(() => {
        guardarBorrador({ datos, omitidos, mensajes, modo, sinIA, preguntado });
    }, [datos, omitidos, mensajes, modo, sinIA, preguntado]);

    // El aviso de envío fallido recibe el foco: el lector de pantalla lo lee y el botón para
    // reintentar queda a mano. En un efecto, porque el aviso aún no existe cuando llega el fallo.
    useEffect(() => {
        if (falloEnvio) avisoEnvio.current?.focus();
    }, [falloEnvio]);

    // El resaltado de los datos recién llenados dura lo que su animación
    useEffect(() => {
        if (recientes.length === 0) return;
        const reloj = setTimeout(() => setRecientes([]), 2600);
        return () => clearTimeout(reloj);
    }, [recientes]);

    // Al pasar al formulario desde «Editar» o desde un error, el foco va al campo
    useEffect(() => {
        if (enfocarDespues.current) {
            document.getElementById(enfocarDespues.current)?.focus();
            enfocarDespues.current = null;
        }
    }, [modo, errores]);

    /* ── Conversación ── */

    const conversar = async (envio: Envio, repetir = false) => {
        if (cargando) return;

        // Sin avisos de error viejos: si se reintenta, el mensaje de la persona ya está en el hilo
        const hilo = mensajes.filter((m) => m.autor !== 'aviso');
        const conMensaje: Mensaje[] = repetir
            ? hilo
            : [
                  ...hilo,
                  { id: nuevoId(), autor: 'persona', texto: envio.texto },
              ];
        setMensajes(conMensaje);

        const omitir =
            envio.omitir && !omitidos.includes(envio.omitir)
                ? [...omitidos, envio.omitir]
                : omitidos;
        setOmitidos(omitir);
        setCargando(true);

        try {
            const esRapida = !!(envio.campos || envio.omitir);
            const respuesta = await preguntarAlAsistente({
                ...(esRapida
                    ? { campos: envio.campos ?? {} }
                    : { message: envio.texto }),
                omitidos: omitir,
                currentFormData: datos,
                // Lo anterior al mensaje actual: el servidor lo agrega al final por su cuenta
                context: conMensaje
                    .slice(0, -1)
                    .slice(-6)
                    .map((m) => ({
                        role: m.autor === 'persona' ? 'user' : 'assistant',
                        content: m.texto,
                    })),
            });

            setDatos((d) => ({ ...d, ...respuesta.campos }));
            setRecientes(Object.keys(respuesta.campos) as Campo[]);
            setSinIA(respuesta.sinIA);
            setMensajes((m) => [
                ...m,
                { id: nuevoId(), autor: 'bot', texto: respuesta.mensaje },
            ]);
            setPreguntado(
                siguientePaso({ ...datos, ...respuesta.campos }, omitir),
            );
        } catch (e) {
            const fallo = e instanceof ErrorAsistente ? e.tipo : 'servidor';
            setMensajes((m) => [
                ...m,
                { id: nuevoId(), autor: 'aviso', texto: '', fallo, envio },
            ]);
        } finally {
            setCargando(false);
        }
    };

    const cambiarModo = (nuevo: Modo) => {
        if (nuevo === modo) return;
        // Volviendo del formulario con datos cambiados: la última pregunta del asistente puede no
        // ser ya la que toca. Se retoma con la que corresponde.
        if (nuevo === 'asistente' && paso !== preguntado) {
            setMensajes((m) => [
                ...m.filter((x) => x.autor !== 'aviso'),
                {
                    id: nuevoId(),
                    autor: 'bot',
                    texto:
                        paso === null
                            ? `Tomé los cambios del formulario. ${LISTO}`
                            : `Tomé los cambios del formulario. ${PREGUNTAS[paso]}`,
                },
            ]);
            setPreguntado(paso);
        }
        setModo(nuevo);
    };

    const editar = (campo: Campo) => {
        enfocarDespues.current = campo;
        if (modo === 'formulario') {
            document.getElementById(campo)?.focus();
            enfocarDespues.current = null;
        } else {
            setModo('formulario');
        }
    };

    const cambiarDatos = (cambios: Partial<Datos>) => {
        setDatos((d) => ({ ...d, ...cambios }));
        // Si la persona escribe la extensión o el ECOM en el formulario, deja de estar «omitido»
        setOmitidos((o) => o.filter((p) => !(p in cambios)));
        setErrores((e) => {
            const quedan = { ...e };
            for (const campo of Object.keys(cambios)) delete quedan[campo];
            return quedan;
        });
    };

    const empezarDeNuevo = () => {
        borrarBorrador();
        setDatos(DATOS_VACIOS);
        setOmitidos([]);
        setMensajes([saludo()]);
        ultimoId.current = 1;
        setSinIA(false);
        setPreguntado('reporter_name');
        setErrores({});
        setRecientes([]);
        setReiniciar(false);
        setModo('asistente');
        requestAnimationFrame(() =>
            document.getElementById('mensaje-asistente')?.focus(),
        );
    };

    /* ── Envío ── */

    const mostrarErrores = (lista: Record<string, string>) => {
        setErrores(lista);
        setModo('formulario');
        // El resumen de errores recibe el foco: lee qué falta y cada error lleva a su campo
        requestAnimationFrame(() => resumenErrores.current?.focus());
    };

    const enviarReporte = () => {
        if (enviando) return;
        const reporte: Datos = {
            ...datos,
            name: datos.name.trim() || tituloDesde(datos.content),
            priority: datos.priority || '3',
        };
        const pendientes = faltantes(reporte);
        if (pendientes.length > 0) {
            mostrarErrores(
                Object.fromEntries(
                    pendientes.map((campo) => [
                        campo,
                        'Este dato es obligatorio.',
                    ]),
                ),
            );
            return;
        }
        if (reporte.name !== datos.name) setDatos(reporte);

        // Si el servidor no responde con la página (límite de envíos, error 500, sin red),
        // Inertia mostraría la página de error en un recuadro, y su «Volver al inicio» lleva a «/»:
        // con una sesión de técnico abierta en el equipo, eso abre la mesa de ayuda. Mientras se
        // envía, esas respuestas se atienden aquí y la persona se queda con sus datos.
        const quitarInvalido = router.on('invalid', (evento) => {
            evento.preventDefault();
            setFalloEnvio(
                evento.detail.response.status === 429 ? 'limite' : 'servidor',
            );
        });
        const quitarExcepcion = router.on('exception', (evento) => {
            evento.preventDefault();
            setFalloEnvio('red');
        });

        router.post(
            '/reportar',
            { ...reporte },
            {
                preserveScroll: true,
                onStart: () => {
                    setEnviando(true);
                    setFalloEnvio(null);
                },
                onError: (errs) => mostrarErrores(erroresPorCampo(errs)),
                onFinish: () => {
                    setEnviando(false);
                    quitarInvalido();
                    quitarExcepcion();
                },
            },
        );
    };

    /* ── Pestañas ── */

    const MODOS: {
        valor: Modo;
        etiqueta: string;
        Icono: typeof MessageSquareText;
    }[] = [
        {
            valor: 'asistente',
            etiqueta: 'Con el asistente',
            Icono: MessageSquareText,
        },
        {
            valor: 'formulario',
            etiqueta: 'Llenar formulario',
            Icono: ClipboardList,
        },
    ];

    const teclasPestanas = (e: KeyboardEvent<HTMLDivElement>) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        const otro: Modo = modo === 'asistente' ? 'formulario' : 'asistente';
        const destino: Modo =
            e.key === 'Home'
                ? 'asistente'
                : e.key === 'End'
                  ? 'formulario'
                  : otro;
        cambiarModo(destino);
        requestAnimationFrame(() =>
            document.getElementById(`pestana-${destino}`)?.focus(),
        );
    };

    const propsResumen = {
        datos,
        recientes,
        enviando,
        onEnviar: enviarReporte,
        onEditar: editar,
    };

    return (
        <>
            <Head title="Reportar un problema" />
            <div className="min-h-dvh bg-gray-50">
                <Cabecera />

                <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 sm:px-6 lg:pt-8">
                    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_23rem]">
                        <div className="min-w-0">
                            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[1.75rem]">
                                Reportar un problema técnico
                            </h1>
                            <p className="mt-1.5 max-w-2xl text-sm text-gray-600">
                                Cuéntanos qué pasa y el equipo de Sistemas lo
                                atenderá. Al enviarlo recibes un número de caso
                                para hacerle seguimiento.
                            </p>

                            <div
                                role="tablist"
                                aria-label="Cómo quieres reportar"
                                onKeyDown={teclasPestanas}
                                className="mt-5 inline-flex rounded-xl bg-gray-900/[0.05] p-1 dark:bg-white/[0.06]"
                            >
                                {MODOS.map(({ valor, etiqueta, Icono }) => {
                                    const activa = modo === valor;
                                    return (
                                        <button
                                            key={valor}
                                            type="button"
                                            role="tab"
                                            id={`pestana-${valor}`}
                                            aria-selected={activa}
                                            aria-controls={`panel-${valor}`}
                                            tabIndex={activa ? 0 : -1}
                                            onClick={() => cambiarModo(valor)}
                                            className={cn(
                                                'inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium focus-ring transition-colors sm:px-4',
                                                activa
                                                    ? 'bg-[#fff] text-gray-900 elev-1 dark:bg-white/10'
                                                    : 'text-gray-600 hover:text-gray-900',
                                            )}
                                        >
                                            <Icono
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                            {etiqueta}
                                        </button>
                                    );
                                })}
                            </div>

                            {falloEnvio && (
                                <div
                                    ref={avisoEnvio}
                                    role="alert"
                                    tabIndex={-1}
                                    className="mt-4 flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-600/20 ring-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:bg-red-500/10 dark:text-red-200"
                                >
                                    <AlertTriangle
                                        className="mt-0.5 size-4 shrink-0"
                                        aria-hidden="true"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold">
                                            No se pudo enviar el reporte.
                                        </p>
                                        <p className="mt-0.5">
                                            {TEXTO_FALLO_ENVIO[falloEnvio]}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={enviarReporte}
                                            disabled={enviando}
                                            className="mt-2 rounded font-medium text-red-800 underline underline-offset-2 focus-ring hover:no-underline disabled:opacity-60 dark:text-red-200"
                                        >
                                            Intentar de nuevo
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Los dos paneles quedan montados (uno oculto): lo que se esté escribiendo
                                en uno no se pierde al cambiar de pestaña. */}
                            <div
                                role="tabpanel"
                                id="panel-asistente"
                                aria-labelledby="pestana-asistente"
                                hidden={modo !== 'asistente'}
                                className="mt-4 space-y-4"
                            >
                                <div className="lg:hidden">
                                    <ResumenPlegable {...propsResumen} />
                                </div>
                                <Conversacion
                                    mensajes={mensajes}
                                    paso={paso}
                                    cargando={cargando}
                                    sinIA={sinIA}
                                    hayProgreso={hayProgreso}
                                    puedeEnviar={faltan.length === 0}
                                    enviando={enviando}
                                    onEnviar={(envio) => conversar(envio)}
                                    onReintentar={(m) =>
                                        m.envio && conversar(m.envio, true)
                                    }
                                    onEmpezarDeNuevo={() => setReiniciar(true)}
                                    onEnviarReporte={enviarReporte}
                                    onIrAlFormulario={() =>
                                        cambiarModo('formulario')
                                    }
                                />
                            </div>
                            <div
                                role="tabpanel"
                                id="panel-formulario"
                                aria-labelledby="pestana-formulario"
                                hidden={modo !== 'formulario'}
                                className="mt-4"
                            >
                                <FormularioReporte
                                    datos={datos}
                                    errores={errores}
                                    enviando={enviando}
                                    resumenErroresRef={resumenErrores}
                                    onCambiar={cambiarDatos}
                                    onEnviar={enviarReporte}
                                />
                            </div>
                        </div>

                        <aside
                            aria-label="Resumen del reporte"
                            className="hidden lg:sticky lg:top-24 lg:block"
                        >
                            <Resumen {...propsResumen} />
                        </aside>
                    </div>
                </main>
            </div>

            <ConfirmDialog
                open={reiniciar}
                onOpenChange={setReiniciar}
                title="¿Empezar de nuevo?"
                description="Se borran la conversación y los datos que llevas de este reporte."
                confirmLabel="Empezar de nuevo"
                onConfirm={empezarDeNuevo}
            />
        </>
    );
}
