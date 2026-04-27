<?php

namespace App\Services;

use App\Models\AgentDevice;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Procesa el payload del agente OCS-like y hace upsert en GLPI.
 *
 * Estrategia:
 *  1) Resolver/crear el computer en glpi_computers (por hardware_uuid -> serial -> hostname).
 *  2) Vincular usuario (windows_username -> glpi_users.name).
 *  3) Resolver dropdowns por nombre (manufacturer, model, type, location, OS, etc.).
 *  4) Reemplazar componentes dinámicos (is_dynamic = 1) marcándolos como borrados
 *     y reinsertando la lista nueva. Los registros manuales (is_dynamic = 0) NO se tocan.
 *  5) Hacer upsert de software, antivirus, volúmenes, OS y network ports.
 *
 * Todo dentro de una transacción para garantizar consistencia.
 */
class InventorySyncService
{
    public function sync(array $payload, AgentDevice $device, ?string $ipAddress = null): array
    {
        $stats = [
            'computer_id' => null,
            'created' => false,
            'components_synced' => [],
        ];

        DB::transaction(function () use ($payload, $device, $ipAddress, &$stats) {
            $general = Arr::get($payload, 'general', []);

            // 1) Resolver o crear computer
            [$computerId, $created] = $this->upsertComputer($general, $payload);
            $stats['computer_id'] = $computerId;
            $stats['created'] = $created;

            // 2) Componentes dinámicos
            $this->syncOperatingSystem($computerId, Arr::get($payload, 'operating_system', []));
            $stats['components_synced']['cpu']         = $this->syncProcessors($computerId, Arr::get($payload, 'cpus', []));
            $stats['components_synced']['memory']      = $this->syncMemories($computerId, Arr::get($payload, 'memories', []));
            $stats['components_synced']['harddrives']  = $this->syncHardDrives($computerId, Arr::get($payload, 'hard_drives', []));
            $stats['components_synced']['network']     = $this->syncNetworkCards($computerId, Arr::get($payload, 'network_cards', []));
            $stats['components_synced']['gpu']         = $this->syncGraphicCards($computerId, Arr::get($payload, 'graphic_cards', []));
            $stats['components_synced']['sound']       = $this->syncSoundCards($computerId, Arr::get($payload, 'sound_cards', []));
            $stats['components_synced']['motherboard'] = $this->syncMotherboard($computerId, Arr::get($payload, 'motherboard', []));
            $stats['components_synced']['firmware']    = $this->syncFirmware($computerId, Arr::get($payload, 'bios', []));
            $stats['components_synced']['volumes']     = $this->syncVolumes($computerId, Arr::get($payload, 'volumes', []));
            $stats['components_synced']['network_ports'] = $this->syncNetworkPorts($computerId, Arr::get($payload, 'network_ports', []));
            $stats['components_synced']['software']    = $this->syncSoftware($computerId, Arr::get($payload, 'software', []));
            $stats['components_synced']['antivirus']   = $this->syncAntivirus($computerId, Arr::get($payload, 'antivirus', []));
            $stats['components_synced']['monitors']    = $this->syncMonitors($computerId, Arr::get($payload, 'monitors', []));

            // 3) Actualizar agent_devices
            $device->update([
                'computer_id' => $computerId,
                'hostname' => Arr::get($general, 'hostname'),
                'serial' => Arr::get($general, 'serial'),
                'windows_username' => Arr::get($payload, 'windows_username'),
                'agent_version' => Arr::get($payload, 'agent_version'),
                'last_seen_at' => now(),
                'last_ip' => $ipAddress,
                'last_payload_summary' => $this->summarizePayload($payload, $stats),
                'last_error' => null,
                'sync_count' => $device->sync_count + 1,
            ]);

            // Marcar el computer como dinámico (provisto por agente)
            DB::table('glpi_computers')->where('id', $computerId)->update([
                'is_dynamic' => 1,
                'date_mod' => now(),
            ]);
        });

        return $stats;
    }

    // ---------------------------------------------------------------
    //  Computer principal
    // ---------------------------------------------------------------

    /**
     * @return array{0: int, 1: bool} [computer_id, created]
     */
    private function upsertComputer(array $general, array $payload): array
    {
        $hardwareUuid = Arr::get($payload, 'hardware_uuid');
        $serial = Arr::get($general, 'serial');
        $hostname = Arr::get($general, 'hostname');

        // Buscar por UUID primero, luego serial, luego hostname.
        $existing = null;
        if ($hardwareUuid) {
            $existing = DB::table('glpi_computers')
                ->where('uuid', $hardwareUuid)
                ->where('is_deleted', 0)
                ->first();
        }
        if (!$existing && $serial) {
            $existing = DB::table('glpi_computers')
                ->where('serial', $serial)
                ->where('is_deleted', 0)
                ->first();
        }
        if (!$existing && $hostname) {
            $existing = DB::table('glpi_computers')
                ->where('name', $hostname)
                ->where('is_deleted', 0)
                ->first();
        }

        // Resolver dropdowns
        $manufacturerId = $this->dropdownIdByName('glpi_manufacturers', Arr::get($general, 'manufacturer'));
        $modelId        = $this->dropdownIdByName('glpi_computermodels', Arr::get($general, 'model'));
        $typeId         = $this->dropdownIdByName('glpi_computertypes', Arr::get($general, 'type'));
        $domainId       = $this->dropdownIdByName('glpi_domains', Arr::get($general, 'domain'));
        $userId         = $this->resolveGlpiUserId(Arr::get($payload, 'windows_username'));

        $data = [
            'name' => $hostname ?: ($existing->name ?? 'PC-DESCONOCIDO'),
            'serial' => $serial ?: ($existing->serial ?? ''),
            'otherserial' => Arr::get($general, 'asset_tag', $existing->otherserial ?? ''),
            'uuid' => $hardwareUuid ?: ($existing->uuid ?? Str::uuid()->toString()),
            'manufacturers_id' => $manufacturerId ?: ($existing->manufacturers_id ?? 0),
            'computermodels_id' => $modelId ?: ($existing->computermodels_id ?? 0),
            'computertypes_id' => $typeId ?: ($existing->computertypes_id ?? 0),
            'domains_id' => $domainId ?: ($existing->domains_id ?? 0),
            'users_id' => $userId ?: ($existing->users_id ?? 0),
            'contact' => Arr::get($payload, 'windows_username') ?: ($existing->contact ?? ''),
            'date_mod' => now(),
        ];

        if ($existing) {
            DB::table('glpi_computers')->where('id', $existing->id)->update($data);
            return [(int) $existing->id, false];
        }

        // Crear nuevo
        $insertData = array_merge($data, [
            'entities_id' => 0,
            'states_id' => 0,
            'locations_id' => 0,
            'users_id_tech' => 0,
            'groups_id_tech' => 0,
            'groups_id' => 0,
            'networks_id' => 0,
            'autoupdatesystems_id' => 0,
            'contact_num' => '',
            'comment' => 'Creado automáticamente por agente de inventario',
            'is_deleted' => 0,
            'is_template' => 0,
            'is_dynamic' => 1,
            'is_recursive' => 0,
            'template_name' => '',
            'ticket_tco' => 0,
            'date_creation' => now(),
        ]);
        $id = DB::table('glpi_computers')->insertGetId($insertData);

        return [(int) $id, true];
    }

    // ---------------------------------------------------------------
    //  Helpers de dropdowns
    // ---------------------------------------------------------------

    /**
     * Devuelve el id del dropdown buscando por nombre. Si no existe, lo crea.
     */
    private function dropdownIdByName(string $table, ?string $name): int
    {
        if (!$name) {
            return 0;
        }
        $name = trim($name);
        if ($name === '') {
            return 0;
        }

        $row = DB::table($table)->where('name', $name)->first();
        if ($row) {
            return (int) $row->id;
        }

        // Insert mínimo (la mayoría de tablas dropdown comparten estas columnas)
        $columns = ['name' => $name];
        $tableColumns = $this->getColumns($table);
        if (in_array('entities_id', $tableColumns, true)) $columns['entities_id'] = 0;
        if (in_array('is_recursive', $tableColumns, true)) $columns['is_recursive'] = 0;
        if (in_array('comment', $tableColumns, true)) $columns['comment'] = '';
        if (in_array('date_mod', $tableColumns, true)) $columns['date_mod'] = now();
        if (in_array('date_creation', $tableColumns, true)) $columns['date_creation'] = now();
        if (in_array('completename', $tableColumns, true)) $columns['completename'] = $name;
        if (in_array('level', $tableColumns, true)) $columns['level'] = 1;

        return (int) DB::table($table)->insertGetId($columns);
    }

    private function resolveGlpiUserId(?string $username): int
    {
        if (!$username) return 0;
        $row = DB::table('glpi_users')
            ->where('name', $username)
            ->where('is_deleted', 0)
            ->first();
        return $row ? (int) $row->id : 0;
    }

    /**
     * Cache simple de columnas por tabla.
     */
    private array $columnsCache = [];
    private function getColumns(string $table): array
    {
        if (!isset($this->columnsCache[$table])) {
            $this->columnsCache[$table] = \Schema::getColumnListing($table);
        }
        return $this->columnsCache[$table];
    }

    // ---------------------------------------------------------------
    //  Sistema operativo
    // ---------------------------------------------------------------

    private function syncOperatingSystem(int $computerId, array $os): void
    {
        if (empty($os)) return;

        $osId      = $this->dropdownIdByName('glpi_operatingsystems', Arr::get($os, 'name'));
        $verId     = $this->dropdownIdByName('glpi_operatingsystemversions', Arr::get($os, 'version'));
        $archId    = $this->dropdownIdByName('glpi_operatingsystemarchitectures', Arr::get($os, 'architecture'));
        $kernelId  = $this->dropdownIdByName('glpi_operatingsystemkernelversions', Arr::get($os, 'kernel_version'));
        $editionId = $this->dropdownIdByName('glpi_operatingsystemeditions', Arr::get($os, 'edition'));

        // Borrar duro las filas OS dinámicas previas (las manuales is_dynamic=0 no se tocan)
        DB::table('glpi_items_operatingsystems')
            ->where('itemtype', 'Computer')
            ->where('items_id', $computerId)
            ->where('is_dynamic', 1)
            ->delete();

        DB::table('glpi_items_operatingsystems')->insert([
            'itemtype' => 'Computer',
            'items_id' => $computerId,
            'operatingsystems_id' => $osId,
            'operatingsystemversions_id' => $verId,
            'operatingsystemarchitectures_id' => $archId,
            'operatingsystemkernelversions_id' => $kernelId,
            'operatingsystemeditions_id' => $editionId,
            'operatingsystemservicepacks_id' => 0,
            'license_number' => Arr::get($os, 'license_key', ''),
            'license_id' => Arr::get($os, 'product_id', ''),
            'is_deleted' => 0,
            'is_dynamic' => 1,
            'is_recursive' => 0,
            'entities_id' => 0,
            'date_mod' => now(),
            'date_creation' => now(),
        ]);
    }

    // ---------------------------------------------------------------
    //  Helpers genéricos para componentes (device + items_device)
    // ---------------------------------------------------------------

    /**
     * Patrón común: borra los items dinámicos previos e inserta los nuevos.
     */
    private function replaceDynamicItems(string $itemsTable, int $computerId): void
    {
        // Borrado físico: sólo las filas marcadas como dinámicas (provistas por el agente).
        // Las filas manuales (is_dynamic=0) nunca se tocan.
        DB::table($itemsTable)
            ->where('itemtype', 'Computer')
            ->where('items_id', $computerId)
            ->where('is_dynamic', 1)
            ->delete();
    }

    private function deviceIdByDesignation(string $deviceTable, ?string $designation, int $manufacturerId = 0): int
    {
        if (!$designation) return 0;
        $designation = trim($designation);
        if ($designation === '') return 0;

        $row = DB::table($deviceTable)
            ->where('designation', $designation)
            ->where('manufacturers_id', $manufacturerId)
            ->first();
        if ($row) return (int) $row->id;

        $cols = ['designation' => $designation, 'manufacturers_id' => $manufacturerId];
        $available = $this->getColumns($deviceTable);
        if (in_array('entities_id', $available, true)) $cols['entities_id'] = 0;
        if (in_array('is_recursive', $available, true)) $cols['is_recursive'] = 0;
        if (in_array('comment', $available, true)) $cols['comment'] = '';
        if (in_array('date_mod', $available, true)) $cols['date_mod'] = now();
        if (in_array('date_creation', $available, true)) $cols['date_creation'] = now();
        return (int) DB::table($deviceTable)->insertGetId($cols);
    }

    // ---------------------------------------------------------------
    //  CPU
    // ---------------------------------------------------------------

    private function syncProcessors(int $computerId, array $cpus): int
    {
        $this->replaceDynamicItems('glpi_items_deviceprocessors', $computerId);

        $count = 0;
        foreach ($cpus as $cpu) {
            $mfgId = $this->dropdownIdByName('glpi_manufacturers', Arr::get($cpu, 'manufacturer'));
            $deviceId = $this->deviceIdByDesignation('glpi_deviceprocessors', Arr::get($cpu, 'designation'), $mfgId);

            DB::table('glpi_items_deviceprocessors')->insert([
                'itemtype' => 'Computer',
                'items_id' => $computerId,
                'deviceprocessors_id' => $deviceId,
                'frequency' => (int) Arr::get($cpu, 'frequency_mhz', 0),
                'serial' => (string) Arr::get($cpu, 'serial', ''),
                'nbcores' => (int) Arr::get($cpu, 'cores', 0),
                'nbthreads' => (int) Arr::get($cpu, 'threads', 0),
                'is_deleted' => 0,
                'is_dynamic' => 1,
                'is_recursive' => 0,
                'entities_id' => 0,
                'busID' => Arr::get($cpu, 'bus_id', ''),
                'otherserial' => '',
                'locations_id' => 0,
                'states_id' => 0,
            ]);
            $count++;
        }
        return $count;
    }

    // ---------------------------------------------------------------
    //  RAM
    // ---------------------------------------------------------------

    private function syncMemories(int $computerId, array $memories): int
    {
        $this->replaceDynamicItems('glpi_items_devicememories', $computerId);

        $count = 0;
        foreach ($memories as $mem) {
            $mfgId = $this->dropdownIdByName('glpi_manufacturers', Arr::get($mem, 'manufacturer'));
            $deviceId = $this->deviceIdByDesignation('glpi_devicememories', Arr::get($mem, 'designation'), $mfgId);

            DB::table('glpi_items_devicememories')->insert([
                'itemtype' => 'Computer',
                'items_id' => $computerId,
                'devicememories_id' => $deviceId,
                'size' => (int) Arr::get($mem, 'size_mb', 0),
                'serial' => (string) Arr::get($mem, 'serial', ''),
                'busID' => Arr::get($mem, 'slot', ''),
                'is_deleted' => 0,
                'is_dynamic' => 1,
                'is_recursive' => 0,
                'entities_id' => 0,
                'otherserial' => '',
                'locations_id' => 0,
                'states_id' => 0,
            ]);
            $count++;
        }
        return $count;
    }

    // ---------------------------------------------------------------
    //  Discos duros (SSD/HDD)
    // ---------------------------------------------------------------

    private function syncHardDrives(int $computerId, array $disks): int
    {
        $this->replaceDynamicItems('glpi_items_deviceharddrives', $computerId);

        $count = 0;
        foreach ($disks as $disk) {
            $mfgId = $this->dropdownIdByName('glpi_manufacturers', Arr::get($disk, 'manufacturer'));
            $deviceId = $this->deviceIdByDesignation('glpi_deviceharddrives', Arr::get($disk, 'designation'), $mfgId);

            DB::table('glpi_items_deviceharddrives')->insert([
                'itemtype' => 'Computer',
                'items_id' => $computerId,
                'deviceharddrives_id' => $deviceId,
                'capacity' => (int) Arr::get($disk, 'capacity_mb', 0),
                'serial' => (string) Arr::get($disk, 'serial', ''),
                'is_deleted' => 0,
                'is_dynamic' => 1,
                'is_recursive' => 0,
                'entities_id' => 0,
                'busID' => '',
                'otherserial' => '',
                'locations_id' => 0,
                'states_id' => 0,
            ]);
            $count++;
        }
        return $count;
    }

    // ---------------------------------------------------------------
    //  Tarjetas de red
    // ---------------------------------------------------------------

    private function syncNetworkCards(int $computerId, array $nics): int
    {
        $this->replaceDynamicItems('glpi_items_devicenetworkcards', $computerId);

        $count = 0;
        foreach ($nics as $nic) {
            $mfgId = $this->dropdownIdByName('glpi_manufacturers', Arr::get($nic, 'manufacturer'));
            $deviceId = $this->deviceIdByDesignation('glpi_devicenetworkcards', Arr::get($nic, 'designation'), $mfgId);

            DB::table('glpi_items_devicenetworkcards')->insert([
                'itemtype' => 'Computer',
                'items_id' => $computerId,
                'devicenetworkcards_id' => $deviceId,
                'mac' => (string) Arr::get($nic, 'mac', ''),
                'serial' => (string) Arr::get($nic, 'serial', ''),
                'busID' => Arr::get($nic, 'bus_id', ''),
                'is_deleted' => 0,
                'is_dynamic' => 1,
                'is_recursive' => 0,
                'entities_id' => 0,
                'otherserial' => '',
                'locations_id' => 0,
                'states_id' => 0,
            ]);
            $count++;
        }
        return $count;
    }

    // ---------------------------------------------------------------
    //  GPU
    // ---------------------------------------------------------------

    private function syncGraphicCards(int $computerId, array $gpus): int
    {
        $this->replaceDynamicItems('glpi_items_devicegraphiccards', $computerId);

        $count = 0;
        foreach ($gpus as $gpu) {
            $mfgId = $this->dropdownIdByName('glpi_manufacturers', Arr::get($gpu, 'manufacturer'));
            $deviceId = $this->deviceIdByDesignation('glpi_devicegraphiccards', Arr::get($gpu, 'designation'), $mfgId);

            DB::table('glpi_items_devicegraphiccards')->insert([
                'itemtype' => 'Computer',
                'items_id' => $computerId,
                'devicegraphiccards_id' => $deviceId,
                'memory' => (int) Arr::get($gpu, 'memory_mb', 0),
                'serial' => (string) Arr::get($gpu, 'serial', ''),
                'busID' => Arr::get($gpu, 'bus_id', ''),
                'is_deleted' => 0,
                'is_dynamic' => 1,
                'is_recursive' => 0,
                'entities_id' => 0,
                'otherserial' => '',
                'locations_id' => 0,
                'states_id' => 0,
            ]);
            $count++;
        }
        return $count;
    }

    // ---------------------------------------------------------------
    //  Sound cards
    // ---------------------------------------------------------------

    private function syncSoundCards(int $computerId, array $cards): int
    {
        $this->replaceDynamicItems('glpi_items_devicesoundcards', $computerId);

        $count = 0;
        foreach ($cards as $card) {
            $mfgId = $this->dropdownIdByName('glpi_manufacturers', Arr::get($card, 'manufacturer'));
            $deviceId = $this->deviceIdByDesignation('glpi_devicesoundcards', Arr::get($card, 'designation'), $mfgId);

            DB::table('glpi_items_devicesoundcards')->insert([
                'itemtype' => 'Computer',
                'items_id' => $computerId,
                'devicesoundcards_id' => $deviceId,
                'serial' => (string) Arr::get($card, 'serial', ''),
                'busID' => '',
                'is_deleted' => 0,
                'is_dynamic' => 1,
                'is_recursive' => 0,
                'entities_id' => 0,
                'otherserial' => '',
                'locations_id' => 0,
                'states_id' => 0,
            ]);
            $count++;
        }
        return $count;
    }

    // ---------------------------------------------------------------
    //  Motherboard
    // ---------------------------------------------------------------

    private function syncMotherboard(int $computerId, array $mb): int
    {
        if (empty($mb)) return 0;
        $this->replaceDynamicItems('glpi_items_devicemotherboards', $computerId);

        $mfgId = $this->dropdownIdByName('glpi_manufacturers', Arr::get($mb, 'manufacturer'));
        $deviceId = $this->deviceIdByDesignation('glpi_devicemotherboards', Arr::get($mb, 'designation'), $mfgId);

        DB::table('glpi_items_devicemotherboards')->insert([
            'itemtype' => 'Computer',
            'items_id' => $computerId,
            'devicemotherboards_id' => $deviceId,
            'serial' => (string) Arr::get($mb, 'serial', ''),
            'is_deleted' => 0,
            'is_dynamic' => 1,
            'is_recursive' => 0,
            'entities_id' => 0,
            'otherserial' => '',
            'locations_id' => 0,
            'states_id' => 0,
        ]);
        return 1;
    }

    // ---------------------------------------------------------------
    //  BIOS / Firmware
    // ---------------------------------------------------------------

    private function syncFirmware(int $computerId, array $bios): int
    {
        if (empty($bios)) return 0;
        $this->replaceDynamicItems('glpi_items_devicefirmwares', $computerId);

        $mfgId = $this->dropdownIdByName('glpi_manufacturers', Arr::get($bios, 'manufacturer'));
        $deviceId = $this->deviceIdByDesignation('glpi_devicefirmwares', Arr::get($bios, 'designation', 'BIOS'), $mfgId);

        DB::table('glpi_items_devicefirmwares')->insert([
            'itemtype' => 'Computer',
            'items_id' => $computerId,
            'devicefirmwares_id' => $deviceId,
            'serial' => (string) Arr::get($bios, 'serial', ''),
            'is_deleted' => 0,
            'is_dynamic' => 1,
            'is_recursive' => 0,
            'entities_id' => 0,
            'otherserial' => Arr::get($bios, 'version', ''),
            'locations_id' => 0,
            'states_id' => 0,
        ]);
        return 1;
    }

    // ---------------------------------------------------------------
    //  Volúmenes (discos lógicos)
    // ---------------------------------------------------------------

    private function syncVolumes(int $computerId, array $volumes): int
    {
        // Borrar duro volúmenes dinámicos previos (las filas manuales no se tocan)
        DB::table('glpi_items_disks')
            ->where('itemtype', 'Computer')
            ->where('items_id', $computerId)
            ->where('is_dynamic', 1)
            ->delete();

        $count = 0;
        foreach ($volumes as $vol) {
            $fsId = $this->dropdownIdByName('glpi_filesystems', Arr::get($vol, 'filesystem'));
            DB::table('glpi_items_disks')->insert([
                'itemtype' => 'Computer',
                'items_id' => $computerId,
                'name' => (string) Arr::get($vol, 'name', ''),
                'mountpoint' => (string) Arr::get($vol, 'mountpoint', ''),
                'device' => (string) Arr::get($vol, 'device', ''),
                'filesystems_id' => $fsId,
                'totalsize' => (int) Arr::get($vol, 'total_mb', 0),
                'freesize' => (int) Arr::get($vol, 'free_mb', 0),
                'is_deleted' => 0,
                'is_dynamic' => 1,
                'entities_id' => 0,
                'date_mod' => now(),
                'date_creation' => now(),
            ]);
            $count++;
        }
        return $count;
    }

    // ---------------------------------------------------------------
    //  Network ports (interfaces) + IPs
    // ---------------------------------------------------------------

    private function syncNetworkPorts(int $computerId, array $ports): int
    {
        // Borrar duro puertos dinámicos previos y sus IPs asociadas
        $oldPortIds = DB::table('glpi_networkports')
            ->where('itemtype', 'Computer')
            ->where('items_id', $computerId)
            ->where('is_dynamic', 1)
            ->pluck('id')->toArray();

        if (!empty($oldPortIds)) {
            // IPs ligadas a esos puertos (items_id = portId, itemtype='NetworkName')
            DB::table('glpi_ipaddresses')
                ->whereIn('items_id', $oldPortIds)
                ->where('itemtype', 'NetworkName')
                ->where('is_dynamic', 1)
                ->delete();
            // IPs vinculadas al equipo por mainitems
            DB::table('glpi_ipaddresses')
                ->where('mainitemtype', 'Computer')
                ->where('mainitems_id', $computerId)
                ->where('is_dynamic', 1)
                ->delete();
            DB::table('glpi_networkports')->whereIn('id', $oldPortIds)->delete();
        }

        $count = 0;
        foreach ($ports as $idx => $port) {
            $portId = DB::table('glpi_networkports')->insertGetId([
                'items_id' => $computerId,
                'itemtype' => 'Computer',
                'entities_id' => 0,
                'is_recursive' => 0,
                'logical_number' => $idx,
                'name' => (string) Arr::get($port, 'name', "eth{$idx}"),
                'instantiation_type' => 'NetworkPortEthernet',
                'mac' => (string) Arr::get($port, 'mac', ''),
                'comment' => '',
                'is_deleted' => 0,
                'is_dynamic' => 1,
                'date_mod' => now(),
                'date_creation' => now(),
            ]);

            foreach ((array) Arr::get($port, 'ips', []) as $ip) {
                if (!$ip) continue;
                $binary = $this->ipv4ToBinary($ip);
                DB::table('glpi_ipaddresses')->insert([
                    'entities_id' => 0,
                    'items_id' => $portId,
                    'itemtype' => 'NetworkName',
                    'version' => 4,
                    'name' => $ip,
                    'binary_0' => $binary[0],
                    'binary_1' => $binary[1],
                    'binary_2' => $binary[2],
                    'binary_3' => $binary[3],
                    'is_deleted' => 0,
                    'is_dynamic' => 1,
                    'mainitems_id' => $computerId,
                    'mainitemtype' => 'Computer',
                ]);
            }
            $count++;
        }
        return $count;
    }

    private function ipv4ToBinary(string $ip): array
    {
        // GLPI guarda IPv4 en los 4 últimos enteros (compatibilidad IPv6).
        // binary_0..2 = 0, binary_3 = entero IPv4. (Formato simplificado).
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return [0, 0, 0xFFFF, ip2long($ip) & 0xFFFFFFFF];
        }
        return [0, 0, 0, 0];
    }

    // ---------------------------------------------------------------
    //  Software instalado
    // ---------------------------------------------------------------

    private function syncSoftware(int $computerId, array $software): int
    {
        // Marcar todas las versiones dinámicas previas como eliminadas para este equipo
        DB::table('glpi_computers_softwareversions')
            ->where('computers_id', $computerId)
            ->where('is_dynamic', 1)
            ->update(['is_deleted' => 1, 'is_deleted_computer' => 1]);

        $count = 0;
        foreach ($software as $sw) {
            $name = trim((string) Arr::get($sw, 'name', ''));
            if ($name === '') continue;
            $version = trim((string) Arr::get($sw, 'version', '')) ?: 'unknown';
            $publisher = Arr::get($sw, 'publisher');

            $mfgId = $this->dropdownIdByName('glpi_manufacturers', $publisher);

            // Software (firstOrCreate)
            $softId = (int) DB::table('glpi_softwares')->where('name', $name)->value('id');
            if (!$softId) {
                $softId = (int) DB::table('glpi_softwares')->insertGetId([
                    'entities_id' => 0,
                    'is_recursive' => 0,
                    'name' => $name,
                    'manufacturers_id' => $mfgId,
                    'is_deleted' => 0,
                    'is_template' => 0,
                    'is_helpdesk_visible' => 1,
                    'is_valid' => 1,
                    'is_update' => 0,
                    'softwares_id' => 0,
                    'softwarecategories_id' => 0,
                    'locations_id' => 0,
                    'users_id_tech' => 0,
                    'groups_id_tech' => 0,
                    'users_id' => 0,
                    'groups_id' => 0,
                    'template_name' => '',
                    'date_mod' => now(),
                    'date_creation' => now(),
                ]);
            }

            // SoftwareVersion (firstOrCreate)
            $verId = (int) DB::table('glpi_softwareversions')
                ->where('softwares_id', $softId)
                ->where('name', $version)
                ->value('id');
            if (!$verId) {
                $verId = (int) DB::table('glpi_softwareversions')->insertGetId([
                    'entities_id' => 0,
                    'is_recursive' => 0,
                    'softwares_id' => $softId,
                    'states_id' => 0,
                    'name' => $version,
                    'operatingsystems_id' => 0,
                    'date_mod' => now(),
                    'date_creation' => now(),
                ]);
            }

            // Pivot computer-version (upsert)
            $existing = DB::table('glpi_computers_softwareversions')
                ->where('computers_id', $computerId)
                ->where('softwareversions_id', $verId)
                ->first();
            if ($existing) {
                DB::table('glpi_computers_softwareversions')->where('id', $existing->id)->update([
                    'is_deleted' => 0,
                    'is_deleted_computer' => 0,
                    'is_dynamic' => 1,
                ]);
            } else {
                DB::table('glpi_computers_softwareversions')->insert([
                    'computers_id' => $computerId,
                    'softwareversions_id' => $verId,
                    'is_deleted' => 0,
                    'is_deleted_computer' => 0,
                    'is_template_computer' => 0,
                    'is_dynamic' => 1,
                    'entities_id' => 0,
                    'date_install' => now()->toDateString(),
                ]);
            }
            $count++;
        }
        return $count;
    }

    // ---------------------------------------------------------------
    //  Antivirus
    // ---------------------------------------------------------------

    private function syncAntivirus(int $computerId, array $items): int
    {
        // Borrado físico de filas dinámicas previas (las manuales is_dynamic=0 no se tocan)
        DB::table('glpi_computerantiviruses')
            ->where('computers_id', $computerId)
            ->where('is_dynamic', 1)
            ->delete();

        $count = 0;
        foreach ($items as $av) {
            $mfgId = $this->dropdownIdByName('glpi_manufacturers', Arr::get($av, 'manufacturer'));
            DB::table('glpi_computerantiviruses')->insert([
                'computers_id' => $computerId,
                'name' => (string) Arr::get($av, 'name', ''),
                'manufacturers_id' => $mfgId,
                'antivirus_version' => (string) Arr::get($av, 'version', ''),
                'signature_version' => (string) Arr::get($av, 'signature_version', ''),
                'is_active' => Arr::get($av, 'enabled', false) ? 1 : 0,
                'is_uptodate' => Arr::get($av, 'up_to_date', false) ? 1 : 0,
                'is_dynamic' => 1,
                'is_deleted' => 0,
                'date_expiration' => Arr::get($av, 'expiration_date'),
                'date_mod' => now(),
                'date_creation' => now(),
            ]);
            $count++;
        }
        return $count;
    }

    // ---------------------------------------------------------------
    //  Monitores conectados (no se reemplazan: solo se asocia/se reporta)
    // ---------------------------------------------------------------

    private function syncMonitors(int $computerId, array $monitors): int
    {
        // Para cada monitor reportado:
        //  - firstOrCreate en glpi_monitors por serial.
        //  - vincular en glpi_computers_items.
        $count = 0;
        foreach ($monitors as $mon) {
            $serial = trim((string) Arr::get($mon, 'serial', ''));
            $name = (string) Arr::get($mon, 'name', $serial ?: 'Monitor');
            if (!$serial && !$name) continue;

            $mfgId = $this->dropdownIdByName('glpi_manufacturers', Arr::get($mon, 'manufacturer'));
            $modelId = $this->dropdownIdByName('glpi_monitormodels', Arr::get($mon, 'model'));

            $monitorId = $serial
                ? (int) DB::table('glpi_monitors')->where('serial', $serial)->where('is_deleted', 0)->value('id')
                : 0;

            if (!$monitorId) {
                $monitorId = (int) DB::table('glpi_monitors')->insertGetId([
                    'entities_id' => 0,
                    'name' => $name,
                    'serial' => $serial,
                    'manufacturers_id' => $mfgId,
                    'monitormodels_id' => $modelId,
                    'monitortypes_id' => 0,
                    'states_id' => 0,
                    'locations_id' => 0,
                    'users_id' => 0,
                    'users_id_tech' => 0,
                    'groups_id' => 0,
                    'groups_id_tech' => 0,
                    'is_deleted' => 0,
                    'is_template' => 0,
                    'is_dynamic' => 1,
                    'is_recursive' => 0,
                    'is_global' => 0,
                    'comment' => '',
                    'contact' => '',
                    'contact_num' => '',
                    'otherserial' => '',
                    'size' => Arr::get($mon, 'size_inches', 0) ?: 0,
                    'have_micro' => 0,
                    'have_speaker' => 0,
                    'have_subd' => 0,
                    'have_bnc' => 0,
                    'have_dvi' => 0,
                    'have_pivot' => 0,
                    'have_hdmi' => 0,
                    'have_displayport' => 0,
                    'date_mod' => now(),
                    'date_creation' => now(),
                    'template_name' => '',
                    'ticket_tco' => 0,
                ]);
            }

            // Vincular monitor con computer
            $exists = DB::table('glpi_computers_items')
                ->where('computers_id', $computerId)
                ->where('itemtype', 'Monitor')
                ->where('items_id', $monitorId)
                ->exists();
            if (!$exists) {
                DB::table('glpi_computers_items')->insert([
                    'computers_id' => $computerId,
                    'itemtype' => 'Monitor',
                    'items_id' => $monitorId,
                    'is_deleted' => 0,
                    'is_dynamic' => 1,
                ]);
            }
            $count++;
        }
        return $count;
    }

    // ---------------------------------------------------------------
    //  Resumen del payload (para auditoría en agent_devices.last_payload_summary)
    // ---------------------------------------------------------------

    private function summarizePayload(array $payload, array $stats): array
    {
        return [
            'hardware_uuid' => Arr::get($payload, 'hardware_uuid'),
            'hostname' => Arr::get($payload, 'general.hostname'),
            'serial' => Arr::get($payload, 'general.serial'),
            'agent_version' => Arr::get($payload, 'agent_version'),
            'os_name' => Arr::get($payload, 'operating_system.name'),
            'cpu_count' => count(Arr::get($payload, 'cpus', [])),
            'memory_count' => count(Arr::get($payload, 'memories', [])),
            'disk_count' => count(Arr::get($payload, 'hard_drives', [])),
            'software_count' => count(Arr::get($payload, 'software', [])),
            'monitor_count' => count(Arr::get($payload, 'monitors', [])),
            'components_synced' => $stats['components_synced'] ?? [],
            'created_new_computer' => $stats['created'] ?? false,
        ];
    }
}
