import { useState, useMemo } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}: SelectWithCreateProps) {
    const [options, setOptions] = useState<DropdownOption[]>(initialOptions);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const labelOf = (o: DropdownOption) => (useCompletename && o.completename ? o.completename : o.name);

    const searchableOptions = useMemo(() => {
        const mapped = options.map((o) => ({ value: o.id.toString(), label: labelOf(o) }));
        const hasZero = options.some((o) => o.id === 0);
        if (allowNone && !hasZero) {
            return [{ value: '0', label: '-- Ninguno --' }, ...mapped];
        }
        return mapped;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options, allowNone, useCompletename]);

    const create = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Escribe un nombre.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch(`/inventario/desplegables/${dropdownType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ name: trimmed }),
            });
            if (!res.ok) throw new Error('bad status');
            const data = (await res.json()) as { id: number; name: string };
            setOptions((prev) => {
                if (prev.some((o) => o.id === data.id)) return prev;
                return [...prev, { id: data.id, name: data.name, completename: data.name }].sort((a, b) =>
                    labelOf(a).localeCompare(labelOf(b)),
                );
            });
            onValueChange(String(data.id));
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
            <div className={cn('flex items-center gap-1', className)}>
                <SearchableSelect
                    id={id}
                    options={searchableOptions}
                    value={value}
                    onValueChange={onValueChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="flex-1 min-w-0"
                    triggerClassName={triggerClassName}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={createLabel}
                    title={createLabel}
                    disabled={disabled}
                    className="h-8 w-8 shrink-0 text-[#2c4370]"
                    onClick={() => {
                        setName('');
                        setError(null);
                        setOpen(true);
                    }}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{createLabel}</DialogTitle>
                    </DialogHeader>
                    <div className="py-1">
                        <Input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    create();
                                }
                            }}
                            placeholder="Nombre"
                            aria-label="Nombre de la nueva opción"
                        />
                        {error && (
                            <p role="alert" className="text-red-600 text-xs mt-1">
                                {error}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={create} disabled={saving} className="bg-[#2c4370] hover:bg-[#3d5583] text-white">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
