import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Los avisos (toasts) llegan en su propio archivo, después de la página: Sileo y su motor de
// animación pesan ~50 KB comprimidos y no hacen falta para pintar la primera pantalla.
const Avisos = lazy(() => import('./components/avisos').then((m) => ({ default: m.Avisos })));

// Manejar errores 419 (CSRF token expirado) - recargar página para obtener nuevo token
router.on('invalid', (event) => {
    if (event.detail.response.status === 419) {
        event.preventDefault();
        window.location.reload();
    }
});

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
                {/* Avisos de éxito (toasts) de toda la aplicación */}
                <Suspense fallback={null}>
                    <Avisos paginaInicial={props.initialPage} />
                </Suspense>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
