/**
 * Crear y editar de los equipos sencillos (monitor, teléfono, dispositivo, dispositivo de red).
 * Cada página solo dice qué tipo es y cuál es su ruta; el formulario es el mismo para los cuatro.
 */
import { seccionesEquipo, valoresEquipo, type ConfigEquipo, type OpcionesEquipo } from '@/components/inventario/campos-equipo';
import { FormularioInventario, type FormularioBase } from '@/components/inventario-formulario';
import { PageHeader } from '@/components/page-header';
import { Pagina } from '@/components/pagina';
import { btn } from '@/lib/ui-classes';
import { Link, useForm } from '@inertiajs/react';
import { Eye } from 'lucide-react';

interface Destino {
    cfg: ConfigEquipo;
    /** "/inventario/monitores" */
    ruta: string;
    /** "Monitores" (miga de pan y volver) */
    lista: string;
}

export function CrearEquipo({ cfg, ruta, lista, opciones }: Destino & { opciones: OpcionesEquipo }) {
    const form = useForm(valoresEquipo(cfg));
    const titulo = `Crear ${cfg.sustantivo}`;
    return (
        <Pagina titulo={titulo} ancho="max-w-5xl" migas={[{ texto: 'Inicio', href: '/dashboard' }, { texto: 'Inventario', href: '/inventario/global' }, { texto: lista, href: ruta }, { texto: 'Crear' }]}>
            <PageHeader title={titulo} description="Solo el nombre es obligatorio." />
            <FormularioInventario
                secciones={seccionesEquipo(cfg, opciones, 'crear')}
                form={form as unknown as FormularioBase}
                enviar={() => form.post(ruta, { preserveState: true, preserveScroll: true })}
                accion={`crear el ${cfg.sustantivo}`}
                cancelarHref={ruta}
                textoEnviar={titulo}
                textoEnviando="Creando…"
            />
        </Pagina>
    );
}

export function EditarEquipo({ cfg, ruta, lista, registro, opciones }: Destino & { registro: { id: number; name: string } & Record<string, unknown>; opciones: OpcionesEquipo }) {
    const form = useForm(valoresEquipo(cfg, registro));
    return (
        <Pagina titulo={`Editar ${registro.name}`} ancho="max-w-5xl" migas={[{ texto: 'Inicio', href: '/dashboard' }, { texto: 'Inventario', href: '/inventario/global' }, { texto: lista, href: ruta }, { texto: 'Editar' }]}>
            <PageHeader
                title={`Editar ${cfg.sustantivo}`}
                description={registro.name}
                actions={
                    <Link href={`${ruta}/${registro.id}`} className={btn.secondary}>
                        <Eye aria-hidden="true" />
                        Ver {cfg.sustantivo}
                    </Link>
                }
            />
            <FormularioInventario
                secciones={seccionesEquipo(cfg, opciones, 'editar')}
                form={form as unknown as FormularioBase}
                enviar={() => form.put(`${ruta}/${registro.id}`, { preserveState: true, preserveScroll: true })}
                accion="guardar los cambios"
                cancelarHref={ruta}
                textoEnviar="Guardar"
                textoEnviando="Guardando…"
            />
        </Pagina>
    );
}
