<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

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

        $systemPrompt = $this->getSystemPrompt($currentFormData, $filledFields);
        
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        // Agregar contexto previo de la conversación
        foreach ($context as $msg) {
            $messages[] = $msg;
        }

        $messages[] = ['role' => 'user', 'content' => $userMessage];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . env('GROQ_API_KEY'),
                'Content-Type' => 'application/json',
            ])->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'llama-3.1-8b-instant',
                'messages' => $messages,
                'temperature' => 0.5,
                'max_tokens' => 600,
            ]);

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

            return response()->json([
                'success' => false,
                'message' => 'Error al comunicarse con el asistente.',
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
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
     * Obtener el prompt del sistema para el chatbot
     */
    private function getSystemPrompt(array $formData, array $filledFields): string
    {
        $filledInfo = empty($filledFields) 
            ? "Ningún campo ha sido llenado aún."
            : "Campos ya llenados: " . implode(', ', $filledFields);

        return <<<PROMPT
Eres Evarisbot, el asistente del Hospital Universitario del Valle. Tu ÚNICA función es ayudar a reportar problemas técnicos.

FLUJO CONVERSACIONAL (sigue este orden):
1. Si no hay nombre → Pregunta: "¿Cuál es tu nombre completo?"
2. Si no hay cargo → Pregunta: "¿Cuál es tu cargo? (Ej: Enfermero, Médico, Auxiliar)"
3. Si no hay servicio → Pregunta: "¿En qué servicio o área trabajas?"
4. Si no hay extensión → Pregunta: "¿Tienes una extensión telefónica donde te podamos contactar?"
5. Si no hay problema descrito → Pregunta: "Ahora cuéntame, ¿qué problema tienes con tu equipo o sistema?"
6. Cuando describe el problema → Haz preguntas de seguimiento si es necesario
7. Cuando tengas suficiente info → Genera el título y descripción, pregunta si está listo para enviar

ESTADO ACTUAL DEL FORMULARIO:
{$filledInfo}

FORMATO DE RESPUESTA OBLIGATORIO:
Cuando extraigas información del usuario, DEBES incluir un bloque JSON así:
{FIELDS}{"campo": "valor"}{/FIELDS}

Ejemplo: Si el usuario dice "Me llamo Juan Pérez", responde:
{FIELDS}{"reporter_name": "Juan Pérez"}{/FIELDS}
¡Perfecto Juan! 👋 ¿Cuál es tu cargo en el hospital?

CAMPOS DISPONIBLES:
- reporter_name: Nombre completo
- reporter_position: Cargo
- reporter_service: Servicio/Área
- reporter_extension: Extensión telefónica
- name: Título corto del problema (máx 100 caracteres)
- content: Descripción detallada del problema
- priority: "1" muy baja, "2" baja, "3" media, "4" alta, "5" muy alta, "6" urgente

PRIORIDAD SUGERIDA:
- "3" (media) = problema normal, puede esperar
- "4" (alta) = afecta el trabajo diario
- "5" (muy alta) = urgente, varios afectados
- "6" (urgente) = crítico, atención médica afectada

REGLAS:
- Respuestas cortas (máximo 2-3 oraciones)
- Lenguaje amable y sencillo
- Usa emojis ocasionalmente 😊
- Si el usuario pregunta algo fuera de reportes, responde: "Solo puedo ayudarte con reportes de problemas técnicos. ¿Tienes algún problema con tu equipo?"
- Cuando generes el título (name), hazlo descriptivo pero corto
- Cuando generes la descripción (content), incluye todos los detalles que el usuario mencionó

Siempre en español.
PROMPT;
    }
}
