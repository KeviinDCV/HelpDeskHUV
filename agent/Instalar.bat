@echo off
REM ================================================================
REM   HelpDesk HUV - Instalador del Agente de Inventario
REM   Doble-click para instalar.
REM
REM   Este script:
REM     1. Se eleva automaticamente como Administrador.
REM     2. Copia el agente a "C:\Program Files\HelpDeskHUV\Agent\".
REM     3. Se autoregistra contra el servidor (genera token unico).
REM     4. Crea e inicia el servicio Windows "HelpDeskHuvAgent".
REM
REM   Configuracion editable en este mismo archivo (lineas de arriba).
REM ================================================================

REM ----------------- CONFIGURACION (EDITAR AQUI) ------------------
set "BASE_URL=http://helpdesk.huv.gov.co"
set "ENROLLMENT_SECRET=CAMBIAR_ESTE_SECRETO_EN_ENV_DEL_SERVIDOR"
REM ----------------------------------------------------------------

set "INSTALL_DIR=%ProgramFiles%\HelpDeskHUV\Agent"
set "SVC_NAME=HelpDeskHuvAgent"
set "EXE=%INSTALL_DIR%\HelpDeskHuv.Agent.exe"

REM ---- Auto-elevacion ----
net session >nul 2>&1
if errorlevel 1 (
    echo Solicitando privilegios de administrador...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cls
echo.
echo  ================================================================
echo    HelpDesk HUV - Agente de Inventario
echo    Instalacion automatica
echo  ================================================================
echo.
echo   Servidor : %BASE_URL%
echo   Carpeta  : %INSTALL_DIR%
echo   Servicio : %SVC_NAME%
echo.

REM ---- Verificar que existan los archivos junto al .bat ----
if not exist "%~dp0HelpDeskHuv.Agent.exe" (
    echo  ERROR: no se encuentra HelpDeskHuv.Agent.exe en %~dp0
    pause
    exit /b 1
)

REM ---- Crear carpeta destino ----
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM ---- Copiar binarios ----
echo  [1/4] Copiando archivos...
xcopy /Y /Q "%~dp0HelpDeskHuv.Agent.exe" "%INSTALL_DIR%\" >nul
if errorlevel 1 (
    echo  ERROR: no se pudo copiar el ejecutable.
    pause
    exit /b 1
)
xcopy /Y /Q "%~dp0appsettings.json" "%INSTALL_DIR%\" >nul 2>&1

REM ---- Detener servicio si ya existe (actualizacion) ----
sc query %SVC_NAME% >nul 2>&1
if not errorlevel 1 (
    echo  [info] Deteniendo servicio existente para actualizar...
    net stop %SVC_NAME% >nul 2>&1
)

REM ---- Auto-registro contra el servidor ----
echo  [2/4] Registrando equipo en el servidor...
"%EXE%" register --base-url=%BASE_URL% --enrollment-secret=%ENROLLMENT_SECRET%
if errorlevel 1 (
    echo.
    echo  ERROR: el registro fallo. Verifica:
    echo    - Conectividad con %BASE_URL%
    echo    - ENROLLMENT_SECRET correcto en este script
    echo    - El servidor tiene corriendo el endpoint /api/inventory/register
    echo.
    pause
    exit /b 1
)

REM ---- Crear servicio si no existe ----
sc query %SVC_NAME% >nul 2>&1
if errorlevel 1 (
    echo  [3/4] Creando servicio Windows...
    sc create %SVC_NAME% binPath= "\"%EXE%\"" start= auto DisplayName= "HelpDesk HUV - Agente de Inventario" >nul
    sc description %SVC_NAME% "Recolecta el inventario del PC y lo sincroniza con el HelpDesk HUV." >nul
    sc failure %SVC_NAME% reset= 86400 actions= restart/60000/restart/60000/restart/60000 >nul
) else (
    echo  [3/4] Servicio ya existe, se reutiliza.
)

REM ---- Iniciar servicio ----
echo  [4/4] Iniciando servicio...
net start %SVC_NAME%
if errorlevel 1 (
    echo.
    echo  ATENCION: el servicio no inicio. Revisa el Visor de eventos
    echo  ^> Aplicacion ^> HelpDeskHuv-Agent.
    pause
    exit /b 1
)

echo.
echo  ================================================================
echo    Instalacion completada con exito
echo  ================================================================
echo.
echo    El agente sincronizara su inventario en ~15 segundos.
echo    Logs: Visor de eventos ^> Aplicacion ^> HelpDeskHuv-Agent
echo.
pause
exit /b 0
