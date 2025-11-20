<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Printer extends Model
{
    protected $table = 'glpi_printers';
    
    protected $fillable = [
        'entities_id',
        'name',
        'serial',
        'otherserial',
        'locations_id',
        'printertypes_id',
        'printermodels_id',
        'manufacturers_id',
        'states_id',
        'is_deleted',
        'date_mod',
    ];

    public $timestamps = false;
}
