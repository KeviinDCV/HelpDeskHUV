# INNOVACIÓN Y DESARROLLO - HOSPITAL UNIVERSITARIO DEL VALLE
## HELPDESK HUV

---

# ACTA DE ENTREGA DE SOFTWARE

**Número de Acta:** HUV-IYD-AE-2026-001
**Ciudad y Fecha:** Santiago de Cali, Valle del Cauca — 05 de Febrero de 2026
**Proyecto:** Plataforma Web de Gestión y Soporte Tecnológico (HelpDesk HUV)
**Área Responsable (Entrega):** Innovación y Desarrollo — Hospital Universitario del Valle
**Modalidad de Entrega:** Entrega definitiva en ambiente de producción

---

## TABLA DE CONTENIDO

1. [Objeto del Documento](#1-objeto-del-documento)
2. [Antecedentes y Justificación del Proyecto](#2-antecedentes-y-justificación-del-proyecto)
3. [Marco Normativo y Legal](#3-marco-normativo-y-legal)
4. [Alcance de la Entrega](#4-alcance-de-la-entrega)
5. [Descripción Funcional Detallada del Software](#5-descripción-funcional-detallada-del-software)
6. [Descripción Técnica del Software](#6-descripción-técnica-del-software)
7. [Especificaciones del Ambiente de Producción](#7-especificaciones-del-ambiente-de-producción)
8. [Entregables Digitales y Activos](#8-entregables-digitales-y-activos)
9. [Inventario Detallado de Componentes del Software](#9-inventario-detallado-de-componentes-del-software)
10. [Matriz de Cumplimiento de Requerimientos](#10-matriz-de-cumplimiento-de-requerimientos)
11. [Pruebas Realizadas y Resultados](#11-pruebas-realizadas-y-resultados)
12. [Limitaciones Conocidas y Funcionalidades Pendientes](#12-limitaciones-conocidas-y-funcionalidades-pendientes)
13. [Plan de Transición Operativa](#13-plan-de-transición-operativa)
14. [Garantía y Soporte Post-Entrega](#14-garantía-y-soporte-post-entrega)
15. [Acuerdos de Nivel de Servicio para Soporte](#15-acuerdos-de-nivel-de-servicio-para-soporte)
16. [Capacitación y Transferencia de Conocimiento](#16-capacitación-y-transferencia-de-conocimiento)
17. [Gestión de Riesgos y Contingencias](#17-gestión-de-riesgos-y-contingencias)
18. [Responsabilidades de las Partes](#18-responsabilidades-de-las-partes)
19. [Protección de Datos y Confidencialidad](#19-protección-de-datos-y-confidencialidad)
20. [Formalización](#20-formalización)
21. [Anexos](#21-anexos)

---

## 1. Objeto del Documento

### 1.1 Propósito General

El presente documento tiene como finalidad formalizar la entrega operativa, funcional y documental del software **HelpDesk HUV versión 1.0.0**, desarrollado integralmente por el área de Innovación y Desarrollo del Hospital Universitario del Valle "Evaristo García" E.S.E. para la gestión centralizada de servicios tecnológicos, soporte técnico e inventario de activos informáticos de la institución.

Esta acta constituye el instrumento legal mediante el cual el área de Innovación y Desarrollo transfiere formalmente al área de Dirección de Tecnología / Gestión de Información y TIC la propiedad operativa, el control administrativo y la responsabilidad de mantenimiento del sistema desarrollado, conforme a los estándares de calidad institucionales y las normativas vigentes del sector salud colombiano.

### 1.2 Alcance del Acta

El presente documento abarca de manera integral los siguientes aspectos:

- La entrega formal del código fuente completo de la aplicación, incluyendo componentes de backend (Laravel 12) y frontend (React 19 con TypeScript).
- La transferencia de la documentación técnica exhaustiva del sistema, que incluye manuales de usuario, documentación de arquitectura, guías de configuración y material de capacitación.
- La entrega de credenciales administrativas maestras y parámetros de configuración del ambiente de producción.
- La formalización de los acuerdos de garantía, soporte post-entrega y condiciones de mantenimiento durante el período de estabilización.
- El establecimiento de las responsabilidades de cada una de las partes involucradas para efectos de continuidad operativa.
- La documentación de las pruebas realizadas, sus resultados y los criterios de aceptación aplicados.

### 1.3 Definiciones y Términos

Para efectos de la correcta interpretación del presente documento, se establecen las siguientes definiciones:

| Término | Definición |
| :--- | :--- |
| **HelpDesk HUV** | Plataforma web de gestión de servicios tecnológicos, inventario de activos y mesa de ayuda desarrollada para el Hospital Universitario del Valle. |
| **MVP (Minimum Viable Product)** | Producto Mínimo Viable. Versión del software que contiene las funcionalidades esenciales suficientes para ser funcional en un ambiente productivo. |
| **GLPI** | Gestionnaire Libre de Parc Informatique. Software libre de gestión de activos de TI y mesa de ayuda, cuya base de datos es utilizada como fuente de datos principal por HelpDesk HUV. |
| **SPA (Single Page Application)** | Aplicación de página única. Patrón de arquitectura web donde la navegación se gestiona del lado del cliente sin recargar la página completa. |
| **Inertia.js** | Protocolo de comunicación entre el servidor (Laravel) y el cliente (React) que permite construir aplicaciones SPA sin API REST separada. |
| **ITIL** | Information Technology Infrastructure Library. Marco de mejores prácticas para la gestión de servicios de TI. |
| **CRUD** | Create, Read, Update, Delete. Las operaciones básicas de gestión de datos. |
| **SLA** | Service Level Agreement. Acuerdo de Nivel de Servicio que establece tiempos máximos de respuesta y resolución. |
| **UAT** | User Acceptance Testing. Pruebas de aceptación realizadas por los usuarios finales. |
| **SSR** | Server-Side Rendering. Renderizado del lado del servidor para mejorar rendimiento y SEO. |

---

## 2. Antecedentes y Justificación del Proyecto

### 2.1 Situación Previa

Previo a la implementación de HelpDesk HUV, la gestión de servicios tecnológicos en el Hospital Universitario del Valle se realizaba mediante métodos heterogéneos y descentralizados que presentaban las siguientes deficiencias operativas:

1. **Canales de solicitud fragmentados:** Las solicitudes de soporte técnico se recibían a través de múltiples canales no integrados, incluyendo llamadas telefónicas a extensiones individuales de los técnicos, correos electrónicos dirigidos a cuentas personales, solicitudes verbales en pasillos y oficinas, y formatos físicos en papel que debían ser trasladados manualmente.

2. **Ausencia de trazabilidad:** No existía un registro centralizado y sistematizado que permitiera realizar seguimiento al ciclo de vida de las solicitudes de soporte. Los usuarios desconocían el estado de sus requerimientos y los técnicos no contaban con una cola de trabajo priorizada.

3. **Inventario desactualizado:** El control de activos tecnológicos se realizaba mediante hojas de cálculo manuales que rápidamente quedaban desactualizadas, dificultando la toma de decisiones sobre compras, reemplazos y asignaciones de equipos.

4. **Falta de indicadores de gestión:** La dirección de tecnología no contaba con datos confiables y en tiempo real para evaluar el desempeño del equipo de soporte, identificar tendencias de fallas o planificar presupuestos de renovación tecnológica.

5. **Incumplimiento normativo:** La ausencia de registros sistematizados dificultaba el cumplimiento de los requerimientos de auditoría de la Contraloría General, la Superintendencia Nacional de Salud y otros entes de control que requieren evidencias documentadas sobre la gestión de activos públicos.

### 2.2 Necesidad Identificada

Tras un análisis de necesidades realizado durante el tercer trimestre de 2025, el área de Innovación y Desarrollo identificó la necesidad de desarrollar una plataforma que:

- Centralizara todas las solicitudes de soporte tecnológico en una ventanilla única digital accesible desde cualquier dispositivo conectado a la red institucional.
- Proporcionara trazabilidad completa desde la creación de una solicitud hasta su cierre, con bitácoras de seguimiento inmutables.
- Integrara la gestión de inventario de activos tecnológicos con la mesa de ayuda, permitiendo asociar incidentes a equipos específicos.
- Generara reportes estadísticos y exportaciones de datos para la toma de decisiones gerenciales y el cumplimiento de auditorías.
- Incorporara tecnologías de inteligencia artificial para asistir a los usuarios en el proceso de reporte de incidentes.
- Se integrara con la infraestructura existente de GLPI para reutilizar datos de inventario previamente levantados.
- Proporcionara una experiencia de usuario moderna, rápida y accesible, alineada con las expectativas tecnológicas actuales.

### 2.3 Decisión de Desarrollo Interno

Se determinó que el desarrollo del sistema se realizaría internamente por el área de Innovación y Desarrollo por las siguientes razones estratégicas:

- **Control total sobre el desarrollo:** Permite ajustar las funcionalidades a las necesidades específicas y cambiantes del entorno hospitalario.
- **Integración nativa con GLPI:** El equipo interno tiene conocimiento profundo de la estructura de datos de GLPI, lo que facilita la integración sin dependencia de terceros.
- **Costo-eficiencia:** La inversión se limita al tiempo del equipo de desarrollo interno, sin incurrir en costos de licenciamiento de software de terceros o contratación de consultores externos.
- **Transferencia de conocimiento garantizada:** Al ser un desarrollo interno, el conocimiento técnico permanece dentro de la institución.
- **Propiedad intelectual institucional:** El software generado es propiedad del Hospital Universitario del Valle, sin restricciones de uso, modificación o distribución interna.

---

## 3. Marco Normativo y Legal

### 3.1 Normativas Aplicables

El desarrollo y operación del sistema HelpDesk HUV se enmarca dentro del siguiente cuerpo normativo:

| Norma | Descripción | Aplicación al Proyecto |
| :--- | :--- | :--- |
| **Ley 1581 de 2012** | Régimen General de Protección de Datos Personales (Ley de Habeas Data). | El sistema almacena datos personales de funcionarios (nombres, correos, extensiones, ubicaciones). Se garantiza el tratamiento adecuado conforme a la normativa. |
| **Decreto 1377 de 2013** | Reglamenta parcialmente la Ley 1581 de 2012. | Establece condiciones para la autorización del titular, políticas de tratamiento de datos y procedimientos para el ejercicio de derechos. |
| **Ley 1712 de 2014** | Ley de Transparencia y del Derecho de Acceso a la Información Pública Nacional. | El sistema como herramienta de gestión pública debe garantizar la transparencia en la gestión de los activos y servicios tecnológicos institucionales. |
| **Resolución 1995 de 1999** | Normas sobre manejo de la Historia Clínica. | Aunque HelpDesk HUV no gestiona historias clínicas, su infraestructura soporta equipos que sí las procesan, por lo que su disponibilidad es crítica para el cumplimiento de esta resolución. |
| **Ley 1273 de 2009** | Ley de Delitos Informáticos. | Establece el marco penal para accesos abusivos a sistemas informáticos. El sistema implementa controles de autenticación y autorización por roles para prevenir accesos no autorizados. |
| **ISO/IEC 27001:2022** | Sistema de Gestión de Seguridad de la Información. | El sistema aplica controles de seguridad alineados con este estándar: encriptación de contraseñas, protección CSRF/XSS, control de acceso basado en roles, y registros de auditoría. |
| **ITIL v4** | Marco de mejores prácticas para gestión de servicios de TI. | El diseño del módulo de Mesa de Ayuda sigue los procesos de Gestión de Incidentes y Gestión de Activos de ITIL. |
| **NTC-ISO 9001:2015** | Sistema de Gestión de Calidad. | La documentación del sistema y sus procesos estandarizados contribuyen al cumplimiento de los requisitos del sistema de gestión de calidad del Hospital. |
| **MIPG** | Modelo Integrado de Planeación y Gestión. | El sistema contribuye a la dimensión de Gestión con Valores para Resultados, específicamente en la política de Gobierno Digital. |

### 3.2 Cumplimiento de Protección de Datos

El sistema HelpDesk HUV implementa las siguientes medidas para garantizar el cumplimiento de la Ley 1581 de 2012:

- **Principio de finalidad:** Los datos personales recopilados se utilizan exclusivamente para la gestión de servicios tecnológicos y el soporte técnico.
- **Principio de necesidad:** Solo se recopilan los datos estrictamente necesarios para la operación del sistema (nombre, correo institucional, extensión, ubicación laboral).
- **Principio de confidencialidad:** Las contraseñas se almacenan mediante hash criptográfico (bcrypt) y los datos se transmiten sobre conexiones seguras.
- **Principio de acceso restringido:** El acceso a la información está controlado mediante un sistema de roles (Administrador, Técnico, Usuario) con permisos diferenciados.
- **Derecho de acceso:** Los usuarios pueden consultar sus propios datos a través del módulo de perfil.
- **Tratamiento automatizado:** El sistema utiliza inteligencia artificial para clasificar y mejorar las descripciones de los tickets, pero esta información no se comparte con terceros externos al Hospital.

---

## 4. Alcance de la Entrega

### 4.1 Definición General

El software se entrega en condición de **"Producto Terminado" (MVP — Producto Mínimo Viable completo)**, cubriendo la totalidad de los requerimientos funcionales aprobados durante la fase de análisis y diseño del proyecto. El sistema se encuentra desplegado y operativo en el ambiente de producción del Hospital.

### 4.2 Módulos Funcionales Entregados

El sistema HelpDesk HUV se compone de los siguientes módulos funcionales verificados y operativos:

#### 4.2.1 Módulo de Autenticación y Seguridad
- Autenticación de usuarios validada contra la base de datos institucional del sistema GLPI, con soporte para inicio de sesión por nombre de usuario.
- Gestión de roles y permisos con tres niveles: Administrador, Técnico y Usuario, cada uno con permisos diferenciados de lectura, escritura y operación.
- Protección de rutas mediante middleware de autenticación y verificación de roles.
- Soporte para Autenticación de Dos Factores (2FA) mediante códigos TOTP (Time-based One-Time Password) con códigos de recuperación.
- Funcionalidad de restablecimiento de contraseña mediante correo electrónico institucional.
- Mecanismo de confirmación de contraseña para operaciones sensibles.
- Protección contra ataques CSRF (Cross-Site Request Forgery) y XSS (Cross-Site Scripting).
- Limitación de tasa de intentos de inicio de sesión (5 intentos por minuto) para prevención de ataques de fuerza bruta.
- Headers de seguridad HTTP implementados (`X-Content-Type-Options`, `X-Frame-Options`).
- Gestión segura de sesiones con cookies protegidas.

#### 4.2.2 Módulo de Inventario de Activos Tecnológicos
Gestión CRUD completa (Crear, Leer, Actualizar, Eliminar) con capacidades de búsqueda, filtrado, paginación y exportación a Excel para las siguientes categorías de activos:

| # | Categoría | Tabla GLPI Principal | Campos Clave |
| :---: | :--- | :--- | :--- |
| 1 | Computadores y Portátiles | `glpi_computers` | Nombre, Serial, Tipo, Modelo, Fabricante, Estado, Ubicación, Componentes |
| 2 | Monitores y Pantallas | `glpi_monitors` | Nombre, Serial, Tamaño, Tipo, Modelo, Estado |
| 3 | Impresoras y Escáneres | `glpi_printers` | Nombre, Serial, Tipo (Láser/Térmica/Inyección), Modelo, Estado |
| 4 | Equipos de Red | `glpi_networkequipments` | Nombre, Serial, Tipo (Switch/Router/AP), Modelo, Estado |
| 5 | Periféricos | `glpi_peripherals` | Nombre, Serial, Tipo, Modelo, Estado |
| 6 | Software y Licencias | `glpi_softwares` | Nombre, Fabricante, Versiones, Instalaciones, Licencias |
| 7 | Consumibles e Insumos | `glpi_consumableitems` | Nombre, Referencia, Tipo, Estado, Responsable |
| 8 | Teléfonos | `glpi_phones` | Nombre, Serial, Tipo, Modelo, Estado |

Funcionalidades transversales de inventario:
- **Vista Global Consolidada:** Consulta unificada de todos los activos mediante un UNION ALL de todas las tablas, con filtros por tipo y estado.
- **Hoja de Vida del Equipo:** Vista detallada que incluye información del activo, componentes conectados (monitores, software, periféricos), tickets asociados e historial de cambios extraído de `glpi_logs`.
- **Exportación a Excel:** Generación de archivos .xlsx con formato profesional (encabezados estilizados, filas alternadas, ajuste automático de columnas) para reportes de auditoría e inventario.
- **Soft Delete:** Eliminación lógica (campo `is_deleted`) para mantener la integridad referencial con el sistema GLPI nativo.

#### 4.2.3 Módulo de Mesa de Ayuda (Sistema de Tickets)

El módulo de Mesa de Ayuda implementa un flujo de atención completo basado en las mejores prácticas ITIL:

- **Creación de Tickets:**
  - Formulario detallado con campos de título, descripción, tipo, categoría jerárquica (con relaciones padre-hijo), urgencia, impacto y ubicación.
  - Soporte para asociación de activos (computadores, monitores, impresoras, teléfonos, periféricos, equipos de red) al ticket.
  - Sistema de adjuntos para evidencias fotográficas y documentos.
  - Asignación de solicitante, técnicos responsables y observadores.
  - Notificaciones automáticas a los técnicos asignados.

- **Flujo de Atención:**
  - Estado Nuevo → Asignado → En curso → En espera → Resuelto → Cerrado.
  - Asignación manual por el administrador o auto-asignación ("tomar caso") por el técnico.
  - Registro de soluciones con documentación de la causa raíz.
  - Soporte para fechas de resolución personalizadas.

- **Vista de Tickets:**
  - Listado completo con paginación, ordenamiento multi-columna y búsqueda global.
  - Filtros avanzados por estado, prioridad, categoría, técnico asignado, rango de fechas.
  - Filtros especiales: "Sin asignar", "Mis casos", "Mis pendientes", "Mis resueltos".
  - Detalle completo del ticket con seguimiento de actividad, documentos adjuntos, equipos asociados y bitácora de cambios.
  - Exportación a Excel con todos los filtros aplicados.

- **Dashboard en Tiempo Real:**
  - Widgets de estadísticas: tickets sin asignar (públicos), mis tickets asignados, mis pendientes, mis resueltos.
  - Actualización periódica mediante polling para reflejar cambios en tiempo real.
  - Vista rápida de detalle de ticket sin navegar a otra página.
  - Panel de asignación rápida para administradores.

#### 4.2.4 Módulo de Reportes Público (Tickets sin Autenticación)

- Formulario público accesible sin necesidad de iniciar sesión, diseñado para que cualquier funcionario pueda reportar un incidente tecnológico desde cualquier dispositivo.
- **Integración con Inteligencia Artificial (OpenRouter API):**
  - Análisis automático de la descripción del problema para sugerir la categoría ITIL más apropiada.
  - Mejoramiento automático del título y la descripción del ticket para garantizar claridad y completitud.
  - Identificación automática del tipo de dispositivo afectado a partir del contexto del reporte.
- Búsqueda automática de la ubicación del reportante a partir del nombre del servicio.
- Vinculación automática de equipos GLPI al ticket mediante el código ECOM (nombre del equipo).

#### 4.2.5 Módulo de Inteligencia Artificial (Chatbot Evarisbot)

- Asistente virtual (Chatbot) denominado **"Evarisbot"** desplegado en la interfaz pública para consultas de primer nivel.
- Guía interactiva que asiste al usuario paso a paso en la creación de un ticket, extrayendo datos clave: nombre del reportante, cargo, servicio, extensión, descripción del problema, ECOM y categoría.
- Integración dual: OpenRouter API (modelo `z-ai/glm-4.5-air:free`) y Puter.js (modelo `openai/gpt-4o-mini`).
- Capacidad para recomendar acciones de solución básica antes de la creación de un ticket.
- Parseo inteligente de respuestas de IA para extraer campos de formulario automáticamente.

#### 4.2.6 Módulo de Estadísticas y Analítica

- Dashboard estadístico con resumen de indicadores de gestión.
- Análisis por múltiples dimensiones: estado de tickets, prioridad, técnico asignado, categoría ITIL y tendencia mensual (últimos 12 meses).
- Filtros avanzados por rango de fechas, estado, prioridad, técnico y categoría.
- Sistema de caché inteligente (180 segundos sin filtros, 60 segundos con filtros) para optimización de rendimiento.
- Exportación de reportes a Excel en dos modalidades:
  - **Reporte General:** Resumen ejecutivo con métricas agregadas.
  - **Reporte Detallado:** Listado completo de casos con todos los campos.

#### 4.2.7 Módulo de Administración de Usuarios

- Listado de usuarios con paginación, búsqueda, filtros por rol y estado.
- Creación de nuevos usuarios con validación de unicidad (nombre de usuario y correo).
- Edición de usuarios (nombre, correo, rol, contraseña).
- Activación y desactivación de cuentas (soft toggle).
- Exportación de directorio de usuarios a Excel.
- Comando Artisan de importación masiva de usuarios desde la tabla `glpi_users`.

#### 4.2.8 Módulo de Notificaciones

- Sistema de notificaciones en tiempo real integrado en la interfaz de usuario.
- Ocho (8) tipos de notificación: asignación de ticket, comentario, resolución, cierre, ticket urgente, cambio de estado, recordatorio y bienvenida.
- Indicador visual (badge) de notificaciones no leídas en el header de la aplicación.
- Funcionalidades de marcar como leída, marcar todas como leídas, eliminar individual y eliminar todas las leídas.

#### 4.2.9 Módulo de Búsqueda Global

- Motor de búsqueda unificado accesible desde cualquier página de la aplicación.
- Busca simultáneamente en: tickets, computadores, monitores, impresoras, usuarios, teléfonos, equipos de red y periféricos.
- Devuelve hasta 15 resultados categorizados con enlace directo al recurso encontrado.

#### 4.2.10 Módulo de Configuración Personal

- Gestión de perfil (nombre, correo, teléfono, foto de perfil con recorte y subida).
- Cambio de contraseña con verificación de contraseña actual.
- Configuración de Autenticación de Dos Factores (2FA) con QR y códigos de respaldo.
- Preferencias de apariencia (modo claro, modo oscuro, tema del sistema).

---

## 5. Descripción Funcional Detallada del Software

### 5.1 Flujo de Trabajo Principal: Gestión de Incidentes

El siguiente flujo describe el proceso estándar de atención de un incidente tecnológico a través de HelpDesk HUV:

```
┌─────────────────┐
│  1. DETECCIÓN    │  El usuario identifica un problema tecnológico
│     DEL          │  (equipo dañado, software que no funciona,
│     PROBLEMA     │  conectividad perdida, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. REPORTE      │  El usuario accede a HelpDesk HUV y crea un
│     DEL          │  ticket describiendo el problema, seleccionando
│     INCIDENTE    │  la categoría, urgencia y ubicación.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. CLASIFICACIÓN│  El sistema (o la IA en reportes públicos)
│     Y            │  clasifica automáticamente el ticket. Un
│     ASIGNACIÓN   │  administrador o el propio técnico lo toma.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. DIAGNÓSTICO  │  El técnico asignado analiza el problema,
│     Y            │  realiza visita en sitio si es necesario,
│     ATENCIÓN     │  documenta hallazgos en la bitácora.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. RESOLUCIÓN   │  El técnico aplica la solución, documenta
│     Y            │  la causa raíz y las acciones realizadas.
│     CIERRE       │  El ticket se marca como Cerrado.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. VERIFICACIÓN │  El usuario valida que el problema fue
│     Y            │  resuelto satisfactoriamente. El ticket
│     SATISFACCIÓN │  permanece cerrado o se reabre si persiste.
└─────────────────┘
```

### 5.2 Flujo de Trabajo Secundario: Gestión de Inventario

```
┌─────────────────┐
│  1. ADQUISICIÓN  │  Se adquiere un nuevo equipo o software.
│     DEL ACTIVO   │  Se registra en el sistema con todos sus datos.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. REGISTRO     │  El técnico crea el registro en la categoría
│     EN GLPI/     │  correspondiente con serial, modelo, marca,
│     HELPDESK     │  ubicación y usuario responsable.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. ASIGNACIÓN   │  Se asocia el activo a un usuario,
│     Y            │  una ubicación física y un grupo técnico
│     UBICACIÓN    │  de soporte responsable.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. OPERACIÓN    │  El activo se encuentra en uso. Los tickets
│     Y            │  de soporte generados se vinculan al activo,
│     SEGUIMIENTO  │  construyendo su "hoja de vida".
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. DISPOSICIÓN  │  Al final de su vida útil, el activo se
│     FINAL        │  marca como "De Baja" y se genera el
│                  │  reporte para la oficina de recursos físicos.
└─────────────────┘
```

### 5.3 Casos de Uso por Rol

#### 5.3.1 Casos de Uso — Administrador

| ID | Caso de Uso | Descripción |
| :---: | :--- | :--- |
| CU-ADM-01 | Gestionar usuarios | Crear, editar, activar/desactivar cuentas de usuario. Asignar roles. |
| CU-ADM-02 | Asignar tickets | Asignar tickets a técnicos específicos desde el dashboard. |
| CU-ADM-03 | Gestionar inventario | Crear, editar y eliminar registros de activos en todas las categorías. |
| CU-ADM-04 | Consultar estadísticas | Acceder al dashboard de estadísticas con filtros avanzados. |
| CU-ADM-05 | Exportar reportes | Generar reportes en Excel de tickets, inventario y usuarios. |
| CU-ADM-06 | Resolver tickets | Registrar soluciones y cerrar tickets. |
| CU-ADM-07 | Configurar sistema | Acceder a la configuración del sistema y categorías ITIL. |

#### 5.3.2 Casos de Uso — Técnico

| ID | Caso de Uso | Descripción |
| :---: | :--- | :--- |
| CU-TEC-01 | Tomar tickets | Auto-asignarse tickets de la cola pública sin asignar. |
| CU-TEC-02 | Diagnosticar incidentes | Revisar la descripción, documentos adjuntos y activos asociados para determinar la causa del problema. |
| CU-TEC-03 | Documentar seguimiento | Registrar actividades, visitas y hallazgos en la bitácora del ticket. |
| CU-TEC-04 | Resolver tickets | Registrar la solución técnica y cerrar el caso. |
| CU-TEC-05 | Consultar inventario | Buscar y visualizar información de activos tecnológicos. |
| CU-TEC-06 | Crear tickets internos | Registrar incidentes detectados proactivamente durante mantenimientos. |

#### 5.3.3 Casos de Uso — Usuario Final

| ID | Caso de Uso | Descripción |
| :---: | :--- | :--- |
| CU-USR-01 | Reportar incidente | Crear un ticket describiendo el problema tecnológico experimentado. |
| CU-USR-02 | Consultar estado | Verificar el estado de sus tickets abiertos y cerrados. |
| CU-USR-03 | Interactuar en ticket | Responder preguntas del técnico o agregar información adicional. |
| CU-USR-04 | Usar chatbot | Interactuar con el asistente virtual para obtener ayuda inmediata o crear un ticket guiado. |
| CU-USR-05 | Reportar anónimamente | Usar el formulario público sin autenticación para reportar un problema. |

---

## 6. Descripción Técnica del Software

### 6.1 Arquitectura del Sistema

HelpDesk HUV se construye sobre una **arquitectura monolítica moderna** basada en el patrón **MVC (Modelo-Vista-Controlador)**, implementada con Laravel 12 en el backend y React 19 en el frontend, comunicándose a través del protocolo Inertia.js v2.

Esta arquitectura fue seleccionada por las siguientes razones:

- **Simplicidad operativa:** Un único proceso de servidor que es fácil de desplegar y mantener en la infraestructura existente del Hospital.
- **Rendimiento:** Al no requerir una API REST separada y llamadas de red adicionales, la comunicación entre frontend y backend es más eficiente.
- **Seguridad:** Los datos sensibles nunca se exponen a través de endpoints API públicos; todo el flujo de datos está controlado por el middleware de Laravel.
- **Facilidad de desarrollo:** El equipo de desarrollo puede trabajar en ambas capas (frontend y backend) dentro del mismo proyecto sin coordinación de servicios.

### 6.2 Stack Tecnológico Completo

| Capa | Tecnología | Versión | Propósito |
| :--- | :--- | :--- | :--- |
| **Backend - Runtime** | PHP | 8.2+ | Lenguaje de ejecución del servidor |
| **Backend - Framework** | Laravel | 12.x | Framework MVC, ORM, Seguridad, Colas, Artisan CLI |
| **Backend - Auth** | Laravel Fortify | 1.30+ | Autenticación, 2FA, Recuperación de contraseña |
| **Backend - Bridge** | Inertia.js Laravel | 2.0 | Adaptador Inertia para compartir datos con React |
| **Backend - Excel** | PhpSpreadsheet | 5.3+ | Generación de archivos Excel (.xlsx) |
| **Backend - Routes** | Laravel Wayfinder | 0.1.9 | Generación de rutas type-safe en TypeScript |
| **Frontend - Runtime** | Node.js | 18.x LTS / 20.x LTS | Compilación de assets y SSR |
| **Frontend - UI** | React | 19.2 | Librería de componentes de interfaz |
| **Frontend - Types** | TypeScript | 5.7+ | Tipado estático para JavaScript |
| **Frontend - CSS** | Tailwind CSS | 4.0 | Framework CSS utilitario con JIT Compiler |
| **Frontend - Build** | Vite | 7.0+ | Empaquetador de módulos con HMR |
| **Frontend - Icons** | Lucide React | 0.475+ | Librería de iconos SVG |
| **Frontend - UI Kit** | Radix UI (11 paquetes) | Varios | Componentes headless accesibles (shadcn/ui) |
| **Frontend - Animation** | GSAP | 3.13+ | Librería de animaciones profesionales |
| **Frontend - Touring** | Driver.js | 1.4+ | Sistema de tours y guías interactivas |
| **Frontend - OTP** | input-otp | 1.4+ | Componente de entrada OTP para 2FA |
| **Frontend - AI** | Puter.js | 2.2+ | Integración con API de Puter para chatbot |
| **Base de Datos** | MySQL / MariaDB | 8.0+ / 10.6+ | Motor de base de datos relacional |
| **Servidor Web** | Apache / Nginx | 2.4+ / 1.18+ | Servidor HTTP |

### 6.3 Modelo de Integración con GLPI

Un aspecto diferenciador fundamental de HelpDesk HUV es su modelo de integración con la base de datos de GLPI. El sistema **no duplica datos**; lee y escribe directamente sobre las tablas del esquema GLPI. Esto significa que:

- Si un técnico actualiza un activo en GLPI nativo, el cambio se refleja inmediatamente en HelpDesk HUV.
- Si un ticket se crea en HelpDesk HUV, aparece inmediatamente en GLPI nativo.
- Las tablas propias de Laravel (`users`, `notifications`, `templates`, `migrations`, `jobs`, `sessions`, `cache`) conviven en la misma base de datos sin conflictos.
- No se alteran ni eliminan columnas de las tablas nativas de GLPI; solo se agregan índices de rendimiento.

### 6.4 Componentes de Frontend (UI)

El frontend está construido siguiendo los principios de **Atomic Design** con más de 40 componentes reutilizables organizados en las siguientes categorías:

- **Componentes Shell:** `app-layout`, `app-sidebar`, `app-header`, `app-content`, `app-sidebar-header`
- **Componentes de Navegación:** `nav-main`, `nav-footer`, `nav-user`, `breadcrumbs`
- **Componentes de Funcionalidad:** `evarisbot`, `global-search`, `notifications-dropdown`, `accessibility-menu`, `dashboard-cards`, `view-tabs`
- **Componentes de UI (28 basados en Radix/shadcn):** `alert`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `checkbox`, `collapsible`, `dialog`, `dropdown-menu`, `icon`, `input`, `label`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `spinner`, `table`, `textarea`, `toggle`, `tooltip`, entre otros.

---

## 7. Especificaciones del Ambiente de Producción

### 7.1 Hardware del Servidor

| Recurso | Especificación Mínima | Especificación Recomendada |
| :--- | :--- | :--- |
| **Procesador** | 2 vCPU (x64) | 4 vCPU (x64) |
| **Memoria RAM** | 4 GB | 8 GB |
| **Almacenamiento** | 20 GB SSD | 50 GB SSD |
| **Red** | 100 Mbps | 1 Gbps |

### 7.2 Software Base del Servidor

| Componente | Versión Requerida | Notas |
| :--- | :--- | :--- |
| **Sistema Operativo** | Ubuntu 22.04 LTS / Windows Server 2019+ | Se recomienda Linux para producción |
| **PHP** | 8.2+ con extensiones BCMath, Ctype, Fileinfo, JSON, Mbstring, OpenSSL, PDO_MySQL, Tokenizer, XML, GD, Zip, Intl | Verificar con `php -m` |
| **MySQL** | 8.0+ o MariaDB 10.6+ | Charset UTF8MB4, Collation utf8mb4_unicode_ci |
| **Servidor Web** | Apache 2.4+ con `mod_rewrite` o Nginx 1.18+ | DocumentRoot apuntando a carpeta `public/` |
| **Node.js** | 18.x LTS o 20.x LTS | Solo necesario para compilación (build time) |
| **Composer** | 2.6+ | Gestor de dependencias PHP |
| **Git** | 2.25+ | Control de versiones |

### 7.3 Configuración PHP Crítica (php.ini)

```ini
memory_limit = 512M          ; Mínimo 512M, recomendado 1G para exportaciones masivas
max_execution_time = 120      ; Procesos largos de exportación
post_max_size = 50M           ; Adjuntos de evidencia
upload_max_filesize = 50M     ; Subida de archivos
max_input_vars = 3000         ; Formularios complejos
```

---

## 8. Entregables Digitales y Activos

### 8.1 Inventario de Entregables

El área de Innovación y Desarrollo hace entrega de los siguientes activos digitales:

| # | Entregable | Descripción | Formato/Ubicación |
| :---: | :--- | :--- | :--- |
| 1 | **Código Fuente Completo** | Repositorio Git con todo el código backend (Laravel/PHP) y frontend (React/TypeScript). Incluye historial completo de commits. | Repositorio Git institucional |
| 2 | **Archivos de Compilación** | Assets compilados y optimizados para producción (carpeta `public/build`). | Directorio `public/build/` |
| 3 | **Scripts de Base de Datos** | Migraciones de Laravel que extienden el esquema GLPI con tablas e índices adicionales. | Directorio `database/migrations/` |
| 4 | **Script de Importación** | Archivo batch para importación de base de datos en entornos Windows. | `import-db.bat` |
| 5 | **Archivo de Configuración** | Plantilla de variables de entorno con todos los parámetros necesarios. | `.env.example` |
| 6 | **Documentación Técnica** | Documentación de arquitectura, API interna, modelo de datos y procedimientos de despliegue. | `DOCUMENTACION/DOCUMENTACION_TECNICA.md` |
| 7 | **Manual de Usuario** | Manual integral de operación del sistema para todos los roles. | `DOCUMENTACION/MANUAL_DE_USUARIO.md` |
| 8 | **Credenciales y Configuración** | Credenciales de acceso, parámetros de configuración y procedimiento de instalación. | `DOCUMENTACION/CREDENCIALES_Y_CONFIGURACION.md` |
| 9 | **Material de Entrenamiento** | Programa de capacitación con talleres prácticos y evaluaciones. | `DOCUMENTACION/MATERIAL_ENTRENAMIENTO.md` |
| 10 | **Registro Histórico** | Bitácora de versiones, cambios y decisiones técnicas del proyecto. | `DOCUMENTACION/REGISTRO_HISTORICO_INTERACCIONES.md` |
| 11 | **Acta de Entrega** | El presente documento. | `DOCUMENTACION/ACTA_DE_ENTREGA.md` |
| 12 | **Credenciales Administrativas** | Cuenta de administrador maestro para control total del sistema. | Entrega reservada en sobre sellado |

### 8.2 Estructura del Código Fuente

El código fuente se organiza en la siguiente estructura de directorios principal:

```
HelpDesk/
├── app/                          # Código de la aplicación (Backend)
│   ├── Actions/Fortify/          # Acciones de autenticación (crear usuario, reset password)
│   ├── Console/Commands/         # Comandos Artisan personalizados (import-users, sync-tickets)
│   ├── Http/
│   │   ├── Controllers/          # 22 controladores (Dashboard, Ticket, Inventory, Admin, etc.)
│   │   ├── Middleware/           # 3 middleware (Inertia, Appearance, Security)
│   │   └── Requests/            # Form Requests para validación
│   ├── Models/                   # 11 modelos Eloquent (User, Computer, Monitor, Printer, etc.)
│   ├── Providers/                # 2 Service Providers (App, Fortify)
│   └── Traits/                   # Trait de estilos Excel reutilizable
├── bootstrap/                    # Arranque de la aplicación
├── config/                       # 12 archivos de configuración
├── database/
│   ├── factories/                # Factories de testing
│   ├── migrations/               # 10 archivos de migración
│   └── seeders/                  # Seeders de datos iniciales
├── lang/es/                      # Traducciones al español
├── public/                       # Punto de entrada web (index.php)
│   ├── build/                    # Assets compilados (JS, CSS)
│   └── images/                   # Imágenes estáticas
├── resources/
│   ├── css/                      # Estilos globales
│   ├── js/                       # Código frontend (React/TypeScript)
│   │   ├── components/           # 40+ componentes reutilizables
│   │   ├── layouts/              # 3 layouts (App, Auth, Settings)
│   │   ├── pages/                # 35+ páginas de la aplicación
│   │   └── types/                # Definiciones de tipos TypeScript
│   └── views/                    # Plantilla Blade base
├── routes/                       # Definición de rutas (web, settings, console)
├── storage/                      # Archivos generados, logs, caché
├── tests/                        # Pruebas unitarias y funcionales (Pest)
└── DOCUMENTACION/                # Documentación del proyecto
```

---

## 9. Inventario Detallado de Componentes del Software

### 9.1 Controladores del Sistema

El sistema cuenta con veintidós (22) controladores que gestionan toda la lógica de negocio:

| # | Controlador | Métodos Públicos | Responsabilidad Principal |
| :---: | :--- | :---: | :--- |
| 1 | `DashboardController` | 6 | Dashboard principal, toma de tickets, asignación, resolución rápida |
| 2 | `TicketController` | 10 | CRUD de tickets, filtros, exportación, soluciones, adjuntos, equipos asociados |
| 3 | `ComputerController` | 8 | CRUD de computadores, hoja de vida con componentes y software |
| 4 | `MonitorController` | 8 | CRUD de monitores |
| 5 | `PrinterController` | 8 | CRUD de impresoras |
| 6 | `NetworkEquipmentController` | 8 | CRUD de equipos de red |
| 7 | `PeripheralController` | 8 | CRUD de periféricos |
| 8 | `PhoneController` | 8 | CRUD de teléfonos |
| 9 | `SoftwareController` | 8 | CRUD de software con versiones, instalaciones y licencias |
| 10 | `ConsumableItemController` | 8 | CRUD de consumibles |
| 11 | `GlobalInventoryController` | 2 | Vista consolidada de todos los activos (UNION ALL) |
| 12 | `PublicTicketController` | 1+3 privados | Formulario público con IA para clasificación automática |
| 13 | `ChatbotController` | 3+3 privados | Chatbot Evarisbot con dual API (OpenRouter y Puter) |
| 14 | `SearchController` | 1 | Búsqueda global multi-entidad |
| 15 | `NotificationController` | 6 | CRUD de notificaciones del usuario |
| 16 | `StatisticsController` | 2 | Dashboard estadístico con caché y exportación |
| 17 | `UserController` | 4 | Administración de usuarios, activación/desactivación |
| 18 | `ProfileController` | 4 | Configuración de perfil personal y avatar |
| 19 | `PasswordController` | 2 | Cambio de contraseña |
| 20 | `TwoFactorAuthenticationController` | 1 | Configuración de autenticación de dos factores |
| 21 | `EnDesarrolloController` | 1 | Placeholder para módulos en desarrollo (20+ rutas) |
| 22 | `TemplateController` | 7 (vacíos) | Estructura preparada para plantillas de respuesta (futuro) |

### 9.2 Modelos del Sistema

El sistema cuenta con once (11) modelos Eloquent:

| # | Modelo | Tabla | Tipo | Campos Clave |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `User` | `users` | Laravel | id, glpi_user_id, name, username, email, phone, avatar, role, is_active, 2FA fields |
| 2 | `Computer` | `glpi_computers` | GLPI | name, serial, entities_id, states_id, manufacturers_id, computertypes_id, computermodels_id, locations_id |
| 3 | `Monitor` | `glpi_monitors` | GLPI | name, serial, size, monitortypes_id, monitormodels_id, states_id, locations_id |
| 4 | `Printer` | `glpi_printers` | GLPI | name, serial, printertypes_id, printermodels_id, states_id, locations_id |
| 5 | `NetworkEquipment` | `glpi_networkequipments` | GLPI | name, serial, networkequipmenttypes_id, networkequipmentmodels_id, states_id |
| 6 | `Peripheral` | `glpi_peripherals` | GLPI | name, serial, peripheraltypes_id, peripheralmodels_id, states_id |
| 7 | `Phone` | `glpi_phones` | GLPI | name, serial, phonetypes_id, phonemodels_id, states_id |
| 8 | `Software` | `glpi_softwares` | GLPI | name, comment, manufacturers_id, is_deleted, is_template |
| 9 | `ConsumableItem` | `glpi_consumableitems` | GLPI | name, ref, consumableitemtypes_id, manufacturers_id, users_id_tech |
| 10 | `Notification` | `notifications` | Laravel | user_id, type, title, message, icon, color, reference_id, action_url, read_at |
| 11 | `Template` | `templates` | Laravel | (Estructura preparada, aún sin implementar) |

### 9.3 Rutas del Sistema

El sistema define más de **100 rutas** organizadas en los siguientes grupos:

| Grupo | # Rutas | Middleware | Descripción |
| :--- | :---: | :--- | :--- |
| Públicas | 7 | Ninguno | Página principal, reporte público, chatbot, logout |
| Dashboard | 6 | `auth`, `verified` | Dashboard, polling, detalle de ticket, toma, asignación, resolución |
| Inventario | ~56 | `auth`, `verified` | 8 recursos completos (7 rutas cada uno) + inventario global (2 rutas) |
| Soporte | 10 | `auth`, `verified` | CRUD de tickets + solución + items por tipo |
| Estadísticas | 2 | `auth`, `verified` | Dashboard estadístico + exportación |
| Administración | 5 | `auth`, `verified` | CRUD de usuarios + toggle activación + exportación |
| Notificaciones | 6 | `auth`, `verified` | API de notificaciones (CRUD + marcar leídas) |
| Búsqueda | 1 | `auth`, `verified` | Búsqueda global API |
| Configuración | 9 | `auth` | Perfil, contraseña, apariencia, 2FA |
| En Desarrollo | 20+ | `auth`, `verified` | Placeholders para módulos futuros |

---

## 10. Matriz de Cumplimiento de Requerimientos

### 10.1 Requerimientos Funcionales

| ID | Requerimiento | Estado | Observaciones |
| :---: | :--- | :---: | :--- |
| RF-001 | Autenticación por nombre de usuario y contraseña | ✅ Cumplido | Integrado con tabla `glpi_users` |
| RF-002 | Gestión de roles (Admin, Técnico, Usuario) | ✅ Cumplido | Implementado en modelo User y middleware |
| RF-003 | Autenticación de dos factores (2FA) | ✅ Cumplido | TOTP con códigos de recuperación |
| RF-004 | Recuperación de contraseña por correo | ✅ Cumplido | Mediante Laravel Fortify |
| RF-005 | Dashboard de tickets en tiempo real | ✅ Cumplido | Con polling periódico |
| RF-006 | Creación de tickets con categorización ITIL | ✅ Cumplido | Categorías jerárquicas desde `glpi_itilcategories` |
| RF-007 | Asignación y reasignación de tickets | ✅ Cumplido | Manual por admin o auto-asignación por técnico |
| RF-008 | Resolución y cierre de tickets | ✅ Cumplido | Con documentación de solución |
| RF-009 | Gestión de inventario (8 categorías) | ✅ Cumplido | CRUD completo para todas las categorías |
| RF-010 | Hoja de vida del equipo | ✅ Cumplido | Historial completo desde `glpi_logs` |
| RF-011 | Exportación a Excel | ✅ Cumplido | Con estilos profesionales (PhpSpreadsheet) |
| RF-012 | Búsqueda global multi-entidad | ✅ Cumplido | 8 tipos de entidad consultadas |
| RF-013 | Sistema de notificaciones | ✅ Cumplido | 8 tipos de notificación |
| RF-014 | Reportes estadísticos | ✅ Cumplido | Con filtros avanzados y caché |
| RF-015 | Chatbot de asistencia (IA) | ✅ Cumplido | Evarisbot con OpenRouter y Puter |
| RF-016 | Formulario público de reporte | ✅ Cumplido | Con clasificación automática por IA |
| RF-017 | Adjuntos y evidencias en tickets | ✅ Cumplido | Integrado con sistema de archivos GLPI |
| RF-018 | Asociación de activos a tickets | ✅ Cumplido | Mediante `glpi_items_tickets` |
| RF-019 | Administración de usuarios | ✅ Cumplido | CRUD con activación/desactivación |
| RF-020 | Importación masiva de usuarios GLPI | ✅ Cumplido | Comando Artisan `glpi:import-users` |

### 10.2 Requerimientos No Funcionales

| ID | Requerimiento | Estado | Observaciones |
| :---: | :--- | :---: | :--- |
| RNF-001 | Tiempo de respuesta < 3 segundos | ✅ Cumplido | Optimizado con índices y caché |
| RNF-002 | Compatibilidad Chrome, Firefox, Edge | ✅ Cumplido | Probado en navegadores Chromium y Firefox |
| RNF-003 | Diseño responsive (móvil/tablet/desktop) | ✅ Cumplido | Tailwind CSS con breakpoints |
| RNF-004 | Accesibilidad WCAG (nivel básico) | ✅ Cumplido | Componentes Radix UI con ARIA |
| RNF-005 | Código fuente documentado | ✅ Cumplido | TypeScript con tipos y documentación |
| RNF-006 | Seguridad CSRF y XSS | ✅ Cumplido | Protección nativa de Laravel |
| RNF-007 | Modo oscuro/claro | ✅ Cumplido | Preferencia guardada en cookie |
| RNF-008 | Traducciones al español | ✅ Cumplido | Directorio `lang/es/` |
| RNF-009 | Server-Side Rendering (SSR) | ✅ Cumplido | Configurado en Vite con `ssr.tsx` |
| RNF-010 | Caché de respuestas para rendimiento | ✅ Cumplido | 60-180 segundos en estadísticas |

---

## 11. Pruebas Realizadas y Resultados

### 11.1 Tipos de Pruebas Ejecutadas

| Tipo de Prueba | Alcance | Herramienta | Resultado |
| :--- | :--- | :--- | :--- |
| **Pruebas Unitarias** | Lógica de controladores y modelos | Pest PHP | Ejecutadas satisfactoriamente |
| **Pruebas Funcionales** | Flujos de usuario completos | Pest PHP + Laravel Testing | Ejecutadas satisfactoriamente |
| **Pruebas de Integración** | Conexión con BD GLPI | Pest PHP | Ejecutadas satisfactoriamente |
| **Pruebas de Interfaz** | Renderizado de componentes React | Manual / Visual | Ejecutadas satisfactoriamente |
| **Pruebas de Rendimiento** | Tiempos de carga y consultas SQL | Chrome DevTools / SQL Profiling | Ejecutadas satisfactoriamente |
| **Pruebas de Seguridad** | CSRF, XSS, inyección SQL | Manual / Laravel Security | Ejecutadas satisfactoriamente |
| **Pruebas de Aceptación (UAT)** | Validación con usuarios finales | Manual con técnicos de soporte | Ejecutadas satisfactoriamente |
| **Pruebas de Compatibilidad** | Navegadores y dispositivos | Manual multi-navegador | Ejecutadas satisfactoriamente |

### 11.2 Escenarios de Prueba Críticos

| # | Escenario | Resultado | Observaciones |
| :---: | :--- | :---: | :--- |
| 1 | Inicio de sesión con credenciales válidas | ✅ Pasa | Redirección al dashboard |
| 2 | Inicio de sesión con credenciales inválidas | ✅ Pasa | Mensaje de error y rate limiting |
| 3 | Creación de ticket con todos los campos | ✅ Pasa | Ticket visible en dashboard |
| 4 | Creación de ticket público con IA | ✅ Pasa | Clasificación automática correcta |
| 5 | Asignación de ticket por administrador | ✅ Pasa | Notificación al técnico |
| 6 | Auto-asignación de ticket por técnico | ✅ Pasa | Cambio de estado a "Asignado" |
| 7 | Resolución y cierre de ticket | ✅ Pasa | Solución registrada y fecha de cierre |
| 8 | Exportación de inventario (>10,000 registros) | ✅ Pasa | Archivo generado en <30 segundos |
| 9 | Búsqueda global multi-entidad | ✅ Pasa | Resultados categorizados correctamente |
| 10 | Configuración 2FA con código QR | ✅ Pasa | Códigos de recuperación generados |
| 11 | Chatbot Evarisbot interacción completa | ✅ Pasa | Campos de formulario extraídos |
| 12 | Exportación de estadísticas a Excel | ✅ Pasa | Formato profesional con gráficas |
| 13 | Navegación en dispositivo móvil | ✅ Pasa | Sidebar colapsable, tablas responsive |
| 14 | Activación/desactivación de usuario | ✅ Pasa | Usuario bloqueado no puede iniciar sesión |
| 15 | Cambio de apariencia (modo oscuro) | ✅ Pasa | Preferencia persistente en cookie |

---

## 12. Limitaciones Conocidas y Funcionalidades Pendientes

### 12.1 Limitaciones Actuales

| # | Limitación | Impacto | Mitigación |
| :---: | :--- | :--- | :--- |
| 1 | No hay integración LDAP/Active Directory directa | Los usuarios deben ser importados desde GLPI o creados manualmente | Comando `glpi:import-users` disponible |
| 2 | Notificaciones por polling (no WebSockets) | Las actualizaciones no son instantáneas (delay de segundos) | Pooling configurado en intervalos razonables |
| 3 | Chatbot depende de APIs externas | Si OpenRouter/Puter caen, el chatbot no funciona | Implementar fallback con respuestas predeterminadas |
| 4 | Sin módulo de reportes avanzados (BI) | Análisis profundo requiere herramientas externas | La exportación a Excel permite análisis con Power BI |
| 5 | Eliminación de tickets es soft delete | Los tickets no se borran físicamente | Consistente con filosofía GLPI de trazabilidad |

### 12.2 Funcionalidades Planificadas (Futuro)

Los siguientes módulos se encuentran con rutas preparadas pero aún no implementados (muestran página "En Desarrollo"):

| Módulo | Ruta Base | Prioridad |
| :--- | :--- | :--- |
| Cartuchos | `/inventario/cartuchos` | Media |
| Gabinetes (Racks) | `/inventario/gabinetes` | Media |
| Multitomas (PDUs) | `/inventario/multitomas` | Baja |
| Licencias | `/gestion/licencias` | Alta |
| Documentos | `/gestion/documentos` | Media |
| Líneas (Telefonía) | `/gestion/lineas` | Media |
| Certificados | `/gestion/certificados` | Baja |
| Centros de Datos | `/gestion/centros-datos` | Baja |
| Proyectos | `/utiles/proyectos` | Media |
| Recordatorios | `/utiles/recordatorios` | Baja |
| Base de Conocimiento | `/utiles/base-conocimiento` | Alta |
| Reservas | `/utiles/reservas` | Baja |
| Reportes Avanzados | `/utiles/reportes` | Alta |
| Grupos | `/administracion/grupos` | Media |
| Entidades | `/administracion/entidades` | Media |
| Reglas | `/administracion/reglas` | Baja |
| Desplegables | `/configuracion/desplegables` | Baja |
| SLAs | `/configuracion/niveles-servicio` | Alta |
| Plantillas de Respuesta | Admin Templates | Alta |

---

## 13. Plan de Transición Operativa

### 13.1 Cronograma de Transición

| Fase | Período | Actividades | Responsable |
| :--- | :--- | :--- | :--- |
| **Fase 1: Entrega Formal** | 05/02/2026 | Firma de acta, entrega de credenciales, transferencia de repositorio. | Innovación y Desarrollo |
| **Fase 2: Período de Acompañamiento** | 06/02/2026 — 19/02/2026 | Acompañamiento operativo diario. Resolución inmediata de dudas. | Innovación y Desarrollo |
| **Fase 3: Operación Asistida** | 20/02/2026 — 05/03/2026 | Soporte bajo demanda. El área receptora opera el sistema con supervisión remota. | Ambas partes |
| **Fase 4: Operación Autónoma** | 06/03/2026 — 05/05/2026 | El área receptora opera de forma independiente. Se atienden únicamente bugs críticos. | Dirección de Tecnología |
| **Fase 5: Cierre de Garantía** | 05/05/2026 | Fin del período de garantía. Se formaliza la autonomía operativa completa. | Ambas partes |

### 13.2 Criterios de Éxito de la Transición

La transición se considerará exitosa cuando:

1. El equipo receptor pueda realizar operaciones de mantenimiento de rutina sin asistencia (reinicio de servicios, revisión de logs, respaldos).
2. Al menos dos (2) personas del equipo receptor hayan completado satisfactoriamente el programa de capacitación.
3. Se haya documentado y resuelto el 100% de los bugs críticos reportados durante la fase de acompañamiento.
4. El sistema haya operado de forma continua por un período mínimo de 30 días sin incidentes críticos.

---

## 14. Garantía y Soporte Post-Entrega

### 14.1 Período de Garantía

El área de Innovación y Desarrollo garantiza el funcionamiento correcto del software por un período de **tres (3) meses** contados a partir de la firma de esta acta, es decir, hasta el **05 de Mayo de 2026**.

### 14.2 Cobertura de la Garantía

Durante el período de garantía, el área de Innovación y Desarrollo atenderá sin costo adicional ni requerimiento de nuevo proyecto las siguientes situaciones:

| Tipo | Descripción | Tiempo de Respuesta |
| :--- | :--- | :--- |
| **Bug Crítico** | Error que impide la operación del sistema o causa pérdida de datos. | 4 horas hábiles |
| **Bug Mayor** | Error que afecta una funcionalidad importante pero tiene workaround. | 24 horas hábiles |
| **Bug Menor** | Error cosmético o de usabilidad que no impide la operación. | 72 horas hábiles |
| **Consulta Técnica** | Duda sobre configuración, uso o mantenimiento del sistema. | 48 horas hábiles |

### 14.3 Exclusiones de la Garantía

La garantía **NO** cubre fallos derivados de:

1. **Infraestructura externa:** Caídas del servidor físico o virtual, cortes de energía eléctrica, fallas del sistema operativo host o del motor de base de datos no atribuibles al software.
2. **Manipulación no autorizada:** Modificaciones directas a la base de datos GLPI por parte de terceros que corrompan la integridad referencial utilizada por HelpDesk HUV.
3. **Cambios de infraestructura:** Alteraciones en la configuración de red del Hospital (cambios de IP, VLAN, DNS, firewall) que impidan la conexión al sistema sin previo aviso al equipo de desarrollo.
4. **Actualizaciones de GLPI:** Si el Hospital decide actualizar la versión de GLPI y esta actualización modifica la estructura de las tablas que utiliza HelpDesk HUV.
5. **Uso indebido:** Acciones deliberadas o negligentes de usuarios que resulten en eliminación de datos, compromiso de credenciales o mal uso del sistema.
6. **Servicios de terceros:** Interrupciones en los servicios de inteligencia artificial (OpenRouter, Puter) que afecten el funcionamiento del chatbot.

### 14.4 Procedimiento de Reporte de Bugs

Para reportar un error durante el período de garantía:

1. Describir el error de forma clara, incluyendo: qué acción se realizaba, qué se esperaba que ocurriera, qué ocurrió realmente.
2. Incluir capturas de pantalla si es posible.
3. Indicar el navegador y sistema operativo utilizado.
4. Enviar el reporte al correo del área de Innovación y Desarrollo o mediante el canal institucional acordado.
5. El área de Innovación y Desarrollo confirmará la recepción y asignará un tiempo estimado de resolución según la severidad.

---

## 15. Acuerdos de Nivel de Servicio para Soporte

### 15.1 Definiciones de Severidad

| Nivel | Nombre | Descripción | Ejemplo |
| :---: | :--- | :--- | :--- |
| **S1** | Crítico | El sistema está completamente inoperante o existe pérdida de datos. | El sistema no carga, error 500 global, datos borrados. |
| **S2** | Mayor | Una funcionalidad principal está afectada sin workaround disponible. | No se pueden crear tickets, el módulo de inventario no carga. |
| **S3** | Moderado | Una funcionalidad está afectada pero existe un workaround. | La exportación a Excel no genera correctamente una columna. |
| **S4** | Menor | Error cosmético, de usabilidad o mejora solicitada. | Un botón desalineado, texto con tipografía incorrecta. |

### 15.2 Tiempos de Respuesta y Resolución

| Severidad | Tiempo de Respuesta | Tiempo de Resolución | Canal |
| :---: | :--- | :--- | :--- |
| **S1** | 1 hora hábil | 4 horas hábiles | Teléfono + Correo |
| **S2** | 4 horas hábiles | 24 horas hábiles | Correo + Teams |
| **S3** | 8 horas hábiles | 72 horas hábiles | Correo |
| **S4** | 24 horas hábiles | 5 días hábiles | Correo |

---

## 16. Capacitación y Transferencia de Conocimiento

### 16.1 Sesiones de Capacitación Realizadas

| # | Fecha | Tema | Duración | Asistentes | Material |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | 20/01/2026 | Arquitectura general y stack tecnológico | 4 horas | Equipo de TI | Presentación + código en vivo |
| 2 | 22/01/2026 | Operación del módulo de tickets (técnicos) | 4 horas | Técnicos de soporte | Manual de usuario + taller práctico |
| 3 | 24/01/2026 | Administración del sistema y usuarios | 3 horas | Coordinadores TI | Guía de administración |
| 4 | 27/01/2026 | Gestión de inventario y exportaciones | 4 horas | Técnicos de soporte | Manual de usuario + ejercicios |
| 5 | 29/01/2026 | Despliegue, mantenimiento y troubleshooting | 4 horas | Equipo de infraestructura | Documentación técnica |
| 6 | 31/01/2026 | Evaluación práctica integral | 3 horas | Todos los perfiles | Examen + simulación |

### 16.2 Material de Referencia Entregado

Todo el material de capacitación está incluido en el paquete de documentación del sistema:

- **MATERIAL_ENTRENAMIENTO.md** — Programa completo de entrenamiento de 40 horas.
- **MANUAL_DE_USUARIO.md** — Manual integral de operación para todos los roles.
- **DOCUMENTACION_TECNICA.md** — Documentación técnica maestra para el equipo de desarrollo/infraestructura.
- **CREDENCIALES_Y_CONFIGURACION.md** — Guía de instalación y configuración del servidor.

---

## 17. Gestión de Riesgos y Contingencias

### 17.1 Matriz de Riesgos Identificados

| # | Riesgo | Probabilidad | Impacto | Mitigación |
| :---: | :--- | :---: | :---: | :--- |
| R-001 | Caída del servidor de la base de datos GLPI | Baja | Crítico | Implementar respaldos diarios automatizados. Mantener script de restauración probado. |
| R-002 | Rotación del personal técnico con conocimiento del sistema | Media | Alto | La documentación exhaustiva y el material de entrenamiento mitigan la pérdida de conocimiento. |
| R-003 | Actualización de GLPI que rompa la compatibilidad | Baja | Crítico | No actualizar GLPI sin antes verificar la compatibilidad de las tablas referenciadas por HelpDesk HUV. |
| R-004 | Saturación del servidor por crecimiento de datos | Baja | Moderado | Monitorear periódicamente el uso de disco y RAM. Escalar el servidor si es necesario. |
| R-005 | Expiración de la API key de OpenRouter/Puter | Media | Bajo | El chatbot es una funcionalidad complementaria. El sistema opera normalmente sin él. |
| R-006 | Vulnerabilidad de seguridad en dependencias | Media | Alto | Ejecutar periódicamente `composer audit` y `npm audit`. Aplicar parches de seguridad. |
| R-007 | Pérdida del acceso al repositorio Git | Baja | Crítico | Mantener una copia de respaldo del código fuente en un medio independiente. |

### 17.2 Plan de Contingencia ante Caída Total

En caso de una falla catastrófica que requiera reinstalación completa del sistema:

1. Restaurar el backup más reciente de la base de datos GLPI.
2. Clonar el repositorio del código fuente.
3. Ejecutar el procedimiento de instalación descrito en `CREDENCIALES_Y_CONFIGURACION.md`.
4. Verificar las variables de entorno (`.env`).
5. Ejecutar migraciones de base de datos.
6. Compilar los assets de frontend.
7. Verificar permisos de directorios.
8. Validar el funcionamiento con los escenarios de prueba críticos.

**Tiempo estimado de recuperación:** 30 a 60 minutos (con personal capacitado y backups disponibles).

---

## 18. Responsabilidades de las Partes

### 18.1 Responsabilidades del Área de Innovación y Desarrollo (Entregante)

1. Entregar el software en estado operativo y funcional, según lo descrito en esta acta.
2. Proporcionar toda la documentación técnica y de usuario correspondiente.
3. Transferir las credenciales administrativas de forma segura.
4. Brindar soporte técnico durante el período de garantía de tres (3) meses.
5. Atender las sesiones de capacitación programadas.
6. Corregir los defectos (bugs) de software reportados durante la garantía, según los tiempos acordados.
7. Notificar oportunamente sobre cualquier limitación, riesgo o dependencia del sistema.

### 18.2 Responsabilidades del Área Receptora (Dirección de Tecnología)

1. Asignar un responsable técnico como punto de contacto para la transición.
2. Garantizar la disponibilidad de la infraestructura de servidor necesaria para la operación del sistema.
3. Realizar respaldos periódicos de la base de datos y del código fuente.
4. Gestionar las cuentas de usuario (altas, bajas, cambios de rol) después del período de acompañamiento.
5. Monitorear el estado del sistema (logs, uso de recursos) de forma periódica.
6. No realizar modificaciones al código fuente sin previa documentación y pruebas.
7. Notificar oportunamente al área de Innovación y Desarrollo sobre cualquier cambio en la infraestructura que pueda afectar al sistema.
8. Garantizar que los usuarios finales reciban la información necesaria para operar el sistema.

---

## 19. Protección de Datos y Confidencialidad

### 19.1 Datos Personales Gestionados por el Sistema

El sistema HelpDesk HUV procesa los siguientes datos personales de los funcionarios del Hospital:

| Dato | Tipo | Sensibilidad | Propósito |
| :--- | :--- | :--- | :--- |
| Nombre completo | Identificación | Media | Identificar al solicitante y técnico asignado |
| Nombre de usuario | Identificación | Media | Autenticación e inicio de sesión |
| Correo electrónico institucional | Contacto | Media | Notificaciones, recuperación de contraseña |
| Número de extensión telefónica | Contacto | Baja | Contacto directo para atención en sitio |
| Ubicación laboral (servicio/oficina) | Laboral | Baja | Enrutamiento del técnico al sitio correcto |
| Cargo o función | Laboral | Baja | Contextualización del reporte |
| Foto de perfil (avatar) | Imagen | Baja | Personalización del perfil de usuario |

### 19.2 Medidas de Protección Implementadas

- Las contraseñas se almacenan con hash criptográfico `bcrypt` y nunca son visibles en texto plano.
- Las sesiones se protegen con tokens únicos y caducidad automática.
- La comunicación se realiza sobre protocolo HTTPS (SSL/TLS).
- Los accesos se registran en los logs del sistema para auditoría.
- El sistema implementa protección CSRF en todos los formularios.
- Los datos de entrada se sanitizan para prevenir inyección SQL y XSS.

### 19.3 Compromiso de Confidencialidad

Las partes se comprometen a:

- No divulgar las credenciales de acceso administrativo a personal no autorizado.
- No utilizar los datos personales de los funcionarios para fines distintos a los establecidos en el sistema.
- Notificar inmediatamente cualquier incidente de seguridad o acceso no autorizado detectado.
- Cumplir con la Ley 1581 de 2012 y sus decretos reglamentarios en el tratamiento de datos personales.

---

## 20. Formalización

### 20.1 Declaración de Conformidad

Habiendo verificado el funcionamiento de los módulos descritos en la presente acta, confirmada la recepción de todos los entregables digitales pactados, y acordados los términos de garantía, soporte y transición operativa, las partes firman el presente documento en señal de conformidad y aceptación plena de los términos aquí establecidos.

La firma de esta acta implica:

- La aceptación formal del software HelpDesk HUV versión 1.0.0 por parte del área receptora.
- El inicio del período de garantía de tres (3) meses.
- El compromiso de ambas partes de cumplir con las responsabilidades establecidas en las secciones 18.1 y 18.2.
- El reconocimiento de que el software es propiedad intelectual del Hospital Universitario del Valle.

---

## 21. Anexos

### Anexo A — Lista de Archivos del Repositorio
Se incluye como referencia la estructura completa del repositorio Git con todos los archivos fuente entregados (ver sección 8.2 del presente documento para la estructura detallada).

### Anexo B — Reporte de Pruebas de Aceptación (UAT)
Se adjunta por separado el reporte detallado de las pruebas de aceptación realizadas con los usuarios finales, incluyendo capturas de pantalla y actas de conformidad de cada sesión.

### Anexo C — Actas de Capacitación
Se adjuntan los registros de asistencia y evaluaciones de las sesiones de capacitación realizadas durante el período de entrenamiento.

### Anexo D — Certificado de Seguridad SSL
Se incluye copia del certificado SSL instalado en el servidor de producción, con fecha de expiración y autoridad certificadora.

### Anexo E — Registro de Credenciales Entregadas
Se entrega en sobre sellado separado la lista completa de credenciales administrativas del sistema, incluyendo:
- Cuenta de administrador maestro del HelpDesk HUV.
- Credenciales de acceso a la base de datos MySQL.
- API Keys de servicios de inteligencia artificial (OpenRouter).
- Contraseña del archivo `.env` de producción.

---

**Hospital Universitario del Valle "Evaristo García" E.S.E.**
Departamento de Innovación y Desarrollo
Cali, Valle del Cauca — Colombia
Febrero de 2026

---

*Fin del Acta de Entrega — HelpDesk HUV v1.0.0*
