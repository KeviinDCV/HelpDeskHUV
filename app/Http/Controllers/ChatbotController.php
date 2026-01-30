<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class ChatbotController extends Controller
{
    /**
     * Obtener datos del sistema para el chatbot (ECOMs y categorías)
     */
    public function getSystemData()
    {
        return response()->json([
            'ecomList' => $this->getEcomList(),
            'categories' => $this->getCategoryList(),
        ]);
    }

    /**
     * Procesar mensaje del chatbot usando Puter.js
     */
    public function chatPuter(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'context' => 'nullable|array',
            'currentFormData' => 'nullable|array',
            'filledFields' => 'nullable|array',
        ]);

        $userMessage = $request->input('message');
        $context = $request->input('context', []);
        $currentFormData = $request->input('currentFormData', []);
        $filledFields = $request->input('filledFields', []);
        
        // Obtener lista de ECOMs si el problema es con computador
        $ecomList = $this->getEcomList();
        
        // Obtener categorías disponibles
        $categories = $this->getCategoryList();

        $systemPrompt = $this->getSystemPrompt($currentFormData, $filledFields, $ecomList, $categories);
        
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        // Agregar solo los últimos 4 mensajes del contexto para reducir tokens
        $recentContext = array_slice($context, -4);
        foreach ($recentContext as $msg) {
            $messages[] = $msg;
        }

        $messages[] = ['role' => 'user', 'content' => $userMessage];

        try {
            // Usar OpenRouter en lugar de Puter API directa para evitar problemas de autenticación
            // Reutilizamos la lógica del método chat() pero manteniendo este endpoint
            
            $maxRetries = 2;
            $response = null;
            
            for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
                try {
                    $response = Http::timeout(45)->connectTimeout(15)->withHeaders([
                        'Authorization' => 'Bearer ' . env('OPENROUTER_API_KEY'),
                        'HTTP-Referer' => config('app.url'),
                        'X-Title' => config('app.name'),
                        'Content-Type' => 'application/json',
                    ])->post('https://openrouter.ai/api/v1/chat/completions', [
                        'model' => 'gpt-4o-mini', // Modelo eficiente
                        // 'model' => 'z-ai/glm-4.5-air:free', // Alternativa gratuita si se prefiere
                        'messages' => $messages,
                        'temperature' => 0.1,
                        'max_tokens' => 500,
                    ]);

                    if ($response->successful() || $response->status() !== 429) {
                        break;
                    }
                    if ($attempt < $maxRetries) sleep(2);
                } catch (\Exception $e) {
                    if ($attempt >= $maxRetries) throw $e;
                    sleep(1);
                }
            }

            if ($response->successful()) {
                $data = $response->json();
                $assistantResponse = $data['choices'][0]['message']['content'] ?? '';
                
                \Log::info('Chatbot AI Response', ['raw' => $assistantResponse]);
                
                $parsed = $this->parseResponse($assistantResponse);
                
                \Log::info('Chatbot Parsed', [
                    'fields' => $parsed['fields'],
                    'message' => $parsed['message'],
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => $parsed['message'],
                    'fields' => $parsed['fields'],
                ]);
            }

            \Log::error('AI API Error', ['status' => $response->status(), 'body' => $response->body()]);

            return response()->json([
                'success' => false,
                'message' => 'Error al comunicarse con el asistente.',
            ], 500);

        } catch (\Exception $e) {
            \Log::error('Chatbot Exception', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error de conexión. Por favor intenta de nuevo.',
            ], 500);
        }
    }

    /**
     * Procesar mensaje del chatbot
     */
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'context' => 'nullable|array',
            'currentFormData' => 'nullable|array',
            'filledFields' => 'nullable|array',
        ]);

        $userMessage = $request->input('message');
        $context = $request->input('context', []);
        $currentFormData = $request->input('currentFormData', []);
        $filledFields = $request->input('filledFields', []);
        
        // Obtener lista de ECOMs si el problema es con computador
        $ecomList = $this->getEcomList();
        
        // Obtener categorías disponibles
        $categories = $this->getCategoryList();

        $systemPrompt = $this->getSystemPrompt($currentFormData, $filledFields, $ecomList, $categories);
        
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        // Agregar solo los últimos 4 mensajes del contexto para reducir tokens
        $recentContext = array_slice($context, -4);
        foreach ($recentContext as $msg) {
            $messages[] = $msg;
        }

        $messages[] = ['role' => 'user', 'content' => $userMessage];

        try {
            $maxRetries = 2;
            $response = null;
            
            for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
                try {
                    $response = Http::timeout(45)->connectTimeout(15)->withHeaders([
                        'Authorization' => 'Bearer ' . env('OPENROUTER_API_KEY'),
                        'HTTP-Referer' => config('app.url'),
                        'X-Title' => config('app.name'),
                        'Content-Type' => 'application/json',
                    ])->post('https://openrouter.ai/api/v1/chat/completions', [
                        'model' => 'z-ai/glm-4.5-air:free',
                        'messages' => $messages,
                        'temperature' => 0.1,
                        'max_tokens' => 500,
                        'top_p' => 0.9,
                    ]);

                    // Si es exitoso o no es rate limit, salir del loop
                    if ($response->successful() || $response->status() !== 429) {
                        break;
                    }

                    // Si es rate limit, esperar y reintentar
                    if ($attempt < $maxRetries) {
                        sleep(2);
                    }
                } catch (\Illuminate\Http\Client\ConnectionException $e) {
                    \Log::warning('Chatbot Connection Retry', ['attempt' => $attempt, 'error' => $e->getMessage()]);
                    if ($attempt >= $maxRetries) {
                        throw $e;
                    }
                    sleep(1);
                }
            }

            if ($response->successful()) {
                $data = $response->json();
                $assistantResponse = $data['choices'][0]['message']['content'] ?? '';
                
                // Log para debug
                \Log::info('Chatbot Response', [
                    'raw_response' => $assistantResponse,
                ]);
                
                // Parsear la respuesta para extraer campos y mensaje
                $parsed = $this->parseResponse($assistantResponse);
                
                // Log del parsing
                \Log::info('Chatbot Parsed', [
                    'fields' => $parsed['fields'],
                    'message' => $parsed['message'],
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => $parsed['message'],
                    'fields' => $parsed['fields'],
                ]);
            }

            // Log del error de OpenRouter para depuración
            \Log::error('OpenRouter API Error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            // Mensaje más amigable para rate limit
            if ($response->status() === 429) {
                return response()->json([
                    'success' => true,
                    'message' => 'Estoy procesando muchas solicitudes. Por favor espera unos segundos e intenta de nuevo.',
                    'fields' => [],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Error al comunicarse con el asistente.',
            ], 500);

        } catch (\Exception $e) {
            \Log::error('Chatbot Exception', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error de conexión. Por favor intenta de nuevo.',
            ], 500);
        }
    }

    /**
     * Parsear la respuesta del modelo para extraer campos y mensaje
     */
    private function parseResponse(string $response): array
    {
        $fields = [];
        $message = $response;
        $validFields = ['reporter_name', 'reporter_position', 'reporter_service', 
                       'reporter_extension', 'name', 'content', 'device_type', 
                       'equipment_ecom', 'priority', 'itilcategories_id'];

        // 1. Buscar patrón {FIELDS}...{/FIELDS}
        if (preg_match('/\{FIELDS\}(.*?)\{\/FIELDS\}/si', $response, $matches)) {
            $jsonStr = trim($matches[1]);
            $decoded = json_decode($jsonStr, true);
            if (is_array($decoded)) {
                $fields = array_intersect_key($decoded, array_flip($validFields));
            }
            $message = trim(preg_replace('/\{FIELDS\}.*?\{\/FIELDS\}/si', '', $response));
        } 
        // 2. Buscar JSON suelto con múltiples campos
        elseif (preg_match('/\{[^{}]*"[a-z_]+"\s*:\s*"[^"]*"[^{}]*\}/si', $response, $jsonMatch)) {
            $decoded = json_decode($jsonMatch[0], true);
            if (is_array($decoded)) {
                $filtered = array_intersect_key($decoded, array_flip($validFields));
                if (!empty($filtered)) {
                    $fields = $filtered;
                    $message = trim(str_replace($jsonMatch[0], '', $response));
                }
            }
        }

        // Limpiar mensaje de artefactos
        $message = preg_replace('/\{[^}]*\}/', '', $message);
        $message = preg_replace('/\s+/', ' ', $message);
        $message = trim($message);

        // Si el mensaje quedó vacío, usar uno por defecto
        if (empty($message)) {
            $message = 'Entendido. ¿Algo más que necesites?';
        }

        \Log::info('Chatbot Parsed', ['fields' => $fields, 'message' => substr($message, 0, 100)]);

        return [
            'message' => $message,
            'fields' => $fields,
        ];
    }

    /**
     * Obtener lista de categorías ITIL (principales)
     */
    private function getCategoryList(): array
    {
        return DB::table('glpi_itilcategories')
            ->select('id', 'name', 'completename')
            ->where('is_incident', 1)
            ->where(function ($query) {
                // Categorías principales por ID
                $query->whereIn('id', [1, 2, 6, 11, 12, 14, 18])
                    // O subcategorías de Redes (que empiezan con "Redes >")
                    ->orWhere('completename', 'like', 'Redes > %')
                    // O si Configuración Telefonia IP quedó suelta (por si acaso)
                    ->orWhere('name', 'like', 'Configuración Telefonia IP');
            })
            ->orderBy('completename')
            ->get()
            ->map(fn($c) => ['id' => $c->id, 'name' => $c->completename]) // Usar nombre completo para mayor contexto
            ->toArray();
    }

    /**
     * Obtener lista de ECOMs de computadores
     */
    private function getEcomList(): array
    {
        return DB::table('glpi_computers')
            ->select('id', 'name')
            ->where('is_deleted', 0)
            ->whereNotNull('name')
            ->where('name', '!=', '')
            ->orderBy('name')
            ->limit(100) // Limitar para no sobrecargar
            ->get()
            ->map(fn($c) => $c->name)
            ->toArray();
    }

    /**
     * Buscar ECOMs similares
     */
    private function findSimilarEcoms(string $ecom, array $ecomList): array
    {
        $similar = [];
        $ecomLower = strtolower($ecom);
        
        foreach ($ecomList as $existing) {
            $existingLower = strtolower($existing);
            // Buscar coincidencias parciales
            if (str_contains($existingLower, $ecomLower) || 
                str_contains($ecomLower, $existingLower) ||
                similar_text($ecomLower, $existingLower) > strlen($ecomLower) * 0.6) {
                $similar[] = $existing;
                if (count($similar) >= 3) break; // Máximo 3 sugerencias
            }
        }
        
        return $similar;
    }

    /**
     * Obtener el prompt del sistema para el chatbot
     */
    private function getSystemPrompt(array $formData, array $filledFields, array $ecomList, array $categories): string
    {
        // Construir info de campos ya llenados con sus valores actuales
        $currentData = [];
        foreach ($formData as $key => $value) {
            if (!empty($value) && $value !== '') {
                $currentData[] = "$key: \"$value\"";
            }
        }
        $currentDataStr = empty($currentData) ? "Ninguno" : implode(", ", $currentData);

        // Crear muestra de ECOMs para el prompt
        $ecomSample = array_slice($ecomList, 0, 15);
        $ecomListStr = implode(', ', $ecomSample);

        // Crear lista de categorías COMPLETA con descripciones
        $categoryListStr = implode("\n", array_map(fn($c) => "  - {$c['id']} = {$c['name']}", $categories));

        return <<<PROMPT
Eres Evarisbot, asistente técnico del Hospital Universitario del Valle.
Tu trabajo es recolectar información para crear un reporte de soporte técnico.

DATOS QUE YA TIENES: {$currentDataStr}

OBJETIVO: Obtener los siguientes datos si faltan:
1. Nombre del reportante (reporter_name) -> Si no lo tienes, pídelo.
2. Cargo (reporter_position) -> Si dice "usuario", "paciente" o "externo", acepta el cargo como "Otro".
3. Área/Servicio (reporter_service) -> "CIAU" es un área válida.
4. Extensión telefónica (reporter_extension) -> Si no tiene o es externo, pon "0000".
5. Tipo de dispositivo (device_type: computer, printer, software, network)
6. Código ECOM (equipment_ecom) -> Solo para equipos físicos (PC, Pantalla) del hospital. Si es externo/software/impresora, NO lo pidas (pon "N/A" si es necesario).
7. Detalles del problema (name: título corto, content: detalle completo).

REGLAS DE ORO:
- Si el usuario dice "usuario del huv" o "externo", entiende que es un reporte de un tercero y NO pidas extensión ni ECOM.
- Si el usuario ya describió el problema al inicio, GUARDA "name" y "content" de inmediato. Revisa el historial.
- NO vuelvas a pedir datos que ya tienes en "DATOS QUE YA TIENES".
- Mensajes breves y directos. No uses emojis.
- Responde SIEMPRE en Español.

FORMATO JSON OBLIGATORIO AL INICIO:
{FIELDS}{"campo": "valor"}{/FIELDS}
Tu mensaje aquí...

EJEMPLOS DE INTERACCIÓN:

Usuario: "Soy Pedro, usuario externo, no puedo pedir citas"
Bot: {FIELDS}{"reporter_name": "Pedro", "reporter_position": "Otro", "name": "Fallo citas web", "content": "No puede pedir citas (externo)", "device_type": "software", "reporter_extension": "0000", "equipment_ecom": "N/A"}{/FIELDS}
Entendido Pedro. ¿De qué área me escribes o es un reporte desde casa?

Usuario: "Ciau"
Bot: {FIELDS}{"reporter_service": "CIAU"}{/FIELDS}
Perfecto. ¿Cuál es el problema?

CATEGORÍAS DISPONIBLES (itilcategories_id):
{$categoryListStr}

Si detectas un problema de REDES y mencionan "switch" o "wifi", usa la subcategoría correcta (ej. ID 14).
PROMPT;
    }
}
