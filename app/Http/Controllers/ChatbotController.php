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
            $maxRetries = 3;
            $response = null;
            
            for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
                $response = Http::timeout(30)->withHeaders([
                    'Authorization' => 'Bearer ' . env('GROQ_API_KEY'),
                    'Content-Type' => 'application/json',
                ])->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => 'llama-3.1-8b-instant',
                    'messages' => $messages,
                    'temperature' => 0.3,
                    'max_tokens' => 500,
                ]);

                // Si es exitoso o no es rate limit, salir del loop
                if ($response->successful() || $response->status() !== 429) {
                    break;
                }

                // Si es rate limit, esperar y reintentar
                if ($attempt < $maxRetries) {
                    sleep(2 * $attempt); // Espera progresiva: 2s, 4s
                }
            }

            if ($response->successful()) {
                $data = $response->json();
                $assistantResponse = $data['choices'][0]['message']['content'] ?? '';
                
                // Parsear la respuesta para extraer campos y mensaje
                $parsed = $this->parseResponse($assistantResponse);
                
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

        // Buscar patrón JSON en la respuesta
        if (preg_match('/\{FIELDS\}(.*?)\{\/FIELDS\}/s', $response, $matches)) {
            $jsonStr = trim($matches[1]);
            $decoded = json_decode($jsonStr, true);
            if (is_array($decoded)) {
                $fields = $decoded;
            }
            // Remover el bloque de campos del mensaje
            $message = trim(preg_replace('/\{FIELDS\}.*?\{\/FIELDS\}/s', '', $response));
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
            ->select('id', 'name', 'completename')
            ->where('is_incident', 1)
            ->where('level', '=', 1) // Solo categorías de primer nivel
            ->orderBy('name')
            ->limit(15) // Limitar para no sobrecargar el prompt
            ->get()
            ->map(fn($c) => ['id' => $c->id, 'name' => $c->name]) // Usar name corto
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
        $filledInfo = empty($filledFields) 
            ? "Ninguno"
            : implode(', ', $filledFields);

        // Crear muestra de ECOMs para el prompt (primeros 15)
        $ecomSample = array_slice($ecomList, 0, 15);
        $ecomListStr = implode(', ', $ecomSample);
        $totalEcoms = count($ecomList);

        // Crear lista de categorías para el prompt
        $categoryListStr = implode("\n", array_map(fn($c) => "- ID: {$c['id']} = {$c['name']}", $categories));

        return <<<PROMPT
Eres Evarisbot. Ayudas a crear reportes de problemas técnicos en el Hospital Universitario del Valle.

REGLA CRÍTICA: Cada respuesta DEBE empezar con un bloque {FIELDS} si el usuario proporcionó información útil.

CAMPOS YA LLENADOS: {$filledInfo}

FORMATO DE RESPUESTA:
{FIELDS}{"campo1": "valor1", "campo2": "valor2"}{/FIELDS}
Tu mensaje amigable aquí

CAMPOS DISPONIBLES:
- reporter_name = nombre de la persona
- reporter_position = cargo (Médico, Enfermero, Administrativo, etc.)
- reporter_service = área donde trabaja
- reporter_extension = número de extensión telefónica
- name = título corto del problema (máx 80 caracteres)
- content = descripción detallada del problema
- priority = "3" normal, "4" alta, "5" muy alta, "6" urgente
- device_type = tipo de dispositivo: "computer", "monitor", "printer", "phone", "network", "software", "other"
- equipment_ecom = ECOM del equipo (solo para computadores, ej: "ecom02306", "ecom01274")
- itilcategories_id = ID de la categoría del problema (OBLIGATORIO, deducir según el contexto)

CATEGORÍAS DISPONIBLES (usa el ID):
{$categoryListStr}

LISTA DE ECOMs VÁLIDOS (muestra de {$totalEcoms} total):
{$ecomListStr}

FLUJO DE CONVERSACIÓN:
1. Si falta reporter_name → preguntar nombre
2. Si falta reporter_position → preguntar cargo
3. Si falta reporter_service → preguntar área/servicio
4. Si falta reporter_extension → preguntar extensión
5. Preguntar qué problema tiene y con qué dispositivo
6. SI ES UN COMPUTADOR → preguntar "¿Cuál es el ECOM del equipo? (está en una etiqueta en el computador, empieza con 'ecom')"
7. Validar el ECOM:
   - Si el ECOM existe en la lista → guardarlo en equipment_ecom
   - Si NO existe pero es similar a uno de la lista → sugerir: "No encontré ese ECOM. ¿Quizás quisiste decir 'ecomXXXX'?"
   - Si no se parece a ninguno → decir: "No encontré ese ECOM. Por favor verifica la etiqueta del equipo."
8. Cuando tenga toda la info → generar name, content, priority, device_type (y equipment_ecom si aplica)

EJEMPLOS CORRECTOS:

Usuario: "Hola, soy María García"
Respuesta:
{FIELDS}{"reporter_name": "María García"}{/FIELDS}
¡Hola María! ¿Cuál es tu cargo en el hospital?

Usuario: "Soy enfermera de UCI"
Respuesta:
{FIELDS}{"reporter_position": "Enfermera", "reporter_service": "UCI"}{/FIELDS}
Perfecto. ¿Cuál es tu extensión telefónica?

Usuario: "Ext 2045"
Respuesta:
{FIELDS}{"reporter_extension": "2045"}{/FIELDS}
¡Listo! Ahora cuéntame, ¿qué problema tienes?

Usuario: "Mi computador está muy lento"
Respuesta:
{FIELDS}{"device_type": "computer"}{/FIELDS}
Entendido, es un problema con el computador. ¿Cuál es el ECOM del equipo? (lo encuentras en una etiqueta pegada al computador, empieza con "ecom")

Usuario: "Es el ecom02306"
Respuesta:
{FIELDS}{"equipment_ecom": "ecom02306", "name": "Computador lento - ecom02306", "content": "El equipo de cómputo ecom02306 presenta lentitud. Se requiere revisión.", "priority": "3", "itilcategories_id": "1"}{/FIELDS}
¡Perfecto! Ya llené el formulario. Revisa los datos y haz clic en "Enviar Reporte" 📝

Usuario: "Es el ecom99999" (no existe)
Respuesta:
No encontré ese ECOM en el sistema. Por favor verifica la etiqueta del equipo. Debería verse algo como "ecom02306" o similar.

Usuario: "El teléfono no tiene sonido"
Respuesta:
{FIELDS}{"name": "Teléfono sin sonido", "content": "El teléfono del área no tiene sonido. Se requiere revisión.", "priority": "4", "device_type": "phone", "itilcategories_id": "2"}{/FIELDS}
¡Listo! Como es un teléfono, usaré tu extensión como referencia. Revisa los datos y envía tu reporte 📝

REGLAS IMPORTANTES:
- Respuestas cortas y amigables (1-2 oraciones)
- Siempre en español
- Siempre incluir {FIELDS} si hay info que extraer
- Para COMPUTADORES: SIEMPRE pedir el ECOM antes de completar el formulario
- Para TELÉFONOS: usar la extensión del usuario como referencia
- NUNCA mostrar al usuario los valores técnicos de los campos
- Solo confirmar que el formulario está listo para enviar
- SIEMPRE incluir itilcategories_id cuando completes el formulario (deducir la categoría más apropiada según el problema)
PROMPT;
    }
}
