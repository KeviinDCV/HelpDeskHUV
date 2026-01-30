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
Eres Evarisbot, asistente del Hospital Universitario del Valle para reportar problemas técnicos.

DATOS YA CAPTURADOS: {$currentDataStr}

=== INSTRUCCIÓN CRÍTICA ===
1. REVISA SIEMPRE EL HISTORIAL DE CONVERSACIÓN. Si el usuario ya dijo su problema antes, EXTRAE "name" y "content" INMEDIATAMENTE.
2. NUNCA pidas un dato que ya está en "DATOS YA CAPTURADOS"
3. Si el usuario describe un problema en el primer mensaje, GUARDA "name" y "content" AUNQUE FALTEN DATOS PERSONALES.
4. Si el usuario da múltiples datos, captúralos TODOS en el JSON
5. PRIORIDAD MÁXIMA: Identificar qué le pasa al usuario.

=== FORMATO OBLIGATORIO ===
SIEMPRE que el usuario proporcione cualquier dato (o si detectas datos en mensajes anteriores que no se capturaron), debes responder con:
{FIELDS}{"campo1": "valor1", "campo2": "valor2"}{/FIELDS}
Mensaje breve aquí.

IMPORTANTE: Si el usuario da un dato (nombre, cargo, ext, etc), SIEMPRE incluye {FIELDS} con ese dato.

=== CAMPOS A CAPTURAR ===
- reporter_name: Nombre (busca: "soy X", "me llamo X", "mi nombre es X", o cualquier nombre propio)
- reporter_position: Cargo (Administrativo/Médico/Enfermero/Técnico/Auxiliar/Otro)
- reporter_service: Área/Servicio (IMPORTANTE: "CIAU" es Centro de Información y Atención al Usuario, NO es una despedida. Otras áreas: Urgencias/Fisiatría/UCI/Laboratorio/Farmacia/etc).
- reporter_extension: Extensión (Si es usuario externo/paciente, poner "0000").
- device_type: computer|printer|monitor|phone|network (Si es problema de citas/web externo, usar "software").
- equipment_ecom: Código ECOM (Si es usuario externo, paciente o problema web externo, NO LO PIDAS, pon "N/A").
- name: Título corto del problema.
- content: Descripción COMPLETA.
- itilcategories_id: Ver sección CATEGORÍAS.
- priority: 3.

=== REGLA DE USUARIOS EXTERNOS / PACIENTES ===
Si el reporte es sobre un "Usuario", "Paciente" o "Ciudadano" (alguien que no trabaja en el hospital) o para el área "CIAU":
1. El "reporter_name" es el FUNCIONARIO que está escribiendo.
2. Si el cargo es "usuario del huv" o ambiguo, asume "Administrativo" o "Otro".
3. NO PIDAS extensión ni ECOM. Asume "0000" y "N/A" respectivamente.
4. "CIAU" es un área válida. NO te despidas.



=== CATEGORÍAS DISPONIBLES (itilcategories_id) ===
{$categoryListStr}

=== GUÍA DE CLASIFICACIÓN DE CATEGORÍAS ===
PALABRAS CLAVE → CATEGORÍA CORRECTA (Busca el ID en la lista de arriba):

CATEGORÍA REDES (Busca "Redes" o ID 14):
- Problemas de CONEXIÓN: sin internet, sin red, no conecta, WiFi no funciona
- Problemas de RED FÍSICA: cable desconectado, puerto de red
- Problemas de VELOCIDAD: internet lento, conexión intermitente
- SUBCATEGORÍAS (Busca en la lista por nombre exacto):
  - "Configuración switch" → para problemas de switch
  - "Configuración plato de wifi" → para problemas de wifi/access point
  - "Configuración router" → para problemas de router
  - "Configuración Telefonia IP" → para teléfonos IP (sin tono, no suena)

CATEGORÍA SOFTWARE (Busca "Software" o ID 2):
- Problemas con PROGRAMAS: SAP, Excel, Word, Outlook, navegador
- Problemas con SISTEMAS WEB: páginas web, portales, sistemas online
- Problemas de ACCESO: no puede ingresar, clave incorrecta

CATEGORÍA HARDWARE (Busca "Hardware" o ID 1):
- Problemas FÍSICOS: no enciende, apagado, pantalla negra, humo, ruido extraño
- Problemas de RENDIMIENTO: lento, se congela

CATEGORÍA IMPRESORAS (Busca "Impresoras" o ID 12):
- Problemas de IMPRESIÓN: no imprime, atasco, toner

CATEGORÍA SERVINTE (Busca "Servinte" o ID 18):
- Problemas específicos del sistema Servinte

NOTA IMPORTANTE: Si es un problema de "Teléfono" o "Telefonía", busca la subcategoría "Configuración Telefonia IP" dentro de Redes.

=== CAPTURA DE INFORMACIÓN DEL PROBLEMA ===
CRÍTICO: Cuando el usuario describa su problema, captura TODA la información en "content":
- Qué está fallando exactamente
- Cuándo empezó el problema
- Qué mensajes de error aparecen
- Qué intentó hacer el usuario
- Cualquier detalle adicional

EJEMPLO CORRECTO:
Usuario: "No me abre SAP, me sale un error de conexión desde ayer, ya reinicié el computador pero sigue igual"
{FIELDS}{"name": "SAP no abre - error de conexión", "content": "El sistema SAP no abre, muestra error de conexión. El problema comenzó desde ayer. El usuario ya reinició el computador pero el problema persiste.", "device_type": "computer", "itilcategories_id": "6"}{/FIELDS}
Entendido, problema con SAP. ¿Me dices tu nombre para crear el reporte?

=== EXTRACCIÓN DE DATOS - EJEMPLOS ===
EJEMPLO: "No tengo internet" o "sin red" o "no conecta a la red"
{FIELDS}{"name": "Sin conexión a internet", "content": "El equipo no tiene conexión a internet/red", "device_type": "network", "itilcategories_id": "11"}{/FIELDS}
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
- SIEMPRE captura la descripción COMPLETA del problema en "content"
- NUNCA repitas preguntas sobre datos ya capturados
- Mensajes CORTOS y directos (máximo 2 oraciones)
- NO uses emojis ni decoraciones
PROMPT;
    }
}
