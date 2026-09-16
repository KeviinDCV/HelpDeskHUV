/**
 * Campos de Impresoras, iguales al crear y al editar: las mismas 21 claves que PrinterController
 * lee siempre (store falla y update borra datos si falta alguna), en las secciones de siempre.
 */
import { Chip } from '@/components/caso-formulario';
import type { ControlCampo, SeccionInventario } from '@/components/inventario-formulario';
import type { DropdownOption } from '@/components/select-with-create';
import { btn, fieldClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export interface OpcionesImpresora {
    states: DropdownOption[];
    manufacturers: DropdownOption[];
    types: DropdownOption[];
    models: DropdownOption[];
    locations: DropdownOption[];
    entities: DropdownOption[];
    users: DropdownOption[];
    groups: DropdownOption[];
}

const id = (v: unknown) => (v ? String(v) : '');
// Las casillas llegan como 1/0 de la base de datos
const casilla = (v: unknown) => Number(v) === 1;

export function valoresImpresora(r?: Record<string, unknown>, ips?: string[]) {
    return {
        name: String(r?.name ?? ''),
        serial: String(r?.serial ?? ''),
        otherserial: String(r?.otherserial ?? ''),
        contact: String(r?.contact ?? ''),
        contact_num: String(r?.contact_num ?? ''),
        states_id: id(r?.states_id),
        manufacturers_id: id(r?.manufacturers_id),
        printertypes_id: id(r?.printertypes_id),
        printermodels_id: id(r?.printermodels_id),
        locations_id: id(r?.locations_id),
        // La entidad 0 existe ("HUV", la raíz): se muestra y se envía "0", que el servidor guarda igual
        entities_id: r && r.entities_id !== undefined && r.entities_id !== null ? String(r.entities_id) : '',
        users_id_tech: id(r?.users_id_tech),
        groups_id_tech: id(r?.groups_id_tech),
        memory_size: String(r?.memory_size ?? ''),
        have_serial: casilla(r?.have_serial),
        have_parallel: casilla(r?.have_parallel),
        have_usb: casilla(r?.have_usb),
        have_ethernet: casilla(r?.have_ethernet),
        have_wifi: casilla(r?.have_wifi),
        comment: String(r?.comment ?? ''),
        // Una IP repetida en la base se muestra una vez: quitarla la quita (todas sus copias)
        // y dejarla la conserva, igual que ve el usuario.
        ip_addresses: [...new Set(ips ?? [])],
    };
}

export type ValoresImpresora = ReturnType<typeof valoresImpresora>;

const lista = (opciones: DropdownOption[], nombre: string) => opciones.map((o) => ({ value: String(o.id), label: o.name?.trim() || `${nombre} #${o.id}` }));

/** El técnico o grupo guardado puede no estar en la lista (usuario sin nombre, borrado…): se ve igual. */
const actual = (valor: string, nombre: string) => (valor ? { value: valor, label: `${nombre} #${valor}` } : undefined);

export function seccionesImpresora(o: OpcionesImpresora, valores: ValoresImpresora, ips: { lista: string[]; cambiar: (ips: string[]) => void }): SeccionInventario[] {
    return [
        {
            titulo: 'Información básica',
            descripcion: 'Cómo se identifica la impresora.',
            campos: [
                { tipo: 'texto', clave: 'name', etiqueta: 'Nombre', obligatorio: true, maxLength: 255, placeholder: 'Ej: IMPRESORA-HP-PISO2', ancho: true },
                { tipo: 'texto', clave: 'serial', etiqueta: 'Número de serie', maxLength: 255, placeholder: 'Ej: SN123456' },
                { tipo: 'texto', clave: 'otherserial', etiqueta: 'Nº de inventario', maxLength: 255, placeholder: 'Ej: INV-2024-001' },
            ],
        },
        {
            titulo: 'Clasificación',
            descripcion: 'Estado, tipo, fabricante y modelo. Con «+» se agrega una opción nueva al catálogo.',
            campos: [
                { tipo: 'catalogo', clave: 'states_id', etiqueta: 'Estado', opciones: o.states, dropdownType: 'states', createLabel: 'Nuevo estado' },
                { tipo: 'catalogo', clave: 'printertypes_id', etiqueta: 'Tipo', opciones: o.types, dropdownType: 'printertypes', createLabel: 'Nuevo tipo' },
                { tipo: 'catalogo', clave: 'manufacturers_id', etiqueta: 'Fabricante', opciones: o.manufacturers, dropdownType: 'manufacturers', createLabel: 'Nuevo fabricante' },
                { tipo: 'catalogo', clave: 'printermodels_id', etiqueta: 'Modelo', opciones: o.models, dropdownType: 'printermodels', createLabel: 'Nuevo modelo' },
            ],
        },
        {
            titulo: 'Ubicación y responsables',
            descripcion: 'Dónde está, a qué entidad pertenece y quién la atiende.',
            campos: [
                { tipo: 'catalogo', clave: 'locations_id', etiqueta: 'Ubicación', opciones: o.locations, dropdownType: 'locations', createLabel: 'Nueva localización', placeholder: 'Seleccionar ubicación...', completo: true },
                { tipo: 'lista', clave: 'entities_id', etiqueta: 'Entidad', opciones: lista(o.entities, 'Entidad'), placeholder: 'Seleccionar...', actual: actual(valores.entities_id, 'Entidad') },
                { tipo: 'lista', clave: 'users_id_tech', etiqueta: 'Técnico a cargo', opciones: lista(o.users ?? [], 'Usuario'), placeholder: 'Seleccionar...', actual: actual(valores.users_id_tech, 'Usuario') },
                { tipo: 'lista', clave: 'groups_id_tech', etiqueta: 'Grupo a cargo', opciones: lista(o.groups ?? [], 'Grupo'), placeholder: 'Seleccionar...', actual: actual(valores.groups_id_tech, 'Grupo') },
            ],
        },
        {
            titulo: 'Conexiones',
            descripcion: 'Puertos e interfaces con que cuenta.',
            campos: [
                { tipo: 'casilla', clave: 'have_serial', etiqueta: 'Puerto serial' },
                { tipo: 'casilla', clave: 'have_parallel', etiqueta: 'Puerto paralelo' },
                { tipo: 'casilla', clave: 'have_usb', etiqueta: 'Puerto USB' },
                { tipo: 'casilla', clave: 'have_ethernet', etiqueta: 'Ethernet' },
                { tipo: 'casilla', clave: 'have_wifi', etiqueta: 'Wi-Fi' },
            ],
        },
        {
            titulo: 'Direcciones IP',
            descripcion: 'Las direcciones con que se encuentra en la red.',
            campos: [
                {
                    tipo: 'libre',
                    clave: 'ip_addresses',
                    etiqueta: 'Agregar dirección IP',
                    ancho: true,
                    ayuda: 'Escribe la dirección y pulsa Enter o «Agregar». Lo que quede escrito sin agregar no se guarda.',
                    render: (control) => <EditorIps control={control} ips={ips.lista} cambiar={ips.cambiar} />,
                },
            ],
        },
        {
            titulo: 'Información adicional',
            campos: [
                { tipo: 'texto', clave: 'contact', etiqueta: 'Contacto', maxLength: 255, placeholder: 'Nombre del contacto' },
                { tipo: 'texto', clave: 'contact_num', etiqueta: 'Teléfono de contacto', maxLength: 255, placeholder: 'Ej: 3001234567' },
                { tipo: 'texto', clave: 'memory_size', etiqueta: 'Memoria', maxLength: 255, placeholder: 'Ej: 256 MB' },
            ],
        },
        {
            titulo: 'Notas',
            campos: [{ tipo: 'nota', clave: 'comment', etiqueta: 'Comentarios', placeholder: 'Información adicional...', filas: 3, ancho: true }],
        },
    ];
}

/** Lista de IP: se agregan de una en una (sin vacías ni repetidas, como antes) y se quitan con la X. */
function EditorIps({ control, ips, cambiar }: { control: ControlCampo; ips: string[]; cambiar: (ips: string[]) => void }) {
    const [nueva, setNueva] = useState('');
    const [repetida, setRepetida] = useState(false);

    const agregar = () => {
        const ip = nueva.trim();
        if (!ip) return;
        if (ips.includes(ip)) {
            setRepetida(true);
            return;
        }
        cambiar([...ips, ip]);
        setNueva('');
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <input
                    {...control}
                    value={nueva}
                    onChange={(e) => {
                        setNueva(e.target.value);
                        setRepetida(false);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            agregar();
                        }
                    }}
                    placeholder="Ej: 192.168.1.100"
                    autoComplete="off"
                    spellCheck={false}
                    className={cn(fieldClass, 'min-w-0 flex-1 font-mono')}
                />
                <button type="button" onClick={agregar} className={btn.secondary}>
                    <Plus aria-hidden="true" />
                    Agregar
                </button>
            </div>
            {repetida && (
                <p role="status" className="text-sm text-amber-700 dark:text-amber-400">
                    Esa dirección ya está en la lista.
                </p>
            )}
            {ips.length > 0 ? (
                <ul aria-label="Direcciones IP" className="flex flex-wrap gap-2">
                    {ips.map((ip, i) => (
                        <Chip key={`${ip}-${i}`} onRemove={() => cambiar(ips.filter((_, j) => j !== i))} etiquetaQuitar={`Quitar ${ip}`}>
                            <span className="font-mono">{ip}</span>
                        </Chip>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500">Sin direcciones IP.</p>
            )}
        </div>
    );
}
