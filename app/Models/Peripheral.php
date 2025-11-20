<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Peripheral extends Model
{
    protected $table = 'glpi_peripherals';
    
    protected $fillable = [
        'entities_id',
        'name',
        'serial',
        'otherserial',
        'locations_id',
        'peripheraltypes_id',
        'peripheralmodels_id',
        'manufacturers_id',
        'states_id',
        'is_deleted',
        'date_mod',
    ];

    public $timestamps = false;
}
