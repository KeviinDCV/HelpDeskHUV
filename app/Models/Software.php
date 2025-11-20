<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Software extends Model
{
    protected $table = 'glpi_softwares';
    
    protected $fillable = [
        'entities_id',
        'name',
        'comment',
        'manufacturers_id',
        'is_deleted',
        'is_template',
    ];

    public $timestamps = false;
}
