import { usePage } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';

/**
 * El mensaje de error que el controlador devuelve con `->with('error', …)`, dentro de la página:
 * un error debe quedarse a la vista hasta que se lea. Los mensajes de éxito ya no salen aquí: los
 * muestra como toast components/avisos.tsx, que se monta una vez para toda la aplicación.
 */
export function FlashBanner({ ignoreError }: { ignoreError?: string | null } = {}) {
    const { flash } = usePage<{ flash?: { error?: string | null } }>().props;
    // Un error que ya mostró un modal (p. ej. "Resolver caso") no se repite en la página.
    const error = flash?.error && flash.error !== ignoreError ? flash.error : null;
    if (!error) return null;

    return (
        <div role="alert" className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-inset ring-red-600/20">
            <AlertTriangle className="size-5 shrink-0 text-red-700" aria-hidden="true" />
            <p className="text-sm text-red-800">{error}</p>
        </div>
    );
}
