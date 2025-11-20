<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NetworkEquipment extends Model
{
    protected $table = 'glpi_networkequipments';
    
    protected $fillable = [
        'entities_id',
        'name',
        'serial',
        'otherserial',
        'locations_id',
        'networkequipmenttypes_id',
        'networkequipmentmodels_id',
        'manufacturers_id',
        'states_id',
        'is_deleted',
        'date_mod',
    ];

    public $timestamps = false;
}
