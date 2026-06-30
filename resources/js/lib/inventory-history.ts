// Etiquetas y estilos compartidos para el historial de cambios de inventario.
// Usados por la pestaña "Historial" del detalle de computador y por la vista global.

export interface HistoryEntry {
    id: number;
    itemtype?: string;
    items_id?: number;
    category: string;
    action: string;
    field: string | null;
    old_value: string | null;
    new_value: string | null;
    summary: string;
    changed_at: string;
    computer_name?: string | null;
}

export const HISTORY_CATEGORY_LABELS: Record<string, string> = {
    hardware_disk: 'Disco',
    hardware_ram: 'RAM',
    hardware_cpu: 'Procesador',
    hardware_gpu: 'Video',
    hardware_network: 'Tarjeta de red',
    hardware_sound: 'Sonido',
    hardware_motherboard: 'Placa base',
    hardware_bios: 'BIOS',
    software: 'Software',
    os: 'Sistema operativo',
    antivirus: 'Antivirus',
    network: 'Red',
    identity: 'Identidad',
    baseline: 'Inicial',
};

export const HISTORY_ACTION_STYLE: Record<string, { label: string; badge: string; dot: string }> = {
    added: { label: 'Agregado', badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
    removed: { label: 'Eliminado', badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
    modified: { label: 'Modificado', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
    baseline: { label: 'Inicial', badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
};

export const categoryLabel = (c: string): string => HISTORY_CATEGORY_LABELS[c] ?? c;

export const actionStyle = (a: string) => HISTORY_ACTION_STYLE[a] ?? HISTORY_ACTION_STYLE.modified;

export const formatHistoryDate = (value: string): string => {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('es-CO') + ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};
