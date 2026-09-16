/**
 * Lo que se edita dentro de Editar computador además de sus datos: sistemas operativos,
 * volúmenes, antivirus e información financiera. Mismas claves y rutas que ya usaba la página
 * (ComputerController::storeOS, updateVolume…); ahora los errores se ven y borrar pide confirmación
 * con el diálogo de la app.
 */
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FichaSeccion } from '@/components/ficha';
import { ResumenErrores, erroresPorCampo } from '@/components/formulario';
import { Campo, type CampoInventario, type Valor } from '@/components/inventario-formulario';
import type { DropdownOption } from '@/components/select-with-create';
import { btn } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
    COLUMNAS_ANTIVIRUS,
    DatosInfoFinanciera,
    DatosSistemaOperativo,
    DatosVolumen,
    FilaAntivirus,
    TablaDatos,
    Vacio,
    type Antivirus,
    type InfoFinanciera,
    type SistemaOperativo,
    type Volumen,
} from './secciones';

type Datos = Record<string, string>;

interface Grupo {
    titulo?: string;
    campos: CampoInventario[];
}

/** Formulario compacto dentro de una pestaña, con su resumen de errores y sus botones. */
function SubFormulario({
    titulo,
    grupos,
    form,
    onGuardar,
    onCancelar,
}: {
    titulo: string;
    grupos: Grupo[];
    form: ReturnType<typeof useForm<Datos>>;
    onGuardar: () => void;
    /** Sin él no hay «Cancelar» (la información financiera nueva no tenía a dónde volver) */
    onCancelar?: () => void;
}) {
    const resumen = useRef<HTMLDivElement>(null);
    const recienEnviado = useRef(false);
    const porCampo = erroresPorCampo(form.errors);
    const etiquetas = Object.fromEntries(grupos.flatMap((g) => g.campos.map((c) => [c.clave, c.etiqueta])));

    useEffect(() => {
        if (recienEnviado.current && Object.keys(form.errors).length > 0) {
            resumen.current?.focus();
            recienEnviado.current = false;
        }
    }, [form.errors]);

    const alCambiar = (clave: string, valor: unknown) => {
        form.setData(clave, String(valor ?? ''));
        if (form.errors[clave]) form.clearErrors(clave);
    };

    const enviar = (e: FormEvent) => {
        e.preventDefault();
        recienEnviado.current = true;
        form.clearErrors();
        onGuardar();
    };

    return (
        <form noValidate onSubmit={enviar} className="rounded-xl bg-[#f9fafb] p-4 ring-1 ring-inset ring-gray-200 sm:p-5 dark:bg-white/[0.03] dark:ring-white/10">
            <h3 className="text-sm font-semibold text-gray-900">{titulo}</h3>
            <div className="mt-3 empty:hidden">
                <ResumenErrores ref={resumen} errores={porCampo} etiquetas={etiquetas} accion="guardar" />
            </div>
            <div className="mt-4 space-y-5">
                {grupos.map((g, i) => (
                    <div key={g.titulo ?? i}>
                        {g.titulo && <p className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">{g.titulo}</p>}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {g.campos.map((c) => (
                                <div key={c.clave} className={cn('min-w-0', c.ancho && 'sm:col-span-2 lg:col-span-3')}>
                                    <Campo campo={c} valor={form.data[c.clave] as Valor} error={porCampo[c.clave]} alCambiar={alCambiar} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
                {onCancelar && (
                    <button type="button" onClick={onCancelar} disabled={form.processing} className={btn.secondary}>
                        Cancelar
                    </button>
                )}
                <button type="submit" disabled={form.processing} className={btn.primary}>
                    {form.processing && <Loader2 className="animate-spin" aria-hidden="true" />}
                    {form.processing ? 'Guardando…' : 'Guardar'}
                </button>
            </div>
        </form>
    );
}

/** Botones de editar y eliminar de un registro, con nombre para el lector de pantalla. */
function AccionesRegistro({ nombre, onEditar, onEliminar, deshabilitado }: { nombre: string; onEditar: () => void; onEliminar: () => void; deshabilitado?: boolean }) {
    return (
        <span className="inline-flex gap-1">
            <button type="button" onClick={onEditar} disabled={deshabilitado} aria-label={`Editar ${nombre}`} title="Editar" className={cn(btn.ghost, 'size-9 px-0')}>
                <Pencil aria-hidden="true" />
            </button>
            <button
                type="button"
                onClick={onEliminar}
                disabled={deshabilitado}
                aria-label={`Eliminar ${nombre}`}
                title="Eliminar"
                className={cn(btn.ghost, 'size-9 px-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10')}
            >
                <Trash2 aria-hidden="true" />
            </button>
        </span>
    );
}

/**
 * Estado común de una lista con alta, edición en línea y borrado. Tras guardar, el servidor vuelve
 * a esta pestaña (?tab=…) con los datos nuevos; si hay errores, el formulario sigue abierto.
 */
function useListaEditable(vacios: Datos, rutaBase: string) {
    const form = useForm<Datos>(vacios);
    const [editando, setEditando] = useState<number | 'nuevo' | null>(null);
    const [aEliminar, setAEliminar] = useState<{ id: number; nombre: string } | null>(null);
    const [eliminando, setEliminando] = useState(false);

    const abrir = (id: number | 'nuevo', datos: Datos) => {
        form.clearErrors();
        form.setDefaults(datos);
        form.setData(datos);
        setEditando(id);
    };
    const cerrar = () => {
        form.clearErrors();
        setEditando(null);
    };
    const guardar = (transformar?: (d: Datos) => Datos) => {
        form.transform((d) => (transformar ? transformar(d) : d));
        const opciones = { preserveScroll: true, preserveState: 'errors' as const, onSuccess: () => setEditando(null) };
        if (editando === 'nuevo') form.post(rutaBase, opciones);
        else if (editando !== null) form.put(`${rutaBase}/${editando}`, opciones);
    };
    const eliminar = () => {
        if (!aEliminar) return;
        router.delete(`${rutaBase}/${aEliminar.id}`, {
            preserveScroll: true,
            onStart: () => setEliminando(true),
            onFinish: () => {
                setEliminando(false);
                setAEliminar(null);
            },
        });
    };
    return { form, editando, abrir, cerrar, guardar, aEliminar, setAEliminar, eliminar, eliminando };
}

function BotonAgregar({ onClick, oculto }: { onClick: () => void; oculto: boolean }) {
    if (oculto) return null;
    return (
        <button type="button" onClick={onClick} className={btn.secondary}>
            <Plus aria-hidden="true" />
            Agregar
        </button>
    );
}

const catalogo = (clave: string, etiqueta: string, opciones: DropdownOption[], dropdownType: string, createLabel: string, placeholder?: string): CampoInventario => ({
    tipo: 'catalogo',
    clave,
    etiqueta,
    opciones,
    dropdownType,
    createLabel,
    placeholder,
    ninguno: true,
});

/** Una fecha que llega con hora ("2026-09-15 00:00:00") en un campo de solo fecha. */
const aCampoFecha = (v: string | null | undefined) => (v ? v.slice(0, 10) : '');
/** Si la fecha no se tocó, se envía tal como estaba (con su hora): guardar no la altera. */
const fechaSinTocar = (original: string | null | undefined, valor: string) => (original && valor === aCampoFecha(original) ? original : valor);

// ── Sistemas operativos ────────────────────────────────────────────────────────────────────

export interface SistemaOperativoEditable extends SistemaOperativo {
    id: number;
    operatingsystems_id: number | null;
    operatingsystemversions_id: number | null;
    operatingsystemarchitectures_id: number | null;
    operatingsystemservicepacks_id: number | null;
    operatingsystemkernelversions_id: number | null;
    operatingsystemeditions_id: number | null;
}

export interface CatalogosSO {
    osList: DropdownOption[];
    osVersions: DropdownOption[];
    osArchitectures: DropdownOption[];
    osServicePacks: DropdownOption[];
    osKernelVersions: DropdownOption[];
    osEditions: DropdownOption[];
}

const SO_VACIO: Datos = {
    operatingsystems_id: '0',
    operatingsystemversions_id: '0',
    operatingsystemarchitectures_id: '0',
    operatingsystemservicepacks_id: '0',
    operatingsystemkernelversions_id: '0',
    operatingsystemeditions_id: '0',
    license_number: '',
    licenseid: '',
};

const idTexto = (v: number | null | undefined) => (v ? String(v) : '0');

export function EditorSistemasOperativos({ computerId, items, catalogos: c }: { computerId: number; items: SistemaOperativoEditable[]; catalogos: CatalogosSO }) {
    const l = useListaEditable(SO_VACIO, `/inventario/computadores/${computerId}/os`);
    const grupos: Grupo[] = [
        {
            campos: [
                catalogo('operatingsystems_id', 'Nombre', c.osList, 'operatingsystems', 'Nuevo sistema operativo', 'Seleccionar OS...'),
                catalogo('operatingsystemversions_id', 'Versión', c.osVersions, 'operatingsystemversions', 'Nueva versión'),
                catalogo('operatingsystemarchitectures_id', 'Arquitectura', c.osArchitectures, 'operatingsystemarchitectures', 'Nueva arquitectura'),
                catalogo('operatingsystemservicepacks_id', 'Paquete de servicio', c.osServicePacks, 'operatingsystemservicepacks', 'Nuevo paquete de servicio'),
                catalogo('operatingsystemkernelversions_id', 'Núcleo', c.osKernelVersions, 'operatingsystemkernelversions', 'Nuevo núcleo'),
                catalogo('operatingsystemeditions_id', 'Edición', c.osEditions, 'operatingsystemeditions', 'Nueva edición'),
                { tipo: 'texto', clave: 'license_number', etiqueta: 'Número de serie', maxLength: 255 },
                { tipo: 'texto', clave: 'licenseid', etiqueta: 'ID del producto', maxLength: 255 },
            ],
        },
    ];
    const formulario = (titulo: string) => <SubFormulario titulo={titulo} grupos={grupos} form={l.form} onGuardar={() => l.guardar()} onCancelar={l.cerrar} />;

    return (
        <FichaSeccion titulo="Sistemas operativos" contador={items.length} acciones={<BotonAgregar oculto={l.editando !== null} onClick={() => l.abrir('nuevo', SO_VACIO)} />}>
            <div className="space-y-3">
                {l.editando === 'nuevo' && formulario('Nuevo sistema operativo')}
                {items.length === 0 && l.editando !== 'nuevo' && <Vacio>No hay sistemas operativos registrados</Vacio>}
                {items.map((so) =>
                    l.editando === so.id ? (
                        <div key={so.id}>{formulario(`Editar ${so.os_name || 'sistema operativo'}`)}</div>
                    ) : (
                        <div key={so.id} className="rounded-xl p-4 ring-1 ring-inset ring-gray-200 dark:ring-white/10">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <p className="font-medium text-gray-900">{so.os_name || 'Sistema operativo desconocido'}</p>
                                <AccionesRegistro
                                    nombre={so.os_name || 'sistema operativo'}
                                    deshabilitado={l.editando !== null}
                                    onEditar={() =>
                                        l.abrir(so.id, {
                                            operatingsystems_id: idTexto(so.operatingsystems_id),
                                            operatingsystemversions_id: idTexto(so.operatingsystemversions_id),
                                            operatingsystemarchitectures_id: idTexto(so.operatingsystemarchitectures_id),
                                            operatingsystemservicepacks_id: idTexto(so.operatingsystemservicepacks_id),
                                            operatingsystemkernelversions_id: idTexto(so.operatingsystemkernelversions_id),
                                            operatingsystemeditions_id: idTexto(so.operatingsystemeditions_id),
                                            license_number: so.license_number || '',
                                            licenseid: so.license_id || '',
                                        })
                                    }
                                    onEliminar={() => l.setAEliminar({ id: so.id, nombre: so.os_name || 'este sistema operativo' })}
                                />
                            </div>
                            <DatosSistemaOperativo so={so} />
                        </div>
                    ),
                )}
            </div>
            <ConfirmarEliminar lista={l} que="el sistema operativo" />
        </FichaSeccion>
    );
}

function ConfirmarEliminar({ lista: l, que }: { lista: ReturnType<typeof useListaEditable>; que: string }) {
    return (
        <ConfirmDialog
            open={l.aEliminar !== null}
            onOpenChange={(abierto) => !abierto && !l.eliminando && l.setAEliminar(null)}
            title={`¿Eliminar ${que}?`}
            description={
                <>
                    Se quitará <span className="font-medium text-gray-900">{l.aEliminar?.nombre}</span> de este computador.
                </>
            }
            confirmLabel="Eliminar"
            onConfirm={l.eliminar}
            processing={l.eliminando}
        />
    );
}

// ── Volúmenes ──────────────────────────────────────────────────────────────────────────────

export interface VolumenEditable extends Volumen {
    id: number;
    filesystems_id: number | null;
}

const VOLUMEN_VACIO: Datos = { name: '', mountpoint: '', device: '', filesystems_id: '0', totalsize: '', freesize: '' };

export function EditorVolumenes({ computerId, items, filesystems }: { computerId: number; items: VolumenEditable[]; filesystems: DropdownOption[] }) {
    const l = useListaEditable(VOLUMEN_VACIO, `/inventario/computadores/${computerId}/volumenes`);
    const grupos: Grupo[] = [
        {
            campos: [
                { tipo: 'texto', clave: 'name', etiqueta: 'Nombre', maxLength: 255 },
                { tipo: 'texto', clave: 'device', etiqueta: 'Partición', maxLength: 255 },
                { tipo: 'texto', clave: 'mountpoint', etiqueta: 'Punto de montaje', maxLength: 255 },
                catalogo('filesystems_id', 'Sistema de archivos', filesystems, 'filesystems', 'Nuevo sistema de archivos'),
                { tipo: 'numero', clave: 'totalsize', etiqueta: 'Tamaño global (MB)', min: 0, step: 1 },
                { tipo: 'numero', clave: 'freesize', etiqueta: 'Espacio libre (MB)', min: 0, step: 1 },
            ],
        },
    ];
    const formulario = (titulo: string) => <SubFormulario titulo={titulo} grupos={grupos} form={l.form} onGuardar={() => l.guardar()} onCancelar={l.cerrar} />;

    return (
        <FichaSeccion titulo="Volúmenes" contador={items.length} acciones={<BotonAgregar oculto={l.editando !== null} onClick={() => l.abrir('nuevo', VOLUMEN_VACIO)} />}>
            <div className="space-y-3">
                {l.editando === 'nuevo' && formulario('Nuevo volumen')}
                {items.length === 0 && l.editando !== 'nuevo' && <Vacio>No hay volúmenes registrados</Vacio>}
                {items.map((v) =>
                    l.editando === v.id ? (
                        <div key={v.id}>{formulario(`Editar ${v.name || v.mountpoint || 'volumen'}`)}</div>
                    ) : (
                        <div key={v.id} className="rounded-xl p-4 ring-1 ring-inset ring-gray-200 dark:ring-white/10">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <p className="font-medium text-gray-900">{v.name || v.mountpoint || 'Volumen'}</p>
                                <AccionesRegistro
                                    nombre={v.name || v.mountpoint || 'volumen'}
                                    deshabilitado={l.editando !== null}
                                    onEditar={() =>
                                        l.abrir(v.id, {
                                            name: v.name || '',
                                            mountpoint: v.mountpoint || '',
                                            device: v.device || '',
                                            filesystems_id: idTexto(v.filesystems_id),
                                            totalsize: v.totalsize?.toString() || '',
                                            freesize: v.freesize?.toString() || '',
                                        })
                                    }
                                    onEliminar={() => l.setAEliminar({ id: v.id, nombre: v.name || v.mountpoint || 'este volumen' })}
                                />
                            </div>
                            <DatosVolumen v={v} />
                        </div>
                    ),
                )}
            </div>
            <ConfirmarEliminar lista={l} que="el volumen" />
        </FichaSeccion>
    );
}

// ── Antivirus ──────────────────────────────────────────────────────────────────────────────

const ANTIVIRUS_VACIO: Datos = { name: '', manufacturers_id: '0', antivirus_version: '', signature_version: '', is_active: '1', is_uptodate: '1', date_expiration: '' };
const SI_NO = [
    { value: '1', label: 'Sí' },
    { value: '0', label: 'No' },
];

export function EditorAntivirus({ computerId, items, fabricantes }: { computerId: number; items: Antivirus[]; fabricantes: DropdownOption[] }) {
    const l = useListaEditable(ANTIVIRUS_VACIO, `/inventario/computadores/${computerId}/antivirus`);
    const [original, setOriginal] = useState<string | null>(null);
    const grupos: Grupo[] = [
        {
            campos: [
                { tipo: 'texto', clave: 'name', etiqueta: 'Nombre', maxLength: 255 },
                catalogo('manufacturers_id', 'Fabricante', fabricantes, 'manufacturers', 'Nuevo fabricante'),
                { tipo: 'texto', clave: 'antivirus_version', etiqueta: 'Versión del antivirus', maxLength: 255 },
                { tipo: 'texto', clave: 'signature_version', etiqueta: 'Versión de firmas', maxLength: 255 },
                { tipo: 'lista', clave: 'is_active', etiqueta: 'Activo', opciones: SI_NO },
                { tipo: 'lista', clave: 'is_uptodate', etiqueta: 'Actualizado', opciones: SI_NO },
                { tipo: 'fecha', clave: 'date_expiration', etiqueta: 'Fecha de expiración' },
            ],
        },
    ];
    const guardar = () => l.guardar((d) => ({ ...d, date_expiration: fechaSinTocar(original, d.date_expiration) }));
    const formulario = (titulo: string) => <SubFormulario titulo={titulo} grupos={grupos} form={l.form} onGuardar={guardar} onCancelar={l.cerrar} />;
    const acciones = (a: Antivirus) => (
        <AccionesRegistro
            nombre={a.name || 'antivirus'}
            deshabilitado={l.editando !== null}
            onEditar={() => {
                setOriginal(a.date_expiration ?? null);
                l.abrir(a.id, {
                    name: a.name || '',
                    manufacturers_id: idTexto(a.manufacturers_id),
                    antivirus_version: a.antivirus_version || '',
                    signature_version: a.signature_version || '',
                    is_active: a.is_active?.toString() || '0',
                    is_uptodate: a.is_uptodate?.toString() || '0',
                    date_expiration: aCampoFecha(a.date_expiration),
                });
            }}
            onEliminar={() => l.setAEliminar({ id: a.id, nombre: a.name || 'este antivirus' })}
        />
    );

    return (
        <FichaSeccion
            titulo="Antivirus"
            contador={items.length}
            acciones={
                <BotonAgregar
                    oculto={l.editando !== null}
                    onClick={() => {
                        setOriginal(null);
                        l.abrir('nuevo', ANTIVIRUS_VACIO);
                    }}
                />
            }
        >
            <div className="space-y-3">
                {l.editando === 'nuevo' && formulario('Nuevo antivirus')}
                {typeof l.editando === 'number' && formulario(`Editar ${items.find((a) => a.id === l.editando)?.name || 'antivirus'}`)}
                {items.length === 0 && l.editando !== 'nuevo' ? (
                    <Vacio>No hay antivirus registrados</Vacio>
                ) : (
                    items.length > 0 && (
                        <TablaDatos columnas={[...COLUMNAS_ANTIVIRUS, { titulo: 'Acciones', derecha: true }]}>
                            {items.map((a) => (
                                <FilaAntivirus key={a.id} a={a} acciones={acciones(a)} />
                            ))}
                        </TablaDatos>
                    )
                )}
            </div>
            <ConfirmarEliminar lista={l} que="el antivirus" />
        </FichaSeccion>
    );
}

// ── Información financiera ─────────────────────────────────────────────────────────────────

const CLAVES_INFO = [
    'buy_date',
    'use_date',
    'warranty_date',
    'warranty_duration',
    'warranty_info',
    'order_number',
    'delivery_number',
    'immo_number',
    'value',
    'warranty_value',
    'order_date',
    'delivery_date',
    'inventory_date',
    'decommission_date',
    'comment',
    'bill',
] as const;
const FECHAS_INFO = ['buy_date', 'use_date', 'warranty_date', 'order_date', 'delivery_date', 'inventory_date', 'decommission_date'] as const;

function valoresInfo(info: InfoFinanciera | null): Datos {
    const d: Datos = {};
    for (const clave of CLAVES_INFO) {
        const v = (info as Record<string, unknown> | null)?.[clave];
        d[clave] = v === null || v === undefined ? '' : (FECHAS_INFO as readonly string[]).includes(clave) ? aCampoFecha(String(v)) : String(v);
    }
    return d;
}

export function EditorInfoFinanciera({ computerId, info }: { computerId: number; info: (InfoFinanciera & { id: number }) | null }) {
    const form = useForm<Datos>(valoresInfo(info));
    const [editando, setEditando] = useState(false);

    const grupos: Grupo[] = [
        {
            titulo: 'Fechas',
            campos: [
                { tipo: 'fecha', clave: 'buy_date', etiqueta: 'Fecha de compra' },
                { tipo: 'fecha', clave: 'use_date', etiqueta: 'Fecha de puesta en uso' },
                { tipo: 'fecha', clave: 'order_date', etiqueta: 'Fecha de pedido' },
                { tipo: 'fecha', clave: 'delivery_date', etiqueta: 'Fecha de entrega' },
                { tipo: 'fecha', clave: 'inventory_date', etiqueta: 'Fecha de inventario' },
                { tipo: 'fecha', clave: 'decommission_date', etiqueta: 'Fecha de baja' },
            ],
        },
        {
            titulo: 'Garantía',
            campos: [
                { tipo: 'fecha', clave: 'warranty_date', etiqueta: 'Inicio de garantía' },
                { tipo: 'numero', clave: 'warranty_duration', etiqueta: 'Duración (meses)', min: 0, step: 1 },
                { tipo: 'texto', clave: 'warranty_info', etiqueta: 'Información de garantía', maxLength: 255 },
            ],
        },
        {
            titulo: 'Valores',
            campos: [
                { tipo: 'numero', clave: 'value', etiqueta: 'Valor', min: 0, step: 0.01 },
                { tipo: 'numero', clave: 'warranty_value', etiqueta: 'Valor de la garantía', min: 0, step: 0.01 },
            ],
        },
        {
            titulo: 'Números y referencias',
            campos: [
                { tipo: 'texto', clave: 'order_number', etiqueta: 'Nº de pedido', maxLength: 255 },
                { tipo: 'texto', clave: 'delivery_number', etiqueta: 'Nº de entrega', maxLength: 255 },
                { tipo: 'texto', clave: 'immo_number', etiqueta: 'Nº de inmovilización', maxLength: 255 },
                { tipo: 'texto', clave: 'bill', etiqueta: 'Factura', maxLength: 255 },
            ],
        },
        { titulo: 'Comentarios', campos: [{ tipo: 'nota', clave: 'comment', etiqueta: 'Comentarios', filas: 3, ancho: true }] },
    ];

    const guardar = () => {
        // Las fechas que no se tocaron viajan como estaban (algunas columnas guardan también la hora)
        form.transform((d) => {
            const salida = { ...d };
            for (const f of FECHAS_INFO) salida[f] = fechaSinTocar((info as Record<string, string | null> | null)?.[f], d[f]);
            return salida;
        });
        const opciones = { preserveScroll: true, preserveState: 'errors' as const, onSuccess: () => setEditando(false) };
        if (info?.id) form.put(`/inventario/computadores/${computerId}/infocom/${info.id}`, opciones);
        else form.post(`/inventario/computadores/${computerId}/infocom`, opciones);
    };

    const abrir = () => {
        form.clearErrors();
        form.setData(valoresInfo(info));
        setEditando(true);
    };

    let contenido: ReactNode;
    if (editando) {
        contenido = <SubFormulario titulo={info ? 'Editar información financiera' : 'Nueva información financiera'} grupos={grupos} form={form} onGuardar={guardar} onCancelar={() => setEditando(false)} />;
    } else if (info) {
        contenido = <DatosInfoFinanciera info={info} />;
    } else {
        contenido = <Vacio>No hay información financiera registrada</Vacio>;
    }

    return (
        <FichaSeccion
            titulo="Información financiera y administrativa"
            acciones={
                !editando && (
                    <button type="button" onClick={abrir} className={btn.secondary}>
                        {info ? <Pencil aria-hidden="true" /> : <Plus aria-hidden="true" />}
                        {info ? 'Editar' : 'Agregar'}
                    </button>
                )
            }
        >
            {contenido}
        </FichaSeccion>
    );
}
