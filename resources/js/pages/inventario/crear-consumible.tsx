import { seccionesConsumible, valoresConsumible, type OpcionesConsumible } from '@/components/inventario/campos-consumible-programa';
import { FormularioInventario, type FormularioBase } from '@/components/inventario-formulario';
import { PageHeader } from '@/components/page-header';
import { Pagina } from '@/components/pagina';
import { useForm } from '@inertiajs/react';

export default function CrearConsumible(opciones: OpcionesConsumible) {
    const form = useForm(valoresConsumible());
    return (
        <Pagina titulo="Crear consumible" ancho="max-w-5xl" migas={[{ texto: 'Inicio', href: '/dashboard' }, { texto: 'Inventario', href: '/inventario/global' }, { texto: 'Consumibles', href: '/inventario/consumibles' }, { texto: 'Crear' }]}>
            <PageHeader title="Crear consumible" description="Solo el nombre es obligatorio." />
            <FormularioInventario
                secciones={seccionesConsumible(opciones)}
                form={form as unknown as FormularioBase}
                enviar={() => form.post('/inventario/consumibles', { preserveState: true, preserveScroll: true })}
                accion="crear el consumible"
                cancelarHref="/inventario/consumibles"
                textoEnviar="Crear consumible"
                textoEnviando="Creando…"
            />
        </Pagina>
    );
}
