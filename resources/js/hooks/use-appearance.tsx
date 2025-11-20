import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const prefersDark = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (appearance: Appearance) => {
    // SIEMPRE usar tema claro - tema oscuro deshabilitado
    const isDark = false;

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = 'light';
};

const mediaQuery = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = () => {
    const currentAppearance = localStorage.getItem('appearance') as Appearance;
    applyTheme(currentAppearance || 'system');
};

export function initializeTheme() {
    // SIEMPRE forzar tema claro
    localStorage.setItem('appearance', 'light');
    applyTheme('light');

    // No escuchar cambios del sistema - siempre tema claro
    // mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('light');

    const updateAppearance = useCallback((mode: Appearance) => {
        // SIEMPRE forzar tema claro, ignorar cualquier intento de cambiar a dark
        setAppearance('light');

        // Store in localStorage for client-side persistence...
        localStorage.setItem('appearance', 'light');

        // Store in cookie for SSR...
        setCookie('appearance', 'light');

        applyTheme('light');
    }, []);

    useEffect(() => {
        // SIEMPRE aplicar tema claro
        updateAppearance('light');

        // No escuchar cambios del sistema
        return () => {
            // No cleanup necesario
        };
    }, [updateAppearance]);

    return { appearance, updateAppearance } as const;
}
