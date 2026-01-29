<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Actualiza las subcategorías de "Redes" en GLPI:
     * - "Telefonia Ip" → "Configuración Telefonia IP"
     * - "Configuración Logica" → se elimina y se crean:
     *   - "Configuración switch"
     *   - "Configuración plato de wifi"
     *   - "Configuración router"
     */
    public function up(): void
    {
        // Primero, obtener el ID de la categoría padre "Redes"
        $redesCategory = DB::table('glpi_itilcategories')
            ->where('name', 'Redes')
            ->where(function($query) {
                $query->whereNull('itilcategories_id')
                      ->orWhere('itilcategories_id', 0);
            })
            ->first();

        if (!$redesCategory) {
            // Intentar buscar por completename
            $redesCategory = DB::table('glpi_itilcategories')
                ->where('completename', 'Redes')
                ->first();
        }

        $redesParentId = $redesCategory ? $redesCategory->id : 14;
        $parentLevel = $redesCategory->level ?? 1;
        $childLevel = $parentLevel + 1;

        // 1. Actualizar "Telefonia Ip" a "Configuración Telefonia IP"
        // Intentamos varias variantes del nombre
        $telefoniaVariants = ['Telefonia Ip', 'Telefonía Ip', 'Telefonia IP', 'Telefonía IP'];
        
        foreach ($telefoniaVariants as $variant) {
            DB::table('glpi_itilcategories')
                ->where('name', $variant)
                ->update([
                    'name' => 'Configuración Telefonia IP',
                    'completename' => 'Redes > Configuración Telefonia IP',
                    'date_mod' => now()
                ]);
        }

        // 2. Eliminar "Configuración Logica" (delete físico)
        $configLogicaVariants = ['Configuración Logica', 'Configuración Lógica', 'Configuracion Logica'];
        
        foreach ($configLogicaVariants as $variant) {
            $configLogica = DB::table('glpi_itilcategories')
                ->where('name', $variant)
                ->first();

            if ($configLogica) {
                // Mover los tickets que usaban esta categoría a la categoría padre (Redes)
                DB::table('glpi_tickets')
                    ->where('itilcategories_id', $configLogica->id)
                    ->update(['itilcategories_id' => $redesParentId]);

                // Ahora sí eliminar la categoría
                DB::table('glpi_itilcategories')
                    ->where('id', $configLogica->id)
                    ->delete();
            }
        }

        // 3. Crear las nuevas subcategorías
        $newCategories = [
            'Configuración switch',
            'Configuración plato de wifi',
            'Configuración router'
        ];

        // Obtener las columnas de la tabla para hacer insert con solo las columnas que existen
        $columns = collect(DB::select('SHOW COLUMNS FROM glpi_itilcategories'))
            ->pluck('Field')
            ->toArray();

        foreach ($newCategories as $categoryName) {
            // Verificar si ya existe
            $exists = DB::table('glpi_itilcategories')
                ->where('name', $categoryName)
                ->where('itilcategories_id', $redesParentId)
                ->exists();

            if (!$exists) {
                // Construir datos base
                $data = [
                    'entities_id' => 0,
                    'is_recursive' => 1,
                    'itilcategories_id' => $redesParentId,
                    'name' => $categoryName,
                    'completename' => 'Redes > ' . $categoryName,
                    'is_helpdeskvisible' => 1,
                    'is_incident' => 1,
                    'is_request' => 1,
                    'is_problem' => 1,
                    'is_change' => 0,
                    'date_mod' => now()
                ];

                // Agregar columnas opcionales si existen
                if (in_array('level', $columns)) {
                    $data['level'] = $childLevel;
                }
                if (in_array('tickettemplates_id_incident', $columns)) {
                    $data['tickettemplates_id_incident'] = 0;
                }
                if (in_array('tickettemplates_id_demand', $columns)) {
                    $data['tickettemplates_id_demand'] = 0;
                }
                if (in_array('date_creation', $columns)) {
                    $data['date_creation'] = now();
                }

                DB::table('glpi_itilcategories')->insert($data);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Obtener el ID de la categoría padre "Redes"
        $redesCategory = DB::table('glpi_itilcategories')
            ->where('name', 'Redes')
            ->where(function($query) {
                $query->whereNull('itilcategories_id')
                      ->orWhere('itilcategories_id', 0);
            })
            ->first();

        $redesParentId = $redesCategory ? $redesCategory->id : 14;
        $parentLevel = $redesCategory->level ?? 1;

        // 1. Revertir "Configuración Telefonia IP" a "Telefonia Ip"
        DB::table('glpi_itilcategories')
            ->where('name', 'Configuración Telefonia IP')
            ->update([
                'name' => 'Telefonia Ip',
                'completename' => 'Redes > Telefonia Ip',
                'date_mod' => now()
            ]);

        // 2. Restaurar "Configuración Logica" (recrear si fue eliminada)
        $exists = DB::table('glpi_itilcategories')
            ->where('name', 'Configuración Logica')
            ->where('itilcategories_id', $redesParentId)
            ->exists();

        if (!$exists) {
            $columns = collect(DB::select('SHOW COLUMNS FROM glpi_itilcategories'))
                ->pluck('Field')
                ->toArray();

            $data = [
                'entities_id' => 0,
                'is_recursive' => 1,
                'itilcategories_id' => $redesParentId,
                'name' => 'Configuración Logica',
                'completename' => 'Redes > Configuración Logica',
                'is_helpdeskvisible' => 1,
                'is_incident' => 1,
                'is_request' => 1,
                'is_problem' => 1,
                'is_change' => 0,
                'date_mod' => now()
            ];

            if (in_array('level', $columns)) {
                $data['level'] = $parentLevel + 1;
            }
            if (in_array('tickettemplates_id_incident', $columns)) {
                $data['tickettemplates_id_incident'] = 0;
            }
            if (in_array('tickettemplates_id_demand', $columns)) {
                $data['tickettemplates_id_demand'] = 0;
            }
            if (in_array('date_creation', $columns)) {
                $data['date_creation'] = now();
            }

            DB::table('glpi_itilcategories')->insert($data);
        }

        // 3. Eliminar las nuevas subcategorías creadas
        $newCategories = [
            'Configuración switch',
            'Configuración plato de wifi',
            'Configuración router'
        ];

        DB::table('glpi_itilcategories')
            ->whereIn('name', $newCategories)
            ->where('itilcategories_id', $redesParentId)
            ->delete();
    }
};
