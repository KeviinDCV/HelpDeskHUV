@echo off
REM ===============================================================
REM  HelpDesk HUV - Agente de Inventario
REM  Instalador / Configurador (ejecutar como Administrador)
REM
REM  Uso:
REM    install.bat <BASE_URL> <TOKEN>
REM
REM  Ejemplo:
REM    install.bat http://helpdesk.huv.gov.co 1|mKczEXDJhk3GYE...
REM ===============================================================

setlocal

if "%~1"=="" goto :usage
if "%~2"=="" goto :usage

set "BASE_URL=%~1"
set "TOKEN=%~2"
set "INSTALL_DIR=%ProgramFiles%\HelpDeskHUV\Agent"
set "SVC_NAME=HelpDeskHuvAgent"
set "EXE=%INSTALL_DIR%\HelpDeskHuv.Agent.exe"

echo.
echo  === HelpDesk HUV Agent - Instalacion ===
echo.
echo  Base URL : %BASE_URL%
echo  Carpeta  : %INSTALL_DIR%
echo  Servicio : %SVC_NAME%
echo.

REM Comprobar privilegios
net session >nul 2>&1
if errorlevel 1 (
    echo  ERROR: este script debe ejecutarse como Administrador.
    pause
    exit /b 1
)

REM Crear carpeta de instalacion
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Copiar binarios desde el directorio del script
xcopy /Y /Q "%~dp0HelpDeskHuv.Agent.exe" "%INSTALL_DIR%\" >nul
if errorlevel 1 (
    echo  ERROR: no se pudo copiar HelpDeskHuv.Agent.exe.
    pause
    exit /b 1
)
xcopy /Y /Q "%~dp0appsettings.json" "%INSTALL_DIR%\" >nul 2>&1

REM Detener el servicio si ya existe (para actualizar binario)
sc query %SVC_NAME% >nul 2>&1
if not errorlevel 1 (
    echo  Deteniendo servicio existente...
    net stop %SVC_NAME% >nul 2>&1
)

REM Configurar token + base URL (cifra con DPAPI maquina)
echo  Guardando configuracion (token cifrado con DPAPI)...
"%EXE%" set-config --base-url="%BASE_URL%" --token="%TOKEN%"
if errorlevel 1 (
    echo  ERROR: fallo al guardar la configuracion.
    pause
    exit /b 1
)

REM Crear servicio si no existe
sc query %SVC_NAME% >nul 2>&1
if errorlevel 1 (
    echo  Creando servicio Windows...
    sc create %SVC_NAME% binPath= "\"%EXE%\"" start= auto DisplayName= "HelpDesk HUV - Agente de Inventario" >nul
    sc description %SVC_NAME% "Recolecta el inventario del PC y lo sincroniza con el HelpDesk HUV." >nul
    REM Reinicio automatico si falla
    sc failure %SVC_NAME% reset= 86400 actions= restart/60000/restart/60000/restart/60000 >nul
)

REM Iniciar servicio
echo  Iniciando servicio...
net start %SVC_NAME%
if errorlevel 1 (
    echo  ATENCION: el servicio no inicio. Revisa el Visor de eventos > Application > HelpDeskHuv-Agent.
    pause
    exit /b 1
)

echo.
echo  === Instalacion completada ===
echo  El agente sincronizara su primer inventario en ~15 segundos.
echo  Revisa el Visor de eventos para diagnostico.
echo.
exit /b 0

:usage
echo.
echo  Uso: install.bat ^<BASE_URL^> ^<TOKEN^>
echo.
echo  Ejemplo:
echo     install.bat http://helpdesk.huv.gov.co 1^|mKczEXDJ...
echo.
exit /b 1
