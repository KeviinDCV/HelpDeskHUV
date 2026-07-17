<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Agente de Inventario
    |--------------------------------------------------------------------------
    |
    | enrollment_secret: clave compartida que el agente Windows envía al endpoint
    | /api/inventory/register para auto-emitir su token Sanctum. Cambiarla en .env
    | para invalidar instalaciones futuras (las existentes siguen usando su token).
    |
    | token_owner: nombre del usuario GLPI propietario de los tokens emitidos
    | por auto-registro. Si no existe se usa el primer usuario de la BD.
    |
    */
    'agent' => [
        'enrollment_secret' => env('AGENT_ENROLLMENT_SECRET', ''),
        'token_owner' => env('AGENT_TOKEN_OWNER', 'Kechavarro'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Proveedores de IA
    |--------------------------------------------------------------------------
    |
    | Los usa Evarisbot (el chat de /reportar) y la mejora automática de los
    | reportes públicos. Groq es el primario y OpenRouter el respaldo.
    |
    | IMPORTANTE: leerlos con env() desde un controlador NO funciona en producción.
    | `php artisan config:cache` hace que env() devuelva null fuera de estos archivos
    | de config, así que las claves quedaban vacías y Evarisbot dejaba de responder
    | sin ningún error visible. Deben leerse siempre con config('services.…').
    |
    */
    'groq' => [
        'key' => env('GROQ_API_KEY'),
    ],

    'openrouter' => [
        'key' => env('OPENROUTER_API_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | GLPI
    |--------------------------------------------------------------------------
    |
    | files_path: directorio donde GLPI guarda sus documentos. Solo hace falta si
    | el montaje no está en una de las rutas habituales que ya prueba el sistema
    | (/var/lib/glpi, /var/www/glpi, /opt/glpi).
    |
    */
    'glpi' => [
        'files_path' => env('GLPI_FILES_PATH', '/var/lib/glpi/files/_documents/'),
    ],

];
