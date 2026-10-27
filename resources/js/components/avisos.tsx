/**
 * Avisos de éxito como toast (Sileo).
 *
 * Las confirmaciones que manda el servidor (`->with('success', '…')`: «Monitor creado
 * exitosamente», «Token revocado correctamente»…) salen aquí, arriba al centro (a la derecha
 * tapaban «Crear…» y los demás botones principales de cada página), y desaparecen solas. Los ERRORES no: siguen dentro de la página (FlashBanner, AvisoError, el resumen
 * de errores de cada formulario), junto a lo que hay que corregir, para que no se pierdan antes de
 * leerlos.
 *
 * Se monta una sola vez, junto a la aplicación (app.tsx). Una página que necesite un aviso con más
 * datos o un botón lo lanza ella misma con `avisarExito` y se excluye en `tieneAvisoPropio`.
 */
import type { Page } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { sileo, Toaster } from 'sileo';

interface OpcionesAviso {
    /** Una segunda línea, que se despliega bajo el título */
    descripcion?: string;
    boton?: { texto: string; accion: () => void };
}

let ultimo = { texto: '', cuando: 0 };

/** Muestra un aviso de éxito. El mismo texto dos veces seguidas (una recarga, React en desarrollo) sale una vez. */
export function avisarExito(titulo: string, opciones: OpcionesAviso = {}) {
    const ahora = Date.now();
    if (titulo === ultimo.texto && ahora - ultimo.cuando < 1500) return;
    ultimo = { texto: titulo, cuando: ahora };

    sileo.success({
        title: titulo,
        description: opciones.descripcion,
        button: opciones.boton ? { title: opciones.boton.texto, onClick: opciones.boton.accion } : undefined,
    });
}

/** El mensaje de éxito de una respuesta, si es texto (en /reportar el éxito es un objeto con el número del caso). */
function exitoDe(pagina: Page): string | null {
    const exito = (pagina.props as { flash?: { success?: unknown } }).flash?.success;
    return typeof exito === 'string' && exito.trim() ? exito : null;
}

/** Crear caso muestra su propio aviso, con «Ver el caso»; los demás éxitos salen desde aquí. */
const tieneAvisoPropio = (pagina: Page) => pagina.component === 'soporte/crear-caso' && Boolean((pagina.props as { createdTicketId?: number | null }).createdTicketId);

/** El tema de Sileo sigue al de la aplicación (la clase `dark` de <html>, que pone el botón de la cabecera). */
function useTemaDeLaApp(): 'light' | 'dark' {
    const [oscuro, setOscuro] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
    useEffect(() => {
        const html = document.documentElement;
        const observador = new MutationObserver(() => setOscuro(html.classList.contains('dark')));
        observador.observe(html, { attributes: true, attributeFilter: ['class'] });
        return () => observador.disconnect();
    }, []);
    return oscuro ? 'dark' : 'light';
}

/** Los avisos salen debajo de la cabecera fija (su alto cambia con el ancho de la pantalla). */
function useBajoLaCabecera(): number {
    const [alto, setAlto] = useState(0);
    useEffect(() => {
        const medir = () => setAlto(Math.round(document.querySelector('[data-cabecera-app]')?.getBoundingClientRect().bottom ?? 0));
        const medirDespues = () => requestAnimationFrame(medir);
        medirDespues();
        window.addEventListener('resize', medirDespues);
        const quitar = router.on('navigate', medirDespues);
        return () => {
            window.removeEventListener('resize', medirDespues);
            quitar();
        };
    }, []);
    return Math.max(alto, 0);
}

export function Avisos({ paginaInicial }: { paginaInicial?: Page }) {
    const tema = useTemaDeLaApp();
    const arriba = useBajoLaCabecera();

    useEffect(() => {
        const mostrar = (pagina: Page | undefined) => {
            if (!pagina || tieneAvisoPropio(pagina)) return;
            const texto = exitoDe(pagina);
            if (texto) avisarExito(texto);
        };
        // La primera página (llegar por un redirect del servidor) y cada respuesta después.
        // Volver atrás con el navegador no repite avisos viejos: eso no es una respuesta nueva.
        mostrar(paginaInicial);
        return router.on('success', (evento) => mostrar(evento.detail.page));
    }, [paginaInicial]);

    return <Toaster position="top-center" theme={tema} offset={{ top: arriba }} />;
}
