import { createInertiaApp, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import Casos from '@/pages/soporte/casos';

// Espía: capturamos lo que la página pediría al servidor, sin navegar de verdad.
(window as any).__calls = [];
const realGet = router.get.bind(router);
router.get = ((url: string, data: any) => {
    (window as any).__calls.push({ url, data });
}) as any;
void realGet;

const page = {
    component: 'soporte/casos',
    url: '/soporte/casos',
    version: null,
    clearHistory: false,
    encryptHistory: false,
    props: {
        errors: {},
        flash: {},
        auth: { user: { id: 1, name: 'Test', email: 't@t.co', username: 'test' } },
        tickets: { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0, links: [] },
        categories: [{ id: 7, name: 'Redes', completename: 'Redes' }],
        technicians: [{ id: 3, name: 'Tecnico Uno' }],
        filters: {
            per_page: 15, sort: 'id', direction: 'desc',
            search: '', status: '', priority: '', category: '', assigned: '',
            date_from: '', date_to: '', filter: '', exclude_maintenance: '',
            advanced_filters: '',
        },
    },
};

const el = document.getElementById('app')!;
el.dataset.page = JSON.stringify(page);

createInertiaApp({
    resolve: () => Casos as any,
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
