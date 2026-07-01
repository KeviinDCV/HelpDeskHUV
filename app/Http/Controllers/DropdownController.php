<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Creación al vuelo de opciones de desplegables (catálogos GLPI) desde los formularios.
 *
 * Permite el botón "+" junto a cada selector: crea (o reutiliza) una opción por nombre en la
 * tabla-catálogo correspondiente y devuelve {id, name} para agregarla y seleccionarla en el UI.
 *
 * Seguridad: SOLO se permiten las tablas de la lista blanca (nunca inserta en una tabla arbitraria).
 * Los "desplegables" que en realidad son entidades/usuarios/grupos NO están aquí a propósito.
 */
class DropdownController extends Controller
{
    /**
     * Lista blanca: clave de tipo => tabla-catálogo GLPI.
     */
    private const TABLES = [
        // Comunes
        'states' => 'glpi_states',
        'manufacturers' => 'glpi_manufacturers',
        'locations' => 'glpi_locations',
        'domains' => 'glpi_domains',
        'networks' => 'glpi_networks',
        'autoupdatesystems' => 'glpi_autoupdatesystems',
        // Computadores
        'computertypes' => 'glpi_computertypes',
        'computermodels' => 'glpi_computermodels',
        // Monitores
        'monitortypes' => 'glpi_monitortypes',
        'monitormodels' => 'glpi_monitormodels',
        // Impresoras
        'printertypes' => 'glpi_printertypes',
        'printermodels' => 'glpi_printermodels',
        // Teléfonos
        'phonetypes' => 'glpi_phonetypes',
        'phonemodels' => 'glpi_phonemodels',
        'phonepowersupplies' => 'glpi_phonepowersupplies',
        // Dispositivos (periféricos)
        'peripheraltypes' => 'glpi_peripheraltypes',
        'peripheralmodels' => 'glpi_peripheralmodels',
        // Dispositivos de red
        'networkequipmenttypes' => 'glpi_networkequipmenttypes',
        'networkequipmentmodels' => 'glpi_networkequipmentmodels',
        // Software
        'softwarecategories' => 'glpi_softwarecategories',
        // Consumibles
        'consumableitemtypes' => 'glpi_consumableitemtypes',
        // Sistema operativo
        'operatingsystems' => 'glpi_operatingsystems',
        'operatingsystemversions' => 'glpi_operatingsystemversions',
        'operatingsystemarchitectures' => 'glpi_operatingsystemarchitectures',
        'operatingsystemeditions' => 'glpi_operatingsystemeditions',
        'operatingsystemkernelversions' => 'glpi_operatingsystemkernelversions',
        'operatingsystemservicepacks' => 'glpi_operatingsystemservicepacks',
        // Volúmenes
        'filesystems' => 'glpi_filesystems',
    ];

    public function store(Request $request, string $type): JsonResponse
    {
        $table = self::TABLES[$type] ?? null;
        if (!$table || !Schema::hasTable($table)) {
            return response()->json(['message' => 'Tipo de desplegable no permitido'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);
        $name = trim($validated['name']);
        if ($name === '') {
            return response()->json(['message' => 'El nombre no puede estar vacío'], 422);
        }

        // Reutilizar si ya existe (evita duplicados por nombre)
        $existing = DB::table($table)->where('name', $name)->first();
        if ($existing) {
            return response()->json(['id' => (int) $existing->id, 'name' => $name, 'created' => false]);
        }

        // Insert mínimo respetando las columnas que tenga la tabla (mismo patrón que el agente).
        $columns = ['name' => $name];
        $available = Schema::getColumnListing($table);
        if (in_array('entities_id', $available, true)) $columns['entities_id'] = 0;
        if (in_array('is_recursive', $available, true)) $columns['is_recursive'] = 0;
        if (in_array('comment', $available, true)) $columns['comment'] = '';
        if (in_array('completename', $available, true)) $columns['completename'] = $name;
        if (in_array('level', $available, true)) $columns['level'] = 1;
        if (in_array('date_mod', $available, true)) $columns['date_mod'] = now();
        if (in_array('date_creation', $available, true)) $columns['date_creation'] = now();

        $id = (int) DB::table($table)->insertGetId($columns);

        return response()->json(['id' => $id, 'name' => $name, 'created' => true]);
    }
}
