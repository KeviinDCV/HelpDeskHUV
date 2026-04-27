using System.Text.Json.Serialization;

namespace HelpDeskHuv.Agent.Models;

/// <summary>
/// Payload completo enviado al endpoint /api/inventory/sync.
/// Las propiedades opcionales se omiten si son nulas o están vacías.
/// </summary>
public sealed class InventoryPayload
{
    [JsonPropertyName("hardware_uuid")]
    public string HardwareUuid { get; set; } = string.Empty;

    [JsonPropertyName("agent_version")]
    public string AgentVersion { get; set; } = "1.0.0";

    [JsonPropertyName("windows_username")]
    public string? WindowsUsername { get; set; }

    [JsonPropertyName("general")]
    public GeneralInfo? General { get; set; }

    [JsonPropertyName("operating_system")]
    public OperatingSystemInfo? OperatingSystem { get; set; }

    [JsonPropertyName("cpus")]
    public List<CpuInfo>? Cpus { get; set; }

    [JsonPropertyName("memories")]
    public List<MemoryInfo>? Memories { get; set; }

    [JsonPropertyName("hard_drives")]
    public List<HardDriveInfo>? HardDrives { get; set; }

    [JsonPropertyName("network_cards")]
    public List<NetworkCardInfo>? NetworkCards { get; set; }

    [JsonPropertyName("graphic_cards")]
    public List<GraphicCardInfo>? GraphicCards { get; set; }

    [JsonPropertyName("sound_cards")]
    public List<SoundCardInfo>? SoundCards { get; set; }

    [JsonPropertyName("motherboard")]
    public MotherboardInfo? Motherboard { get; set; }

    [JsonPropertyName("bios")]
    public BiosInfo? Bios { get; set; }

    [JsonPropertyName("volumes")]
    public List<VolumeInfo>? Volumes { get; set; }

    [JsonPropertyName("network_ports")]
    public List<NetworkPortInfo>? NetworkPorts { get; set; }

    [JsonPropertyName("software")]
    public List<SoftwareInfo>? Software { get; set; }

    [JsonPropertyName("antivirus")]
    public List<AntivirusInfo>? Antivirus { get; set; }

    [JsonPropertyName("monitors")]
    public List<MonitorInfo>? Monitors { get; set; }
}

public sealed class GeneralInfo
{
    [JsonPropertyName("hostname")] public string? Hostname { get; set; }
    [JsonPropertyName("serial")] public string? Serial { get; set; }
    [JsonPropertyName("asset_tag")] public string? AssetTag { get; set; }
    [JsonPropertyName("manufacturer")] public string? Manufacturer { get; set; }
    [JsonPropertyName("model")] public string? Model { get; set; }
    [JsonPropertyName("type")] public string? Type { get; set; }
    [JsonPropertyName("domain")] public string? Domain { get; set; }
}

public sealed class OperatingSystemInfo
{
    [JsonPropertyName("name")] public string? Name { get; set; }
    [JsonPropertyName("version")] public string? Version { get; set; }
    [JsonPropertyName("architecture")] public string? Architecture { get; set; }
    [JsonPropertyName("kernel_version")] public string? KernelVersion { get; set; }
    [JsonPropertyName("edition")] public string? Edition { get; set; }
    [JsonPropertyName("license_key")] public string? LicenseKey { get; set; }
    [JsonPropertyName("product_id")] public string? ProductId { get; set; }
}

public sealed class CpuInfo
{
    [JsonPropertyName("designation")] public string Designation { get; set; } = string.Empty;
    [JsonPropertyName("manufacturer")] public string? Manufacturer { get; set; }
    [JsonPropertyName("frequency_mhz")] public int FrequencyMhz { get; set; }
    [JsonPropertyName("cores")] public int Cores { get; set; }
    [JsonPropertyName("threads")] public int Threads { get; set; }
    [JsonPropertyName("serial")] public string? Serial { get; set; }
    [JsonPropertyName("bus_id")] public string? BusId { get; set; }
}

public sealed class MemoryInfo
{
    [JsonPropertyName("designation")] public string Designation { get; set; } = string.Empty;
    [JsonPropertyName("manufacturer")] public string? Manufacturer { get; set; }
    [JsonPropertyName("size_mb")] public long SizeMb { get; set; }
    [JsonPropertyName("serial")] public string? Serial { get; set; }
    [JsonPropertyName("slot")] public string? Slot { get; set; }
}

public sealed class HardDriveInfo
{
    [JsonPropertyName("designation")] public string Designation { get; set; } = string.Empty;
    [JsonPropertyName("manufacturer")] public string? Manufacturer { get; set; }
    [JsonPropertyName("capacity_mb")] public long CapacityMb { get; set; }
    [JsonPropertyName("serial")] public string? Serial { get; set; }
    [JsonPropertyName("type")] public string? Type { get; set; }
}

public sealed class NetworkCardInfo
{
    [JsonPropertyName("designation")] public string Designation { get; set; } = string.Empty;
    [JsonPropertyName("manufacturer")] public string? Manufacturer { get; set; }
    [JsonPropertyName("mac")] public string? Mac { get; set; }
    [JsonPropertyName("bus_id")] public string? BusId { get; set; }
}

public sealed class GraphicCardInfo
{
    [JsonPropertyName("designation")] public string Designation { get; set; } = string.Empty;
    [JsonPropertyName("manufacturer")] public string? Manufacturer { get; set; }
    [JsonPropertyName("memory_mb")] public long MemoryMb { get; set; }
    [JsonPropertyName("bus_id")] public string? BusId { get; set; }
}

public sealed class SoundCardInfo
{
    [JsonPropertyName("designation")] public string Designation { get; set; } = string.Empty;
    [JsonPropertyName("manufacturer")] public string? Manufacturer { get; set; }
}

public sealed class MotherboardInfo
{
    [JsonPropertyName("designation")] public string Designation { get; set; } = string.Empty;
    [JsonPropertyName("manufacturer")] public string? Manufacturer { get; set; }
    [JsonPropertyName("serial")] public string? Serial { get; set; }
}

public sealed class BiosInfo
{
    [JsonPropertyName("designation")] public string Designation { get; set; } = string.Empty;
    [JsonPropertyName("manufacturer")] public string? Manufacturer { get; set; }
    [JsonPropertyName("version")] public string? Version { get; set; }
    [JsonPropertyName("serial")] public string? Serial { get; set; }
}

public sealed class VolumeInfo
{
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("mountpoint")] public string? Mountpoint { get; set; }
    [JsonPropertyName("device")] public string? Device { get; set; }
    [JsonPropertyName("filesystem")] public string? Filesystem { get; set; }
    [JsonPropertyName("total_mb")] public long TotalMb { get; set; }
    [JsonPropertyName("free_mb")] public long FreeMb { get; set; }
}

public sealed class NetworkPortInfo
{
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("mac")] public string? Mac { get; set; }
    [JsonPropertyName("ips")] public List<string> Ips { get; set; } = new();
}

public sealed class SoftwareInfo
{
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("version")] public string? Version { get; set; }
    [JsonPropertyName("publisher")] public string? Publisher { get; set; }
}

public sealed class AntivirusInfo
{
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("manufacturer")] public string? Manufacturer { get; set; }
    [JsonPropertyName("version")] public string? Version { get; set; }
    [JsonPropertyName("signature_version")] public string? SignatureVersion { get; set; }
    [JsonPropertyName("enabled")] public bool Enabled { get; set; }
    [JsonPropertyName("up_to_date")] public bool UpToDate { get; set; }
    [JsonPropertyName("expiration_date")] public string? ExpirationDate { get; set; }
}

public sealed class MonitorInfo
{
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("serial")] public string? Serial { get; set; }
    [JsonPropertyName("manufacturer")] public string? Manufacturer { get; set; }
    [JsonPropertyName("model")] public string? Model { get; set; }
    [JsonPropertyName("size_inches")] public int? SizeInches { get; set; }
    [JsonPropertyName("resolution")] public string? Resolution { get; set; }
}
