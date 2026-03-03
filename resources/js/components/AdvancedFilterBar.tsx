import React, { useState, useEffect } from 'react';
import { Plus, Minus, Search, Star, RotateCcw } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface FilterRow {
    id: number;
    connector: 'AND' | 'OR';
    field: string;
    operator: string;
    value: string;
}

interface FieldDef {
    key: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'number';
}

interface AdvancedFilterBarProps {
    initialFilters?: FilterRow[];
    onSearch: (filters: FilterRow[]) => void;
    onReset: () => void;
}

// ─── Field Definitions ──────────────────────────────────────────────────────────

const FILTER_FIELDS: FieldDef[] = [
    // Campos principales del ticket
    { key: 'elementos_mostrados', label: 'Elementos mostrados', type: 'text' },
    { key: 'titulo', label: 'Título', type: 'text' },
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'estado', label: 'Estado', type: 'select' },
    { key: 'urgencia', label: 'Urgencia', type: 'select' },
    { key: 'impacto', label: 'Impacto', type: 'select' },
    { key: 'prioridad', label: 'Prioridad', type: 'select' },
    { key: 'fecha_apertura', label: 'Fecha de Apertura', type: 'date' },
    { key: 'fecha_cierre', label: 'Fecha de cierre', type: 'date' },
    { key: 'tiempo_solucion', label: 'Tiempo de solución', type: 'text' },
    { key: 'tiempo_resolver_excedido', label: 'Tiempo para resolver excedido', type: 'select' },
    { key: 'fecha_solucion', label: 'Fecha de solución', type: 'date' },
    { key: 'ultima_actualizacion', label: 'Última actualización', type: 'date' },
    { key: 'categoria', label: 'Categoría', type: 'text' },
    { key: 'entidad', label: 'Entidad', type: 'text' },
    { key: 'ultima_edicion_por', label: 'Última edición por', type: 'text' },
    { key: 'tiempo_aduenarse', label: 'Tiempo para adueñarse', type: 'text' },
    { key: 'tiempo_poseer_excedido', label: 'Tiempo para poseer excedido', type: 'select' },
    { key: 'tiempo_interno_resolver', label: 'Tiempo interno para resolver', type: 'text' },
    { key: 'tiempo_interno_resolver_excedido', label: 'Tiempo interno para resolver excedido', type: 'select' },
    { key: 'tiempo_interno_apropiarse', label: 'Tiempo interno para apropiarse', type: 'text' },
    { key: 'tiempo_interno_excedido', label: 'Tiempo interno para estar excedido', type: 'select' },
    { key: 'tipo', label: 'Tipo', type: 'select' },
    { key: 'tipos_elementos_asociados', label: 'Tipos de elementos asociados', type: 'text' },
    { key: 'fuente_solicitante', label: 'Fuente solicitante', type: 'text' },
    // Ubicación
    { key: 'localizacion', label: 'Localización', type: 'text' },
    { key: 'total_restante_presupuesto', label: 'Total restante del presupuesto', type: 'number' },
    { key: 'codigo_postal', label: 'Código postal', type: 'text' },
    { key: 'municipio', label: 'Municipio', type: 'text' },
    { key: 'estado_ubicacion', label: 'Estado', type: 'text' },
    { key: 'pais', label: 'País', type: 'text' },
    { key: 'codigo_oficina', label: 'Código de oficina', type: 'text' },
    { key: 'numero_sala', label: 'Número de Sala', type: 'text' },
    { key: 'comentarios_ubicacion', label: 'Comentarios de ubicación', type: 'text' },
    { key: 'latitud', label: 'Latitud', type: 'number' },
    { key: 'longitud', label: 'Longitud', type: 'number' },
    // Personas
    { key: 'solicitante', label: 'Solicitante', type: 'text' },
    { key: 'grupo_solicitante', label: 'Grupo solicitante', type: 'text' },
    { key: 'autor', label: 'Autor', type: 'text' },
    { key: 'observador', label: 'Observador', type: 'text' },
    { key: 'grupo_observador', label: 'Grupo observador', type: 'text' },
    { key: 'tecnico', label: 'Técnico', type: 'text' },
    { key: 'asignado_proveedor', label: 'Asignado a un proveedor', type: 'text' },
    { key: 'grupo_tecnicos', label: 'Grupo de Tecnicos', type: 'text' },
    // Correo
    { key: 'seguimiento_correo', label: 'Seguimiento por correo electrónico', type: 'text' },
    { key: 'correo_seguimiento', label: 'Correo electrónico para el seguimiento', type: 'text' },
    // SLA / OLA
    { key: 'ans_tiempo_aduenarse', label: 'ANS Tiempo para adueñarse', type: 'text' },
    { key: 'ans_tiempo_solucion', label: 'ANS Tiempo de solución', type: 'text' },
    { key: 'ans_nivel_escalamiento', label: 'ANS Nivel de escalamiento', type: 'text' },
    { key: 'ola_tiempo_interno_apropiarse', label: 'OLA Tiempo interno para apropiarse', type: 'text' },
    { key: 'ola_tiempo_interno_resolver', label: 'OLA Tiempo interno para resolver', type: 'text' },
    { key: 'ola_nivel_escalamiento', label: 'OLA Nivel de escalamiento', type: 'text' },
    // Validación / Aprobación
    { key: 'validacion_minima', label: 'Validación mínima es requerida', type: 'text' },
    { key: 'aprobacion', label: 'Aprobación', type: 'text' },
    { key: 'comentario_solicitud', label: 'Comentario de la solicitud', type: 'text' },
    { key: 'comentario_aprobacion', label: 'Comentario de la aprobación', type: 'text' },
    { key: 'estado_aprobacion', label: 'Estado de aprobación', type: 'select' },
    { key: 'fecha_solicitud', label: 'Fecha de la solicitud', type: 'date' },
    { key: 'fecha_aprobacion', label: 'Fecha de aprobación', type: 'date' },
    { key: 'solicitante_aprobacion', label: 'Solicitante (aprobación)', type: 'text' },
    { key: 'aprobador', label: 'Aprobador', type: 'text' },
    // Satisfacción
    { key: 'tipo_satisfaccion', label: 'Tipo (satisfacción)', type: 'select' },
    { key: 'fecha_creacion', label: 'Fecha de Creación', type: 'date' },
    { key: 'fecha_respuesta', label: 'Fecha de Respuesta', type: 'date' },
    { key: 'satisfaccion', label: 'Satisfacción', type: 'number' },
    { key: 'comentarios_satisfaccion', label: 'Comentarios', type: 'text' },
    // Seguimiento
    { key: 'descripcion_seguimiento', label: 'Descripción (seguimiento)', type: 'text' },
    { key: 'fecha_seguimiento', label: 'Fecha (seguimiento)', type: 'date' },
    { key: 'numero_seguimientos', label: 'Numero de seguimientos', type: 'number' },
    { key: 'fuente_seguimiento', label: 'Fuente solicitante (seguimiento)', type: 'text' },
    { key: 'seguimiento_privado', label: 'Seguimiento Privado', type: 'select' },
    { key: 'autor_seguimiento', label: 'Autor (seguimiento)', type: 'text' },
    // Tareas
    { key: 'tareas_descripcion', label: 'Tareas - Descripción', type: 'text' },
    { key: 'tareas_numero', label: 'Tareas - Número de tareas', type: 'number' },
    { key: 'tareas_categoria', label: 'Tareas - Categoría', type: 'text' },
    { key: 'tareas_privada', label: 'Tareas - Tarea Privada', type: 'select' },
    { key: 'tareas_autor', label: 'Tareas - Autor', type: 'text' },
    { key: 'tareas_tecnico', label: 'Tareas - Técnico a cargo', type: 'text' },
    { key: 'tareas_grupo', label: 'Tareas - Grupo a cargo', type: 'text' },
    { key: 'tareas_duracion', label: 'Tareas - Duración', type: 'text' },
    { key: 'tareas_fecha', label: 'Tareas - Fecha', type: 'date' },
    { key: 'tareas_estado', label: 'Tareas - Estado', type: 'select' },
    { key: 'tareas_fecha_inicio', label: 'Tareas - Fecha de inicio', type: 'date' },
    { key: 'tareas_fecha_final', label: 'Tareas - Fecha Final', type: 'date' },
    { key: 'tareas_plantilla', label: 'Tareas - Plantilla para tarea', type: 'text' },
    // Tiempos
    { key: 'tiempo_solucion_stat', label: 'Tiempo de solución (stat)', type: 'text' },
    { key: 'tiempo_cierre', label: 'Tiempo de Cierre', type: 'text' },
    { key: 'tiempo_espera', label: 'Tiempo de espera', type: 'text' },
    { key: 'tiempo_atender_servicio', label: 'Tiempo en atender el servicio', type: 'text' },
    // Casos vinculados
    { key: 'casos_vinculados', label: 'Todos los casos vinculados', type: 'text' },
    { key: 'casos_duplicados', label: 'Casos duplicados', type: 'text' },
    { key: 'num_casos_asociados', label: 'Número de todos los casos asociados', type: 'number' },
    { key: 'num_casos_duplicados', label: 'Número de casos duplicados', type: 'number' },
    { key: 'casos_padres', label: 'Casos padres', type: 'text' },
    { key: 'casos_hijos', label: 'Casos hijos', type: 'text' },
    { key: 'num_casos_hijos', label: 'Número de casos hijos', type: 'number' },
    { key: 'num_casos_padres', label: 'Número de casos padres', type: 'number' },
    // Solución
    { key: 'tipo_solucion', label: 'Tipo de solución', type: 'text' },
    { key: 'solucion', label: 'Solución', type: 'text' },
    // Costos
    { key: 'costo_total', label: 'Costo total', type: 'number' },
    { key: 'costo_tiempo', label: 'Costo del tiempo', type: 'number' },
    { key: 'costo_duracion', label: 'Costo - Duración', type: 'text' },
    { key: 'costo_fijo', label: 'Costo fijo', type: 'number' },
    { key: 'costo_material', label: 'Costo de material', type: 'number' },
    // Conteos
    { key: 'num_problemas', label: 'Número de problemas', type: 'number' },
    { key: 'num_documentos', label: 'Número de documentos', type: 'number' },
];

// ─── Operators by Field Type ────────────────────────────────────────────────────

const OPERATORS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
    text: [
        { value: 'contiene', label: 'contiene' },
        { value: 'no_contiene', label: 'no contiene' },
        { value: 'es', label: 'es' },
        { value: 'no_es', label: 'no es' },
        { value: 'empieza_con', label: 'empieza con' },
        { value: 'termina_con', label: 'termina con' },
        { value: 'vacio', label: 'vacío' },
        { value: 'no_vacio', label: 'no vacío' },
    ],
    select: [
        { value: 'es', label: 'es' },
        { value: 'no_es', label: 'no es' },
    ],
    date: [
        { value: 'es', label: 'es' },
        { value: 'no_es', label: 'no es' },
        { value: 'antes', label: 'antes' },
        { value: 'despues', label: 'después' },
        { value: 'contiene', label: 'contiene' },
    ],
    number: [
        { value: 'es', label: 'es' },
        { value: 'no_es', label: 'no es' },
        { value: 'contiene', label: 'contiene' },
        { value: 'mayor_que', label: 'mayor que' },
        { value: 'menor_que', label: 'menor que' },
    ],
};

// ─── Select Field Options ───────────────────────────────────────────────────────

const SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
    estado: [
        { value: 'not_resolved', label: 'No resueltos' },
        { value: 'not_closed', label: 'No cerrados' },
        { value: '1', label: 'Nuevo' },
        { value: '2', label: 'En curso (asignado)' },
        { value: '3', label: 'En curso (planificado)' },
        { value: '4', label: 'En espera' },
        { value: '5', label: 'Resuelto' },
        { value: '6', label: 'Cerrado' },
    ],
    urgencia: [
        { value: '1', label: 'Muy baja' },
        { value: '2', label: 'Baja' },
        { value: '3', label: 'Media' },
        { value: '4', label: 'Alta' },
        { value: '5', label: 'Muy alta' },
    ],
    impacto: [
        { value: '1', label: 'Muy bajo' },
        { value: '2', label: 'Bajo' },
        { value: '3', label: 'Medio' },
        { value: '4', label: 'Alto' },
        { value: '5', label: 'Muy alto' },
    ],
    prioridad: [
        { value: '1', label: 'Muy baja' },
        { value: '2', label: 'Baja' },
        { value: '3', label: 'Media' },
        { value: '4', label: 'Alta' },
        { value: '5', label: 'Muy alta' },
        { value: '6', label: 'Urgente' },
    ],
    tipo: [
        { value: '1', label: 'Incidencia' },
        { value: '2', label: 'Solicitud' },
    ],
    tiempo_resolver_excedido: [
        { value: '1', label: 'Sí' },
        { value: '0', label: 'No' },
    ],
    tiempo_poseer_excedido: [
        { value: '1', label: 'Sí' },
        { value: '0', label: 'No' },
    ],
    tiempo_interno_resolver_excedido: [
        { value: '1', label: 'Sí' },
        { value: '0', label: 'No' },
    ],
    tiempo_interno_excedido: [
        { value: '1', label: 'Sí' },
        { value: '0', label: 'No' },
    ],
    estado_aprobacion: [
        { value: '1', label: 'Pendiente' },
        { value: '2', label: 'Aprobado' },
        { value: '3', label: 'Rechazado' },
    ],
    tipo_satisfaccion: [
        { value: '1', label: 'Interna' },
        { value: '2', label: 'Externa' },
    ],
    seguimiento_privado: [
        { value: '1', label: 'Sí' },
        { value: '0', label: 'No' },
    ],
    tareas_privada: [
        { value: '1', label: 'Sí' },
        { value: '0', label: 'No' },
    ],
    tareas_estado: [
        { value: '0', label: 'Información' },
        { value: '1', label: 'Por hacer' },
        { value: '2', label: 'Hecho' },
    ],
};

// ─── Date Presets ───────────────────────────────────────────────────────────────

function generateDatePresets(): { value: string; label: string }[] {
    const presets: { value: string; label: string }[] = [
        { value: 'now', label: 'Ahora' },
        { value: 'today', label: 'Hoy' },
        { value: 'specific', label: 'Especificar una fecha' },
    ];

    // Horas: -1 a -24
    for (let i = 1; i <= 24; i++) {
        presets.push({ value: `-${i}h`, label: `- ${i} hora${i > 1 ? 's' : ''}` });
    }

    // Días: -1 a -7
    for (let i = 1; i <= 7; i++) {
        presets.push({ value: `-${i}d`, label: `- ${i} día${i > 1 ? 's' : ''}` });
    }

    // Nombres de días
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    dayNames.forEach(day => presets.push({ value: `day_${day}`, label: day }));

    // Semanas: -1 a -10
    for (let i = 1; i <= 10; i++) {
        presets.push({ value: `-${i}w`, label: `- ${i} semana${i > 1 ? 's' : ''}` });
    }

    // Inicio del mes
    presets.push({ value: 'start_of_month', label: 'Inicio del mes' });

    // Meses: -1 a -12
    for (let i = 1; i <= 12; i++) {
        presets.push({ value: `-${i}m`, label: `- ${i} mes${i > 1 ? 'es' : ''}` });
    }

    // Inicio de año
    presets.push({ value: 'start_of_year', label: 'Inicio de año' });

    // Años: -1 a -10
    for (let i = 1; i <= 10; i++) {
        presets.push({ value: `-${i}y`, label: `- ${i} año${i > 1 ? 's' : ''}` });
    }

    return presets;
}

const DATE_PRESETS = generateDatePresets();

// ─── Helper Functions ───────────────────────────────────────────────────────────

function getFieldDef(fieldKey: string): FieldDef | undefined {
    return FILTER_FIELDS.find(f => f.key === fieldKey);
}

function getOperatorsForField(fieldKey: string): { value: string; label: string }[] {
    const field = getFieldDef(fieldKey);
    if (!field) return OPERATORS_BY_TYPE.text;
    return OPERATORS_BY_TYPE[field.type] || OPERATORS_BY_TYPE.text;
}

function getDefaultOperator(fieldKey: string): string {
    const field = getFieldDef(fieldKey);
    if (!field) return 'contiene';
    switch (field.type) {
        case 'select': return 'es';
        case 'date': return 'es';
        case 'number': return 'es';
        default: return 'contiene';
    }
}

function getDefaultValue(fieldKey: string): string {
    const field = getFieldDef(fieldKey);
    if (!field) return '';
    if (field.type === 'select') {
        const opts = SELECT_OPTIONS[fieldKey];
        return opts && opts.length > 0 ? opts[0].value : '';
    }
    if (field.type === 'date') {
        return 'now';
    }
    return '';
}

function isDateOperatorWithPresets(operator: string): boolean {
    return ['es', 'no_es', 'antes', 'despues'].includes(operator);
}

function isNoValueOperator(operator: string): boolean {
    return ['vacio', 'no_vacio'].includes(operator);
}

// ─── Component ──────────────────────────────────────────────────────────────────

let nextId = 1;

export default function AdvancedFilterBar({ initialFilters, onSearch, onReset }: AdvancedFilterBarProps) {
    const [rows, setRows] = useState<FilterRow[]>(() => {
        if (initialFilters && initialFilters.length > 0) {
            // Restaurar el nextId basándose en los filtros existentes
            const maxId = Math.max(...initialFilters.map(f => f.id));
            nextId = maxId + 1;
            return initialFilters;
        }
        // Default: Estado es No resueltos
        const defaultRow: FilterRow = {
            id: nextId++,
            connector: 'AND',
            field: 'estado',
            operator: 'es',
            value: 'not_resolved',
        };
        return [defaultRow];
    });

    // Track specific date inputs for rows using "Especificar una fecha"
    const [specificDates, setSpecificDates] = useState<Record<number, string>>({});

    // ─── Row Management ─────────────────────────────────────────────────────

    const addRow = (connector: 'AND' | 'OR') => {
        const newRow: FilterRow = {
            id: nextId++,
            connector,
            field: 'elementos_mostrados',
            operator: 'contiene',
            value: '',
        };
        setRows(prev => [...prev, newRow]);
    };

    const removeRow = (id: number) => {
        setRows(prev => {
            const filtered = prev.filter(r => r.id !== id);
            // Si se borra la primera fila, la nueva primera fila debe ser AND
            if (filtered.length > 0) {
                filtered[0] = { ...filtered[0], connector: 'AND' };
            }
            return filtered.length > 0 ? filtered : [{
                id: nextId++,
                connector: 'AND' as const,
                field: 'estado',
                operator: 'es',
                value: 'not_resolved',
            }];
        });
        // Limpiar fecha específica
        setSpecificDates(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const updateRow = (id: number, updates: Partial<FilterRow>) => {
        setRows(prev => prev.map(row => {
            if (row.id !== id) return row;

            const updated = { ...row, ...updates };

            // Si cambió el campo, resetear operador y valor
            if (updates.field && updates.field !== row.field) {
                updated.operator = getDefaultOperator(updates.field);
                updated.value = getDefaultValue(updates.field);
            }

            // Si cambió el operador, podría cambiar el tipo de input del valor
            if (updates.operator && updates.operator !== row.operator) {
                const fieldDef = getFieldDef(updated.field);
                if (fieldDef?.type === 'date') {
                    if (isDateOperatorWithPresets(updates.operator)) {
                        updated.value = 'now';
                    } else {
                        updated.value = '';
                    }
                }
                // Para operadores sin valor
                if (isNoValueOperator(updates.operator)) {
                    updated.value = '';
                }
            }

            return updated;
        }));
    };

    // ─── Search & Reset ─────────────────────────────────────────────────────

    const handleSearch = () => {
        // Resolver fechas específicas antes de enviar
        const resolvedRows = rows.map(row => {
            if (row.value === 'specific' && specificDates[row.id]) {
                return { ...row, value: `specific:${specificDates[row.id]}` };
            }
            return row;
        });
        onSearch(resolvedRows);
    };

    const handleReset = () => {
        nextId = 1;
        setRows([{
            id: nextId++,
            connector: 'AND',
            field: 'estado',
            operator: 'es',
            value: 'not_resolved',
        }]);
        setSpecificDates({});
        onReset();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    // ─── Value Renderer ─────────────────────────────────────────────────────

    const renderValueInput = (row: FilterRow) => {
        const fieldDef = getFieldDef(row.field);

        // No value needed for these operators
        if (isNoValueOperator(row.operator)) {
            return null;
        }

        // Select fields with es/no_es → show dropdown
        if (fieldDef?.type === 'select' && (row.operator === 'es' || row.operator === 'no_es')) {
            const options = SELECT_OPTIONS[row.field] || [];
            return (
                <select
                    value={row.value}
                    onChange={(e) => updateRow(row.id, { value: e.target.value })}
                    className="h-[26px] text-[11px] rounded-sm border border-gray-300 bg-white px-1 min-w-[140px] focus:outline-none focus:ring-1 focus:ring-[#2c4370]"
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        // Date fields with date operators → show presets dropdown
        if (fieldDef?.type === 'date' && isDateOperatorWithPresets(row.operator)) {
            return (
                <div className="flex items-center gap-1">
                    <select
                        value={row.value === 'specific' || row.value.startsWith('specific:') ? 'specific' : row.value}
                        onChange={(e) => updateRow(row.id, { value: e.target.value })}
                        className="h-[26px] text-[11px] rounded-sm border border-gray-300 bg-white px-1 min-w-[160px] focus:outline-none focus:ring-1 focus:ring-[#2c4370]"
                    >
                        {DATE_PRESETS.map(preset => (
                            <option key={preset.value} value={preset.value}>{preset.label}</option>
                        ))}
                    </select>
                    {/* Show date input when "Especificar una fecha" is selected */}
                    {(row.value === 'specific' || row.value.startsWith('specific:')) && (
                        <input
                            type="datetime-local"
                            value={specificDates[row.id] || ''}
                            onChange={(e) => setSpecificDates(prev => ({ ...prev, [row.id]: e.target.value }))}
                            className="h-[26px] text-[11px] rounded-sm border border-gray-300 bg-white px-1 focus:outline-none focus:ring-1 focus:ring-[#2c4370]"
                            onKeyDown={handleKeyDown}
                        />
                    )}
                </div>
            );
        }

        // Number fields → number input
        if (fieldDef?.type === 'number' && row.operator !== 'contiene') {
            return (
                <input
                    type="number"
                    value={row.value}
                    onChange={(e) => updateRow(row.id, { value: e.target.value })}
                    placeholder="Valor..."
                    className="h-[26px] text-[11px] rounded-sm border border-gray-300 bg-white px-2 w-[120px] focus:outline-none focus:ring-1 focus:ring-[#2c4370]"
                    onKeyDown={handleKeyDown}
                />
            );
        }

        // Default: text input
        return (
            <input
                type="text"
                value={row.value}
                onChange={(e) => updateRow(row.id, { value: e.target.value })}
                placeholder=""
                className="h-[26px] text-[11px] rounded-sm border border-gray-300 bg-white px-2 min-w-[140px] flex-1 focus:outline-none focus:ring-1 focus:ring-[#2c4370]"
                onKeyDown={handleKeyDown}
            />
        );
    };

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="bg-gray-50 border-b border-gray-200">
            {rows.map((row, index) => (
                <div
                    key={row.id}
                    className="flex items-center gap-1 px-2 py-[3px] border-b border-gray-200 last:border-b-0 flex-wrap"
                >
                    {/* Primera fila: botones + */}
                    {index === 0 ? (
                        <div className="flex items-center gap-[2px] shrink-0">
                            <button
                                type="button"
                                onClick={() => addRow('AND')}
                                className="w-[22px] h-[22px] flex items-center justify-center rounded-sm bg-white border border-gray-300 hover:bg-gray-100 text-gray-600 text-xs"
                                title="Agregar criterio (Y)"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() => addRow('OR')}
                                className="w-[22px] h-[22px] flex items-center justify-center rounded-sm bg-white border border-gray-300 hover:bg-gray-100 text-gray-600 text-xs"
                                title="Agregar criterio (O)"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-[2px] shrink-0">
                            {/* Botón - para quitar fila */}
                            <button
                                type="button"
                                onClick={() => removeRow(row.id)}
                                className="w-[22px] h-[22px] flex items-center justify-center rounded-sm bg-white border border-gray-300 hover:bg-red-50 text-gray-600 hover:text-red-600 text-xs"
                                title="Quitar criterio"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            {/* Conector Y/O */}
                            <select
                                value={row.connector}
                                onChange={(e) => updateRow(row.id, { connector: e.target.value as 'AND' | 'OR' })}
                                className="h-[26px] text-[11px] rounded-sm border border-gray-300 bg-white px-1 w-[42px] focus:outline-none focus:ring-1 focus:ring-[#2c4370]"
                            >
                                <option value="AND">Y</option>
                                <option value="OR">O</option>
                            </select>
                        </div>
                    )}

                    {/* Selector de campo */}
                    <select
                        value={row.field}
                        onChange={(e) => updateRow(row.id, { field: e.target.value })}
                        className="h-[26px] text-[11px] rounded-sm border border-gray-300 bg-white px-1 min-w-[150px] max-w-[220px] focus:outline-none focus:ring-1 focus:ring-[#2c4370]"
                    >
                        {FILTER_FIELDS.map(field => (
                            <option key={field.key} value={field.key}>{field.label}</option>
                        ))}
                    </select>

                    {/* Selector de operador */}
                    <select
                        value={row.operator}
                        onChange={(e) => updateRow(row.id, { operator: e.target.value })}
                        className="h-[26px] text-[11px] rounded-sm border border-gray-300 bg-white px-1 min-w-[90px] focus:outline-none focus:ring-1 focus:ring-[#2c4370]"
                    >
                        {getOperatorsForField(row.field).map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                    </select>

                    {/* Valor */}
                    {renderValueInput(row)}

                    {/* Controles de búsqueda (solo en la primera fila) */}
                    {index === 0 && (
                        <div className="flex items-center gap-1 ml-auto shrink-0">
                            <button
                                type="button"
                                onClick={handleSearch}
                                className="h-[26px] px-3 text-[11px] font-medium rounded-sm bg-[#2c4370] hover:bg-[#3d5583] text-white border border-[#2c4370] focus:outline-none"
                            >
                                Buscar
                            </button>
                            <button
                                type="button"
                                onClick={() => {}}
                                className="w-[26px] h-[26px] flex items-center justify-center text-gray-400 hover:text-[#2c4370]"
                                title="Guardar búsqueda"
                            >
                                <Star className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="w-[26px] h-[26px] flex items-center justify-center text-gray-400 hover:text-gray-700"
                                title="Restablecer búsqueda"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
