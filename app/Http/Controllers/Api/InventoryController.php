<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InventorySyncRequest;
use App\Models\AgentDevice;
use App\Services\InventorySyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * API expuesta al agente Windows de inventario.
 *
 * Endpoints:
 *   GET  /api/inventory/health     (público)
 *   POST /api/inventory/identify   (auth) - verifica si un equipo ya existe
 *   POST /api/inventory/sync       (auth) - recibe inventario completo
 *   POST /api/inventory/heartbeat  (auth) - marca al agente como vivo
 */
class InventoryController extends Controller
{
    public function __construct(private InventorySyncService $syncService)
    {
    }

    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'helpdesk-huv-inventory-api',
            'version' => '1.0.0',
            'time' => now()->toIso8601String(),
        ]);
    }

    /**
     * Verifica si un equipo ya existe (por hardware_uuid o serial).
     * Permite al agente decidir si "Crear" o "Enviar datos".
     */
    public function identify(Request $request): JsonResponse
    {
        $request->validate([
            'hardware_uuid' => 'nullable|string|max:191',
            'serial' => 'nullable|string|max:191',
            'hostname' => 'nullable|string|max:191',
        ]);

        $query = DB::table('glpi_computers')
            ->select('id', 'name', 'serial', 'uuid', 'date_mod')
            ->where('is_deleted', 0);

        if ($request->filled('hardware_uuid')) {
            $query->where('uuid', $request->input('hardware_uuid'));
        } elseif ($request->filled('serial')) {
            $query->where('serial', $request->input('serial'));
        } elseif ($request->filled('hostname')) {
            $query->where('name', $request->input('hostname'));
        } else {
            return response()->json([
                'exists' => false,
                'message' => 'Debe enviar hardware_uuid, serial o hostname.',
            ], 422);
        }

        $found = $query->first();

        return response()->json([
            'exists' => (bool) $found,
            'computer' => $found,
        ]);
    }

    /**
     * Recibe el payload completo del agente y sincroniza toda la información.
     */
    public function sync(InventorySyncRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $device = $this->resolveAgentDevice($request, $payload['hardware_uuid']);

        try {
            $stats = $this->syncService->sync($payload, $device, $request->ip());
        } catch (\Throwable $e) {
            Log::error('InventorySync error', [
                'device_id' => $device->id,
                'hardware_uuid' => $payload['hardware_uuid'] ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $device->update([
                'last_error' => substr($e->getMessage(), 0, 1000),
            ]);

            return response()->json([
                'ok' => false,
                'error' => 'sync_failed',
                'message' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'ok' => true,
            'computer_id' => $stats['computer_id'],
            'created' => $stats['created'],
            'components_synced' => $stats['components_synced'],
            'message' => $stats['created']
                ? 'Equipo creado e inventariado correctamente'
                : 'Equipo actualizado correctamente',
        ]);
    }

    /**
     * Heartbeat: el agente reporta que está vivo sin enviar inventario completo.
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $request->validate([
            'hardware_uuid' => 'required|string|max:191',
            'agent_version' => 'nullable|string|max:50',
        ]);

        $device = $this->resolveAgentDevice($request, $request->input('hardware_uuid'));
        $device->update([
            'last_seen_at' => now(),
            'last_ip' => $request->ip(),
            'agent_version' => $request->input('agent_version') ?: $device->agent_version,
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Encuentra o crea el AgentDevice asociado al token de la request.
     * Cada token Sanctum está atado a un único hardware_uuid (1:1).
     */
    private function resolveAgentDevice(Request $request, string $hardwareUuid): AgentDevice
    {
        $token = $request->user()->currentAccessToken();
        $tokenId = $token?->id;

        // Ya existe device con ese UUID
        $device = AgentDevice::where('hardware_uuid', $hardwareUuid)->first();
        if ($device) {
            // Vincular token si era de un dispositivo "pending"
            if ($tokenId && $device->token_id !== $tokenId) {
                $device->update(['token_id' => $tokenId]);
            }
            return $device;
        }

        // Si no existe, crearlo (primera sincronización)
        return AgentDevice::create([
            'hardware_uuid' => $hardwareUuid,
            'token_id' => $tokenId,
            'status' => 'active',
        ]);
    }
}
