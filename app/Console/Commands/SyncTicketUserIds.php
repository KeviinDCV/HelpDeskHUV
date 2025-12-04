<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class SyncTicketUserIds extends Command
{
    protected $signature = 'tickets:sync-user-ids';
    protected $description = 'Migra los IDs de usuarios de Laravel a IDs de GLPI en glpi_tickets_users';

    public function handle()
    {
        $this->info('Sincronizando IDs de usuarios en tickets...');
        
        $users = User::whereNotNull('glpi_user_id')->get();
        $totalUpdated = 0;
        
        foreach ($users as $user) {
            // Si el ID de Laravel es diferente al ID de GLPI
            if ($user->id !== $user->glpi_user_id) {
                // Actualizar registros donde users_id = ID de Laravel
                $updated = DB::table('glpi_tickets_users')
                    ->where('users_id', $user->id)
                    ->update(['users_id' => $user->glpi_user_id]);
                
                if ($updated > 0) {
                    $this->line("  {$user->name}: {$updated} registros actualizados (ID {$user->id} → {$user->glpi_user_id})");
                    $totalUpdated += $updated;
                }
            }
        }
        
        $this->info("Total de registros actualizados: {$totalUpdated}");
        return 0;
    }
}
