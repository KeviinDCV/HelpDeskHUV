/**
 * Datos, reglas y conexión con el asistente de la página pública «Reportar un problema».
 *
 * El orden de las preguntas y sus textos son los mismos de ChatbotController (siguiente() y
 * PREGUNTAS): el servidor decide qué preguntar después de cada mensaje, y la página los usa para
 * las respuestas rápidas y para retomar la conversación cuando la persona viene del formulario.
 */
import { csrfHeaders } from '@/lib/csrf';
import {
    Computer,
    Ellipsis,
    Monitor,
    Phone,
    Printer,
    Wifi,
    type LucideIcon,
} from 'lucide-react';

/** Lo que recibe POST /reportar (PublicTicketController::store). */
export interface Datos {
    reporter_name: string;
    reporter_position: string;
    reporter_service: string;
    reporter_extension: string;
    reporter_email: string;
    name: string;
    content: string;
    priority: string;
    device_type: string;
    equipment_ecom: string;
    itilcategories_id: string;
}

export type Campo = keyof Datos;

export const DATOS_VACIOS: Datos = {
    reporter_name: '',
    reporter_position: '',
    reporter_service: '',
    reporter_extension: '',
    reporter_email: '',
    name: '',
    content: '',
    priority: '3',
    device_type: '',
    equipment_ecom: '',
    itilcategories_id: '',
};

/** Lo que el asistente pregunta, en el orden en que lo pregunta. */
export type Paso =
    | 'reporter_name'
    | 'reporter_position'
    | 'reporter_service'
    | 'reporter_extension'
    | 'content'
    | 'device_type'
    | 'equipment_ecom';

/** Sin estos el servidor rechaza el reporte. */
export const OBLIGATORIOS: Campo[] = [
    'reporter_name',
    'reporter_position',
    'reporter_service',
    'name',
    'content',
];

export const CARGOS = [
    'Administrativo',
    'Médico',
    'Enfermero',
    'Técnico',
    'Auxiliar',
    'Otro',
];

export const EQUIPOS: { valor: string; etiqueta: string; Icono: LucideIcon }[] =
    [
        { valor: 'computer', etiqueta: 'Computador', Icono: Computer },
        { valor: 'printer', etiqueta: 'Impresora', Icono: Printer },
        { valor: 'monitor', etiqueta: 'Monitor', Icono: Monitor },
        { valor: 'phone', etiqueta: 'Teléfono', Icono: Phone },
        { valor: 'network', etiqueta: 'Red / Internet', Icono: Wifi },
        { valor: 'other', etiqueta: 'Otro', Icono: Ellipsis },
    ];

/** Equipos que llevan etiqueta ECOM del inventario (se la pide el asistente). */
const CON_ECOM = ['computer', 'monitor', 'network'];

/** Así queda la extensión cuando la persona dice que no tiene (el mismo valor que usa la IA). */
export const SIN_EXTENSION = '0000';

export const ETIQUETAS: Record<Campo, string> = {
    reporter_name: 'Nombre completo',
    reporter_position: 'Cargo',
    reporter_service: 'Servicio o área',
    reporter_extension: 'Extensión',
    reporter_email: 'Correo',
    name: 'Título',
    content: 'Descripción',
    priority: 'Prioridad',
    device_type: 'Equipo',
    equipment_ecom: 'Código ECOM',
    itilcategories_id: 'Categoría',
};

export const PREGUNTAS: Record<Paso, string> = {
    reporter_name: '¿Cuál es tu nombre completo?',
    reporter_position: '¿Cuál es tu cargo?',
    reporter_service: '¿En qué servicio o área estás?',
    reporter_extension: '¿A qué extensión te pueden llamar si hace falta?',
    content:
        'Cuéntame qué está pasando: qué falla, desde cuándo y si aparece algún mensaje de error.',
    device_type: '¿Con qué equipo es el problema?',
    equipment_ecom:
        '¿Cuál es el código ECOM del equipo? Está en la etiqueta pegada al equipo, por ejemplo ECOM02708.',
};

export const LISTO =
    'Listo, ya tengo todo lo necesario. Revisa «Tu reporte» y, si está bien, pulsa «Enviar reporte».';

export const SALUDO = `Hola, soy Evarisbot. Te ayudo a reportar un problema técnico al equipo de Sistemas. ${PREGUNTAS.reporter_name}`;

/** El dato que toca pedir (null = ya no falta nada). Igual que ChatbotController::siguiente(). */
export function siguientePaso(d: Datos, omitidos: Paso[]): Paso | null {
    const falta = (campo: Paso) =>
        !d[campo].trim() && !omitidos.includes(campo);

    for (const campo of [
        'reporter_name',
        'reporter_position',
        'reporter_service',
        'reporter_extension',
    ] as const) {
        if (falta(campo)) return campo;
    }
    if (!d.content.trim() || !d.name.trim()) return 'content';
    if (falta('device_type')) return 'device_type';
    if (CON_ECOM.includes(d.device_type) && falta('equipment_ecom'))
        return 'equipment_ecom';
    return null;
}

export const faltantes = (d: Datos) =>
    OBLIGATORIOS.filter((campo) => !d[campo].trim());

export const etiquetaEquipo = (valor: string) =>
    EQUIPOS.find((e) => e.valor === valor)?.etiqueta ??
    (valor === 'software' ? 'Programa / Sistema' : valor);

/** Un título a partir de la descripción: su primera frase, hasta 80 caracteres. */
export function tituloDesde(texto: string): string {
    const frase = (texto.trim().split(/(?<=[.!?])\s|\n/)[0] ?? '').replace(
        /[.!?\s]+$/,
        '',
    );
    const corto =
        frase.length > 80 ? `${frase.slice(0, 79).trimEnd()}…` : frase;
    return corto.charAt(0).toUpperCase() + corto.slice(1);
}

/* ── Conversación ───────────────────────────────────────────────────────────────────────── */

/** Lo que se le manda al asistente: un texto escrito o una respuesta rápida (campos u omisión). */
export interface Envio {
    texto: string;
    campos?: Partial<Datos>;
    omitir?: Paso;
}

export interface Mensaje {
    id: number;
    autor: 'bot' | 'persona' | 'aviso';
    texto: string;
    /** Avisos de error: lo que no llegó, para «Reintentar». */
    envio?: Envio;
    fallo?: Fallo;
}

export type Fallo = 'limite' | 'red' | 'servidor';

export class ErrorAsistente extends Error {
    constructor(public tipo: Fallo) {
        super(tipo);
    }
}

interface Respuesta {
    ok: boolean;
    mensaje: string;
    campos: Partial<Record<Campo, unknown>>;
    siguiente: Paso | null;
    completo: boolean;
    sin_ia: boolean;
}

/**
 * Una vuelta de la conversación. El servidor responde con los datos nuevos ya validados y con el
 * mensaje completo (confirmación + siguiente pregunta). Lanza ErrorAsistente si no hay respuesta.
 */
export async function preguntarAlAsistente(cuerpo: {
    message?: string;
    campos?: Partial<Datos>;
    omitidos: Paso[];
    currentFormData: Datos;
    context: { role: 'user' | 'assistant'; content: string }[];
}): Promise<{ mensaje: string; campos: Partial<Datos>; sinIA: boolean }> {
    // El servidor se rinde a los 25 s (todos los modelos caídos → modo básico); esto es por si
    // la conexión se queda colgada.
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), 40_000);

    let respuesta: Response;
    try {
        respuesta = await fetch('/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...csrfHeaders(),
            },
            credentials: 'same-origin',
            body: JSON.stringify(cuerpo),
            signal: control.signal,
        });
    } catch {
        throw new ErrorAsistente('red');
    } finally {
        clearTimeout(reloj);
    }

    if (respuesta.status === 429) throw new ErrorAsistente('limite');
    if (!respuesta.ok) throw new ErrorAsistente('servidor');

    const datos = (await respuesta
        .json()
        .catch(() => null)) as Respuesta | null;
    if (!datos?.ok || typeof datos.mensaje !== 'string')
        throw new ErrorAsistente('servidor');

    const campos: Partial<Datos> = {};
    for (const [campo, valor] of Object.entries(datos.campos ?? {})) {
        if (
            campo in DATOS_VACIOS &&
            typeof valor === 'string' &&
            valor.trim()
        ) {
            campos[campo as Campo] = valor;
        }
    }
    return { mensaje: datos.mensaje, campos, sinIA: datos.sin_ia === true };
}

export const TEXTO_FALLO: Record<Fallo, string> = {
    limite: 'Enviaste varios mensajes muy seguidos. Espera un minuto y vuelve a intentarlo.',
    red: 'No hubo conexión con el servidor. Revisa tu red y vuelve a intentarlo.',
    servidor:
        'El asistente tuvo un problema al responder. Vuelve a intentarlo o llena el formulario.',
};

/* ── Borrador ───────────────────────────────────────────────────────────────────────────────
   La conversación y los datos se guardan en sessionStorage: si la página se recarga o se cierra
   por accidente, no se pierde lo escrito. Se borra al enviar el reporte. sessionStorage y no
   localStorage: en un computador compartido del hospital, el borrador no debe quedar para el
   siguiente turno. */

export type Modo = 'asistente' | 'formulario';

export interface Borrador {
    datos: Datos;
    omitidos: Paso[];
    mensajes: Mensaje[];
    modo: Modo;
    sinIA: boolean;
    /** El dato que preguntó el último mensaje del asistente. */
    preguntado: Paso | null;
}

const CLAVE = 'evarisbot_reporte_v2';
const PASOS: Paso[] = [
    'reporter_name',
    'reporter_position',
    'reporter_service',
    'reporter_extension',
    'content',
    'device_type',
    'equipment_ecom',
];

export function leerBorrador(): Borrador | null {
    try {
        const guardado = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null');
        if (!guardado || typeof guardado !== 'object') return null;

        const datos = { ...DATOS_VACIOS };
        for (const campo of Object.keys(DATOS_VACIOS) as Campo[]) {
            if (typeof guardado.datos?.[campo] === 'string')
                datos[campo] = guardado.datos[campo];
        }
        const mensajes: Mensaje[] = Array.isArray(guardado.mensajes)
            ? guardado.mensajes.filter(
                  (m: Mensaje) =>
                      typeof m?.id === 'number' &&
                      (m.autor === 'bot' || m.autor === 'persona') &&
                      typeof m.texto === 'string',
              )
            : [];

        return {
            datos,
            omitidos: Array.isArray(guardado.omitidos)
                ? guardado.omitidos.filter((p: Paso) => PASOS.includes(p))
                : [],
            mensajes,
            modo: guardado.modo === 'formulario' ? 'formulario' : 'asistente',
            sinIA: guardado.sinIA === true,
            preguntado: PASOS.includes(guardado.preguntado)
                ? guardado.preguntado
                : null,
        };
    } catch {
        return null;
    }
}

export function guardarBorrador(borrador: Borrador) {
    try {
        sessionStorage.setItem(
            CLAVE,
            JSON.stringify({
                ...borrador,
                mensajes: borrador.mensajes.filter((m) => m.autor !== 'aviso'),
            }),
        );
    } catch {
        /* Sin almacenamiento (modo privado estricto): la página funciona igual, sin borrador. */
    }
}

export function borrarBorrador() {
    try {
        sessionStorage.removeItem(CLAVE);
    } catch {
        /* nada que borrar */
    }
}
