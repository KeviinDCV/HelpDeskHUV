# Protocolo del Agente de Inventario · HelpDesk HUV

> Versión 1.0 · 2026

Este documento describe el contrato HTTP/JSON entre el agente Windows que se instala en cada PC de la entidad y el backend Laravel del HelpDesk HUV.

---

## 1. Visión general

- **Base URL producción:** `https://helpdesk.huv.gov.co/api/inventory`
- **Base URL desarrollo:** `http://127.0.0.1:8888/api/inventory`
- **Autenticación:** Bearer token de Laravel Sanctum con habilidad obligatoria `agent:sync`.
- **Codificación:** `application/json; charset=utf-8`.
- **Identificador primario del PC:** `hardware_uuid` (BIOS/SMBIOS UUID). Si el PC no lo expone, se usa el serial; si tampoco, el hostname.
- **Modelo de actualización:** todas las filas que el agente escribe se marcan con `is_dynamic = 1`. Las filas creadas manualmente (`is_dynamic = 0`) **nunca** se tocan.
- **Idempotencia:** llamar `/sync` N veces con el mismo payload no genera duplicados.

---

## 2. Endpoints

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `GET`  | `/api/inventory/health`    | Pública                              | Healthcheck simple. |
| `POST` | `/api/inventory/identify`  | `auth:sanctum` + `ability:agent:sync` | Comprueba si el PC ya existe. Útil al primer arranque. |
| `POST` | `/api/inventory/sync`      | `auth:sanctum` + `ability:agent:sync` | Crea o actualiza el equipo y todos sus componentes. |
| `POST` | `/api/inventory/heartbeat` | `auth:sanctum` + `ability:agent:sync` | Mantiene `last_seen_at` actualizado (sin payload pesado). |

### 2.1 Cabeceras requeridas

```http
Authorization: Bearer <PERSONAL_ACCESS_TOKEN>
Accept: application/json
Content-Type: application/json; charset=utf-8
User-Agent: HelpDeskHUV-Agent/1.0 (Windows)
```

---

## 3. Emisión y rotación de tokens

Tokens emitidos por consola Artisan:

```bash
php artisan agent:token --user=<nombre_usuario_admin> --name="PC-NOMBRE" --days=0
```

- `--days=0` → token sin expiración.
- Habilidad concedida: **únicamente** `agent:sync` (no permite cualquier otra acción).
- El token solo se muestra una vez. Si se pierde, hay que emitir uno nuevo y revocar el anterior desde la UI de administración.
- Se recomienda **un token por PC** (binding 1:1 a `hardware_uuid` registrado en `agent_devices`).

---

## 4. `GET /api/inventory/health`

### Respuesta 200

```json
{
  "status": "ok",
  "service": "helpdesk-huv-inventory-api",
  "version": "1.0.0",
  "time": "2026-04-27T16:25:11+00:00"
}
```

---

## 5. `POST /api/inventory/identify`

Permite al agente saber si la máquina ya está registrada antes del primer `/sync`.

### Petición

```json
{
  "hardware_uuid": "ABCD1234-5678-90AB-CDEF-1234567890AB",
  "serial": "TEST-SERIAL-12345",
  "hostname": "PC-CONTABILIDAD-03"
}
```

`hardware_uuid` es obligatorio. Los demás opcionales (se usan como fallback de búsqueda).

### Respuesta 200 cuando no existe

```json
{ "exists": false, "computer": null }
```

### Respuesta 200 cuando existe

```json
{
  "exists": true,
  "computer": {
    "id": 2811,
    "name": "PC-PRUEBA-AGENTE-01",
    "serial": "TEST-SERIAL-12345",
    "uuid": "ABCD1234-5678-90AB-CDEF-1234567890AB",
    "users_id": 234,
    "is_dynamic": 1
  }
}
```

---

## 6. `POST /api/inventory/sync`

El payload completo. Todos los bloques son **opcionales** salvo `hardware_uuid`. El agente debe enviar todo lo que pueda recolectar; el backend ignora silenciosamente lo desconocido.

### 6.1 Esquema (resumen)

```jsonc
{
  "hardware_uuid": "string (req)",       // BIOS/SMBIOS UUID
  "agent_version": "1.0.0",
  "windows_username": "string|null",     // Para vincular con glpi_users.name

  "general": {
    "hostname":      "string",
    "serial":        "string|null",
    "asset_tag":     "string|null",
    "manufacturer":  "string|null",
    "model":         "string|null",
    "type":          "string|null",      // Desktop, Laptop, Server, ...
    "domain":        "string|null"
  },

  "operating_system": {
    "name":           "string",
    "version":        "string|null",
    "architecture":   "string|null",     // x64 / x86 / arm64
    "kernel_version": "string|null",
    "edition":        "string|null",
    "license_key":    "string|null",
    "product_id":     "string|null"
  },

  "cpus": [
    {
      "designation":   "string",
      "manufacturer":  "string|null",
      "frequency_mhz": 0,
      "cores":         0,
      "threads":       0,
      "serial":        "string|null",
      "bus_id":        "string|null"
    }
  ],

  "memories": [
    {
      "designation":  "string",          // p. ej. "DDR4 SODIMM"
      "manufacturer": "string|null",
      "size_mb":      0,
      "serial":       "string|null",
      "slot":         "string|null"      // DIMM_A1, ChannelB-DIMM0, ...
    }
  ],

  "hard_drives": [
    {
      "designation":  "string",          // modelo del disco
      "manufacturer": "string|null",
      "capacity_mb":  0,
      "serial":       "string|null",
      "type":         "SSD|HDD|NVMe|..."
    }
  ],

  "network_cards": [
    {
      "designation":  "string",
      "manufacturer": "string|null",
      "mac":          "AA:BB:CC:DD:EE:FF",
      "bus_id":       "string|null"
    }
  ],

  "graphic_cards": [
    {
      "designation":  "string",
      "manufacturer": "string|null",
      "memory_mb":    0,
      "bus_id":       "string|null"
    }
  ],

  "sound_cards": [
    { "designation": "string", "manufacturer": "string|null" }
  ],

  "motherboard": {
    "designation":  "string",
    "manufacturer": "string|null",
    "serial":       "string|null"
  },

  "bios": {
    "designation":  "string",
    "manufacturer": "string|null",
    "version":      "string|null",
    "serial":       "string|null"
  },

  "volumes": [
    {
      "name":       "string",            // C: / D: / etc.
      "mountpoint": "string|null",
      "device":     "string|null",
      "filesystem": "NTFS|FAT32|exFAT",
      "total_mb":   0,
      "free_mb":    0
    }
  ],

  "network_ports": [
    {
      "name": "Ethernet|Wi-Fi|...",
      "mac":  "AA:BB:CC:DD:EE:FF",
      "ips":  ["192.168.2.123"]
    }
  ],

  "software": [
    {
      "name":      "string (req)",
      "version":   "string|null",
      "publisher": "string|null"
    }
  ],

  "antivirus": [
    {
      "name":              "string",
      "manufacturer":      "string|null",
      "version":           "string|null",
      "signature_version": "string|null",
      "enabled":           true,
      "up_to_date":        true,
      "expiration_date":   "YYYY-MM-DD|null"
    }
  ],

  "monitors": [
    {
      "name":         "string",
      "serial":       "string|null",
      "manufacturer": "string|null",
      "model":        "string|null",
      "size_inches":  24,
      "resolution":   "1920x1080"
    }
  ]
}
```

### 6.2 Respuesta 200

```json
{
  "ok": true,
  "computer_id": 2811,
  "created": false,
  "components_synced": {
    "cpu": 1,
    "memory": 2,
    "harddrives": 1,
    "network": 1,
    "gpu": 1,
    "sound": 1,
    "motherboard": 1,
    "firmware": 1,
    "volumes": 1,
    "network_ports": 1,
    "software": 3,
    "antivirus": 1,
    "monitors": 1
  },
  "message": "Equipo actualizado correctamente"
}
```

### 6.3 Errores

| HTTP | `error` | Causa |
| --- | --- | --- |
| 401 | `Unauthenticated` | Token ausente, inválido o expirado. |
| 403 | `Invalid ability provided.` | Token sin la habilidad `agent:sync`. |
| 422 | `validation_error` | Faltó `hardware_uuid` o un campo no respeta el tipo. |
| 500 | `sync_failed` | Error inesperado durante la transacción. La operación se revierte por completo. |

---

## 7. `POST /api/inventory/heartbeat`

Para mantener vivo `last_seen_at` cuando no hay cambios significativos.

### Petición

```json
{
  "hardware_uuid": "ABCD1234-5678-90AB-CDEF-1234567890AB",
  "agent_version": "1.0.0"
}
```

### Respuesta 200

```json
{ "ok": true }
```

---

## 8. Reglas de mapeo en GLPI

- **Computer:**
  - Búsqueda: `uuid = hardware_uuid` → `serial = serial` → `name = hostname`.
  - `users_id` se resuelve buscando `glpi_users.name = windows_username` (sin `is_deleted`).
  - `manufacturers_id`, `computermodels_id`, `computertypes_id`, `domains_id`, `autoupdatesystems_id` se resuelven con `firstOrCreate` por nombre.
- **Componentes (CPU/RAM/HDD/NIC/GPU/Sound/Mother/BIOS):**
  - El catálogo `glpi_devicexxx` se firstOrCreate por `(designation, manufacturers_id)`.
  - El item `glpi_items_devicexxx` siempre va con `itemtype='Computer'`, `is_dynamic=1`.
  - En cada `/sync`: las filas `is_dynamic=1` previas se **borran físicamente** (no soft-delete) para evitar choques con el índice `unicity` de GLPI; las manuales `is_dynamic=0` quedan intactas.
- **Software:** `firstOrCreate` en `glpi_softwares` y `glpi_softwareversions`. La pivote `glpi_computers_softwareversions` se reactiva (no se duplica) si ya existía.
- **Monitores:** se detecta o se crea en `glpi_monitors` por `(serial, name)`. La asociación va a `glpi_computers_items (itemtype='Monitor')`.
- **Network ports e IPs:** se borran físicamente las filas dinámicas previas y se reinsertan.

---

## 9. Recomendaciones para el agente Windows

1. Al primer arranque: leer/escribir token desde `%ProgramData%\HelpDeskHUV\agent.config.json` (cifrado con DPAPI).
2. Llamar `/identify` solo cuando el token aún no esté validado.
3. `/sync` cada 24 h (recolección completa) y al detectar instalación/desinstalación de software.
4. `/heartbeat` cada 1 h.
5. Reintentos con backoff exponencial (30 s, 1 min, 5 min, 15 min) si la red está caída. Persistir el último payload en `%ProgramData%\HelpDeskHUV\last_payload.json` por si el servicio cae.
6. El agente debe correr como **LocalSystem** (servicio Windows) para acceder a WMI y SMBIOS sin elevación.
7. `windows_username` se obtiene del **usuario interactivo de la sesión**, no de `whoami` del servicio (que sería SYSTEM).
