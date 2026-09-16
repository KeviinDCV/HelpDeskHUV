import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { btn, fieldClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { AlertTriangle, CheckSquare, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Fecha y hora local en el formato de <input type="datetime-local"> ("2026-09-15T10:32"). */
function ahoraLocal(): string {
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:${p(now.getMinutes())}`;
}

export interface CasoAResolver {
    id: number;
    name: string;
    /** Fecha de apertura ("2026-09-15 07:10:00"): la solución no puede ser anterior. */
    date: string | null;
}

/**
 * "Resolver caso": solución + fecha, el mismo modal en la lista de casos y en la vista de un
 * caso. Envía a DashboardController::solveTicket, que valida permisos (admin o técnico
 * asignado) y fecha, guarda la solución y deja el caso cerrado.
 *
 * El servidor responde con un redirect de vuelta; si trae flash.error (sin permiso, fecha
 * anterior a la apertura…) el error se muestra aquí, y `onServerError` avisa a la página para
 * que su FlashBanner no lo repita.
 */
export function ResolverCasoDialog({ caso, ...resto }: Props & { caso: CasoAResolver | null }) {
    // Se monta de nuevo con cada caso (key): formulario limpio y la fecha de ahora cada vez que se abre.
    return caso ? <Formulario key={caso.id} caso={caso} {...resto} /> : null;
}

interface Props {
    onClose: () => void;
    onServerError?: (mensaje: string) => void;
}

function Formulario({ caso, onClose, onServerError }: Props & { caso: CasoAResolver }) {
    const [solution, setSolution] = useState('');
    const [solveDate, setSolveDate] = useState(ahoraLocal);
    const [solving, setSolving] = useState(false);
    const [solveError, setSolveError] = useState<string | null>(null);
    const [solutionError, setSolutionError] = useState<string | null>(null);
    // El botón que abrió el modal: al cerrarlo el foco vuelve ahí (si sigue en la página;
    // tras resolver, el botón "Resolver" desaparece). Sin esto caía en <body>.
    const [origen] = useState(() => document.activeElement as HTMLElement | null);
    useEffect(() => () => {
        setTimeout(() => {
            if (origen?.isConnected) origen.focus();
        }, 0);
    }, [origen]);

    const confirmar = () => {
        if (!solution.trim()) {
            setSolutionError('Debe ingresar una descripción de la solución.');
            return;
        }
        setSolutionError(null);

        // Al minuto, como el servidor: la hora del campo no lleva segundos y la apertura sí
        // ("10:32" contra "10:32:45"); resolver en el mismo minuto de la apertura es válido.
        if (solveDate && caso.date && new Date(solveDate) < new Date(caso.date.replace(' ', 'T').slice(0, 16))) {
            setSolveError('La fecha de solución no puede ser anterior a la fecha de creación del caso.');
            return;
        }

        setSolving(true);
        setSolveError(null);

        router.post(
            `/dashboard/solve-ticket/${caso.id}`,
            { solution: solution.trim(), solve_date: solveDate ? solveDate.replace('T', ' ') + ':00' : null },
            {
                preserveState: true,
                onSuccess: (page) => {
                    const error = (page.props as { flash?: { error?: string } }).flash?.error;
                    if (error) {
                        setSolveError(error);
                        onServerError?.(error);
                        return;
                    }
                    onClose();
                },
                onError: (errors) => {
                    setSolveError(Object.values(errors).join(', ') || 'Error al resolver');
                },
                onFinish: () => setSolving(false),
            },
        );
    };

    return (
        <Dialog open onOpenChange={(abierto) => !abierto && !solving && onClose()}>
            <DialogContent className="gap-0 rounded-2xl p-0 sm:max-w-[520px]">
                <DialogHeader className="border-b px-6 py-4 pr-12 text-left">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <CheckSquare className="size-5 text-green-700" aria-hidden="true" />
                        Resolver caso
                    </DialogTitle>
                    <DialogDescription className="min-w-0 text-sm text-gray-500 [overflow-wrap:anywhere]">
                        #{caso.id} · {caso.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 px-6 py-5">
                    {solveError && (
                        <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-inset ring-red-600/20">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            {solveError}
                        </p>
                    )}
                    <div>
                        <label htmlFor="solve-solution" className="text-sm font-medium text-gray-700">
                            Descripción de la solución <span className="text-red-600">*</span>
                        </label>
                        <textarea
                            id="solve-solution"
                            value={solution}
                            onChange={(e) => {
                                setSolution(e.target.value);
                                if (solutionError) setSolutionError(null);
                            }}
                            placeholder="Describe cómo se resolvió el problema…"
                            aria-invalid={solutionError ? true : undefined}
                            aria-describedby={solutionError ? 'solve-solution-error' : undefined}
                            className={cn(fieldClass, 'mt-1.5 h-auto min-h-[120px] py-2')}
                            autoFocus
                        />
                        {solutionError && (
                            <p id="solve-solution-error" role="alert" className="mt-1.5 text-sm text-red-600">
                                {solutionError}
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="solve-date" className="text-sm font-medium text-gray-700">
                            Fecha y hora de solución
                        </label>
                        <input
                            id="solve-date"
                            type="datetime-local"
                            value={solveDate}
                            onChange={(e) => setSolveDate(e.target.value)}
                            aria-describedby="solve-date-hint"
                            className={cn(fieldClass, 'mt-1.5')}
                        />
                        <p id="solve-date-hint" className="mt-1.5 text-xs text-gray-500">
                            Por defecto, ahora. Cámbiala si la solución fue en otro momento.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-3">
                    <button type="button" onClick={onClose} disabled={solving} className={btn.secondary}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={confirmar}
                        disabled={!solution.trim() || solving}
                        className={cn(btn.primary, 'bg-green-700 hover:bg-green-800')}
                    >
                        {solving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CheckSquare aria-hidden="true" />}
                        {solving ? 'Resolviendo…' : 'Resolver'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
