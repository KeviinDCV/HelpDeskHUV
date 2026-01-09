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

        // ANÁLISIS PROFUNDO CON IA - Clasificar categoría y elemento correctamente
        $analysis = $this->analyzeAndClassify($validated);
        
        // Mejorar título y descripción con IA
        $improved = $this->improveWithAI($validated);
        
        // Buscar localización basada en el servicio/área del reportante
        $locationId = $this->findLocationId($validated['reporter_service']);
        
        // Usar la categoría del análisis profundo (más precisa) o la original
        $priority = (int) ($validated['priority'] ?? 3);
        $categoryId = $analysis['category_id'] ?? (!empty($validated['itilcategories_id']) ? (int) $validated['itilcategories_id'] : 0);
        
        // Actualizar device_type si el análisis lo corrigió
        if (!empty($analysis['device_type'])) {
            $validated['device_type'] = $analysis['device_type'];
        }
        
        \Log::info('PublicTicket - Analysis Result', [
            'original_category' => $validated['itilcategories_id'] ?? 'null',
            'analyzed_category' => $categoryId,
            'device_type' => $validated['device_type'] ?? 'null',
            'element_found' => $analysis['element_found'] ?? null,
            'reasoning' => $analysis['reasoning'] ?? 'none'
        ]);
        
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

        // Vincular elemento al ticket
        // Prioridad: 1) Elemento encontrado en análisis, 2) Buscar por ECOM
        if (!empty($analysis['element_found'])) {
            // Usar el elemento ya encontrado y validado en el análisis
            DB::table('glpi_items_tickets')->insert([
                'tickets_id' => $ticketId,
                'itemtype' => $analysis['element_found']['type'],
                'items_id' => $analysis['element_found']['id'],
            ]);
            
            \Log::info('PublicTicket - Element linked from analysis', [
                'ticket_id' => $ticketId,
                'element' => $analysis['element_found']
            ]);
        } elseif (!empty($validated['equipment_ecom'])) {
            // Fallback: buscar por ECOM si no se encontró en el análisis
            $this->linkEquipmentToTicket($ticketId, $validated['equipment_ecom'], $validated['device_type'] ?? 'computer');
        }

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
                'Authorization' => 'Bearer ' . env('OPENROUTER_API_KEY'),
                'HTTP-Referer' => config('app.url'),
                'X-Title' => config('app.name'),
                'Content-Type' => 'application/json',
            ])->timeout(15)->post('https://openrouter.ai/api/v1/chat/completions', [
                'model' => 'z-ai/glm-4.5-air:free',
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

    /**
     * Vincular un equipo (por ECOM) al ticket
     * Busca en múltiples tablas según el tipo de dispositivo
     */
    private function linkEquipmentToTicket(int $ticketId, string $ecom, string $deviceType): void
    {
        try {
            // Limpiar y normalizar el ECOM
            $ecomOriginal = trim($ecom);
            $ecomUpper = strtoupper($ecomOriginal);
            $ecomClean = preg_replace('/[^A-Z0-9]/', '', $ecomUpper);
            
            if (empty($ecomClean)) {
                return;
            }

            $itemType = null;
            $itemId = null;

            // Buscar según el tipo de dispositivo
            if (in_array($deviceType, ['computer', 'software', 'network'])) {
                // Buscar en computadores - múltiples variantes
                $computer = DB::table('glpi_computers')
                    ->where('is_deleted', 0)
                    ->where(function($q) use ($ecomClean, $ecomOriginal, $ecomUpper) {
                        $q->where('name', 'LIKE', '%' . $ecomClean . '%')
                          ->orWhere('name', 'LIKE', '%' . strtolower($ecomClean) . '%')
                          ->orWhere('name', 'LIKE', '%' . $ecomOriginal . '%')
                          ->orWhere('otherserial', 'LIKE', '%' . $ecomClean . '%')
                          ->orWhere('serial', 'LIKE', '%' . $ecomClean . '%');
                    })
                    ->first();
                
                if ($computer) {
                    $itemType = 'Computer';
                    $itemId = $computer->id;
                }
            } elseif ($deviceType === 'monitor') {
                // Buscar en monitores
                $monitor = DB::table('glpi_monitors')
                    ->where('is_deleted', 0)
                    ->where(function($q) use ($ecomClean, $ecomOriginal) {
                        $q->where('name', 'LIKE', '%' . $ecomClean . '%')
                          ->orWhere('name', 'LIKE', '%' . strtolower($ecomClean) . '%')
                          ->orWhere('serial', 'LIKE', '%' . $ecomClean . '%')
                          ->orWhere('otherserial', 'LIKE', '%' . $ecomClean . '%');
                    })
                    ->first();
                
                if ($monitor) {
                    $itemType = 'Monitor';
                    $itemId = $monitor->id;
                }
            } elseif ($deviceType === 'printer') {
                // Buscar en impresoras
                $printer = DB::table('glpi_printers')
                    ->where('is_deleted', 0)
                    ->where(function($q) use ($ecomClean, $ecomOriginal) {
                        $q->where('name', 'LIKE', '%' . $ecomClean . '%')
                          ->orWhere('name', 'LIKE', '%' . strtolower($ecomClean) . '%')
                          ->orWhere('serial', 'LIKE', '%' . $ecomClean . '%')
                          ->orWhere('otherserial', 'LIKE', '%' . $ecomClean . '%');
                    })
                    ->first();
                
                if ($printer) {
                    $itemType = 'Printer';
                    $itemId = $printer->id;
                }
            } elseif ($deviceType === 'phone') {
                // Buscar en teléfonos
                $phone = DB::table('glpi_phones')
                    ->where('is_deleted', 0)
                    ->where(function($q) use ($ecomClean, $ecomOriginal) {
                        $q->where('name', 'LIKE', '%' . $ecomClean . '%')
                          ->orWhere('name', 'LIKE', '%' . strtolower($ecomClean) . '%')
                          ->orWhere('serial', 'LIKE', '%' . $ecomClean . '%');
                    })
                    ->first();
                
                if ($phone) {
                    $itemType = 'Phone';
                    $itemId = $phone->id;
                }
            }

            // Si no encontramos en el tipo específico, buscar en computadores como fallback
            if (!$itemType && !in_array($deviceType, ['computer', 'software', 'network'])) {
                $computer = DB::table('glpi_computers')
                    ->where('is_deleted', 0)
                    ->where(function($q) use ($ecomClean) {
                        $q->where('name', 'LIKE', '%' . $ecomClean . '%')
                          ->orWhere('name', 'LIKE', '%' . strtolower($ecomClean) . '%');
                    })
                    ->first();
                
                if ($computer) {
                    $itemType = 'Computer';
                    $itemId = $computer->id;
                }
            }

            // Si encontramos el equipo, vincularlo al ticket
            if ($itemType && $itemId) {
                DB::table('glpi_items_tickets')->insert([
                    'itemtype' => $itemType,
                    'items_id' => $itemId,
                    'tickets_id' => $ticketId,
                ]);
                
                \Log::info('PublicTicket - Equipment linked', [
                    'ticket_id' => $ticketId,
                    'item_type' => $itemType,
                    'item_id' => $itemId,
                    'ecom' => $ecomOriginal
                ]);
            } else {
                \Log::warning('PublicTicket - Equipment not found', [
                    'ticket_id' => $ticketId,
                    'ecom' => $ecomOriginal,
                    'ecom_clean' => $ecomClean,
                    'device_type' => $deviceType
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('PublicTicket - Error linking equipment', [
                'ticket_id' => $ticketId,
                'ecom' => $ecom,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Análisis profundo con IA para clasificar categoría, tipo de dispositivo y elemento correctamente
     * La IA analiza el contexto completo para determinar qué tipo de equipo y categoría corresponde
     */
    private function analyzeAndClassify(array $data): array
    {
        try {
            // Obtener categorías disponibles
            $categories = DB::table('glpi_itilcategories')
                ->select('id', 'name', 'completename')
                ->where('is_incident', 1)
                ->where('is_helpdeskvisible', 1)
                ->orderBy('completename')
                ->get()
                ->map(fn($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'fullname' => $c->completename
                ])
                ->toArray();

            $categoryList = implode("\n", array_map(
                fn($c) => "- {$c['id']}: {$c['fullname']}",
                $categories // Enviar todas las categorías para que la IA encuentre la correcta
            ));

            // PASO 1: Usar IA para analizar el problema y determinar tipo de dispositivo + categoría
            $prompt = <<<PROMPT
Analiza este reporte de soporte técnico hospitalario y clasifica correctamente.

DATOS DEL REPORTE:
- Título: {$data['name']}
- Descripción: {$data['content']}
- Área/Servicio del usuario: {$data['reporter_service']}

CATEGORÍAS DISPONIBLES (busca la más apropiada por nombre):
{$categoryList}

TIPOS DE DISPOSITIVO:
- Computer (PC, software, SAP, programa, sistema)
- Printer (impresora, toner, atasco papel, no imprime)
- Monitor (pantalla, monitor)
- Phone (teléfono, extensión, línea)
- NetworkEquipment (switch, router, punto de acceso)

REGLAS DE CLASIFICACIÓN:
- Problemas de INTERNET/RED/WIFI/CONEXIÓN → Busca categoría que contenga "Redes" o "Red" (ej: "Redes > Equipo Sin Red")
- Problemas de SOFTWARE/SAP/PROGRAMA → Busca categoría que contenga "Software"
- Problemas de HARDWARE/NO ENCIENDE/LENTO → Busca categoría que contenga "Hardware"
- Problemas de IMPRESORA → Busca categoría que contenga "Impresora"
- Problemas de TELÉFONO → Busca categoría que contenga "Teléfono" o "Phone"

IMPORTANTE: El category_id debe ser un ID de la lista de CATEGORÍAS DISPONIBLES arriba.

Responde SOLO en este formato JSON:
{"device_type": "Computer|Printer|Monitor|Phone|NetworkEquipment", "category_id": [número de la lista]}
PROMPT;

            $deviceType = $data['device_type'] ?? 'Computer';
            $categoryId = !empty($data['itilcategories_id']) ? (int) $data['itilcategories_id'] : 0;
            $elementTable = 'Computer';

            // Llamar a la IA para clasificación inteligente
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . env('OPENROUTER_API_KEY'),
                'HTTP-Referer' => config('app.url'),
                'X-Title' => config('app.name'),
                'Content-Type' => 'application/json',
            ])->timeout(15)->post('https://openrouter.ai/api/v1/chat/completions', [
                'model' => 'z-ai/glm-4.5-air:free',
                'messages' => [
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.1,
                'max_tokens' => 100,
            ]);

            if ($response->successful()) {
                $content = trim($response->json()['choices'][0]['message']['content'] ?? '');
                \Log::info('PublicTicket - AI Classification Response', ['response' => $content]);
                
                // Extraer JSON de la respuesta
                if (preg_match('/\{[^}]+\}/', $content, $jsonMatch)) {
                    $parsed = json_decode($jsonMatch[0], true);
                    if ($parsed) {
                        // Actualizar tipo de dispositivo si la IA lo determinó
                        if (!empty($parsed['device_type'])) {
                            $deviceType = $parsed['device_type'];
                        }
                        // Actualizar categoría si la IA la determinó
                        if (!empty($parsed['category_id'])) {
                            $aiCategoryId = (int) $parsed['category_id'];
                            if (collect($categories)->contains('id', $aiCategoryId)) {
                                $categoryId = $aiCategoryId;
                            }
                        }
                    }
                }
            }

            // Mapear device_type a tabla de GLPI
            $typeMapping = [
                'Computer' => ['table' => 'glpi_computers', 'type' => 'Computer'],
                'Printer' => ['table' => 'glpi_printers', 'type' => 'Printer'],
                'Monitor' => ['table' => 'glpi_monitors', 'type' => 'Monitor'],
                'Phone' => ['table' => 'glpi_phones', 'type' => 'Phone'],
                'NetworkEquipment' => ['table' => 'glpi_networkequipments', 'type' => 'NetworkEquipment'],
                // Compatibilidad con valores del chatbot
                'computer' => ['table' => 'glpi_computers', 'type' => 'Computer'],
                'printer' => ['table' => 'glpi_printers', 'type' => 'Printer'],
                'monitor' => ['table' => 'glpi_monitors', 'type' => 'Monitor'],
                'phone' => ['table' => 'glpi_phones', 'type' => 'Phone'],
                'network' => ['table' => 'glpi_networkequipments', 'type' => 'NetworkEquipment'],
            ];

            $mapping = $typeMapping[$deviceType] ?? $typeMapping['Computer'];
            $dbTable = $mapping['table'];
            $elementTable = $mapping['type'];

            \Log::info('PublicTicket - Device Type Resolved', [
                'original' => $data['device_type'] ?? 'null',
                'resolved' => $deviceType,
                'elementTable' => $elementTable,
                'dbTable' => $dbTable
            ]);

            // PASO 2: Buscar elemento por ECOM si existe
            $foundElement = null;
            if (!empty($data['equipment_ecom'])) {
                $ecom = trim($data['equipment_ecom']);
                $ecomClean = preg_replace('/[^A-Za-z0-9]/', '', $ecom);
                
                $element = DB::table($dbTable)
                    ->select('id', 'name')
                    ->where('is_deleted', 0)
                    ->where(function($q) use ($ecomClean, $ecom) {
                        $q->where('name', 'LIKE', '%' . $ecomClean . '%')
                          ->orWhere('name', 'LIKE', '%' . strtolower($ecomClean) . '%')
                          ->orWhere('serial', 'LIKE', '%' . $ecomClean . '%')
                          ->orWhere('otherserial', 'LIKE', '%' . $ecomClean . '%');
                    })
                    ->first();
                
                if ($element) {
                    $foundElement = [
                        'id' => $element->id,
                        'name' => $element->name,
                        'type' => $elementTable
                    ];
                    \Log::info('PublicTicket - Element found by ECOM', ['element' => $foundElement]);
                }
            }

            // PASO 3: Si no hay ECOM, buscar por ubicación/servicio del usuario
            if (!$foundElement && !empty($data['reporter_service'])) {
                $service = mb_strtolower(trim($data['reporter_service']));
                
                // Buscar elementos de este tipo cuya ubicación coincida con el servicio
                $element = DB::table($dbTable . ' as e')
                    ->leftJoin('glpi_locations as l', 'e.locations_id', '=', 'l.id')
                    ->select('e.id', 'e.name', 'l.name as location', 'l.completename as location_full')
                    ->where('e.is_deleted', 0)
                    ->where(function($q) use ($service) {
                        $q->whereRaw('LOWER(l.name) LIKE ?', ['%' . $service . '%'])
                          ->orWhereRaw('LOWER(l.completename) LIKE ?', ['%' . $service . '%'])
                          ->orWhereRaw('LOWER(e.name) LIKE ?', ['%' . $service . '%']);
                    })
                    ->first();
                
                if ($element) {
                    $foundElement = [
                        'id' => $element->id,
                        'name' => $element->name,
                        'type' => $elementTable,
                        'location' => $element->location_full ?? $element->location
                    ];
                    \Log::info('PublicTicket - Element found by location', [
                        'element' => $foundElement, 
                        'service' => $service,
                        'deviceType' => $elementTable
                    ]);
                }
            }

            $result = [
                'category_id' => $categoryId,
                'device_type' => $elementTable, // Usar el tipo normalizado (Computer, Printer, etc.)
                'element_found' => $foundElement,
                'reasoning' => $foundElement 
                    ? "Tipo: {$elementTable}, Elemento: {$foundElement['name']}" 
                    : "Tipo: {$elementTable}, sin elemento específico",
            ];

            \Log::info('PublicTicket - Analysis Complete', $result);
            return $result;

        } catch (\Exception $e) {
            \Log::error('PublicTicket - Analysis Error', ['error' => $e->getMessage()]);
        }

        // Fallback
        return [
            'category_id' => !empty($data['itilcategories_id']) ? (int) $data['itilcategories_id'] : 0,
            'device_type' => $data['device_type'] ?? 'Computer',
            'element_found' => null,
            'reasoning' => 'Fallback',
        ];
    }
}
