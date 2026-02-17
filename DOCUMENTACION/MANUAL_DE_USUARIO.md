# MANUAL DE USUARIO
## HELPDESK HUV - GESTIÓN DE SERVICIOS TECNOLÓGICOS E INVENTARIO

**Versión:** 1.0.0
**Fecha de Actualización:** 06 de Febrero de 2026
**Hospital Universitario del Valle "Evaristo García" E.S.E.**
**Departamento de Innovación y Desarrollo**

---

## TABLA DE CONTENIDO

1. [Introducción](#1-introducción)
2. [Acceso al Sistema](#2-acceso-al-sistema)
3. [Interfaz General y Navegación](#3-interfaz-general-y-navegación)
4. [Módulo de Perfil y Preferencias](#4-módulo-de-perfil-y-preferencias)
5. [Guía para Usuarios Finales (Solicitantes)](#5-guía-para-usuarios-finales-solicitantes)
    5.1. [Reportar un Nuevo Incidente](#51-reportar-un-nuevo-incidente)
    5.2. [Consultar Mis Tickets](#52-consultar-mis-tickets)
    5.3. [Interactuar en un Ticket](#53-interactuar-en-un-ticket)
    5.4. [Uso del Chatbot Evarisbot](#54-uso-del-chatbot-evarisbot)
6. [Guía para Técnicos de Soporte](#6-guía-para-técnicos-de-soporte)
    6.1. [Dashboard de Soporte](#61-dashboard-de-soporte)
    6.2. [Gestión del Ciclo de Vida del Ticket](#62-gestión-del-ciclo-de-vida-del-ticket)
    6.3. [Documentación de Soluciones](#63-documentación-de-soluciones)
    6.4. [Búsqueda Avanzada](#64-búsqueda-avanzada)
    6.5. [Notificaciones y Alertas](#65-notificaciones-y-alertas)
7. [Guía de Gestión de Inventario](#7-guía-de-gestión-de-inventario)
    7.1. [Vista General de Inventario](#71-vista-general-de-inventario)
    7.2. [Computadores](#72-computadores)
    7.3. [Monitores y Pantallas](#73-monitores-y-pantallas)
    7.4. [Impresoras](#74-impresoras)
    7.5. [Equipos de Red](#75-equipos-de-red)
    7.6. [Periféricos](#76-periféricos)
    7.7. [Software y Licencias](#77-software-y-licencias)
    7.8. [Consumibles](#78-consumibles)
    7.9. [Teléfonos](#79-teléfonos)
8. [Guía De Administración](#8-guía-de-administración)
    8.1. [Gestión de Usuarios](#81-gestión-de-usuarios)
    8.2. [Importación de Usuarios GLPI](#82-importación-de-usuarios-glpi)
    8.3. [Reportes y Estadísticas](#83-reportes-y-estadísticas)
9. [Preguntas Frecuentes (FAQ)](#9-preguntas-frecuentes-faq)

---

## 1. Introducción

Bienvenido al sistema **HelpDesk HUV**, la plataforma integral para la gestión de servicios tecnológicos e inventario del Hospital Universitario del Valle. Este sistema ha sido diseñado para centralizar, optimizar y agilizar la atención de requerimientos técnicos, así como para mantener un control detallado de los activos informáticos de la institución.

### ¿Qué puede hacer con este sistema?

*   **Como Usuario:** Reportar fallas, solicitar servicios, consultar el estado de sus solicitudes y recibir asistencia automatizada.
*   **Como Técnico:** Gestionar colas de atención, documentar soluciones, consultar la hoja de vida de los equipos y mantener el inventario al día.
*   **Como Administrador:** Supervisar la operación global, gestionar accesos y obtener estadísticas de rendimiento.

---

## 2. Acceso al Sistema

### 2.1 Inicio de Sesión
El sistema es accesible desde cualquier equipo conectado a la red interna del HUV o a través de VPN autorizada.

1.  Ingrese a la dirección web: `https://helpdesk.huv.gov.co` (o la IP interna asignada).
2.  Verá la pantalla de bienvenida con opciones para:
    *   **Iniciar Sesión:** Botón principal para usuarios registrados.
    *   **Crear Ticket Público:** Opción para reportar sin clave (ver sección 5.1).
    *   **Chat con Evarisbot:** Asistente virtual en la esquina inferior derecha.

Al hacer clic en "Iniciar Sesión", ingrese sus credenciales institucionales:
*   **Usuario:** Su nombre de usuario de red (generalmente `nombre.apellido` o similar).
*   **Contraseña:** Su contraseña de dominio o la asignada específicamente para el sistema.

### 2.2 Autenticación de Dos Factores (2FA)
Si tiene habilitado el 2FA (recomendado para técnicos y administradores):
1.  Tras ingresar usuario y contraseña, se le solicitará un código de 6 dígitos.
2.  Abra su aplicación autenticadora (Google Authenticator, Microsoft Authenticator) en su móvil.
3.  Ingrese el código temporal.
4.  Si perdió su dispositivo, use uno de los códigos de recuperación que guardó al configurar el servicio.

### 2.3 Recuperación de Contraseña
Si olvidó su contraseña:
1.  En la pantalla de login, haga clic en "¿Olvidaste tu contraseña?".
2.  Ingrese su correo electrónico institucional.
3.  Recibirá un enlace para restablecer su clave.

---

## 3. Interfaz General y Navegación

### 3.1 Barra Lateral (Sidebar)
La navegación principal se encuentra a la izquierda de la pantalla y se adapta según su rol:

*   **Principal:** Acceso al Dashboard y Tickets.
*   **Inventario:** Desplegable con accesos a Computadores, Monitores, Impresoras, Red, etc.
*   **Gestión:** Herramientas adicionales como Licencias y Documentos (según permisos).
*   **Administración:** Gestión de Usuarios y Configuración (solo Admins).
*   **Estadísticas:** Acceso al módulo de análisis de datos.

### 3.2 Barra Superior (Header)
*   **Buscador Global:** (Atajo: `Ctrl + K` o `Cmd + K`) Permite buscar cualquier activo, ticket o usuario en el sistema.
*   **Notificaciones:** Icono de campana que muestra alertas recientes (asignaciones, comentarios).
*   **Menú de Usuario:** Acceso a Perfil, Preferencias y Cerrar Sesión.

### 3.3 Área de Trabajo
El contenido central cambia según la sección seleccionada. Utiliza un diseño de "tarjetas" limpio y moderno, optimizado para lectura rápida.

### 3.4 Modo Oscuro
Puede alternar entre modo claro y oscuro desde el menú de usuario -> Apariencia. El sistema recordará su preferencia.

---

## 4. Módulo de Perfil y Preferencias

Acceda haciendo clic en su avatar en la esquina superior derecha y seleccionando **"Perfil"**.

### 4.1 Información Personal
*   Actualice su foto de perfil (se recomienda una foto tipo carnet).
*   Verifique que su correo electrónico y teléfono de extensión estén actualizados. Esta información es vital para que los técnicos lo contacten.

### 4.2 Seguridad
*   **Cambiar Contraseña:** Debe ingresar su contraseña actual para establecer una nueva.
*   **Autenticación de Dos Factores:** Puede activar o desactivar el 2FA. Al activarlo, deberá escanear un código QR con su celular. **Importante:** Guarde los códigos de recuperación en un lugar seguro.

### 4.3 Sesiones Activas
Puede ver en qué otros dispositivos tiene abierta su sesión y cerrarlas remotamente si detecta actividad sospechosa.

---

## 5. Guía para Usuarios Finales (Solicitantes)

### 5.1 Reportar un Nuevo Incidente

Existen dos formas de reportar un problema:

#### Opción A: Desde el Sistema (Usuario Logueado)
1.  En el menú lateral, haga clic en **"Tickets"** -> **"Crear Nuevo"**.
2.  Complete el formulario:
    *   **Título:** Breve resumen del problema (Ej: "Impresora atascada en Farmacia").
    *   **Descripción:** Detalle del problema. Sea específico.
    *   **Categoría:** Seleccione del árbol de categorías (Ej: Hardware -> Impresora -> Falla mecánica).
    *   **Urgencia:** Seleccione según el impacto en su trabajo (Baja, Media, Alta, Muy Alta).
    *   **Ubicación:** Indique dónde se encuentra el equipo afectado.
    *   **Activo Asociado:** (Opcional) Busque y seleccione el equipo que falla.
    *   **Adjuntos:** Suba fotos del error o capturas de pantalla.
3.  Haga clic en **"Crear Ticket"**.

#### Opción B: Reporte Público (Sin Login)
Utilice esta opción si no tiene usuario o no puede acceder.
1.  En la pantalla de inicio, seleccione **"Crear Ticket Público"**.
2.  Ingrese su correo institucional.
3.  Describa el problema.
4.  **Inteligencia Artificial:** El sistema analizará su texto y sugerirá automáticamente el título y la categoría adecuados.
5.  Envíe el reporte. Recibirá un correo de confirmación con el número de caso.

### 5.2 Consultar Mis Tickets
En la sección "Mis Tickets", verá una tabla con todos sus reportes.
*   **Estados:**
    *   `Nuevo`: Recibido, pendiente de revisión.
    *   `Asignado`: Un técnico ya lo tiene en su cola.
    *   `En Curso`: Se está trabajando en la solución.
    *   `Resuelto`: El técnico ha dado una solución.
    *   `Cerrado`: Caso finalizado.

### 5.3 Interactuar en un Ticket
Al entrar al detalle de un ticket, puede:
*   Ver la bitácora de actividad.
*   Escribir comentarios o responder preguntas del técnico.
*   Adjuntar nuevos archivos.
*   Reabrir el caso si la solución no fue efectiva (solo si no está Cerrado definitivamente).

### 5.4 Uso del Chatbot Evarisbot
Haga clic en el icono flotante del robot en la esquina inferior derecha.
*   Puede preguntar cosas como: "¿Cómo cambio mi contraseña de red?", "Mi impresora no imprime".
*   El Bot intentará guiarlo con soluciones de auto-ayuda.
*   Si no puede resolverlo, el Bot le ofrecerá crear el ticket automáticamente con la información que usted le dio.

---

## 6. Guía para Técnicos de Soporte

### 6.1 Dashboard de Soporte
Al ingresar, el técnico ve un tablero de control con 4 métricas clave:
1.  **Tickets Sin Asignar:** Casos nuevos esperando atención (Cola Pública).
2.  **Mis Tickets:** Casos bajo su responsabilidad.
3.  **Mis Pendientes:** Casos que requieren acción inmediata.
4.  **Mis Resueltos:** Casos solucionados recientemente.

El dashboard se actualiza automáticamente cada 30 segundos.

### 6.2 Gestión del Ciclo de Vida del Ticket

#### Tomar un Ticket (Auto-asignación)
1.  Vaya a la lista de "Tickets Sin Asignar".
2.  Entre al detalle del ticket.
3.  Haga clic en el botón **"Tomar Caso"**.
4.  El estado cambia a `Asignado` y usted es el responsable.

#### Asignar a Otro Técnico
Si es administrador o el ticket corresponde a otra área:
1.  En "Técnico Asignado", seleccione al compañero adecuado.
2.  Agregue un comentario explicando el motivo del escalamiento.

#### Trabajar el Ticket
1.  Cambie el estado a `En Curso` cuando empiece a trabajar.
2.  Use la pestaña **"Bitácora"** para registrar llamadas, visitas o pruebas realizadas.
3.  Si necesita un repuesto o espera respuesta del proveedor, cambie a `En Espera`.

### 6.3 Documentación de Soluciones
Es **obligatorio** documentar la solución antes de resolver.
1.  En la sección "Resolución", describa técnicamente qué hizo.
    *   *Incorrecto:* "Se arregló".
    *   *Correcto:* "Se reinició servicio spooler de impresión y se actualizó driver a v4.5".
2.  Seleccione el tipo de solución (Cambio de configuración, Reemplazo de hardware, Capacitación, etc.).
3.  Cambie el estado a `Resuelto`.

### 6.4 Búsqueda Avanzada
Puede filtrar tickets por múltiples criterios:
*   Rango de Fechas.
*   Solicitante.
*   Categoría ITIL.
*   Palabras clave en descripción.
Use el botón "Exportar" para bajar los resultados a Excel.

### 6.5 Notificaciones y Alertas
El sistema le avisará cuando:
*   Se le asigne un nuevo ticket (Correo + Alerta web).
*   Un usuario comente en uno de sus tickets.
*   Un ticket urgente sea creado.
Mantenga revisada la campana de notificaciones.

---

## 7. Guía de Gestión de Inventario

El módulo de inventario está sincronizado con la base de datos GLPI. Cualquier cambio aquí se refleja allá y viceversa.

### 7.1 Vista General de Inventario
Ofrece una tabla maestra con todos los activos. Columnas clave:
*   **Nombre:** Identificador del equipo (Ej: PC-CONTABILIDAD-01).
*   **Serial:** Número de serie del fabricante.
*   **Estado:** Operativo, En Reparación, De Baja, En Inventario.
*   **Ubicación:** Oficina física.
*   **Responsable:** Usuario a cargo.

### 7.2 Computadores
Maneja Torres y Portátiles.
*   **Pestaña Componentes:** Permite ver Disco Duro, RAM, Procesador asociados.
*   **Pestaña Software:** Lista programas instalados (si se usa agente de inventario).
*   **Hoja de Vida:** Muestra todos los tickets históricos asociados a ese computador (Mantenimientos correctivos y preventivos).

### 7.3 Monitores y Pantallas
Registro de monitores. Importante asociar el monitor al computador al que está conectado mediante el campo "Conectado a".

### 7.4 Impresoras
Incluye impresoras locales y de red.
*   Para impresoras de red, registre la IP en el campo de comentarios o red.
*   Contadores de páginas pueden registrarse en la bitácora de cambios.

### 7.5 Equipos de Red
Switches, Routers, Access Points.
*   Crítico mantener actualizada la **Ubicación** para facilitar soporte en sitio.

### 7.6 Periféricos
Teclados, Mouse, Cámaras Web, Escáneres de código de barras.
*   Gestión global (stock) o individualizada.

### 7.7 Software y Licencias
Control de licencias Office, Antivirus, Software Médico.
*   Permite ver cuántas licencias hay compradas vs instaladas.

### 7.8 Consumibles
Tóners, resmas de papel, repuestos.
*   Permite control de stock (Entradas y Salidas).
*   Al entregar un tóner, registre la "Salida" asociándola al usuario que recibe.

### 7.9 Teléfonos
Teléfonos IP o análogos y celulares corporativos.
*   Registrar extensión, IMEI (celulares) y plan de datos si aplica.

---

## 8. Guía de Administración

(Exclusivo para usuarios con rol `Administrador`)

### 8.1 Gestión de Usuarios
Acceso: Menú **Administración** -> **Usuarios**.
*   **Crear Usuario:** Para personal externo que no está en directorio activo/GLPI.
*   **Editar Roles:** Puede promover un usuario a "Técnico" o "Administrador".
*   **Desactivar:** Use el toggle de "Estado" para bloquear acceso a ex-funcionarios. No elimine usuarios para no perder histórico de tickets.

### 8.2 Importación de Usuarios GLPI
Si un usuario existe en GLPI pero no puede entrar a HelpDesk:
1.  El sistema corre una sincronización automática cada noche.
2.  Para forzar manual: Solicite al administrador de servidor correr `php artisan glpi:import-users`.

### 8.3 Reportes y Estadísticas
Acceso: Menú **Estadísticas**.
Muestra gráficas de:
*   Tickets por Estado.
*   Tickets por Técnico (Carga laboral).
*   Satisfacción (basado en encuestas).
*   Top Categorías de fallas.
Use los filtros de fecha para generar informes mensuales de gestión.

---

## 9. Preguntas Frecuentes (FAQ)

**P: ¿El sistema funciona fuera del hospital?**
R: No directamente. Requiere conexión VPN por seguridad de los datos de los pacientes.

**P: ¿Puedo usar el sistema desde mi celular?**
R: Sí, la interfaz es totalmente responsiva y se adapta a pantallas móviles de iOS y Android.

**P: Reporté un ticket por error, ¿cómo lo borro?**
R: Los usuarios no pueden borrar tickets por auditoría. Agregue un comentario solicitando la anulación y un técnico lo cerrará como "Cancelado".

**P: ¿Qué navegador se recomienda?**
R: Google Chrome, Microsoft Edge o Mozilla Firefox en sus versiones recientes. Internet Explorer no es soportado.

**P: ¿El chat con el robot es con una persona real?**
R: No, es inteligencia artificial. Si el robot no puede ayudar, él mismo ofrecerá crear un ticket para que un humano lo atienda.

---
**Departamento de Innovación y Desarrollo - HUV**
