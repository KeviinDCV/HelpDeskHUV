import { EQUIPOS, type OpcionesEquipo } from '@/components/inventario/campos-equipo';
import { CrearEquipo } from '@/components/inventario/paginas-equipo';

export default function CrearDispositivoRed(opciones: OpcionesEquipo) {
    return <CrearEquipo cfg={EQUIPOS.red} ruta="/inventario/dispositivos-red" lista="Dispositivos de red" opciones={opciones} />;
}
