; ===================================================================
;  HelpDesk HUV - Agente de Inventario
;  Instalador Inno Setup
;  Compilar con: ISCC.exe installer.iss
; ===================================================================

#define MyAppName        "HelpDesk HUV - Agente de Inventario"
#define MyAppShortName   "HelpDeskHUV-Agent"
#define MyAppVersion     "1.0.0"
#define MyAppPublisher   "Hospital Universitario del Valle"
#define MyAppURL         "http://helpdesk.huv.gov.co"
#define MyServiceName    "HelpDeskHuvAgent"
#define MyExeName        "HelpDeskHuv.Agent.exe"

; >>> Configuracion del servidor (editar estas dos lineas) <<<
#define DefaultBaseUrl         "http://helpdesk.huv.gov.co"
#define EnrollmentSecret       "CAMBIAR_ESTE_SECRETO_EN_ENV_DEL_SERVIDOR"

[Setup]
AppId={{D1F2A3B4-5C6D-7E8F-9012-345678ABCDEF}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
DefaultDirName={autopf}\HelpDeskHUV\Agent
DisableProgramGroupPage=yes
DisableDirPage=yes
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=
OutputBaseFilename=Instalador-AgenteHelpDeskHUV
OutputDir=installer-output
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64
UninstallDisplayName={#MyAppName}
UninstallDisplayIcon={app}\{#MyExeName}

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Files]
Source: "dist\HelpDeskHuv.Agent.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\appsettings.json";       DestDir: "{app}"; Flags: ignoreversion

[Run]
; 1. Detener servicio si existe (en caso de reinstalacion)
Filename: "{sys}\sc.exe"; Parameters: "stop {#MyServiceName}"; Flags: runhidden waituntilterminated; StatusMsg: "Deteniendo servicio existente..."

; 2. Borrar servicio si existe (para recrearlo)
Filename: "{sys}\sc.exe"; Parameters: "delete {#MyServiceName}"; Flags: runhidden waituntilterminated; StatusMsg: "Limpiando registro previo..."

; 3. Auto-registro: el agente llama al backend y recibe su token unico
Filename: "{app}\{#MyExeName}"; Parameters: "register --base-url={#DefaultBaseUrl} --enrollment-secret={#EnrollmentSecret}"; Flags: runhidden waituntilterminated; StatusMsg: "Registrando equipo en el servidor..."; Check: NeedsRegister

; 4. Crear servicio Windows
Filename: "{sys}\sc.exe"; Parameters: "create {#MyServiceName} binPath= ""\""{app}\{#MyExeName}\"""" start= auto DisplayName= ""{#MyAppName}"""; Flags: runhidden waituntilterminated; StatusMsg: "Creando servicio Windows..."

; 5. Descripcion del servicio
Filename: "{sys}\sc.exe"; Parameters: "description {#MyServiceName} ""Recolecta el inventario del PC y lo sincroniza con HelpDesk HUV."""; Flags: runhidden waituntilterminated

; 6. Reinicio automatico si falla
Filename: "{sys}\sc.exe"; Parameters: "failure {#MyServiceName} reset= 86400 actions= restart/60000/restart/60000/restart/60000"; Flags: runhidden waituntilterminated

; 7. Iniciar servicio
Filename: "{sys}\sc.exe"; Parameters: "start {#MyServiceName}"; Flags: runhidden waituntilterminated; StatusMsg: "Iniciando servicio..."

[UninstallRun]
Filename: "{sys}\sc.exe"; Parameters: "stop {#MyServiceName}";   Flags: runhidden waituntilterminated; RunOnceId: "StopSvc"
Filename: "{sys}\sc.exe"; Parameters: "delete {#MyServiceName}"; Flags: runhidden waituntilterminated; RunOnceId: "DelSvc"

[UninstallDelete]
Type: filesandordirs; Name: "{commonappdata}\HelpDeskHUV"

[Code]
var
  RegisterNeeded: Boolean;

function NeedsRegister: Boolean;
begin
  Result := RegisterNeeded;
end;

function InitializeSetup(): Boolean;
begin
  RegisterNeeded := True;
  Result := True;
end;
