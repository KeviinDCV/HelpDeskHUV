/**
 * Campos de los equipos "sencillos" de Inventario —monitor, teléfono, dispositivo (periférico) y
 * dispositivo de red—: los cuatro tienen el mismo formulario y solo cambian las claves del tipo y
 * del modelo. Mismas claves, etiquetas y opciones que ya tenían sus páginas y que esperan
 * sus controladores (store/update leen siempre las 10 claves).
 */
import type { SeccionInventario } from '@/components/inventario-formulario';
import type { DropdownOption } from '@/components/select-with-create';

export interface ConfigEquipo {
    /** "monitor", "teléfono"… (para textos) */
    sustantivo: string;
    claveTipo: string;
    claveModelo: string;
    dropdownTipo: string;
    dropdownModelo: string;
    placeholderNombre: string;
    placeholderComentario: string;
}

export const EQUIPOS = {
    monitor: {
        sustantivo: 'monitor',
        claveTipo: 'monitortypes_id',
        claveModelo: 'monitormodels_id',
        dropdownTipo: 'monitortypes',
        dropdownModelo: 'monitormodels',
        placeholderNombre: 'Ej: MONITOR-DELL-001',
        placeholderComentario: 'Información adicional sobre el monitor...',
    },
    telefono: {
        sustantivo: 'teléfono',
        claveTipo: 'phonetypes_id',
        claveModelo: 'phonemodels_id',
        dropdownTipo: 'phonetypes',
        dropdownModelo: 'phonemodels',
        placeholderNombre: 'Ej: TEL-RECEPCION-001',
        placeholderComentario: 'Información adicional...',
    },
    dispositivo: {
        sustantivo: 'dispositivo',
        claveTipo: 'peripheraltypes_id',
        claveModelo: 'peripheralmodels_id',
        dropdownTipo: 'peripheraltypes',
        dropdownModelo: 'peripheralmodels',
        placeholderNombre: 'Ej: TECLADO-USB-001',
        placeholderComentario: 'Información adicional...',
    },
    red: {
        sustantivo: 'dispositivo de red',
        claveTipo: 'networkequipmenttypes_id',
        claveModelo: 'networkequipmentmodels_id',
        dropdownTipo: 'networkequipmenttypes',
        dropdownModelo: 'networkequipmentmodels',
        placeholderNombre: 'Ej: SWITCH-PISO3-001',
        placeholderComentario: 'Información adicional...',
    },
} satisfies Record<string, ConfigEquipo>;

export interface OpcionesEquipo {
    states: DropdownOption[];
    manufacturers: DropdownOption[];
    types: DropdownOption[];
    models: DropdownOption[];
    locations: DropdownOption[];
    entities: DropdownOption[];
}

const id = (v: unknown) => (v ? String(v) : '');

/** Valores del formulario: vacíos al crear; los del registro al editar. */
export function valoresEquipo(cfg: ConfigEquipo, r?: Record<string, unknown>): Record<string, string> {
    return {
        name: String(r?.name ?? ''),
        serial: String(r?.serial ?? ''),
        otherserial: String(r?.otherserial ?? ''),
        // Un id 0 en GLPI es "sin valor": el campo queda vacío y se guarda otra vez como 0
        states_id: id(r?.states_id),
        manufacturers_id: id(r?.manufacturers_id),
        [cfg.claveTipo]: id(r?.[cfg.claveTipo]),
        [cfg.claveModelo]: id(r?.[cfg.claveModelo]),
        locations_id: id(r?.locations_id),
        // La entidad 0 SÍ existe (es "HUV", la raíz, la de la mayoría de los equipos): antes
        // quedaba en blanco. Se envía "0" en vez de "" y el servidor guarda lo mismo (0).
        entities_id: r && r.entities_id !== undefined && r.entities_id !== null ? String(r.entities_id) : '',
        comment: String(r?.comment ?? ''),
    };
}

export function seccionesEquipo(cfg: ConfigEquipo, o: OpcionesEquipo, modo: 'crear' | 'editar'): SeccionInventario[] {
    return [
        {
            titulo: 'Información básica',
            descripcion: `Cómo se identifica el ${cfg.sustantivo}.`,
            campos: [
                { tipo: 'texto', clave: 'name', etiqueta: 'Nombre', obligatorio: true, maxLength: 255, placeholder: cfg.placeholderNombre, ancho: true },
                { tipo: 'texto', clave: 'serial', etiqueta: 'Número de serie', maxLength: 255, placeholder: 'Ej: SN123456' },
                { tipo: 'texto', clave: 'otherserial', etiqueta: 'Nº de inventario', maxLength: 255, placeholder: 'Ej: INV-2024-001' },
            ],
        },
        {
            titulo: 'Clasificación',
            descripcion: 'Estado, tipo, fabricante y modelo. Con «+» se agrega una opción nueva al catálogo.',
            campos: [
                { tipo: 'catalogo', clave: 'states_id', etiqueta: 'Estado', opciones: o.states, dropdownType: 'states', createLabel: 'Nuevo estado' },
                { tipo: 'catalogo', clave: cfg.claveTipo, etiqueta: 'Tipo', opciones: o.types, dropdownType: cfg.dropdownTipo, createLabel: 'Nuevo tipo' },
                { tipo: 'catalogo', clave: 'manufacturers_id', etiqueta: 'Fabricante', opciones: o.manufacturers, dropdownType: 'manufacturers', createLabel: 'Nuevo fabricante' },
                { tipo: 'catalogo', clave: cfg.claveModelo, etiqueta: 'Modelo', opciones: o.models, dropdownType: cfg.dropdownModelo, createLabel: 'Nuevo modelo' },
            ],
        },
        {
            titulo: 'Ubicación',
            descripcion: 'Dónde está y a qué entidad pertenece.',
            campos: [
                { tipo: 'catalogo', clave: 'locations_id', etiqueta: 'Ubicación', opciones: o.locations, dropdownType: 'locations', createLabel: 'Nueva localización', placeholder: 'Seleccionar ubicación...', completo: true },
                {
                    tipo: 'lista',
                    clave: 'entities_id',
                    etiqueta: 'Entidad',
                    opciones: o.entities.map((e) => ({ value: String(e.id), label: e.name })),
                    placeholder: modo === 'crear' ? 'Seleccionar entidad...' : 'Seleccionar...',
                },
            ],
        },
        {
            titulo: 'Notas',
            campos: [{ tipo: 'nota', clave: 'comment', etiqueta: 'Comentarios', placeholder: cfg.placeholderComentario, filas: 3, ancho: true }],
        },
    ];
}
