using System.Net.Http.Json;
using System.Runtime.Versioning;
using HelpDeskHuv.Agent;
using HelpDeskHuv.Agent.Services;

[assembly: SupportedOSPlatform("windows")]

var builder = Host.CreateApplicationBuilder(args);

// Permitir que el ejecutable corra como servicio Windows o como consola.
builder.Services.AddWindowsService(opts =>
{
    opts.ServiceName = "HelpDeskHuvAgent";
});

// EventLog (visible en Visor de eventos > Application)
if (OperatingSystem.IsWindows())
{
    builder.Logging.AddEventLog(settings =>
    {
        settings.SourceName = "HelpDeskHuv-Agent";
        settings.LogName = "Application";
    });
}

// Servicios del agente
builder.Services.AddSingleton<AgentConfigStore>();
builder.Services.AddSingleton<InventoryCollector>();
builder.Services.AddHttpClient<InventoryApiClient>();

builder.Services.AddHostedService<InventoryWorker>();

// Modo CLI: configurar token desde la línea de comandos.
//   HelpDeskHuv.Agent.exe set-config --base-url=https://helpdesk.huv.gov.co --token=1|abc...
if (args.Length > 0 && args[0].Equals("set-config", StringComparison.OrdinalIgnoreCase))
{
    var host = builder.Build();
    var store = host.Services.GetRequiredService<AgentConfigStore>();
    var current = store.Load();

    foreach (var arg in args.Skip(1))
    {
        if (arg.StartsWith("--base-url=", StringComparison.OrdinalIgnoreCase))
            current.BaseUrl = arg["--base-url=".Length..];
        else if (arg.StartsWith("--token=", StringComparison.OrdinalIgnoreCase))
            current.Token = arg["--token=".Length..];
    }

    store.Save(current);
    Console.WriteLine("Configuración guardada.");
    return;
}

// Modo CLI: auto-registro contra /api/inventory/register
//   HelpDeskHuv.Agent.exe register --base-url=http://helpdesk.huv.gov.co --enrollment-secret=XXXX
if (args.Length > 0 && args[0].Equals("register", StringComparison.OrdinalIgnoreCase))
{
    string? baseUrl = null;
    string? secret = null;
    foreach (var arg in args.Skip(1))
    {
        if (arg.StartsWith("--base-url=", StringComparison.OrdinalIgnoreCase))
            baseUrl = arg["--base-url=".Length..];
        else if (arg.StartsWith("--enrollment-secret=", StringComparison.OrdinalIgnoreCase))
            secret = arg["--enrollment-secret=".Length..];
    }
    if (string.IsNullOrWhiteSpace(baseUrl) || string.IsNullOrWhiteSpace(secret))
    {
        Console.Error.WriteLine("Uso: register --base-url=<URL> --enrollment-secret=<SECRET>");
        Environment.ExitCode = 2;
        return;
    }

    var host = builder.Build();
    var store = host.Services.GetRequiredService<AgentConfigStore>();
    var collector = host.Services.GetRequiredService<InventoryCollector>();

    var general = collector.CollectGeneral();
    var hwUuid = collector.GetHardwareUuid();
    var winUser = collector.GetInteractiveUsername();

    using var http = new HttpClient { BaseAddress = new Uri(baseUrl), Timeout = TimeSpan.FromSeconds(60) };
    http.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));

    var payload = new
    {
        enrollment_secret = secret,
        hardware_uuid = hwUuid,
        hostname = general.Hostname,
        serial = general.Serial,
        windows_username = winUser,
        agent_version = "1.0.0"
    };

    Console.WriteLine($"Registrando equipo {payload.hostname} (UUID {payload.hardware_uuid}) en {baseUrl} ...");
    try
    {
        var resp = await http.PostAsJsonAsync("/api/inventory/register", payload);
        var body = await resp.Content.ReadAsStringAsync();
        if (!resp.IsSuccessStatusCode)
        {
            Console.Error.WriteLine($"ERROR HTTP {(int)resp.StatusCode}: {body}");
            Environment.ExitCode = 3;
            return;
        }
        using var doc = System.Text.Json.JsonDocument.Parse(body);
        var token = doc.RootElement.GetProperty("token").GetString();
        if (string.IsNullOrWhiteSpace(token))
        {
            Console.Error.WriteLine("Respuesta sin token.");
            Environment.ExitCode = 4;
            return;
        }

        var cfg = store.Load();
        cfg.BaseUrl = baseUrl;
        cfg.Token = token;
        store.Save(cfg);
        Console.WriteLine("Registro OK. Token guardado (cifrado DPAPI).");
        return;
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"ERROR: {ex.Message}");
        Environment.ExitCode = 5;
        return;
    }
}

await builder.Build().RunAsync();
