<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Valida el payload completo del agente de inventario.
 *
 * El payload se valida de forma laxa (todo nullable salvo hardware_uuid)
 * porque el agente puede no tener permisos para leer ciertas piezas.
 */
class InventorySyncRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Autorización se maneja por middleware Sanctum (ability:agent:sync).
        return true;
    }

    public function rules(): array
    {
        return [
            'hardware_uuid' => 'required|string|max:191',
            'agent_version' => 'nullable|string|max:50',
            'windows_username' => 'nullable|string|max:191',

            'general' => 'nullable|array',
            'general.hostname' => 'nullable|string|max:255',
            'general.serial' => 'nullable|string|max:255',
            'general.asset_tag' => 'nullable|string|max:255',
            'general.manufacturer' => 'nullable|string|max:255',
            'general.model' => 'nullable|string|max:255',
            'general.type' => 'nullable|string|max:255',
            'general.domain' => 'nullable|string|max:255',

            'operating_system' => 'nullable|array',
            'operating_system.name' => 'nullable|string|max:255',
            'operating_system.version' => 'nullable|string|max:255',
            'operating_system.architecture' => 'nullable|string|max:50',
            'operating_system.kernel_version' => 'nullable|string|max:255',
            'operating_system.edition' => 'nullable|string|max:255',
            'operating_system.license_key' => 'nullable|string|max:255',
            'operating_system.product_id' => 'nullable|string|max:255',

            'cpus' => 'nullable|array',
            'cpus.*.designation' => 'nullable|string|max:255',
            'cpus.*.manufacturer' => 'nullable|string|max:255',
            'cpus.*.frequency_mhz' => 'nullable|integer',
            'cpus.*.cores' => 'nullable|integer',
            'cpus.*.threads' => 'nullable|integer',
            'cpus.*.serial' => 'nullable|string|max:255',
            'cpus.*.bus_id' => 'nullable|string|max:255',

            'memories' => 'nullable|array',
            'memories.*.designation' => 'nullable|string|max:255',
            'memories.*.manufacturer' => 'nullable|string|max:255',
            'memories.*.size_mb' => 'nullable|integer',
            'memories.*.serial' => 'nullable|string|max:255',
            'memories.*.slot' => 'nullable|string|max:255',

            'hard_drives' => 'nullable|array',
            'hard_drives.*.designation' => 'nullable|string|max:255',
            'hard_drives.*.manufacturer' => 'nullable|string|max:255',
            'hard_drives.*.capacity_mb' => 'nullable|integer',
            'hard_drives.*.serial' => 'nullable|string|max:255',
            'hard_drives.*.type' => 'nullable|string|max:50', // SSD/HDD/NVMe

            'network_cards' => 'nullable|array',
            'network_cards.*.designation' => 'nullable|string|max:255',
            'network_cards.*.manufacturer' => 'nullable|string|max:255',
            'network_cards.*.mac' => 'nullable|string|max:50',
            'network_cards.*.serial' => 'nullable|string|max:255',
            'network_cards.*.bus_id' => 'nullable|string|max:255',

            'graphic_cards' => 'nullable|array',
            'graphic_cards.*.designation' => 'nullable|string|max:255',
            'graphic_cards.*.manufacturer' => 'nullable|string|max:255',
            'graphic_cards.*.memory_mb' => 'nullable|integer',
            'graphic_cards.*.serial' => 'nullable|string|max:255',
            'graphic_cards.*.bus_id' => 'nullable|string|max:255',

            'sound_cards' => 'nullable|array',
            'sound_cards.*.designation' => 'nullable|string|max:255',
            'sound_cards.*.manufacturer' => 'nullable|string|max:255',
            'sound_cards.*.serial' => 'nullable|string|max:255',

            'motherboard' => 'nullable|array',
            'motherboard.designation' => 'nullable|string|max:255',
            'motherboard.manufacturer' => 'nullable|string|max:255',
            'motherboard.serial' => 'nullable|string|max:255',

            'bios' => 'nullable|array',
            'bios.designation' => 'nullable|string|max:255',
            'bios.manufacturer' => 'nullable|string|max:255',
            'bios.version' => 'nullable|string|max:255',
            'bios.serial' => 'nullable|string|max:255',
            'bios.date' => 'nullable|string|max:50',

            'volumes' => 'nullable|array',
            'volumes.*.name' => 'nullable|string|max:255',
            'volumes.*.mountpoint' => 'nullable|string|max:255',
            'volumes.*.device' => 'nullable|string|max:255',
            'volumes.*.filesystem' => 'nullable|string|max:50',
            'volumes.*.total_mb' => 'nullable|integer',
            'volumes.*.free_mb' => 'nullable|integer',

            'network_ports' => 'nullable|array',
            'network_ports.*.name' => 'nullable|string|max:255',
            'network_ports.*.mac' => 'nullable|string|max:50',
            'network_ports.*.ips' => 'nullable|array',
            'network_ports.*.ips.*' => 'nullable|string|max:50',

            'software' => 'nullable|array',
            'software.*.name' => 'required|string|max:255',
            'software.*.version' => 'nullable|string|max:255',
            'software.*.publisher' => 'nullable|string|max:255',

            'antivirus' => 'nullable|array',
            'antivirus.*.name' => 'nullable|string|max:255',
            'antivirus.*.manufacturer' => 'nullable|string|max:255',
            'antivirus.*.version' => 'nullable|string|max:255',
            'antivirus.*.signature_version' => 'nullable|string|max:255',
            'antivirus.*.enabled' => 'nullable|boolean',
            'antivirus.*.up_to_date' => 'nullable|boolean',
            'antivirus.*.expiration_date' => 'nullable|date',

            'monitors' => 'nullable|array',
            'monitors.*.name' => 'nullable|string|max:255',
            'monitors.*.serial' => 'nullable|string|max:255',
            'monitors.*.manufacturer' => 'nullable|string|max:255',
            'monitors.*.model' => 'nullable|string|max:255',
            'monitors.*.size_inches' => 'nullable|numeric',
            'monitors.*.resolution' => 'nullable|string|max:50',
        ];
    }
}
