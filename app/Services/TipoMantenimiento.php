<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * La «categoría» de un caso en el sentido de las estadísticas: mantenimiento correctivo o
 * preventivo. Lo que GLPI llama categoría es ahora la causa (Impresoras, Servinte…).
 *
 * Se guarda en la tabla ticket_maintenance cuando alguien la elige (Crear y Editar caso). Los
 * casos sin elegir se clasifican por su causa: preventivo si la causa es de mantenimiento
 * preventivo («Hardware > Mantenimiento > Preventivo», «Mantenimiento Preventivo»…), correctivo en
 * los demás. Así los casos de antes de este cambio también cuentan en las estadísticas.
 */
final class TipoMantenimiento
{
    public const CORRECTIVO = 'correctivo';
    public const PREVENTIVO = 'preventivo';

    public const ETIQUETAS = [
        self::CORRECTIVO => 'Mantenimiento correctivo',
        self::PREVENTIVO => 'Mantenimiento preventivo',
    ];

    private const TABLA = 'ticket_maintenance';

    /**
     * Expresión SQL con la categoría de cada caso de la consulta. $tabla es el nombre o alias de
     * glpi_tickets en esa consulta ('t', 'glpi_tickets'); lo pone el código, nunca el usuario.
     */
    public static function sql(string $tabla = 't'): string
    {
        $porCausa = "CASE WHEN EXISTS (SELECT 1 FROM glpi_itilcategories mc WHERE mc.id = {$tabla}.itilcategories_id"
            . " AND mc.completename LIKE '%Mantenimiento%Preventivo%') THEN '" . self::PREVENTIVO . "' ELSE '" . self::CORRECTIVO . "' END";

        if (!self::hayTabla()) {
            return $porCausa;
        }

        return "COALESCE((SELECT tm.maintenance_type FROM " . self::TABLA . " tm WHERE tm.tickets_id = {$tabla}.id), {$porCausa})";
    }

    /** La categoría actual de un caso: la elegida o, si no se eligió, la que sale de su causa. */
    public static function de(int $ticketId): string
    {
        return (string) DB::table('glpi_tickets as t')
            ->where('t.id', $ticketId)
            ->selectRaw(self::sql('t') . ' as tipo')
            ->value('tipo') ?: self::CORRECTIVO;
    }

    public static function etiqueta(?string $tipo): string
    {
        return self::ETIQUETAS[$tipo] ?? self::ETIQUETAS[self::CORRECTIVO];
    }

    public static function guardar(int $ticketId, string $tipo): void
    {
        if (!isset(self::ETIQUETAS[$tipo])) {
            return;
        }
        // Sin la tabla (se desplegó sin `php artisan migrate`) el caso se guarda igual, con la
        // categoría que sale de su causa; el log dice qué falta.
        if (!self::hayTabla()) {
            Log::error('Falta la tabla ticket_maintenance: ejecuta `php artisan migrate`. La categoría elegida no se guardó.', ['ticket' => $ticketId]);
            return;
        }

        DB::table(self::TABLA)->upsert(
            [['tickets_id' => $ticketId, 'maintenance_type' => $tipo, 'created_at' => now(), 'updated_at' => now()]],
            ['tickets_id'],
            ['maintenance_type', 'updated_at']
        );
    }

    /** Se consulta una vez por petición. */
    private static ?bool $hayTabla = null;

    private static function hayTabla(): bool
    {
        return self::$hayTabla ??= Schema::hasTable(self::TABLA);
    }
}
