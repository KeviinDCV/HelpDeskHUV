import { Dato, type CasoRelacionado } from '@/components/ficha';
import { DatosResponsables, FichaEquipo, type RegistroEquipo } from '@/components/inventario/ficha-equipo';
import { Network } from 'lucide-react';

interface Props {
    networkequipment: RegistroEquipo & {
        contact: string | null;
        contact_num: string | null;
        ram: number | string | null;
        tech_user_name: string | null;
        tech_group_name: string | null;
        user_name: string | null;
        group_name: string | null;
        domain_name: string | null;
        ip?: string | null;
        mac?: string | null;
    };
    tickets: CasoRelacionado[];
}

export default function VerDispositivoRed({ networkequipment: n, tickets }: Props) {
    return (
        <FichaEquipo
            registro={n}
            ruta="/inventario/dispositivos-red"
            lista="Dispositivos de red"
            icono={<Network className="size-5 text-huv-ink" aria-hidden="true" />}
            despuesDeLocalizacion={
                <>
                    <Dato etiqueta="Dominio">{n.domain_name}</Dato>
                    <Dato etiqueta="Memoria (MB)">{n.ram || n.ram === 0 ? String(n.ram) : null}</Dato>
                    <DatosResponsables r={n} />
                    {n.ip && (
                        <Dato etiqueta="IP" mono>
                            {n.ip}
                        </Dato>
                    )}
                    {n.mac && (
                        <Dato etiqueta="MAC" mono>
                            {n.mac}
                        </Dato>
                    )}
                </>
            }
            tickets={tickets}
        />
    );
}
