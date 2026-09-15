import { FormField } from '@/components/form-field';
import { GLPIFooter } from '@/components/glpi-footer';
import { GLPIHeader } from '@/components/glpi-header';
import { PageHeader } from '@/components/page-header';
import { PRIORIDAD } from '@/components/ticket-pills';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputWithHistory } from '@/components/ui/input-with-history';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextareaWithHistory } from '@/components/ui/textarea-with-history';
import { useFieldHistory } from '@/hooks/use-field-history';
import { csrfHeaders } from '@/lib/csrf';
import { btn, fieldClass, selectTriggerClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, FileText, Loader2, Plus, Upload, UserPlus, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';

interface User {
    id: number; // glpi_user_id
    laravel_id?: number;
    username: string;
    name: string;
    email: string;
}

interface Location {
    id: number;
    completename: string;
    short_name: string;
}

interface ItemType {
    value: string;
    label: string;
}

interface Item {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
    completename: string;
}

interface CreateTicketProps {
    users: User[];
    locations: Location[];
    categories: Category[];
    itemTypes: ItemType[];
    createdTicketId?: number | null;
    auth: { user: { id: number; name: string; glpi_user_id?: number | null } };
}

/** Las claves que devuelve Laravel, con la etiqueta que se ve en pantalla y el campo al que llevar el foco. */
const CAMPOS: Record<string, { etiqueta: string; id: string }> = {
    name: { etiqueta: 'Título', id: 'name' },
    content: { etiqueta: 'Descripción', id: 'content' },
    date: { etiqueta: 'Fecha de apertura', id: 'date' },
    status: { etiqueta: 'Estado', id: 'status' },
    priority: { etiqueta: 'Prioridad', id: 'priority' },
    locations_id: { etiqueta: 'Localización', id: 'locations_id' },
    itilcategories_id: { etiqueta: 'Categoría', id: 'itilcategories_id' },
    requester_id: { etiqueta: 'Solicitante', id: 'requester_id' },
    observer_ids: { etiqueta: 'Observadores', id: 'observer_ids' },
    assigned_ids: { etiqueta: 'Asignado a', id: 'assigned_ids' },
    time_to_resolve: { etiqueta: 'Tiempo de solución', id: 'time_to_resolve' },
    internal_time_to_resolve: { etiqueta: 'Tiempo interno de solución', id: 'internal_time_to_resolve' },
    attachments: { etiqueta: 'Adjuntos', id: 'attachments' },
    items: { etiqueta: 'Elementos asociados', id: 'item_type' },
};

const ESTADOS: [string, string][] = [
    ['1', 'Nuevo'],
    ['2', 'En curso (asignado)'],
    ['3', 'En curso (planificado)'],
    ['4', 'En espera'],
    ['5', 'Resuelto'],
    ['6', 'Cerrado'],
];
const PRIORIDADES: [string, string][] = [
    ['6', 'Urgente'],
    ['5', 'Muy alta'],
    ['4', 'Alta'],
    ['3', 'Media'],
    ['2', 'Baja'],
    ['1', 'Muy baja'],
];

/** Los mismos tipos que acepta TicketController (ADJUNTOS_PERMITIDOS). */
const EXTENSIONES = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf', 'txt', 'csv', 'log', 'zip', 'rar', '7z', 'msg', 'eml', 'mp4', 'mov', 'webm'];
const MAX_BYTES = 100 * 1024 * 1024;

/** Fecha y hora local en el formato de <input type="datetime-local">. */
function ahoraLocal(): string {
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:${p(now.getMinutes())}`;
}

function tamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

// Los controles de este formulario: los de Radix y el selector con búsqueda van a la altura de los campos
const disparador = cn(selectTriggerClass, 'text-sm aria-invalid:ring-2 aria-invalid:ring-red-500');

function Tarjeta({ titulo, children, className }: { titulo: string; children: ReactNode; className?: string }) {
    const id = useId();
    return (
        <section aria-labelledby={id} className={cn('surface-card min-w-0 space-y-5 p-5 sm:p-6', className)}>
            <h2 id={id} className="text-base font-semibold text-gray-900">
                {titulo}
            </h2>
            {children}
        </section>
    );
}

function Chip({ children, onRemove, etiquetaQuitar }: { children: ReactNode; onRemove: () => void; etiquetaQuitar: string }) {
    return (
        <li className="inline-flex max-w-full items-center gap-1 rounded-lg bg-gray-100 py-1 pr-1 pl-2.5 text-sm text-gray-800 dark:bg-white/10">
            <span className="truncate">{children}</span>
            <button
                type="button"
                onClick={onRemove}
                aria-label={etiquetaQuitar}
                className="focus-ring flex size-6 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-white/10"
            >
                <X className="size-3.5" aria-hidden="true" />
            </button>
        </li>
    );
}

/** Varias personas: un selector con búsqueda para agregar y la lista de las elegidas. */
function SelectorPersonas({
    id,
    personas,
    seleccion,
    onChange,
    placeholder,
    control,
}: {
    id: string;
    personas: User[];
    seleccion: number[];
    onChange: (ids: number[]) => void;
    placeholder: string;
    control: { 'aria-describedby'?: string; 'aria-invalid'?: true };
}) {
    const nombre = (pid: number) => personas.find((p) => p.id === pid)?.name ?? `Usuario ${pid}`;
    return (
        <>
            <SearchableSelect
                id={id}
                value=""
                options={personas.filter((p) => !seleccion.includes(p.id)).map((p) => ({ value: String(p.id), label: p.name }))}
                onValueChange={(v) => v && onChange([...seleccion, Number(v)])}
                placeholder={placeholder}
                searchPlaceholder="Buscar persona…"
                triggerClassName={disparador}
                {...control}
            />
            {seleccion.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                    {seleccion.map((pid) => (
                        <Chip key={pid} onRemove={() => onChange(seleccion.filter((x) => x !== pid))} etiquetaQuitar={`Quitar a ${nombre(pid)}`}>
                            {nombre(pid)}
                        </Chip>
                    ))}
                </ul>
            )}
        </>
    );
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

    // Adjuntos
    const [archivos, setArchivos] = useState<File[]>([]);
    const [rechazados, setRechazados] = useState<string[]>([]);
    const [arrastrando, setArrastrando] = useState(false);

    // Elementos asociados
    const [tipoElemento, setTipoElemento] = useState('');
    const [disponibles, setDisponibles] = useState<Item[]>([]);
    const [cargandoElementos, setCargandoElementos] = useState(false);
    const [errorElementos, setErrorElementos] = useState<string | null>(null);
    const [elementos, setElementos] = useState<{ type: string; id: number; name: string }[]>([]);

    // Categorías: lista local para agregar nuevas sin recargar la página
    const [categoryList, setCategoryList] = useState<Category[]>(categories);
    const [modalCategoria, setModalCategoria] = useState(false);
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [padreCategoria, setPadreCategoria] = useState('');
    const [creandoCategoria, setCreandoCategoria] = useState(false);
    const [errorCategoria, setErrorCategoria] = useState('');

    const [avisoCerrado, setAvisoCerrado] = useState<number | null>(null);
    const verAvisoCreado = !!createdTicketId && avisoCerrado !== createdTicketId;

    const yo = users.find((u) => (auth.user.glpi_user_id ? u.id === auth.user.glpi_user_id : u.laravel_id === auth.user.id));

    // Errores por campo (los de Laravel llegan como "attachments.0", "assigned_ids.1"…)
    const erroresPorCampo: Record<string, string> = {};
    for (const [clave, mensaje] of Object.entries(errors as Record<string, string>)) {
        const base = clave.split('.')[0];
        erroresPorCampo[base] ??= mensaje;
    }
    const errorDe = (campo: string) => erroresPorCampo[campo];

    const agregarArchivos = (lista: FileList | null) => {
        if (!lista) return;
        const aceptados: File[] = [];
        const fuera: string[] = [];
        for (const f of Array.from(lista)) {
            const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
            if (!EXTENSIONES.includes(ext)) fuera.push(`${f.name} (tipo no permitido)`);
            else if (f.size > MAX_BYTES) fuera.push(`${f.name} (pasa de 100 MB)`);
            else aceptados.push(f);
        }
        setArchivos((prev) => [...prev, ...aceptados]);
        setRechazados(fuera);
    };

    const cambiarTipoElemento = async (tipo: string) => {
        setTipoElemento(tipo);
        setDisponibles([]);
        setErrorElementos(null);
        if (!tipo) return;
        setCargandoElementos(true);
        try {
            const r = await fetch(`/soporte/items/${tipo}`, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
            if (!r.ok) throw new Error(String(r.status));
            setDisponibles(await r.json());
        } catch {
            setErrorElementos('No se pudo cargar la lista de elementos. Inténtalo de nuevo.');
        } finally {
            setCargandoElementos(false);
        }
    };

    const agregarElemento = (id: string) => {
        const item = disponibles.find((i) => i.id === Number(id));
        if (!item || elementos.some((e) => e.type === tipoElemento && e.id === item.id)) return;
        const tipo = itemTypes.find((t) => t.value === tipoElemento)?.label ?? tipoElemento;
        setElementos((prev) => [...prev, { type: tipoElemento, id: item.id, name: `${tipo}: ${item.name}` }]);
    };

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
                setRechazados([]);
                setElementos([]);
                setTipoElemento('');
                setDisponibles([]);
            },
            onError: enfocarResumen,
        });
    };

    const crearCategoria = async () => {
        const nombre = nuevaCategoria.trim();
        if (!nombre) {
            setErrorCategoria('Escribe el nombre de la categoría.');
            return;
        }
        setCreandoCategoria(true);
        setErrorCategoria('');
        try {
            const r = await fetch('/soporte/categorias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...csrfHeaders() },
                credentials: 'same-origin',
                body: JSON.stringify({ name: nombre, parent_id: padreCategoria ? Number(padreCategoria) : null }),
            });
            // Sesión o token vencidos: recargar restaura ambos
            if (r.status === 419 || r.status === 401) {
                window.location.reload();
                return;
            }
            const resultado = await r.json();
            if (!r.ok || !resultado.success) {
                setErrorCategoria(resultado.message || 'No se pudo crear la categoría.');
                return;
            }
            const cat: Category = resultado.category;
            setCategoryList((prev) => (prev.some((c) => c.id === cat.id) ? prev : [...prev, cat].sort((a, b) => a.completename.localeCompare(b.completename))));
            setData('itilcategories_id', String(cat.id));
            form.clearErrors('itilcategories_id');
            setModalCategoria(false);
            setNuevaCategoria('');
            setPadreCategoria('');
        } catch {
            setErrorCategoria('Error de conexión al crear la categoría.');
        } finally {
            setCreandoCategoria(false);
        }
    };

    const listaErrores = Object.entries(erroresPorCampo);

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
                                    onClick={() => setAvisoCerrado(createdTicketId ?? null)}
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

                        <form noValidate onSubmit={enviar}>
                            {/* Resumen de errores: cada uno lleva al campo */}
                            {listaErrores.length > 0 && (
                                <div
                                    ref={resumenRef}
                                    role="alert"
                                    tabIndex={-1}
                                    className="mb-5 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-inset ring-red-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                                >
                                    <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
                                        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                                        No se pudo crear el caso. Revisa {listaErrores.length === 1 ? 'este campo' : 'estos campos'}:
                                    </p>
                                    <ul className="mt-1.5 space-y-0.5 pl-6 text-sm text-red-700">
                                        {listaErrores.map(([campo, mensaje]) => (
                                            <li key={campo}>
                                                <a
                                                    href={`#${CAMPOS[campo]?.id ?? campo}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        document.getElementById(CAMPOS[campo]?.id ?? campo)?.focus();
                                                    }}
                                                    className="text-red-700 underline underline-offset-2 hover:text-red-900"
                                                >
                                                    <span className="font-medium">{CAMPOS[campo]?.etiqueta ?? campo}:</span> {mensaje}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

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
                                            {(c) => (
                                                <div>
                                                    <div
                                                        onDragOver={(e) => {
                                                            e.preventDefault();
                                                            setArrastrando(true);
                                                        }}
                                                        onDragLeave={() => setArrastrando(false)}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            setArrastrando(false);
                                                            agregarArchivos(e.dataTransfer.files);
                                                        }}
                                                        className={cn(
                                                            // Contorno punteado con outline: los bordes los aplana app.css en modo claro.
                                                            // Con el teclado en el campo de archivo, el contorno se vuelve sólido.
                                                            'flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-5 text-center outline-2 -outline-offset-2 outline-dashed transition-colors has-[input:focus-visible]:outline-solid has-[input:focus-visible]:outline-[var(--huv-ink)]',
                                                            arrastrando ? 'bg-huv-soft outline-huv' : 'outline-gray-300 dark:outline-white/20',
                                                        )}
                                                    >
                                                        <Upload className="size-5 text-gray-400" aria-hidden="true" />
                                                        <input
                                                            {...c}
                                                            type="file"
                                                            multiple
                                                            accept={EXTENSIONES.map((x) => `.${x}`).join(',')}
                                                            onChange={(e) => {
                                                                agregarArchivos(e.target.files);
                                                                e.target.value = '';
                                                            }}
                                                            className="sr-only"
                                                        />
                                                        <p className="text-sm text-gray-600">
                                                            Arrastra archivos aquí o{' '}
                                                            <label
                                                                htmlFor={c.id}
                                                                className="cursor-pointer font-medium text-huv-ink underline underline-offset-2"
                                                            >
                                                                elige archivos
                                                            </label>
                                                        </p>
                                                        <p className="text-xs text-gray-500">Imágenes, PDF, Office, texto, comprimidos o video · hasta 100 MB cada uno</p>
                                                    </div>
                                                    {rechazados.length > 0 && (
                                                        <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-red-600">
                                                            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                                            No se agregaron: {rechazados.join(', ')}.
                                                        </p>
                                                    )}
                                                    {archivos.length > 0 && (
                                                        <ul className="mt-3 divide-y rounded-xl ring-1 ring-inset ring-gray-200 dark:ring-white/10">
                                                            {archivos.map((f, i) => (
                                                                <li key={`${f.name}-${f.size}-${i}`} className="flex items-center gap-3 px-3 py-2">
                                                                    <FileText className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
                                                                    <span className="min-w-0 flex-1 truncate text-sm text-gray-800" title={f.name}>
                                                                        {f.name}
                                                                    </span>
                                                                    <span className="shrink-0 text-xs tabular-nums text-gray-500">{tamano(f.size)}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setArchivos((prev) => prev.filter((_, j) => j !== i))}
                                                                        aria-label={`Quitar ${f.name}`}
                                                                        className="focus-ring flex size-7 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-700"
                                                                    >
                                                                        <X className="size-4" aria-hidden="true" />
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            )}
                                        </FormField>
                                    </Tarjeta>

                                    <Tarjeta titulo="Elementos asociados">
                                        <p className="-mt-3 text-sm text-gray-500">Equipos del inventario relacionados con el caso. Opcional.</p>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label htmlFor="item_type" className="text-sm font-medium text-gray-700">
                                                    Tipo
                                                </label>
                                                <Select value={tipoElemento} onValueChange={cambiarTipoElemento}>
                                                    <SelectTrigger id="item_type" className={cn(disparador, 'mt-1.5')}>
                                                        <SelectValue placeholder="Elige un tipo…" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {itemTypes.map((t) => (
                                                            <SelectItem key={t.value} value={t.value}>
                                                                {t.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label htmlFor="item_id" className="text-sm font-medium text-gray-700">
                                                    Elemento
                                                </label>
                                                <SearchableSelect
                                                    id="item_id"
                                                    value=""
                                                    options={disponibles
                                                        .filter((i) => !elementos.some((e) => e.type === tipoElemento && e.id === i.id))
                                                        .map((i) => ({ value: String(i.id), label: i.name }))}
                                                    onValueChange={agregarElemento}
                                                    placeholder={tipoElemento ? 'Buscar y agregar…' : 'Primero elige el tipo'}
                                                    searchPlaceholder="Nombre del elemento…"
                                                    disabled={!tipoElemento}
                                                    loading={cargandoElementos}
                                                    className="mt-1.5"
                                                    triggerClassName={disparador}
                                                />
                                            </div>
                                        </div>
                                        {errorElementos && (
                                            <p role="alert" className="flex items-start gap-1.5 text-sm text-red-600">
                                                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                                {errorElementos}
                                            </p>
                                        )}
                                        {elementos.length > 0 && (
                                            <ul className="flex flex-wrap gap-1.5" aria-label="Elementos agregados">
                                                {elementos.map((el) => (
                                                    <Chip
                                                        key={`${el.type}-${el.id}`}
                                                        onRemove={() => setElementos((prev) => prev.filter((x) => !(x.type === el.type && x.id === el.id)))}
                                                        etiquetaQuitar={`Quitar ${el.name}`}
                                                    >
                                                        {el.name}
                                                    </Chip>
                                                ))}
                                            </ul>
                                        )}
                                    </Tarjeta>
                                    <Tarjeta titulo="Fechas">
                                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                            <FormField id="date" label="Apertura" error={errorDe('date')}>
                                                {(c) => (
                                                    <input
                                                        {...c}
                                                        type="datetime-local"
                                                        name="date"
                                                        value={data.date}
                                                        onChange={(e) => cambiar('date', e.target.value)}
                                                        className={fieldClass}
                                                    />
                                                )}
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
                                                        {ESTADOS.map(([v, l]) => (
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
                                                        {PRIORIDADES.map(([v, l]) => (
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
                                                <div className="flex gap-2">
                                                    <SearchableSelect
                                                        {...c}
                                                        options={categoryList.map((cat) => ({ value: String(cat.id), label: cat.completename }))}
                                                        value={data.itilcategories_id}
                                                        onValueChange={(v) => {
                                                            setData('itilcategories_id', v);
                                                            form.clearErrors('itilcategories_id');
                                                        }}
                                                        placeholder="Elige una categoría…"
                                                        searchPlaceholder="Buscar categoría…"
                                                        className="min-w-0 flex-1"
                                                        triggerClassName={disparador}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setErrorCategoria('');
                                                            setModalCategoria(true);
                                                        }}
                                                        title="Crear una categoría nueva"
                                                        aria-label="Crear una categoría nueva"
                                                        className={cn(btn.secondary, 'size-10 shrink-0 px-0')}
                                                    >
                                                        <Plus aria-hidden="true" />
                                                    </button>
                                                </div>
                                            )}
                                        </FormField>

                                        <FormField id="locations_id" label="Localización" optional error={errorDe('locations_id')}>
                                            {(c) => (
                                                <SearchableSelect
                                                    {...c}
                                                    options={[
                                                        { value: '', label: 'Sin localización' },
                                                        ...locations.map((l) => ({ value: String(l.id), label: l.completename || l.short_name })),
                                                    ]}
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

                                        <FormField
                                            id="requester_id"
                                            label="Solicitante"
                                            optional
                                            error={errorDe('requester_id')}
                                            hint="Sin solicitante, el caso aparece como reporte público."
                                        >
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

                            {/* Acciones: fijas abajo mientras se llena el formulario */}
                            <div className="sticky bottom-0 z-10 -mx-4 mt-5 border-t bg-[#f9fafb]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:bg-[#09090b]/95">
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <Link href="/soporte/casos" className={btn.secondary}>
                                        Cancelar
                                    </Link>
                                    <button type="submit" disabled={processing} className={btn.primary}>
                                        {processing && <Loader2 className="animate-spin" aria-hidden="true" />}
                                        {processing ? 'Creando…' : 'Crear caso'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </main>

                <GLPIFooter />
            </div>

            {/* Crear una categoría sin salir del formulario */}
            <Dialog
                open={modalCategoria}
                onOpenChange={(abierto) => {
                    if (creandoCategoria) return;
                    setModalCategoria(abierto);
                    if (!abierto) setErrorCategoria('');
                }}
            >
                <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[480px]">
                    <DialogHeader className="border-b px-6 py-4 pr-12 text-left">
                        <DialogTitle className="text-lg font-semibold text-gray-900">Crear categoría</DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">Queda disponible de inmediato y se elige en este caso.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 px-6 py-5">
                        <FormField id="new_category_name" label="Nombre" error={errorCategoria || undefined}>
                            {(c) => (
                                <input
                                    {...c}
                                    autoComplete="off"
                                    value={nuevaCategoria}
                                    onChange={(e) => setNuevaCategoria(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            crearCategoria();
                                        }
                                    }}
                                    placeholder="Ej.: Página web de citas"
                                    className={fieldClass}
                                    autoFocus
                                />
                            )}
                        </FormField>
                        <FormField id="new_category_parent" label="Categoría padre" optional hint="Si eliges una, la nueva queda dentro de ella.">
                            {(c) => (
                                <SearchableSelect
                                    {...c}
                                    options={[{ value: '', label: 'Ninguna (categoría principal)' }, ...categoryList.map((cat) => ({ value: String(cat.id), label: cat.completename }))]}
                                    value={padreCategoria}
                                    onValueChange={setPadreCategoria}
                                    placeholder="Ninguna (categoría principal)"
                                    searchPlaceholder="Buscar categoría…"
                                    triggerClassName={disparador}
                                />
                            )}
                        </FormField>
                    </div>
                    <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-3">
                        <button type="button" onClick={() => setModalCategoria(false)} disabled={creandoCategoria} className={btn.secondary}>
                            Cancelar
                        </button>
                        <button type="button" onClick={crearCategoria} disabled={creandoCategoria} className={btn.primary}>
                            {creandoCategoria && <Loader2 className="animate-spin" aria-hidden="true" />}
                            {creandoCategoria ? 'Creando…' : 'Crear categoría'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
