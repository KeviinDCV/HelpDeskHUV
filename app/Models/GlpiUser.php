<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GlpiUser extends Model
{
    protected $table = 'glpi_users';
    
    protected $fillable = [
        'name',
        'firstname',
        'realname',
        'phone',
        'locations_id',
        'is_active',
        'entities_id',
        'is_deleted',
    ];

    public $timestamps = false;
}
