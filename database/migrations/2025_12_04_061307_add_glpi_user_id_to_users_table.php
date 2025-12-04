<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Agregar campo glpi_user_id
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('glpi_user_id')->nullable()->after('id');
        });

        // Poblar el campo buscando correspondencia en glpi_users
        $users = DB::table('users')->get();
        foreach ($users as $user) {
            // Buscar por username primero, luego por nombre completo
            $glpiUser = DB::table('glpi_users')
                ->where(function($q) use ($user) {
                    $q->where('name', $user->username)
                      ->orWhereRaw("TRIM(CONCAT(COALESCE(firstname, ''), ' ', COALESCE(realname, ''))) = ?", [$user->name]);
                })
                ->where('is_deleted', 0)
                ->orderBy('id', 'desc') // Tomar el más reciente si hay duplicados
                ->first();

            if ($glpiUser) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['glpi_user_id' => $glpiUser->id]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('glpi_user_id');
        });
    }
};
