<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla para registrar cada PC que tiene el agente OCS-like instalado.
 * Mantiene el vínculo entre el hardware UUID, su token Sanctum y el computer en GLPI.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_devices', function (Blueprint $table) {
            $table->id();
            // UUID de hardware (BIOS/SMBIOS) reportado por el agente. Identificador estable.
            $table->string('hardware_uuid', 191)->unique();
            // FK a glpi_computers.id (no se hace FK real porque la tabla es de GLPI)
            $table->unsignedInteger('computer_id')->nullable()->index();
            // Datos del PC (cache liviana)
            $table->string('hostname', 191)->nullable()->index();
            $table->string('serial', 191)->nullable()->index();
            $table->string('windows_username', 191)->nullable()->index();
            // Vinculación con el token Sanctum (id en personal_access_tokens)
            $table->unsignedBigInteger('token_id')->nullable()->index();
            // Estado del dispositivo
            $table->enum('status', ['active', 'disabled', 'pending'])->default('active');
            // Última sincronización
            $table->timestamp('last_seen_at')->nullable();
            $table->ipAddress('last_ip')->nullable();
            $table->string('agent_version', 50)->nullable();
            // Auditoría y diagnóstico
            $table->json('last_payload_summary')->nullable();
            $table->text('last_error')->nullable();
            $table->unsignedInteger('sync_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_devices');
    }
};
