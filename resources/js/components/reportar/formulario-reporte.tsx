import { FormField } from '@/components/form-field';
import { ResumenErrores } from '@/components/formulario';
import { btn, fieldClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import {
    CARGOS,
    EQUIPOS,
    ETIQUETAS,
    SIN_EXTENSION,
    faltantes,
    tituloDesde,
    type Campo,
    type Datos,
} from './reporte';

/** Opción tipo «ficha» de un grupo de radios: el radio real queda oculto pero es el que recibe el foco. */
const opcion =
    'relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#fff] px-3.5 text-sm text-gray-700 ring-1 ring-gray-300 ring-inset transition-colors select-none hover:bg-gray-900/[0.03] ' +
    'has-checked:bg-huv-soft has-checked:font-medium has-checked:text-huv-ink has-checked:ring-2 has-checked:ring-huv ' +
    'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-huv-ink ' +
    'dark:bg-transparent dark:ring-white/15 dark:hover:bg-white/5 dark:has-checked:ring-huv-ink';

export function FormularioReporte({
    datos,
    errores,
    enviando,
    resumenErroresRef,
    onCambiar,
    onEnviar,
}: {
    datos: Datos;
    errores: Record<string, string>;
    enviando: boolean;
    resumenErroresRef: Ref<HTMLDivElement>;
    onCambiar: (cambios: Partial<Datos>) => void;
    onEnviar: () => void;
}) {
    const faltan = faltantes(datos).length;
    const sinExtension = datos.reporter_extension === SIN_EXTENSION;

    return (
        <form
            noValidate
            onSubmit={(e) => {
                e.preventDefault();
                onEnviar();
            }}
            className="surface-card"
        >
            <div className="space-y-8 p-5 sm:p-6">
                <ResumenErrores
                    ref={resumenErroresRef}
                    errores={errores}
                    etiquetas={ETIQUETAS}
                    accion="enviar el reporte"
                />

                <Grupo
                    titulo="Quién reporta"
                    descripcion="Para saber a quién contactar si hace falta."
                >
                    <div className="sm:col-span-2">
                        <FormField
                            id="reporter_name"
                            label="Nombre completo"
                            error={errores.reporter_name}
                        >
                            {(control) => (
                                <input
                                    {...control}
                                    type="text"
                                    autoComplete="name"
                                    maxLength={255}
                                    value={datos.reporter_name}
                                    onChange={(e) =>
                                        onCambiar({
                                            reporter_name: e.target.value,
                                        })
                                    }
                                    className={fieldClass}
                                />
                            )}
                        </FormField>
                    </div>

                    <Opciones
                        campo="reporter_position"
                        etiqueta="Cargo"
                        error={errores.reporter_position}
                        className="sm:col-span-2"
                    >
                        {CARGOS.map((cargo, i) => (
                            <label key={cargo} className={opcion}>
                                <input
                                    type="radio"
                                    name="reporter_position"
                                    id={
                                        i === 0
                                            ? 'reporter_position'
                                            : undefined
                                    }
                                    value={cargo}
                                    checked={datos.reporter_position === cargo}
                                    onChange={() =>
                                        onCambiar({ reporter_position: cargo })
                                    }
                                    className="sr-only"
                                />
                                {cargo}
                            </label>
                        ))}
                        {/* Un cargo que no está en la lista (de un borrador viejo): se ve marcado, no se pierde */}
                        {datos.reporter_position &&
                            !CARGOS.includes(datos.reporter_position) && (
                                <label className={opcion}>
                                    <input
                                        type="radio"
                                        name="reporter_position"
                                        checked
                                        readOnly
                                        className="sr-only"
                                    />
                                    {datos.reporter_position}
                                </label>
                            )}
                    </Opciones>

                    <FormField
                        id="reporter_service"
                        label="Servicio o área"
                        error={errores.reporter_service}
                        hint="Por ejemplo: Urgencias, UCI adultos, Farmacia."
                    >
                        {(control) => (
                            <input
                                {...control}
                                type="text"
                                maxLength={255}
                                value={datos.reporter_service}
                                onChange={(e) =>
                                    onCambiar({
                                        reporter_service: e.target.value,
                                    })
                                }
                                className={fieldClass}
                            />
                        )}
                    </FormField>

                    <div>
                        <FormField
                            id="reporter_extension"
                            label="Extensión"
                            optional
                            error={errores.reporter_extension}
                        >
                            {(control) => (
                                <input
                                    {...control}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={20}
                                    disabled={sinExtension}
                                    value={
                                        sinExtension
                                            ? ''
                                            : datos.reporter_extension
                                    }
                                    onChange={(e) =>
                                        onCambiar({
                                            reporter_extension: e.target.value,
                                        })
                                    }
                                    className={cn(
                                        fieldClass,
                                        'disabled:bg-gray-900/[0.03] disabled:text-gray-400',
                                    )}
                                />
                            )}
                        </FormField>
                        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={sinExtension}
                                onChange={(e) =>
                                    onCambiar({
                                        reporter_extension: e.target.checked
                                            ? SIN_EXTENSION
                                            : '',
                                    })
                                }
                                className="size-4 rounded accent-[var(--huv)] focus-ring"
                            />
                            No tengo extensión
                        </label>
                    </div>
                </Grupo>

                <Grupo
                    titulo="El problema"
                    descripcion="Entre más detalle, más rápido se resuelve."
                >
                    <div className="sm:col-span-2">
                        <FormField
                            id="content"
                            label="Descripción"
                            error={errores.content}
                            hint="Qué falla, desde cuándo y si aparece algún mensaje de error."
                        >
                            {(control) => (
                                <textarea
                                    {...control}
                                    rows={5}
                                    value={datos.content}
                                    onChange={(e) =>
                                        onCambiar({ content: e.target.value })
                                    }
                                    // El título se propone solo con la primera frase; se puede cambiar
                                    onBlur={() =>
                                        !datos.name.trim() &&
                                        datos.content.trim() &&
                                        onCambiar({
                                            name: tituloDesde(datos.content),
                                        })
                                    }
                                    className={cn(
                                        fieldClass,
                                        'h-auto min-h-32 resize-y py-2.5 leading-relaxed',
                                    )}
                                />
                            )}
                        </FormField>
                    </div>

                    <div className="sm:col-span-2">
                        <FormField
                            id="name"
                            label="Título"
                            error={errores.name}
                            hint="Una frase corta. Se llena sola con el inicio de la descripción y puedes cambiarla."
                        >
                            {(control) => (
                                <input
                                    {...control}
                                    type="text"
                                    maxLength={255}
                                    value={datos.name}
                                    onChange={(e) =>
                                        onCambiar({ name: e.target.value })
                                    }
                                    className={fieldClass}
                                />
                            )}
                        </FormField>
                    </div>

                    <Opciones
                        campo="device_type"
                        etiqueta="Equipo"
                        opcional
                        error={errores.device_type}
                        className="sm:col-span-2"
                    >
                        {EQUIPOS.map(({ valor, etiqueta, Icono }, i) => (
                            <label key={valor} className={opcion}>
                                <input
                                    type="radio"
                                    name="device_type"
                                    id={i === 0 ? 'device_type' : undefined}
                                    value={valor}
                                    checked={datos.device_type === valor}
                                    onChange={() =>
                                        onCambiar({ device_type: valor })
                                    }
                                    className="sr-only"
                                />
                                <Icono
                                    className="size-4 shrink-0 opacity-70"
                                    aria-hidden="true"
                                />
                                {etiqueta}
                            </label>
                        ))}
                    </Opciones>

                    <FormField
                        id="equipment_ecom"
                        label="Código ECOM"
                        optional
                        error={errores.equipment_ecom}
                        hint="Está en la etiqueta pegada al equipo, por ejemplo ECOM02708."
                    >
                        {(control) => (
                            <input
                                {...control}
                                type="text"
                                maxLength={100}
                                autoCapitalize="characters"
                                value={datos.equipment_ecom}
                                onChange={(e) =>
                                    onCambiar({
                                        equipment_ecom: e.target.value,
                                    })
                                }
                                className={cn(
                                    fieldClass,
                                    'uppercase placeholder:normal-case',
                                )}
                            />
                        )}
                    </FormField>
                </Grupo>
            </div>

            <div
                aria-hidden="true"
                className="h-px bg-gray-900/[0.07] dark:bg-white/10"
            />
            <div className="flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs text-gray-500">
                    {faltan > 0
                        ? `${faltan === 1 ? 'Falta 1 dato obligatorio' : `Faltan ${faltan} datos obligatorios`}.`
                        : 'Todo listo para enviar.'}
                </p>
                <button
                    type="submit"
                    disabled={enviando}
                    className={cn(btn.primary, 'h-10')}
                >
                    {enviando && (
                        <Loader2 className="animate-spin" aria-hidden="true" />
                    )}
                    {enviando ? 'Enviando…' : 'Enviar reporte'}
                </button>
            </div>
        </form>
    );
}

function Grupo({
    titulo,
    descripcion,
    children,
}: {
    titulo: string;
    descripcion: string;
    children: ReactNode;
}) {
    return (
        <fieldset>
            <legend className="text-base font-semibold text-gray-900">
                {titulo}
            </legend>
            <p className="mt-0.5 text-sm text-gray-500">{descripcion}</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
        </fieldset>
    );
}

/** Grupo de radios con su leyenda y su error, cableados para lector de pantalla. */
function Opciones({
    campo,
    etiqueta,
    opcional,
    error,
    className,
    children,
}: {
    campo: Campo;
    etiqueta: string;
    opcional?: boolean;
    error?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <fieldset
            className={className}
            aria-describedby={error ? `${campo}-error` : undefined}
            aria-invalid={error ? true : undefined}
        >
            <legend className="flex w-full items-baseline justify-between gap-2 text-sm font-medium text-gray-700">
                {etiqueta}
                {opcional && (
                    <span className="text-xs font-normal text-gray-500">
                        Opcional
                    </span>
                )}
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">{children}</div>
            {error && (
                <p
                    id={`${campo}-error`}
                    className="mt-1.5 text-sm text-red-600"
                >
                    {error}
                </p>
            )}
        </fieldset>
    );
}
