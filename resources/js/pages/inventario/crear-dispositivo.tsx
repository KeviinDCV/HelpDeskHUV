import { EQUIPOS, type OpcionesEquipo } from '@/components/inventario/campos-equipo';
import { CrearEquipo } from '@/components/inventario/paginas-equipo';

export default function CrearDispositivo(opciones: OpcionesEquipo) {
    return <CrearEquipo cfg={EQUIPOS.dispositivo} ruta="/inventario/dispositivos" lista="Dispositivos" opciones={opciones} />;
}
