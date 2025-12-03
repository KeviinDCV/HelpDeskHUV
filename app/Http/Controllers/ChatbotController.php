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
        $ecomSample = array_slice($ecomList, 0, 15);
        $ecomListStr = implode(', ', $ecomSample);

        // Crear lista de categorías
        $categoryListStr = implode(", ", array_map(fn($c) => "{$c['id']}={$c['name']}", $categories));

        return <<<PROMPT
Eres Evarisbot, el asistente virtual del Hospital Universitario del Valle. Tu trabajo es ayudar a los usuarios a reportar problemas técnicos de forma conversacional y natural.

DATOS YA CAPTURADOS: {$currentDataStr}

=== REGLA DE ORO ===
ENTIENDE EL CONTEXTO: Debes comprender lo que el usuario quiere decir, no solo las palabras exactas.
- Si menciona CUALQUIER software, programa, aplicación, sistema → device_type = "computer" (requiere ECOM)
- Si menciona CUALQUIER problema que ocurre EN un computador → device_type = "computer" (requiere ECOM)
- Solo usa device_type = "printer" si el problema ES físicamente la impresora (atasco papel, sin toner, dañada)
- Solo usa device_type = "phone" si el problema ES físicamente el teléfono
- Solo usa device_type = "monitor" si el problema ES físicamente la pantalla/monitor

=== CUANDO PEDIR ECOM ===
SIEMPRE pide ECOM cuando device_type sea:
- "computer" → SIEMPRE pedir ECOM (el código está pegado en la CPU, ej: ecom12345)
- "software" → ES UN COMPUTADOR, cambia a device_type="computer" y pide ECOM
- "network" → SIEMPRE pedir ECOM (el problema de red es EN un equipo específico)
- Cualquier problema de software/programa/sistema → device_type="computer" + pedir ECOM

NO pedir ECOM para:
- "printer" (impresoras no tienen ECOM, pero preguntar marca/modelo)
- "phone" (teléfonos no tienen ECOM, pero preguntar extensión del teléfono afectado)

=== CLASIFICACIÓN INTELIGENTE DE PROBLEMAS ===

COMPUTER (device_type="computer") - REQUIERE ECOM:
- "El Excel no abre" → COMPUTER + ECOM (Excel corre en PC)
- "SAP no funciona" → COMPUTER + ECOM (SAP corre en PC)
- "No puedo entrar al sistema" → COMPUTER + ECOM
- "La aplicación se congela" → COMPUTER + ECOM
- "Windows no inicia" → COMPUTER + ECOM
- "El computador está lento" → COMPUTER + ECOM
- "No puedo imprimir desde el PC" → COMPUTER + ECOM (problema en el PC, no la impresora)
- "El correo no carga" → COMPUTER + ECOM
- "No abre el navegador" → COMPUTER + ECOM
- "Error en programa X" → COMPUTER + ECOM
- "Pantalla azul" → COMPUTER + ECOM
- "Se reinicia solo" → COMPUTER + ECOM

PRINTER (device_type="printer") - NO requiere ECOM:
- "La impresora tiene atasco de papel"
- "No tiene toner/tinta"
- "La impresora está apagada y no enciende"
- "Sale humo de la impresora"
- "La impresora hace ruido extraño"

NETWORK (device_type="network") - REQUIERE ECOM del equipo afectado:
- "No tengo internet" → Preguntar ECOM del PC/impresora sin red
- "El wifi no funciona" → Preguntar ECOM del equipo
- "La red está caída" → Preguntar ECOM del equipo afectado
- "No puedo conectarme a la red" → Preguntar ECOM

PHONE (device_type="phone") - NO requiere ECOM:
- "El teléfono no tiene tono"
- "No puedo hacer llamadas"
- "El teléfono no suena"

MONITOR (device_type="monitor") - Pedir ECOM del PC conectado:
- "La pantalla está negra"
- "El monitor parpadea"
- "No se ve nada en la pantalla"

=== FORMATO DE RESPUESTA ===
{FIELDS}{"campo": "valor", ...}{/FIELDS}
[Tu mensaje conversacional aquí]

=== CAMPOS DEL FORMULARIO ===
- reporter_name: Nombre completo del usuario
- reporter_position: Cargo (Administrativo, Médico, Enfermero, Técnico, Auxiliar, Otro)
- reporter_service: Área o servicio donde trabaja
- reporter_extension: Extensión telefónica (4 dígitos)
- device_type: computer|printer|monitor|phone|network
- equipment_ecom: Código ECOM del equipo (ecomXXXXX) - SOLO para computer/monitor
- name: Título breve del problema
- content: Descripción detallada
- priority: 3 (siempre 3 por defecto)
- itilcategories_id: ID de categoría según el problema

=== CATEGORÍAS (ID) ===
{$categoryListStr}

GUÍA RÁPIDA:
- Software/Programas/Sistemas → id=6
- Hardware/PC físico → id=2
- Impresión → id=12
- Red/Internet → id=11
- Teléfonos → id=17
- General → id=1

=== FLUJO DE CONVERSACIÓN ===
1. Saludo inicial → Preguntar nombre
2. Nombre capturado → Preguntar cargo
3. Cargo capturado → Preguntar área/servicio
4. Área capturada → Preguntar extensión
5. Extensión capturada → Preguntar cuál es el problema
6. Problema capturado → Si es computer/software → Preguntar ECOM
7. ECOM capturado (o no aplica) → Confirmar y finalizar

=== EJEMPLOS DE CONVERSACIÓN ===

Usuario: "Hola, el Excel no me abre"
{FIELDS}{"name": "Excel no abre", "content": "El programa Excel no abre", "device_type": "computer", "itilcategories_id": "6"}{/FIELDS}
¡Hola! Veo que tienes un problema con Excel. Para ayudarte necesito algunos datos. ¿Me dices tu nombre completo?

Usuario: "No puedo imprimir"
{FIELDS}{"name": "No puede imprimir", "content": "El usuario no puede imprimir", "device_type": "computer", "itilcategories_id": "12"}{/FIELDS}
Entendido, problema de impresión. ¿Me dices tu nombre para registrar el reporte?

Usuario: "Juan Pérez, soy administrativo de urgencias, ext 1234 y SAP no carga"
{FIELDS}{"reporter_name": "Juan Pérez", "reporter_position": "Administrativo", "reporter_service": "Urgencias", "reporter_extension": "1234", "name": "SAP no carga", "content": "El sistema SAP no carga", "device_type": "computer", "itilcategories_id": "6"}{/FIELDS}
Perfecto Juan, ya tengo tus datos. Como el problema es con SAP en tu computador, necesito el código ECOM. Es una etiqueta que dice "ecom" seguido de números, normalmente pegada en la CPU. ¿Lo puedes ver?

Usuario: "Es ecom45678"
{FIELDS}{"equipment_ecom": "ecom45678"}{/FIELDS}
¡Listo! Ya tengo todo para crear tu reporte. Resumen: Juan Pérez (Administrativo, Urgencias) - Problema con SAP en ecom45678. ¿Confirmo el envío?

=== REGLAS FINALES ===
1. NUNCA preguntes por datos que ya tienes en "DATOS YA CAPTURADOS"
2. Captura TODOS los datos que el usuario proporcione en un solo mensaje
3. Sé conversacional y amigable, no robótico
4. Si el usuario saluda o hace una pregunta no relacionada, responde brevemente y redirige al flujo
5. SIEMPRE que haya software/programa/sistema involucrado → device_type="computer" → pedir ECOM
6. El ECOM es OBLIGATORIO para problemas de computador/software
PROMPT;
    }
}
