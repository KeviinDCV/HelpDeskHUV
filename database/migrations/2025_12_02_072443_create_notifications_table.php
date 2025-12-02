<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // Usuario que recibe la notificación
            $table->string('type'); // ticket_assigned, ticket_comment, ticket_resolved, ticket_closed, ticket_urgent, ticket_status_change, reminder, welcome
            $table->string('title');
            $table->text('message');
            $table->string('icon')->nullable(); // Icono lucide
            $table->string('color')->default('blue'); // blue, green, red, yellow, purple
            $table->unsignedBigInteger('reference_id')->nullable(); // ID del ticket, recordatorio, etc.
            $table->string('reference_type')->nullable(); // ticket, reminder, reservation
            $table->string('action_url')->nullable(); // URL para ir al recurso
            $table->timestamp('read_at')->nullable(); // Fecha de lectura
            $table->timestamps();
            
            $table->index('user_id');
            $table->index('read_at');
            $table->index(['user_id', 'read_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
