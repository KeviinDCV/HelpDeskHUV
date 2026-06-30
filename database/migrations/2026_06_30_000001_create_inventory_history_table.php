<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Historial de cambios de inventario.
 *
 * Cada fila representa un cambio detectado en un activo (alta/baja/modificación de
 * un componente, software, SO, antivirus, red o identidad). Los cambios los detecta
 * el servidor comparando la "foto" que envía el agente contra el estado previo en BD.
 *
 * Es polimórfica (itemtype/items_id) para poder reutilizarse en el futuro con
 * monitores, impresoras, etc. Hoy se usa para 'Computer'.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_history', function (Blueprint $table) {
            $table->id();
            // Activo afectado. itemtype apunta al tipo GLPI ('Computer', 'Monitor', ...).
            $table->string('itemtype', 50)->default('Computer');
            // FK lógica a glpi_<tipo>.id (sin FK real porque son tablas de GLPI).
            $table->unsignedInteger('items_id');
            // Categoría del cambio: hardware_disk, hardware_ram, hardware_cpu, hardware_gpu,
            // hardware_network, hardware_sound, hardware_motherboard, hardware_bios,
            // software, os, antivirus, network, identity, baseline.
            $table->string('category', 40);
            // Acción: added | removed | modified | baseline.
            $table->string('action', 20);
            // Etiqueta legible del elemento afectado (ej. "Disco", "RAM ranura 2", "Microsoft Office").
            $table->string('field', 191)->nullable();
            // Valores antes/después (texto libre legible).
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            // Mensaje listo para mostrar en la UI (en español).
            $table->text('summary');
            // Origen del cambio: 'agent' (detección automática) o 'manual' (a futuro).
            $table->string('source', 30)->default('agent');
            // Dispositivo agente que originó el cambio (si aplica).
            $table->unsignedBigInteger('agent_device_id')->nullable();
            // Momento del cambio (lo fija el servidor al procesar el sync).
            $table->timestamp('changed_at');
            $table->timestamps();

            $table->index(['itemtype', 'items_id', 'changed_at']);
            $table->index('category');
            $table->index('changed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_history');
    }
};
