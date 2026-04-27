<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Representa un PC con el agente OCS-like instalado.
 * 
 * - hardware_uuid: identificador estable del hardware (BIOS UUID).
 * - computer_id: id del registro en glpi_computers (cuando ya está vinculado).
 * - token_id: id del token Sanctum asociado (1 token = 1 dispositivo).
 */
class AgentDevice extends Model
{
    protected $fillable = [
        'hardware_uuid',
        'computer_id',
        'hostname',
        'serial',
        'windows_username',
        'token_id',
        'status',
        'last_seen_at',
        'last_ip',
        'agent_version',
        'last_payload_summary',
        'last_error',
        'sync_count',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
        'last_payload_summary' => 'array',
        'sync_count' => 'integer',
        'computer_id' => 'integer',
    ];

    public function token()
    {
        return $this->belongsTo(PersonalAccessToken::class, 'token_id');
    }
}
