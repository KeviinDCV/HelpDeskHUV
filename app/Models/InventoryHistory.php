<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Una entrada del historial de cambios de inventario.
 *
 * @see \App\Services\InventoryHistoryRecorder  Genera estas filas comparando
 *      la foto del agente contra el estado previo en BD.
 */
class InventoryHistory extends Model
{
    protected $table = 'inventory_history';

    protected $fillable = [
        'itemtype',
        'items_id',
        'category',
        'action',
        'field',
        'old_value',
        'new_value',
        'summary',
        'source',
        'agent_device_id',
        'changed_at',
    ];

    protected $casts = [
        'items_id' => 'integer',
        'agent_device_id' => 'integer',
        'changed_at' => 'datetime',
    ];

    public function agentDevice()
    {
        return $this->belongsTo(AgentDevice::class, 'agent_device_id');
    }
}
