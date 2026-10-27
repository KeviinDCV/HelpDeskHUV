<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Llamadas a los modelos de IA (Evarisbot y la mejora automática de los reportes públicos).
 *
 * Prueba una cadena de modelos en orden (config('services.ia.modelos'), IA_MODELOS en el .env) y
 * devuelve la primera respuesta válida. En octubre de 2026 Evarisbot dejó de responder porque los
 * tres modelos que tenía escritos en el código fueron retirados por los proveedores: el chat solo
 * decía «Todos los servicios están ocupados». Por eso:
 *   - los modelos se cambian desde el .env, sin tocar código;
 *   - un modelo retirado (404) o una clave rechazada (401/403) se registra como ERROR con el motivo
 *     y se aparta unas horas, para no gastar tiempo en él en cada mensaje;
 *   - uno saturado (429) o caído (5xx, tiempo agotado) se aparta unos segundos y se usa el siguiente.
 */
class ClienteIA
{
    private const URLS = [
        'groq' => 'https://api.groq.com/openai/v1/chat/completions',
        'openrouter' => 'https://openrouter.ai/api/v1/chat/completions',
    ];

    /** Cuánto se aparta un modelo según el fallo (segundos). */
    private const APARTAR = [
        'retirado' => 21600, // 6 h: el proveedor dice que no existe
        'clave' => 600,      // la clave no sirve: no tiene sentido reintentar enseguida
        'saturado' => 60,
        'caido' => 30,
    ];

    /**
     * Pide una respuesta a la cadena de modelos.
     *
     * @param  array<int, array{role: string, content: string}>  $mensajes
     * @param  array{json?: bool, max_tokens?: int, temperature?: float, timeout?: int, max_intentos?: int, limite_segundos?: float}  $opciones
     * @return array{texto: string, proveedor: string, modelo: string}|null  null si ningún modelo respondió
     */
    public function completar(array $mensajes, array $opciones = []): ?array
    {
        $json = $opciones['json'] ?? false;
        $maxIntentos = $opciones['max_intentos'] ?? PHP_INT_MAX;
        $limite = $opciones['limite_segundos'] ?? null;
        $inicio = microtime(true);
        $intentos = [];

        foreach ($this->cadena() as [$proveedor, $modelo]) {
            if (count($intentos) >= $maxIntentos) {
                break;
            }
            if ($limite !== null && microtime(true) - $inicio > $limite) {
                $intentos[] = "$proveedor:$modelo → sin tiempo";
                break;
            }
            $clave = $this->clave($proveedor);
            if (!$clave) {
                continue;
            }
            if ($this->apartado($proveedor, $modelo)) {
                continue;
            }

            try {
                $respuesta = Http::timeout($opciones['timeout'] ?? 15)
                    ->connectTimeout(5)
                    ->withHeaders($this->cabeceras($proveedor, $clave))
                    ->post(self::URLS[$proveedor], $this->cuerpo($proveedor, $modelo, $mensajes, $opciones, $json));
            } catch (\Throwable $e) {
                $intentos[] = "$proveedor:$modelo → sin conexión (" . mb_substr($e->getMessage(), 0, 80) . ')';
                $this->apartar($proveedor, $modelo, 'caido');
                continue;
            }

            if ($respuesta->successful()) {
                $texto = $this->limpiar((string) $respuesta->json('choices.0.message.content'));
                if ($texto !== '') {
                    return ['texto' => $texto, 'proveedor' => $proveedor, 'modelo' => $modelo];
                }
                $intentos[] = "$proveedor:$modelo → respuesta vacía";
                continue;
            }

            $estado = $respuesta->status();
            $detalle = mb_substr((string) ($respuesta->json('error.message') ?? $respuesta->body()), 0, 160);
            $intentos[] = "$proveedor:$modelo → $estado $detalle";

            if ($estado === 404 || ($estado === 400 && str_contains(strtolower($detalle), 'model'))) {
                // Retirado o renombrado: es el fallo que dejó a Evarisbot sin responder. Se avisa
                // en el log con lo que hay que hacer.
                Log::error("IA: el modelo «{$modelo}» de {$proveedor} ya no está disponible ({$estado}). "
                    . 'Cámbialo en IA_MODELOS del .env (ver config/services.php).', ['detalle' => $detalle]);
                $this->apartar($proveedor, $modelo, 'retirado');
            } elseif ($estado === 401 || $estado === 403) {
                Log::error("IA: {$proveedor} rechazó la clave ({$estado}). Revisa la clave en el .env.", ['detalle' => $detalle]);
                $this->apartar($proveedor, $modelo, 'clave');
            } elseif ($estado === 429) {
                $this->apartar($proveedor, $modelo, 'saturado');
            } else {
                $this->apartar($proveedor, $modelo, 'caido');
            }
        }

        if (!$this->clave('groq') && !$this->clave('openrouter')) {
            Log::error('IA: no hay GROQ_API_KEY ni OPENROUTER_API_KEY. Si se acaba de ejecutar '
                . '`php artisan config:cache`, revisa que las claves estén en el .env y vuelve a cachear.');
        } else {
            Log::warning('IA: ningún modelo respondió', ['intentos' => $intentos ?: ['todos apartados por fallos recientes']]);
        }

        return null;
    }

    /**
     * Saca el primer objeto JSON de un texto (los modelos a veces lo envuelven en ```json … ```).
     *
     * @return array<string, mixed>|null
     */
    public static function json(string $texto): ?array
    {
        $directo = json_decode($texto, true);
        if (is_array($directo)) {
            return $directo;
        }

        $inicio = strpos($texto, '{');
        if ($inicio === false) {
            return null;
        }
        // Recorre llaves balanceadas, sin contar las que van dentro de cadenas
        $nivel = 0;
        $enCadena = false;
        $escape = false;
        for ($i = $inicio, $n = strlen($texto); $i < $n; $i++) {
            $c = $texto[$i];
            if ($enCadena) {
                if ($escape) {
                    $escape = false;
                } elseif ($c === '\\') {
                    $escape = true;
                } elseif ($c === '"') {
                    $enCadena = false;
                }
                continue;
            }
            if ($c === '"') {
                $enCadena = true;
            } elseif ($c === '{') {
                $nivel++;
            } elseif ($c === '}' && --$nivel === 0) {
                $decodificado = json_decode(substr($texto, $inicio, $i - $inicio + 1), true);
                return is_array($decodificado) ? $decodificado : null;
            }
        }

        return null;
    }

    /**
     * Los modelos configurados, en orden: "proveedor:modelo" separados por comas.
     *
     * @return array<int, array{0: string, 1: string}>
     */
    private function cadena(): array
    {
        $lista = config('services.ia.modelos');
        $elementos = is_array($lista) ? $lista : explode(',', (string) $lista);

        $cadena = [];
        foreach ($elementos as $elemento) {
            $elemento = trim((string) $elemento);
            $separador = strpos($elemento, ':');
            if ($separador === false) {
                continue;
            }
            $proveedor = strtolower(trim(substr($elemento, 0, $separador)));
            $modelo = trim(substr($elemento, $separador + 1));
            if (isset(self::URLS[$proveedor]) && $modelo !== '') {
                $cadena[] = [$proveedor, $modelo];
            }
        }

        return $cadena;
    }

    private function clave(string $proveedor): ?string
    {
        $clave = config("services.{$proveedor}.key");
        return is_string($clave) && $clave !== '' ? $clave : null;
    }

    private function cabeceras(string $proveedor, string $clave): array
    {
        $cabeceras = ['Authorization' => 'Bearer ' . $clave, 'Content-Type' => 'application/json'];
        if ($proveedor === 'openrouter') {
            $cabeceras['HTTP-Referer'] = (string) config('app.url');
            $cabeceras['X-Title'] = (string) config('app.name');
        }
        return $cabeceras;
    }

    /** Cuerpo de la petición, con los ajustes que cada familia de modelos necesita. */
    private function cuerpo(string $proveedor, string $modelo, array $mensajes, array $opciones, bool $json): array
    {
        $cuerpo = [
            'model' => $modelo,
            'messages' => $mensajes,
            'temperature' => $opciones['temperature'] ?? 0.1,
            'max_tokens' => $opciones['max_tokens'] ?? 400,
        ];
        if ($json) {
            $cuerpo['response_format'] = ['type' => 'json_object'];
        }
        if ($proveedor === 'groq') {
            // Sin razonamiento visible: más rápido y la respuesta trae solo el JSON
            if (str_starts_with($modelo, 'qwen/')) {
                $cuerpo['reasoning_effort'] = 'none';
            } elseif (str_starts_with($modelo, 'openai/gpt-oss')) {
                $cuerpo['reasoning_effort'] = 'low';
                $cuerpo['include_reasoning'] = false;
            }
        } else {
            $cuerpo['reasoning'] = ['exclude' => true];
        }
        return $cuerpo;
    }

    /** Quita un bloque de razonamiento que algunos modelos dejan en el texto. */
    private function limpiar(string $texto): string
    {
        $texto = preg_replace('/<think>.*?<\/think>/si', '', $texto) ?? $texto;
        return trim($texto);
    }

    private function apartado(string $proveedor, string $modelo): bool
    {
        try {
            return Cache::has($this->llaveCache($proveedor, $modelo));
        } catch (\Throwable) {
            return false; // sin caché, se intenta igual
        }
    }

    private function apartar(string $proveedor, string $modelo, string $motivo): void
    {
        try {
            Cache::put($this->llaveCache($proveedor, $modelo), $motivo, self::APARTAR[$motivo]);
        } catch (\Throwable) {
            // sin caché no se aparta: el siguiente mensaje lo vuelve a intentar
        }
    }

    private function llaveCache(string $proveedor, string $modelo): string
    {
        return 'ia_apartado:' . $proveedor . ':' . md5($modelo);
    }
}
