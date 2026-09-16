/**
 * Formularios de Inventario (crear / editar computador, monitor, impresora…) a partir de una
 * lista de secciones y campos. Cada página declara SUS campos —las mismas claves, etiquetas y
 * opciones que ya tenía— y aquí se dibujan todos igual. Crear y editar de un tipo comparten la
 * misma declaración: no pueden quedar con campos distintos.
 */
import { AccionesFormulario, AvisoError, ResumenErrores, SeccionLateral, disparador, erroresPorCampo, formularioClase } from '@/components/formulario';
import { FormField } from '@/components/form-field';
import { SelectWithCreate, type DropdownOption } from '@/components/select-with-create';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fieldClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';

interface CampoBase {
    clave: string;
    etiqueta: string;
    /** Ocupa las dos columnas de la tarjeta */
    ancho?: boolean;
    ayuda?: ReactNode;
}

export type ControlCampo = { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true };

export type CampoInventario =
    | (CampoBase & { tipo: 'texto'; placeholder?: string; obligatorio?: boolean; maxLength?: number; inputMode?: 'numeric' | 'decimal' | 'text' })
    | (CampoBase & { tipo: 'numero'; placeholder?: string; min?: number; max?: number; step?: number | 'any' })
    | (CampoBase & { tipo: 'fecha'; conHora?: boolean })
    | (CampoBase & {
          tipo: 'catalogo';
          opciones: DropdownOption[];
          dropdownType: string;
          createLabel: string;
          placeholder?: string;
          completo?: boolean;
          ninguno?: boolean;
          /** Valor actual que quizá no esté en el catálogo (se ve y se conserva) */
          actual?: { value: string; label: string };
      })
    | (CampoBase & {
          tipo: 'lista';
          opciones: { value: string; label: string }[];
          placeholder?: string;
          /** Valor actual que quizá no esté en la lista (se ve y se conserva) */
          actual?: { value: string; label: string };
      })
    | (CampoBase & {
          /** Lista larga con búsqueda y sin «+» (usuarios, grupos, entidades) */
          tipo: 'buscable';
          opciones: { value: string; label: string }[];
          placeholder?: string;
          /** Agrega «-- Ninguno --» (valor "0") para poder dejarlo sin asignar */
          ninguno?: boolean;
          actual?: { value: string; label: string };
      })
    | (CampoBase & { tipo: 'nota'; placeholder?: string; filas?: number })
    | (CampoBase & { tipo: 'casilla'; descripcion?: string })
    | (CampoBase & { tipo: 'libre'; render: (control: ControlCampo) => ReactNode });

export interface SeccionInventario {
    titulo: string;
    descripcion?: ReactNode;
    campos: CampoInventario[];
}

export type Valor = string | number | boolean | null | undefined;

/** Lo que se usa del useForm de Inertia (se pasa tal cual desde la página). */
export interface FormularioBase {
    data: Record<string, unknown>;
    errors: Record<string, string | undefined>;
    processing: boolean;
    setData: (clave: string, valor: unknown) => void;
    setError: (errores: Record<string, string>) => void;
    clearErrors: (...claves: string[]) => void;
}

interface Props {
    secciones: SeccionInventario[];
    form: FormularioBase;
    /** Envía el formulario (post/put con la URL y opciones de la página) */
    enviar: () => void;
    /** "crear el monitor" / "guardar los cambios", para el resumen de errores */
    accion: string;
    cancelarHref: string;
    textoEnviar: string;
    textoEnviando: string;
    /** Secciones propias de una página, antes de las acciones */
    children?: ReactNode;
}

export function FormularioInventario({ secciones, form, enviar, accion, cancelarHref, textoEnviar, textoEnviando, children }: Props) {
    const { flash } = usePage<{ flash?: { error?: string | null } }>().props;
    const resumen = useRef<HTMLDivElement>(null);
    const recienEnviado = useRef(false);
    const porCampo = erroresPorCampo(form.errors);
    const etiquetas = Object.fromEntries(secciones.flatMap((s) => s.campos.map((c) => [c.clave, c.etiqueta])));

    // Tras un envío con errores (del cliente o del servidor) el foco va al resumen. Solo tras
    // enviar: al corregir un campo su error se quita y el foco no debe saltar.
    useEffect(() => {
        if (recienEnviado.current && Object.keys(form.errors).length > 0) {
            resumen.current?.focus();
            recienEnviado.current = false;
        }
    }, [form.errors]);

    const alEnviar = (e: FormEvent) => {
        e.preventDefault();
        recienEnviado.current = true;
        // Lo obligatorio, antes de enviar (el servidor valida lo mismo)
        const faltan: Record<string, string> = {};
        for (const c of secciones.flatMap((s) => s.campos)) {
            if (c.tipo === 'texto' && c.obligatorio && !String(form.data[c.clave] ?? '').trim()) faltan[c.clave] = `Escribe ${c.etiqueta.toLowerCase()}.`;
        }
        form.clearErrors();
        if (Object.keys(faltan).length > 0) {
            form.setError(faltan);
            return;
        }
        enviar();
    };

    const alCambiar = (clave: string, valor: unknown) => {
        form.setData(clave, valor);
        if (form.errors[clave]) form.clearErrors(clave);
    };

    return (
        <form noValidate onSubmit={alEnviar} className={cn('space-y-6', formularioClase)}>
            <AvisoError mensaje={flash?.error} />
            <ResumenErrores ref={resumen} errores={porCampo} etiquetas={etiquetas} accion={accion} />

            {secciones.map((s) => (
                <SeccionLateral key={s.titulo} titulo={s.titulo} descripcion={s.descripcion}>
                    {s.campos.map((c) => (
                        <div key={c.clave} className={cn('min-w-0', c.ancho && 'sm:col-span-2')}>
                            <Campo campo={c} valor={form.data[c.clave] as Valor} error={porCampo[c.clave]} alCambiar={alCambiar} />
                        </div>
                    ))}
                </SeccionLateral>
            ))}

            {children}

            <AccionesFormulario cancelarHref={cancelarHref} enviando={form.processing} texto={textoEnviar} textoEnviando={textoEnviando} />
        </form>
    );
}

/** Un campo con su etiqueta, error y ayuda (también lo usan los subformularios). */
export function Campo({ campo: c, valor, error, alCambiar }: { campo: CampoInventario; valor: Valor; error?: string; alCambiar: (clave: string, valor: unknown) => void }) {
    const texto = valor === null || valor === undefined ? '' : String(valor);

    // La casilla lleva su texto al lado: con la etiqueta de FormField encima se leería dos veces
    if (c.tipo === 'casilla') {
        const errorId = error ? `${c.clave}-error` : undefined;
        return (
            <div>
                <label className="flex min-h-6 items-center gap-2.5 text-sm font-medium text-gray-700">
                    <input
                        id={c.clave}
                        type="checkbox"
                        name={c.clave}
                        checked={Boolean(valor)}
                        onChange={(e) => alCambiar(c.clave, e.target.checked)}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={errorId}
                        className="focus-ring size-4 shrink-0 accent-[var(--huv)]"
                    />
                    {c.descripcion ?? c.etiqueta}
                </label>
                {error && (
                    <p id={errorId} className="mt-1 text-sm text-red-600">
                        {error}
                    </p>
                )}
            </div>
        );
    }

    return (
        <FormField id={c.clave} label={c.etiqueta} error={error} hint={c.ayuda}>
            {(control) => {
                switch (c.tipo) {
                    case 'texto':
                        return (
                            <input
                                {...control}
                                name={c.clave}
                                autoComplete="off"
                                value={texto}
                                maxLength={c.maxLength}
                                inputMode={c.inputMode}
                                placeholder={c.placeholder}
                                onChange={(e) => alCambiar(c.clave, e.target.value)}
                                className={fieldClass}
                            />
                        );
                    case 'numero':
                        return (
                            <input
                                {...control}
                                type="number"
                                name={c.clave}
                                value={texto}
                                min={c.min}
                                max={c.max}
                                step={c.step}
                                placeholder={c.placeholder}
                                onChange={(e) => alCambiar(c.clave, e.target.value)}
                                className={fieldClass}
                            />
                        );
                    case 'fecha':
                        return <input {...control} type={c.conHora ? 'datetime-local' : 'date'} name={c.clave} value={texto} onChange={(e) => alCambiar(c.clave, e.target.value)} className={fieldClass} />;
                    case 'catalogo':
                        return (
                            <SelectWithCreate
                                {...control}
                                value={texto}
                                onValueChange={(v) => alCambiar(c.clave, v)}
                                options={c.opciones}
                                dropdownType={c.dropdownType}
                                createLabel={c.createLabel}
                                placeholder={c.placeholder}
                                useCompletename={c.completo}
                                allowNone={c.ninguno}
                                actual={c.actual}
                                triggerClassName={disparador}
                            />
                        );
                    case 'lista': {
                        const opciones = c.actual && c.actual.value === texto && !c.opciones.some((o) => o.value === texto) ? [...c.opciones, c.actual] : c.opciones;
                        return (
                            <Select value={texto} onValueChange={(v) => alCambiar(c.clave, v)}>
                                <SelectTrigger {...control} className={disparador}>
                                    <SelectValue placeholder={c.placeholder ?? 'Seleccionar…'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {opciones.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        );
                    }
                    case 'buscable': {
                        const opciones = [
                            ...(c.ninguno && !c.opciones.some((o) => o.value === '0') ? [{ value: '0', label: '-- Ninguno --' }] : []),
                            ...c.opciones,
                        ];
                        if (c.actual && c.actual.value === texto && !opciones.some((o) => o.value === texto)) opciones.push(c.actual);
                        return (
                            <SearchableSelect
                                {...control}
                                options={opciones}
                                value={texto}
                                onValueChange={(v) => alCambiar(c.clave, v)}
                                placeholder={c.placeholder ?? 'Seleccionar…'}
                                searchPlaceholder="Buscar…"
                                triggerClassName={disparador}
                            />
                        );
                    }
                    case 'nota':
                        return (
                            <textarea
                                {...control}
                                name={c.clave}
                                value={texto}
                                rows={c.filas ?? 3}
                                placeholder={c.placeholder}
                                onChange={(e) => alCambiar(c.clave, e.target.value)}
                                className={cn(fieldClass, 'h-auto min-h-[88px] resize-y py-2')}
                            />
                        );
                    case 'libre':
                        return c.render(control);
                }
            }}
        </FormField>
    );
}
