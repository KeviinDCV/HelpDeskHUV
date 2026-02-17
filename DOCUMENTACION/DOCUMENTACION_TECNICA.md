# INNOVACIÓN Y DESARROLLO - HOSPITAL UNIVERSITARIO DEL VALLE
## HELPDESK HUV

---

# DOCUMENTACIÓN TÉCNICA DEL SISTEMA

## ARQUITECTURA, COMPONENTES, APIs Y ESPECIFICACIONES TÉCNICAS

**Versión del Documento:** 1.0.0
**Fecha de Elaboración:** 05 de Febrero de 2026
**Autor:** Área de Innovación y Desarrollo — HUV

---

## TABLA DE CONTENIDO

1. [Introducción y Visión General](#1-introducción-y-visión-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Backend: Laravel 12](#5-backend-laravel-12)
6. [Frontend: React 19 + TypeScript](#6-frontend-react-19--typescript)
7. [Base de Datos y Modelos](#7-base-de-datos-y-modelos)
8. [Sistema de Rutas](#8-sistema-de-rutas)
9. [Controladores](#9-controladores)
10. [Middleware y Seguridad](#10-middleware-y-seguridad)
11. [Integración con GLPI](#11-integración-con-glpi)
12. [Servicios de Inteligencia Artificial](#12-servicios-de-inteligencia-artificial)
13. [Sistema de Autenticación](#13-sistema-de-autenticación)
14. [Sistema de Notificaciones](#14-sistema-de-notificaciones)
15. [Exportación de Datos](#15-exportación-de-datos)
16. [Sistema de Plantillas](#16-sistema-de-plantillas)
17. [Testing y Calidad](#17-testing-y-calidad)
18. [Rendimiento y Optimización](#18-rendimiento-y-optimización)
19. [API Reference](#19-api-reference)
20. [Guía de Desarrollo](#20-guía-de-desarrollo)
21. [Troubleshooting Técnico](#21-troubleshooting-técnico)
22. [Extensibilidad y Futuras Mejoras](#22-extensibilidad-y-futuras-mejoras)

---

## 1. Introducción y Visión General

### 1.1 Propósito del Documento

Este documento proporciona una descripción técnica exhaustiva del sistema **HelpDesk HUV**, una aplicación web moderna diseñada para la gestión de tickets de soporte técnico y el inventario de activos tecnológicos del Hospital Universitario del Valle "Evaristo García" E.S.E.

### 1.2 Alcance Técnico

El sistema abarca las siguientes áreas funcionales:

- **Gestión de Tickets de Soporte:** Creación, asignación, seguimiento y resolución de solicitudes de soporte técnico, integrado con la base de datos existente de GLPI.
- **Gestión de Inventario de Activos:** CRUD completo para computadores, monitores, impresoras, teléfonos, periféricos, equipos de red, software y consumibles.
- **Sistema de Autenticación:** Login con usuario/contraseña, autenticación de dos factores (2FA) con aplicación authenticator.
- **Asistente Virtual (Chatbot):** Integración con modelos de lenguaje para asistencia guiada en la creación de tickets.
- **Estadísticas y Reportes:** Dashboard analítico con gráficos interactivos y exportación a Excel.
- **Sistema de Notificaciones:** Alertas en tiempo real dentro de la aplicación.

### 1.3 Diagrama de Contexto

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USUARIOS DEL SISTEMA                            │
├─────────────────────────────────────────────────────────────────────────┤
│  [Administradores]    [Técnicos de Soporte]    [Usuarios Finales]       │
│         │                      │                       │                 │
└─────────│──────────────────────│───────────────────────│───────────────-┘
          │                      │                       │
          ▼                      ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         HELPDESK HUV (SPA)                               │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  FRONTEND: React 19 + TypeScript + Tailwind CSS + Inertia.js     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  BACKEND: Laravel 12 + PHP 8.2+                                   │   │
│  │  ├── Controllers (22)                                             │   │
│  │  ├── Models (11)                                                  │   │
│  │  ├── Middleware (Auth, Role, 2FA)                                 │   │
│  │  └── Artisan Commands                                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
          │                                              │
          ▼                                              ▼
┌─────────────────────────┐              ┌─────────────────────────────┐
│   BASE DE DATOS GLPI    │              │   SERVICIOS EXTERNOS        │
│  ┌───────────────────┐  │              │  ┌─────────────────────────┐│
│  │ glpi_tickets      │  │              │  │ OpenRouter API (IA)     ││
│  │ glpi_computers    │  │              │  └─────────────────────────┘│
│  │ glpi_monitors     │  │              │  ┌─────────────────────────┐│
│  │ glpi_printers     │  │              │  │ Puter.js (IA Alt)       ││
│  │ glpi_phones       │  │              │  └─────────────────────────┘│
│  │ glpi_peripherals  │  │              │  ┌─────────────────────────┐│
│  │ glpi_network...   │  │              │  │ SMTP Server (Correo)    ││
│  │ glpi_softwares    │  │              │  └─────────────────────────┘│
│  │ glpi_consumable...│  │              └─────────────────────────────┘
│  │ + tablas auxiliar │  │
│  │ + tablas Laravel  │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

---

## 2. Arquitectura del Sistema

### 2.1 Patrón Arquitectónico: Monolito Modular con SPA

HelpDesk HUV implementa un patrón arquitectónico de **Monolito Modular** con un frontend de tipo **Single Page Application (SPA)**. Esta decisión arquitectónica ofrece:

- **Simplicidad de despliegue:** Un solo artefacto a desplegar.
- **Facilidad de mantenimiento:** Código cohesivo sin la complejidad de microservicios.
- **Rendimiento:** Sin latencia de red entre servicios internos.
- **Experiencia de usuario fluida:** SPA con navegación instantánea.

### 2.2 Patrón MVC con Inertia.js

El sistema utiliza el clásico patrón **Model-View-Controller (MVC)** de Laravel, extendido con **Inertia.js** para eliminar la necesidad de una API REST separada:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     MODEL       │    │   CONTROLLER    │    │   VIEW (React)  │
│  (Eloquent ORM) │◄──►│ (Laravel PHP)   │◄──►│  (via Inertia)  │
│                 │    │                 │    │                 │
│ - User          │    │ - TicketCtrl    │    │ - Dashboard.tsx │
│ - Computer      │    │ - ComputerCtrl  │    │ - Tickets.tsx   │
│ - Monitor       │    │ - DashboardCtrl │    │ - Inventory.tsx │
│ - Ticket (GLPI) │    │ - etc.          │    │ - etc.          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    INERTIA.JS         │
                    │  (Protocolo Puente)   │
                    │                       │
                    │  Transforma respuestas│
                    │  Laravel en props de  │
                    │  componentes React    │
                    └───────────────────────┘
```

### 2.3 Flujo de una Petición

```
1. NAVEGADOR                    2. SERVIDOR WEB              3. PHP-FPM
   ┌──────────┐                    ┌──────────┐                ┌──────────┐
   │ Usuario  │ ─GET /tickets─►    │  Apache  │ ─proxy─►       │  Laravel │
   │ hace     │                    │  Nginx   │                │  Router  │
   │ clic     │                    └──────────┘                └────┬─────┘
   └──────────┘                                                     │
                                                                    ▼
4. MIDDLEWARE                   5. CONTROLLER               6. MODEL/DB
   ┌──────────┐                    ┌──────────┐                ┌──────────┐
   │ Auth     │ ─valida─►          │ Ticket   │ ─consulta─►    │ Eloquent │
   │ Role     │                    │Controller│                │ ─► MySQL │
   │ 2FA      │                    │ index()  │ ◄─datos────    │          │
   └──────────┘                    └────┬─────┘                └──────────┘
                                        │
                                        ▼
7. INERTIA RENDER               8. RESPUESTA JSON           9. REACT RENDER
   ┌──────────┐                    ┌──────────┐                ┌──────────┐
   │ Inertia  │ ─genera─►          │ {        │ ─envía─►       │ React    │
   │::render()│                    │  component│               │ hidrata  │
   │          │                    │  props   │                │ y render │
   └──────────┘                    │ }        │                │ en DOM   │
                                   └──────────┘                └──────────┘
```

### 2.4 Capas de la Aplicación

| Capa | Tecnología | Responsabilidad |
| :--- | :--- | :--- |
| **Presentación** | React 19, TypeScript, Tailwind CSS, Radix UI | Interfaz de usuario, formularios, validación del lado del cliente |
| **Comunicación** | Inertia.js 2.0 | Protocolo de comunicación entre Laravel y React |
| **Aplicación** | Laravel Controllers, Requests | Lógica de negocio, orquestación de operaciones |
| **Dominio** | Eloquent Models | Entidades de negocio, relaciones, scopes |
| **Infraestructura** | MySQL, OpenRouter API, SMTP | Persistencia, servicios externos |

---

## 3. Stack Tecnológico

### 3.1 Backend

| Componente | Versión | Propósito |
| :--- | :--- | :--- |
| **PHP** | 8.2+ | Lenguaje de servidor |
| **Laravel** | 12.x | Framework PHP MVC |
| **Laravel Fortify** | 1.30+ | Autenticación (login, 2FA, password reset) |
| **Inertia.js Server** | 2.0+ | Adaptador servidor para Inertia |
| **Eloquent ORM** | (incluido en Laravel) | Mapeo objeto-relacional |
| **Composer** | 2.6+ | Gestor de dependencias PHP |

### 3.2 Frontend

| Componente | Versión | Propósito |
| :--- | :--- | :--- |
| **Node.js** | 20.x LTS | Runtime para compilación |
| **React** | 19.2+ | Librería de UI |
| **TypeScript** | 5.7+ | Tipado estático para JavaScript |
| **Vite** | 6.x | Bundler y servidor de desarrollo |
| **Tailwind CSS** | 4.0+ | Framework CSS utility-first |
| **Radix UI** | Latest | Componentes accesibles sin estilos |
| **Lucide React** | 0.469+ | Iconografía |
| **Recharts** | 2.15+ | Gráficos estadísticos |
| **GSAP** | 3.x | Animaciones avanzadas |
| **React Hook Form** | Latest | Manejo de formularios |
| **Zod** | Latest | Validación de esquemas |
| **Sonner** | Latest | Notificaciones toast |

### 3.3 Base de Datos

| Componente | Versión | Propósito |
| :--- | :--- | :--- |
| **MySQL** | 8.0+ | Motor de base de datos principal |
| **MariaDB** | 10.6+ | Alternativa compatible |

### 3.4 Servicios Externos

| Servicio | API/SDK | Propósito |
| :--- | :--- | :--- |
| **OpenRouter** | REST API | Modelos de IA para chatbot |
| **Puter.js** | JavaScript SDK | IA alternativa (cliente) |
| **SMTP Institucional** | Protocolo SMTP | Envío de correos |

### 3.5 Herramientas de Desarrollo

| Herramienta | Versión | Propósito |
| :--- | :--- | :--- |
| **Pest** | 3.x | Framework de testing PHP |
| **PHPStan** | (vía Larastan) | Análisis estático de código |
| **ESLint** | 9.x | Linting de código JavaScript/TypeScript |
| **Prettier** | (integrado) | Formateo de código |
| **Laravel Pint** | Latest | Formateo de código PHP |
| **Laravel Sail** | (opcional) | Entorno Docker para desarrollo |

---

## 4. Estructura del Proyecto

### 4.1 Árbol de Directorios Principal

```
helpdesk/
├── app/                          # Código PHP de la aplicación
│   ├── Actions/                  # Acciones de Fortify
│   │   └── Fortify/
│   │       ├── CreateNewUser.php
│   │       ├── PasswordValidationRules.php
│   │       ├── ResetUserPassword.php
│   │       └── UpdateUserPassword.php
│   ├── Console/                  # Comandos Artisan personalizados
│   │   └── Commands/
│   │       └── ImportGlpiUsers.php
│   ├── Http/
│   │   ├── Controllers/          # Controladores MVC
│   │   ├── Middleware/           # Middleware personalizados
│   │   └── Requests/             # Form Requests (validación)
│   ├── Models/                   # Modelos Eloquent
│   ├── Providers/                # Service Providers
│   └── Traits/                   # Traits reutilizables
├── bootstrap/                    # Archivos de arranque de Laravel
│   ├── app.php
│   ├── providers.php
│   └── cache/
├── config/                       # Archivos de configuración
├── database/
│   ├── factories/                # Factories para testing
│   ├── migrations/               # Migraciones de base de datos
│   └── seeders/                  # Seeders de datos iniciales
├── DOCUMENTACION/                # Documentación del proyecto
├── lang/                         # Archivos de traducción
│   └── es/                       # Español
├── public/                       # Directorio público (DocumentRoot)
│   ├── build/                    # Assets compilados (CSS/JS)
│   ├── images/                   # Imágenes estáticas
│   ├── index.php                 # Entry point
│   └── storage/                  # Enlace simbólico a storage/app/public
├── resources/
│   ├── css/                      # Archivos CSS fuente
│   │   └── app.css
│   ├── js/                       # Código TypeScript/React
│   │   ├── app.tsx               # Entry point de React
│   │   ├── ssr.tsx               # Entry point para SSR
│   │   ├── components/           # Componentes React
│   │   ├── hooks/                # Custom hooks
│   │   ├── layouts/              # Layouts de página
│   │   ├── lib/                  # Utilidades
│   │   ├── pages/                # Páginas (rutas de Inertia)
│   │   └── types/                # Definiciones de tipos TypeScript
│   └── views/
│       └── app.blade.php         # Template HTML base
├── routes/
│   ├── web.php                   # Rutas web principales
│   ├── settings.php              # Rutas de configuración de usuario
│   └── console.php               # Comandos de consola
├── storage/                      # Archivos generados y logs
│   ├── app/                      # Archivos de la aplicación
│   │   └── public/               # Archivos públicos
│   ├── framework/                # Caché, sesiones, vistas compiladas
│   └── logs/                     # Logs de la aplicación
├── tests/                        # Tests automatizados
│   ├── Feature/                  # Tests de integración
│   ├── Unit/                     # Tests unitarios
│   ├── Pest.php                  # Configuración de Pest
│   └── TestCase.php              # Clase base de tests
├── vendor/                       # Dependencias PHP (Composer)
├── .env                          # Variables de entorno (no versionado)
├── .env.example                  # Ejemplo de variables de entorno
├── artisan                       # CLI de Laravel
├── composer.json                 # Definición de dependencias PHP
├── package.json                  # Definición de dependencias JS
├── tsconfig.json                 # Configuración de TypeScript
├── vite.config.ts                # Configuración de Vite
└── phpunit.xml                   # Configuración de PHPUnit/Pest
```

### 4.2 Directorio app/Http/Controllers/

```
Controllers/
├── Auth/
│   ├── PasswordController.php            # Cambio de contraseña
│   ├── TwoFactorAuthenticationController.php  # Gestión 2FA
│   └── ...
├── Settings/
│   └── ProfileController.php             # Perfil de usuario
├── ChatbotController.php                 # API del chatbot IA
├── ComputerController.php                # CRUD de computadores
├── ConsumableItemController.php          # CRUD de consumibles
├── DashboardController.php               # Dashboard principal
├── EnDesarrolloController.php            # Páginas en desarrollo
├── GlobalInventoryController.php         # Inventario global
├── MonitorController.php                 # CRUD de monitores
├── NetworkEquipmentController.php        # CRUD de equipos de red
├── NotificationController.php            # Sistema de notificaciones
├── PeripheralController.php              # CRUD de periféricos
├── PhoneController.php                   # CRUD de teléfonos
├── PrinterController.php                 # CRUD de impresoras
├── PublicTicketController.php            # Tickets públicos
├── SearchController.php                  # Búsqueda global
├── SoftwareController.php                # CRUD de software
├── StatisticsController.php              # Estadísticas y gráficos
├── TemplateController.php                # Gestión de plantillas
├── TicketController.php                  # CRUD de tickets
└── UserController.php                    # Gestión de usuarios
```

### 4.3 Directorio resources/js/

```
js/
├── app.tsx                      # Entry point React (client-side)
├── ssr.tsx                      # Entry point React (server-side rendering)
├── components/
│   ├── ui/                      # Componentes UI base (shadcn/ui style)
│   │   ├── accordion.tsx
│   │   ├── alert.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── pagination.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   └── tooltip.tsx
│   ├── app-logo.tsx             # Logo de la aplicación
│   ├── app-sidebar.tsx          # Barra lateral de navegación
│   ├── breadcrumbs.tsx          # Migas de pan
│   ├── chatbot.tsx              # Componente del chatbot
│   ├── delete-user.tsx          # Diálogo de eliminación de usuario
│   ├── heading.tsx              # Encabezados de sección
│   ├── icon.tsx                 # Componente de iconos
│   ├── input-error.tsx          # Mensajes de error en inputs
│   ├── nav-main.tsx             # Navegación principal
│   ├── nav-user.tsx             # Menú de usuario
│   ├── notification-dropdown.tsx # Dropdown de notificaciones
│   ├── text-link.tsx            # Enlaces de texto
│   ├── theme-toggle.tsx         # Toggle de tema oscuro/claro
│   └── user-info.tsx            # Información del usuario
├── hooks/
│   ├── use-appearance.tsx       # Hook para tema
│   ├── use-initials.tsx         # Hook para generar iniciales
│   ├── use-mobile.tsx           # Hook para detectar móvil
│   ├── use-perpage.ts           # Hook para paginación
│   └── use-toast.ts             # Hook para toasts
├── layouts/
│   ├── app-layout.tsx           # Layout principal de la app
│   ├── auth-layout.tsx          # Layout de autenticación
│   └── settings/
│       └── layout.tsx           # Layout de configuración
├── lib/
│   └── utils.ts                 # Funciones utilitarias (cn, etc.)
├── pages/
│   ├── auth/
│   │   ├── confirm-password.tsx
│   │   ├── forgot-password.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── reset-password.tsx
│   │   ├── two-factor-challenge.tsx
│   │   └── verify-email.tsx
│   ├── dashboard.tsx            # Página de dashboard
│   ├── en-desarrollo/           # Páginas en desarrollo
│   ├── inventario/
│   │   ├── computadores/
│   │   │   ├── crear.tsx
│   │   │   ├── editar.tsx
│   │   │   ├── index.tsx
│   │   │   └── show.tsx
│   │   ├── monitores/
│   │   ├── impresoras/
│   │   ├── telefonos/
│   │   ├── perifericos/
│   │   ├── equipos-de-red/
│   │   ├── software/
│   │   ├── consumibles/
│   │   └── inventario-global.tsx
│   ├── notificaciones/
│   │   └── index.tsx
│   ├── settings/
│   │   ├── appearance.tsx
│   │   ├── password.tsx
│   │   └── profile.tsx
│   ├── soporte/
│   │   ├── reporte-publico/
│   │   ├── tickets/
│   │   └── mis-tickets.tsx
│   ├── estadisticas/
│   │   └── estadisticas.tsx
│   └── usuarios/
│       ├── crear.tsx
│       ├── editar.tsx
│       └── index.tsx
└── types/
    └── index.d.ts               # Tipos globales TypeScript
```

---

## 5. Backend: Laravel 12

### 5.1 Configuración de Laravel

#### 5.1.1 Archivo config/app.php

```php
return [
    'name' => env('APP_NAME', 'HelpDesk HUV'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost'),
    'timezone' => env('APP_TIMEZONE', 'America/Bogota'),
    'locale' => env('APP_LOCALE', 'es'),
    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),
    'faker_locale' => env('APP_FAKER_LOCALE', 'es_CO'),
    // ...
];
```

#### 5.1.2 Archivo config/database.php

La aplicación utiliza una única conexión MySQL que apunta a la base de datos de GLPI:

```php
return [
    'default' => env('DB_CONNECTION', 'mysql'),
    'connections' => [
        'mysql' => [
            'driver' => 'mysql',
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'glpi_huv'),
            'username' => env('DB_USERNAME', 'helpdesk_user'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8mb4'),
            'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
            'prefix' => '',
            'strict' => true,
            'engine' => null,
        ],
    ],
    // ...
];
```

#### 5.1.3 Service Providers

**app/Providers/AppServiceProvider.php:**
```php
namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Forzar HTTPS en producción
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }
    }
}
```

**app/Providers/FortifyServiceProvider.php:**
```php
namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Actions\Fortify\UpdateUserPassword;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Fortify;
use Inertia\Inertia;
use App\Models\User;

class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Configurar autenticación por username
        Fortify::authenticateUsing(function ($request) {
            $user = User::where('username', $request->username)->first();
            if ($user && Hash::check($request->password, $user->password)) {
                return $user;
            }
        });

        // Vistas de Inertia para autenticación
        Fortify::loginView(fn () => Inertia::render('auth/login'));
        Fortify::registerView(fn () => Inertia::render('auth/register'));
        Fortify::requestPasswordResetLinkView(fn () => Inertia::render('auth/forgot-password'));
        Fortify::resetPasswordView(fn ($request) => Inertia::render('auth/reset-password', [
            'token' => $request->route('token'),
            'email' => $request->email,
        ]));
        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));
        Fortify::verifyEmailView(fn () => Inertia::render('auth/verify-email'));

        // Acciones personalizadas
        Fortify::createUsersUsing(CreateNewUser::class);
        Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
    }
}
```

### 5.2 Comandos Artisan Personalizados

#### 5.2.1 ImportGlpiUsers

**Ubicación:** `app/Console/Commands/ImportGlpiUsers.php`

```php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ImportGlpiUsers extends Command
{
    protected $signature = 'glpi:import-users';
    protected $description = 'Importa usuarios activos desde GLPI a la tabla users de Laravel';

    public function handle(): int
    {
        $this->info('Iniciando importación de usuarios GLPI...');

        $glpiUsers = DB::table('glpi_users')
            ->where('is_active', true)
            ->get();

        $imported = 0;
        $skipped = 0;

        foreach ($glpiUsers as $glpiUser) {
            // Verificar si ya existe
            $exists = User::where('glpi_user_id', $glpiUser->id)
                ->orWhere('username', $glpiUser->name)
                ->exists();

            if ($exists) {
                $skipped++;
                continue;
            }

            // Crear usuario
            User::create([
                'name' => $glpiUser->realname . ' ' . $glpiUser->firstname,
                'username' => $glpiUser->name,
                'email' => $glpiUser->name . '@huv.gov.co',
                'password' => Hash::make('admin123'),
                'role' => 'Técnico',
                'is_active' => true,
                'glpi_user_id' => $glpiUser->id,
            ]);

            $imported++;
        }

        $this->info("Importación completada. Importados: {$imported}, Omitidos: {$skipped}");

        return Command::SUCCESS;
    }
}
```

**Uso:**
```bash
$ php artisan glpi:import-users
```

### 5.3 Form Requests

Los Form Requests encapsulan la lógica de validación y autorización:

**Ejemplo: ComputerRequest (app/Http/Requests/ComputerRequest.php):**

```php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ComputerRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Verificar que el usuario tenga permiso
        return auth()->user()->role === 'Administrador' 
            || auth()->user()->role === 'Técnico';
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'serial' => 'nullable|string|max:255',
            'computermodels_id' => 'nullable|integer|exists:glpi_computermodels,id',
            'computertypes_id' => 'nullable|integer|exists:glpi_computertypes,id',
            'manufacturers_id' => 'nullable|integer|exists:glpi_manufacturers,id',
            'locations_id' => 'nullable|integer|exists:glpi_locations,id',
            'states_id' => 'nullable|integer|exists:glpi_states,id',
            'users_id' => 'nullable|integer',
            'contact' => 'nullable|string|max:255',
            'comment' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del equipo es obligatorio.',
            'name.max' => 'El nombre no puede exceder 255 caracteres.',
            // ...
        ];
    }
}
```

### 5.4 Traits

**ExcelExportStyles (app/Traits/ExcelExportStyles.php):**

Este trait proporciona estilos consistentes para exportaciones a Excel usando PhpSpreadsheet:

```php
namespace App\Traits;

use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

trait ExcelExportStyles
{
    protected function getHeaderStyle(): array
    {
        return [
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 12,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4F81BD'], // Azul institucional
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ];
    }

    protected function getDataStyle(): array
    {
        return [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ];
    }

    protected function getAlternateRowStyle(): array
    {
        return [
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F2F2F2'],
            ],
        ];
    }
}
```

---

## 6. Frontend: React 19 + TypeScript

### 6.1 Entry Point (app.tsx)

```typescript
import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'HelpDesk HUV';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx')
        ),
    setup({ el, App, props }) {
        initializeTheme();

        if (import.meta.env.SSR) {
            hydrateRoot(el, <App {...props} />);
        } else {
            createRoot(el).render(<App {...props} />);
        }
    },
    progress: {
        color: '#4F81BD',
        showSpinner: true,
    },
});
```

### 6.2 Layouts

#### 6.2.1 AppLayout (layouts/app-layout.tsx)

El layout principal de la aplicación:

```typescript
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/toaster';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { Chatbot } from '@/components/chatbot';
import { usePage } from '@inertiajs/react';
import { type User } from '@/types';

interface Props {
    children: React.ReactNode;
    breadcrumbs?: Array<{ title: string; href: string }>;
}

export default function AppLayout({ children, breadcrumbs = [] }: Props) {
    const { auth } = usePage().props as { auth: { user: User } };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                    <div className="ml-auto flex items-center gap-2">
                        <NotificationDropdown />
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                    {children}
                </main>
            </SidebarInset>
            <Toaster />
            <Chatbot />
        </SidebarProvider>
    );
}
```

#### 6.2.2 AuthLayout (layouts/auth-layout.tsx)

Layout para páginas de autenticación:

```typescript
import { Link } from '@inertiajs/react';
import { AppLogo } from '@/components/app-logo';

interface Props {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export default function AuthLayout({ children, title, description }: Props) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="w-full max-w-md space-y-8 px-4">
                <div className="flex flex-col items-center">
                    <Link href="/">
                        <AppLogo className="h-16 w-auto" />
                    </Link>
                    {title && (
                        <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
                            {title}
                        </h1>
                    )}
                    {description && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {description}
                        </p>
                    )}
                </div>
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
```

### 6.3 Tipos TypeScript (types/index.d.ts)

```typescript
export interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    role: 'Administrador' | 'Técnico' | 'Usuario';
    is_active: boolean;
    avatar?: string;
    phone?: string;
    two_factor_confirmed_at?: string;
    glpi_user_id?: number;
    created_at: string;
    updated_at: string;
}

export interface Ticket {
    id: number;
    name: string;
    content: string;
    status: number;
    urgency: number;
    priority: number;
    date: string;
    date_mod: string;
    closedate?: string;
    solvedate?: string;
    requester?: User;
    technician?: User;
    category?: Category;
    entity?: Entity;
}

export interface Computer {
    id: number;
    name: string;
    serial?: string;
    otherserial?: string;
    contact?: string;
    comment?: string;
    date_mod: string;
    states_id?: number;
    locations_id?: number;
    computertypes_id?: number;
    computermodels_id?: number;
    manufacturers_id?: number;
    users_id?: number;
    // Relaciones expandidas
    state?: State;
    location?: Location;
    type?: ComputerType;
    model?: ComputerModel;
    manufacturer?: Manufacturer;
    user?: GlpiUser;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
}

export interface Notification {
    id: number;
    type: string;
    message: string;
    related_type?: string;
    related_id?: number;
    is_read: boolean;
    created_at: string;
}

// ... más tipos
```

### 6.4 Custom Hooks

**use-perpage.ts:**
```typescript
import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';

export function usePerPage(initialPerPage = 15) {
    const [perPage, setPerPageState] = useState(initialPerPage);

    const setPerPage = useCallback((newPerPage: number) => {
        setPerPageState(newPerPage);
        router.reload({
            data: { per_page: newPerPage, page: 1 },
            only: ['data', 'pagination'],
        });
    }, []);

    return [perPage, setPerPage] as const;
}
```

**use-mobile.tsx:**
```typescript
import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);

        return () => window.removeEventListener('resize', checkIsMobile);
    }, [breakpoint]);

    return isMobile;
}
```

### 6.5 Componentes UI

Los componentes UI siguen el patrón de **shadcn/ui**, construidos sobre **Radix UI** con estilos de **Tailwind CSS**:

**Ejemplo: Button (components/ui/button.tsx):**

```typescript
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary/90',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-8',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

---

## 7. Base de Datos y Modelos

### 7.1 Esquema de Base de Datos

HelpDesk HUV opera sobre la base de datos existente de GLPI, añadiendo las siguientes tablas propias de Laravel:

#### 7.1.1 Tablas de Laravel

| Tabla | Descripción |
| :--- | :--- |
| `users` | Usuarios de Laravel (autenticación, roles) |
| `sessions` | Sesiones de usuario (si se usa driver database) |
| `cache` | Caché (si se usa driver database) |
| `cache_locks` | Bloqueos de caché |
| `jobs` | Cola de trabajos |
| `job_batches` | Lotes de trabajos |
| `failed_jobs` | Trabajos fallidos |
| `notifications` | Notificaciones del sistema |
| `templates` | Plantillas de respuestas (futuro) |

#### 7.1.2 Tablas de GLPI (Utilizadas)

| Tabla | Descripción | Uso en HelpDesk |
| :--- | :--- | :--- |
| `glpi_tickets` | Tickets de soporte | CRUD completo |
| `glpi_tickets_users` | Relación tickets-usuarios | Asignación de técnicos/solicitantes |
| `glpi_itilsolutions` | Soluciones de tickets | Crear soluciones |
| `glpi_itilcategories` | Categorías ITIL | Clasificación de tickets |
| `glpi_computers` | Computadores | CRUD completo |
| `glpi_monitors` | Monitores | CRUD completo |
| `glpi_printers` | Impresoras | CRUD completo |
| `glpi_phones` | Teléfonos | CRUD completo |
| `glpi_peripherals` | Periféricos | CRUD completo |
| `glpi_networkequipments` | Equipos de red | CRUD completo |
| `glpi_softwares` | Software | CRUD completo |
| `glpi_consumableitems` | Consumibles | CRUD completo |
| `glpi_users` | Usuarios GLPI | Lectura para sincronización |
| `glpi_entities` | Entidades | Filtrado por entidad |
| `glpi_states` | Estados | Catálogo de estados |
| `glpi_locations` | Ubicaciones | Catálogo de ubicaciones |
| `glpi_manufacturers` | Fabricantes | Catálogo de fabricantes |
| `glpi_computertypes` | Tipos de computador | Catálogo |
| `glpi_computermodels` | Modelos de computador | Catálogo |
| `glpi_monitortypes` | Tipos de monitor | Catálogo |
| `glpi_monitormodels` | Modelos de monitor | Catálogo |
| `glpi_printertypes` | Tipos de impresora | Catálogo |
| `glpi_printermodels` | Modelos de impresora | Catálogo |
| `glpi_phonetypes` | Tipos de teléfono | Catálogo |
| `glpi_phonemodels` | Modelos de teléfono | Catálogo |
| `glpi_peripheraltypes` | Tipos de periférico | Catálogo |
| `glpi_peripheralmodels` | Modelos de periférico | Catálogo |
| `glpi_networkequipmenttypes` | Tipos de equipo de red | Catálogo |
| `glpi_networkequipmentmodels` | Modelos de equipo de red | Catálogo |
| `glpi_softwarecategories` | Categorías de software | Catálogo |
| `glpi_consumableitemtypes` | Tipos de consumible | Catálogo |

### 7.2 Modelos Eloquent

#### 7.2.1 User (app/Models/User.php)

```php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'is_active',
        'phone',
        'avatar',
        'glpi_user_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    // Relaciones
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    // Accessors
    public function getInitialsAttribute(): string
    {
        $words = explode(' ', $this->name);
        $initials = '';
        foreach (array_slice($words, 0, 2) as $word) {
            $initials .= strtoupper(substr($word, 0, 1));
        }
        return $initials;
    }
}
```

#### 7.2.2 Computer (app/Models/Computer.php)

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Computer extends Model
{
    protected $table = 'glpi_computers';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'name',
        'serial',
        'otherserial',
        'contact',
        'contact_num',
        'comment',
        'date_mod',
        'entities_id',
        'is_recursive',
        'is_deleted',
        'is_template',
        'states_id',
        'locations_id',
        'computertypes_id',
        'computermodels_id',
        'manufacturers_id',
        'users_id',
        'groups_id',
        'users_id_tech',
        'groups_id_tech',
    ];

    protected $casts = [
        'is_deleted' => 'boolean',
        'is_template' => 'boolean',
        'is_recursive' => 'boolean',
        'date_mod' => 'datetime',
    ];

    // Relaciones
    public function state()
    {
        return $this->belongsTo(State::class, 'states_id');
    }

    public function location()
    {
        return $this->belongsTo(Location::class, 'locations_id');
    }

    public function type()
    {
        return $this->belongsTo(ComputerType::class, 'computertypes_id');
    }

    public function model()
    {
        return $this->belongsTo(ComputerModel::class, 'computermodels_id');
    }

    public function manufacturer()
    {
        return $this->belongsTo(Manufacturer::class, 'manufacturers_id');
    }

    public function user()
    {
        return $this->belongsTo(GlpiUser::class, 'users_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_deleted', false)
                     ->where('is_template', false);
    }

    public function scopeSearch($query, ?string $search)
    {
        if (!$search) return $query;
        
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('serial', 'like', "%{$search}%")
              ->orWhere('contact', 'like', "%{$search}%");
        });
    }
}
```

#### 7.2.3 Monitor (app/Models/Monitor.php)

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Monitor extends Model
{
    protected $table = 'glpi_monitors';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'name',
        'serial',
        'otherserial',
        'contact',
        'contact_num',
        'comment',
        'date_mod',
        'entities_id',
        'is_recursive',
        'is_deleted',
        'is_template',
        'states_id',
        'locations_id',
        'monitortypes_id',
        'monitormodels_id',
        'manufacturers_id',
        'users_id',
        'groups_id',
        'users_id_tech',
        'groups_id_tech',
        'size',
        'have_micro',
        'have_speaker',
        'have_subd',
        'have_bnc',
        'have_dvi',
        'have_pivot',
        'have_hdmi',
        'have_displayport',
    ];

    protected $casts = [
        'is_deleted' => 'boolean',
        'is_template' => 'boolean',
        'is_recursive' => 'boolean',
        'have_micro' => 'boolean',
        'have_speaker' => 'boolean',
        'have_subd' => 'boolean',
        'have_bnc' => 'boolean',
        'have_dvi' => 'boolean',
        'have_pivot' => 'boolean',
        'have_hdmi' => 'boolean',
        'have_displayport' => 'boolean',
        'date_mod' => 'datetime',
    ];

    // ... relaciones similares a Computer
}
```

#### 7.2.4 Notification (app/Models/Notification.php)

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'message',
        'related_type',
        'related_id',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    // Relaciones
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}
```

### 7.3 Migraciones

#### 7.3.1 Migración: create_users_table

```php
// database/migrations/0001_01_01_000000_create_users_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username')->unique();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role')->default('Usuario');
            $table->boolean('is_active')->default(true);
            $table->string('phone')->nullable();
            $table->string('avatar')->nullable();
            $table->unsignedBigInteger('glpi_user_id')->nullable();
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('users');
    }
};
```

#### 7.3.2 Migración: create_notifications_table

```php
// database/migrations/xxxx_create_notifications_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type');
            $table->text('message');
            $table->string('related_type')->nullable();
            $table->unsignedBigInteger('related_id')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();
            
            $table->index(['user_id', 'is_read']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
```

#### 7.3.3 Migración: add_performance_indexes

```php
// database/migrations/xxxx_add_performance_indexes_to_glpi_tables.php

return new class extends Migration
{
    public function up(): void
    {
        // Índices para tickets
        Schema::table('glpi_tickets', function (Blueprint $table) {
            $table->index(['status', 'date'], 'idx_tickets_status_date');
            $table->index(['itilcategories_id'], 'idx_tickets_category');
        });

        // Índices para computadores
        Schema::table('glpi_computers', function (Blueprint $table) {
            $table->index(['is_deleted', 'is_template'], 'idx_computers_active');
            $table->index(['states_id'], 'idx_computers_state');
            $table->index(['locations_id'], 'idx_computers_location');
        });

        // ... índices para otras tablas
    }

    public function down(): void
    {
        // Eliminar índices
    }
};
```

---

## 8. Sistema de Rutas

### 8.1 Archivo routes/web.php

```php
<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\{
    DashboardController,
    TicketController,
    ComputerController,
    MonitorController,
    PrinterController,
    PhoneController,
    PeripheralController,
    NetworkEquipmentController,
    SoftwareController,
    ConsumableItemController,
    GlobalInventoryController,
    PublicTicketController,
    ChatbotController,
    SearchController,
    NotificationController,
    StatisticsController,
    UserController,
    EnDesarrolloController,
    TemplateController,
};

// ===================================
// RUTAS PÚBLICAS (Sin autenticación)
// ===================================

Route::get('/', function () {
    return redirect()->route('login');
});

Route::prefix('reporte-publico')->name('reporte-publico.')->group(function () {
    Route::get('/', [PublicTicketController::class, 'index'])->name('index');
    Route::post('/crear', [PublicTicketController::class, 'store'])->name('store');
    Route::get('/consultar', [PublicTicketController::class, 'consultar'])->name('consultar');
    Route::post('/buscar', [PublicTicketController::class, 'buscar'])->name('buscar');
});

// ===================================
// RUTAS PROTEGIDAS (Requieren autenticación)
// ===================================

Route::middleware(['auth', 'verified'])->group(function () {

    // --- Dashboard ---
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/tickets-urgentes', [DashboardController::class, 'ticketsUrgentes'])->name('dashboard.tickets-urgentes');
    Route::get('/dashboard/tickets-abiertos', [DashboardController::class, 'ticketsAbiertos'])->name('dashboard.tickets-abiertos');
    Route::get('/dashboard/tickets-resueltos', [DashboardController::class, 'ticketsResueltos'])->name('dashboard.tickets-resueltos');
    Route::get('/dashboard/tickets-cerrados', [DashboardController::class, 'ticketsCerrados'])->name('dashboard.tickets-cerrados');
    Route::get('/dashboard/tickets-pendientes', [DashboardController::class, 'ticketsPendientes'])->name('dashboard.tickets-pendientes');

    // --- Inventario: Computadores ---
    Route::prefix('inventario/computadores')->name('inventario.computadores.')->group(function () {
        Route::get('/', [ComputerController::class, 'index'])->name('index');
        Route::get('/crear', [ComputerController::class, 'create'])->name('create');
        Route::post('/', [ComputerController::class, 'store'])->name('store');
        Route::get('/{computer}', [ComputerController::class, 'show'])->name('show');
        Route::get('/{computer}/editar', [ComputerController::class, 'edit'])->name('edit');
        Route::put('/{computer}', [ComputerController::class, 'update'])->name('update');
        Route::delete('/{computer}', [ComputerController::class, 'destroy'])->name('destroy');
        Route::get('/exportar/excel', [ComputerController::class, 'exportExcel'])->name('export.excel');
    });

    // --- Inventario: Monitores ---
    Route::prefix('inventario/monitores')->name('inventario.monitores.')->group(function () {
        Route::get('/', [MonitorController::class, 'index'])->name('index');
        Route::get('/crear', [MonitorController::class, 'create'])->name('create');
        Route::post('/', [MonitorController::class, 'store'])->name('store');
        Route::get('/{monitor}', [MonitorController::class, 'show'])->name('show');
        Route::get('/{monitor}/editar', [MonitorController::class, 'edit'])->name('edit');
        Route::put('/{monitor}', [MonitorController::class, 'update'])->name('update');
        Route::delete('/{monitor}', [MonitorController::class, 'destroy'])->name('destroy');
        Route::get('/exportar/excel', [MonitorController::class, 'exportExcel'])->name('export.excel');
    });

    // --- Inventario: Impresoras ---
    Route::prefix('inventario/impresoras')->name('inventario.impresoras.')->group(function () {
        Route::get('/', [PrinterController::class, 'index'])->name('index');
        Route::get('/crear', [PrinterController::class, 'create'])->name('create');
        Route::post('/', [PrinterController::class, 'store'])->name('store');
        Route::get('/{printer}', [PrinterController::class, 'show'])->name('show');
        Route::get('/{printer}/editar', [PrinterController::class, 'edit'])->name('edit');
        Route::put('/{printer}', [PrinterController::class, 'update'])->name('update');
        Route::delete('/{printer}', [PrinterController::class, 'destroy'])->name('destroy');
        Route::get('/exportar/excel', [PrinterController::class, 'exportExcel'])->name('export.excel');
    });

    // --- Inventario: Teléfonos ---
    Route::prefix('inventario/telefonos')->name('inventario.telefonos.')->group(function () {
        Route::get('/', [PhoneController::class, 'index'])->name('index');
        Route::get('/crear', [PhoneController::class, 'create'])->name('create');
        Route::post('/', [PhoneController::class, 'store'])->name('store');
        Route::get('/{phone}', [PhoneController::class, 'show'])->name('show');
        Route::get('/{phone}/editar', [PhoneController::class, 'edit'])->name('edit');
        Route::put('/{phone}', [PhoneController::class, 'update'])->name('update');
        Route::delete('/{phone}', [PhoneController::class, 'destroy'])->name('destroy');
        Route::get('/exportar/excel', [PhoneController::class, 'exportExcel'])->name('export.excel');
    });

    // --- Inventario: Periféricos ---
    Route::prefix('inventario/perifericos')->name('inventario.perifericos.')->group(function () {
        Route::get('/', [PeripheralController::class, 'index'])->name('index');
        Route::get('/crear', [PeripheralController::class, 'create'])->name('create');
        Route::post('/', [PeripheralController::class, 'store'])->name('store');
        Route::get('/{peripheral}', [PeripheralController::class, 'show'])->name('show');
        Route::get('/{peripheral}/editar', [PeripheralController::class, 'edit'])->name('edit');
        Route::put('/{peripheral}', [PeripheralController::class, 'update'])->name('update');
        Route::delete('/{peripheral}', [PeripheralController::class, 'destroy'])->name('destroy');
        Route::get('/exportar/excel', [PeripheralController::class, 'exportExcel'])->name('export.excel');
    });

    // --- Inventario: Equipos de Red ---
    Route::prefix('inventario/equipos-de-red')->name('inventario.equipos-de-red.')->group(function () {
        Route::get('/', [NetworkEquipmentController::class, 'index'])->name('index');
        Route::get('/crear', [NetworkEquipmentController::class, 'create'])->name('create');
        Route::post('/', [NetworkEquipmentController::class, 'store'])->name('store');
        Route::get('/{networkEquipment}', [NetworkEquipmentController::class, 'show'])->name('show');
        Route::get('/{networkEquipment}/editar', [NetworkEquipmentController::class, 'edit'])->name('edit');
        Route::put('/{networkEquipment}', [NetworkEquipmentController::class, 'update'])->name('update');
        Route::delete('/{networkEquipment}', [NetworkEquipmentController::class, 'destroy'])->name('destroy');
        Route::get('/exportar/excel', [NetworkEquipmentController::class, 'exportExcel'])->name('export.excel');
    });

    // --- Inventario: Software ---
    Route::prefix('inventario/software')->name('inventario.software.')->group(function () {
        Route::get('/', [SoftwareController::class, 'index'])->name('index');
        Route::get('/crear', [SoftwareController::class, 'create'])->name('create');
        Route::post('/', [SoftwareController::class, 'store'])->name('store');
        Route::get('/{software}', [SoftwareController::class, 'show'])->name('show');
        Route::get('/{software}/editar', [SoftwareController::class, 'edit'])->name('edit');
        Route::put('/{software}', [SoftwareController::class, 'update'])->name('update');
        Route::delete('/{software}', [SoftwareController::class, 'destroy'])->name('destroy');
        Route::get('/exportar/excel', [SoftwareController::class, 'exportExcel'])->name('export.excel');
    });

    // --- Inventario: Consumibles ---
    Route::prefix('inventario/consumibles')->name('inventario.consumibles.')->group(function () {
        Route::get('/', [ConsumableItemController::class, 'index'])->name('index');
        Route::get('/crear', [ConsumableItemController::class, 'create'])->name('create');
        Route::post('/', [ConsumableItemController::class, 'store'])->name('store');
        Route::get('/{consumableItem}', [ConsumableItemController::class, 'show'])->name('show');
        Route::get('/{consumableItem}/editar', [ConsumableItemController::class, 'edit'])->name('edit');
        Route::put('/{consumableItem}', [ConsumableItemController::class, 'update'])->name('update');
        Route::delete('/{consumableItem}', [ConsumableItemController::class, 'destroy'])->name('destroy');
        Route::get('/exportar/excel', [ConsumableItemController::class, 'exportExcel'])->name('export.excel');
    });

    // --- Inventario Global ---
    Route::get('/inventario', [GlobalInventoryController::class, 'index'])->name('inventario.index');
    Route::get('/inventario/exportar/excel', [GlobalInventoryController::class, 'exportExcel'])->name('inventario.export.excel');

    // --- Soporte: Tickets ---
    Route::prefix('soporte/tickets')->name('soporte.tickets.')->group(function () {
        Route::get('/', [TicketController::class, 'index'])->name('index');
        Route::get('/crear', [TicketController::class, 'create'])->name('create');
        Route::post('/', [TicketController::class, 'store'])->name('store');
        Route::get('/{ticket}', [TicketController::class, 'show'])->name('show');
        Route::get('/{ticket}/editar', [TicketController::class, 'edit'])->name('edit');
        Route::put('/{ticket}', [TicketController::class, 'update'])->name('update');
        Route::delete('/{ticket}', [TicketController::class, 'destroy'])->name('destroy');
        Route::post('/{ticket}/tomar', [TicketController::class, 'tomar'])->name('tomar');
        Route::post('/{ticket}/resolver', [TicketController::class, 'resolver'])->name('resolver');
    });

    // --- Soporte: Mis Tickets ---
    Route::get('/soporte/mis-tickets', [TicketController::class, 'misTickets'])->name('soporte.mis-tickets');

    // --- Estadísticas ---
    Route::get('/estadisticas', [StatisticsController::class, 'index'])->name('estadisticas.index');
    Route::get('/estadisticas/exportar', [StatisticsController::class, 'export'])->name('estadisticas.export');

    // --- Administración: Usuarios ---
    Route::prefix('administracion/usuarios')->name('administracion.usuarios.')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::get('/crear', [UserController::class, 'create'])->name('create');
        Route::post('/', [UserController::class, 'store'])->name('store');
        Route::get('/{user}/editar', [UserController::class, 'edit'])->name('edit');
        Route::put('/{user}', [UserController::class, 'update'])->name('update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
    });

    // --- Notificaciones ---
    Route::prefix('notificaciones')->name('notificaciones.')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::get('/obtener', [NotificationController::class, 'obtener'])->name('obtener');
        Route::post('/{notification}/marcar-leida', [NotificationController::class, 'marcarLeida'])->name('marcar-leida');
        Route::post('/marcar-todas-leidas', [NotificationController::class, 'marcarTodasLeidas'])->name('marcar-todas-leidas');
        Route::delete('/{notification}', [NotificationController::class, 'destroy'])->name('destroy');
        Route::delete('/', [NotificationController::class, 'destroyAll'])->name('destroy-all');
    });

    // --- Búsqueda Global ---
    Route::get('/buscar', [SearchController::class, 'search'])->name('buscar');

    // --- Chatbot ---
    Route::prefix('chatbot')->name('chatbot.')->group(function () {
        Route::post('/message', [ChatbotController::class, 'message'])->name('message');
        Route::post('/classify', [ChatbotController::class, 'classify'])->name('classify');
        Route::get('/categories', [ChatbotController::class, 'categories'])->name('categories');
        Route::post('/create-ticket', [ChatbotController::class, 'createTicket'])->name('create-ticket');
        Route::post('/improve-description', [ChatbotController::class, 'improveDescription'])->name('improve-description');
        Route::get('/history', [ChatbotController::class, 'history'])->name('history');
    });

    // --- En Desarrollo ---
    Route::prefix('en-desarrollo')->name('en-desarrollo.')->group(function () {
        Route::get('/base-de-conocimiento', [EnDesarrolloController::class, 'baseDeConocimiento'])->name('base-de-conocimiento');
        Route::get('/documentos', [EnDesarrolloController::class, 'documentos'])->name('documentos');
        Route::get('/plantillas', [EnDesarrolloController::class, 'plantillas'])->name('plantillas');
        Route::get('/reportes', [EnDesarrolloController::class, 'reportes'])->name('reportes');
        Route::get('/tareas', [EnDesarrolloController::class, 'tareas'])->name('tareas');
        Route::get('/proyectos', [EnDesarrolloController::class, 'proyectos'])->name('proyectos');
        Route::get('/reservaciones', [EnDesarrolloController::class, 'reservaciones'])->name('reservaciones');
        // ... más rutas en desarrollo
    });

});

// Incluir rutas de configuración de usuario
require __DIR__.'/settings.php';
```

### 8.2 Archivo routes/settings.php

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\TwoFactorAuthenticationController;
use Inertia\Inertia;

Route::middleware(['auth'])->prefix('settings')->name('settings.')->group(function () {
    // Perfil
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');

    // Contraseña
    Route::get('/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('/password', [PasswordController::class, 'update'])->name('password.update');

    // Apariencia
    Route::get('/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');

    // 2FA
    Route::get('/two-factor', [TwoFactorAuthenticationController::class, 'show'])->name('two-factor.show');
});
```

---

## 9. Controladores

### 9.1 DashboardController

**Ubicación:** `app/Http/Controllers/DashboardController.php`

**Métodos:**

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `index()` | GET /dashboard | Vista principal del dashboard con estadísticas |
| `ticketsUrgentes()` | GET /dashboard/tickets-urgentes | Lista de tickets con urgencia alta |
| `ticketsAbiertos()` | GET /dashboard/tickets-abiertos | Lista de tickets con estado "Nuevo" |
| `ticketsResueltos()` | GET /dashboard/tickets-resueltos | Lista de tickets resueltos |
| `ticketsCerrados()` | GET /dashboard/tickets-cerrados | Lista de tickets cerrados |
| `ticketsPendientes()` | GET /dashboard/tickets-pendientes | Lista de tickets pendientes |

**Implementación del método index():**

```php
public function index(): Response
{
    $ticketsQuery = DB::table('glpi_tickets')
        ->where('is_deleted', false);

    // Estadísticas generales
    $stats = [
        'total_tickets' => (clone $ticketsQuery)->count(),
        'tickets_nuevos' => (clone $ticketsQuery)->where('status', 1)->count(),
        'tickets_en_curso' => (clone $ticketsQuery)->whereIn('status', [2, 3, 4])->count(),
        'tickets_resueltos' => (clone $ticketsQuery)->where('status', 5)->count(),
        'tickets_cerrados' => (clone $ticketsQuery)->where('status', 6)->count(),
        'tickets_urgentes' => (clone $ticketsQuery)
            ->whereIn('status', [1, 2, 3, 4])
            ->where('urgency', '>=', 4)
            ->count(),
    ];

    // Tickets recientes
    $ticketsRecientes = DB::table('glpi_tickets')
        ->where('is_deleted', false)
        ->orderByDesc('date')
        ->limit(10)
        ->get();

    // Estadísticas por mes (último año)
    $ticketsPorMes = DB::table('glpi_tickets')
        ->select(DB::raw('MONTH(date) as mes'), DB::raw('COUNT(*) as total'))
        ->where('is_deleted', false)
        ->whereYear('date', date('Y'))
        ->groupBy(DB::raw('MONTH(date)'))
        ->get();

    return Inertia::render('dashboard', [
        'stats' => $stats,
        'ticketsRecientes' => $ticketsRecientes,
        'ticketsPorMes' => $ticketsPorMes,
    ]);
}
```

### 9.2 TicketController

**Ubicación:** `app/Http/Controllers/TicketController.php`

**Métodos:**

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `index()` | GET /soporte/tickets | Lista paginada de tickets con filtros |
| `create()` | GET /soporte/tickets/crear | Formulario de creación de ticket |
| `store()` | POST /soporte/tickets | Guardar nuevo ticket |
| `show($id)` | GET /soporte/tickets/{id} | Ver detalle de ticket |
| `edit($id)` | GET /soporte/tickets/{id}/editar | Formulario de edición |
| `update($id)` | PUT /soporte/tickets/{id} | Actualizar ticket |
| `destroy($id)` | DELETE /soporte/tickets/{id} | Eliminar ticket (soft delete) |
| `tomar($id)` | POST /soporte/tickets/{id}/tomar | Asignar ticket al técnico actual |
| `resolver($id)` | POST /soporte/tickets/{id}/resolver | Resolver ticket con solución |
| `misTickets()` | GET /soporte/mis-tickets | Tickets asignados al usuario actual |

**Implementación del método store():**

```php
public function store(Request $request): RedirectResponse
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'content' => 'required|string',
        'urgency' => 'required|integer|between:1,5',
        'itilcategories_id' => 'nullable|integer',
        'type' => 'required|integer|in:1,2', // 1 = Incidente, 2 = Solicitud
    ]);

    // Crear ticket en GLPI
    $ticketId = DB::table('glpi_tickets')->insertGetId([
        'name' => $validated['name'],
        'content' => $validated['content'],
        'urgency' => $validated['urgency'],
        'priority' => $validated['urgency'], // Por defecto igual a urgencia
        'type' => $validated['type'],
        'status' => 1, // Nuevo
        'itilcategories_id' => $validated['itilcategories_id'] ?? 0,
        'entities_id' => 0,
        'date' => now(),
        'date_mod' => now(),
        'is_deleted' => false,
    ]);

    // Registrar solicitante
    $user = auth()->user();
    DB::table('glpi_tickets_users')->insert([
        'tickets_id' => $ticketId,
        'users_id' => $user->glpi_user_id ?? 0,
        'type' => 1, // Solicitante
    ]);

    // Crear notificación para técnicos
    $tecnicos = User::where('role', 'Técnico')->orWhere('role', 'Administrador')->get();
    foreach ($tecnicos as $tecnico) {
        Notification::create([
            'user_id' => $tecnico->id,
            'type' => 'nuevo_ticket',
            'message' => "Nuevo ticket: {$validated['name']}",
            'related_type' => 'ticket',
            'related_id' => $ticketId,
        ]);
    }

    return redirect()
        ->route('soporte.tickets.show', $ticketId)
        ->with('success', 'Ticket creado exitosamente.');
}
```

### 9.3 ComputerController

**Ubicación:** `app/Http/Controllers/ComputerController.php`

**Métodos:**

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `index()` | GET /inventario/computadores | Lista paginada con filtros |
| `create()` | GET /inventario/computadores/crear | Formulario de creación |
| `store()` | POST /inventario/computadores | Guardar nuevo computador |
| `show($id)` | GET /inventario/computadores/{id} | Ver detalle |
| `edit($id)` | GET /inventario/computadores/{id}/editar | Formulario de edición |
| `update($id)` | PUT /inventario/computadores/{id} | Actualizar computador |
| `destroy($id)` | DELETE /inventario/computadores/{id} | Eliminar (soft delete) |
| `exportExcel()` | GET /inventario/computadores/exportar/excel | Exportar a Excel |

**Implementación del método index():**

```php
public function index(Request $request): Response
{
    $query = Computer::query()
        ->with(['state', 'location', 'type', 'model', 'manufacturer', 'user'])
        ->active();

    // Búsqueda global
    if ($search = $request->input('search')) {
        $query->search($search);
    }

    // Filtrar por estado
    if ($stateId = $request->input('state')) {
        $query->where('states_id', $stateId);
    }

    // Filtrar por ubicación
    if ($locationId = $request->input('location')) {
        $query->where('locations_id', $locationId);
    }

    // Filtrar por tipo
    if ($typeId = $request->input('type')) {
        $query->where('computertypes_id', $typeId);
    }

    // Ordenamiento
    $sortBy = $request->input('sort_by', 'name');
    $sortDir = $request->input('sort_dir', 'asc');
    $query->orderBy($sortBy, $sortDir);

    // Paginación
    $perPage = $request->input('per_page', 15);
    $computers = $query->paginate($perPage)->withQueryString();

    // Catálogos para filtros
    $states = DB::table('glpi_states')->orderBy('name')->get();
    $locations = DB::table('glpi_locations')->orderBy('name')->get();
    $types = DB::table('glpi_computertypes')->orderBy('name')->get();

    return Inertia::render('inventario/computadores/index', [
        'computers' => $computers,
        'filters' => $request->only(['search', 'state', 'location', 'type', 'sort_by', 'sort_dir']),
        'states' => $states,
        'locations' => $locations,
        'types' => $types,
    ]);
}
```

### 9.4 ChatbotController

**Ubicación:** `app/Http/Controllers/ChatbotController.php`

**Métodos:**

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `message()` | POST /chatbot/message | Enviar mensaje al chatbot |
| `classify()` | POST /chatbot/classify | Clasificar texto en categoría ITIL |
| `categories()` | GET /chatbot/categories | Obtener categorías disponibles |
| `createTicket()` | POST /chatbot/create-ticket | Crear ticket desde chatbot |
| `improveDescription()` | POST /chatbot/improve-description | Mejorar descripción con IA |
| `history()` | GET /chatbot/history | Historial de conversaciones |

**Implementación del método message():**

```php
public function message(Request $request): JsonResponse
{
    $validated = $request->validate([
        'message' => 'required|string|max:2000',
        'context' => 'nullable|array',
    ]);

    $apiKey = config('services.openrouter.api_key');
    $baseUrl = config('services.openrouter.base_url', 'https://openrouter.ai/api/v1');
    $model = config('services.openrouter.model', 'z-ai/glm-4.5-air:free');

    $systemPrompt = <<<PROMPT
    Eres Evarisbot, el asistente virtual del Hospital Universitario del Valle.
    Tu rol es ayudar a los usuarios a:
    1. Crear tickets de soporte técnico
    2. Consultar el estado de sus tickets
    3. Responder preguntas frecuentes sobre TI
    
    Sé amable, conciso y profesional. Si el usuario describe un problema técnico,
    ayúdalo a estructurar la información para crear un ticket.
    
    Responde siempre en español.
    PROMPT;

    $response = Http::withHeaders([
        'Authorization' => "Bearer {$apiKey}",
        'Content-Type' => 'application/json',
    ])->post("{$baseUrl}/chat/completions", [
        'model' => $model,
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $validated['message']],
        ],
        'max_tokens' => 500,
        'temperature' => 0.7,
    ]);

    if ($response->failed()) {
        return response()->json([
            'error' => 'Error al comunicarse con el servicio de IA',
        ], 500);
    }

    $data = $response->json();
    $reply = $data['choices'][0]['message']['content'] ?? 'Lo siento, no pude procesar tu mensaje.';

    return response()->json([
        'reply' => $reply,
        'timestamp' => now()->toISOString(),
    ]);
}
```

### 9.5 NotificationController

**Ubicación:** `app/Http/Controllers/NotificationController.php`

**Métodos:**

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `index()` | GET /notificaciones | Vista de todas las notificaciones |
| `obtener()` | GET /notificaciones/obtener | Obtener notificaciones (JSON para dropdown) |
| `marcarLeida($id)` | POST /notificaciones/{id}/marcar-leida | Marcar como leída |
| `marcarTodasLeidas()` | POST /notificaciones/marcar-todas-leidas | Marcar todas como leídas |
| `destroy($id)` | DELETE /notificaciones/{id} | Eliminar notificación |
| `destroyAll()` | DELETE /notificaciones | Eliminar todas |

---

## 10. Middleware y Seguridad

### 10.1 Middleware Registrados

**bootstrap/app.php:**

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

### 10.2 HandleInertiaRequests Middleware

**app/Http/Middleware/HandleInertiaRequests.php:**

```php
namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tightenco\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'username' => $request->user()->username,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'avatar' => $request->user()->avatar,
                    'initials' => $request->user()->initials,
                    'two_factor_enabled' => !is_null($request->user()->two_factor_confirmed_at),
                ] : null,
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
            ],
        ];
    }
}
```

### 10.3 Protección CSRF

Laravel proporciona protección CSRF automática para todas las peticiones POST, PUT, PATCH y DELETE. Inertia.js maneja automáticamente el token CSRF en cada petición.

### 10.4 Autenticación y Autorización

El sistema utiliza Laravel Fortify para autenticación con las siguientes características:

- **Login con username:** En lugar de email, se usa `username`.
- **2FA:** Autenticación de dos factores con app authenticator.
- **Recuperación de contraseña:** Vía correo electrónico.
- **Roles:** Administrador, Técnico, Usuario.

---

## 11. Integración con GLPI

### 11.1 Modelo de Integración

HelpDesk HUV opera como una **capa de presentación moderna** sobre la base de datos de GLPI. No utiliza la API REST de GLPI, sino que accede directamente a las tablas de base de datos.

**Ventajas de esta arquitectura:**
- Rendimiento: Sin overhead de API HTTP.
- Sincronización inmediata: Los datos se reflejan en tiempo real.
- Compatibilidad bidireccional: Los cambios desde GLPI también son visibles.

**Consideraciones:**
- Acoplamiento: Dependencia del esquema de GLPI.
- Actualizaciones: Cambios en el esquema de GLPI pueden requerir ajustes.

### 11.2 Tablas GLPI Utilizadas

```
glpi_tickets              → Tickets de soporte
glpi_tickets_users        → Relación tickets-usuarios (solicitante, técnico, observador)
glpi_itilsolutions        → Soluciones de tickets
glpi_itilcategories       → Categorías ITIL
glpi_computers            → Computadores
glpi_monitors             → Monitores
glpi_printers             → Impresoras
glpi_phones               → Teléfonos
glpi_peripherals          → Periféricos
glpi_networkequipments    → Equipos de red
glpi_softwares            → Software
glpi_consumableitems      → Consumibles
glpi_users                → Usuarios de GLPI
glpi_entities             → Entidades organizacionales
glpi_states               → Estados de activos
glpi_locations            → Ubicaciones físicas
glpi_manufacturers        → Fabricantes
glpi_*types               → Tipos de cada categoría de activo
glpi_*models              → Modelos de cada categoría de activo
```

### 11.3 Mapeo de Estados de Ticket

| ID | Estado GLPI | Descripción |
| :---: | :--- | :--- |
| 1 | Nuevo | Ticket recién creado |
| 2 | En curso (asignado) | Asignado a un técnico |
| 3 | En curso (planificado) | Planificado para atención |
| 4 | En espera | Pendiente de acción externa |
| 5 | Resuelto | Solución aplicada |
| 6 | Cerrado | Cerrado por el solicitante o automáticamente |

### 11.4 Mapeo de Urgencias/Prioridades

| ID | Nivel | Descripción |
| :---: | :--- | :--- |
| 1 | Muy baja | Puede esperar |
| 2 | Baja | Baja prioridad |
| 3 | Media | Prioridad normal |
| 4 | Alta | Importante, atención pronta |
| 5 | Muy alta | Urgente, atención inmediata |

---

## 12. Servicios de Inteligencia Artificial

### 12.1 OpenRouter API

**Configuración (.env):**
```ini
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=z-ai/glm-4.5-air:free
```

**config/services.php:**
```php
'openrouter' => [
    'api_key' => env('OPENROUTER_API_KEY'),
    'base_url' => env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
    'model' => env('OPENROUTER_MODEL', 'z-ai/glm-4.5-air:free'),
],
```

### 12.2 Funcionalidades de IA

1. **Chatbot Evarisbot:**
   - Conversación guiada para creación de tickets.
   - Respuestas a preguntas frecuentes.
   - Contexto de la sesión del usuario.

2. **Clasificación Automática:**
   - Análisis del texto del problema reportado.
   - Sugerencia de categoría ITIL apropiada.
   - Mejora de títulos y descripciones.

3. **Mejora de Descripciones:**
   - Reescritura de textos vagos o informales.
   - Extracción de información técnica relevante.
   - Formateo estructurado.

### 12.3 Puter.js (Alternativa Frontend)

El componente Chatbot también integra Puter.js como alternativa del lado del cliente:

```typescript
// En chatbot.tsx
import puter from 'puter.js';

async function sendMessageViaPuter(message: string): Promise<string> {
    const response = await puter.ai.chat(message, {
        model: 'gpt-4o-mini',
        systemPrompt: 'Eres Evarisbot, asistente del Hospital Universitario del Valle...',
    });
    return response.content;
}
```

---

## 13. Sistema de Autenticación

### 13.1 Flujo de Login

```
1. Usuario navega a /login
   └─► AuthLayout + Login.tsx

2. Usuario envía credenciales (username + password)
   └─► POST /login (Fortify)
   
3. Fortify valida credenciales
   ├─► Si correcto → Crear sesión → Redirect a /dashboard
   └─► Si incorrecto → Error 422 → Mostrar mensaje

4. Si 2FA está habilitado
   └─► Redirect a /two-factor-challenge
   └─► Usuario ingresa código TOTP
   └─► Fortify valida → Sesión completada
```

### 13.2 Configuración de Fortify

**config/fortify.php:**
```php
return [
    'guard' => 'web',
    'passwords' => 'users',
    'username' => 'username', // Usar username en lugar de email
    'email' => 'email',
    'home' => '/dashboard',
    'prefix' => '',
    'domain' => null,
    'middleware' => ['web'],
    'limiters' => [
        'login' => 'login',
        'two-factor' => 'two-factor',
    ],
    'features' => [
        Features::registration(),
        Features::resetPasswords(),
        Features::emailVerification(),
        Features::updateProfileInformation(),
        Features::updatePasswords(),
        Features::twoFactorAuthentication([
            'confirm' => true,
            'confirmPassword' => true,
        ]),
    ],
];
```

### 13.3 Two-Factor Authentication

La implementación de 2FA usa el trait `TwoFactorAuthenticatable` de Fortify:

1. Usuario activa 2FA en Configuración → Seguridad.
2. Se genera un secreto TOTP y se muestra código QR.
3. Usuario escanea con app (Google Authenticator, Authy, etc.).
4. Usuario confirma ingresando código.
5. En futuros logins, después de username/password, se solicita código TOTP.

---

## 14. Sistema de Notificaciones

### 14.1 Tipos de Notificaciones

| Tipo | Trigger | Destinatarios |
| :--- | :--- | :--- |
| `nuevo_ticket` | Ticket creado | Técnicos y Administradores |
| `ticket_asignado` | Ticket asignado a técnico | Técnico asignado |
| `ticket_resuelto` | Ticket resuelto | Solicitante |
| `ticket_cerrado` | Ticket cerrado | Solicitante y Técnico |
| `comentario_ticket` | Nuevo comentario en ticket | Participantes del ticket |
| `urgente` | Ticket marcado como urgente | Técnicos y Administradores |

### 14.2 Componente NotificationDropdown

El componente `notification-dropdown.tsx` muestra un ícono de campana con contador de no leídas:

```typescript
export function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Polling cada 30 segundos
        const interval = setInterval(fetchNotifications, 30000);
        fetchNotifications();
        return () => clearInterval(interval);
    }, []);

    async function fetchNotifications() {
        const response = await fetch(route('notificaciones.obtener'));
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
    }

    // Render dropdown con lista de notificaciones...
}
```

---

## 15. Exportación de Datos

### 15.1 Librería PhpSpreadsheet

El sistema usa PhpSpreadsheet para generar archivos Excel con estilos profesionales:

```php
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

public function exportExcel()
{
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    
    // Configurar metadatos
    $spreadsheet->getProperties()
        ->setCreator('HelpDesk HUV')
        ->setTitle('Inventario de Computadores')
        ->setSubject('Exportación de Inventario');
    
    // Encabezados
    $headers = ['ID', 'Nombre', 'Serial', 'Estado', 'Ubicación', 'Tipo', 'Modelo', 'Fabricante'];
    $sheet->fromArray($headers, null, 'A1');
    $sheet->getStyle('A1:H1')->applyFromArray($this->getHeaderStyle());
    
    // Datos
    $computers = Computer::with(['state', 'location', 'type', 'model', 'manufacturer'])
        ->active()
        ->get();
    
    $row = 2;
    foreach ($computers as $computer) {
        $sheet->fromArray([
            $computer->id,
            $computer->name,
            $computer->serial,
            $computer->state?->name ?? 'N/A',
            $computer->location?->name ?? 'N/A',
            $computer->type?->name ?? 'N/A',
            $computer->model?->name ?? 'N/A',
            $computer->manufacturer?->name ?? 'N/A',
        ], null, "A{$row}");
        
        // Alternar colores de filas
        if ($row % 2 === 0) {
            $sheet->getStyle("A{$row}:H{$row}")->applyFromArray($this->getAlternateRowStyle());
        }
        
        $row++;
    }
    
    // Auto-ajustar columnas
    foreach (range('A', 'H') as $col) {
        $sheet->getColumnDimension($col)->setAutoSize(true);
    }
    
    // Generar respuesta
    $writer = new Xlsx($spreadsheet);
    $filename = 'computadores_' . date('Ymd_His') . '.xlsx';
    
    return response()->streamDownload(function () use ($writer) {
        $writer->save('php://output');
    }, $filename, [
        'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]);
}
```

---

## 16. Sistema de Plantillas

### 16.1 Modelo Template

**Tabla:** `templates`

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | bigint | PK auto-incremental |
| name | string | Nombre de la plantilla |
| category | string | Categoría (respuesta, solución, etc.) |
| content | text | Contenido de la plantilla |
| is_active | boolean | Si está activa |
| created_by | bigint | FK a users |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de modificación |

**Nota:** Esta funcionalidad está planificada para futuras versiones.

---

## 17. Testing y Calidad

### 17.1 Framework de Testing: Pest

El proyecto usa Pest PHP para testing, con la siguiente estructura:

```
tests/
├── Pest.php             # Configuración global de Pest
├── TestCase.php         # Clase base de tests
├── Feature/
│   ├── Auth/
│   │   ├── LoginTest.php
│   │   ├── RegistrationTest.php
│   │   └── PasswordResetTest.php
│   ├── Dashboard/
│   │   └── DashboardTest.php
│   ├── Inventory/
│   │   ├── ComputerTest.php
│   │   ├── MonitorTest.php
│   │   └── ...
│   └── Tickets/
│       └── TicketTest.php
└── Unit/
    ├── Models/
    │   └── UserTest.php
    └── Services/
        └── ...
```

### 17.2 Ejecutar Tests

```bash
# Ejecutar todos los tests
$ php artisan test

# Ejecutar con cobertura
$ php artisan test --coverage

# Ejecutar tests específicos
$ php artisan test --filter=LoginTest

# Usando Pest directamente
$ ./vendor/bin/pest
```

### 17.3 Ejemplo de Test

```php
// tests/Feature/Auth/LoginTest.php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('login page can be rendered', function () {
    $response = $this->get('/login');
    $response->assertStatus(200);
});

test('users can authenticate using username', function () {
    $user = User::factory()->create([
        'username' => 'testuser',
        'password' => bcrypt('password123'),
    ]);

    $response = $this->post('/login', [
        'username' => 'testuser',
        'password' => 'password123',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect('/dashboard');
});

test('users cannot authenticate with invalid password', function () {
    $user = User::factory()->create([
        'username' => 'testuser',
    ]);

    $this->post('/login', [
        'username' => 'testuser',
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});
```

---

## 18. Rendimiento y Optimización

### 18.1 Optimizaciones de Laravel

```bash
# Cachear configuración
$ php artisan config:cache

# Cachear rutas
$ php artisan route:cache

# Cachear vistas
$ php artisan view:cache

# Optimización completa
$ php artisan optimize
```

### 18.2 Índices de Base de Datos

El sistema crea índices adicionales en tablas GLPI para mejorar consultas frecuentes:

```sql
-- Índices en glpi_tickets
CREATE INDEX idx_tickets_status_date ON glpi_tickets(status, date);
CREATE INDEX idx_tickets_category ON glpi_tickets(itilcategories_id);
CREATE INDEX idx_tickets_entity ON glpi_tickets(entities_id);

-- Índices en tablas de inventario
CREATE INDEX idx_computers_active ON glpi_computers(is_deleted, is_template);
CREATE INDEX idx_computers_state ON glpi_computers(states_id);
CREATE INDEX idx_computers_location ON glpi_computers(locations_id);
```

### 18.3 Optimizaciones de Frontend

- **Code Splitting:** Vite divide automáticamente el código por rutas.
- **Tree Shaking:** Eliminación de código muerto en producción.
- **Cache Busting:** Hashes en nombres de archivos para actualización de caché.
- **Lazy Loading:** Componentes pesados se cargan bajo demanda.

---

## 19. API Reference

### 19.1 Endpoints Principales

| Método | Endpoint | Descripción | Autenticación |
| :--- | :--- | :--- | :---: |
| GET | `/dashboard` | Dashboard principal | ✅ |
| GET | `/soporte/tickets` | Lista de tickets | ✅ |
| POST | `/soporte/tickets` | Crear ticket | ✅ |
| GET | `/soporte/tickets/{id}` | Ver ticket | ✅ |
| PUT | `/soporte/tickets/{id}` | Actualizar ticket | ✅ |
| DELETE | `/soporte/tickets/{id}` | Eliminar ticket | ✅ |
| GET | `/inventario/computadores` | Lista computadores | ✅ |
| POST | `/chatbot/message` | Mensaje al chatbot | ✅ |
| GET | `/reporte-publico` | Formulario público | ❌ |
| POST | `/reporte-publico/crear` | Crear ticket público | ❌ |

### 19.2 Formato de Respuesta Inertia

Todas las respuestas son manejadas por Inertia.js:

```json
{
  "component": "soporte/tickets/index",
  "props": {
    "tickets": {
      "data": [...],
      "current_page": 1,
      "last_page": 5,
      "per_page": 15,
      "total": 73
    },
    "filters": {
      "search": null,
      "status": null
    }
  },
  "url": "/soporte/tickets",
  "version": "abc123"
}
```

---

## 20. Guía de Desarrollo

### 20.1 Configuración del Entorno de Desarrollo

```bash
# Clonar repositorio
$ git clone https://repo.huv.gov.co/innovacion/helpdesk.git
$ cd helpdesk

# Instalar dependencias PHP
$ composer install

# Instalar dependencias JavaScript
$ npm install

# Copiar archivo de entorno
$ cp .env.example .env

# Generar clave de aplicación
$ php artisan key:generate

# Configurar base de datos en .env
# (Apuntar a una base de datos GLPI de desarrollo)

# Ejecutar migraciones
$ php artisan migrate

# Crear enlace simbólico de storage
$ php artisan storage:link

# Compilar assets en modo desarrollo
$ npm run dev

# Iniciar servidor de desarrollo (en otra terminal)
$ php artisan serve
```

### 20.2 Convenciones de Código

**PHP (Laravel):**
- Usar PSR-12 para estilo de código.
- Ejecutar `./vendor/bin/pint` antes de commits.
- Nombres de métodos en camelCase.
- Nombres de clases en PascalCase.

**TypeScript/React:**
- Usar ESLint con configuración del proyecto.
- Componentes como funciones (no clases).
- Props tipadas con interfaces.
- Hooks personalizados prefijados con `use`.

### 20.3 Flujo de Git

```
main          ← Producción estable
  └── develop ← Desarrollo activo
       ├── feature/nombre-feature
       ├── bugfix/nombre-bug
       └── hotfix/nombre-hotfix
```

---

## 21. Troubleshooting Técnico

### 21.1 Depuración de Laravel

```php
// En cualquier punto del código
dd($variable);  // Dump and die
dump($variable);  // Solo dump
logger()->info('Mensaje de debug', ['data' => $data]);

// En Tinker
$ php artisan tinker
>>> User::find(1)->toArray();
>>> DB::table('glpi_tickets')->count();
```

### 21.2 Depuración de React

```typescript
// Console logging
console.log('Props recibidas:', props);

// React DevTools (extensión de navegador)
// Inspeccionar estado y props de componentes

// Inertia debugging
import { usePage } from '@inertiajs/react';
const { props } = usePage();
console.log('Todas las props de Inertia:', props);
```

### 21.3 Queries de Base de Datos

```php
// Habilitar query log
DB::enableQueryLog();

// Ejecutar consultas...

// Ver queries ejecutadas
dd(DB::getQueryLog());

// O usar Laravel Telescope (si está instalado)
```

---

## 22. Extensibilidad y Futuras Mejoras

### 22.1 Funcionalidades Planificadas

| Funcionalidad | Prioridad | Estado |
| :--- | :---: | :--- |
| Base de Conocimiento | Alta | En Desarrollo |
| Sistema de Plantillas de Respuesta | Alta | En Desarrollo |
| Reportes Avanzados con Gráficos | Media | Planificado |
| Integración con Active Directory/LDAP | Media | Planificado |
| Aplicación Móvil (PWA) | Baja | Planificado |
| WebSockets para Notificaciones en Tiempo Real | Media | Planificado |
| Sistema de Reservación de Equipos | Baja | Planificado |
| Gestión de Proyectos | Baja | Planificado |

### 22.2 Extensión de Modelos

Para agregar un nuevo tipo de activo al inventario:

1. Crear modelo en `app/Models/NuevoActivo.php`.
2. Configurar tabla GLPI correspondiente.
3. Crear controlador `NuevoActivoController.php`.
4. Agregar rutas en `routes/web.php`.
5. Crear páginas React en `resources/js/pages/inventario/nuevo-activo/`.
6. Agregar enlace en el sidebar.

### 22.3 Extensión del Chatbot

Para agregar nuevas capacidades al chatbot:

1. Modificar el system prompt en `ChatbotController@message`.
2. Crear nuevos métodos para funcionalidades específicas.
3. Actualizar el componente `chatbot.tsx` para manejar nuevos tipos de respuesta.

---

**Hospital Universitario del Valle "Evaristo García" E.S.E.**
Departamento de Innovación y Desarrollo
Cali, Valle del Cauca — Colombia
Febrero de 2026

---

*Fin de la Documentación Técnica — HelpDesk HUV v1.0.0*
