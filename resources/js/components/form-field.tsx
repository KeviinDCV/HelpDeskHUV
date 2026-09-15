import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export interface FieldControlProps {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: true;
}

interface FormFieldProps {
    id: string;
    label: string;
    error?: string;
    hint?: ReactNode;
    optional?: boolean;
    /** Recibe los atributos que conectan el control con su error y su ayuda. */
    children: (control: FieldControlProps) => ReactNode;
}

/**
 * Etiqueta, control, error y ayuda, cableados para lector de pantalla: el control apunta a
 * su mensaje de error con aria-describedby y se marca aria-invalid. Sin eso, el error solo
 * se ve en rojo debajo del campo, y quien no lo ve no se entera de por qué no se guardó.
 */
export function FormField({ id, label, error, hint, optional, children }: FormFieldProps) {
    const errorId = error ? `${id}-error` : undefined;
    const hintId = hint ? `${id}-hint` : undefined;
    const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

    return (
        <div>
            <div className="flex items-baseline justify-between gap-2">
                <label htmlFor={id} className="text-sm font-medium text-gray-700">
                    {label}
                </label>
                {optional && <span className="text-xs text-gray-500">Opcional</span>}
            </div>
            <div className="mt-1.5">
                {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
            </div>
            {error && (
                <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm text-red-600">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {error}
                </p>
            )}
            {hint && (
                <div id={hintId} className="mt-1.5 text-xs text-gray-500">
                    {hint}
                </div>
            )}
        </div>
    );
}
