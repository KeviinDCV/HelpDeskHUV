import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { btn } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

/** Confirmación de una acción que no se puede deshacer (eliminar, revocar…). */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    onConfirm,
    processing = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: ReactNode;
    confirmLabel: string;
    onConfirm: () => void;
    processing?: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[460px]">
                <DialogHeader className="flex-row items-start gap-4 px-6 py-5 pr-12 text-left">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <AlertTriangle className="size-5" aria-hidden="true" />
                    </span>
                    <div className="space-y-1.5">
                        <DialogTitle className="text-base font-semibold text-gray-900">{title}</DialogTitle>
                        <DialogDescription className="text-sm text-gray-600">{description}</DialogDescription>
                    </div>
                </DialogHeader>
                <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-3">
                    <button type="button" onClick={() => onOpenChange(false)} disabled={processing} className={btn.secondary}>
                        Cancelar
                    </button>
                    <button type="button" onClick={onConfirm} disabled={processing} className={cn(btn.primary, 'bg-red-600 hover:bg-red-700')}>
                        {processing && <Loader2 className="animate-spin" aria-hidden="true" />}
                        {confirmLabel}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
