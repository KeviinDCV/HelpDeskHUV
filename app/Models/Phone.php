<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Phone extends Model
{
    protected $table = 'glpi_phones';
    
    protected $fillable = [
        'entities_id',
        'name',
        'serial',
        'otherserial',
        'locations_id',
        'phonetypes_id',
        'phonemodels_id',
        'manufacturers_id',
        'states_id',
        'is_deleted',
        'date_mod',
    ];

    public $timestamps = false;
}
