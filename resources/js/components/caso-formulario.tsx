/**
 * Piezas del formulario de un caso, iguales en Crear caso y Editar caso: si se cambia una, cambia
 * en las dos páginas. Cada una conserva los mismos campos y valores que envía el servidor
 * (TicketController::store / update); aquí solo vive cómo se ven y cómo se usan.
 */
import { FormField } from '@/components/form-field';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { csrfHeaders } from '@/lib/csrf';
import { btn, fieldClass, selectTriggerClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { AlertTriangle, FileText, Loader2, Plus, Upload, X } from 'lucide-react';
import { useId, useRef, useState, type ReactNode, type Ref } from 'react';

export interface UsuarioCaso {
    id: number; // glpi_user_id
    laravel_id?: number;
    username?: string;
    name: string;
    email?: string;
}

export interface UbicacionCaso {
    id: number;
    completename: string;
    short_name?: string;
    name?: string;
}

export interface TipoElementoCaso {
    value: string;
    label: string;
}

export interface CategoriaCaso {
    id: number;
    name: string;
    completename: string;
}

export interface ElementoCaso {
    type: string;
    id: number;
    name: string;
}

/** Las claves que devuelve Laravel, con la etiqueta que se ve en pantalla y el campo al que llevar el foco. */
export const CAMPOS_CASO: Record<string, { etiqueta: string; id: string }> = {
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

export const ESTADOS_CASO: [string, string][] = [
    ['1', 'Nuevo'],
    ['2', 'En curso (asignado)'],
    ['3', 'En curso (planificado)'],
    ['4', 'En espera'],
    ['5', 'Resuelto'],
    ['6', 'Cerrado'],
];

export const PRIORIDADES_CASO: [string, string][] = [
    ['6', 'Urgente'],
    ['5', 'Muy alta'],
    ['4', 'Alta'],
    ['3', 'Media'],
    ['2', 'Baja'],
    ['1', 'Muy baja'],
];

/** Los mismos tipos que acepta TicketController (ADJUNTOS_PERMITIDOS); ahí se valida por extensión. */
export const EXTENSIONES_ADJUNTOS = ['jpg', 'jpeg', 'jpe', 'jfif', 'png', 'gif', 'webp', 'bmp', 'heic', 'heif', 'tif', 'tiff', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf', 'txt', 'csv', 'log', 'zip', 'rar', '7z', 'msg', 'eml', 'mp4', 'mov', 'webm'];
const MAX_BYTES_ADJUNTO = 100 * 1024 * 1024;

/** Fecha y hora local en el formato de <input type="datetime-local">. */
export function ahoraLocal(): string {
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:${p(now.getMinutes())}`;
}

/** Lleva el foco a un control por id. Al quitar un chip o un archivo, el botón pulsado deja de
 *  existir y el foco caía en <body>: quien usa teclado perdía su sitio en el formulario. */
export const enfocar = (id: string) => document.getElementById(id)?.focus();

export function tamanoArchivo(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** Radix Select y el selector con búsqueda, a la altura de los campos y con el rojo de error. */
export const disparador = cn(selectTriggerClass, 'text-sm aria-invalid:ring-2 aria-invalid:ring-red-500');

/** Errores de Laravel por campo: "attachments.0" y "assigned_ids.1" se agrupan en su campo. */
export function erroresPorCampo(errors: Record<string, string | undefined>): Record<string, string> {
    const porCampo: Record<string, string> = {};
    for (const [clave, mensaje] of Object.entries(errors)) {
        if (!mensaje) continue;
        porCampo[clave.split('.')[0]] ??= mensaje;
    }
    return porCampo;
}

export function Tarjeta({ titulo, children, className }: { titulo: string; children: ReactNode; className?: string }) {
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

export function Chip({ children, onRemove, etiquetaQuitar }: { children: ReactNode; onRemove: () => void; etiquetaQuitar: string }) {
    return (
        // bg-[#f3f4f6] y no bg-gray-100: app.css pinta bg-gray-100 casi negro en modo oscuro
        <li className="inline-flex max-w-full items-center gap-1 rounded-lg bg-[#f3f4f6] py-1 pr-1 pl-2.5 text-sm text-gray-800 dark:bg-white/10">
            <span className="truncate">{children}</span>
            <button
                type="button"
                onClick={onRemove}
                aria-label={etiquetaQuitar}
                className="focus-ring flex size-6 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-[#e5e7eb] hover:text-gray-900 dark:hover:bg-white/15"
            >
                <X className="size-3.5" aria-hidden="true" />
            </button>
        </li>
    );
}

/** Resumen de errores al principio del formulario: cada uno lleva al campo. */
export function ResumenErrores({ errores, accion, ref }: { errores: Record<string, string>; accion: string; ref?: Ref<HTMLDivElement> }) {
    const lista = Object.entries(errores);
    if (lista.length === 0) return null;
    return (
        <div
            ref={ref}
            role="alert"
            tabIndex={-1}
            className="mb-5 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-inset ring-red-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
        >
            <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                No se pudo {accion}. Revisa {lista.length === 1 ? 'este campo' : 'estos campos'}:
            </p>
            <ul className="mt-1.5 space-y-0.5 pl-6 text-sm text-red-700">
                {lista.map(([campo, mensaje]) => (
                    <li key={campo}>
                        <a
                            href={`#${CAMPOS_CASO[campo]?.id ?? campo}`}
                            onClick={(e) => {
                                e.preventDefault();
                                enfocar(CAMPOS_CASO[campo]?.id ?? campo);
                            }}
                            className="text-red-700 underline underline-offset-2 hover:text-red-900"
                        >
                            <span className="font-medium">{CAMPOS_CASO[campo]?.etiqueta ?? campo}:</span> {mensaje}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * Varias personas: un selector con búsqueda para agregar y la lista de las elegidas.
 * `nombresConocidos`: nombres de personas que ya están en el caso pero no en la lista de
 * usuarios activos (un técnico de GLPI, alguien inactivo). Siguen en el caso y se ven.
 */
export function SelectorPersonas({
    id,
    personas,
    seleccion,
    onChange,
    placeholder,
    control,
    nombresConocidos = {},
}: {
    id: string;
    personas: UsuarioCaso[];
    seleccion: number[];
    onChange: (ids: number[]) => void;
    placeholder: string;
    control: { 'aria-describedby'?: string; 'aria-invalid'?: true };
    nombresConocidos?: Record<number, string>;
}) {
    const nombre = (pid: number) => personas.find((p) => p.id === pid)?.name ?? nombresConocidos[pid] ?? `Usuario de GLPI #${pid}`;
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
                        <Chip
                            key={pid}
                            onRemove={() => {
                                onChange(seleccion.filter((x) => x !== pid));
                                enfocar(id);
                            }}
                            etiquetaQuitar={`Quitar a ${nombre(pid)}`}
                        >
                            {nombre(pid)}
                        </Chip>
                    ))}
                </ul>
            )}
        </>
    );
}

/** Adjuntos nuevos: arrastrar o elegir, con los mismos tipos y tamaño que acepta el servidor. */
export function CampoAdjuntos({
    archivos,
    onChange,
    control,
}: {
    archivos: File[];
    onChange: (archivos: File[]) => void;
    control: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true };
}) {
    const [rechazados, setRechazados] = useState<string[]>([]);
    const [arrastrando, setArrastrando] = useState(false);

    const agregar = (lista: FileList | null) => {
        if (!lista) return;
        const aceptados: File[] = [];
        const fuera: string[] = [];
        for (const f of Array.from(lista)) {
            const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
            if (!EXTENSIONES_ADJUNTOS.includes(ext)) fuera.push(`${f.name} (tipo no permitido)`);
            else if (f.size > MAX_BYTES_ADJUNTO) fuera.push(`${f.name} (pasa de 100 MB)`);
            else aceptados.push(f);
        }
        onChange([...archivos, ...aceptados]);
        setRechazados(fuera);
    };

    return (
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
                    agregar(e.dataTransfer.files);
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
                    {...control}
                    type="file"
                    multiple
                    accept={EXTENSIONES_ADJUNTOS.map((x) => `.${x}`).join(',')}
                    onChange={(e) => {
                        agregar(e.target.files);
                        e.target.value = '';
                    }}
                    className="sr-only"
                />
                <p className="text-sm text-gray-600">
                    Arrastra archivos aquí o{' '}
                    <label htmlFor={control.id} className="cursor-pointer font-medium text-huv-ink underline underline-offset-2">
                        elige archivos
                    </label>
                </p>
                <p className="text-xs text-gray-500">Imágenes, PDF, Office, texto, comprimidos o video · hasta 100 MB cada uno</p>
            </div>
            {rechazados.length > 0 && (
                <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-red-600">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 [overflow-wrap:anywhere]">No se agregaron: {rechazados.join(', ')}.</span>
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
                            <span className="shrink-0 text-xs tabular-nums text-gray-500">{tamanoArchivo(f.size)}</span>
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(archivos.filter((_, j) => j !== i));
                                    enfocar(control.id);
                                }}
                                aria-label={`Quitar ${f.name}`}
                                className="focus-ring flex size-7 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/15"
                            >
                                <X className="size-4" aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/** Elementos del inventario asociados al caso: tipo, buscar y agregar; cada uno como chip. */
export function SelectorElementos({
    itemTypes,
    elementos,
    onChange,
}: {
    itemTypes: TipoElementoCaso[];
    elementos: ElementoCaso[];
    onChange: (elementos: ElementoCaso[]) => void;
}) {
    const [tipo, setTipo] = useState('');
    const [disponibles, setDisponibles] = useState<{ id: number; name: string }[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cambiarTipo = async (nuevo: string) => {
        setTipo(nuevo);
        setDisponibles([]);
        setError(null);
        if (!nuevo) return;
        setCargando(true);
        try {
            const r = await fetch(`/soporte/items/${nuevo}`, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
            if (!r.ok) throw new Error(String(r.status));
            setDisponibles(await r.json());
        } catch {
            setError('No se pudo cargar la lista de elementos. Inténtalo de nuevo.');
        } finally {
            setCargando(false);
        }
    };

    const agregar = (id: string) => {
        const item = disponibles.find((i) => i.id === Number(id));
        if (!item || elementos.some((e) => e.type === tipo && e.id === item.id)) return;
        const etiqueta = itemTypes.find((t) => t.value === tipo)?.label ?? tipo;
        onChange([...elementos, { type: tipo, id: item.id, name: `${etiqueta}: ${item.name}` }]);
    };

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="item_type" className="text-sm font-medium text-gray-700">
                        Tipo
                    </label>
                    <Select value={tipo} onValueChange={cambiarTipo}>
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
                        options={disponibles.filter((i) => !elementos.some((e) => e.type === tipo && e.id === i.id)).map((i) => ({ value: String(i.id), label: i.name }))}
                        onValueChange={agregar}
                        placeholder={tipo ? 'Buscar y agregar…' : 'Primero elige el tipo'}
                        searchPlaceholder="Nombre del elemento…"
                        disabled={!tipo}
                        loading={cargando}
                        className="mt-1.5"
                        triggerClassName={disparador}
                    />
                </div>
            </div>
            {error && (
                <p role="alert" className="flex items-start gap-1.5 text-sm text-red-600">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {error}
                </p>
            )}
            {elementos.length > 0 && (
                <ul className="flex flex-wrap gap-1.5" aria-label="Elementos agregados">
                    {elementos.map((el) => (
                        <Chip
                            key={`${el.type}-${el.id}`}
                            onRemove={() => {
                                onChange(elementos.filter((x) => !(x.type === el.type && x.id === el.id)));
                                enfocar(tipo ? 'item_id' : 'item_type');
                            }}
                            etiquetaQuitar={`Quitar ${el.name}`}
                        >
                            {el.name}
                        </Chip>
                    ))}
                </ul>
            )}
        </>
    );
}

/**
 * Categoría con el botón "+" para crear una nueva sin salir del formulario. La lista vive aquí
 * para que la categoría recién creada aparezca y quede elegida.
 */
export function CampoCategoria({
    categorias,
    value,
    onChange,
    control,
    actual,
}: {
    categorias: CategoriaCaso[];
    value: string;
    onChange: (id: string) => void;
    control: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true };
    /** La categoría que ya tiene el caso (Editar), por si no está en la lista */
    actual?: { value: string; label: string };
}) {
    const [lista, setLista] = useState<CategoriaCaso[]>(categorias);
    const [abierto, setAbierto] = useState(false);
    const [nombre, setNombre] = useState('');
    const [padre, setPadre] = useState('');
    const [creando, setCreando] = useState(false);
    const [error, setError] = useState('');
    const creada = useRef(false);

    const crear = async () => {
        const limpio = nombre.trim();
        if (!limpio) {
            setError('Escribe el nombre de la categoría.');
            return;
        }
        setCreando(true);
        setError('');
        try {
            const r = await fetch('/soporte/categorias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...csrfHeaders() },
                credentials: 'same-origin',
                body: JSON.stringify({ name: limpio, parent_id: padre ? Number(padre) : null }),
            });
            // Sesión o token vencidos: recargar restaura ambos
            if (r.status === 419 || r.status === 401) {
                window.location.reload();
                return;
            }
            const resultado = await r.json();
            if (!r.ok || !resultado.success) {
                setError(resultado.message || 'No se pudo crear la categoría.');
                return;
            }
            const cat: CategoriaCaso = resultado.category;
            setLista((prev) => (prev.some((c) => c.id === cat.id) ? prev : [...prev, cat].sort((a, b) => a.completename.localeCompare(b.completename))));
            onChange(String(cat.id));
            creada.current = true;
            setAbierto(false);
            setNombre('');
            setPadre('');
        } catch {
            setError('Error de conexión al crear la categoría.');
        } finally {
            setCreando(false);
        }
    };

    // Si la categoría actual del caso no está en la lista (no es de incidentes, o es un
    // duplicado), se muestra igual con su nombre: el caso la conserva mientras no se cambie.
    const opciones = lista.map((cat) => ({ value: String(cat.id), label: cat.completename }));
    if (actual && actual.value && !opciones.some((o) => o.value === actual.value)) opciones.unshift(actual);

    return (
        <>
            <div className="flex gap-2">
                <SearchableSelect
                    {...control}
                    options={opciones}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Elige una categoría…"
                    searchPlaceholder="Buscar categoría…"
                    className="min-w-0 flex-1"
                    triggerClassName={disparador}
                />
                <button
                    type="button"
                    onClick={() => {
                        setError('');
                        setAbierto(true);
                    }}
                    id="boton-nueva-categoria"
                    title="Crear una categoría nueva"
                    aria-label="Crear una categoría nueva"
                    className={cn(btn.secondary, 'size-10 shrink-0 px-0')}
                >
                    <Plus aria-hidden="true" />
                </button>
            </div>

            <Dialog
                open={abierto}
                onOpenChange={(a) => {
                    if (creando) return;
                    setAbierto(a);
                    if (!a) setError('');
                }}
            >
                <DialogContent
                    className="gap-0 rounded-2xl p-0 sm:max-w-[480px]"
                    // Al cerrar, el foco vuelve al botón "+"; si se creó la categoría, al selector que ya la muestra
                    onCloseAutoFocus={(e) => {
                        e.preventDefault();
                        enfocar(creada.current ? control.id : 'boton-nueva-categoria');
                        creada.current = false;
                    }}
                >
                    <DialogHeader className="border-b px-6 py-4 pr-12 text-left">
                        <DialogTitle className="text-lg font-semibold text-gray-900">Crear categoría</DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">Queda disponible de inmediato y se elige en este caso.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 px-6 py-5">
                        <FormField id="new_category_name" label="Nombre" error={error || undefined}>
                            {(c) => (
                                <input
                                    {...c}
                                    autoComplete="off"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            crear();
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
                                    options={[{ value: '', label: 'Ninguna (categoría principal)' }, ...lista.map((cat) => ({ value: String(cat.id), label: cat.completename }))]}
                                    value={padre}
                                    onValueChange={setPadre}
                                    placeholder="Ninguna (categoría principal)"
                                    searchPlaceholder="Buscar categoría…"
                                    triggerClassName={disparador}
                                />
                            )}
                        </FormField>
                    </div>
                    <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-3">
                        <button type="button" onClick={() => setAbierto(false)} disabled={creando} className={btn.secondary}>
                            Cancelar
                        </button>
                        <button type="button" onClick={crear} disabled={creando} className={btn.primary}>
                            {creando && <Loader2 className="animate-spin" aria-hidden="true" />}
                            {creando ? 'Creando…' : 'Crear categoría'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

/** Acciones al pie, fijas abajo mientras se llena el formulario. */
export function AccionesFormulario({ cancelarHref, enviando, texto, textoEnviando }: { cancelarHref: string; enviando: boolean; texto: string; textoEnviando: string }) {
    return (
        <div className="sticky bottom-0 z-10 -mx-4 mt-5 border-t bg-[#f9fafb]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:bg-[#09090b]/95">
            <div className="flex flex-wrap items-center justify-end gap-2">
                <Link href={cancelarHref} className={btn.secondary}>
                    Cancelar
                </Link>
                <button type="submit" disabled={enviando} className={btn.primary}>
                    {enviando && <Loader2 className="animate-spin" aria-hidden="true" />}
                    {enviando ? textoEnviando : texto}
                </button>
            </div>
        </div>
    );
}

/** Clases del <form>: al tabular, el navegador deja el campo por encima de la barra fija de acciones. */
export const formularioClase = '[&_:is(input,textarea,button)]:scroll-mb-24';
