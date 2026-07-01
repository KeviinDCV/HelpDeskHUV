import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    /** id para el SelectTrigger (para asociar el <Label htmlFor>) */
    id?: string;
    value: string;
    onValueChange: (value: string) => void;
    /** Opciones iniciales (se manejan internamente para poder agregar nuevas) */
    options: DropdownOption[];
    /** Clave del tipo de desplegable en el backend (ej: "computermodels") */
    dropdownType: string;
    placeholder?: string;
    /** Clases para el SelectTrigger (además de las base) */
    triggerClassName?: string;
    /** Clases para el contenedor (ej: "mt-1") */
    className?: string;
    /** Título del diálogo de creación (ej: "Nuevo modelo") */
    createLabel?: string;
    disabled?: boolean;
    /** Mostrar la etiqueta completa (para árboles como ubicaciones) */
    useCompletename?: boolean;
}

/**
 * Selector con botón "+" para crear opciones de catálogo al vuelo.
 * Llama a POST /inventario/desplegables/{dropdownType} y agrega la opción creada.
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
}: SelectWithCreateProps) {
    const [options, setOptions] = useState<DropdownOption[]>(initialOptions);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const labelOf = (o: DropdownOption) => (useCompletename && o.completename ? o.completename : o.name);

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
                <Select value={value} onValueChange={onValueChange} disabled={disabled}>
                    <SelectTrigger id={id} className={cn('flex-1 min-w-0', triggerClassName)}>
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((o) => (
                            <SelectItem key={o.id} value={o.id.toString()}>
                                {labelOf(o)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
