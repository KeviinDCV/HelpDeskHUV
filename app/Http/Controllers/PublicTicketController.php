<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class PublicTicketController extends Controller
{
    /**
     * Mostrar el formulario público para reportar un caso
     */
    public function create()
    {
        return Inertia::render('public/reportar-caso');
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
            'device_type' => 'nullable|string|max:50',
            'equipment_ecom' => 'nullable|string|max:100',
            'itilcategories_id' => 'nullable|integer',
        ]);

        // Mejorar título y descripción con IA
        $improved = $this->improveWithAI($validated);
        
        // Crear el ticket con datos mejorados
        $ticketId = DB::table('glpi_tickets')->insertGetId([
            'entities_id' => 0,
            'name' => $improved['name'],
            'date' => now(),
            'date_mod' => now(),
            'date_creation' => now(),
            'status' => 1, // Nuevo
            'priority' => $validated['priority'],
            'urgency' => $validated['priority'],
            'impact' => 3, // Media
            'content' => $this->formatContent($validated, $improved['content']),
            'type' => 1, // Incidencia
            'locations_id' => 0,
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
     * Mejorar título y descripción usando IA
     */
    private function improveWithAI(array $data): array
    {
        $deviceLabels = [
            'computer' => 'Computador',
            'monitor' => 'Monitor',
            'printer' => 'Impresora',
            'phone' => 'Teléfono',
            'network' => 'Red / Internet',
            'software' => 'Programa / Sistema',
            'other' => 'Otro',
        ];

        $deviceType = $deviceLabels[$data['device_type'] ?? ''] ?? 'No especificado';

        $prompt = <<<PROMPT
Eres un asistente técnico de un hospital. Tu tarea es mejorar y clarificar un reporte de problema técnico.

DATOS DEL REPORTE:
- Título original: {$data['name']}
- Descripción original: {$data['content']}
- Tipo de dispositivo: {$deviceType}
- Servicio/Área: {$data['reporter_service']}

INSTRUCCIONES:
1. Genera un título claro, profesional y específico (máximo 80 caracteres)
2. Genera una descripción técnica clara y detallada que incluya:
   - Qué dispositivo está afectado
   - Cuál es el problema específico
   - Información relevante del contexto

Responde ÚNICAMENTE en formato JSON así:
{"name": "título mejorado", "content": "descripción mejorada"}
PROMPT;

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . env('GROQ_API_KEY'),
                'Content-Type' => 'application/json',
            ])->timeout(10)->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'llama-3.1-8b-instant',
                'messages' => [
                    ['role' => 'system', 'content' => 'Responde únicamente en JSON válido.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.3,
                'max_tokens' => 500,
            ]);

            if ($response->successful()) {
                $content = $response->json()['choices'][0]['message']['content'] ?? '';
                
                // Intentar parsear JSON
                $jsonMatch = [];
                if (preg_match('/\{[^}]+\}/', $content, $jsonMatch)) {
                    $parsed = json_decode($jsonMatch[0], true);
                    if ($parsed && isset($parsed['name']) && isset($parsed['content'])) {
                        return [
                            'name' => substr($parsed['name'], 0, 255),
                            'content' => $parsed['content'],
                        ];
                    }
                }
            }
        } catch (\Exception $e) {
            // Si falla la IA, usar datos originales
        }

        // Fallback: usar datos originales
        return [
            'name' => $data['name'],
            'content' => $data['content'],
        ];
    }

    /**
     * Formatear el contenido del ticket con la información del reportante
     */
    private function formatContent(array $data, string $improvedContent): string
    {
        // Mapeo de tipos de dispositivo
        $deviceLabels = [
            'computer' => 'Computador',
            'monitor' => 'Monitor',
            'printer' => 'Impresora',
            'phone' => 'Teléfono',
            'network' => 'Red / Internet',
            'software' => 'Programa / Sistema',
            'other' => 'Otro',
        ];

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
        
        if (!empty($data['device_type'])) {
            $deviceLabel = $deviceLabels[$data['device_type']] ?? $data['device_type'];
            $content .= "<p><strong>Tipo de dispositivo:</strong> {$deviceLabel}</p>";
        }
        
        if (!empty($data['equipment_ecom'])) {
            $content .= "<p><strong>ECOM del equipo:</strong> {$data['equipment_ecom']}</p>";
        }
        
        $content .= "<hr>";
        $content .= "<p><strong>Descripción del Problema:</strong></p>";
        $content .= "<p>{$improvedContent}</p>";
        
        // Agregar descripción original si es diferente
        if ($improvedContent !== $data['content']) {
            $content .= "<hr>";
            $content .= "<p><em><strong>Descripción original del usuario:</strong></em></p>";
            $content .= "<p><em>{$data['content']}</em></p>";
        }

        return $content;
    }
}
