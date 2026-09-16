import { seccionesConsumible, valoresConsumible, type OpcionesConsumible } from '@/components/inventario/campos-consumible-programa';
import { FormularioInventario, type FormularioBase } from '@/components/inventario-formulario';
import { PageHeader } from '@/components/page-header';
import { Pagina } from '@/components/pagina';
import { btn } from '@/lib/ui-classes';
import { Link, useForm } from '@inertiajs/react';
import { Eye } from 'lucide-react';

export default function EditarConsumible({ consumable, ...opciones }: OpcionesConsumible & { consumable: { id: number; name: string } & Record<string, unknown> }) {
    const form = useForm(valoresConsumible(consumable));
    return (
        <Pagina titulo={`Editar ${consumable.name}`} ancho="max-w-5xl" migas={[{ texto: 'Inicio', href: '/dashboard' }, { texto: 'Inventario', href: '/inventario/global' }, { texto: 'Consumibles', href: '/inventario/consumibles' }, { texto: 'Editar' }]}>
            <PageHeader
                title="Editar consumible"
                description={consumable.name}
                actions={
                    <Link href={`/inventario/consumibles/${consumable.id}`} className={btn.secondary}>
                        <Eye aria-hidden="true" />
                        Ver consumible
                    </Link>
                }
            />
            <FormularioInventario
                secciones={seccionesConsumible(opciones)}
                form={form as unknown as FormularioBase}
                enviar={() => form.put(`/inventario/consumibles/${consumable.id}`, { preserveState: true, preserveScroll: true })}
                accion="guardar los cambios"
                cancelarHref="/inventario/consumibles"
                textoEnviar="Guardar"
                textoEnviando="Guardando…"
            />
        </Pagina>
    );
}
