/**
 * Clases compartidas del rediseño, para que botones y campos se vean igual en cada página.
 *
 * Dos trampas de app.css que explican por qué están escritas así:
 *  - `:root:not(.dark) * { border-color: rgba(0,0,0,.05) !important }` vuelve casi invisible
 *    cualquier borde en modo claro. El contorno visible va con `ring-*` (box-shadow).
 *  - `.dark .bg-white` pinta #141414. Por eso los botones claros usan `bg-[#fff]` con su
 *    propia variante `dark:`.
 */

const base =
    'focus-ring inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0';

export const btn = {
    primary: `${base} bg-huv text-white hover:bg-huv-hover`,
    secondary: `${base} bg-[#fff] text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-transparent dark:ring-white/15`,
    ghost: `${base} text-gray-600 hover:bg-gray-100 hover:text-gray-900`,
};

export const fieldClass =
    'block h-10 w-full rounded-lg border-0 bg-[#fff] px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 transition-shadow ' +
    'placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-huv ' +
    'aria-invalid:ring-2 aria-invalid:ring-red-500 dark:ring-white/15 dark:aria-invalid:ring-red-400';
