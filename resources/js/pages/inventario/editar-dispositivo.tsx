import { EQUIPOS, type OpcionesEquipo } from '@/components/inventario/campos-equipo';
import { EditarEquipo } from '@/components/inventario/paginas-equipo';

export default function EditarDispositivo({ peripheral, ...opciones }: OpcionesEquipo & { peripheral: { id: number; name: string } & Record<string, unknown> }) {
    return <EditarEquipo cfg={EQUIPOS.dispositivo} ruta="/inventario/dispositivos" lista="Dispositivos" registro={peripheral} opciones={opciones} />;
}
