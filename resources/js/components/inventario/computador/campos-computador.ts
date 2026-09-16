/**
 * Campos del computador, iguales al crear y al editar: las 20 claves que ComputerController lee
 * (store falla si falta alguna; update pone en 0 la que no llegue). Antes Editar no tenía Red,
 * Fuente de actualización ni UUID, así que cada guardado dejaba Red y Fuente en 0.
 */
import type { SeccionInventario } from '@/components/inventario-formulario';
import type { DropdownOption } from '@/components/select-with-create';

export interface UsuarioGlpi {
    id: number;
    name: string | null;
    realname: string | null;
    firstname: string | null;
}

export interface OpcionesComputador {
    states: DropdownOption[];
    manufacturers: DropdownOption[];
    types: DropdownOption[];
    models: DropdownOption[];
    locations: DropdownOption[];
    entities: DropdownOption[];
    users: UsuarioGlpi[];
    groups: DropdownOption[];
    networks: DropdownOption[];
    domains: DropdownOption[];
    autoupdatesystems: DropdownOption[];
}

export type ValoresComputador = Record<(typeof CLAVES)[number], string>;

const CLAVES = [
    'name',
    'serial',
    'otherserial',
    'contact',
    'contact_num',
    'states_id',
    'manufacturers_id',
    'computertypes_id',
    'computermodels_id',
    'locations_id',
    'entities_id',
    'users_id_tech',
    'groups_id_tech',
    'users_id',
    'groups_id',
    'networks_id',
    'domains_id',
    'uuid',
    'autoupdatesystems_id',
    'comment',
] as const;

const IDS = CLAVES.filter((c) => c.endsWith('_id') || c.endsWith('_tech'));

/**
 * Crear: todo vacío. Editar: los datos del computador; un id 0 se envía "0" (como antes), que
 * también es la opción «-- Ninguno --». La entidad 0 es "HUV", la raíz.
 */
export function valoresComputador(r?: Record<string, unknown>): ValoresComputador {
    const v = {} as ValoresComputador;
    for (const clave of CLAVES) {
        const dato = r?.[clave];
        if ((IDS as readonly string[]).includes(clave)) v[clave] = r ? (dato ? String(dato) : '0') : '';
        else v[clave] = dato === null || dato === undefined ? '' : String(dato);
    }
    return v;
}

/** "Mosquera Ruiz Diana (dmosquera)": apellidos y nombre de GLPI, con el usuario para distinguir homónimos. */
export function nombreUsuario(u: UsuarioGlpi): string {
    const completo = [u.realname, u.firstname].map((p) => p?.trim()).filter(Boolean).join(' ');
    if (!completo) return u.name?.trim() || `Usuario #${u.id}`;
    return u.name && u.name !== completo ? `${completo} (${u.name})` : completo;
}

const lista = (o: DropdownOption[]) => o.map((x) => ({ value: String(x.id), label: x.name }));

/** El valor guardado que ya no está en la lista (usuario borrado, red sin catálogo…) se ve y se conserva. */
const actual = (valor: string, texto: string) => (valor && valor !== '0' ? { value: valor, label: `${texto} #${valor}` } : undefined);

export function seccionesComputador(o: OpcionesComputador, v: ValoresComputador, modo: 'crear' | 'editar'): SeccionInventario[] {
    const usuarios = o.users.map((u) => ({ value: String(u.id), label: nombreUsuario(u) }));
    const grupos = lista(o.groups);
    return [
        {
            titulo: 'Información básica',
            descripcion: 'Cómo se identifica el equipo.',
            campos: [
                { tipo: 'texto', clave: 'name', etiqueta: 'Nombre', obligatorio: true, maxLength: 255, placeholder: 'Ej: PC-CONTABILIDAD-001', ancho: true },
                { tipo: 'texto', clave: 'serial', etiqueta: 'Número de serie', maxLength: 255, placeholder: 'Ej: ABC123456' },
                { tipo: 'texto', clave: 'otherserial', etiqueta: 'Número de inventario', maxLength: 255, placeholder: 'Ej: INV-2024-001' },
            ],
        },
        {
            titulo: 'Clasificación',
            descripcion: 'Estado, tipo, fabricante y modelo. Con «+» se agrega una opción nueva al catálogo.',
            campos: [
                { tipo: 'catalogo', clave: 'states_id', etiqueta: 'Estado', opciones: o.states, dropdownType: 'states', createLabel: 'Nuevo estado', ninguno: true, actual: actual(v.states_id, 'Estado') },
                { tipo: 'catalogo', clave: 'computertypes_id', etiqueta: 'Tipo', opciones: o.types, dropdownType: 'computertypes', createLabel: 'Nuevo tipo', ninguno: true, actual: actual(v.computertypes_id, 'Tipo') },
                { tipo: 'catalogo', clave: 'manufacturers_id', etiqueta: 'Fabricante', opciones: o.manufacturers, dropdownType: 'manufacturers', createLabel: 'Nuevo fabricante', ninguno: true, actual: actual(v.manufacturers_id, 'Fabricante') },
                { tipo: 'catalogo', clave: 'computermodels_id', etiqueta: 'Modelo', opciones: o.models, dropdownType: 'computermodels', createLabel: 'Nuevo modelo', ninguno: true, actual: actual(v.computermodels_id, 'Modelo') },
            ],
        },
        {
            titulo: 'Ubicación',
            descripcion: 'Dónde está y a qué entidad pertenece.',
            campos: [
                {
                    tipo: 'catalogo',
                    clave: 'locations_id',
                    etiqueta: 'Localización',
                    opciones: o.locations,
                    dropdownType: 'locations',
                    createLabel: 'Nueva localización',
                    placeholder: 'Seleccionar ubicación...',
                    completo: true,
                    ninguno: true,
                    actual: actual(v.locations_id, 'Localización'),
                },
                { tipo: 'buscable', clave: 'entities_id', etiqueta: 'Entidad', opciones: lista(o.entities), placeholder: 'Seleccionar entidad...', ninguno: true, actual: actual(v.entities_id, 'Entidad') },
            ],
        },
        {
            titulo: 'Responsables',
            descripcion: 'Quién atiende el equipo y quién lo usa.',
            campos: [
                { tipo: 'buscable', clave: 'users_id_tech', etiqueta: 'Técnico a cargo del hardware', opciones: usuarios, placeholder: 'Seleccionar técnico...', ninguno: true, actual: actual(v.users_id_tech, 'Usuario') },
                { tipo: 'buscable', clave: 'groups_id_tech', etiqueta: 'Grupo a cargo del hardware', opciones: grupos, placeholder: 'Seleccionar grupo...', ninguno: true, actual: actual(v.groups_id_tech, 'Grupo') },
                { tipo: 'buscable', clave: 'users_id', etiqueta: 'Usuario', opciones: usuarios, placeholder: 'Seleccionar usuario...', ninguno: true, actual: actual(v.users_id, 'Usuario') },
                { tipo: 'buscable', clave: 'groups_id', etiqueta: 'Grupo', opciones: grupos, placeholder: 'Seleccionar grupo...', ninguno: true, actual: actual(v.groups_id, 'Grupo') },
                { tipo: 'texto', clave: 'contact', etiqueta: 'Nombre de usuario alternativo', maxLength: 255, ayuda: 'El contacto del equipo.' },
                { tipo: 'texto', clave: 'contact_num', etiqueta: 'Número de contacto', maxLength: 255 },
            ],
        },
        {
            titulo: 'Red y sistema',
            descripcion: 'Datos que también sincroniza el agente de inventario.',
            campos: [
                // La tabla de redes no existe en la base actual: la lista puede venir vacía
                { tipo: 'catalogo', clave: 'networks_id', etiqueta: 'Red', opciones: o.networks ?? [], dropdownType: 'networks', createLabel: 'Nueva red', ninguno: true, actual: actual(v.networks_id, 'Red') },
                { tipo: 'catalogo', clave: 'domains_id', etiqueta: 'Dominio', opciones: o.domains, dropdownType: 'domains', createLabel: 'Nuevo dominio', placeholder: 'Seleccionar dominio...', ninguno: true, actual: actual(v.domains_id, 'Dominio') },
                {
                    tipo: 'texto',
                    clave: 'uuid',
                    etiqueta: 'UUID',
                    maxLength: 255,
                    placeholder: modo === 'crear' ? 'Se genera automáticamente si se deja vacío' : undefined,
                    ayuda: modo === 'editar' ? 'Si lo dejas vacío, se conserva el actual.' : undefined,
                },
                {
                    tipo: 'catalogo',
                    clave: 'autoupdatesystems_id',
                    etiqueta: 'Fuente de actualización',
                    opciones: o.autoupdatesystems ?? [],
                    dropdownType: 'autoupdatesystems',
                    createLabel: 'Nueva fuente de actualización',
                    ninguno: true,
                    actual: actual(v.autoupdatesystems_id, 'Fuente'),
                },
            ],
        },
        {
            titulo: 'Comentarios',
            campos: [{ tipo: 'nota', clave: 'comment', etiqueta: 'Comentarios', placeholder: 'Información adicional sobre el equipo...', filas: 3, ancho: true }],
        },
    ];
}
