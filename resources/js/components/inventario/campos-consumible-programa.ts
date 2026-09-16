/**
 * Campos de Consumibles y Programas, iguales al crear y al editar (mismas claves que
 * ConsumableItemController y SoftwareController, que leen siempre todas).
 */
import type { SeccionInventario } from '@/components/inventario-formulario';
import type { DropdownOption } from '@/components/select-with-create';

const id = (v: unknown) => (v ? String(v) : '');
// La entidad 0 existe ("HUV", la raíz): se muestra y se envía "0", que el servidor guarda igual
const entidad = (r?: Record<string, unknown>) => (r && r.entities_id !== undefined && r.entities_id !== null ? String(r.entities_id) : '');
const entidades = (e: DropdownOption[]) => e.map((x) => ({ value: String(x.id), label: x.name }));

export interface OpcionesConsumible {
    types: DropdownOption[];
    manufacturers: DropdownOption[];
    entities: DropdownOption[];
    locations: DropdownOption[];
}

export const valoresConsumible = (r?: Record<string, unknown>) => ({
    name: String(r?.name ?? ''),
    ref: String(r?.ref ?? ''),
    consumableitemtypes_id: id(r?.consumableitemtypes_id),
    manufacturers_id: id(r?.manufacturers_id),
    entities_id: entidad(r),
    locations_id: id(r?.locations_id),
    comment: String(r?.comment ?? ''),
});

export const seccionesConsumible = (o: OpcionesConsumible): SeccionInventario[] => [
    {
        titulo: 'Información básica',
        descripcion: 'Cómo se identifica el consumible.',
        campos: [
            { tipo: 'texto', clave: 'name', etiqueta: 'Nombre', obligatorio: true, maxLength: 255, placeholder: 'Ej: Tóner HP 85A' },
            { tipo: 'texto', clave: 'ref', etiqueta: 'Referencia', maxLength: 255, placeholder: 'Ej: CE285A' },
        ],
    },
    {
        titulo: 'Clasificación',
        descripcion: 'Tipo y fabricante. Con «+» se agrega una opción nueva al catálogo.',
        campos: [
            { tipo: 'catalogo', clave: 'consumableitemtypes_id', etiqueta: 'Tipo', opciones: o.types, dropdownType: 'consumableitemtypes', createLabel: 'Nuevo tipo' },
            { tipo: 'catalogo', clave: 'manufacturers_id', etiqueta: 'Fabricante', opciones: o.manufacturers, dropdownType: 'manufacturers', createLabel: 'Nuevo fabricante' },
        ],
    },
    {
        titulo: 'Ubicación',
        descripcion: 'Dónde se guarda y a qué entidad pertenece.',
        campos: [
            { tipo: 'catalogo', clave: 'locations_id', etiqueta: 'Ubicación', opciones: o.locations, dropdownType: 'locations', createLabel: 'Nueva localización', placeholder: 'Seleccionar ubicación...', completo: true },
            { tipo: 'lista', clave: 'entities_id', etiqueta: 'Entidad', opciones: entidades(o.entities), placeholder: 'Seleccionar...' },
        ],
    },
    { titulo: 'Notas', campos: [{ tipo: 'nota', clave: 'comment', etiqueta: 'Comentarios', placeholder: 'Información adicional...', filas: 3, ancho: true }] },
];

export interface OpcionesPrograma {
    manufacturers: DropdownOption[];
    categories: DropdownOption[];
    entities: DropdownOption[];
}

export const valoresPrograma = (r?: Record<string, unknown>) => ({
    name: String(r?.name ?? ''),
    manufacturers_id: id(r?.manufacturers_id),
    softwarecategories_id: id(r?.softwarecategories_id),
    entities_id: entidad(r),
    comment: String(r?.comment ?? ''),
});

export const seccionesPrograma = (o: OpcionesPrograma): SeccionInventario[] => [
    {
        titulo: 'Información básica',
        descripcion: 'Nombre del programa y quién lo publica.',
        campos: [
            { tipo: 'texto', clave: 'name', etiqueta: 'Nombre del programa', obligatorio: true, maxLength: 255, placeholder: 'Ej: Microsoft Office 365', ancho: true },
            { tipo: 'catalogo', clave: 'manufacturers_id', etiqueta: 'Editor', opciones: o.manufacturers, dropdownType: 'manufacturers', createLabel: 'Nuevo fabricante', ancho: true },
        ],
    },
    {
        titulo: 'Clasificación',
        descripcion: 'Categoría y entidad. Con «+» se agrega una categoría nueva.',
        campos: [
            { tipo: 'catalogo', clave: 'softwarecategories_id', etiqueta: 'Categoría', opciones: o.categories, dropdownType: 'softwarecategories', createLabel: 'Nueva categoría' },
            { tipo: 'lista', clave: 'entities_id', etiqueta: 'Entidad', opciones: entidades(o.entities), placeholder: 'Seleccionar...' },
        ],
    },
    { titulo: 'Notas', campos: [{ tipo: 'nota', clave: 'comment', etiqueta: 'Comentarios', placeholder: 'Información adicional sobre el software...', filas: 3, ancho: true }] },
];
