using System.Reflection;
using System.Runtime.Versioning;
using HelpDeskHuv.Agent.Services;

namespace HelpDeskHuv.Agent;

[SupportedOSPlatform("windows")]
public sealed class InventoryWorker : BackgroundService
{
    private readonly ILogger<InventoryWorker> _logger;
    private readonly IConfiguration _config;
    private readonly AgentConfigStore _store;
    private readonly InventoryCollector _collector;
    private readonly InventoryApiClient _api;

    private static readonly string AgentVersion =
        Assembly.GetExecutingAssembly().GetName().Version?.ToString(3) ?? "1.0.0";

    public InventoryWorker(
        ILogger<InventoryWorker> logger,
        IConfiguration config,
        AgentConfigStore store,
        InventoryCollector collector,
        InventoryApiClient api)
    {
        _logger = logger;
        _config = config;
        _store = store;
        _collector = collector;
        _api = api;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("HelpDesk HUV Agent v{Version} iniciado.", AgentVersion);

        var config = _store.Load();
        var baseUrl = config.BaseUrl ?? _config["Agent:BaseUrl"];
        var token = config.Token;

        if (string.IsNullOrWhiteSpace(baseUrl) || string.IsNullOrWhiteSpace(token))
        {
            _logger.LogError("Configuración incompleta. Falta BaseUrl o Token. Edita %ProgramData%\\HelpDeskHUV\\agent.config.json y reinicia el servicio.");
            return;
        }

        _api.Configure(baseUrl!, token!);

        var syncInterval = TimeSpan.FromHours(_config.GetValue("Agent:SyncIntervalHours", 24.0));
        var heartbeatInterval = TimeSpan.FromMinutes(_config.GetValue("Agent:HeartbeatIntervalMinutes", 60.0));

        // Sincronización inicial al arranque (con un pequeño delay para esperar a la red)
        await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
        await SafeSyncAsync(config, stoppingToken);

        var nextSync = DateTime.UtcNow + syncInterval;
        var nextHeartbeat = DateTime.UtcNow + heartbeatInterval;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.UtcNow;

                if (now >= nextSync)
                {
                    await SafeSyncAsync(config, stoppingToken);
                    nextSync = DateTime.UtcNow + syncInterval;
                    nextHeartbeat = DateTime.UtcNow + heartbeatInterval;
                }
                else if (now >= nextHeartbeat)
                {
                    await SafeHeartbeatAsync(config, stoppingToken);
                    nextHeartbeat = DateTime.UtcNow + heartbeatInterval;
                }
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado en el ciclo principal.");
            }

            // Tick cada 5 minutos
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }

        _logger.LogInformation("Agente detenido.");
    }

    private async Task SafeSyncAsync(AgentConfig config, CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Iniciando recolección de inventario...");
            var payload = _collector.Collect(AgentVersion);
            _logger.LogInformation("Inventario recolectado. Enviando /sync para UUID {Uuid} (PC {Hostname})",
                payload.HardwareUuid, payload.General?.Hostname);

            using var resp = await _api.SyncAsync(payload, ct);
            var body = await resp.Content.ReadAsStringAsync(ct);

            if (resp.IsSuccessStatusCode)
            {
                _logger.LogInformation("Inventario sincronizado: {Body}", body);
                config.LastSyncAt = DateTime.UtcNow;
                _store.Save(config);
            }
            else
            {
                _logger.LogError("Sync devolvió {Code}: {Body}", (int)resp.StatusCode, body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sync falló (todos los reintentos agotados).");
        }
    }

    private async Task SafeHeartbeatAsync(AgentConfig config, CancellationToken ct)
    {
        try
        {
            var uuid = _collector.GetHardwareUuid();
            using var resp = await _api.HeartbeatAsync(uuid, AgentVersion, ct);
            if (resp.IsSuccessStatusCode)
            {
                _logger.LogDebug("Heartbeat enviado.");
                config.LastHeartbeatAt = DateTime.UtcNow;
                _store.Save(config);
            }
            else
            {
                var body = await resp.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("Heartbeat devolvió {Code}: {Body}", (int)resp.StatusCode, body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Heartbeat falló.");
        }
    }
}
