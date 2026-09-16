import { EQUIPOS, type OpcionesEquipo } from '@/components/inventario/campos-equipo';
import { CrearEquipo } from '@/components/inventario/paginas-equipo';

export default function CrearTelefono(opciones: OpcionesEquipo) {
    return <CrearEquipo cfg={EQUIPOS.telefono} ruta="/inventario/telefonos" lista="Teléfonos" opciones={opciones} />;
}
