<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PublicTicketController extends Controller
{
    /**
     * Mostrar el formulario público para reportar un caso
     */
    public function create()
    {
        // Obtener ubicaciones
        $locations = DB::table('glpi_locations')
            ->select('id', 'name', 'completename')
            ->orderBy('completename')
            ->get();

        // Obtener categorías de tickets
        $categories = DB::table('glpi_itilcategories')
            ->select('id', 'name', 'completename')
            ->where('is_incident', 1)
            ->orderBy('completename')
            ->get();

        return Inertia::render('public/reportar-caso', [
            'locations' => $locations,
            'categories' => $categories,
        ]);
    }

    /**
     * Guardar el reporte público
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'reporter_name' => 'required|string|max:255',
            'reporter_position' => 'required|string|max:255',
            'reporter_service' => 'required|string|max:255',
            'reporter_extension' => 'nullable|string|max:20',
            'reporter_email' => 'nullable|email|max:255',
            'name' => 'required|string|max:255',
            'content' => 'required|string',
            'priority' => 'required|integer|min:1|max:6',
            'locations_id' => 'nullable|integer',
            'itilcategories_id' => 'nullable|integer',
        ]);

        // Crear el ticket
        $ticketId = DB::table('glpi_tickets')->insertGetId([
            'entities_id' => 0,
            'name' => $validated['name'],
            'date' => now(),
            'date_mod' => now(),
            'date_creation' => now(),
            'status' => 1, // Nuevo
            'priority' => $validated['priority'],
            'urgency' => $validated['priority'],
            'impact' => 3, // Media
            'content' => $this->formatContent($validated),
            'type' => 1, // Incidencia
            'locations_id' => $validated['locations_id'] ?? 0,
            'itilcategories_id' => $validated['itilcategories_id'] ?? 0,
            'users_id_recipient' => 0, // Usuario anónimo/externo
            'users_id_lastupdater' => 0,
            'is_deleted' => 0,
            'requesttypes_id' => 1, // Solicitud web
        ]);

        return redirect()->route('reportar')->with('success', [
            'message' => '¡Reporte enviado exitosamente!',
            'ticket_id' => $ticketId,
        ]);
    }

    /**
     * Formatear el contenido del ticket con la información del reportante
     */
    private function formatContent(array $data): string
    {
        $content = "<p><strong>Información del Reportante:</strong></p>";
        $content .= "<ul>";
        $content .= "<li><strong>Nombre:</strong> {$data['reporter_name']}</li>";
        $content .= "<li><strong>Cargo:</strong> {$data['reporter_position']}</li>";
        $content .= "<li><strong>Servicio:</strong> {$data['reporter_service']}</li>";
        
        if (!empty($data['reporter_extension'])) {
            $content .= "<li><strong>Extensión:</strong> {$data['reporter_extension']}</li>";
        }
        
        if (!empty($data['reporter_email'])) {
            $content .= "<li><strong>Correo:</strong> {$data['reporter_email']}</li>";
        }
        
        $content .= "</ul>";
        $content .= "<hr>";
        $content .= "<p><strong>Descripción del Problema:</strong></p>";
        $content .= "<p>{$data['content']}</p>";

        return $content;
    }
}
