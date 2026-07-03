<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncUsersToGlpi extends Command
{
    protected $signature = 'users:sync-glpi';

    protected $description = 'Vincula los usuarios de Laravel sin glpi_user_id con su usuario espejo en glpi_users (lo crea si no existe), para que aparezcan en los selectores de casos';

    public function handle(): int
    {
        $pending = User::whereNull('glpi_user_id')->get();

        if ($pending->isEmpty()) {
            $this->info('Todos los usuarios ya están vinculados con GLPI.');
            return self::SUCCESS;
        }

        foreach ($pending as $user) {
            $login = mb_strtolower(trim($user->username));

            $glpiId = DB::table('glpi_users')->whereRaw('LOWER(name) = ?', [$login])->value('id');
            $accion = 'vinculado a existente';

            if (!$glpiId) {
                $words = preg_split('/\s+/', trim($user->name)) ?: [];
                $mid = max(1, intdiv(count($words), 2));

                $glpiId = DB::table('glpi_users')->insertGetId([
                    'name' => $login,
                    'firstname' => implode(' ', array_slice($words, 0, $mid)),
                    'realname' => implode(' ', array_slice($words, $mid)) ?: null,
                    'is_active' => 1,
                    'is_deleted' => 0,
                    'entities_id' => 0,
                    'profiles_id' => 0,
                    'authtype' => 1,
                    'date_creation' => now(),
                    'date_mod' => now(),
                ]);
                $accion = 'creado en glpi_users';
            }

            $user->glpi_user_id = $glpiId;
            $user->save();

            $this->line("  {$user->username} ({$user->name}) -> glpi_user_id={$glpiId} [{$accion}]");
        }

        $this->info($pending->count() . ' usuario(s) vinculados. Ya aparecen en los selectores de casos.');

        return self::SUCCESS;
    }
}
