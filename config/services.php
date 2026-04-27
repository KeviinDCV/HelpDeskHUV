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

];
