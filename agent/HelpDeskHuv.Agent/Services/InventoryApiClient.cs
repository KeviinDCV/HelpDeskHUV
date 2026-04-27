using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using HelpDeskHuv.Agent.Models;

namespace HelpDeskHuv.Agent.Services;

/// <summary>
/// Cliente HTTP del agente. Llama /sync, /heartbeat e /identify
/// con reintentos exponenciales (backoff configurable).
/// </summary>
public sealed class InventoryApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly HttpClient _http;
    private readonly ILogger<InventoryApiClient> _logger;
    private readonly int[] _retryDelays;

    public InventoryApiClient(HttpClient http, IConfiguration config, ILogger<InventoryApiClient> logger)
    {
        _http = http;
        _logger = logger;
        _retryDelays = config.GetSection("Agent:RetryDelaysSeconds").Get<int[]>() ?? new[] { 30, 60, 300, 900 };
        _http.Timeout = TimeSpan.FromSeconds(config.GetValue("Agent:TimeoutSeconds", 60));
        _http.DefaultRequestHeaders.UserAgent.ParseAdd("HelpDeskHuv-Agent/1.0 (Windows)");
        _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public void Configure(string baseUrl, string token)
    {
        var trimmed = baseUrl.TrimEnd('/');
        if (!trimmed.EndsWith("/api/inventory", StringComparison.OrdinalIgnoreCase))
        {
            trimmed += "/api/inventory";
        }
        _http.BaseAddress = new Uri(trimmed + "/");
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    public async Task<bool> HealthAsync(CancellationToken ct)
    {
        try
        {
            var resp = await _http.GetAsync("health", ct);
            return resp.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Health check falló");
            return false;
        }
    }

    public Task<HttpResponseMessage> SyncAsync(InventoryPayload payload, CancellationToken ct)
        => SendWithRetryAsync(HttpMethod.Post, "sync", payload, ct);

    public Task<HttpResponseMessage> HeartbeatAsync(string hardwareUuid, string agentVersion, CancellationToken ct)
        => SendWithRetryAsync(HttpMethod.Post, "heartbeat", new { hardware_uuid = hardwareUuid, agent_version = agentVersion }, ct);

    public Task<HttpResponseMessage> IdentifyAsync(string hardwareUuid, string? serial, string? hostname, CancellationToken ct)
        => SendWithRetryAsync(HttpMethod.Post, "identify", new { hardware_uuid = hardwareUuid, serial, hostname }, ct);

    private async Task<HttpResponseMessage> SendWithRetryAsync<T>(HttpMethod method, string path, T body, CancellationToken ct)
    {
        if (_http.BaseAddress is null)
            throw new InvalidOperationException("Cliente HTTP no configurado: falta BaseAddress/Token.");

        Exception? lastException = null;
        var attempt = 0;
        while (attempt <= _retryDelays.Length)
        {
            try
            {
                using var req = new HttpRequestMessage(method, path)
                {
                    Content = JsonContent.Create(body, options: JsonOptions),
                };
                var resp = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);

                // Errores 4xx (excepto 429): no reintentar, quien llama decide.
                if (!resp.IsSuccessStatusCode && resp.StatusCode != HttpStatusCode.TooManyRequests
                    && (int)resp.StatusCode >= 400 && (int)resp.StatusCode < 500)
                {
                    var bodyStr = await resp.Content.ReadAsStringAsync(ct);
                    _logger.LogWarning("Respuesta {Code} en {Path}: {Body}", (int)resp.StatusCode, path, bodyStr);
                    return resp;
                }
                if (resp.IsSuccessStatusCode) return resp;

                _logger.LogWarning("Intento {Attempt} falló con {Code} en {Path}", attempt + 1, (int)resp.StatusCode, path);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                lastException = ex;
                _logger.LogWarning(ex, "Intento {Attempt} falló en {Path}", attempt + 1, path);
            }

            if (attempt >= _retryDelays.Length) break;
            await Task.Delay(TimeSpan.FromSeconds(_retryDelays[attempt]), ct);
            attempt++;
        }

        throw new HttpRequestException($"Todos los reintentos fallaron para {path}.", lastException);
    }
}
