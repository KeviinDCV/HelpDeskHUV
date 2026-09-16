import { Dato, type CasoRelacionado, type EquipoConectado } from '@/components/ficha';
import { DatosResponsables, FichaEquipo, type RegistroEquipo } from '@/components/inventario/ficha-equipo';
import { Phone } from 'lucide-react';

interface Props {
    phone: RegistroEquipo & {
        contact: string | null;
        contact_num: string | null;
        tech_user_name: string | null;
        tech_group_name: string | null;
        user_name: string | null;
        group_name: string | null;
        number_line: string | null;
        brand: string | null;
        have_headset: number | null;
        have_hp: number | null;
    };
    computers: EquipoConectado[];
    tickets: CasoRelacionado[];
}

/** Ficha nueva: antes el enlace del listado y de la búsqueda llevaba a una página que no existía (405). */
export default function VerTelefono({ phone: r, computers, tickets }: Props) {
    return (
        <FichaEquipo
            registro={r}
            ruta="/inventario/telefonos"
            lista="Teléfonos"
            icono={<Phone className="size-5 text-huv-ink" aria-hidden="true" />}
            despuesDeLocalizacion={
                <>
                    <DatosResponsables r={r} />
                    <Dato etiqueta="Marca">{r.brand}</Dato>
                    <Dato etiqueta="Línea">{r.number_line}</Dato>
                    <Dato etiqueta="Auricular">{r.have_headset ? 'Sí' : 'No'}</Dato>
                    <Dato etiqueta="Altavoz">{r.have_hp ? 'Sí' : 'No'}</Dato>
                </>
            }
            equipos={computers}
            tickets={tickets}
        />
    );
}
