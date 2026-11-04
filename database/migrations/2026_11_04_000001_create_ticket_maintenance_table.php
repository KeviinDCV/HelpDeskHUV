<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Categoría de mantenimiento de cada caso: correctivo o preventivo.
 *
 * En GLPI la «categoría» del caso es la causa (Impresoras, Servinte > Clínico…), y para las
 * estadísticas se necesita además saber si el trabajo fue correctivo o preventivo. Antes había
 * que escoger una de las dos cosas en el mismo campo. Va en una tabla propia en vez de una
 * columna nueva en glpi_tickets para no modificar el esquema de GLPI.
 *
 * Un caso sin fila aquí (los anteriores a este cambio, los del portal público, los creados desde
 * GLPI) se clasifica por su causa: preventivo si la causa es de mantenimiento preventivo,
 * correctivo en los demás casos (App\Services\TipoMantenimiento).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_maintenance', function (Blueprint $table) {
            // FK lógica a glpi_tickets.id (sin FK real porque es una tabla de GLPI).
            $table->unsignedInteger('tickets_id')->primary();
            // correctivo | preventivo
            $table->string('maintenance_type', 12);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_maintenance');
    }
};
