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
        // Log para debug
        \Log::info('PublicTicket Store - Input', $request->all());
        
        $validated = $request->validate([
            'reporter_name' => 'required|string|max:255',
            'reporter_position' => 'required|string|max:255',
            'reporter_service' => 'required|string|max:255',
            'reporter_extension' => 'nullable|string|max:20',
            'reporter_email' => 'nullable|email|max:255',
            'name' => 'required|string|max:255',
            'content' => 'required|string',
            'priority' => 'required',
            'device_type' => 'nullable|string|max:50',
            'equipment_ecom' => 'nullable|string|max:100',
            'itilcategories_id' => 'nullable',
        ]);

        // Mejorar título y descripción con IA
        $improved = $this->improveWithAI($validated);
        
        // Buscar localización basada en el servicio/área del reportante
        $locationId = $this->findLocationId($validated['reporter_service']);
        
        // Convertir campos a integer
        $priority = (int) ($validated['priority'] ?? 3);
        $categoryId = !empty($validated['itilcategories_id']) ? (int) $validated['itilcategories_id'] : 0;
        
        \Log::info('PublicTicket - Category ID', ['raw' => $validated['itilcategories_id'] ?? 'null', 'converted' => $categoryId]);
        
        // Crear el ticket con datos mejorados
        $ticketId = DB::table('glpi_tickets')->insertGetId([
            'entities_id' => 0,
            'name' => $improved['name'],
            'date' => now(),
            'date_mod' => now(),
            'date_creation' => now(),
            'status' => 1, // Nuevo
            'priority' => $priority,
            'urgency' => $priority,
            'impact' => 3, // Media
            'content' => $this->formatContent($validated, $improved['content']),
            'type' => 1, // Incidencia
            'locations_id' => $locationId,
            'itilcategories_id' => $categoryId,
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
                'model' => 'llama-3.3-70b-versatile',
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
        $deviceLabels = [
            'computer' => 'Computador',
            'monitor' => 'Monitor',
            'printer' => 'Impresora',
            'phone' => 'Teléfono',
            'network' => 'Red / Internet',
            'software' => 'Programa / Sistema',
            'other' => 'Otro',
        ];

        $lines = [];
        
        // Descripción del problema (lo más importante primero)
        $lines[] = $improvedContent;
        $lines[] = "";
        
        // Información del equipo
        if (!empty($data['equipment_ecom'])) {
            $lines[] = "ECOM: " . strtoupper($data['equipment_ecom']);
        }
        
        if (!empty($data['device_type'])) {
            $deviceLabel = $deviceLabels[$data['device_type']] ?? $data['device_type'];
            $lines[] = "Tipo de equipo: {$deviceLabel}";
        }
        
        $lines[] = "";
        $lines[] = "--- Datos del reportante ---";
        $lines[] = "Nombre: {$data['reporter_name']}";
        $lines[] = "Cargo: {$data['reporter_position']}";
        $lines[] = "Área: {$data['reporter_service']}";
        
        if (!empty($data['reporter_extension'])) {
            $lines[] = "Extensión: {$data['reporter_extension']}";
        }

        return implode("\n", $lines);
    }

    /**
     * Buscar localización por nombre del servicio/área
     */
    private function findLocationId(string $service): int
    {
        $serviceLower = mb_strtolower(trim($service));
        
        // Primero buscar coincidencia exacta
        $exact = DB::table('glpi_locations')
            ->whereRaw('LOWER(name) = ?', [$serviceLower])
            ->orWhereRaw('LOWER(completename) LIKE ?', ['%' . $serviceLower . '%'])
            ->first();
        
        if ($exact) {
            return $exact->id;
        }
        
        // Buscar por palabras clave del servicio
        $words = array_filter(explode(' ', $serviceLower), fn($w) => strlen($w) > 3);
        
        if (!empty($words)) {
            foreach ($words as $word) {
                $found = DB::table('glpi_locations')
                    ->whereRaw('LOWER(name) LIKE ?', ['%' . $word . '%'])
                    ->orWhereRaw('LOWER(completename) LIKE ?', ['%' . $word . '%'])
                    ->first();
                
                if ($found) {
                    return $found->id;
                }
            }
        }
        
        // Si no encuentra, buscar la más similar usando todas las localizaciones
        $locations = DB::table('glpi_locations')
            ->select('id', 'name', 'completename')
            ->get();
        
        $bestMatch = null;
        $bestScore = 0;
        
        foreach ($locations as $location) {
            $nameLower = mb_strtolower($location->name ?? '');
            $completeLower = mb_strtolower($location->completename ?? '');
            
            // Calcular similitud
            similar_text($serviceLower, $nameLower, $scoreA);
            similar_text($serviceLower, $completeLower, $scoreB);
            $score = max($scoreA, $scoreB);
            
            if ($score > $bestScore && $score > 30) { // Mínimo 30% de similitud
                $bestScore = $score;
                $bestMatch = $location->id;
            }
        }
        
        return $bestMatch ?? 0;
    }
}
