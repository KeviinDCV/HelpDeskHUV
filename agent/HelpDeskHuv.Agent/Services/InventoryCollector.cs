using System.Management;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Runtime.Versioning;
using HelpDeskHuv.Agent.Models;
using Microsoft.Win32;

namespace HelpDeskHuv.Agent.Services;

/// <summary>
/// Recolector de inventario basado en WMI/CIM.
/// Cualquier excepción dentro de un bloque queda contenida: el agente
/// continúa enviando lo que sí pudo obtener.
/// </summary>
[SupportedOSPlatform("windows")]
public sealed class InventoryCollector
{
    private readonly ILogger<InventoryCollector> _logger;

    public InventoryCollector(ILogger<InventoryCollector> logger)
    {
        _logger = logger;
    }

    public InventoryPayload Collect(string agentVersion)
    {
        var payload = new InventoryPayload
        {
            AgentVersion = agentVersion,
            HardwareUuid = GetHardwareUuid(),
            WindowsUsername = GetInteractiveUsername(),
        };

        Safe(() => payload.General = CollectGeneral(),       nameof(payload.General));
        Safe(() => payload.OperatingSystem = CollectOs(),    nameof(payload.OperatingSystem));
        Safe(() => payload.Cpus = CollectCpus(),             nameof(payload.Cpus));
        Safe(() => payload.Memories = CollectMemories(),     nameof(payload.Memories));
        Safe(() => payload.HardDrives = CollectHardDrives(), nameof(payload.HardDrives));
        Safe(() => payload.NetworkCards = CollectNics(),     nameof(payload.NetworkCards));
        Safe(() => payload.GraphicCards = CollectGpus(),     nameof(payload.GraphicCards));
        Safe(() => payload.SoundCards = CollectSoundCards(), nameof(payload.SoundCards));
        Safe(() => payload.Motherboard = CollectMotherboard(),nameof(payload.Motherboard));
        Safe(() => payload.Bios = CollectBios(),             nameof(payload.Bios));
        Safe(() => payload.Volumes = CollectVolumes(),       nameof(payload.Volumes));
        Safe(() => payload.NetworkPorts = CollectNetPorts(), nameof(payload.NetworkPorts));
        Safe(() => payload.Software = CollectSoftware(),     nameof(payload.Software));
        Safe(() => payload.Antivirus = CollectAntivirus(),   nameof(payload.Antivirus));
        Safe(() => payload.Monitors = CollectMonitors(),     nameof(payload.Monitors));

        return payload;
    }

    private void Safe(Action action, string section)
    {
        try { action(); }
        catch (Exception ex) { _logger.LogWarning(ex, "Fallo recolectando sección {Section}", section); }
    }

    // -----------------------------------------------------------
    // Identidad principal
    // -----------------------------------------------------------

    public string GetHardwareUuid()
    {
        // 1) UUID del SMBIOS (Win32_ComputerSystemProduct.UUID)
        try
        {
            using var search = new ManagementObjectSearcher("SELECT UUID FROM Win32_ComputerSystemProduct");
            foreach (var obj in search.Get())
            {
                var uuid = obj["UUID"]?.ToString();
                if (!string.IsNullOrWhiteSpace(uuid) && uuid != "00000000-0000-0000-0000-000000000000" && uuid != "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF")
                    return uuid.Trim();
            }
        }
        catch (Exception ex) { _logger.LogWarning(ex, "No se pudo obtener SMBIOS UUID"); }

        // 2) Fallback: serial del BIOS
        try
        {
            using var search = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BIOS");
            foreach (var obj in search.Get())
            {
                var serial = obj["SerialNumber"]?.ToString();
                if (!string.IsNullOrWhiteSpace(serial)) return $"SERIAL-{serial.Trim()}";
            }
        }
        catch { /* ignore */ }

        // 3) Último recurso: hostname
        return $"HOSTNAME-{Environment.MachineName}";
    }

    public string? GetInteractiveUsername()
    {
        // El servicio corre como SYSTEM. Necesitamos saber qué usuario está logueado.
        try
        {
            using var search = new ManagementObjectSearcher("SELECT UserName FROM Win32_ComputerSystem");
            foreach (var obj in search.Get())
            {
                var user = obj["UserName"]?.ToString();
                if (!string.IsNullOrWhiteSpace(user))
                {
                    // Devuelve "DOMAIN\\user". Tomamos solo el sAMAccountName.
                    var idx = user.IndexOf('\\');
                    return idx >= 0 ? user[(idx + 1)..] : user;
                }
            }
        }
        catch { /* ignore */ }

        // Fallback: último usuario logueado del registro
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Authentication\LogonUI");
            var name = key?.GetValue("LastLoggedOnUser")?.ToString();
            if (!string.IsNullOrWhiteSpace(name))
            {
                var idx = name.IndexOf('\\');
                return idx >= 0 ? name[(idx + 1)..] : name;
            }
        }
        catch { /* ignore */ }

        return null;
    }

    // -----------------------------------------------------------
    // Bloques individuales
    // -----------------------------------------------------------

    public GeneralInfo CollectGeneral()
    {
        var info = new GeneralInfo
        {
            Hostname = Environment.MachineName,
        };

        using (var s = new ManagementObjectSearcher("SELECT Manufacturer, Model, Domain, PCSystemType FROM Win32_ComputerSystem"))
        foreach (var o in s.Get())
        {
            info.Manufacturer = o["Manufacturer"]?.ToString();
            info.Model = o["Model"]?.ToString();
            info.Domain = o["Domain"]?.ToString();
            info.Type = MapPcSystemType(o["PCSystemType"]);
        }

        using (var s = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BIOS"))
        foreach (var o in s.Get())
            info.Serial = o["SerialNumber"]?.ToString();

        using (var s = new ManagementObjectSearcher("SELECT SMBIOSAssetTag FROM Win32_SystemEnclosure"))
        foreach (var o in s.Get())
            info.AssetTag = o["SMBIOSAssetTag"]?.ToString();

        return info;
    }

    private static string? MapPcSystemType(object? value)
    {
        if (value is null) return null;
        return value.ToString() switch
        {
            "1" => "Desktop",
            "2" => "Laptop",
            "3" => "Workstation",
            "4" => "Server",
            "5" => "SOHO Server",
            "6" => "Appliance",
            "7" => "Performance Server",
            "8" => "Slate",
            _ => "Other"
        };
    }

    private OperatingSystemInfo CollectOs()
    {
        var info = new OperatingSystemInfo();
        using (var s = new ManagementObjectSearcher("SELECT Caption, Version, OSArchitecture, BuildNumber, SerialNumber FROM Win32_OperatingSystem"))
        foreach (var o in s.Get())
        {
            info.Name = o["Caption"]?.ToString()?.Trim();
            info.Version = o["Version"]?.ToString();
            info.Architecture = o["OSArchitecture"]?.ToString();
            info.KernelVersion = $"{o["Version"]}.{o["BuildNumber"]}";
            info.ProductId = o["SerialNumber"]?.ToString();
        }

        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion");
            info.Edition = key?.GetValue("EditionID")?.ToString();
        }
        catch { /* ignore */ }

        return info;
    }

    private List<CpuInfo> CollectCpus()
    {
        var list = new List<CpuInfo>();
        using var s = new ManagementObjectSearcher(
            "SELECT Name, Manufacturer, MaxClockSpeed, NumberOfCores, NumberOfLogicalProcessors, ProcessorId, DeviceID FROM Win32_Processor");
        foreach (var o in s.Get())
        {
            list.Add(new CpuInfo
            {
                Designation = (o["Name"]?.ToString() ?? "Unknown CPU").Trim(),
                Manufacturer = o["Manufacturer"]?.ToString(),
                FrequencyMhz = ParseInt(o["MaxClockSpeed"]),
                Cores = ParseInt(o["NumberOfCores"]),
                Threads = ParseInt(o["NumberOfLogicalProcessors"]),
                Serial = o["ProcessorId"]?.ToString(),
                BusId = o["DeviceID"]?.ToString(),
            });
        }
        return list;
    }

    private List<MemoryInfo> CollectMemories()
    {
        var list = new List<MemoryInfo>();
        using var s = new ManagementObjectSearcher(
            "SELECT Capacity, Manufacturer, MemoryType, SMBIOSMemoryType, SerialNumber, DeviceLocator, ConfiguredClockSpeed, Speed FROM Win32_PhysicalMemory");
        foreach (var o in s.Get())
        {
            var bytes = ParseLong(o["Capacity"]);
            var mb = bytes / (1024L * 1024L);
            var type = MapMemoryType(o["SMBIOSMemoryType"] ?? o["MemoryType"]);
            list.Add(new MemoryInfo
            {
                Designation = $"{type} {(o["Speed"] is null ? "" : $"@ {o["Speed"]} MHz")}".Trim(),
                Manufacturer = o["Manufacturer"]?.ToString(),
                SizeMb = mb,
                Serial = o["SerialNumber"]?.ToString(),
                Slot = o["DeviceLocator"]?.ToString(),
            });
        }
        return list;
    }

    private static string MapMemoryType(object? code)
    {
        return code?.ToString() switch
        {
            "20" => "DDR",
            "21" => "DDR2",
            "24" => "DDR3",
            "26" => "DDR4",
            "34" => "DDR5",
            _ => "Memoria"
        };
    }

    private List<HardDriveInfo> CollectHardDrives()
    {
        var list = new List<HardDriveInfo>();
        using var s = new ManagementObjectSearcher(
            "SELECT Model, Manufacturer, SerialNumber, Size, MediaType, InterfaceType FROM Win32_DiskDrive");
        foreach (var o in s.Get())
        {
            var sizeBytes = ParseLong(o["Size"]);
            list.Add(new HardDriveInfo
            {
                Designation = (o["Model"]?.ToString() ?? "Disco").Trim(),
                Manufacturer = o["Manufacturer"]?.ToString(),
                CapacityMb = sizeBytes / (1024L * 1024L),
                Serial = o["SerialNumber"]?.ToString()?.Trim(),
                Type = o["MediaType"]?.ToString() ?? o["InterfaceType"]?.ToString(),
            });
        }
        return list;
    }

    private List<NetworkCardInfo> CollectNics()
    {
        var list = new List<NetworkCardInfo>();
        using var s = new ManagementObjectSearcher(
            "SELECT Name, Manufacturer, MACAddress, PNPDeviceID FROM Win32_NetworkAdapter WHERE PhysicalAdapter=true AND MACAddress IS NOT NULL");
        foreach (var o in s.Get())
        {
            list.Add(new NetworkCardInfo
            {
                Designation = (o["Name"]?.ToString() ?? "NIC").Trim(),
                Manufacturer = o["Manufacturer"]?.ToString(),
                Mac = o["MACAddress"]?.ToString(),
                BusId = o["PNPDeviceID"]?.ToString(),
            });
        }
        return list;
    }

    private List<GraphicCardInfo> CollectGpus()
    {
        var list = new List<GraphicCardInfo>();
        using var s = new ManagementObjectSearcher(
            "SELECT Name, AdapterCompatibility, AdapterRAM, PNPDeviceID FROM Win32_VideoController");
        foreach (var o in s.Get())
        {
            var ram = ParseLong(o["AdapterRAM"]);
            list.Add(new GraphicCardInfo
            {
                Designation = (o["Name"]?.ToString() ?? "GPU").Trim(),
                Manufacturer = o["AdapterCompatibility"]?.ToString(),
                MemoryMb = ram / (1024L * 1024L),
                BusId = o["PNPDeviceID"]?.ToString(),
            });
        }
        return list;
    }

    private List<SoundCardInfo> CollectSoundCards()
    {
        var list = new List<SoundCardInfo>();
        using var s = new ManagementObjectSearcher("SELECT Name, Manufacturer FROM Win32_SoundDevice");
        foreach (var o in s.Get())
        {
            list.Add(new SoundCardInfo
            {
                Designation = (o["Name"]?.ToString() ?? "Audio").Trim(),
                Manufacturer = o["Manufacturer"]?.ToString(),
            });
        }
        return list;
    }

    private MotherboardInfo CollectMotherboard()
    {
        var info = new MotherboardInfo { Designation = "Motherboard" };
        using var s = new ManagementObjectSearcher("SELECT Product, Manufacturer, SerialNumber FROM Win32_BaseBoard");
        foreach (var o in s.Get())
        {
            info.Designation = (o["Product"]?.ToString() ?? "Motherboard").Trim();
            info.Manufacturer = o["Manufacturer"]?.ToString();
            info.Serial = o["SerialNumber"]?.ToString();
        }
        return info;
    }

    private BiosInfo CollectBios()
    {
        var info = new BiosInfo { Designation = "BIOS" };
        using var s = new ManagementObjectSearcher("SELECT Name, Manufacturer, SMBIOSBIOSVersion, SerialNumber FROM Win32_BIOS");
        foreach (var o in s.Get())
        {
            info.Designation = (o["Name"]?.ToString() ?? "BIOS").Trim();
            info.Manufacturer = o["Manufacturer"]?.ToString();
            info.Version = o["SMBIOSBIOSVersion"]?.ToString();
            info.Serial = o["SerialNumber"]?.ToString();
        }
        return info;
    }

    private List<VolumeInfo> CollectVolumes()
    {
        var list = new List<VolumeInfo>();
        foreach (var d in DriveInfo.GetDrives())
        {
            if (!d.IsReady || d.DriveType is not (DriveType.Fixed or DriveType.Removable)) continue;
            list.Add(new VolumeInfo
            {
                Name = d.VolumeLabel.Length > 0 ? d.VolumeLabel : d.Name.TrimEnd('\\'),
                Mountpoint = d.Name.TrimEnd('\\'),
                Device = d.RootDirectory.FullName,
                Filesystem = d.DriveFormat,
                TotalMb = d.TotalSize / (1024L * 1024L),
                FreeMb = d.AvailableFreeSpace / (1024L * 1024L),
            });
        }
        return list;
    }

    private List<NetworkPortInfo> CollectNetPorts()
    {
        var list = new List<NetworkPortInfo>();
        foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (nic.NetworkInterfaceType is NetworkInterfaceType.Loopback or NetworkInterfaceType.Tunnel) continue;
            if (nic.OperationalStatus != OperationalStatus.Up) continue;

            var props = nic.GetIPProperties();
            var ips = props.UnicastAddresses
                .Where(a => a.Address.AddressFamily == AddressFamily.InterNetwork)
                .Select(a => a.Address.ToString())
                .Where(ip => !ip.StartsWith("169.254."))
                .ToList();

            if (ips.Count == 0) continue;

            list.Add(new NetworkPortInfo
            {
                Name = nic.Name,
                Mac = string.Join(":", nic.GetPhysicalAddress().GetAddressBytes().Select(b => b.ToString("X2"))),
                Ips = ips,
            });
        }
        return list;
    }

    private List<SoftwareInfo> CollectSoftware()
    {
        var byName = new Dictionary<string, SoftwareInfo>(StringComparer.OrdinalIgnoreCase);

        ReadUninstallKey(RegistryHive.LocalMachine, RegistryView.Registry64, byName);
        ReadUninstallKey(RegistryHive.LocalMachine, RegistryView.Registry32, byName);
        ReadUninstallKey(RegistryHive.CurrentUser,  RegistryView.Registry64, byName);

        return byName.Values.OrderBy(s => s.Name).ToList();
    }

    private void ReadUninstallKey(RegistryHive hive, RegistryView view, Dictionary<string, SoftwareInfo> sink)
    {
        try
        {
            using var baseKey = RegistryKey.OpenBaseKey(hive, view);
            using var key = baseKey.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall");
            if (key is null) return;
            foreach (var subName in key.GetSubKeyNames())
            {
                using var sub = key.OpenSubKey(subName);
                var name = sub?.GetValue("DisplayName")?.ToString();
                if (string.IsNullOrWhiteSpace(name)) continue;
                if (!string.IsNullOrEmpty(sub?.GetValue("SystemComponent")?.ToString()) && sub.GetValue("SystemComponent")!.ToString() == "1") continue;
                if (sub?.GetValue("ParentDisplayName") != null) continue;

                if (!sink.ContainsKey(name))
                {
                    sink[name] = new SoftwareInfo
                    {
                        Name = name,
                        Version = sub?.GetValue("DisplayVersion")?.ToString(),
                        Publisher = sub?.GetValue("Publisher")?.ToString(),
                    };
                }
            }
        }
        catch (Exception ex) { _logger.LogDebug(ex, "Lectura registro {Hive}/{View}", hive, view); }
    }

    private List<AntivirusInfo> CollectAntivirus()
    {
        var list = new List<AntivirusInfo>();
        try
        {
            using var s = new ManagementObjectSearcher(@"\\.\root\SecurityCenter2", "SELECT * FROM AntiVirusProduct");
            foreach (var o in s.Get())
            {
                var name = o["displayName"]?.ToString() ?? "Antivirus";
                var state = ParseInt(o["productState"]);
                // productState: bit 12 enabled, bit 16 up to date (heurística estándar)
                var enabled = ((state >> 12) & 0xF) is 0x1 or 0x2 or 0x3;
                var upToDate = ((state >> 4) & 0xF) == 0;

                list.Add(new AntivirusInfo
                {
                    Name = name.Trim(),
                    Manufacturer = ExtractVendor(name),
                    Enabled = enabled,
                    UpToDate = upToDate,
                });
            }
        }
        catch (Exception ex) { _logger.LogDebug(ex, "SecurityCenter2 no disponible (¿servidor?)"); }
        return list;
    }

    private static string? ExtractVendor(string avName)
    {
        avName = avName.ToLowerInvariant();
        if (avName.Contains("windows defender") || avName.Contains("microsoft defender")) return "Microsoft Corporation";
        if (avName.Contains("kaspersky")) return "Kaspersky";
        if (avName.Contains("eset"))      return "ESET";
        if (avName.Contains("mcafee"))    return "McAfee";
        if (avName.Contains("norton"))    return "Symantec";
        if (avName.Contains("avast"))     return "Avast";
        if (avName.Contains("bitdefender")) return "Bitdefender";
        return null;
    }

    private List<MonitorInfo> CollectMonitors()
    {
        var list = new List<MonitorInfo>();
        try
        {
            using var s = new ManagementObjectSearcher(@"\\.\root\WMI", "SELECT * FROM WmiMonitorID");
            foreach (var o in s.Get())
            {
                var name = DecodeWmiString(o["UserFriendlyName"] as ushort[]);
                var serial = DecodeWmiString(o["SerialNumberID"] as ushort[]);
                var manuId = DecodeWmiString(o["ManufacturerName"] as ushort[]);
                var model = DecodeWmiString(o["ProductCodeID"] as ushort[]);
                if (string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(serial)) continue;

                list.Add(new MonitorInfo
                {
                    Name = string.IsNullOrWhiteSpace(name) ? "Monitor" : name!,
                    Serial = serial,
                    Manufacturer = manuId,
                    Model = model,
                });
            }
        }
        catch (Exception ex) { _logger.LogDebug(ex, "WmiMonitorID no disponible"); }
        return list;
    }

    private static string? DecodeWmiString(ushort[]? data)
    {
        if (data is null || data.Length == 0) return null;
        return new string(data.Where(b => b != 0).Select(b => (char)b).ToArray()).Trim();
    }

    // -----------------------------------------------------------
    // Helpers numéricos
    // -----------------------------------------------------------

    private static int ParseInt(object? v) => v is null ? 0 : int.TryParse(v.ToString(), out var i) ? i : 0;
    private static long ParseLong(object? v) => v is null ? 0 : long.TryParse(v.ToString(), out var l) ? l : 0;
}
