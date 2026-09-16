import { FormField } from '@/components/form-field';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { csrfHeaders } from '@/lib/csrf';
import { btn, fieldClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Loader2, Plus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

export interface DropdownOption {
    id: number;
    name: string;
    completename?: string;
}

interface SelectWithCreateProps {
    /** id para el disparador (para asociar el <Label htmlFor>) */
    id?: string;
    value: string;
    onValueChange: (value: string) => void;
    /** Opciones iniciales (se manejan internamente para poder agregar nuevas) */
    options: DropdownOption[];
    /** Clave del tipo de desplegable en el backend (ej: "computermodels") */
    dropdownType: string;
    placeholder?: string;
    /** Clases para el disparador (además de las base) */
    triggerClassName?: string;
    /** Clases para el contenedor (ej: "mt-1") */
    className?: string;
    /** Título del diálogo de creación (ej: "Nuevo modelo") */
    createLabel?: string;
    disabled?: boolean;
    /** Mostrar la etiqueta completa (para árboles como ubicaciones) */
    useCompletename?: boolean;
    /** Mostrar la opción "-- Ninguno --" (value "0") para poder desasignar */
    allowNone?: boolean;
    /** Error y ayuda del campo (FormField) para el disparador */
    'aria-describedby'?: string;
    'aria-invalid'?: boolean | 'true';
    /** La opción que ya tiene el registro, por si no está en la lista (se muestra y se conserva) */
    actual?: { value: string; label: string };
}

/**
 * Selector CON BÚSQUEDA y botón "+" para crear opciones de catálogo al vuelo.
 * Se apoya en SearchableSelect (filtro por texto) y llama a
 * POST /inventario/desplegables/{dropdownType} para agregar la opción creada.
 */
export function SelectWithCreate({
    id,
    value,
    onValueChange,
    options: initialOptions,
    dropdownType,
    placeholder = 'Seleccionar...',
    triggerClassName,
    className,
    createLabel = 'Nueva opción',
    disabled,
    useCompletename = false,
    allowNone = false,
    actual,
    ...aria
}: SelectWithCreateProps) {
    const [options, setOptions] = useState<DropdownOption[]>(initialOptions);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const creada = useRef(false);
    const botonId = `${id ?? dropdownType}-crear`;

    const labelOf = (o: DropdownOption) => (useCompletename && o.completename ? o.completename : o.name);

    const searchableOptions = useMemo(() => {
        const mapped = options.map((o) => ({ value: o.id.toString(), label: labelOf(o) }));
        const hasZero = options.some((o) => o.id === 0);
        const lista = allowNone && !hasZero ? [{ value: '0', label: '-- Ninguno --' }, ...mapped] : mapped;
        // El valor que ya tiene el registro, aunque no esté en el catálogo: se ve y no se pierde
        if (actual?.value && actual.value !== '0' && !lista.some((o) => o.value === actual.value)) return [actual, ...lista];
        return lista;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options, allowNone, useCompletename, actual?.value, actual?.label]);

    const create = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Escribe un nombre.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/inventario/desplegables/${dropdownType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...csrfHeaders(),
                },
                body: JSON.stringify({ name: trimmed }),
            });
            if (!res.ok) throw new Error('bad status');
            const data = (await res.json()) as { id: number; name: string };
            setOptions((prev) => {
                if (prev.some((o) => o.id === data.id)) return prev;
                return [...prev, { id: data.id, name: data.name, completename: data.name }].sort((a, b) => labelOf(a).localeCompare(labelOf(b)));
            });
            onValueChange(String(data.id));
            creada.current = true;
            setOpen(false);
            setName('');
        } catch {
            setError('No se pudo crear la opción. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className={cn('flex items-center gap-2', className)}>
                <SearchableSelect
                    id={id}
                    options={searchableOptions}
                    value={value}
                    onValueChange={onValueChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="min-w-0 flex-1"
                    triggerClassName={triggerClassName}
                    {...aria}
                />
                <button
                    type="button"
                    id={botonId}
                    aria-label={createLabel}
                    title={createLabel}
                    disabled={disabled}
                    className={cn(btn.secondary, 'size-10 shrink-0 px-0')}
                    onClick={() => {
                        setName('');
                        setError(null);
                        setOpen(true);
                    }}
                >
                    <Plus aria-hidden="true" />
                </button>
            </div>

            <Dialog open={open} onOpenChange={(a) => !saving && setOpen(a)}>
                {/* Sin descripción a propósito: el título ya lo dice todo. Se declara para que
                    Radix no avise, en vez de silenciarlo para toda la app desde dialog.tsx. */}
                <DialogContent
                    className="gap-0 rounded-2xl p-0 sm:max-w-sm"
                    aria-describedby={undefined}
                    // Al cerrar, el foco vuelve al "+"; si se creó la opción, al selector que ya la muestra
                    onCloseAutoFocus={(e) => {
                        e.preventDefault();
                        document.getElementById(creada.current && id ? id : botonId)?.focus();
                        creada.current = false;
                    }}
                >
                    <DialogHeader className="border-b px-6 py-4 pr-12 text-left">
                        <DialogTitle className="text-lg font-semibold text-gray-900">{createLabel}</DialogTitle>
                    </DialogHeader>
                    <div className="px-6 py-5">
                        <FormField id={`${botonId}-nombre`} label="Nombre" error={error ?? undefined}>
                            {(c) => (
                                <input
                                    {...c}
                                    autoFocus
                                    autoComplete="off"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            create();
                                        }
                                    }}
                                    className={fieldClass}
                                />
                            )}
                        </FormField>
                    </div>
                    <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-3">
                        <button type="button" onClick={() => setOpen(false)} disabled={saving} className={btn.secondary}>
                            Cancelar
                        </button>
                        <button type="button" onClick={create} disabled={saving} className={btn.primary}>
                            {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
                            {saving ? 'Creando…' : 'Crear'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
