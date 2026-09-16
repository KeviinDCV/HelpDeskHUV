/**
 * Tema claro / oscuro de la aplicación, en un solo lugar.
 *
 * La elección se guarda en localStorage con la clave `helpdesk_theme` —la misma que usa el botón
 * de la cabecera— y también en la cookie `appearance`, para que el servidor (app.blade.php) pueda
 * pintar la primera pantalla con el tema correcto y no haya parpadeo. Valores: 'light', 'dark' o
 * 'system' (seguir al sistema operativo). Sin elección, la aplicación abre en claro.
 *
 * Antes este archivo forzaba el tema claro en cada carga (`initializeTheme` escribía
 * appearance='light' y quitaba la clase `dark`): quien elegía el modo oscuro lo perdía al recargar.
 */
import { useCallback, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const CLAVE = 'helpdesk_theme';

const consultaSistema = () => (typeof window === 'undefined' ? null : window.matchMedia('(prefers-color-scheme: dark)'));

const prefiereOscuro = () => consultaSistema()?.matches ?? false;

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

/** La elección guardada, o null si nunca se eligió. */
export function temaGuardado(): Appearance | null {
    try {
        const valor = localStorage.getItem(CLAVE);
        return valor === 'dark' || valor === 'light' || valor === 'system' ? valor : null;
    } catch {
        return null; // navegación privada o almacenamiento bloqueado
    }
}

/** ¿Toca modo oscuro ahora mismo? Sin elección, claro. */
export function temaOscuro(): boolean {
    const elegido = temaGuardado();
    if (elegido) {
        return elegido === 'dark' || (elegido === 'system' && prefiereOscuro());
    }

    // Sin elección legible (navegación privada, almacenamiento bloqueado): manda lo que ya pintó
    // el servidor con la cookie `appearance`; si no hay nada, la clase no está y queda en claro.
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}

/** Pinta el tema: la clase `dark` para los estilos y color-scheme para los controles del navegador. */
export function aplicarTema(oscuro: boolean) {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.classList.toggle('dark', oscuro);
    document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light';
}

/** Guarda la elección (para las próximas cargas) y la aplica. */
export function guardarTema(modo: Appearance) {
    try {
        localStorage.setItem(CLAVE, modo);
    } catch {
        /* sin almacenamiento: al menos queda aplicado en esta pantalla */
    }
    setCookie('appearance', modo);
    aplicarTema(modo === 'dark' || (modo === 'system' && prefiereOscuro()));
}

export function initializeTheme() {
    aplicarTema(temaOscuro());

    // Solo con "seguir al sistema" el tema cambia cuando cambia el del equipo
    consultaSistema()?.addEventListener('change', () => {
        if (temaGuardado() === 'system') {
            aplicarTema(prefiereOscuro());
        }
    });
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>(() => temaGuardado() ?? 'light');

    const updateAppearance = useCallback((modo: Appearance) => {
        setAppearance(modo);
        guardarTema(modo);
    }, []);

    return { appearance, updateAppearance } as const;
}
