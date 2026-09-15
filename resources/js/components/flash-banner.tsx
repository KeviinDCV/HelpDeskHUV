import { usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Los mensajes `success` / `error` que el controlador devuelve con `->with(...)`. Muchas
 * páginas no los mostraban: un "No tienes permisos" o un "Usuario actualizado" se perdían
 * sin que nadie los viera.
 */
export function FlashBanner({ ignoreError }: { ignoreError?: string | null } = {}) {
    const { flash } = usePage<{ flash?: { success?: string | null; error?: string | null } }>().props;
    // Un error que ya mostró un modal (p. ej. "Resolver caso") no se repite en la página.
    const error = flash?.error && flash.error !== ignoreError ? flash.error : null;
    if (!flash?.success && !error) return null;

    return (
        <div className="space-y-2">
            {flash?.success && (
                <div role="status" className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 ring-1 ring-inset ring-green-600/20">
                    <CheckCircle2 className="size-5 shrink-0 text-green-700" aria-hidden="true" />
                    <p className="text-sm text-green-800">{flash?.success}</p>
                </div>
            )}
            {error && (
                <div role="alert" className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-inset ring-red-600/20">
                    <AlertTriangle className="size-5 shrink-0 text-red-700" aria-hidden="true" />
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}
        </div>
    );
}
