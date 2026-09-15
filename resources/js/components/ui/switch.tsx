import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

type SwitchProps = Omit<ComponentProps<'button'>, 'onChange' | 'role'> & {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
};

/**
 * Interruptor on/off (role="switch"): el lector de pantalla anuncia "activado/desactivado".
 * Acompáñalo siempre de un texto visible con el estado; el color solo no lo comunica.
 */
export function Switch({ checked, onCheckedChange, className, disabled, ...props }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                'focus-ring relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                checked ? 'bg-green-600' : 'bg-gray-400 dark:bg-white/25',
                className,
            )}
            {...props}
        >
            <span
                aria-hidden="true"
                className={cn('elev-1 inline-block size-4 rounded-full bg-[#fff] transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0.5')}
            />
        </button>
    );
}
