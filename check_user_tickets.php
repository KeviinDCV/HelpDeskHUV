<?php
require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$userId = 164;

echo "=== DESGLOSE DETALLADO DE TICKETS ===\n\n";

// -- COMO TECNICO ASIGNADO (type=2) --
echo "** COMO TECNICO ASIGNADO (type=2) **\n";

$tecnicoNuevos = DB::table('glpi_tickets as t')
    ->join('glpi_tickets_users as tu', 'tu.tickets_id', '=', 't.id')
    ->where('tu.users_id', $userId)->where('tu.type', 2)
    ->where('t.status', 1)->where('t.is_deleted', 0)->count();

$tecnicoEnCurso = DB::table('glpi_tickets as t')
    ->join('glpi_tickets_users as tu', 'tu.tickets_id', '=', 't.id')
    ->where('tu.users_id', $userId)->where('tu.type', 2)
    ->where('t.status', 2)->where('t.is_deleted', 0)->count();

$tecnicoPlanificado = DB::table('glpi_tickets as t')
    ->join('glpi_tickets_users as tu', 'tu.tickets_id', '=', 't.id')
    ->where('tu.users_id', $userId)->where('tu.type', 2)
    ->where('t.status', 3)->where('t.is_deleted', 0)->count();

$tecnicoEspera = DB::table('glpi_tickets as t')
    ->join('glpi_tickets_users as tu', 'tu.tickets_id', '=', 't.id')
    ->where('tu.users_id', $userId)->where('tu.type', 2)
    ->where('t.status', 4)->where('t.is_deleted', 0)->count();

$tecnicoResuelto = DB::table('glpi_tickets as t')
    ->join('glpi_tickets_users as tu', 'tu.tickets_id', '=', 't.id')
    ->where('tu.users_id', $userId)->where('tu.type', 2)
    ->where('t.status', 5)->where('t.is_deleted', 0)->count();

$tecnicoCerrado = DB::table('glpi_tickets as t')
    ->join('glpi_tickets_users as tu', 'tu.tickets_id', '=', 't.id')
    ->where('tu.users_id', $userId)->where('tu.type', 2)
    ->where('t.status', 6)->where('t.is_deleted', 0)->count();

echo "  Status 1 (Nuevo): $tecnicoNuevos\n";
echo "  Status 2 (En curso - asignado): $tecnicoEnCurso\n";
echo "  Status 3 (En curso - planificado): $tecnicoPlanificado\n";
echo "  Status 4 (En espera): $tecnicoEspera\n";
echo "  Status 5 (Resuelto): $tecnicoResuelto\n";
echo "  Status 6 (Cerrado): $tecnicoCerrado\n";

$totalTecnico = $tecnicoNuevos + $tecnicoEnCurso + $tecnicoPlanificado + $tecnicoEspera;
echo "  ----------------------------------\n";
echo "  TOTAL NO CERRADOS (1-4): $totalTecnico\n";
echo "  TOTAL RESUELTOS+CERRADOS (5-6): " . ($tecnicoResuelto + $tecnicoCerrado) . "\n\n";

// -- COMO SOLICITANTE (type=1) --
echo "** COMO SOLICITANTE (type=1) **\n";
$solicitanteNoCerrados = DB::table('glpi_tickets as t')
    ->join('glpi_tickets_users as tu', 'tu.tickets_id', '=', 't.id')
    ->where('tu.users_id', $userId)->where('tu.type', 1)
    ->where('t.status', '!=', 6)->where('t.is_deleted', 0)->count();

echo "  No cerrados: $solicitanteNoCerrados\n\n";

echo "=== RESUMEN FINAL ===\n";
echo "Tickets donde es TECNICO y NO cerrados: $totalTecnico\n";
echo "Tickets donde es SOLICITANTE y NO cerrados: $solicitanteNoCerrados\n";
$totalGeneral = $totalTecnico + $solicitanteNoCerrados;
echo "TOTAL GENERAL (sin duplicados aprox): Hasta $totalGeneral tickets\n";
