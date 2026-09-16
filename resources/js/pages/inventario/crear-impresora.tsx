import { seccionesImpresora, valoresImpresora, type OpcionesImpresora } from '@/components/inventario/campos-impresora';
import { FormularioInventario, type FormularioBase } from '@/components/inventario-formulario';
import { PageHeader } from '@/components/page-header';
import { Pagina } from '@/components/pagina';
import { useForm } from '@inertiajs/react';

export default function CrearImpresora(opciones: OpcionesImpresora) {
    const form = useForm(valoresImpresora());
    return (
        <Pagina titulo="Crear impresora" ancho="max-w-5xl" migas={[{ texto: 'Inicio', href: '/dashboard' }, { texto: 'Inventario', href: '/inventario/global' }, { texto: 'Impresoras', href: '/inventario/impresoras' }, { texto: 'Crear' }]}>
            <PageHeader title="Crear impresora" description="Solo el nombre es obligatorio." />
            <FormularioInventario
                secciones={seccionesImpresora(opciones, form.data, { lista: form.data.ip_addresses, cambiar: (ips) => form.setData('ip_addresses', ips) })}
                form={form as unknown as FormularioBase}
                enviar={() => form.post('/inventario/impresoras', { preserveState: true, preserveScroll: true })}
                accion="crear la impresora"
                cancelarHref="/inventario/impresoras"
                textoEnviar="Crear impresora"
                textoEnviando="Creando…"
            />
        </Pagina>
    );
}
