import { seccionesImpresora, valoresImpresora, type OpcionesImpresora } from '@/components/inventario/campos-impresora';
import { FormularioInventario, type FormularioBase } from '@/components/inventario-formulario';
import { PageHeader } from '@/components/page-header';
import { Pagina } from '@/components/pagina';
import { btn } from '@/lib/ui-classes';
import { Link, useForm } from '@inertiajs/react';
import { Eye } from 'lucide-react';

interface Props extends OpcionesImpresora {
    printer: { id: number; name: string } & Record<string, unknown>;
    existingIps: string[];
}

export default function EditarImpresora({ printer, existingIps, ...opciones }: Props) {
    const form = useForm(valoresImpresora(printer, existingIps || []));
    return (
        <Pagina titulo={`Editar ${printer.name}`} ancho="max-w-5xl" migas={[{ texto: 'Inicio', href: '/dashboard' }, { texto: 'Inventario', href: '/inventario/global' }, { texto: 'Impresoras', href: '/inventario/impresoras' }, { texto: 'Editar' }]}>
            <PageHeader
                title="Editar impresora"
                description={printer.name}
                actions={
                    <Link href={`/inventario/impresoras/${printer.id}`} className={btn.secondary}>
                        <Eye aria-hidden="true" />
                        Ver impresora
                    </Link>
                }
            />
            <FormularioInventario
                secciones={seccionesImpresora(opciones, form.data, { lista: form.data.ip_addresses, cambiar: (ips) => form.setData('ip_addresses', ips) })}
                form={form as unknown as FormularioBase}
                enviar={() => form.put(`/inventario/impresoras/${printer.id}`, { preserveState: true, preserveScroll: true })}
                accion="guardar los cambios"
                cancelarHref="/inventario/impresoras"
                textoEnviar="Guardar"
                textoEnviando="Guardando…"
            />
        </Pagina>
    );
}
