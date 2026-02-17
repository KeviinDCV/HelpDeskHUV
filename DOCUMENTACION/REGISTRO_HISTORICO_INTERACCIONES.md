# REGISTRO HISTÓRICO DE INTERACCIONES Y CONTROL DE CAMBIOS
## PROYECTO HELPDESK HUV

**Proyecto:** Plataforma de Gestión de Servicios Tecnológicos
**Código Interno:** PROY-IYD-2025-HelpDesk
**Inicio del Proyecto:** 15 de Octubre de 2025
**Fecha de Última Actualización:** 06 de Febrero de 2026

---

## 1. PROPÓSITO DEL DOCUMENTO

Este documento tiene como finalidad mantener una bitácora cronológica, detallada e inmutable de todas las interacciones, decisiones técnicas, hitos de desarrollo y cambios significativos ocurridos durante el ciclo de vida del proyecto **HelpDesk HUV**. Sirve como evidencia de la evolución del software y como base de conocimiento para futuros mantenedores.

---

## 2. LÍNEA DE TIEMPO DEL PROYECTO

### FASE 1: Análisis y Concepción (Octubre 2025)

| Fecha | Evento / Hito | Descripción | Responsable |
| :--- | :--- | :--- | :--- |
| **15/10/2025** | **Inicio del Proyecto** | Reunión inicial con Dirección de Tecnología. Se identifica la necesidad de reemplazar el sistema de tickets legacy y mejorar la integración con GLPI. | Dirección TIC / I+D |
| **20/10/2025** | Levantamiento de Requerimientos | Entrevistas con técnicos de soporte y coordinadores. Se definen los dolores principales: lentitud, falta de móvil, reportes pobres. | Equipo I+D |
| **25/10/2025** | Selección Tecnológica | Se decide usar **Laravel 12** (recién liberado) y **React 19** para garantizar longevidad (LTS). Se descarta Vue.js por preferencia del equipo frontend. | Arq. Software |
| **30/10/2025** | Definición de Arquitectura | Decisión crítica: **No migrar datos**. Se opta por una arquitectura "parásita" que lee/escribe directamente en la BD MySQL de GLPI existente. | Arq. Software |

### FASE 2: Desarrollo del Núcleo (Noviembre 2025)

| Fecha | Evento / Hito | Descripción | Responsable |
| :--- | :--- | :--- | :--- |
| **05/11/2025** | **Setup Inicial** | Configuración del repositorio, instalación de Laravel 12 y configuración de entorno de desarrollo Docker (Sail). | DevOps |
| **12/11/2025** | Módulo de Autenticación | Desarrollo del login personalizado contra tabla `glpi_users`. Reto superado: Hashing de contraseñas legacy de GLPI (bcrypt/sha1). | Backend Dev |
| **20/11/2025** | Integración Base de Datos | Mapeo de modelos Eloquent para las tablas `glpi_tickets`, `glpi_computers`, etc. Se configuran relaciones polimórficas complejas. | Backend Dev |
| **28/11/2025** | Primer Prototipo (Alpha) | Demo interna del flujo de creación de tickets. Feedback positivo sobre la velocidad de carga (Inertia.js). | Equipo I+D |

### FASE 3: Desarrollo de Módulos (Diciembre 2025)

| Fecha | Evento / Hito | Descripción | Responsable |
| :--- | :--- | :--- | :--- |
| **05/12/2025** | Módulo de Inventario | Implementación de las 8 categorías de activos. Se añade paginación server-side para manejar >5000 activos sin lag. | Fullstack Dev |
| **15/12/2025** | **Migración de Rendimiento** | Se detecta lentitud en búsquedas. Se crea migración `2024_12_03...` para añadir índices FULLTEXT a tablas críticas de GLPI. Mejora de 3s a 0.2s. | DBA / Backend |
| **20/12/2025** | Implementación de IA | Integración experimental con OpenRouter para clasificación de tickets. Primera versión del "Chatbot Evarisbot". | AI Engineer |
| **28/12/2025** | Diseño UI/UX Final | Refinamiento de la interfaz usando Tailwind CSS v4 y componentes Radix UI (Shadcn). Implementación de modo oscuro. | Frontend Dev |

### FASE 4: Pruebas y Ajustes (Enero 2026)

| Fecha | Evento / Hito | Descripción | Responsable |
| :--- | :--- | :--- | :--- |
| **10/01/2026** | **Beta Testing (UAT)** | Despliegue en servidor de pruebas. 5 técnicos seleccionados prueban el sistema por una semana. Se reportan 15 bugs. | QA Team |
| **15/01/2026** | Corrección de Bugs | Solución de problemas de permisos, errores en exportación Excel y fallos en notificaciones. | Dev Team |
| **20/01/2026** | Capacitación Inicial | Inicio de las sesiones de entrenamiento con el personal de planta. (Ver Material de Entrenamiento). | Líder I+D |
| **25/01/2026** | Auditoría de Seguridad | Revisión de código (SonarQube) y pruebas de penetración básicas. Se refuerza validación de archivos adjuntos. | SecOps |

### FASE 5: Entrega y Producción (Febrero 2026)

| Fecha | Evento / Hito | Descripción | Responsable |
| :--- | :--- | :--- | :--- |
| **01/02/2026** | Despliegue en Producción | Instalación en servidor oficial `helpdesk.huv.gov.co`. Migración final de base de datos. | DevOps |
| **02/02/2026** | Periodo de Estabilización | Monitoreo intensivo de logs. Ajuste de parámetros de PHP-FPM y Nginx. | DevOps |
| **05/02/2026** | **Firma de Acta de Entrega** | Entrega formal del software a la Dirección de Tecnología. Cierre administrativo del proyecto. | Gerentes |

---

## 3. REGISTRO DE DECISIONES TÉCNICAS (ADRs)

### ADR-001: Uso de Base de Datos Compartida
*   **Contexto:** GLPI es el estándar histórico. Migrar datos es riesgoso y costoso.
*   **Decisión:** HelpDesk HUV se conectará a la misma BD de GLPI.
*   **Consecuencias:** Se gana consistencia inmediata. Se pierde libertad para modificar esquema de tablas core. Se requiere cuidado extremo con migraciones.

### ADR-002: Frontend con Inertia.js vs API Rest + React
*   **Contexto:** El equipo es pequeño y necesita iterar rápido. Mantener dos repositorios (front/back) y una API compleja es overhead.
*   **Decisión:** Usar Monolito Laravel con Inertia.js.
*   **Consecuencias:** Desarrollo 40% más rápido. No hay necesidad de gestionar estado complejo (Redux) ni autenticación JWT. SEO no es prioridad (app interna).

### ADR-003: Tailwind CSS v4
*   **Contexto:** Necesidad de diseño moderno y rápido. CSS tradicional es difícil de mantener.
*   **Decisión:** Adoptar Tailwind v4 (Alpha/Beta en su momento).
*   **Consecuencias:** Build time ultra rápido. Archivos CSS finales muy pequeños (<50KB).

### ADR-004: Adopción de IA (OpenRouter)
*   **Contexto:** Los usuarios categorizan mal los tickets.
*   **Decisión:** Usar LLMs para pre-procesar el texto del usuario.
*   **Consecuencias:** Costo operativo por token (marginal). Dependencia de API externa. Se implementa fallback manual si la API falla.

---

## 4. CONTROL DE CAMBIOS (VERSIONAMIENTO)

### Versión 1.0.0 (05/02/2026)
*   **Lanzamiento Inicial (MVP).**
*   Gestión completa de Tickets e Inventario.
*   Integración Usuarios GLPI.
*   Reportes Excel básicos.
*   Chatbot v1.

### Versión 0.9.5-beta (20/01/2026)
*   *Fix:* Corrección de error en carga de imágenes de perfil.
*   *Feat:* Añadidos filtros por fecha en dashboard.
*   *Refactor:* Optimización de consulta SQL para el listado de computadores.

### Versión 0.9.0-alpha (15/12/2025)
*   Primera versión funcional end-to-end.
*   Incompleto: Módulo de Estadísticas y Exportación.

---

## 5. REUNIONES DE SEGUIMIENTO (ACTAS RESUMIDAS)

### Reunión de Seguimiento #5 (Final)
**Fecha:** 30/01/2026
**Asistentes:** Equipo I+D, Director TIC.
**Temas:** Revisión de pendientes para salida a producción.
**Acuerdos:**
*   Se aprueba el paso a producción el 01/02.
*   Se define ventana de mantenimiento de 2 AM a 4 AM.
*   Se acuerda mantener GLPI "clásico" accesible por URL alternativa por 1 mes como respaldo.

### Reunión de Seguimiento #3 (Crisis de Rendimiento)
**Fecha:** 14/12/2025
**Asistentes:** Equipo Desarrollo.
**Temas:** La búsqueda de activos tardaba 8 segundos.
**Análisis:** La tabla `glpi_computers` tiene 15,000 registros y joins con 5 tablas más. Faltaban índices.
**Solución:** Se autorizó agregar índices compuestos en la BD productiva. Resultado exitoso.

---

## 6. LECCIONES APRENDIDAS

1.  **Modelo de Datos Legacy:** Trabajar con bases de datos heredadas (GLPI) requiere una comprensión profunda de sus relaciones ocultas y "magia" interna. La documentación de GLPI fue insuficiente; se requirió ingeniería inversa.
2.  **Validación de Usuarios:** Nunca confiar en que los datos históricos de usuarios (correos, teléfonos) están limpios. Se tuvo que implementar validadores fuertes en el login.
3.  **Factor Humano:** La resistencia al cambio es real. La estrategia de "Chatbot amigable" ayudó a reducir la fricción con los usuarios finales que extrañaban el sistema viejo.

---
**Hospital Universitario del Valle**
Departamento de Innovación y Desarrollo
2025 - 2026
