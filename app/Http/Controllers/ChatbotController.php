<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class ChatbotController extends Controller
{
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
                        'Authorization' => 'Bearer ' . env('GROQ_API_KEY'),
                        'Content-Type' => 'application/json',
                    ])->post('https://api.groq.com/openai/v1/chat/completions', [
                        'model' => 'llama-3.3-70b-versatile',
                        'messages' => $messages,
                        'temperature' => 0.3,
                        'max_tokens' => 600,
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

            // Log del error de Groq para depuración
            \Log::error('Groq API Error', [
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

        // Buscar patrón JSON en la respuesta (case insensitive)
        if (preg_match('/\{FIELDS\}(.*?)\{\/FIELDS\}/si', $response, $matches)) {
            $jsonStr = trim($matches[1]);
            
            // Log del JSON encontrado
            \Log::info('Chatbot JSON Found', ['json_str' => $jsonStr]);
            
            $decoded = json_decode($jsonStr, true);
            if (is_array($decoded)) {
                $fields = $decoded;
            } else {
                \Log::warning('Chatbot JSON Parse Failed', [
                    'json_str' => $jsonStr,
                    'json_error' => json_last_error_msg()
                ]);
            }
            // Remover el bloque de campos del mensaje
            $message = trim(preg_replace('/\{FIELDS\}.*?\{\/FIELDS\}/si', '', $response));
        } else {
            // Intentar buscar JSON directo si no hay tags FIELDS
            if (preg_match('/\{[^}]+\}/s', $response, $jsonMatch)) {
                $decoded = json_decode($jsonMatch[0], true);
                if (is_array($decoded) && !empty($decoded)) {
                    // Verificar que tenga campos válidos del formulario
                    $validFields = ['reporter_name', 'reporter_position', 'reporter_service', 
                                   'reporter_extension', 'name', 'content', 'device_type', 
                                   'equipment_ecom', 'priority', 'itilcategories_id'];
                    $hasValidField = false;
                    foreach (array_keys($decoded) as $key) {
                        if (in_array($key, $validFields)) {
                            $hasValidField = true;
                            break;
                        }
                    }
                    if ($hasValidField) {
                        $fields = $decoded;
                        $message = trim(preg_replace('/\{[^}]+\}/', '', $response));
                        \Log::info('Chatbot JSON Found (no tags)', ['fields' => $fields]);
                    }
                }
            }
        }

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
            ->select('id', 'name')
            ->where('is_incident', 1)
            ->whereIn('id', [1, 2, 6, 11, 12, 14, 17, 18]) // Categorías principales útiles
            ->orderBy('id')
            ->get()
            ->map(fn($c) => ['id' => $c->id, 'name' => $c->name])
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
        $ecomSample = array_slice($ecomList, 0, 10);
        $ecomListStr = implode(', ', $ecomSample);

        // Crear lista de categorías
        $categoryListStr = implode(", ", array_map(fn($c) => "{$c['id']}={$c['name']}", $categories));

        return <<<PROMPT
Eres Evarisbot del Hospital Universitario del Valle. Capturas datos para reportes técnicos.

DATOS YA CAPTURADOS: {$currentDataStr}

REGLAS CRÍTICAS:
1. REVISA los DATOS YA CAPTURADOS antes de preguntar algo
2. NO vuelvas a preguntar por datos que YA TIENES
3. Si el usuario da MÚLTIPLES datos nuevos, captúralos TODOS

FORMATO OBLIGATORIO:
{FIELDS}{"campo": "valor", ...}{/FIELDS}
Una sola pregunta corta sobre lo que falta

CAMPOS:
- reporter_name: nombre
- reporter_position: cargo (Administrativo, Médico, Enfermero, Técnico)
- reporter_service: área/servicio
- reporter_extension: extensión telefónica
- device_type: IMPORTANTE - tipo de equipo CON el problema:
  * computer = COMPUTADOR (incluso si el problema es que no imprime)
  * printer = IMPRESORA (el problema ES la impresora física)
  * monitor = MONITOR
  * phone = TELÉFONO
  * network = RED/WIFI
  * software = PROGRAMA/SISTEMA
- equipment_ecom: código ECOM (ecomXXXXX)
- name: título corto del problema
- content: descripción del problema
- priority: 3
- itilcategories_id: CATEGORÍA DEL PROBLEMA (ver guía abajo)

CATEGORÍAS DISPONIBLES ({$categoryListStr}):
GUÍA DE SELECCIÓN DE CATEGORÍAS:
- Problemas de IMPRESIÓN (impresora no imprime, atasco, toner): id=12
- Problemas de RED/INTERNET (sin conexión, lento, wifi): id=11
- Problemas de HARDWARE/PC (computador no enciende, lento, pantalla): id=2
- Problemas de SOFTWARE/PROGRAMAS (Excel, Word, sistema): id=6
- Problemas de TELÉFONO: id=17
- Problemas GENERALES: id=1

EJEMPLOS CRÍTICOS:
Usuario: "La impresora no imprime"
{FIELDS}{"name": "Impresora no imprime", "content": "La impresora no imprime", "device_type": "printer", "itilcategories_id": "12"}{/FIELDS}

Usuario: "Mi PC no imprime"
{FIELDS}{"name": "Computador no imprime", "content": "El computador no puede imprimir", "device_type": "computer", "itilcategories_id": "12"}{/FIELDS}

Usuario: "No tengo internet"
{FIELDS}{"name": "Sin conexión a internet", "content": "No tengo conexión a internet", "device_type": "network", "itilcategories_id": "11"}{/FIELDS}

FLUJO:
1. Nombre → reporter_name
2. Cargo → reporter_position (VALORES: Administrativo, Médico, Enfermero, Técnico)
3. Área → reporter_service
4. Extensión → reporter_extension
5. Problema → name, content, device_type, itilcategories_id (USA LA GUÍA ARRIBA)
6. Si es hardware sin ECOM → preguntar ECOM

EJEMPLOS DE CAPTURA DE CARGO:
Usuario: "Soy Administrativo" o "Administrativo"
{FIELDS}{"reporter_position": "Administrativo"}{/FIELDS}

Usuario: "Soy médico" o "Médico"
{FIELDS}{"reporter_position": "Médico"}{/FIELDS}

Usuario: "Trabajo como enfermero"
{FIELDS}{"reporter_position": "Enfermero"}{/FIELDS}

ESTILO DE RESPUESTA:
- Sé CONCISO y directo
- NO uses múltiples saltos de línea entre tus mensajes
- Usa máximo un salto de línea entre el saludo y la pregunta
- Mantén un tono amigable pero eficiente

IMPORTANTE: 
1. NUNCA preguntes por datos que YA ESTÁN en "DATOS YA CAPTURADOS"
2. Solo HAZ UNA PREGUNTA por respuesta
3. SIEMPRE asigna la categoría más específica según la GUÍA DE CATEGORÍAS
4. device_type es el equipo CON el problema, NO el equipo que falla como consecuencia
PROMPT;
    }
}
