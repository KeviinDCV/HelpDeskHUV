<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ImportGLPIUsers extends Command
{
    protected $signature = 'glpi:import-users';
    protected $description = 'Importa usuarios de GLPI a la tabla users de Laravel';

    public function handle()
    {
        $this->info('Iniciando importación de usuarios de GLPI...');

        // Obtener usuarios activos de GLPI con sus emails
        $glpiUsers = DB::select("
            SELECT 
                u.id,
                u.name as username,
                u.firstname,
                u.realname,
                u.is_active,
                e.email
            FROM glpi_users u
            LEFT JOIN glpi_useremails e ON u.id = e.users_id AND e.is_default = 1
            WHERE u.is_deleted = 0 
            AND u.is_active = 1
            AND u.name IS NOT NULL
            AND u.name != ''
        ");

        $this->info('Encontrados ' . count($glpiUsers) . ' usuarios en GLPI');

        $imported = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($glpiUsers as $glpiUser) {
            try {
                // Verificar si el usuario ya existe en Laravel
                $existingUser = User::where('username', $glpiUser->username)->first();
                
                if ($existingUser) {
                    $this->warn("Usuario '{$glpiUser->username}' ya existe. Omitiendo...");
                    $skipped++;
                    continue;
                }

                // Generar email si no existe
                $email = $glpiUser->email ?: strtolower($glpiUser->username) . '@helpdesk.local';

                // Verificar si el email ya existe
                $emailExists = User::where('email', $email)->first();
                if ($emailExists) {
                    $email = strtolower($glpiUser->username) . '_' . $glpiUser->id . '@helpdesk.local';
                }

                // Crear nombre completo
                $fullName = trim(($glpiUser->firstname ?? '') . ' ' . ($glpiUser->realname ?? ''));
                if (empty($fullName)) {
                    $fullName = $glpiUser->username;
                }

                // Crear usuario en Laravel
                User::create([
                    'name' => $fullName,
                    'username' => $glpiUser->username,
                    'email' => $email,
                    'password' => Hash::make('admin123'),
                    'role' => 'Técnico',
                    'is_active' => $glpiUser->is_active,
                    'email_verified_at' => now(),
                ]);

                $this->info("✓ Usuario '{$glpiUser->username}' importado correctamente");
                $imported++;

            } catch (\Exception $e) {
                $this->error("✗ Error al importar '{$glpiUser->username}': " . $e->getMessage());
                $errors++;
            }
        }

        $this->newLine();
        $this->info("========================================");
        $this->info("Resumen de importación:");
        $this->info("Importados: {$imported}");
        $this->info("Omitidos: {$skipped}");
        $this->info("Errores: {$errors}");
        $this->info("========================================");

        return Command::SUCCESS;
    }
}
