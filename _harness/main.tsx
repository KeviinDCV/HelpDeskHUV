import '../resources/css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

import Antes from './dashboard-antes';
import Despues from '@/pages/dashboard';
import * as D from './datos';

const q = new URLSearchParams(location.search);
const oscuro = q.get('tema') === 'oscuro';
const vacio = q.get('vacio') === '1';
const admin = q.get('admin') !== '0';

try { localStorage.setItem('helpdesk_theme', oscuro ? 'dark' : 'light'); } catch {}
document.documentElement.classList.toggle('dark', oscuro);

const datos = {
    publicTickets: vacio ? [] : D.publicTickets,
    myTickets: vacio ? [] : D.myTickets,
    stats: vacio ? { publicUnassigned: 0, myTickets: 0, myPending: 0, myResolved: 412 } : D.stats,
};

// El servidor no existe aquí: el sondeo de 30 s y las notificaciones reciben respuestas fijas.
const fetchReal = window.fetch.bind(window);
window.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    const u = String(url);
    const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (u.startsWith('/dashboard/tickets')) return json(datos);
    if (u.startsWith('/dashboard/ticket/')) {
        const id = Number(u.split('/').pop());
        const t = [...D.publicTickets, ...D.myTickets].find((x) => x.id === id)!;
        return json({ ...t, location_name: 'Hospital > Urgencias', assigned_tech: null, solution: null });
    }
    if (u.includes('notific')) return json({ notifications: [], unread_count: 0 });
    return fetchReal(url, init);
}) as typeof fetch;

(window as any).__calls = [];
router.post = ((url: string, data: unknown) => { (window as any).__calls.push({ url, data }); }) as any;

const el = document.getElementById('app')!;
el.dataset.page = JSON.stringify({
    // La URL de la propia página de pruebas: si fuese '/dashboard', un recargo daría 404.
    component: 'dashboard', url: location.pathname + location.search, version: null, clearHistory: false, encryptHistory: false,
    props: {
        errors: {}, flash: {},
        ...datos,
        technicians: admin ? D.technicians : [],
        auth: { user: { id: 1, name: 'Kevin Echavarría', email: 'k@huv.gov.co', username: 'kechavarro', role: admin ? 'Administrador' : 'Técnico', avatar: null } },
    },
});

createInertiaApp({
    resolve: () => (q.get('v') === 'antes' ? Antes : Despues),
    setup({ el, App, props }) { createRoot(el).render(<App {...props} />); },
});
