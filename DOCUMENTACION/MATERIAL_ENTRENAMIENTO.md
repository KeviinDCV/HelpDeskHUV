# PROGRAMA DE CAPACITACIÓN Y ENTRENAMIENTO
## HELPDESK HUV - GESTIÓN DE SERVICIOS TECNOLÓGICOS

**Versión:** 1.0.0
**Fecha de Elaboración:** 05 de Febrero de 2026
**Responsable:** Innovación y Desarrollo

---

## TABLA DE CONTENIDO

1. [Objetivos del Programa](#1-objetivos-del-programa)
2. [Metodología de Entrenamiento](#2-metodología-de-entrenamiento)
3. [Perfiles de Capacitación](#3-perfiles-de-capacitación)
4. [Módulo 1: Fundamentos y Conceptos (Nivel Básico)](#4-módulo-1-fundamentos-y-conceptos-nivel-básico)
5. [Módulo 2: Operación para Técnicos de Soporte (Nivel Intermedio)](#5-módulo-2-operación-para-técnicos-de-soporte-nivel-intermedio)
6. [Módulo 3: Gestión de Inventario (Nivel Avanzado)](#6-módulo-3-gestión-de-inventario-nivel-avanzado)
7. [Módulo 4: Administración del Sistema (Nivel Experto)](#7-módulo-4-administración-del-sistema-nivel-experto)
8. [Actividades Prácticas y Evaluaciones](#8-actividades-prácticas-y-evaluaciones)
9. [Recursos de Apoyo](#9-recursos-de-apoyo)
10. [Plan de Capacitación Continua](#10-plan-de-capacitación-continua)

---

## 1. Objetivos del Programa

### 1.1 Objetivo General
Capacitar al personal del área de Tecnología del Hospital Universitario del Valle en el uso eficiente, administración y mantenimiento de la plataforma HelpDesk HUV, garantizando una transición operativa fluida y maximizando el aprovechamiento de las funcionalidades del sistema.

### 1.2 Objetivos Específicos
*   Estandarizar el conocimiento sobre los flujos de atención de incidentes bajo la metodología ITIL implementada en el sistema.
*   Desarrollar habilidades prácticas para la gestión precisa del inventario tecnológico institucional a través de la herramienta.
*   Instruir a los administradores en las tareas de mantenimiento, gestión de usuarios y generación de informes gerenciales.
*   Minimizar la curva de aprendizaje y los errores operativos durante las primeras fases de implementación.

---

## 2. Metodología de Entrenamiento

El programa utiliza una metodología mixta **(Blended Learning)** que combina:

1.  **Sesiones Teóricas (20%):** Explicación de conceptos, arquitectura y flujos de trabajo.
2.  **Demostración Guiada (30%):** El instructor realiza las operaciones paso a paso en el proyector.
3.  **Talleres Prácticos (40%):** Los participantes ejecutan tareas específicas en un ambiente de pruebas (Staging).
4.  **Evaluación (10%):** Validación de conocimientos mediante pruebas prácticas y cuestionarios.

---

## 3. Perfiles de Capacitación

Se han definido tres rutas de aprendizaje según el rol del funcionario:

| Perfil | Rol en Sistema | Ruta de Aprendizaje | Duración Estimada |
| :--- | :--- | :--- | :---: |
| **Personal de Mesa de Ayuda** | Técnico | Módulos 1, 2, 3 | 12 Horas |
| **Coordinadores de Área** | Administrador | Módulos 1, 2, 3, 4 | 16 Horas |
| **Administradores de TI** | Administrador | Módulos 1, 3, 4 + Técnica | 20 Horas |

---

## 4. Módulo 1: Fundamentos y Conceptos (Nivel Básico)

**Dirigido a:** Todo el personal técnico y administrativo.
**Duración:** 4 horas.

### Unidad 1.1: Introducción a HelpDesk HUV
*   Visión general del sistema: ¿Por qué cambiamos?
*   Integración con GLPI: Concepto de "Base de Datos Compartida".
*   Diferencias entre el sistema anterior y el nuevo.
*   Acceso al sistema y navegación básica.

### Unidad 1.2: Gestión de la Identidad
*   Inicio de sesión con credenciales de dominio.
*   Configuración del Perfil de Usuario.
*   **Taller:** Configuración de Autenticación de Dos Factores (2FA).
*   Recuperación de contraseña segura.

### Unidad 1.3: Conceptos ITIL Básicos
*   Definición de Incidente vs. Requerimiento.
*   Matriz de Priorización (Impacto x Urgencia).
*   Estados del Ticket (Nuevo, Asignado, En Curso, Espera, Resuelto, Cerrado).
*   Categorización jerárquica de servicios.

---

## 5. Módulo 2: Operación para Técnicos de Soporte (Nivel Intermedio)

**Dirigido a:** Técnicos de Soporte N1, N2 y N3.
**Duración:** 8 horas.

### Unidad 2.1: Gestión del Ciclo de Vida del Ticket
*   **Recepción:** Notificaciones de nuevos tickets y lectura del Dashboard.
*   **Asignación:** Auto-asignación ("Tomar caso") y asignación forzada.
*   **Diagnóstico:** Revisión de descripción, adjuntos y perfil del usuario.
*   **Taller Práctico:** Simulación de un ciclo completo de atención de incidente.

### Unidad 2.2: Documentación y Comunicación
*   Uso de la Bitácora de Seguimiento.
*   Comunicación con el usuario a través del sistema (evitar correos externos).
*   Registro de tiempos y actividades.
*   **Importante:** Cómo redactar una solución técnica válida para auditoría.

### Unidad 2.3: Herramientas de Productividad
*   Uso de filtros avanzados para organizar la cola de trabajo.
*   Búsqueda global de incidentes similares (Base de Conocimiento empírica).
*   Manejo de múltiples tickets simultáneos.
*   Gestión de tickets pendientes y recordatorios.

### Unidad 2.4: Evarisbot y Autoservicio
*   Cómo funciona el Chatbot (IA) de cara al usuario.
*   Interpretación de tickets creados por la IA (etiquetas de "Auto-generado").
*   Corrección de categorías mal asignadas por el usuario o la IA.

---

## 6. Módulo 3: Gestión de Inventario (Nivel Avanzado)

**Dirigido a:** Técnicos de Campo, Coordinadores de Activos.
**Duración:** 4 horas.

### Unidad 3.1: Estructura del Inventario GLPI
*   Tipos de activos gestionados (Computadores, Monitores, Red, etc.).
*   Relación entre activos (Un computador tiene monitor, teclado y office).
*   Concepto de "Entidades" y "Ubicaciones" geográficas.

### Unidad 3.2: Alta y Baja de Activos
*   Procedimiento de ingreso de equipos nuevos (Compras).
*   Etiquetado y registro de seriales.
*   Proceso de baja técnica y disposición final.
*   **Taller Práctico:** Registro completo de una dotación de puesto de trabajo (PC + Monitor + Periféricos).

### Unidad 3.3: Movimientos y Trazabilidad
*   Cambio de responsable (Asignar equipo a otro usuario).
*   Cambio de ubicación física.
*   Registro de mantenimiento en la hoja de vida del equipo.
*   Control de préstamos temporales.

### Unidad 3.4: Gestión de Consumibles
*   Inventario de tóners y repuestos.
*   Registro de entradas al almacén.
*   Despacho de consumibles a usuarios (asociación a ticket).
*   Alertas de stock bajo.

---

## 7. Módulo 4: Administración del Sistema (Nivel Experto)

**Dirigido a:** Coordinadores de Mesa de Ayuda, Administradores TI.
**Duración:** 4 horas.

### Unidad 4.1: Gestión de Usuarios y Roles
*   Creación de usuarios manuales vs. Importación GLPI.
*   Asignación y revocación de permisos (Admin vs Técnico).
*   Auditoría de accesos y logs de seguridad.
*   Desactivación de usuarios (Offboarding).

### Unidad 4.2: Estadísticas e Indicadores (KPIs)
*   Interpretación del Dashboard Estadístico.
*   Cálculo de SLA (Tiempos de respuesta y resolución).
*   Análisis de carga laboral por técnico.
*   Identificación de problemas recurrentes (Problem Management).

### Unidad 4.3: Exportación y Reportes
*   Generación de informes para Contraloría / Auditoría.
*   Exportación masiva de inventario a Excel.
*   Personalización de vistas de reporte.

### Unidad 4.4: Mantenimiento Básico
*   Comandos Artisan útiles (`glpi:import-users`).
*   Verificación de la cola de correos.
*   Troubleshooting básico de la aplicación.

---

## 8. Actividades Prácticas y Evaluaciones

### Actividad 1: El Rally de Soporte (Gamificación)
**Objetivo:** Resolver la mayor cantidad de tickets simulados en 1 hora.
*   Se crea un ambiente con 20 tickets de prueba con diferentes niveles de complejidad.
*   Los técnicos deben clasificar, responder y resolver.
*   Se evalúa: Tiempo de respuesta, calidad de la documentación y categorización correcta.

### Actividad 2: Inventario "Ciego"
**Objetivo:** Validar la precisión del registro de activos.
*   Se entrega al participante un equipo físico real.
*   Debe registrarlo en el sistema con todos sus componentes (RAM, Disco, Serial, Monitor).
*   Se compara el registro del sistema contra la ficha técnica real del equipo.

### Evaluación Final de Certificación
Para obtener el acceso definitivo a Producción, el funcionario debe aprobar un examen teórico-práctico con nota mínima de 80/100.
1.  **Teoría (20 preguntas):** Selección múltiple sobre procesos y ITIL.
2.  **Práctica:** Realizar una serie de tareas en el sistema (Crear usuario, resolver ticket, mover activo).

---

## 9. Recursos de Apoyo

El participante recibirá el siguiente kit de material digital:
1.  **Manual de Usuario (PDF/Web):** Referencia completa paso a paso.
2.  **Guía Rápida (Ficha):** Resumen de 1 página con los atajos y flujos más comunes.
3.  **Video Tutoriales:** Lista de reproducción con clips de 2-3 minutos sobre tareas específicas (Ej: "¿Cómo reasignar un ticket?").
4.  **Glosario de Términos:** Definiciones de siglas (SLA, OLA, GLPI, 2FA).

---

## 10. Plan de Capacitación Continua

La formación no termina con el curso inicial. Se establece el siguiente cronograma de refuerzo:

*   **Mensual:** Boletín de "Tips y Trucos" enviado por correo interno.
*   **Trimestral:** Sesión de re-entrenamiento de 2 horas para repasar nuevas funcionalidades o corregir errores operativos detectados.
*   **Onboarding:** Inducción obligatoria para cualquier nuevo integrante del equipo de TI antes de recibir sus credenciales.

---

**Aprobado por:**
Coordinación de Innovación y Desarrollo
Hospital Universitario del Valle
Febrero 2026
