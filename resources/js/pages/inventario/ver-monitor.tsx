import { Dato, type CasoRelacionado, type EquipoConectado } from '@/components/ficha';
import { FichaEquipo, type RegistroEquipo } from '@/components/inventario/ficha-equipo';
import { Monitor as MonitorIcon } from 'lucide-react';

interface Props {
    monitor: RegistroEquipo & { size: number | string | null };
    computer: EquipoConectado | null;
    /** Todos los computadores a los que está conectado (vínculos vigentes) */
    computers?: EquipoConectado[];
    tickets: CasoRelacionado[];
}

export default function VerMonitor({ monitor, computer, computers, tickets }: Props) {
    return (
        <FichaEquipo
            registro={monitor}
            ruta="/inventario/monitores"
            lista="Monitores"
            icono={<MonitorIcon className="size-5 text-huv-ink" aria-hidden="true" />}
            // size es decimal ("24.00"): se muestra solo si es mayor que 0, como antes
            antesDeLocalizacion={Number(monitor.size) > 0 && <Dato etiqueta="Tamaño">{`${Number(monitor.size)}"`}</Dato>}
            equipos={computers ?? (computer ? [computer] : [])}
            tickets={tickets}
        />
    );
}
