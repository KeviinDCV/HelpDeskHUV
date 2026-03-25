<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$r = \Illuminate\Support\Facades\Http::timeout(15)->connectTimeout(5)->withHeaders([
    'Authorization' => 'Bearer ' . env('GROQ_API_KEY'),
    'Content-Type' => 'application/json',
])->post('https://api.groq.com/openai/v1/chat/completions', [
    'model' => 'llama-3.3-70b-versatile',
    'messages' => [
        ['role' => 'system', 'content' => 'Eres un asistente. Responde breve en español.'],
        ['role' => 'user', 'content' => 'Hola, soy Kevin'],
    ],
    'temperature' => 0.1,
    'max_tokens' => 80,
]);

echo "Status: " . $r->status() . "\n";
if ($r->successful()) {
    echo "Response: " . $r->json()['choices'][0]['message']['content'] . "\n";
} else {
    echo "Error: " . $r->body() . "\n";
}
