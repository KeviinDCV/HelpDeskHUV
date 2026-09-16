<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- App interna: evitar indexación accidental por buscadores --}}
        <meta name="robots" content="noindex, nofollow">

        {{-- Aplica el tema antes de pintar: primero el que eligió la persona (el botón de la
             cabecera lo guarda en helpdesk_theme) y, si no eligió, el del sistema. Sin esto, quien
             tenía el modo oscuro veía la página en claro durante un instante en cada carga. --}}
        <script>
            (function() {
                let elegido = null;
                try { elegido = localStorage.getItem('helpdesk_theme'); } catch (e) { /* sin almacenamiento */ }
                if (elegido !== 'dark' && elegido !== 'light' && elegido !== 'system') {
                    elegido = '{{ $appearance ?? "light" }}'; // la cookie, por si el almacenamiento está bloqueado
                }
                const oscuro = elegido === 'dark' || (elegido === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                document.documentElement.classList.toggle('dark', oscuro);
                document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light';
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'HelpDesk HUV') }}</title>

        <link rel="icon" href="/images/favicon.png" type="image/png">
        <link rel="apple-touch-icon" href="/images/favicon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
