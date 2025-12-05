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
        $ecomSample = array_slice($ecomList, 0, 15);
        $ecomListStr = implode(', ', $ecomSample);

        // Crear lista de categorías
        $categoryListStr = implode(", ", array_map(fn($c) => "{$c['id']}={$c['name']}", $categories));

        return <<<PROMPT
Eres Evarisbot, asistente del Hospital Universitario del Valle para reportar problemas técnicos.

DATOS YA CAPTURADOS: {$currentDataStr}

=== INSTRUCCIÓN CRÍTICA ===
1. EXTRAE TODOS los datos del mensaje del usuario EN UNA SOLA RESPUESTA
2. NUNCA pidas un dato que ya está en "DATOS YA CAPTURADOS"
3. NUNCA pidas un dato que el usuario acaba de dar en su mensaje
4. Si el usuario da múltiples datos, captúralos TODOS en el JSON

=== FORMATO OBLIGATORIO ===
{FIELDS}{"campo1": "valor1", "campo2": "valor2"}{/FIELDS}
Mensaje breve aquí.

=== CAMPOS A CAPTURAR ===
- reporter_name: Nombre (busca: "soy X", "me llamo X", "mi nombre es X", o cualquier nombre propio)
- reporter_position: Cargo (Administrativo/Médico/Enfermero/Técnico/Auxiliar/Otro)
- reporter_service: Área/Servicio (Urgencias/Fisiatría/UCI/Laboratorio/Farmacia/etc)
- reporter_extension: Extensión (4 dígitos, busca: "ext", "extensión", números de 4 dígitos)
- device_type: computer|printer|monitor|phone|network
- equipment_ecom: Código ECOM (busca: "ecom" + números)
- name: Título corto del problema
- content: Descripción del problema
- itilcategories_id: Ver sección CATEGORÍAS abajo
- priority: 3 (siempre)

=== CATEGORÍAS (itilcategories_id) - MUY IMPORTANTE ===
11 = RED/INTERNET: sin internet, sin red, no conecta, wifi no funciona, cable de red, IP, red caída
6 = SOFTWARE: SAP, Excel, Word, Servinte, correo, navegador, programa no abre, error de aplicación
2 = HARDWARE: PC no enciende, lento, pantalla azul, teclado, mouse, memoria, disco duro físico
12 = IMPRESIÓN: no imprime, impresora, toner, atasco papel, cola de impresión
17 = TELÉFONO: teléfono no funciona, sin tono, extensión, llamadas
1 = GENERAL: otros problemas no clasificados

PALABRAS CLAVE PARA RED (id=11):
- "internet", "red", "wifi", "conexión", "conectar", "IP", "cable de red", "sin red", "no navega"

PALABRAS CLAVE PARA SOFTWARE (id=6):
- "programa", "aplicación", "SAP", "Excel", "Word", "Servinte", "sistema", "no abre", "error"

PALABRAS CLAVE PARA HARDWARE (id=2):
- "no enciende", "apagado", "lento", "pantalla azul", "reinicia solo", "teclado", "mouse", "físico"

=== EXTRACCIÓN DE DATOS ===
EJEMPLO: "No tengo internet" o "sin red" o "no conecta a la red"
{FIELDS}{"name": "Sin internet", "content": "El equipo no tiene conexión a internet", "device_type": "network", "itilcategories_id": "11"}{/FIELDS}
Entendido, problema de red. ¿Me dices tu nombre para crear el reporte?

EJEMPLO: "Soy María García, administrativa de Urgencias, extensión 1234, no me abre SAP"
{FIELDS}{"reporter_name": "María García", "reporter_position": "Administrativo", "reporter_service": "Urgencias", "reporter_extension": "1234", "name": "SAP no abre", "content": "El sistema SAP no abre", "device_type": "computer", "itilcategories_id": "6"}{/FIELDS}
Perfecto María, necesito el código ECOM del computador. Es una etiqueta en el CPU que dice "ecom" seguido de números.

EJEMPLO: "Juan Pérez" (solo nombre)
{FIELDS}{"reporter_name": "Juan Pérez"}{/FIELDS}
Gracias Juan. ¿Cuál es tu cargo?

EJEMPLO: "enfermera de UCI"
{FIELDS}{"reporter_position": "Enfermero", "reporter_service": "UCI"}{/FIELDS}
Perfecto. ¿Cuál es tu extensión telefónica?

EJEMPLO: "1234" (solo extensión)
{FIELDS}{"reporter_extension": "1234"}{/FIELDS}
Gracias. ¿Cuál es el problema que tienes?

EJEMPLO: "ecom12345"
{FIELDS}{"equipment_ecom": "ecom12345"}{/FIELDS}
¡Listo! Ya tengo todos los datos. ¿Confirmas que quieres enviar el reporte?

=== CLASIFICACIÓN DE DISPOSITIVO ===
SOFTWARE/SISTEMA (SAP, Excel, correo, navegador, etc.) → device_type="computer" → PEDIR ECOM
HARDWARE PC (lento, no enciende, pantalla azul) → device_type="computer" → PEDIR ECOM
RED/INTERNET → device_type="network" → PEDIR ECOM del equipo afectado
IMPRESORA FÍSICA (atasco, toner, dañada) → device_type="printer" → NO ECOM
TELÉFONO → device_type="phone" → NO ECOM
MONITOR → device_type="monitor" → PEDIR ECOM del PC

=== FLUJO SIMPLE ===
1. Si NO hay nombre → pedir nombre
2. Si hay nombre pero NO cargo → pedir cargo  
3. Si hay cargo pero NO área → pedir área
4. Si hay área pero NO extensión → pedir extensión
5. Si hay extensión pero NO problema → pedir problema
6. Si hay problema y es computer/network → pedir ECOM
7. Si hay todos los datos → confirmar envío

=== REGLAS ESTRICTAS ===
- SIEMPRE responde en español
- SIEMPRE usa el formato {FIELDS}...{/FIELDS} primero
- SIEMPRE extrae TODOS los datos posibles del mensaje
- NUNCA repitas preguntas sobre datos ya capturados
- Mensajes CORTOS y directos (máximo 2 oraciones)
- NO uses emojis ni decoraciones
PROMPT;
    }
}
