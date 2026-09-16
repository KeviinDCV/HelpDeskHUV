import { EQUIPOS, type OpcionesEquipo } from '@/components/inventario/campos-equipo';
import { EditarEquipo } from '@/components/inventario/paginas-equipo';

export default function EditarTelefono({ phone, ...opciones }: OpcionesEquipo & { phone: { id: number; name: string } & Record<string, unknown> }) {
    return <EditarEquipo cfg={EQUIPOS.telefono} ruta="/inventario/telefonos" lista="Teléfonos" registro={phone} opciones={opciones} />;
}
