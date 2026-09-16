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
    disparador,
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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { htmlToText, tieneMarcado } from '@/lib/strip-html';
import { parseFecha } from '@/lib/ticket-format';
import { btn, fieldClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Download, Eye, FileText } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';

interface Ticket {
    id: number;
    name: string;
    content: string;
    date: string;
    time_to_resolve: string | null;
    internal_time_to_resolve: string | null;
    status: number;
    priority: number;
    locations_id: number;
    itilcategories_id: number;
    location_name?: string | null;
    category_name?: string | null;
}

interface TicketUser {
    id: number;
    tickets_id: number;
    users_id: number;
    type: number;
    fullname?: string | null;
    alternative_email?: string | null;
}

interface TicketItem {
    id: number;
    tickets_id: number;
    itemtype: string;
    items_id: number;
    item_name?: string | null;
    /** false: el equipo ya no está en la base; null: no se pudo comprobar */
    item_exists?: boolean | null;
}

interface Attachment {
    name: string;
    url: string;
    size: number;
}

interface Solution {
    id: number;
    content: string;
    date_creation: string;
    users_id: number;
    solved_by: string | null;
}

interface EditTicketProps {
    ticket: Ticket;
    ticketUsers: TicketUser[];
    ticketItems: TicketItem[];
    users: UsuarioCaso[];
    locations: UbicacionCaso[];
    categories: CategoriaCaso[];
    itemTypes: TipoElementoCaso[];
    attachments: Attachment[];
    solution: Solution | null;
}

/**
 * Fecha de la base ("2026-09-15 07:12:45") al formato del campo ("2026-09-15T07:12"), tal cual.
 * Antes pasaba por toISOString(), que la convierte a UTC: en Colombia el campo mostraba 5 horas
 * más, y cada guardado corría la apertura y los plazos otras 5 horas.
 */
const aCampoFecha = (valor: string | null) => (valor ? valor.replace(' ', 'T').slice(0, 16) : '');

function fechaLegible(valor: string) {
    const d = parseFecha(valor);
    return Number.isNaN(d.getTime()) ? valor : d.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function tamano(bytes: number): string | null {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export default function EditarCaso({ ticket, ticketUsers, ticketItems, users, locations, categories, itemTypes, attachments = [], solution }: EditTicketProps) {
    const { flash } = usePage<{ flash?: { error?: string | null } }>().props;
    const resumenRef = useRef<HTMLDivElement>(null);

    // Personas actuales del caso, y sus nombres aunque no estén entre los usuarios activos.
    // Un externo que GLPI guarda solo con su correo tiene users_id 0: también cuenta (antes se
    // tomaba como "sin solicitante" y al guardar se borraba). Los nombres van por tipo: un
    // solicitante externo y un observador externo tienen el mismo id 0 y correos distintos.
    const filasDe = (tipo: number) => ticketUsers.filter((tu) => tu.type === tipo);
    const nombresDe = (tipo: number) => {
        const nombres: Record<number, string> = {};
        const sinUsuario = filasDe(tipo).filter((tu) => tu.users_id === 0);
        const externos = sinUsuario.filter((tu) => tu.alternative_email).map((tu) => tu.alternative_email);
        for (const tu of filasDe(tipo)) if (tu.fullname) nombres[tu.users_id] = tu.fullname;
        if (sinUsuario.length > 0) nombres[0] = externos.length > 0 ? `${externos.join(', ')} (externo)` : 'Externo sin correo';
        return nombres;
    };
    const idsDe = (tipo: number) => [...new Set(filasDe(tipo).map((tu) => tu.users_id))];
    const solicitantes = filasDe(1);
    const filaSolicitante = solicitantes[0];
    const nombresSolicitante = nombresDe(1);
    const nombreSolicitante = (tu: TicketUser) => (tu.users_id === 0 ? (nombresSolicitante[0] ?? 'Externo sin correo') : (tu.fullname ?? `Usuario de GLPI #${tu.users_id}`));
    const otrosSolicitantes = solicitantes.slice(1).filter((tu) => tu.users_id !== filaSolicitante?.users_id);

    // Lo que el formulario cargó: el servidor aplica solo lo que se cambie respecto de esto, así
    // no deshace lo que otro técnico haga en el caso mientras esta página sigue abierta.
    const [original] = useState(() =>
        JSON.stringify({
            name: ticket.name,
            content: ticket.content,
            date: ticket.date,
            time_to_resolve: ticket.time_to_resolve,
            internal_time_to_resolve: ticket.internal_time_to_resolve,
            status: ticket.status,
            priority: ticket.priority,
            locations_id: ticket.locations_id,
            itilcategories_id: ticket.itilcategories_id,
            requester_ids: idsDe(1),
            observer_ids: idsDe(3),
            assigned_ids: idsDe(2),
            items: ticketItems.map((ti) => ({ type: ti.itemtype, id: ti.items_id })),
        }),
    );

    // Descripción legible; si no se toca, se guarda la original byte a byte (con su HTML)
    const contenidoHtml = tieneMarcado(ticket.content);
    const [contenidoInicial] = useState(() => (contenidoHtml ? htmlToText(ticket.content) : ticket.content || ''));

    const form = useForm({
        name: ticket.name || '',
        content: contenidoInicial,
        date: aCampoFecha(ticket.date),
        time_to_resolve: aCampoFecha(ticket.time_to_resolve),
        internal_time_to_resolve: aCampoFecha(ticket.internal_time_to_resolve),
        status: ticket.status ? String(ticket.status) : '1',
        priority: ticket.priority ? String(ticket.priority) : '3',
        locations_id: ticket.locations_id ? String(ticket.locations_id) : '',
        itilcategories_id: ticket.itilcategories_id ? String(ticket.itilcategories_id) : '',
        requester_id: filaSolicitante ? String(filaSolicitante.users_id) : '',
        observer_ids: idsDe(3),
        assigned_ids: idsDe(2),
    });
    const { data, setData, errors, processing } = form;

    const [archivos, setArchivos] = useState<File[]>([]);
    const [elementos, setElementos] = useState<ElementoCaso[]>(() =>
        ticketItems.map((ti) => {
            const tipo = itemTypes.find((t) => t.value === ti.itemtype)?.label ?? ti.itemtype;
            // Sin nombre no quiere decir que no exista: el servidor dice si el equipo sigue en la base
            const sinNombre = ti.item_exists === false ? '(ya no existe)' : '(sin nombre)';
            return { type: ti.itemtype, id: ti.items_id, name: ti.item_name ? `${tipo}: ${ti.item_name}` : `${tipo} #${ti.items_id} ${sinNombre}` };
        }),
    );

    const errores = erroresPorCampo(errors as Record<string, string>);
    const errorDe = (campo: string) => errores[campo];

    // El foco va al resumen después de que se pinten los errores
    const [pedirFoco, setPedirFoco] = useState(0);
    useEffect(() => {
        if (pedirFoco) resumenRef.current?.focus();
    }, [pedirFoco]);
    const enfocarResumen = () => setPedirFoco((n) => n + 1);

    const cambiar = (campo: 'name' | 'content' | 'date', valor: string) => {
        setData(campo, valor);
        if (errors[campo]) form.clearErrors(campo);
    };

    const enviar = (e: FormEvent) => {
        e.preventDefault();

        // Lo mismo que exige el servidor (update): título, descripción y fecha de apertura
        const faltan: Record<string, string> = {};
        if (!data.name.trim()) faltan.name = 'Escribe un título.';
        // Una descripción de GLPI que solo trae imágenes o formato se ve vacía aquí: sin tocarla,
        // se guarda tal como está (no se exige escribir algo que la reemplazaría)
        const soloMarcado = contenidoHtml && !!ticket.content?.trim() && data.content === contenidoInicial;
        if (!data.content.trim() && !soloMarcado) faltan.content = 'Describe el caso.';
        if (!data.date) faltan.date = 'Indica la fecha de apertura.';
        form.clearErrors();
        if (Object.keys(faltan).length > 0) {
            form.setError(faltan as Record<keyof typeof data, string>);
            enfocarResumen();
            return;
        }

        // Lo que no se tocó viaja tal como está en la base: la fecha con sus segundos y la
        // descripción con su formato de GLPI. Así guardar no cambia nada que no se haya editado.
        const fechaSinTocar = (campo: string | null, valor: string) => (valor === aCampoFecha(campo) ? campo || '' : valor);
        form.transform((d) => ({
            ...d,
            date: fechaSinTocar(ticket.date, d.date),
            time_to_resolve: fechaSinTocar(ticket.time_to_resolve, d.time_to_resolve),
            internal_time_to_resolve: fechaSinTocar(ticket.internal_time_to_resolve, d.internal_time_to_resolve),
            content: d.content === contenidoInicial ? ticket.content : d.content,
            requester_id: d.requester_id || null,
            items: elementos.map(({ type, id }) => ({ type, id })),
            attachments: archivos,
            original,
            _method: 'PUT', // PUT con archivos: se envía como POST
        }));
        form.post(`/soporte/casos/${ticket.id}`, {
            forceFormData: true,
            // Si el servidor rechaza algo, se queda todo lo escrito y se ve el error
            preserveState: true,
            onError: enfocarResumen,
        });
    };

    // Opciones actuales que podrían no estar en las listas (localización duplicada, persona inactiva)
    const opcionesLocalizacion = [{ value: '', label: 'Sin localización' }, ...locations.map((l) => ({ value: String(l.id), label: l.completename || l.short_name || l.name || '' }))];
    if (data.locations_id && !opcionesLocalizacion.some((o) => o.value === data.locations_id)) {
        opcionesLocalizacion.splice(1, 0, { value: data.locations_id, label: ticket.location_name || `Localización #${data.locations_id}` });
    }
    const opcionesSolicitante = [{ value: '', label: 'Sin solicitante' }, ...users.map((u) => ({ value: String(u.id), label: u.name }))];
    if (data.requester_id && !opcionesSolicitante.some((o) => o.value === data.requester_id)) {
        opcionesSolicitante.splice(1, 0, { value: data.requester_id, label: nombresSolicitante[Number(data.requester_id)] ?? (data.requester_id === '0' ? 'Solicitante externo' : `Usuario de GLPI #${data.requester_id}`) });
    }

    return (
        <>
            <Head title={`HelpDesk HUV - Editar caso #${ticket.id}`} />
            <div className="flex min-h-screen flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Inicio
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">Soporte</span>
                            <span className="text-gray-400">/</span>
                            <Link href="/soporte/casos" className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Casos
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Editar #{ticket.id}</span>
                        </div>
                    }
                />

                <main className="flex-1">
                    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 pt-6 sm:px-6">
                        <PageHeader
                            title={`Editar caso #${ticket.id}`}
                            description="Los campos sin la marca «Opcional» son obligatorios."
                            actions={
                                <Link href={`/soporte/casos/${ticket.id}`} className={btn.secondary}>
                                    <Eye aria-hidden="true" />
                                    Ver caso
                                </Link>
                            }
                        />

                        {flash?.error && (
                            <p role="alert" className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-inset ring-red-600/20">
                                <AlertTriangle className="size-5 shrink-0 text-red-700" aria-hidden="true" />
                                {flash.error}
                            </p>
                        )}

                        <form noValidate onSubmit={enviar} className={formularioClase}>
                            <ResumenErrores ref={resumenRef} errores={errores} accion="guardar los cambios" />

                            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                                <div className="min-w-0 space-y-5">
                                    <Tarjeta titulo="Caso">
                                        <FormField id="name" label="Título" error={errorDe('name')}>
                                            {(c) => (
                                                <input
                                                    {...c}
                                                    name="name"
                                                    autoComplete="off"
                                                    maxLength={255}
                                                    value={data.name}
                                                    onChange={(e) => cambiar('name', e.target.value)}
                                                    className={fieldClass}
                                                />
                                            )}
                                        </FormField>

                                        <FormField
                                            id="content"
                                            label="Descripción"
                                            error={errorDe('content')}
                                            hint={
                                                !contenidoHtml
                                                    ? undefined
                                                    : contenidoInicial.trim()
                                                      ? 'Viene de GLPI con formato. Si no la cambias, se guarda tal como está; si la editas, se guarda como texto sin formato (sin enlaces ni imágenes).'
                                                      : 'La descripción de GLPI solo tiene imágenes o formato y aquí no se puede mostrar (sí en Ver caso). Si no escribes nada, se conserva tal como está.'
                                            }
                                        >
                                            {(c) => (
                                                <textarea
                                                    {...c}
                                                    name="content"
                                                    autoComplete="off"
                                                    value={data.content}
                                                    onChange={(e) => cambiar('content', e.target.value)}
                                                    rows={8}
                                                    className={cn(fieldClass, 'h-auto min-h-[180px] resize-y py-2')}
                                                />
                                            )}
                                        </FormField>

                                        {attachments.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Adjuntos del caso ({attachments.length})</p>
                                                <ul className="mt-1.5 divide-y rounded-xl ring-1 ring-inset ring-gray-200 dark:ring-white/10">
                                                    {attachments.map((a, i) => (
                                                        <li key={`${a.url}-${i}`}>
                                                            <a
                                                                href={a.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="focus-ring flex items-center gap-3 px-3 py-2 text-gray-800 transition-colors hover:bg-gray-50"
                                                            >
                                                                <FileText className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
                                                                <span className="min-w-0 flex-1 truncate text-sm" title={a.name}>
                                                                    {a.name}
                                                                </span>
                                                                {tamano(a.size) && <span className="shrink-0 text-xs tabular-nums text-gray-500">{tamano(a.size)}</span>}
                                                                <Download className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
                                                                <span className="sr-only">(se abre en una pestaña nueva)</span>
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <FormField id="attachments" label="Agregar adjuntos" optional error={errorDe('attachments')}>
                                            {(c) => <CampoAdjuntos control={c} archivos={archivos} onChange={setArchivos} />}
                                        </FormField>
                                    </Tarjeta>

                                    {/* La solución no se edita aquí: se muestra para tener el contexto */}
                                    {solution && (
                                        <section aria-labelledby="solucion-titulo" className="surface-card min-w-0 p-5 sm:p-6">
                                            <h2 id="solucion-titulo" className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                                <CheckCircle2 className="size-5 text-green-700" aria-hidden="true" />
                                                Solución del caso
                                            </h2>
                                            <p className="mt-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-gray-800">{htmlToText(solution.content)}</p>
                                            <p className="mt-4 flex flex-wrap gap-x-2 gap-y-1 border-t pt-3 text-sm text-gray-500">
                                                <span>
                                                    Resuelto por <span className="font-medium text-gray-900">{solution.solved_by || 'Usuario del sistema'}</span>
                                                </span>
                                                {solution.date_creation && (
                                                    <>
                                                        <span aria-hidden="true">·</span>
                                                        <span>{fechaLegible(solution.date_creation)}</span>
                                                    </>
                                                )}
                                            </p>
                                        </section>
                                    )}

                                    <Tarjeta titulo="Elementos asociados">
                                        <p className="-mt-3 text-sm text-gray-500">Equipos del inventario relacionados con el caso. Opcional.</p>
                                        <SelectorElementos itemTypes={itemTypes} elementos={elementos} onChange={setElementos} />
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
                                                        onChange={(e) => setData('internal_time_to_resolve', e.target.value)}
                                                        className={fieldClass}
                                                    />
                                                )}
                                            </FormField>
                                        </div>
                                    </Tarjeta>
                                </div>

                                <div className="min-w-0 space-y-5">
                                    <Tarjeta titulo="Clasificación">
                                        <FormField id="status" label="Estado" error={errorDe('status')}>
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

                                        {/* En la edición no se exige (el servidor tampoco): hay casos antiguos sin categoría */}
                                        <FormField id="itilcategories_id" label="Categoría" optional error={errorDe('itilcategories_id')}>
                                            {(c) => (
                                                <CampoCategoria
                                                    control={c}
                                                    categorias={categories}
                                                    value={data.itilcategories_id}
                                                    onChange={(v) => setData('itilcategories_id', v)}
                                                    actual={
                                                        ticket.itilcategories_id
                                                            ? { value: String(ticket.itilcategories_id), label: ticket.category_name || `Categoría #${ticket.itilcategories_id}` }
                                                            : undefined
                                                    }
                                                />
                                            )}
                                        </FormField>

                                        <FormField id="locations_id" label="Localización" optional error={errorDe('locations_id')}>
                                            {(c) => (
                                                <SearchableSelect
                                                    {...c}
                                                    options={opcionesLocalizacion}
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
                                        <FormField
                                            id="assigned_ids"
                                            label="Asignado a"
                                            optional
                                            error={errorDe('assigned_ids')}
                                            hint={data.assigned_ids.length === 0 ? 'Sin asignados, el caso queda «Sin asignar».' : undefined}
                                        >
                                            {(c) => (
                                                <SelectorPersonas
                                                    id={c.id}
                                                    control={{ 'aria-describedby': c['aria-describedby'], 'aria-invalid': c['aria-invalid'] }}
                                                    personas={users}
                                                    seleccion={data.assigned_ids}
                                                    onChange={(ids) => setData('assigned_ids', ids)}
                                                    placeholder="Agregar técnico…"
                                                    nombresConocidos={nombresDe(2)}
                                                />
                                            )}
                                        </FormField>

                                        <FormField
                                            id="requester_id"
                                            label="Solicitante"
                                            optional
                                            error={errorDe('requester_id')}
                                            hint={
                                                otrosSolicitantes.length > 0
                                                    ? `El caso tiene además a ${otrosSolicitantes.map(nombreSolicitante).join(', ')}: se conservan si no cambias el solicitante.`
                                                    : 'Sin solicitante, el caso aparece como reporte público.'
                                            }
                                        >
                                            {(c) => (
                                                <SearchableSelect
                                                    {...c}
                                                    options={opcionesSolicitante}
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
                                                    nombresConocidos={nombresDe(3)}
                                                />
                                            )}
                                        </FormField>
                                    </Tarjeta>
                                </div>
                            </div>

                            <AccionesFormulario cancelarHref="/soporte/casos" enviando={processing} texto="Guardar cambios" textoEnviando="Guardando…" />
                        </form>
                    </div>
                </main>

                <GLPIFooter />
            </div>
        </>
    );
}
