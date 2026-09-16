import { EQUIPOS, type OpcionesEquipo } from '@/components/inventario/campos-equipo';
import { CrearEquipo } from '@/components/inventario/paginas-equipo';

export default function CrearMonitor(opciones: OpcionesEquipo) {
    return <CrearEquipo cfg={EQUIPOS.monitor} ruta="/inventario/monitores" lista="Monitores" opciones={opciones} />;
}
