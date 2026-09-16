import { seccionesPrograma, valoresPrograma, type OpcionesPrograma } from '@/components/inventario/campos-consumible-programa';
import { FormularioInventario, type FormularioBase } from '@/components/inventario-formulario';
import { PageHeader } from '@/components/page-header';
import { Pagina } from '@/components/pagina';
import { btn } from '@/lib/ui-classes';
import { Link, useForm } from '@inertiajs/react';
import { Eye } from 'lucide-react';

export default function EditarPrograma({ software, ...opciones }: OpcionesPrograma & { software: { id: number; name: string } & Record<string, unknown> }) {
    const form = useForm(valoresPrograma(software));
    return (
        <Pagina titulo={`Editar ${software.name}`} ancho="max-w-5xl" migas={[{ texto: 'Inicio', href: '/dashboard' }, { texto: 'Inventario', href: '/inventario/global' }, { texto: 'Programas', href: '/inventario/programas' }, { texto: 'Editar' }]}>
            <PageHeader
                title="Editar programa"
                description={software.name}
                actions={
                    <Link href={`/inventario/programas/${software.id}`} className={btn.secondary}>
                        <Eye aria-hidden="true" />
                        Ver programa
                    </Link>
                }
            />
            <FormularioInventario
                secciones={seccionesPrograma(opciones)}
                form={form as unknown as FormularioBase}
                enviar={() => form.put(`/inventario/programas/${software.id}`, { preserveState: true, preserveScroll: true })}
                accion="guardar los cambios"
                cancelarHref="/inventario/programas"
                textoEnviar="Guardar"
                textoEnviando="Guardando…"
            />
        </Pagina>
    );
}
