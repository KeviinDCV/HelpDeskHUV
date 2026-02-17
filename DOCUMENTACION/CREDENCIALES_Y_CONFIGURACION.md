# INNOVACIÓN Y DESARROLLO - HOSPITAL UNIVERSITARIO DEL VALLE
## HELPDESK HUV

---

# CREDENCIALES Y CONFIGURACIÓN DEL SISTEMA

## GUÍA COMPLETA DE INSTALACIÓN, DESPLIEGUE Y ADMINISTRACIÓN

**Versión del Documento:** 1.0.0
**Fecha de Elaboración:** 05 de Febrero de 2026
**Autor:** Área de Innovación y Desarrollo — HUV

---

## TABLA DE CONTENIDO

1. [Introducción y Propósito](#1-introducción-y-propósito)
2. [Requisitos del Entorno de Servidor](#2-requisitos-del-entorno-de-servidor)
3. [Preparación del Sistema Operativo](#3-preparación-del-sistema-operativo)
4. [Instalación de Dependencias de Software](#4-instalación-de-dependencias-de-software)
5. [Configuración del Servidor Web](#5-configuración-del-servidor-web)
6. [Configuración de la Base de Datos](#6-configuración-de-la-base-de-datos)
7. [Despliegue de la Aplicación](#7-despliegue-de-la-aplicación)
8. [Variables de Entorno (.env)](#8-variables-de-entorno-env)
9. [Compilación de Assets Frontend](#9-compilación-de-assets-frontend)
10. [Inicialización del Sistema](#10-inicialización-del-sistema)
11. [Credenciales de Acceso](#11-credenciales-de-acceso)
12. [Configuración de Servicios Externos](#12-configuración-de-servicios-externos)
13. [Configuración de Correo Electrónico](#13-configuración-de-correo-electrónico)
14. [Configuración de Seguridad SSL/TLS](#14-configuración-de-seguridad-ssltls)
15. [Tareas Programadas (Cron Jobs)](#15-tareas-programadas-cron-jobs)
16. [Copias de Seguridad y Recuperación](#16-copias-de-seguridad-y-recuperación)
17. [Monitoreo y Logs del Sistema](#17-monitoreo-y-logs-del-sistema)
18. [Comandos Artisan Personalizados](#18-comandos-artisan-personalizados)
19. [Solución de Problemas Comunes](#19-solución-de-problemas-comunes)
20. [Actualización del Sistema](#20-actualización-del-sistema)
21. [Consideraciones de Seguridad](#21-consideraciones-de-seguridad)
22. [Lista de Verificación de Despliegue](#22-lista-de-verificación-de-despliegue)

---

## 1. Introducción y Propósito

### 1.1 Objetivo del Documento

Este documento técnico proporciona la información crítica y detallada necesaria para la instalación, configuración, despliegue y mantenimiento del sistema **HelpDesk HUV** en entornos de servidor. Está dirigido exclusivamente a administradores de sistemas, personal de infraestructura tecnológica y desarrolladores autorizados del Hospital Universitario del Valle.

### 1.2 Audiencia Objetivo

| Rol | Secciones Relevantes |
| :--- | :--- |
| Administrador de Sistemas | Secciones 2-10, 14-17, 22 |
| Desarrollador / DevOps | Todas las secciones |
| DBA (Administrador de Base de Datos) | Secciones 6, 8, 16 |
| Oficial de Seguridad | Secciones 11, 14, 21 |
| Técnico de Soporte Nivel 2+ | Secciones 11, 17, 19 |

### 1.3 Convenciones del Documento

A lo largo de este documento se utilizan las siguientes convenciones:

- Los comandos de terminal se presentan en bloques de código con el prompt correspondiente (`$` para Linux/bash, `>` para Windows/PowerShell).
- Las rutas de archivo se presentan en formato absoluto cuando es crítico, o relativo al directorio raíz del proyecto.
- Los valores que deben ser reemplazados por el administrador se indican entre corchetes angulares: `<valor_a_reemplazar>`.
- Las credenciales de ejemplo mostradas en este documento son ilustrativas. Las credenciales reales se entregan por separado en sobre sellado.

### 1.4 Advertencias de Seguridad

> ⚠️ **ADVERTENCIA DE SEGURIDAD**
> 
> Este documento contiene información sensible que incluye procedimientos de acceso, comandos con privilegios elevados y referencias a credenciales. Debe ser tratado como información confidencial y almacenado de forma segura. No debe ser compartido fuera del equipo técnico autorizado ni publicado en repositorios públicos.

> ⚠️ **IMPORTANTE: COPIAS DE SEGURIDAD**
> 
> Antes de realizar cualquier procedimiento de instalación o actualización, asegúrese de contar con una copia de seguridad reciente y verificada de la base de datos y del código fuente. Los procedimientos descritos pueden resultar en pérdida de datos si no se siguen correctamente.

---

## 2. Requisitos del Entorno de Servidor

### 2.1 Requisitos de Hardware

Para asegurar la estabilidad y el rendimiento óptimo de la aplicación HelpDesk HUV, el servidor anfitrión debe cumplir con los siguientes requisitos de hardware:

#### 2.1.1 Configuración Mínima (Desarrollo/Pruebas)

| Recurso | Especificación |
| :--- | :--- |
| **Procesador** | 2 vCPU (Arquitectura x64) |
| **Memoria RAM** | 4 GB |
| **Almacenamiento** | 20 GB de espacio libre en disco (HDD o SSD) |
| **Red** | Conexión de red de 100 Mbps |
| **Concurrencia Estimada** | Hasta 10 usuarios simultáneos |

#### 2.1.2 Configuración Recomendada (Producción)

| Recurso | Especificación |
| :--- | :--- |
| **Procesador** | 4+ vCPU (Arquitectura x64, Intel Xeon o AMD EPYC equivalente) |
| **Memoria RAM** | 8 GB (16 GB para alta concurrencia o procesos de exportación masiva) |
| **Almacenamiento** | 50+ GB de espacio libre en disco SSD NVMe |
| **Red** | Conexión de red de 1 Gbps |
| **Concurrencia Estimada** | Hasta 100+ usuarios simultáneos |

#### 2.1.3 Consideraciones Adicionales de Hardware

- **Almacenamiento SSD:** Se recomienda encarecidamente el uso de almacenamiento SSD para la partición donde reside la base de datos y el directorio de la aplicación. Las operaciones de E/S intensivas (consultas complejas, exportaciones a Excel, carga de logs) se benefician significativamente del bajo tiempo de acceso de los SSD.

- **RAID:** En entornos de producción críticos, considere configurar arreglos RAID 1 (espejo) o RAID 10 para protección contra fallas de disco.

- **Separación de Servicios:** Para entornos de alta disponibilidad, considere separar el servidor web y el servidor de base de datos en máquinas distintas, con el servidor de base de datos en una red privada no accesible directamente desde Internet.

### 2.2 Requisitos de Software Base

#### 2.2.1 Sistema Operativo

El sistema HelpDesk HUV es compatible con los siguientes sistemas operativos:

| Sistema Operativo | Versión | Soporte |
| :--- | :--- | :--- |
| **Ubuntu Server** | 22.04 LTS (Jammy Jellyfish) | ✅ Recomendado para producción |
| **Ubuntu Server** | 24.04 LTS | ✅ Compatible |
| **Debian** | 11 (Bullseye) | ✅ Compatible |
| **Debian** | 12 (Bookworm) | ✅ Compatible |
| **Windows Server** | 2019 | ✅ Compatible (con Laragon/XAMPP) |
| **Windows Server** | 2022 | ✅ Compatible (con Laragon/XAMPP) |
| **Windows 10/11** | Cualquier versión | ✅ Solo para desarrollo local |
| **macOS** | 12+ (Monterey) | ✅ Solo para desarrollo local |

#### 2.2.2 Requisitos de PHP

La aplicación requiere **PHP versión 8.2 o superior**. Las siguientes extensiones de PHP son obligatorias:

| Extensión | Propósito | Verificación |
| :--- | :--- | :--- |
| `bcmath` | Operaciones matemáticas de precisión arbitraria | `php -m | grep bcmath` |
| `ctype` | Validación de tipos de caracteres | `php -m | grep ctype` |
| `curl` | Comunicación HTTP con servicios externos (APIs de IA) | `php -m | grep curl` |
| `dom` | Manipulación de documentos XML/HTML | `php -m | grep dom` |
| `fileinfo` | Detección de tipos MIME de archivos | `php -m | grep fileinfo` |
| `gd` | Procesamiento de imágenes (avatares, adjuntos) | `php -m | grep gd` |
| `intl` | Internacionalización y formateo de fechas/números | `php -m | grep intl` |
| `json` | Codificación/decodificación JSON | `php -m | grep json` |
| `mbstring` | Manejo de cadenas multibyte (UTF-8) | `php -m | grep mbstring` |
| `openssl` | Encriptación y comunicaciones seguras | `php -m | grep openssl` |
| `pdo` | Abstracción de acceso a bases de datos | `php -m | grep pdo` |
| `pdo_mysql` | Driver específico para MySQL/MariaDB | `php -m | grep pdo_mysql` |
| `tokenizer` | Análisis de tokens PHP (requerido por Blade) | `php -m | grep tokenizer` |
| `xml` | Procesamiento de documentos XML | `php -m | grep xml` |
| `zip` | Compresión de archivos (exportación Excel) | `php -m | grep zip` |

**Opcional pero recomendado:**
- `opcache` — Mejora significativa de rendimiento mediante caché de bytecode PHP.
- `redis` — Si se desea utilizar Redis como driver de caché/sesiones en lugar de file/database.
- `ldap` — Si se planea implementar autenticación contra Active Directory en futuras versiones.

#### 2.2.3 Requisitos del Servidor Web

Se soportan los siguientes servidores web:

| Servidor Web | Versión Mínima | Notas |
| :--- | :--- | :--- |
| **Apache** | 2.4+ | Requiere `mod_rewrite` habilitado |
| **Nginx** | 1.18+ | Recomendado para alto tráfico |

#### 2.2.4 Requisitos de Base de Datos

| Motor | Versión Mínima | Notas |
| :--- | :--- | :--- |
| **MySQL** | 8.0+ | Motor predeterminado |
| **MariaDB** | 10.6+ | Compatible, recomendado para entornos Linux |

**Requisito Crítico:** Debe existir una base de datos **GLPI** preexistente o importada, ya que HelpDesk HUV opera sobre su esquema de datos (tablas `glpi_*`). El sistema no funciona sin esta base de datos.

#### 2.2.5 Requisitos de Node.js

| Componente | Versión | Propósito |
| :--- | :--- | :--- |
| **Node.js** | 18.x LTS o 20.x LTS | Runtime para compilación de assets |
| **npm** | 9.x+ o 10.x+ | Gestor de paquetes JavaScript |

**Nota:** Node.js solo es necesario durante el proceso de compilación (build) de los assets frontend. No se requiere en tiempo de ejecución una vez desplegada la aplicación, a menos que se active Server-Side Rendering (SSR).

#### 2.2.6 Requisitos de Composer

| Componente | Versión |
| :--- | :--- |
| **Composer** | 2.6+ |

---

## 3. Preparación del Sistema Operativo

### 3.1 Ubuntu Server 22.04 LTS

#### 3.1.1 Actualización del Sistema

Antes de instalar cualquier paquete, asegúrese de que el sistema esté completamente actualizado:

```bash
$ sudo apt update
$ sudo apt upgrade -y
$ sudo apt autoremove -y
```

#### 3.1.2 Instalación de Herramientas Básicas

```bash
$ sudo apt install -y software-properties-common curl wget git unzip zip
```

#### 3.1.3 Configuración del Firewall (UFW)

Configure el firewall para permitir solo el tráfico necesario:

```bash
# Habilitar UFW
$ sudo ufw enable

# Permitir SSH (cambiar puerto si es necesario)
$ sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
$ sudo ufw allow 80/tcp
$ sudo ufw allow 443/tcp

# Verificar estado
$ sudo ufw status
```

#### 3.1.4 Configuración de Zona Horaria

Es importante que el servidor tenga configurada la zona horaria correcta para el registro de fechas en tickets y logs:

```bash
# Configurar zona horaria de Colombia
$ sudo timedatectl set-timezone America/Bogota

# Verificar configuración
$ timedatectl
```

### 3.2 Windows Server 2019/2022

#### 3.2.1 Instalación de Laragon (Recomendado)

Para entornos Windows, se recomienda utilizar **Laragon** como stack de desarrollo/producción, ya que incluye Apache, PHP, MySQL y Node.js preconfigurados.

1. Descargar Laragon Full desde: https://laragon.org/download/
2. Ejecutar el instalador y seguir las instrucciones.
3. Durante la instalación, seleccionar PHP 8.2+ y MySQL 8.0+.
4. Una vez instalado, Laragon estará disponible en `C:\laragon`.

#### 3.2.2 Configuración de Variables de Entorno (Windows)

Asegurarse de que las siguientes rutas estén en la variable de entorno `PATH`:

```
C:\laragon\bin\php\php-8.2.x-Win32-vs16-x64
C:\laragon\bin\mysql\mysql-8.0.x-winx64\bin
C:\laragon\bin\nodejs\node-vxx.x
C:\laragon\bin\git\bin
```

---

## 4. Instalación de Dependencias de Software

### 4.1 Instalación de PHP 8.2+ (Ubuntu)

```bash
# Agregar repositorio de PHP de Ondřej Surý
$ sudo add-apt-repository ppa:ondrej/php -y
$ sudo apt update

# Instalar PHP 8.2 con extensiones requeridas
$ sudo apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-common \
    php8.2-mysql php8.2-zip php8.2-gd php8.2-mbstring php8.2-curl \
    php8.2-xml php8.2-bcmath php8.2-intl php8.2-readline php8.2-opcache

# Verificar instalación
$ php -v
# PHP 8.2.x (cli) ...

# Verificar extensiones instaladas
$ php -m
```

### 4.2 Configuración de PHP (php.ini)

Localice el archivo `php.ini` y modifique las siguientes directivas:

**Ubicación del archivo:**
- Ubuntu (CLI): `/etc/php/8.2/cli/php.ini`
- Ubuntu (FPM): `/etc/php/8.2/fpm/php.ini`
- Windows (Laragon): `C:\laragon\bin\php\php-8.2.x\php.ini`

**Directivas críticas a modificar:**

```ini
; Límite de memoria (mínimo 512M, recomendado 1G para exportaciones masivas)
memory_limit = 1G

; Tiempo máximo de ejecución (para procesos largos de exportación)
max_execution_time = 120

; Tamaño máximo de POST (para adjuntos de evidencia)
post_max_size = 50M

; Tamaño máximo de archivo subido
upload_max_filesize = 50M

; Número máximo de variables de entrada (formularios complejos)
max_input_vars = 5000

; Zona horaria
date.timezone = America/Bogota

; Habilitar OPCache para producción
opcache.enable = 1
opcache.memory_consumption = 256
opcache.interned_strings_buffer = 16
opcache.max_accelerated_files = 20000
opcache.validate_timestamps = 0  ; Desactivar en producción para máximo rendimiento
opcache.revalidate_freq = 0

; Ocultar versión de PHP en cabeceras HTTP
expose_php = Off

; Registro de errores (producción)
display_errors = Off
display_startup_errors = Off
log_errors = On
error_log = /var/log/php/error.log
```

Después de modificar el archivo, reinicie PHP-FPM (si aplica):

```bash
$ sudo systemctl restart php8.2-fpm
```

### 4.3 Instalación de Composer

```bash
# Descargar e instalar Composer globalmente
$ curl -sS https://getcomposer.org/installer | php
$ sudo mv composer.phar /usr/local/bin/composer

# Verificar instalación
$ composer --version
# Composer version 2.x.x ...
```

### 4.4 Instalación de Node.js y npm

```bash
# Instalar Node.js 20.x LTS mediante NodeSource
$ curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
$ sudo apt install -y nodejs

# Verificar instalación
$ node -v
# v20.x.x

$ npm -v
# 10.x.x
```

### 4.5 Instalación de MySQL/MariaDB (Ubuntu)

```bash
# Instalar MySQL Server 8.0
$ sudo apt install -y mysql-server

# Iniciar y habilitar el servicio
$ sudo systemctl start mysql
$ sudo systemctl enable mysql

# Ejecutar script de seguridad (configurar contraseña root, eliminar usuarios anónimos, etc.)
$ sudo mysql_secure_installation
```

**Alternativa: MariaDB**

```bash
$ sudo apt install -y mariadb-server
$ sudo systemctl start mariadb
$ sudo systemctl enable mariadb
$ sudo mysql_secure_installation
```

### 4.6 Instalación de Apache (Ubuntu)

```bash
# Instalar Apache
$ sudo apt install -y apache2

# Habilitar módulos necesarios
$ sudo a2enmod rewrite
$ sudo a2enmod headers
$ sudo a2enmod ssl
$ sudo a2enmod proxy_fcgi setenvif

# Habilitar configuración de PHP-FPM
$ sudo a2enconf php8.2-fpm

# Reiniciar Apache
$ sudo systemctl restart apache2
```

### 4.7 Instalación de Nginx (Alternativa a Apache)

```bash
# Instalar Nginx
$ sudo apt install -y nginx

# Iniciar y habilitar el servicio
$ sudo systemctl start nginx
$ sudo systemctl enable nginx
```

---

## 5. Configuración del Servidor Web

### 5.1 Configuración de Apache VirtualHost

Cree un archivo de configuración para el sitio:

```bash
$ sudo nano /etc/apache2/sites-available/helpdesk.conf
```

Contenido del archivo:

```apache
<VirtualHost *:80>
    ServerName helpdesk.huv.gov.co
    ServerAlias www.helpdesk.huv.gov.co
    ServerAdmin webmaster@huv.gov.co
    
    DocumentRoot /var/www/helpdesk/public
    
    <Directory /var/www/helpdesk/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Logs
    ErrorLog ${APACHE_LOG_DIR}/helpdesk-error.log
    CustomLog ${APACHE_LOG_DIR}/helpdesk-access.log combined
    
    # Cabeceras de seguridad
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Deshabilitar listado de directorios
    <Directory /var/www/helpdesk>
        Options -Indexes
    </Directory>
    
    # Proteger archivos sensibles
    <FilesMatch "^\.env">
        Require all denied
    </FilesMatch>
    
    <FilesMatch "\.(sql|log|md|sh|bat)$">
        Require all denied
    </FilesMatch>
</VirtualHost>
```

Habilitar el sitio:

```bash
$ sudo a2ensite helpdesk.conf
$ sudo a2dissite 000-default.conf  # Deshabilitar sitio por defecto (opcional)
$ sudo systemctl reload apache2
```

### 5.2 Configuración de Nginx

Cree un archivo de configuración:

```bash
$ sudo nano /etc/nginx/sites-available/helpdesk
```

Contenido del archivo:

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name helpdesk.huv.gov.co www.helpdesk.huv.gov.co;
    root /var/www/helpdesk/public;
    
    index index.php;
    
    charset utf-8;
    
    # Logs
    access_log /var/log/nginx/helpdesk-access.log;
    error_log /var/log/nginx/helpdesk-error.log;
    
    # Cabeceras de seguridad
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Tamaño máximo de subida
    client_max_body_size 50M;
    
    # Ruta principal (Inertia SPA)
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    # Archivos estáticos (caché agresivo)
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Procesamiento PHP vía FPM
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 120;
    }
    
    # Denegar acceso a archivos sensibles
    location ~ /\.(?!well-known).* {
        deny all;
    }
    
    location ~ \.(env|sql|log|md|sh|bat)$ {
        deny all;
    }
    
    # Denegar acceso a carpetas sensibles
    location ~ ^/(storage|bootstrap/cache) {
        deny all;
    }
}
```

Habilitar el sitio:

```bash
$ sudo ln -s /etc/nginx/sites-available/helpdesk /etc/nginx/sites-enabled/
$ sudo nginx -t  # Verificar sintaxis
$ sudo systemctl reload nginx
```

### 5.3 Configuración para Windows (Laragon)

En Laragon, la configuración del VirtualHost se genera automáticamente. Siga estos pasos:

1. Coloque el proyecto en `C:\laragon\www\helpdesk`.
2. Haga clic derecho en el ícono de Laragon en la bandeja del sistema.
3. Seleccione **Apache** → **sites-enabled** → **Auto virtual hosts**.
4. Reinicie Apache desde el panel de Laragon.
5. El sitio estará disponible en `http://helpdesk.test`.

Para un alias personalizado, edite el archivo `C:\laragon\etc\apache2\sites-enabled\auto.helpdesk.test.conf`.

---

## 6. Configuración de la Base de Datos

### 6.1 Creación de Usuario y Base de Datos

> ⚠️ **IMPORTANTE:** HelpDesk HUV utiliza la misma base de datos que GLPI. No cree una base de datos nueva a menos que esté migrando o instalando GLPI desde cero.

Conectarse a MySQL como root:

```bash
$ sudo mysql -u root -p
```

Crear un usuario específico para la aplicación (si no existe):

```sql
-- Crear usuario (reemplace 'helpdesk_user' y 'contraseña_segura' con valores reales)
CREATE USER 'helpdesk_user'@'localhost' IDENTIFIED BY 'contraseña_segura';

-- Si la base de datos GLPI ya existe, otorgar permisos sobre ella
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER, DROP, REFERENCES 
    ON glpi_huv.* TO 'helpdesk_user'@'localhost';

-- Aplicar cambios de privilegios
FLUSH PRIVILEGES;

-- Salir
EXIT;
```

### 6.2 Configuración de MySQL para Producción

Edite el archivo de configuración de MySQL:

```bash
$ sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Agregue o modifique las siguientes directivas en la sección `[mysqld]`:

```ini
[mysqld]
# Charset y collation para soporte UTF-8 completo
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Pool de conexiones
max_connections = 200

# Tamaño de buffer para consultas
innodb_buffer_pool_size = 1G  # Ajustar según RAM disponible (50-70% de RAM)

# Logs de consultas lentas (útil para debugging)
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Seguridad
bind-address = 127.0.0.1  # Solo conexiones locales
```

Reiniciar MySQL:

```bash
$ sudo systemctl restart mysql
```

### 6.3 Migración de Base de Datos GLPI

Si está instalando el sistema por primera vez y tiene un archivo de volcado (dump) de base de datos GLPI, impórtelo:

```bash
$ mysql -u helpdesk_user -p glpi_huv < /ruta/al/archivo/glpi_backup.sql
```

### 6.4 Verificación de Tablas GLPI Requeridas

El sistema HelpDesk HUV requiere que las siguientes tablas GLPI existan y contengan datos:

```sql
-- Tablas de Tickets
glpi_tickets
glpi_tickets_users
glpi_items_tickets
glpi_itilsolutions
glpi_itilcategories

-- Tablas de Activos
glpi_computers
glpi_monitors
glpi_printers
glpi_phones
glpi_peripherals
glpi_networkequipments
glpi_softwares
glpi_consumableitems

-- Tablas de Relaciones
glpi_computers_items
glpi_items_softwareversions
glpi_softwareversions
glpi_softwarelicenses

-- Tablas de Catálogos
glpi_entities
glpi_states
glpi_manufacturers
glpi_locations
glpi_computertypes
glpi_computermodels
-- ... y demás tablas de tipos/modelos

-- Tablas de Usuarios
glpi_users
glpi_useremails

-- Tablas de Documentos
glpi_documents
glpi_documents_items

-- Tablas de Logs
glpi_logs
```

Verifique su existencia:

```sql
SHOW TABLES LIKE 'glpi_%';
```

---

## 7. Despliegue de la Aplicación

### 7.1 Clonación del Repositorio

```bash
# Crear directorio de destino
$ sudo mkdir -p /var/www/helpdesk
$ cd /var/www

# Clonar repositorio (reemplace la URL con la del repositorio institucional)
$ sudo git clone https://repo.huv.gov.co/innovacion/helpdesk.git helpdesk

# Cambiar al directorio del proyecto
$ cd helpdesk
```

### 7.2 Configuración de Permisos (Linux)

```bash
# Cambiar propietario al usuario del servidor web
$ sudo chown -R www-data:www-data /var/www/helpdesk

# Permisos de directorios
$ sudo find /var/www/helpdesk -type d -exec chmod 755 {} \;

# Permisos de archivos
$ sudo find /var/www/helpdesk -type f -exec chmod 644 {} \;

# Permisos especiales para directorios que requieren escritura
$ sudo chmod -R 775 /var/www/helpdesk/storage
$ sudo chmod -R 775 /var/www/helpdesk/bootstrap/cache

# Permisos para el archivo .env (lectura solo por propietario)
$ sudo chmod 600 /var/www/helpdesk/.env
```

### 7.3 Instalación de Dependencias PHP (Composer)

```bash
$ cd /var/www/helpdesk

# Instalación para producción (sin paquetes de desarrollo)
$ composer install --optimize-autoloader --no-dev

# O para desarrollo (incluye herramientas de testing)
$ composer install
```

**Parámetros explicados:**
- `--optimize-autoloader`: Genera un mapa de clases optimizado para mejor rendimiento.
- `--no-dev`: Excluye paquetes de desarrollo (phpunit, faker, pint, etc.) para reducir el tamaño del directorio `vendor/`.

### 7.4 Instalación de Dependencias JavaScript (npm)

```bash
$ cd /var/www/helpdesk

# Instalación limpia de dependencias
$ npm ci

# O instalación estándar
$ npm install
```

**Nota sobre `npm ci` vs `npm install`:**
- `npm ci` (clean install) elimina `node_modules` existente e instala exactamente las versiones del `package-lock.json`. Recomendado para producción y CI/CD.
- `npm install` puede actualizar dependencias y modificar el lock file.

---

## 8. Variables de Entorno (.env)

### 8.1 Creación del Archivo .env

Copie el archivo de ejemplo y edítelo:

```bash
$ cd /var/www/helpdesk
$ cp .env.example .env
$ nano .env
```

### 8.2 Configuración Completa del Archivo .env

A continuación se presenta la configuración completa con explicaciones detalladas:

```ini
#==========================================================
# CONFIGURACIÓN GENERAL DE LA APLICACIÓN
#==========================================================

# Nombre de la aplicación (aparece en pestañas del navegador y correos)
APP_NAME="HelpDesk HUV"

# Entorno de ejecución: local, staging, production
# IMPORTANTE: En producción siempre usar "production"
APP_ENV=production

# Clave de encriptación (generar con: php artisan key:generate)
# NUNCA compartir esta clave. Es única por instalación.
APP_KEY=base64:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Modo debug: true muestra errores detallados (SOLO para desarrollo)
# IMPORTANTE: En producción SIEMPRE debe ser false
APP_DEBUG=false

# Zona horaria de la aplicación
APP_TIMEZONE=America/Bogota

# URL base de la aplicación (sin barra final)
APP_URL=https://helpdesk.huv.gov.co

# Locale por defecto
APP_LOCALE=es
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=es_CO

#==========================================================
# CONFIGURACIÓN DE BASE DE DATOS (GLPI)
#==========================================================

# Driver de base de datos
DB_CONNECTION=mysql

# Servidor de base de datos (localhost o IP del servidor)
DB_HOST=127.0.0.1

# Puerto de MySQL (3306 por defecto)
DB_PORT=3306

# Nombre de la base de datos GLPI
# IMPORTANTE: Esta es la base de datos de GLPI existente
DB_DATABASE=glpi_huv

# Credenciales de acceso a la base de datos
# IMPORTANTE: Usar un usuario con permisos limitados, no root
DB_USERNAME=helpdesk_user
DB_PASSWORD=contraseña_segura_aqui

# Charset y collation para UTF-8 completo
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci

#==========================================================
# CONFIGURACIÓN DE SESIONES
#==========================================================

# Driver de sesiones: file, cookie, database, redis, memcached
SESSION_DRIVER=database

# Tiempo de vida de la sesión en minutos
SESSION_LIFETIME=120

# Encriptar datos de sesión
SESSION_ENCRYPT=true

# Prefijo para la cookie de sesión
SESSION_COOKIE=helpdesk_session

# Ruta de la cookie
SESSION_PATH=/

# Dominio de la cookie (null usa el dominio actual)
SESSION_DOMAIN=null

# Cookie solo sobre HTTPS
SESSION_SECURE_COOKIE=true

# Atributo SameSite de la cookie
SESSION_SAME_SITE=lax

#==========================================================
# CONFIGURACIÓN DE CACHÉ
#==========================================================

# Driver de caché: file, database, redis, memcached
CACHE_DRIVER=database

# Prefijo para claves de caché
CACHE_PREFIX=helpdesk_cache

#==========================================================
# CONFIGURACIÓN DE COLAS (QUEUES)
#==========================================================

# Driver de colas: sync, database, redis, sqs
QUEUE_CONNECTION=database

#==========================================================
# CONFIGURACIÓN DE CORREO ELECTRÓNICO
#==========================================================

# Driver de correo: smtp, sendmail, mailgun, ses, postmark
MAIL_MAILER=smtp

# Servidor SMTP
MAIL_HOST=mail.huv.gov.co

# Puerto SMTP (587 para TLS, 465 para SSL, 25 sin cifrado)
MAIL_PORT=587

# Credenciales SMTP
MAIL_USERNAME=notificaciones@huv.gov.co
MAIL_PASSWORD=password_correo_aqui

# Cifrado: tls, ssl, null
MAIL_ENCRYPTION=tls

# Dirección de remitente por defecto
MAIL_FROM_ADDRESS=helpdesk@huv.gov.co
MAIL_FROM_NAME="HelpDesk HUV"

#==========================================================
# CONFIGURACIÓN DE LOGS
#==========================================================

# Canal de logs: single, daily, slack, papertrail, stack
LOG_CHANNEL=daily

# Nivel de log: debug, info, notice, warning, error, critical, alert, emergency
LOG_LEVEL=warning

# Días de retención de logs (para 'daily')
LOG_DAILY_DAYS=14

#==========================================================
# CONFIGURACIÓN DE SEGURIDAD
#==========================================================

# Habilitar HTTPS forzado
FORCE_HTTPS=true

# Algoritmo de hash para contraseñas
BCRYPT_ROUNDS=12

#==========================================================
# SERVICIOS EXTERNOS - INTELIGENCIA ARTIFICIAL
#==========================================================

# API Key de OpenRouter para el chatbot y clasificación automática
# Obtener en: https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# URL base de OpenRouter API
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Modelo de IA a utilizar (modelo gratuito recomendado)
OPENROUTER_MODEL=z-ai/glm-4.5-air:free

#==========================================================
# CONFIGURACIÓN DE ALMACENAMIENTO
#==========================================================

# Driver de filesystem: local, public, s3
FILESYSTEM_DISK=local

# Ruta de archivos de GLPI (para servir adjuntos)
GLPI_FILES_PATH=/var/www/glpi/files

#==========================================================
# CONFIGURACIÓN DE BROADCASTING (WebSockets - Futuro)
#==========================================================

# Driver: null, pusher, ably, reverb
BROADCAST_CONNECTION=null
```

### 8.3 Generación de la Clave de Encriptación

Después de crear el archivo `.env`, genere la clave de encriptación:

```bash
$ php artisan key:generate
```

Este comando actualizará automáticamente el valor de `APP_KEY` en el archivo `.env`.

---

## 9. Compilación de Assets Frontend

### 9.1 Compilación para Producción

```bash
$ cd /var/www/helpdesk

# Compilar assets optimizados para producción
$ npm run build
```

Este comando:
1. Compila los archivos TypeScript/React a JavaScript.
2. Compila Tailwind CSS y purga las clases no utilizadas.
3. Minifica y optimiza todos los archivos.
4. Genera hashes en los nombres de archivo para cache busting.
5. Coloca los archivos resultantes en `public/build/`.

### 9.2 Compilación para Desarrollo

```bash
# Iniciar servidor de desarrollo con Hot Module Replacement (HMR)
$ npm run dev
```

**Nota:** El comando `npm run dev` inicia un servidor de desarrollo en el puerto 5173. Este modo solo debe usarse durante el desarrollo local.

### 9.3 Verificación de la Compilación

Después de la compilación, verifique que existan los archivos en `public/build/`:

```bash
$ ls -la public/build/assets/
```

Debería ver archivos `.js` y `.css` con hashes en sus nombres.

---

## 10. Inicialización del Sistema

### 10.1 Enlace Simbólico de Storage

Cree el enlace simbólico que permite acceder públicamente a los archivos almacenados (avatares, adjuntos):

```bash
$ php artisan storage:link
```

Esto crea un enlace de `public/storage` a `storage/app/public`.

### 10.2 Limpiar Cachés

```bash
# Limpiar toda la caché
$ php artisan optimize:clear

# O individualmente:
$ php artisan config:clear
$ php artisan cache:clear
$ php artisan route:clear
$ php artisan view:clear
```

### 10.3 Ejecutar Migraciones de Base de Datos

> ⚠️ **ADVERTENCIA:** Las migraciones crean tablas adicionales e índices sobre la base de datos GLPI existente. Asegúrese de tener un respaldo antes de ejecutar este comando.

```bash
# Ejecutar migraciones
$ php artisan migrate

# En producción, usar --force para confirmar
$ php artisan migrate --force
```

Las migraciones creadas por HelpDesk HUV incluyen:

| Migración | Tabla/Cambio |
| :--- | :--- |
| `create_users_table` | Tabla `users` de Laravel con campos adicionales |
| `create_cache_table` | Tablas `cache` y `cache_locks` |
| `create_jobs_table` | Tablas `jobs`, `job_batches`, `failed_jobs` |
| `add_performance_indexes` | Índices de rendimiento en tablas GLPI |
| `add_two_factor_columns` | Campos 2FA en tabla `users` |
| `add_username` | Campo `username` en tabla `users` |
| `add_phone_and_avatar` | Campos `phone` y `avatar` en tabla `users` |
| `create_notifications` | Tabla `notifications` |
| `add_glpi_user_id` | Campo `glpi_user_id` en tabla `users` |
| `create_templates` | Tabla `templates` (futura funcionalidad) |
| `update_redes_categories` | Modificaciones a categorías GLPI de Redes |

### 10.4 Optimizar para Producción

```bash
# Cachear configuración (SOLO producción con APP_DEBUG=false)
$ php artisan config:cache

# Cachear rutas
$ php artisan route:cache

# Cachear vistas
$ php artisan view:cache

# O todo junto:
$ php artisan optimize
```

### 10.5 Importar Usuarios desde GLPI

Si desea importar los usuarios existentes de GLPI al sistema HelpDesk HUV:

```bash
$ php artisan glpi:import-users
```

Este comando:
- Lee usuarios activos de la tabla `glpi_users`.
- Crea registros correspondientes en la tabla Laravel `users`.
- Genera correos electrónicos a partir del nombre de usuario si no existen.
- Asigna una contraseña temporal (`admin123`) que debe ser cambiada.
- Asigna el rol `Técnico` por defecto.

---

## 11. Credenciales de Acceso

### 11.1 Credenciales Predeterminadas de GLPI

Si la base de datos GLPI es una instalación nueva o estándar, las credenciales por defecto son:

| Perfil | Usuario | Contraseña | Notas |
| :--- | :--- | :--- | :--- |
| Super-Admin | `glpi` | `glpi` | Acceso total al sistema |
| Técnico | `tech` | `tech` | Perfil de técnico de soporte |
| Normal | `normal` | `normal` | Perfil de usuario básico |
| Post-only | `post-only` | `postonly` | Solo puede crear tickets |

> ⚠️ **IMPORTANTE:** Cambie estas contraseñas inmediatamente después de la instalación.

### 11.2 Credenciales del Administrador HelpDesk HUV

Después de la instalación e importación de usuarios, puede crear un administrador específico para HelpDesk HUV:

```bash
# Usar tinker para crear un usuario administrador
$ php artisan tinker

>>> \App\Models\User::create([
    'name' => 'Administrador HelpDesk',
    'username' => 'admin.helpdesk',
    'email' => 'admin.helpdesk@huv.gov.co',
    'password' => bcrypt('contraseña_segura_inicial'),
    'role' => 'Administrador',
    'is_active' => true,
]);
>>> exit
```

### 11.3 Roles del Sistema

| Rol | Descripción | Permisos Principales |
| :--- | :--- | :--- |
| **Administrador** | Control total del sistema | Gestionar usuarios, asignar tickets, crear/editar/eliminar inventario, ver todas las estadísticas |
| **Técnico** | Personal de soporte técnico | Tomar tickets, resolver tickets, consultar inventario, crear tickets internos |
| **Usuario** | Usuario final/solicitante | Crear tickets, consultar estado de sus tickets |

### 11.4 Proceso de Cambio de Contraseña

Los usuarios pueden cambiar su contraseña desde:
1. Menú de usuario → Configuración → Contraseña
2. O mediante el formulario "Olvidé mi contraseña" en la pantalla de login (requiere correo configurado)

---

## 12. Configuración de Servicios Externos

### 12.1 OpenRouter API (Inteligencia Artificial)

HelpDesk HUV utiliza OpenRouter para las siguientes funcionalidades:

- Chatbot Evarisbot: Asistente virtual para creación guiada de tickets.
- Clasificación Automática: Análisis de reportes públicos para sugerir categorías.
- Mejora de Descripciones: Reescritura de títulos y descripciones de tickets para mayor claridad.

#### 12.1.1 Obtención de API Key

1. Visite https://openrouter.ai/
2. Cree una cuenta o inicie sesión.
3. Navegue a la sección "Keys" en su dashboard.
4. Genere una nueva API Key.
5. Copie la clave (comienza con `sk-or-v1-...`).
6. Agregue la clave en el archivo `.env`:

```ini
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 12.1.2 Modelos Disponibles

El sistema está configurado para usar el modelo `z-ai/glm-4.5-air:free` que es gratuito. Otros modelos disponibles:

| Modelo | Costo | Notas |
| :--- | :--- | :--- |
| `z-ai/glm-4.5-air:free` | Gratis | Modelo predeterminado, suficiente para clasificación |
| `openai/gpt-4o-mini` | Variable | Mayor precisión, requiere créditos |
| `anthropic/claude-3-haiku` | Variable | Alternativa rápida |

### 12.2 Puter.js (Alternativa de IA)

HelpDesk HUV también integra Puter.js como alternativa para el chatbot. Esta integración es del lado del cliente y no requiere configuración de servidor adicional.

**Nota:** Puter.js utiliza el modelo `openai/gpt-4o-mini` internamente.

---

## 13. Configuración de Correo Electrónico

### 13.1 Configuración SMTP Institucional

Para enviar notificaciones por correo (recuperación de contraseña, alertas de tickets urgentes), configure el servidor SMTP institucional:

```ini
MAIL_MAILER=smtp
MAIL_HOST=mail.huv.gov.co      # Servidor de correo del Hospital
MAIL_PORT=587                   # Puerto TLS
MAIL_USERNAME=notificaciones@huv.gov.co
MAIL_PASSWORD=contraseña_correo
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=helpdesk@huv.gov.co
MAIL_FROM_NAME="HelpDesk HUV"
```

### 13.2 Prueba de Envío de Correo

Para verificar que la configuración de correo funciona:

```bash
$ php artisan tinker

>>> Mail::raw('Prueba de correo desde HelpDesk HUV', function($message) {
    $message->to('destinatario@huv.gov.co')
            ->subject('Prueba de Configuración');
});
>>> exit
```

Si no hay errores, el correo debería llegar al destinatario.

### 13.3 Configuración de Cola de Correos

Para envío asíncrono de correos (recomendado en producción):

1. Asegúrese de que `QUEUE_CONNECTION=database` esté configurado.
2. Ejecute el worker de colas (ver sección 15).

---

## 14. Configuración de Seguridad SSL/TLS

### 14.1 Certificado SSL con Let's Encrypt (Recomendado)

Para obtener un certificado SSL gratuito de Let's Encrypt:

```bash
# Instalar Certbot
$ sudo apt install -y certbot python3-certbot-apache

# Obtener certificado (Apache)
$ sudo certbot --apache -d helpdesk.huv.gov.co

# O para Nginx
$ sudo apt install -y python3-certbot-nginx
$ sudo certbot --nginx -d helpdesk.huv.gov.co
```

Certbot configurará automáticamente la renovación del certificado.

### 14.2 Configuración de VirtualHost HTTPS (Apache)

```apache
<VirtualHost *:443>
    ServerName helpdesk.huv.gov.co
    ServerAdmin webmaster@huv.gov.co
    DocumentRoot /var/www/helpdesk/public

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/helpdesk.huv.gov.co/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/helpdesk.huv.gov.co/privkey.pem

    # Configuración de seguridad SSL
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256
    SSLHonorCipherOrder off

    # HSTS (HTTP Strict Transport Security)
    Header always set Strict-Transport-Security "max-age=63072000"

    <Directory /var/www/helpdesk/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/helpdesk-ssl-error.log
    CustomLog ${APACHE_LOG_DIR}/helpdesk-ssl-access.log combined
</VirtualHost>

# Redirección HTTP a HTTPS
<VirtualHost *:80>
    ServerName helpdesk.huv.gov.co
    Redirect permanent / https://helpdesk.huv.gov.co/
</VirtualHost>
```

### 14.3 Renovación Automática del Certificado

Certbot configura automáticamente un cron job para renovación. Verifique:

```bash
$ sudo certbot renew --dry-run
```

Si la prueba es exitosa, la renovación automática funcionará correctamente.

---

## 15. Tareas Programadas (Cron Jobs)

### 15.1 Scheduler de Laravel

Laravel incluye un scheduler que debe ejecutarse cada minuto. Agregue la siguiente entrada al crontab del servidor:

```bash
$ sudo crontab -e
```

Agregue la línea:

```cron
* * * * * cd /var/www/helpdesk && php artisan schedule:run >> /dev/null 2>&1
```

### 15.2 Worker de Colas

Para procesar trabajos en cola (correos, exportaciones grandes), ejecute el worker:

**Opción 1: Supervisor (Recomendado para producción)**

```bash
# Instalar Supervisor
$ sudo apt install -y supervisor

# Crear archivo de configuración
$ sudo nano /etc/supervisor/conf.d/helpdesk-worker.conf
```

Contenido:

```ini
[program:helpdesk-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/helpdesk/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/helpdesk/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
# Recargar Supervisor
$ sudo supervisorctl reread
$ sudo supervisorctl update
$ sudo supervisorctl start helpdesk-worker:*
```

**Opción 2: Systemd Service**

```bash
$ sudo nano /etc/systemd/system/helpdesk-worker.service
```

Contenido:

```ini
[Unit]
Description=HelpDesk Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/helpdesk/artisan queue:work --sleep=3 --tries=3

[Install]
WantedBy=multi-user.target
```

```bash
$ sudo systemctl daemon-reload
$ sudo systemctl enable helpdesk-worker
$ sudo systemctl start helpdesk-worker
```

---

## 16. Copias de Seguridad y Recuperación

### 16.1 Backup de Base de Datos

#### 16.1.1 Backup Manual

```bash
# Crear directorio de backups
$ sudo mkdir -p /var/backups/helpdesk

# Crear backup con fecha
$ mysqldump -u helpdesk_user -p glpi_huv > /var/backups/helpdesk/glpi_huv_$(date +%Y%m%d_%H%M%S).sql

# Comprimir el backup
$ gzip /var/backups/helpdesk/glpi_huv_*.sql
```

#### 16.1.2 Backup Automatizado (Cron)

```bash
$ sudo nano /etc/cron.daily/backup-helpdesk
```

Contenido:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/helpdesk"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Crear backup
mysqldump -u helpdesk_user -pCONTRASEÑA glpi_huv | gzip > $BACKUP_DIR/glpi_huv_$DATE.sql.gz

# Eliminar backups antiguos
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "$(date): Backup completado - glpi_huv_$DATE.sql.gz" >> /var/log/helpdesk-backup.log
```

```bash
$ sudo chmod +x /etc/cron.daily/backup-helpdesk
```

### 16.2 Backup del Código Fuente

```bash
# Crear archivo tar del código (excluyendo vendor y node_modules)
$ tar --exclude='vendor' --exclude='node_modules' --exclude='storage/logs/*' \
    -czvf /var/backups/helpdesk/code_$(date +%Y%m%d).tar.gz /var/www/helpdesk
```

### 16.3 Restauración de Base de Datos

```bash
# Descomprimir backup
$ gunzip /var/backups/helpdesk/glpi_huv_20260205.sql.gz

# Restaurar
$ mysql -u helpdesk_user -p glpi_huv < /var/backups/helpdesk/glpi_huv_20260205.sql

# Ejecutar migraciones (si hay nuevas)
$ cd /var/www/helpdesk
$ php artisan migrate --force
```

### 16.4 Script de Restauración Completa

```bash
#!/bin/bash
# restore_helpdesk.sh

# Variables
BACKUP_SQL="/ruta/al/backup.sql.gz"
BACKUP_CODE="/ruta/al/code.tar.gz"
APP_DIR="/var/www/helpdesk"

echo "=== INICIANDO RESTAURACIÓN DE HELPDESK HUV ==="

# 1. Restaurar código
echo "Restaurando código fuente..."
sudo rm -rf $APP_DIR
sudo tar -xzvf $BACKUP_CODE -C /var/www/

# 2. Restaurar base de datos
echo "Restaurando base de datos..."
gunzip -c $BACKUP_SQL | mysql -u helpdesk_user -p glpi_huv

# 3. Reinstalar dependencias
echo "Reinstalando dependencias..."
cd $APP_DIR
composer install --optimize-autoloader --no-dev
npm ci
npm run build

# 4. Configurar permisos
echo "Configurando permisos..."
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 775 $APP_DIR/storage $APP_DIR/bootstrap/cache

# 5. Ejecutar migraciones
echo "Ejecutando migraciones..."
php artisan migrate --force

# 6. Limpiar y optimizar
echo "Optimizando..."
php artisan optimize

echo "=== RESTAURACIÓN COMPLETADA ==="
```

---

## 17. Monitoreo y Logs del Sistema

### 17.1 Ubicación de Logs

| Log | Ubicación | Contenido |
| :--- | :--- | :--- |
| Aplicación Laravel | `storage/logs/laravel.log` | Errores PHP, excepciones, debug |
| Apache Access | `/var/log/apache2/helpdesk-access.log` | Peticiones HTTP |
| Apache Error | `/var/log/apache2/helpdesk-error.log` | Errores del servidor web |
| Nginx Access | `/var/log/nginx/helpdesk-access.log` | Peticiones HTTP |
| Nginx Error | `/var/log/nginx/helpdesk-error.log` | Errores del servidor web |
| MySQL | `/var/log/mysql/error.log` | Errores de base de datos |
| MySQL Slow Query | `/var/log/mysql/slow.log` | Consultas lentas |
| PHP-FPM | `/var/log/php8.2-fpm.log` | Errores de PHP-FPM |
| Worker de Colas | `storage/logs/worker.log` | Logs del queue worker |

### 17.2 Revisión de Logs en Tiempo Real

```bash
# Ver log de Laravel en tiempo real
$ tail -f /var/www/helpdesk/storage/logs/laravel.log

# Ver últimos 100 errores
$ tail -100 /var/www/helpdesk/storage/logs/laravel.log | grep ERROR

# Ver log de Apache
$ sudo tail -f /var/log/apache2/helpdesk-error.log
```

### 17.3 Laravel Pail (Log en Tiempo Real)

El proyecto incluye Laravel Pail para visualización de logs más amigable:

```bash
$ cd /var/www/helpdesk
$ php artisan pail

# Filtrar por nivel
$ php artisan pail --filter="error"

# Filtrar por mensaje
$ php artisan pail --filter="ticket"
```

### 17.4 Errores Comunes en Logs

| Error | Causa Probable | Solución |
| :--- | :--- | :--- |
| `SQLSTATE[HY000] [2002] Connection refused` | MySQL no está corriendo | `sudo systemctl start mysql` |
| `Permission denied` | Permisos incorrectos en storage | `sudo chmod -R 775 storage` |
| `Class not found` | Autoloader no actualizado | `composer dump-autoload` |
| `419 Page Expired` | Token CSRF inválido | Limpiar caché del navegador |
| `500 Internal Server Error` | Error PHP no capturado | Revisar `storage/logs/laravel.log` |

### 17.5 Monitoreo de Recursos del Servidor

```bash
# Uso de CPU y memoria
$ htop

# Uso de disco
$ df -h

# Conexiones de red activas
$ netstat -tulpn | grep -E '80|443|3306'

# Procesos PHP
$ ps aux | grep php

# Conexiones MySQL activas
$ mysql -e "SHOW PROCESSLIST;"
```

---

## 18. Comandos Artisan Personalizados

El sistema incluye los siguientes comandos Artisan personalizados:

### 18.1 Importar Usuarios desde GLPI

```bash
$ php artisan glpi:import-users
```

**Descripción:** Importa usuarios activos de la tabla `glpi_users` a la tabla Laravel `users`.

**Opciones:**
- Sin opciones adicionales en la versión actual.

**Resultado:**
- Crea registros en la tabla `users` para cada usuario de GLPI.
- Genera correo electrónico si no existe.
- Asigna contraseña temporal `admin123`.
- Asigna rol `Técnico`.

### 18.2 Sincronizar IDs de Usuario GLPI

```bash
$ php artisan tickets:sync-user-ids
```

**Descripción:** Actualiza los registros de `glpi_tickets_users` para usar los `glpi_user_id` correctos cuando hay discrepancia entre IDs de Laravel e IDs de GLPI.

---

## 19. Solución de Problemas Comunes

### 19.1 La Página Muestra Error 500

**Diagnóstico:**
```bash
$ tail -50 /var/www/helpdesk/storage/logs/laravel.log
```

**Causas comunes:**
1. **APP_KEY no configurada:** Ejecutar `php artisan key:generate`
2. **Permisos de storage:** Ejecutar `chmod -R 775 storage bootstrap/cache`
3. **Archivo .env corrupto:** Verificar sintaxis del archivo .env

### 19.2 No Se Puede Conectar a la Base de Datos

**Diagnóstico:**
```bash
$ php artisan tinker
>>> DB::connection()->getPdo()
```

**Causas comunes:**
1. **Credenciales incorrectas:** Verificar DB_USERNAME y DB_PASSWORD en .env
2. **MySQL no está corriendo:** `sudo systemctl status mysql`
3. **Firewall bloqueando puerto:** `sudo ufw allow 3306` (solo si BD remota)

### 19.3 Los Assets CSS/JS No Cargan

**Diagnóstico:**
- Inspeccionar la consola del navegador (F12) para ver errores 404.

**Causas comunes:**
1. **No se ejecutó npm run build:** Ejecutar `npm run build`
2. **APP_URL incorrecta:** Verificar que APP_URL en .env coincide con la URL real
3. **Servidor web no sirviendo public/:** Verificar DocumentRoot

### 19.4 Error 419 Expired Token

**Causa:** Token CSRF expirado o inválido.

**Soluciones:**
1. Limpiar cookies del navegador.
2. Verificar que la sesión está funcionando: `php artisan session:table` y luego `php artisan migrate`.
3. Verificar que APP_KEY no ha cambiado.

### 19.5 Las Imágenes/Archivos No Cargan

**Diagnóstico:**
- Verificar que existe el enlace simbólico: `ls -la public/storage`

**Solución:**
```bash
$ php artisan storage:link
```

### 19.6 El Chatbot No Responde

**Causas comunes:**
1. **API Key de OpenRouter no configurada:** Verificar OPENROUTER_API_KEY en .env
2. **API Key expirada o sin créditos:** Verificar en dashboard de OpenRouter
3. **Firewall bloqueando salida:** El servidor debe poder conectar a `https://openrouter.ai`

### 19.7 Los Correos No Se Envían

**Diagnóstico:**
```bash
$ php artisan tinker
>>> Mail::raw('Test', fn($m) => $m->to('test@test.com')->subject('Test'));
```

**Causas comunes:**
1. **Credenciales SMTP incorrectas**
2. **Puerto bloqueado por firewall:** Verificar que el puerto 587/465 está abierto
3. **Queue worker no está corriendo:** Los correos se encolan pero no se procesan

---

## 20. Actualización del Sistema

### 20.1 Procedimiento de Actualización

```bash
# 1. Entrar en modo mantenimiento
$ php artisan down

# 2. Hacer backup de la base de datos
$ mysqldump -u helpdesk_user -p glpi_huv > backup_pre_update.sql

# 3. Obtener últimos cambios del repositorio
$ git pull origin main

# 4. Actualizar dependencias PHP
$ composer install --optimize-autoloader --no-dev

# 5. Actualizar dependencias JavaScript
$ npm ci
$ npm run build

# 6. Ejecutar nuevas migraciones
$ php artisan migrate --force

# 7. Limpiar y optimizar cachés
$ php artisan optimize:clear
$ php artisan optimize

# 8. Salir del modo mantenimiento
$ php artisan up
```

### 20.2 Rollback en Caso de Error

```bash
# Revertir última migración
$ php artisan migrate:rollback

# Restaurar backup de base de datos
$ mysql -u helpdesk_user -p glpi_huv < backup_pre_update.sql

# Revertir cambios de código
$ git checkout HEAD~1

# Reinstalar dependencias
$ composer install --optimize-autoloader --no-dev
$ npm ci
$ npm run build
```

---

## 21. Consideraciones de Seguridad

### 21.1 Checklist de Seguridad

| # | Verificación | Estado |
| :---: | :--- | :---: |
| 1 | APP_DEBUG=false en producción | ☐ |
| 2 | APP_ENV=production | ☐ |
| 3 | HTTPS habilitado con certificado válido | ☐ |
| 4 | Archivo .env con permisos 600 | ☐ |
| 5 | Credenciales de BD no son root | ☐ |
| 6 | Contraseñas por defecto cambiadas | ☐ |
| 7 | Headers de seguridad configurados | ☐ |
| 8 | Firewall habilitado (solo puertos necesarios) | ☐ |
| 9 | Backups automáticos configurados | ☐ |
| 10 | Logs con rotación configurada | ☐ |

### 21.2 Actualización de Dependencias

Ejecute periódicamente auditorías de seguridad:

```bash
# Auditoría de paquetes PHP
$ composer audit

# Auditoría de paquetes JavaScript
$ npm audit

# Actualizar dependencias con parches de seguridad
$ composer update --with-all-dependencies
$ npm update
```

### 21.3 Protección de Archivos Sensibles

Asegúrese de que los siguientes archivos/directorios NO sean accesibles públicamente:

- `.env`
- `.git/`
- `storage/`
- `database/`
- `app/`
- `vendor/`
- Cualquier archivo `.sql`, `.log`, `.md`

---

## 22. Lista de Verificación de Despliegue

Use esta lista antes de declarar el sistema como "listo para producción":

### 22.1 Infraestructura

| # | Tarea | Verificado |
| :---: | :--- | :---: |
| 1 | Sistema operativo actualizado | ☐ |
| 2 | PHP 8.2+ instalado con extensiones | ☐ |
| 3 | MySQL/MariaDB funcionando | ☐ |
| 4 | Servidor web configurado (Apache/Nginx) | ☐ |
| 5 | Certificado SSL instalado | ☐ |
| 6 | Firewall configurado | ☐ |
| 7 | Zona horaria correcta | ☐ |

### 22.2 Aplicación

| # | Tarea | Verificado |
| :---: | :--- | :---: |
| 1 | Código clonado en `/var/www/helpdesk` | ☐ |
| 2 | `composer install --no-dev` ejecutado | ☐ |
| 3 | `npm ci && npm run build` ejecutado | ☐ |
| 4 | Archivo `.env` configurado completamente | ☐ |
| 5 | `php artisan key:generate` ejecutado | ☐ |
| 6 | `php artisan migrate --force` ejecutado | ☐ |
| 7 | `php artisan storage:link` ejecutado | ☐ |
| 8 | `php artisan optimize` ejecutado | ☐ |
| 9 | Permisos de storage y cache correctos | ☐ |

### 22.3 Servicios

| # | Tarea | Verificado |
| :---: | :--- | :---: |
| 1 | Cron job del scheduler configurado | ☐ |
| 2 | Queue worker corriendo (Supervisor/Systemd) | ☐ |
| 3 | Backup automático configurado | ☐ |
| 4 | Monitoreo de logs activo | ☐ |

### 22.4 Funcionalidad

| # | Tarea | Verificado |
| :---: | :--- | :---: |
| 1 | Login de usuario funciona | ☐ |
| 2 | Dashboard carga correctamente | ☐ |
| 3 | Crear ticket funciona | ☐ |
| 4 | Ver inventario funciona | ☐ |
| 5 | Exportación a Excel funciona | ☐ |
| 6 | Chatbot responde | ☐ |
| 7 | Notificaciones funcionan | ☐ |
| 8 | 2FA se puede activar | ☐ |
| 9 | Correos se envían | ☐ |

---

**Hospital Universitario del Valle "Evaristo García" E.S.E.**
Departamento de Innovación y Desarrollo
Cali, Valle del Cauca — Colombia
Febrero de 2026

---

*Fin del documento de Credenciales y Configuración — HelpDesk HUV v1.0.0*
