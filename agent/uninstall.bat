@echo off
REM Desinstala el agente HelpDesk HUV (ejecutar como Administrador)
setlocal
set "SVC_NAME=HelpDeskHuvAgent"
set "INSTALL_DIR=%ProgramFiles%\HelpDeskHUV\Agent"
set "DATA_DIR=%ProgramData%\HelpDeskHUV"

net session >nul 2>&1
if errorlevel 1 (
    echo  ERROR: ejecuta como Administrador.
    pause
    exit /b 1
)

echo  Deteniendo y eliminando servicio...
net stop %SVC_NAME% >nul 2>&1
sc delete %SVC_NAME% >nul 2>&1

echo  Eliminando binarios...
rmdir /S /Q "%INSTALL_DIR%" 2>nul

if /I "%~1"=="--purge" (
    echo  Eliminando datos y configuracion...
    rmdir /S /Q "%DATA_DIR%" 2>nul
)

echo  Hecho.
exit /b 0
