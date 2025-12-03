<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Agrega índices para mejorar el rendimiento de las consultas.
     */
    public function up(): void
    {
        // Índices para glpi_softwares (optimizar página de programas)
        try {
            DB::statement('CREATE INDEX IF NOT EXISTS idx_softwares_deleted ON glpi_softwares(is_deleted)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_softwares_manufacturers ON glpi_softwares(manufacturers_id)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_softwares_entities ON glpi_softwares(entities_id)');
        } catch (\Exception $e) {
            // Índices ya existen o no se pueden crear
        }

        // Índices para glpi_softwareversions
        try {
            DB::statement('CREATE INDEX IF NOT EXISTS idx_softwareversions_software ON glpi_softwareversions(softwares_id)');
        } catch (\Exception $e) {
            // Índice ya existe
        }

        // Índices para glpi_computers_softwareversions
        try {
            DB::statement('CREATE INDEX IF NOT EXISTS idx_csv_softwareversion ON glpi_computers_softwareversions(softwareversions_id)');
        } catch (\Exception $e) {
            // Índice ya existe
        }

        // Índices para glpi_softwarelicenses
        try {
            DB::statement('CREATE INDEX IF NOT EXISTS idx_softwarelicenses_software ON glpi_softwarelicenses(softwares_id)');
        } catch (\Exception $e) {
            // Índice ya existe
        }

        // Índices para glpi_tickets (optimizar estadísticas)
        try {
            DB::statement('CREATE INDEX IF NOT EXISTS idx_tickets_deleted ON glpi_tickets(is_deleted)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_tickets_status ON glpi_tickets(status)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_tickets_priority ON glpi_tickets(priority)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_tickets_date ON glpi_tickets(date)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_tickets_category ON glpi_tickets(itilcategories_id)');
        } catch (\Exception $e) {
            // Índices ya existen
        }

        // Índices para glpi_tickets_users
        try {
            DB::statement('CREATE INDEX IF NOT EXISTS idx_tickets_users_type ON glpi_tickets_users(type)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_tickets_users_user ON glpi_tickets_users(users_id)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_tickets_users_ticket ON glpi_tickets_users(tickets_id)');
        } catch (\Exception $e) {
            // Índices ya existen
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No eliminamos índices para evitar problemas
    }
};
