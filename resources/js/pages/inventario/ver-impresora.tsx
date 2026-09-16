import { Dato, type CasoRelacionado } from '@/components/ficha';
import { FichaEquipo, type RegistroEquipo } from '@/components/inventario/ficha-equipo';
import { Printer } from 'lucide-react';

interface Props {
    printer: RegistroEquipo & {
        tech_name: string | null;
        tech_group_name: string | null;
        domain_name?: string | null;
        contact?: string | null;
        contact_num?: string | null;
        memory_size?: string | null;
        have_serial?: number | string | null;
        have_parallel?: number | string | null;
        have_usb?: number | string | null;
        have_ethernet?: number | string | null;
        have_wifi?: number | string | null;
        ip_addresses: string[];
        ip_networks: string[];
    };
    tickets: CasoRelacionado[];
}

const CONEXIONES = [
    ['have_serial', 'Puerto serial'],
    ['have_parallel', 'Puerto paralelo'],
    ['have_usb', 'Puerto USB'],
    ['have_ethernet', 'Ethernet'],
    ['have_wifi', 'Wi-Fi'],
] as const;

export default function VerImpresora({ printer: p, tickets }: Props) {
    const ips = p.ip_addresses ?? [];
    const redes = p.ip_networks ?? [];
    const conexiones = CONEXIONES.filter(([clave]) => Number(p[clave]) === 1).map(([, texto]) => texto);

    return (
        <FichaEquipo
            registro={p}
            ruta="/inventario/impresoras"
            lista="Impresoras"
            icono={<Printer className="size-5 text-huv-ink" aria-hidden="true" />}
            antesDeLocalizacion={
                ips.length > 0 && (
                    <Dato etiqueta="Direcciones IP">
                        <ul className="flex flex-wrap gap-1.5">
                            {ips.map((ip, i) => (
                                <li key={`${ip}-${i}`} className="rounded-md bg-[#f3f4f6] px-2 py-0.5 font-mono text-xs text-gray-800 dark:bg-white/10">
                                    {ip}
                                </li>
                            ))}
                        </ul>
                    </Dato>
                )
            }
            despuesDeLocalizacion={
                <>
                    {p.tech_name && <Dato etiqueta="Técnico">{p.tech_name}</Dato>}
                    {p.tech_group_name && <Dato etiqueta="Grupo técnico">{p.tech_group_name}</Dato>}
                    {redes.length > 0 && <Dato etiqueta={redes.length === 1 ? 'Red IP' : 'Redes IP'}>{redes.join(', ')}</Dato>}
                    <Dato etiqueta="Dominio">{p.domain_name}</Dato>
                    <Dato etiqueta="Conexiones">{conexiones.join(', ')}</Dato>
                    <Dato etiqueta="Memoria">{p.memory_size}</Dato>
                    <Dato etiqueta="Contacto">{p.contact}</Dato>
                    <Dato etiqueta="Teléfono de contacto">{p.contact_num}</Dato>
                </>
            }
            tickets={tickets}
        />
    );
}
