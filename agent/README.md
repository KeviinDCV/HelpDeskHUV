# HelpDesk HUV · Agente de Inventario para Windows

Servicio Windows en .NET 8 que recolecta el inventario completo del PC y lo sincroniza con el backend del HelpDesk HUV. Reemplaza la dependencia de OCS-Inventory.

## Qué reporta

- Identidad: hostname, dominio, fabricante, modelo, tipo, serial, asset tag, **UUID SMBIOS**.
- Sistema operativo: Windows + edición + arquitectura + kernel + product ID.
- CPUs (modelo, frecuencia, núcleos, hilos).
- Memorias (slot, tipo, tamaño, fabricante, serial).
- Discos físicos (modelo, capacidad, serial, tipo).
- Tarjetas: red, video, audio.
- Motherboard y BIOS.
- Volúmenes lógicos (C:, D:, ...) con tamaño total/libre y filesystem.
- Puertos de red activos con IPs.
- Software instalado (registro de Windows, 32/64 bits, HKLM + HKCU).
- Antivirus (estado, versión, firmas, vendor).
- Monitores (EDID via WMI: vendor, modelo, serial).
- Usuario interactivo Windows asociado al PC.

## Endpoints que consume

Documentados en [`DOCUMENTACION/PROTOCOLO_AGENTE_INVENTARIO.md`](../DOCUMENTACION/PROTOCOLO_AGENTE_INVENTARIO.md).

## Compilación / empaquetado

Requiere **.NET 8 SDK**.

```bat
cd agent
publish.bat
```

Eso genera `agent/dist/` con:

- `HelpDeskHuv.Agent.exe` — single-file self-contained (~50 MB, no requiere instalar .NET).
- `appsettings.json` — configuración de intervalos.
- `install.bat`, `uninstall.bat`.

## Instalación en un PC objetivo

1. **Emitir un token** en HelpDesk HUV (`/administracion/agente-tokens` → "Emitir nuevo token").
2. Copiar la carpeta `dist/` al PC.
3. Abrir CMD como Administrador y ejecutar:

   ```bat
   install.bat http://helpdesk.huv.gov.co 1|mKczEXDJhk3GYE...
   ```

   El script:
   - Copia el binario a `C:\Program Files\HelpDeskHUV\Agent\`.
   - Cifra el token con DPAPI máquina y lo guarda en `C:\ProgramData\HelpDeskHUV\agent.config.json`.
   - Crea el servicio `HelpDeskHuvAgent` (autostart, reinicio automático ante fallos).
   - Lo inicia.

4. A los ~15 segundos el agente envía su primer `/sync`. Verifica en la UI:
   - `/administracion/agente-tokens` → la fila debería mostrar hostname, último heartbeat, IP.
   - `/inventario/computadores` → el PC aparece con todos sus componentes.

## Diagnóstico

- **Visor de eventos** (`eventvwr.msc`) → Aplicación → fuente `HelpDeskHuv-Agent`.
- Estado del servicio:

  ```bat
  sc query HelpDeskHuvAgent
  net start HelpDeskHuvAgent
  net stop  HelpDeskHuvAgent
  ```

- Reconfigurar token sin reinstalar:

  ```bat
  cd "C:\Program Files\HelpDeskHUV\Agent"
  HelpDeskHuv.Agent.exe set-config --base-url=http://helpdesk.huv.gov.co --token=<NUEVO_TOKEN>
  net stop HelpDeskHuvAgent && net start HelpDeskHuvAgent
  ```

## Despliegue masivo (GPO)

1. Compartir `dist/` en `\\fileserver\Software\HelpDeskAgent\`.
2. Crear una **GPO de Inicio del equipo** (no de usuario) con un script `.bat`:

   ```bat
   if exist "C:\Program Files\HelpDeskHUV\Agent\HelpDeskHuv.Agent.exe" exit /b 0
   call \\fileserver\Software\HelpDeskAgent\install.bat http://helpdesk.huv.gov.co <TOKEN_COMUN_O_POR_OU>
   ```

   Para máxima seguridad: emite un token distinto por OU y haz N scripts. Los tokens se vinculan 1:1 a un PC en cuanto el agente envía su primer `/sync`.

## Desinstalación

```bat
uninstall.bat            REM Quita servicio y binarios, conserva config.
uninstall.bat --purge    REM Quita TODO incluyendo el token cifrado.
```

## Estructura

```
agent/
├── HelpDeskHuv.Agent.sln
├── HelpDeskHuv.Agent/
│   ├── HelpDeskHuv.Agent.csproj
│   ├── Program.cs
│   ├── InventoryWorker.cs
│   ├── appsettings.json
│   ├── Models/InventoryPayload.cs
│   └── Services/
│       ├── AgentConfigStore.cs       # Carga/guarda config con DPAPI
│       ├── InventoryCollector.cs     # Recolección WMI/registro
│       └── InventoryApiClient.cs     # HTTP + reintentos
├── install.bat
├── uninstall.bat
├── publish.bat
└── README.md
```
