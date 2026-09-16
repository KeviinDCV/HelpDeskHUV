import { seccionesComputador, valoresComputador, type OpcionesComputador } from '@/components/inventario/computador/campos-computador';
import { FormularioInventario, type FormularioBase } from '@/components/inventario-formulario';
import { PageHeader } from '@/components/page-header';
import { Pagina } from '@/components/pagina';
import { useForm } from '@inertiajs/react';

export default function CrearComputador(opciones: OpcionesComputador) {
    const form = useForm(valoresComputador());
    return (
        <Pagina titulo="Crear computador" ancho="max-w-5xl" migas={[{ texto: 'Inicio', href: '/dashboard' }, { texto: 'Inventario', href: '/inventario/global' }, { texto: 'Computadores', href: '/inventario/computadores' }, { texto: 'Crear' }]}>
            <PageHeader title="Crear computador" description="Registra un equipo en el inventario. Solo el nombre es obligatorio." />
            <FormularioInventario
                secciones={seccionesComputador(opciones, form.data, 'crear')}
                form={form as unknown as FormularioBase}
                enviar={() => form.post('/inventario/computadores', { preserveState: true, preserveScroll: true })}
                accion="crear el computador"
                cancelarHref="/inventario/computadores"
                textoEnviar="Crear computador"
                textoEnviando="Creando…"
            />
        </Pagina>
    );
}
