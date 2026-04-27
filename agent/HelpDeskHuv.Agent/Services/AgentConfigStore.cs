using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace HelpDeskHuv.Agent.Services;

/// <summary>
/// Lee y persiste el archivo de configuración del agente, incluyendo
/// el token de Sanctum cifrado con DPAPI a nivel máquina.
/// </summary>
public sealed class AgentConfigStore
{
    private const string ConfigFileName = "agent.config.json";
    private const string EntropyValue = "HelpDeskHUV.Agent.v1";

    private readonly string _configPath;
    private readonly ILogger<AgentConfigStore> _logger;

    public AgentConfigStore(IConfiguration configuration, ILogger<AgentConfigStore> logger)
    {
        _logger = logger;
        var dir = Environment.ExpandEnvironmentVariables(
            configuration["Agent:ConfigDirectory"] ?? @"%ProgramData%\HelpDeskHUV");
        Directory.CreateDirectory(dir);
        _configPath = Path.Combine(dir, ConfigFileName);
    }

    public AgentConfig Load()
    {
        if (!File.Exists(_configPath))
        {
            _logger.LogWarning("Archivo de configuración no encontrado en {Path}. Se usará configuración vacía.", _configPath);
            return new AgentConfig();
        }

        try
        {
            var json = File.ReadAllText(_configPath, Encoding.UTF8);
            var stored = JsonSerializer.Deserialize<StoredAgentConfig>(json) ?? new StoredAgentConfig();
            return new AgentConfig
            {
                BaseUrl = stored.BaseUrl,
                Token = DecryptToken(stored.TokenEncrypted),
                LastSyncAt = stored.LastSyncAt,
                LastHeartbeatAt = stored.LastHeartbeatAt,
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cargando configuración del agente.");
            return new AgentConfig();
        }
    }

    public void Save(AgentConfig config)
    {
        var stored = new StoredAgentConfig
        {
            BaseUrl = config.BaseUrl,
            TokenEncrypted = EncryptToken(config.Token),
            LastSyncAt = config.LastSyncAt,
            LastHeartbeatAt = config.LastHeartbeatAt,
        };
        var json = JsonSerializer.Serialize(stored, new JsonSerializerOptions
        {
            WriteIndented = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        });
        File.WriteAllText(_configPath, json, new UTF8Encoding(false));
    }

    private static string? EncryptToken(string? plain)
    {
        if (string.IsNullOrEmpty(plain)) return null;
        if (!OperatingSystem.IsWindows()) return plain; // fallback dev (Linux/macOS)
        var data = Encoding.UTF8.GetBytes(plain);
        var entropy = Encoding.UTF8.GetBytes(EntropyValue);
        var encrypted = ProtectedData.Protect(data, entropy, DataProtectionScope.LocalMachine);
        return Convert.ToBase64String(encrypted);
    }

    private static string? DecryptToken(string? encrypted)
    {
        if (string.IsNullOrEmpty(encrypted)) return null;
        if (!OperatingSystem.IsWindows()) return encrypted;
        try
        {
            var data = Convert.FromBase64String(encrypted);
            var entropy = Encoding.UTF8.GetBytes(EntropyValue);
            var decrypted = ProtectedData.Unprotect(data, entropy, DataProtectionScope.LocalMachine);
            return Encoding.UTF8.GetString(decrypted);
        }
        catch
        {
            // Si falla, asumimos que es texto plano (token recién instalado por el deploy script)
            return encrypted;
        }
    }

    private sealed class StoredAgentConfig
    {
        [JsonPropertyName("base_url")] public string? BaseUrl { get; set; }
        [JsonPropertyName("token_encrypted")] public string? TokenEncrypted { get; set; }
        [JsonPropertyName("last_sync_at")] public DateTime? LastSyncAt { get; set; }
        [JsonPropertyName("last_heartbeat_at")] public DateTime? LastHeartbeatAt { get; set; }
    }
}

public sealed class AgentConfig
{
    public string? BaseUrl { get; set; }
    public string? Token { get; set; }
    public DateTime? LastSyncAt { get; set; }
    public DateTime? LastHeartbeatAt { get; set; }
}
