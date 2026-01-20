<?php
require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Buscar usuario jpcastano en Laravel
$laravelUser = DB::table('users')
    ->where('username', 'jpcastano')
    ->orWhere('name', 'LIKE', '%Juan%Pablo%')
    ->first();

if ($laravelUser) {
    echo "=== USUARIO EN LARAVEL (users) ===\n";
    echo "ID Laravel: " . $laravelUser->id . "\n";
    echo "Username: " . $laravelUser->username . "\n";
    echo "Name: " . $laravelUser->name . "\n";
    echo "GLPI User ID: " . ($laravelUser->glpi_user_id ?? 'NULL') . "\n\n";
} else {
    echo "Usuario Laravel no encontrado\n";
}

// Buscar en glpi_users
$glpiUser = DB::table('glpi_users')
    ->where('name', 'jpcastano')
    ->orWhere('name', 'LIKE', '%jpcastano%')
    ->first();

if ($glpiUser) {
    echo "=== USUARIO EN GLPI (glpi_users) ===\n";
    echo "ID GLPI: " . $glpiUser->id . "\n";
    echo "Name: " . $glpiUser->name . "\n";
    echo "Firstname: " . $glpiUser->firstname . "\n";
    echo "Realname: " . $glpiUser->realname . "\n\n";
} else {
    echo "Usuario GLPI 'jpcastano' no encontrado, buscando por nombre...\n";
    $glpiUser = DB::table('glpi_users')
        ->where('firstname', 'LIKE', '%Juan%')
        ->where('realname', 'LIKE', '%Cast%')
        ->first();
    if ($glpiUser) {
        echo "=== USUARIO EN GLPI (glpi_users) por nombre ===\n";
        echo "ID GLPI: " . $glpiUser->id . "\n";
        echo "Name: " . $glpiUser->name . "\n";
        echo "Firstname: " . $glpiUser->firstname . "\n";
        echo "Realname: " . $glpiUser->realname . "\n\n";
    } else {
        echo "Usuario GLPI no encontrado\n";
    }
}

// Verificar el ticket 58555
echo "=== TICKET #58555 ===\n";
$ticket = DB::table('glpi_tickets')->where('id', 58555)->first();
if ($ticket) {
    echo "Status: " . $ticket->status . "\n";
    echo "Name: " . $ticket->name . "\n";
    
    // Verificar quien está asignado
    $assigned = DB::table('glpi_tickets_users')
        ->where('tickets_id', 58555)
        ->where('type', 2)
        ->first();
    
    if ($assigned) {
        echo "\nTecnico asignado (glpi_tickets_users):\n";
        echo "  users_id: " . $assigned->users_id . "\n";
        
        $tech = DB::table('glpi_users')->where('id', $assigned->users_id)->first();
        if ($tech) {
            echo "  Nombre en GLPI: " . $tech->firstname . " " . $tech->realname . "\n";
            echo "  Username en GLPI: " . $tech->name . "\n";
        }
    } else {
        echo "\nNo hay tecnico asignado!\n";
    }
}
