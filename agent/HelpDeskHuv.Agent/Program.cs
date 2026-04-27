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

await builder.Build().RunAsync();
