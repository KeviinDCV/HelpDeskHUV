<?php

namespace App\Services;

use App\Models\AgentDevice;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Detecta y registra los cambios de inventario de un equipo.
 *
 * El agente envía una "foto" completa cada vez que sincroniza. El servidor, antes de
 * reemplazar los datos en BD, captura el estado previo ({@see captureBefore}) y luego
 * lo compara contra la foto nueva ({@see record}) para escribir en `inventory_history`
 * sólo las diferencias (alta / baja / modificación).
 *
 * Cada elemento se normaliza a ['key' => identidad estable, 'label' => texto, 'value' => texto comparable].
 * El diff es genérico: si una key está sólo en la foto nueva => agregado; sólo en la previa => eliminado;
 * en ambas con distinto value => modificado.
 *
 * Nada de esta clase debe poder romper el sync: el llamador envuelve todo en try/catch.
 */
class InventoryHistoryRecorder
{
    /**
     * Captura el estado dinámico actual (provisto por el agente) del equipo, normalizado por categoría.
     * Debe llamarse ANTES de que el sync reemplace los datos.
     *
     * @return array<string, array<int, array{key:string,label:string,value:string}>>
     */
    public function captureBefore(int $computerId): array
    {
        return [
            'disks'     => $this->normalizeDisks($this->beforeDisks($computerId), true),
            'ram'       => $this->normalizeRam($this->beforeRam($computerId), true),
            'cpu'       => $this->normalizeCpu($this->beforeCpu($computerId), true),
            'gpu'       => $this->normalizeGpu($this->beforeGpu($computerId), true),
            'nic'       => $this->normalizeNic($this->beforeNic($computerId), true),
            'sound'     => $this->normalizeSimpleDevice($this->beforeSound($computerId), 'Tarjeta de sonido', true),
            'mb'        => $this->normalizeMotherboard($this->beforeMotherboard($computerId), true),
            'bios'      => $this->normalizeBios($this->beforeBios($computerId), true),
            'software'  => $this->normalizeSoftware($this->beforeSoftware($computerId), true),
            'os'        => $this->normalizeOs($this->beforeOs($computerId), true),
            'antivirus' => $this->normalizeAntivirus($this->beforeAntivirus($computerId), true),
            'network'   => $this->normalizeNetwork($this->beforeNetwork($computerId), true),
        ];
    }

    /**
     * Compara el estado previo contra la foto nueva del payload y registra los cambios.
     */
    public function record(int $computerId, ?object $existingComputer, array $before, array $payload, AgentDevice $device, bool $firstSync): void
    {
        $events = [];

        // Primera sincronización real (dispositivo nuevo y sin estado previo): no inundamos el
        // historial con "agregado" por cada componente; dejamos un único hito de inventario inicial.
        if ($firstSync) {
            $events[] = [
                'category' => 'baseline',
                'action' => 'baseline',
                'field' => null,
                'old_value' => null,
                'new_value' => null,
                'summary' => 'Inventario inicial registrado por el agente.',
            ];
        } else {
            // ---- Hardware ----
            $this->emit($events, 'hardware_disk',
                $before['disks'] ?? [], $this->normalizeDisks(Arr::get($payload, 'hard_drives', []), false), [
                'added' => fn($a) => "Disco agregado: {$a['value']}",
                'removed' => fn($b) => "Disco eliminado: {$b['value']}",
                'modified' => fn($b, $a) => "Disco modificado: {$b['value']} → {$a['value']}",
            ]);

            $this->emit($events, 'hardware_ram',
                $before['ram'] ?? [], $this->normalizeRam(Arr::get($payload, 'memories', []), false), [
                'added' => fn($a) => "Memoria RAM agregada ({$a['label']}): {$a['value']}",
                'removed' => fn($b) => "Memoria RAM retirada ({$b['label']}): {$b['value']}",
                'modified' => fn($b, $a) => "Memoria RAM modificada ({$a['label']}): {$b['value']} → {$a['value']}",
            ]);

            $this->emit($events, 'hardware_cpu',
                $before['cpu'] ?? [], $this->normalizeCpu(Arr::get($payload, 'cpus', []), false), [
                'added' => fn($a) => "Procesador agregado: {$a['value']}",
                'removed' => fn($b) => "Procesador retirado: {$b['value']}",
                'modified' => fn($b, $a) => "Procesador modificado: {$b['value']} → {$a['value']}",
            ]);

            $this->emit($events, 'hardware_gpu',
                $before['gpu'] ?? [], $this->normalizeGpu(Arr::get($payload, 'graphic_cards', []), false), [
                'added' => fn($a) => "Tarjeta de video agregada: {$a['value']}",
                'removed' => fn($b) => "Tarjeta de video retirada: {$b['value']}",
                'modified' => fn($b, $a) => "Tarjeta de video modificada: {$b['value']} → {$a['value']}",
            ]);

            $this->emit($events, 'hardware_network',
                $before['nic'] ?? [], $this->normalizeNic(Arr::get($payload, 'network_cards', []), false), [
                'added' => fn($a) => "Tarjeta de red agregada: {$a['value']}",
                'removed' => fn($b) => "Tarjeta de red retirada: {$b['value']}",
                'modified' => fn($b, $a) => "Tarjeta de red modificada: {$b['value']} → {$a['value']}",
            ]);

            $this->emit($events, 'hardware_sound',
                $before['sound'] ?? [], $this->normalizeSimpleDevice(Arr::get($payload, 'sound_cards', []), 'Tarjeta de sonido', false), [
                'added' => fn($a) => "Tarjeta de sonido agregada: {$a['value']}",
                'removed' => fn($b) => "Tarjeta de sonido retirada: {$b['value']}",
                'modified' => fn($b, $a) => "Tarjeta de sonido modificada: {$b['value']} → {$a['value']}",
            ]);

            $mbAfter = ($mb = Arr::get($payload, 'motherboard', [])) ? [$mb] : [];
            $this->emit($events, 'hardware_motherboard',
                $before['mb'] ?? [], $this->normalizeMotherboard($mbAfter, false), [
                'added' => fn($a) => "Placa base registrada: {$a['value']}",
                'removed' => fn($b) => "Placa base retirada: {$b['value']}",
                'modified' => fn($b, $a) => "Placa base modificada: {$b['value']} → {$a['value']}",
            ]);

            $biosAfter = ($bios = Arr::get($payload, 'bios', [])) ? [$bios] : [];
            $this->emit($events, 'hardware_bios',
                $before['bios'] ?? [], $this->normalizeBios($biosAfter, false), [
                'added' => fn($a) => "BIOS registrada: {$a['value']}",
                'removed' => fn($b) => "BIOS retirada: {$b['value']}",
                'modified' => fn($b, $a) => "BIOS actualizada: {$b['value']} → {$a['value']}",
            ]);

            // ---- Software ----
            $this->emit($events, 'software',
                $before['software'] ?? [], $this->normalizeSoftware(Arr::get($payload, 'software', []), false), [
                'added' => fn($a) => "Software instalado: {$a['label']}" . ($a['value'] !== '' ? " {$a['value']}" : ''),
                'removed' => fn($b) => "Software desinstalado: {$b['label']}" . ($b['value'] !== '' ? " {$b['value']}" : ''),
                'modified' => fn($b, $a) => "Software actualizado: {$a['label']} {$b['value']} → {$a['value']}",
            ]);

            // ---- Sistema operativo ----
            $osAfter = ($os = Arr::get($payload, 'operating_system', [])) ? [$os] : [];
            $this->emit($events, 'os',
                $before['os'] ?? [], $this->normalizeOs($osAfter, false), [
                'added' => fn($a) => "Sistema operativo: {$a['value']}",
                'removed' => fn($b) => "Sistema operativo retirado: {$b['value']}",
                'modified' => fn($b, $a) => "Sistema operativo: {$b['value']} → {$a['value']}",
            ]);

            // ---- Antivirus ----
            $this->emit($events, 'antivirus',
                $before['antivirus'] ?? [], $this->normalizeAntivirus(Arr::get($payload, 'antivirus', []), false), [
                'added' => fn($a) => "Antivirus agregado: {$a['label']} ({$a['value']})",
                'removed' => fn($b) => "Antivirus retirado: {$b['label']}",
                'modified' => fn($b, $a) => "Antivirus {$a['label']}: {$b['value']} → {$a['value']}",
            ]);

            // ---- Red ----
            $this->emit($events, 'network',
                $before['network'] ?? [], $this->normalizeNetwork(Arr::get($payload, 'network_ports', []), false), [
                'added' => fn($a) => "Interfaz de red agregada: {$a['value']}",
                'removed' => fn($b) => "Interfaz de red eliminada: {$b['value']}",
                'modified' => fn($b, $a) => "Red modificada: {$b['value']} → {$a['value']}",
            ]);

            // ---- Identidad ----
            $this->diffIdentity($events, $existingComputer, Arr::get($payload, 'general', []), $payload);
        }

        if (empty($events)) {
            return;
        }

        $now = now();
        $rows = array_map(fn($e) => array_merge($e, [
            // 'field' es VARCHAR(191): truncar por seguridad (p.ej. nombres de software muy largos)
            // para que un insert nunca falle y se pierda el evento.
            'field' => $e['field'] !== null ? mb_substr((string) $e['field'], 0, 191) : null,
            'itemtype' => 'Computer',
            'items_id' => $computerId,
            'source' => 'agent',
            'agent_device_id' => $device->id ?? null,
            'changed_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]), $events);

        DB::table('inventory_history')->insert($rows);
    }

    // ===============================================================
    //  Diff genérico
    // ===============================================================

    /**
     * @param array<int, array{key:string,label:string,value:string}> $before
     * @param array<int, array{key:string,label:string,value:string}> $after
     * @param array{added:callable,removed:callable,modified:callable} $tpl
     */
    private function emit(array &$events, string $category, array $before, array $after, array $tpl): void
    {
        $bi = [];
        foreach ($before as $b) {
            $bi[$b['key']] = $b;
        }
        $ai = [];
        foreach ($after as $a) {
            $ai[$a['key']] = $a;
        }

        foreach ($ai as $k => $a) {
            if (!isset($bi[$k])) {
                $events[] = ['category' => $category, 'action' => 'added', 'field' => $a['label'], 'old_value' => null, 'new_value' => $a['value'], 'summary' => $tpl['added']($a)];
            } elseif ($bi[$k]['value'] !== $a['value']) {
                $events[] = ['category' => $category, 'action' => 'modified', 'field' => $a['label'], 'old_value' => $bi[$k]['value'], 'new_value' => $a['value'], 'summary' => $tpl['modified']($bi[$k], $a)];
            }
        }
        foreach ($bi as $k => $b) {
            if (!isset($ai[$k])) {
                $events[] = ['category' => $category, 'action' => 'removed', 'field' => $b['label'], 'old_value' => $b['value'], 'new_value' => null, 'summary' => $tpl['removed']($b)];
            }
        }
    }

    // ===============================================================
    //  Identidad (campos de glpi_computers)
    // ===============================================================

    private function diffIdentity(array &$events, ?object $existing, array $general, array $payload): void
    {
        if (!$existing) {
            return;
        }

        $fields = [
            ['label' => 'Nombre del equipo', 'old' => $existing->name ?? '', 'new' => Arr::get($general, 'hostname', '')],
            ['label' => 'Serial', 'old' => $existing->serial ?? '', 'new' => Arr::get($general, 'serial', '')],
            ['label' => 'Fabricante', 'old' => $this->nameById('glpi_manufacturers', $existing->manufacturers_id ?? 0), 'new' => Arr::get($general, 'manufacturer', '')],
            ['label' => 'Modelo', 'old' => $this->nameById('glpi_computermodels', $existing->computermodels_id ?? 0), 'new' => Arr::get($general, 'model', '')],
            ['label' => 'Tipo', 'old' => $this->nameById('glpi_computertypes', $existing->computertypes_id ?? 0), 'new' => Arr::get($general, 'type', '')],
            ['label' => 'Dominio', 'old' => $this->nameById('glpi_domains', $existing->domains_id ?? 0), 'new' => Arr::get($general, 'domain', '')],
            // 'contact' guarda el windows_username de la sincronización anterior: mismo formato crudo
            // que el nuevo, evitando falsos positivos cuando el usuario no existe en glpi_users.
            ['label' => 'Usuario asignado', 'old' => $existing->contact ?? '', 'new' => Arr::get($payload, 'windows_username', '')],
        ];

        foreach ($fields as $f) {
            $old = trim((string) $f['old']);
            $new = trim((string) $f['new']);
            if ($new === '') {
                continue; // el agente no reportó este campo; no lo tratamos como borrado
            }
            if (mb_strtolower($old) === mb_strtolower($new)) {
                continue;
            }
            $oldDisplay = $old !== '' ? $old : '(vacío)';
            $events[] = [
                'category' => 'identity',
                'action' => 'modified',
                'field' => $f['label'],
                'old_value' => $oldDisplay,
                'new_value' => $new,
                'summary' => "{$f['label']}: {$oldDisplay} → {$new}",
            ];
        }
    }

    // ===============================================================
    //  Lectura del estado previo (BD) — sólo filas dinámicas (del agente)
    // ===============================================================

    private function beforeDisks(int $id)
    {
        return DB::table('glpi_items_deviceharddrives as i')
            ->leftJoin('glpi_deviceharddrives as d', 'i.deviceharddrives_id', '=', 'd.id')
            ->where('i.itemtype', 'Computer')->where('i.items_id', $id)->where('i.is_dynamic', 1)
            ->get(['d.designation', 'i.serial', 'i.capacity']);
    }

    private function beforeRam(int $id)
    {
        return DB::table('glpi_items_devicememories as i')
            ->leftJoin('glpi_devicememories as d', 'i.devicememories_id', '=', 'd.id')
            ->where('i.itemtype', 'Computer')->where('i.items_id', $id)->where('i.is_dynamic', 1)
            ->get(['d.designation', 'i.serial', 'i.size', 'i.busID']);
    }

    private function beforeCpu(int $id)
    {
        return DB::table('glpi_items_deviceprocessors as i')
            ->leftJoin('glpi_deviceprocessors as d', 'i.deviceprocessors_id', '=', 'd.id')
            ->where('i.itemtype', 'Computer')->where('i.items_id', $id)->where('i.is_dynamic', 1)
            ->get(['d.designation', 'i.serial', 'i.frequency', 'i.nbcores', 'i.nbthreads']);
    }

    private function beforeGpu(int $id)
    {
        return DB::table('glpi_items_devicegraphiccards as i')
            ->leftJoin('glpi_devicegraphiccards as d', 'i.devicegraphiccards_id', '=', 'd.id')
            ->where('i.itemtype', 'Computer')->where('i.items_id', $id)->where('i.is_dynamic', 1)
            ->get(['d.designation', 'i.serial', 'i.memory']);
    }

    private function beforeNic(int $id)
    {
        return DB::table('glpi_items_devicenetworkcards as i')
            ->leftJoin('glpi_devicenetworkcards as d', 'i.devicenetworkcards_id', '=', 'd.id')
            ->where('i.itemtype', 'Computer')->where('i.items_id', $id)->where('i.is_dynamic', 1)
            ->get(['d.designation', 'i.serial', 'i.mac']);
    }

    private function beforeSound(int $id)
    {
        return DB::table('glpi_items_devicesoundcards as i')
            ->leftJoin('glpi_devicesoundcards as d', 'i.devicesoundcards_id', '=', 'd.id')
            ->where('i.itemtype', 'Computer')->where('i.items_id', $id)->where('i.is_dynamic', 1)
            ->get(['d.designation', 'i.serial']);
    }

    private function beforeMotherboard(int $id)
    {
        return DB::table('glpi_items_devicemotherboards as i')
            ->leftJoin('glpi_devicemotherboards as d', 'i.devicemotherboards_id', '=', 'd.id')
            ->where('i.itemtype', 'Computer')->where('i.items_id', $id)->where('i.is_dynamic', 1)
            ->get(['d.designation', 'i.serial']);
    }

    private function beforeBios(int $id)
    {
        return DB::table('glpi_items_devicefirmwares as i')
            ->leftJoin('glpi_devicefirmwares as d', 'i.devicefirmwares_id', '=', 'd.id')
            ->where('i.itemtype', 'Computer')->where('i.items_id', $id)->where('i.is_dynamic', 1)
            ->get(['d.designation', 'i.serial', 'i.otherserial as version']);
    }

    private function beforeSoftware(int $id)
    {
        return DB::table('glpi_computers_softwareversions as csv')
            ->join('glpi_softwareversions as sv', 'csv.softwareversions_id', '=', 'sv.id')
            ->join('glpi_softwares as s', 'sv.softwares_id', '=', 's.id')
            ->where('csv.computers_id', $id)->where('csv.is_dynamic', 1)->where('csv.is_deleted', 0)
            ->get(['s.name', 'sv.name as version']);
    }

    private function beforeOs(int $id)
    {
        return DB::table('glpi_items_operatingsystems as ios')
            ->leftJoin('glpi_operatingsystems as o', 'ios.operatingsystems_id', '=', 'o.id')
            ->leftJoin('glpi_operatingsystemversions as v', 'ios.operatingsystemversions_id', '=', 'v.id')
            ->leftJoin('glpi_operatingsystemarchitectures as a', 'ios.operatingsystemarchitectures_id', '=', 'a.id')
            ->leftJoin('glpi_operatingsystemeditions as e', 'ios.operatingsystemeditions_id', '=', 'e.id')
            ->where('ios.itemtype', 'Computer')->where('ios.items_id', $id)->where('ios.is_dynamic', 1)->where('ios.is_deleted', 0)
            ->get(['o.name', 'v.name as version', 'a.name as architecture', 'e.name as edition']);
    }

    private function beforeAntivirus(int $id)
    {
        return DB::table('glpi_computerantiviruses')
            ->where('computers_id', $id)->where('is_dynamic', 1)->where('is_deleted', 0)
            ->get(['name', 'antivirus_version', 'signature_version', 'is_active', 'is_uptodate']);
    }

    private function beforeNetwork(int $id)
    {
        $ports = DB::table('glpi_networkports')
            ->where('itemtype', 'Computer')->where('items_id', $id)->where('is_dynamic', 1)->where('is_deleted', 0)
            ->get(['id', 'name', 'mac']);

        return $ports->map(function ($p) {
            $ips = DB::table('glpi_ipaddresses')
                ->where('items_id', $p->id)->where('itemtype', 'NetworkName')->where('is_deleted', 0)
                ->pluck('name')->all();
            return (object) ['name' => $p->name, 'mac' => $p->mac, 'ips' => $ips];
        });
    }

    // ===============================================================
    //  Normalizadores (sirven tanto para filas de BD como del payload)
    // ===============================================================

    private function normalizeDisks($items, bool $fromDb): array
    {
        $out = [];
        foreach ($items as $it) {
            $designation = $this->str($it, 'designation');
            $serial = $this->str($it, 'serial');
            $cap = $fromDb ? $this->int($it, 'capacity') : $this->int($it, 'capacity_mb');
            $value = trim($designation . ($cap > 0 ? " ({$this->gb($cap)})" : ''));
            if ($value === '') {
                continue;
            }
            $key = $serial !== '' ? "s:{$serial}" : 'd:' . mb_strtolower($designation . '|' . $cap);
            $out[] = ['key' => $key, 'label' => 'Disco', 'value' => $value];
        }
        return $this->indexDuplicateKeys($out);
    }

    private function normalizeRam($items, bool $fromDb): array
    {
        $out = [];
        foreach ($items as $it) {
            $designation = $this->str($it, 'designation');
            $serial = $this->str($it, 'serial');
            $size = $fromDb ? $this->int($it, 'size') : $this->int($it, 'size_mb');
            $slot = $fromDb ? $this->str($it, 'busID') : $this->str($it, 'slot');
            $value = trim(($designation !== '' ? $designation . ' ' : '') . ($size > 0 ? $this->gb($size) : ''));
            if ($value === '') {
                continue;
            }
            $label = 'RAM' . ($slot !== '' ? " ranura {$slot}" : '');
            $key = $serial !== '' ? "s:{$serial}" : 'k:' . mb_strtolower($slot . '|' . $designation . '|' . $size);
            $out[] = ['key' => $key, 'label' => $label, 'value' => $value];
        }
        return $this->indexDuplicateKeys($out);
    }

    private function normalizeCpu($items, bool $fromDb): array
    {
        $out = [];
        foreach ($items as $it) {
            $designation = $this->str($it, 'designation');
            $serial = $this->str($it, 'serial');
            $freq = $fromDb ? $this->int($it, 'frequency') : $this->int($it, 'frequency_mhz');
            $cores = $fromDb ? $this->int($it, 'nbcores') : $this->int($it, 'cores');
            $threads = $fromDb ? $this->int($it, 'nbthreads') : $this->int($it, 'threads');
            if ($designation === '' && $serial === '') {
                continue;
            }
            $detail = [];
            if ($cores > 0) $detail[] = "{$cores}N";
            if ($threads > 0) $detail[] = "{$threads}H";
            if ($freq > 0) $detail[] = "{$freq} MHz";
            $value = trim($designation . (count($detail) ? ' (' . implode('/', $detail) . ')' : ''));
            if ($value === '') {
                $value = $serial;
            }
            $key = $serial !== '' ? "s:{$serial}" : 'd:' . mb_strtolower($designation);
            $out[] = ['key' => $key, 'label' => 'Procesador', 'value' => $value];
        }
        return $this->indexDuplicateKeys($out);
    }

    private function normalizeGpu($items, bool $fromDb): array
    {
        $out = [];
        foreach ($items as $it) {
            $designation = $this->str($it, 'designation');
            $serial = $this->str($it, 'serial');
            $mem = $fromDb ? $this->int($it, 'memory') : $this->int($it, 'memory_mb');
            $value = trim($designation . ($mem > 0 ? " ({$this->gb($mem)})" : ''));
            if ($value === '') {
                continue;
            }
            $key = $serial !== '' ? "s:{$serial}" : 'd:' . mb_strtolower($designation);
            $out[] = ['key' => $key, 'label' => 'Tarjeta de video', 'value' => $value];
        }
        return $this->indexDuplicateKeys($out);
    }

    private function normalizeNic($items, bool $fromDb): array
    {
        $out = [];
        foreach ($items as $it) {
            $designation = $this->str($it, 'designation');
            $serial = $this->str($it, 'serial');
            $mac = $this->str($it, 'mac');
            $value = trim($designation . ($mac !== '' ? " ({$mac})" : ''));
            if ($value === '') {
                continue;
            }
            $key = $mac !== '' ? 'm:' . mb_strtolower($mac) : ($serial !== '' ? "s:{$serial}" : 'd:' . mb_strtolower($designation));
            $out[] = ['key' => $key, 'label' => 'Tarjeta de red', 'value' => $value];
        }
        return $this->indexDuplicateKeys($out);
    }

    private function normalizeSimpleDevice($items, string $label, bool $fromDb): array
    {
        $out = [];
        foreach ($items as $it) {
            $designation = $this->str($it, 'designation');
            $serial = $this->str($it, 'serial');
            if ($designation === '' && $serial === '') {
                continue;
            }
            $key = $serial !== '' ? "s:{$serial}" : 'd:' . mb_strtolower($designation);
            $out[] = ['key' => $key, 'label' => $label, 'value' => $designation !== '' ? $designation : $serial];
        }
        return $this->indexDuplicateKeys($out);
    }

    private function normalizeMotherboard($items, bool $fromDb): array
    {
        $out = [];
        foreach ($items as $it) {
            $designation = $this->str($it, 'designation');
            $serial = $this->str($it, 'serial');
            $value = trim($designation . ($serial !== '' ? " (S/N {$serial})" : ''));
            if ($value === '') {
                continue;
            }
            $out[] = ['key' => 'mb', 'label' => 'Placa base', 'value' => $value];
        }
        return $this->indexDuplicateKeys($out);
    }

    private function normalizeBios($items, bool $fromDb): array
    {
        $out = [];
        foreach ($items as $it) {
            $version = $this->str($it, 'version');
            $designation = $this->str($it, 'designation');
            $value = trim(($designation !== '' && $designation !== 'BIOS' ? $designation . ' ' : '') . ($version !== '' ? "v{$version}" : ''));
            if ($value === '') {
                $value = $designation;
            }
            if ($value === '') {
                continue;
            }
            $out[] = ['key' => 'bios', 'label' => 'BIOS', 'value' => $value];
        }
        return $this->indexDuplicateKeys($out);
    }

    private function normalizeSoftware($items, bool $fromDb): array
    {
        $out = [];
        foreach ($items as $it) {
            $name = $this->str($it, 'name');
            if ($name === '') {
                continue;
            }
            $version = $this->str($it, 'version');
            if ($version === 'unknown') {
                $version = '';
            }
            $out[] = ['key' => 'n:' . mb_strtolower($name), 'label' => $name, 'value' => $version];
        }
        return $this->indexDuplicateKeys($out);
    }

    private function normalizeOs($items, bool $fromDb): array
    {
        $out = [];
        foreach ($items as $it) {
            $name = $this->str($it, 'name');
            $version = $this->str($it, 'version');
            $edition = $this->str($it, 'edition');
            $arch = $this->str($it, 'architecture');
            $parts = array_filter([$name, $version, $edition, $arch], fn($p) => $p !== '');
            $value = implode(' ', $parts);
            if ($value === '') {
                continue;
            }
            $out[] = ['key' => 'os', 'label' => 'Sistema operativo', 'value' => $value];
        }
        return $this->indexDuplicateKeys($out);
    }

    private function normalizeAntivirus($items, bool $fromDb): array
    {
        $out = [];
        foreach ($items as $it) {
            $name = $this->str($it, 'name');
            if ($name === '') {
                continue;
            }
            $version = $fromDb ? $this->str($it, 'antivirus_version') : $this->str($it, 'version');
            $active = $fromDb ? ((int) $this->int($it, 'is_active') === 1) : (bool) $this->raw($it, 'enabled');
            $upToDate = $fromDb ? ((int) $this->int($it, 'is_uptodate') === 1) : (bool) $this->raw($it, 'up_to_date');
            // No incluimos signature_version en el valor comparable: las firmas se actualizan a diario
            // y generarían un evento "modificado" en cada sync sin valor real para el historial.
            $parts = [];
            if ($version !== '') $parts[] = "v{$version}";
            $parts[] = $active ? 'activo' : 'inactivo';
            if ($upToDate) $parts[] = 'actualizado';
            $out[] = ['key' => 'n:' . mb_strtolower($name), 'label' => $name, 'value' => implode(', ', $parts)];
        }
        return $this->indexDuplicateKeys($out);
    }

    private function normalizeNetwork($items, bool $fromDb): array
    {
        $out = [];
        foreach ($items as $it) {
            $name = $this->str($it, 'name');
            $mac = $this->str($it, 'mac');
            $ips = $this->raw($it, 'ips');
            $ips = is_array($ips) ? array_values(array_filter(array_map('strval', $ips), fn($v) => trim($v) !== '')) : [];
            sort($ips);
            // El sync guarda nombres sintéticos "eth{idx}" cuando el agente no envía nombre; los
            // ignoramos para que la clave sea simétrica entre la BD y el payload (que no los tiene).
            $nameReal = ($name !== '' && !preg_match('/^eth\d+$/', $name)) ? $name : '';
            $idLabel = $mac !== '' ? $mac : ($nameReal !== '' ? $nameReal : '');
            if ($idLabel === '' && empty($ips)) {
                continue;
            }
            $ipText = empty($ips) ? '(sin IP)' : implode(', ', $ips);
            $value = trim(($idLabel !== '' ? $idLabel . ' — ' : '') . $ipText);
            // Clave estable y simétrica: MAC -> conjunto de IPs -> nombre real.
            if ($mac !== '') {
                $key = 'm:' . mb_strtolower($mac);
            } elseif (!empty($ips)) {
                $key = 'ip:' . mb_strtolower(implode(',', $ips));
            } else {
                $key = 'n:' . mb_strtolower($nameReal);
            }
            $out[] = ['key' => $key, 'label' => 'Interfaz de red', 'value' => $value];
        }
        return $this->indexDuplicateKeys($out);
    }

    // ===============================================================
    //  Helpers
    // ===============================================================

    private function nameById(string $table, $id): string
    {
        $id = (int) $id;
        if ($id <= 0) {
            return '';
        }
        return (string) (DB::table($table)->where('id', $id)->value('name') ?? '');
    }

    private function gb($mb): string
    {
        $mb = (int) $mb;
        if ($mb <= 0) {
            return '';
        }
        if ($mb >= 1024) {
            $gb = $mb / 1024;
            return rtrim(rtrim(number_format($gb, 1, '.', ''), '0'), '.') . ' GB';
        }
        return $mb . ' MB';
    }

    /** Lee un campo como string trim, soportando array (payload) u objeto (BD). */
    private function str($item, string $key): string
    {
        return trim((string) ($this->raw($item, $key) ?? ''));
    }

    private function int($item, string $key): int
    {
        return (int) ($this->raw($item, $key) ?? 0);
    }

    private function raw($item, string $key)
    {
        if (is_array($item)) {
            return $item[$key] ?? null;
        }
        if (is_object($item)) {
            return $item->{$key} ?? null;
        }
        return null;
    }

    /**
     * Desambigua componentes idénticos sin identidad única (p.ej. dos módulos de RAM iguales sin
     * serial ni ranura) añadiendo un sufijo de ocurrencia a las claves repetidas, para que un cambio
     * de cantidad (agregar/quitar uno) sí se detecte en el diff.
     *
     * @param array<int, array{key:string,label:string,value:string}> $items
     * @return array<int, array{key:string,label:string,value:string}>
     */
    private function indexDuplicateKeys(array $items): array
    {
        $seen = [];
        foreach ($items as &$it) {
            $k = $it['key'];
            $seen[$k] = ($seen[$k] ?? 0) + 1;
            if ($seen[$k] > 1) {
                $it['key'] = $k . '#' . $seen[$k];
            }
        }
        unset($it);
        return $items;
    }

    /**
     * True si el snapshot previo no contiene ninguna fila dinámica en ninguna categoría.
     * Se usa para distinguir un equipo realmente nuevo de uno ya inventariado adoptado por un agente nuevo.
     */
    public function isHistoryBeforeEmpty(array $before): bool
    {
        foreach ($before as $list) {
            if (!empty($list)) {
                return false;
            }
        }
        return true;
    }
}
