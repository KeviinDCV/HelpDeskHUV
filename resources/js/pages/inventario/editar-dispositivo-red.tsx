import { EQUIPOS, type OpcionesEquipo } from '@/components/inventario/campos-equipo';
import { EditarEquipo } from '@/components/inventario/paginas-equipo';

export default function EditarDispositivoRed({ networkequipment, ...opciones }: OpcionesEquipo & { networkequipment: { id: number; name: string } & Record<string, unknown> }) {
    return <EditarEquipo cfg={EQUIPOS.red} ruta="/inventario/dispositivos-red" lista="Dispositivos de red" registro={networkequipment} opciones={opciones} />;
}
