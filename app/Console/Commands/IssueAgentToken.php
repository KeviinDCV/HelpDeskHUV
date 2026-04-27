<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * Emite un token Sanctum para el agente de inventario.
 *
 * Uso:
 *   php artisan agent:token --user=admin
 *   php artisan agent:token --user=admin --name="PC-CONTABILIDAD-01"
 *
 * El token resultante se usa en el header HTTP del agente:
 *   Authorization: Bearer <token>
 */
class IssueAgentToken extends Command
{
    protected $signature = 'agent:token
                            {--user= : Username del usuario al que se le asocia el token}
                            {--name=AgentDevice : Nombre descriptivo del token (ej. el hostname del PC)}
                            {--days=0 : Días de validez (0 = no expira)}';

    protected $description = 'Genera un token Sanctum con habilidad agent:sync para el agente de inventario';

    public function handle(): int
    {
        $username = $this->option('user');
        if (!$username) {
            $username = $this->ask('Username (en HelpDesk) al que se asocia el token');
        }

        $user = User::where('username', $username)->first();
        if (!$user) {
            $this->error("Usuario '{$username}' no encontrado.");
            return self::FAILURE;
        }

        $name = $this->option('name') ?: 'AgentDevice';
        $days = (int) $this->option('days');

        $expiresAt = $days > 0 ? now()->addDays($days) : null;

        $token = $user->createToken(
            name: $name,
            abilities: ['agent:sync'],
            expiresAt: $expiresAt,
        );

        $this->newLine();
        $this->info('====== TOKEN GENERADO ======');
        $this->line(' Usuario     : ' . $user->username);
        $this->line(' Nombre      : ' . $name);
        $this->line(' Habilidades : agent:sync');
        $this->line(' Expira      : ' . ($expiresAt?->toDateTimeString() ?: 'nunca'));
        $this->newLine();
        $this->warn('Copia este token AHORA - no se mostrará de nuevo:');
        $this->line($token->plainTextToken);
        $this->newLine();
        $this->comment('Configura el agente con este token en su archivo de configuración.');

        return self::SUCCESS;
    }
}
