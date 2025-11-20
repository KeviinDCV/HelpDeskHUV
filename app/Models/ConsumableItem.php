<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsumableItem extends Model
{
    protected $table = 'glpi_consumableitems';
    
    protected $fillable = [
        'entities_id',
        'name',
        'ref',
        'locations_id',
        'consumableitemtypes_id',
        'manufacturers_id',
        'users_id_tech',
        'is_deleted',
        'comment',
        'date_mod',
    ];

    public $timestamps = false;
}
