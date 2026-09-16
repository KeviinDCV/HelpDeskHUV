import { EQUIPOS, type OpcionesEquipo } from '@/components/inventario/campos-equipo';
import { EditarEquipo } from '@/components/inventario/paginas-equipo';

export default function EditarMonitor({ monitor, ...opciones }: OpcionesEquipo & { monitor: { id: number; name: string } & Record<string, unknown> }) {
    return <EditarEquipo cfg={EQUIPOS.monitor} ruta="/inventario/monitores" lista="Monitores" registro={monitor} opciones={opciones} />;
}
