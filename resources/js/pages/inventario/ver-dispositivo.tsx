import { Dato, type CasoRelacionado, type EquipoConectado } from '@/components/ficha';
import { DatosResponsables, FichaEquipo, type RegistroEquipo } from '@/components/inventario/ficha-equipo';
import { Keyboard } from 'lucide-react';

interface Props {
    peripheral: RegistroEquipo & {
        contact: string | null;
        contact_num: string | null;
        tech_user_name: string | null;
        tech_group_name: string | null;
        user_name: string | null;
        group_name: string | null;
        brand: string | null;
    };
    computers: EquipoConectado[];
    tickets: CasoRelacionado[];
}

/** Ficha nueva: antes el enlace del listado y de la búsqueda llevaba a una página que no existía (405). */
export default function VerDispositivo({ peripheral: r, computers, tickets }: Props) {
    return (
        <FichaEquipo
            registro={r}
            ruta="/inventario/dispositivos"
            lista="Dispositivos"
            icono={<Keyboard className="size-5 text-huv-ink" aria-hidden="true" />}
            despuesDeLocalizacion={
                <>
                    <DatosResponsables r={r} />
                    <Dato etiqueta="Marca">{r.brand}</Dato>
                </>
            }
            equipos={computers}
            tickets={tickets}
        />
    );
}
