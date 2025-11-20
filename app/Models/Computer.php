<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Computer extends Model
{
    protected $table = 'glpi_computers';
    
    public $timestamps = false;
    
    protected $fillable = [
        'name',
        'serial',
        'entities_id',
        'states_id',
        'manufacturers_id',
        'computertypes_id',
        'computermodels_id',
        'locations_id',
        'date_mod',
    ];

    protected $casts = [
        'date_mod' => 'datetime',
        'date_creation' => 'datetime',
    ];

    // Scope para filtrar computadores no eliminados
    public function scopeNotDeleted($query)
    {
        return $query->where('is_deleted', 0);
    }
}
