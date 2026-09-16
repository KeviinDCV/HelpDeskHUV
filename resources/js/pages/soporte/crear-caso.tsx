import {
    AccionesFormulario,
    CampoAdjuntos,
    CampoCategoria,
    ESTADOS_CASO,
    PRIORIDADES_CASO,
    ResumenErrores,
    SelectorElementos,
    SelectorPersonas,
    Tarjeta,
    ahoraLocal,
    disparador,
    enfocar,
    erroresPorCampo,
    formularioClase,
    type CategoriaCaso,
    type ElementoCaso,
    type TipoElementoCaso,
    type UbicacionCaso,
    type UsuarioCaso,
} from '@/components/caso-formulario';
import { FormField } from '@/components/form-field';
import { GLPIFooter } from '@/components/glpi-footer';
import { GLPIHeader } from '@/components/glpi-header';
import { PageHeader } from '@/components/page-header';
import { PRIORIDAD } from '@/components/ticket-pills';
import { InputWithHistory } from '@/components/ui/input-with-history';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextareaWithHistory } from '@/components/ui/textarea-with-history';
import { useFieldHistory } from '@/hooks/use-field-history';
import { fieldClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, UserPlus, X } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

interface CreateTicketProps {
    users: UsuarioCaso[];
    locations: UbicacionCaso[];
    categories: CategoriaCaso[];
    itemTypes: TipoElementoCaso[];
    createdTicketId?: number | null;
    auth: { user: { id: number; name: string; glpi_user_id?: number | null } };
}

export default function CrearCaso({ users, locations, categories, itemTypes, createdTicketId, auth }: CreateTicketProps) {
    const { flash } = usePage<{ flash?: { success?: string | null; error?: string | null } }>().props;
    const titleHistory = useFieldHistory('crear_caso_titulo');
    const descHistory = useFieldHistory('crear_caso_descripcion');
    const resumenRef = useRef<HTMLDivElement>(null);

    const form = useForm({
        name: '',
        content: '',
        date: ahoraLocal(),
        time_to_resolve: '',
        internal_time_to_resolve: '',
        status: '1',
        priority: '3',
        locations_id: '',
        itilcategories_id: '',
        requester_id: '',
        observer_ids: [] as number[],
        assigned_ids: [] as number[],
    });
    const { data, setData, errors, processing } = form;

    const [archivos, setArchivos] = useState<File[]>([]);
    const [elementos, setElementos] = useState<ElementoCaso[]>([]);
    // Se incrementa con cada caso creado: vuelve a montar adjuntos y elementos (limpia su estado)
    const [envios, setEnvios] = useState(0);

    const [avisoCerrado, setAvisoCerrado] = useState<number | null>(null);
    const verAvisoCreado = !!createdTicketId && avisoCerrado !== createdTicketId;

    const yo = users.find((u) => (auth.user.glpi_user_id ? u.id === auth.user.glpi_user_id : u.laravel_id === auth.user.id));

    const errores = erroresPorCampo(errors as Record<string, string>);
    const errorDe = (campo: string) => errores[campo];

    // El foco va al resumen DESPUÉS de que se pinten los errores. Con requestAnimationFrame
    // a veces llegaba antes (los errores del servidor se aplican en otro turno) y no pasaba nada.
    const [pedirFoco, setPedirFoco] = useState(0);
    useEffect(() => {
        if (pedirFoco) resumenRef.current?.focus();
    }, [pedirFoco]);
    const enfocarResumen = () => setPedirFoco((n) => n + 1);

    // Al corregir un campo, su error desaparece (y sale del resumen)
    const cambiar = (campo: 'name' | 'content' | 'date', valor: string) => {
        setData(campo, valor);
        if (errors[campo]) form.clearErrors(campo);
    };

    const enviar = (e: FormEvent) => {
        e.preventDefault();

        // Lo mismo que exige el servidor, antes de subir archivos que pueden pesar decenas de MB
        const faltan: Record<string, string> = {};
        if (!data.name.trim()) faltan.name = 'Escribe un título.';
        if (!data.content.trim()) faltan.content = 'Describe el caso.';
        if (!data.date) faltan.date = 'Indica la fecha de apertura.';
        if (!data.itilcategories_id) faltan.itilcategories_id = 'Elige una categoría.';
        if (data.assigned_ids.length === 0) faltan.assigned_ids = 'Asigna al menos una persona.';
        form.clearErrors();
        if (Object.keys(faltan).length > 0) {
            form.setError(faltan as Record<keyof typeof data, string>);
            enfocarResumen();
            return;
        }

        form.transform((d) => ({
            ...d,
            items: elementos.map(({ type, id }) => ({ type, id })),
            attachments: archivos,
        }));
        form.post('/soporte/casos', {
            forceFormData: true,
            // Sin esto la página se volvía a montar y se perdía todo lo escrito, también
            // cuando el servidor fallaba (el aviso de error ni siquiera se mostraba).
            preserveState: true,
            onSuccess: (page) => {
                // Un fallo del servidor también vuelve como redirect (con flash.error): solo se
                // limpia si de verdad se creó el caso.
                if (!(page.props as { createdTicketId?: number | null }).createdTicketId) return;
                titleHistory.save(data.name);
                descHistory.save(data.content);
                // La columna lateral (clasificación y personas) se conserva para registrar el
                // siguiente caso; lo propio de este (texto, adjuntos, elementos, fechas) se limpia.
                setData((d) => ({ ...d, name: '', content: '', date: ahoraLocal(), time_to_resolve: '', internal_time_to_resolve: '' }));
                setArchivos([]);
                setElementos([]);
                setEnvios((n) => n + 1);
            },
            onError: enfocarResumen,
        });
    };

    return (
        <>
            <Head title="HelpDesk HUV - Crear caso" />
            <div className="flex min-h-screen flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Inicio
                            </Link>
                            <span className="text-gray-400">/</span>
                            <Link href="/soporte/casos" className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Soporte
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Crear caso</span>
                        </div>
                    }
                />

                <main className="flex-1">
                    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 pt-6 sm:px-6">
                        <PageHeader title="Crear caso" description="Los campos sin la marca «Opcional» son obligatorios." />

                        {verAvisoCreado && (
                            <div role="status" className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3 ring-1 ring-inset ring-green-600/20">
                                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-700" aria-hidden="true" />
                                <div className="min-w-0 flex-1 text-sm text-green-800">
                                    <p>
                                        <strong className="font-semibold">{flash?.success || `Caso #${createdTicketId} creado.`}</strong>{' '}
                                        <Link href={`/soporte/casos/${createdTicketId}`} className="font-semibold text-green-800 underline underline-offset-2 hover:no-underline">
                                            Ver el caso
                                        </Link>
                                    </p>
                                    <p className="mt-0.5 text-green-700">Se conservaron la clasificación y las personas para registrar el siguiente.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAvisoCerrado(createdTicketId ?? null);
                                        enfocar('name');
                                    }}
                                    aria-label="Cerrar aviso"
                                    className="focus-ring shrink-0 rounded text-green-800 hover:text-green-900"
                                >
                                    <X className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                        )}
                        {!createdTicketId && flash?.success && (
                            <p role="status" className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 ring-1 ring-inset ring-green-600/20">
                                <CheckCircle2 className="size-5 shrink-0 text-green-700" aria-hidden="true" />
                                {flash.success}
                            </p>
                        )}
                        {flash?.error && (
                            <p role="alert" className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-inset ring-red-600/20">
                                <AlertTriangle className="size-5 shrink-0 text-red-700" aria-hidden="true" />
                                {flash.error}
                            </p>
                        )}

                        <form noValidate onSubmit={enviar} className={formularioClase}>
                            <ResumenErrores ref={resumenRef} errores={errores} accion="crear el caso" />

                            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                                {/* Columna principal: qué pasa */}
                                <div className="min-w-0 space-y-5">
                                    <Tarjeta titulo="Caso">
                                        <FormField id="name" label="Título" error={errorDe('name')}>
                                            {(c) => (
                                                <InputWithHistory
                                                    historyKey="crear_caso_titulo"
                                                    {...c}
                                                    name="name"
                                                    autoComplete="off"
                                                    maxLength={255}
                                                    value={data.name}
                                                    onChange={(e) => cambiar('name', e.target.value)}
                                                    onValueAccepted={(v) => cambiar('name', v)}
                                                    placeholder="Ej.: No abre Servinte en el consultorio 4"
                                                    className={cn(fieldClass, 'shadow-none pr-9')}
                                                />
                                            )}
                                        </FormField>

                                        <FormField id="content" label="Descripción" error={errorDe('content')} hint="Qué pasa, desde cuándo y dónde. Incluye mensajes de error si los hay.">
                                            {(c) => (
                                                <TextareaWithHistory
                                                    historyKey="crear_caso_descripcion"
                                                    {...c}
                                                    name="content"
                                                    autoComplete="off"
                                                    value={data.content}
                                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => cambiar('content', e.target.value)}
                                                    onValueAccepted={(v) => cambiar('content', v)}
                                                    rows={8}
                                                    className={cn(fieldClass, 'h-auto min-h-[180px] resize-y py-2 pr-9 shadow-none')}
                                                />
                                            )}
                                        </FormField>

                                        <FormField id="attachments" label="Adjuntos" optional error={errorDe('attachments')}>
                                            {(c) => <CampoAdjuntos key={envios} control={c} archivos={archivos} onChange={setArchivos} />}
                                        </FormField>
                                    </Tarjeta>

                                    <Tarjeta titulo="Elementos asociados">
                                        <p className="-mt-3 text-sm text-gray-500">Equipos del inventario relacionados con el caso. Opcional.</p>
                                        <SelectorElementos key={envios} itemTypes={itemTypes} elementos={elementos} onChange={setElementos} />
                                    </Tarjeta>

                                    <Tarjeta titulo="Fechas">
                                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                            <FormField id="date" label="Apertura" error={errorDe('date')}>
                                                {(c) => <input {...c} type="datetime-local" name="date" value={data.date} onChange={(e) => cambiar('date', e.target.value)} className={fieldClass} />}
                                            </FormField>
                                            <FormField id="time_to_resolve" label="Tiempo de solución" optional error={errorDe('time_to_resolve')} hint="Límite para resolverlo.">
                                                {(c) => (
                                                    <input
                                                        {...c}
                                                        type="datetime-local"
                                                        name="time_to_resolve"
                                                        value={data.time_to_resolve}
                                                        min={data.date || undefined}
                                                        onChange={(e) => setData('time_to_resolve', e.target.value)}
                                                        className={fieldClass}
                                                    />
                                                )}
                                            </FormField>
                                            <FormField id="internal_time_to_resolve" label="Tiempo interno" optional error={errorDe('internal_time_to_resolve')} hint="Límite interno de Sistemas.">
                                                {(c) => (
                                                    <input
                                                        {...c}
                                                        type="datetime-local"
                                                        name="internal_time_to_resolve"
                                                        value={data.internal_time_to_resolve}
                                                        min={data.date || undefined}
                                                        onChange={(e) => setData('internal_time_to_resolve', e.target.value)}
                                                        className={fieldClass}
                                                    />
                                                )}
                                            </FormField>
                                        </div>
                                    </Tarjeta>
                                </div>

                                {/* Columna lateral: cómo se clasifica y quién lo atiende */}
                                <div className="min-w-0 space-y-5">
                                    <Tarjeta titulo="Clasificación">
                                        <FormField
                                            id="status"
                                            label="Estado"
                                            error={errorDe('status')}
                                            hint={data.status === '1' ? 'Al tener técnico asignado, el caso queda «En curso (asignado)».' : undefined}
                                        >
                                            {(c) => (
                                                <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                                    <SelectTrigger {...c} className={disparador}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ESTADOS_CASO.map(([v, l]) => (
                                                            <SelectItem key={v} value={v}>
                                                                {l}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </FormField>

                                        <FormField id="priority" label="Prioridad" error={errorDe('priority')}>
                                            {(c) => (
                                                <Select value={data.priority} onValueChange={(v) => setData('priority', v)}>
                                                    <SelectTrigger {...c} className={disparador}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PRIORIDADES_CASO.map(([v, l]) => (
                                                            <SelectItem key={v} value={v}>
                                                                <span className="flex items-center gap-2">
                                                                    <span aria-hidden="true" className={cn('size-2 rounded-full', PRIORIDAD[Number(v)].punto)} />
                                                                    {l}
                                                                </span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </FormField>

                                        <FormField id="itilcategories_id" label="Categoría" error={errorDe('itilcategories_id')}>
                                            {(c) => (
                                                <CampoCategoria
                                                    control={c}
                                                    categorias={categories}
                                                    value={data.itilcategories_id}
                                                    onChange={(v) => {
                                                        setData('itilcategories_id', v);
                                                        form.clearErrors('itilcategories_id');
                                                    }}
                                                />
                                            )}
                                        </FormField>

                                        <FormField id="locations_id" label="Localización" optional error={errorDe('locations_id')}>
                                            {(c) => (
                                                <SearchableSelect
                                                    {...c}
                                                    options={[{ value: '', label: 'Sin localización' }, ...locations.map((l) => ({ value: String(l.id), label: l.completename || l.short_name || '' }))]}
                                                    value={data.locations_id}
                                                    onValueChange={(v) => setData('locations_id', v)}
                                                    placeholder="Sin localización"
                                                    searchPlaceholder="Buscar localización…"
                                                    triggerClassName={disparador}
                                                />
                                            )}
                                        </FormField>
                                    </Tarjeta>

                                    <Tarjeta titulo="Personas">
                                        <FormField id="assigned_ids" label="Asignado a" error={errorDe('assigned_ids')}>
                                            {(c) => (
                                                <>
                                                    <SelectorPersonas
                                                        id={c.id}
                                                        control={{ 'aria-describedby': c['aria-describedby'], 'aria-invalid': c['aria-invalid'] }}
                                                        personas={users}
                                                        seleccion={data.assigned_ids}
                                                        onChange={(ids) => {
                                                            setData('assigned_ids', ids);
                                                            if (ids.length > 0) form.clearErrors('assigned_ids');
                                                        }}
                                                        placeholder="Agregar técnico…"
                                                    />
                                                    {yo && !data.assigned_ids.includes(yo.id) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setData('assigned_ids', [...data.assigned_ids, yo.id]);
                                                                form.clearErrors('assigned_ids');
                                                                enfocar('assigned_ids');
                                                            }}
                                                            className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded text-sm font-medium text-huv-ink hover:underline"
                                                        >
                                                            <UserPlus className="size-4" aria-hidden="true" />
                                                            Asignármelo
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </FormField>

                                        <FormField id="requester_id" label="Solicitante" optional error={errorDe('requester_id')} hint="Sin solicitante, el caso aparece como reporte público.">
                                            {(c) => (
                                                <SearchableSelect
                                                    {...c}
                                                    options={[{ value: '', label: 'Sin solicitante' }, ...users.map((u) => ({ value: String(u.id), label: u.name }))]}
                                                    value={data.requester_id}
                                                    onValueChange={(v) => setData('requester_id', v)}
                                                    placeholder="Sin solicitante"
                                                    searchPlaceholder="Buscar persona…"
                                                    triggerClassName={disparador}
                                                />
                                            )}
                                        </FormField>

                                        <FormField id="observer_ids" label="Observadores" optional error={errorDe('observer_ids')}>
                                            {(c) => (
                                                <SelectorPersonas
                                                    id={c.id}
                                                    control={{ 'aria-describedby': c['aria-describedby'], 'aria-invalid': c['aria-invalid'] }}
                                                    personas={users}
                                                    seleccion={data.observer_ids}
                                                    onChange={(ids) => setData('observer_ids', ids)}
                                                    placeholder="Agregar observador…"
                                                />
                                            )}
                                        </FormField>
                                    </Tarjeta>
                                </div>
                            </div>

                            <AccionesFormulario cancelarHref="/soporte/casos" enviando={processing} texto="Crear caso" textoEnviando="Creando…" />
                        </form>
                    </div>
                </main>

                <GLPIFooter />
            </div>
        </>
    );
}
