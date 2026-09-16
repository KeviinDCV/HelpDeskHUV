import { seccionesPrograma, valoresPrograma, type OpcionesPrograma } from '@/components/inventario/campos-consumible-programa';
import { FormularioInventario, type FormularioBase } from '@/components/inventario-formulario';
import { PageHeader } from '@/components/page-header';
import { Pagina } from '@/components/pagina';
import { useForm } from '@inertiajs/react';

export default function CrearPrograma(opciones: OpcionesPrograma) {
    const form = useForm(valoresPrograma());
    return (
        <Pagina titulo="Crear programa" ancho="max-w-5xl" migas={[{ texto: 'Inicio', href: '/dashboard' }, { texto: 'Inventario', href: '/inventario/global' }, { texto: 'Programas', href: '/inventario/programas' }, { texto: 'Crear' }]}>
            <PageHeader title="Crear programa" description="Solo el nombre es obligatorio." />
            <FormularioInventario
                secciones={seccionesPrograma(opciones)}
                form={form as unknown as FormularioBase}
                enviar={() => form.post('/inventario/programas', { preserveState: true, preserveScroll: true })}
                accion="crear el programa"
                cancelarHref="/inventario/programas"
                textoEnviar="Crear programa"
                textoEnviando="Creando…"
            />
        </Pagina>
    );
}
