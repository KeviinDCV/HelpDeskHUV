@echo off
REM ===============================================================
REM  Empaqueta el agente para distribucion.
REM  Genera: dist\HelpDeskHuv.Agent.exe + appsettings.json + install.bat + uninstall.bat
REM
REM  Requiere: .NET 8 SDK instalado.
REM ===============================================================

setlocal
set "ROOT=%~dp0"
set "PROJ=%ROOT%HelpDeskHuv.Agent\HelpDeskHuv.Agent.csproj"
set "OUT=%ROOT%dist"

if exist "%OUT%" rmdir /S /Q "%OUT%"
mkdir "%OUT%"

echo.
echo  === Publicando agente (single-file, win-x64, self-contained) ===
echo.
dotnet publish "%PROJ%" -c Release -r win-x64 --self-contained true ^
    -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true ^
    -p:DebugType=embedded -p:Version=1.0.0 ^
    -o "%OUT%\publish-x64"
if errorlevel 1 goto :err

copy /Y "%OUT%\publish-x64\HelpDeskHuv.Agent.exe" "%OUT%\" >nul
copy /Y "%OUT%\publish-x64\appsettings.json"      "%OUT%\" >nul 2>&1
copy /Y "%ROOT%install.bat"                       "%OUT%\" >nul
copy /Y "%ROOT%uninstall.bat"                     "%OUT%\" >nul

rmdir /S /Q "%OUT%\publish-x64"

echo.
echo  Empaquetado en: %OUT%
dir /B "%OUT%"
echo.
echo  Listo. Copia el contenido de "%OUT%" al PC destino y ejecuta:
echo     install.bat http://helpdesk.huv.gov.co ^<TOKEN^>
echo.
exit /b 0

:err
echo  ERROR: la publicacion fallo.
exit /b 1
