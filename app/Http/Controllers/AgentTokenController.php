<?php

namespace App\Http\Controllers;

use App\Models\AgentDevice;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AgentTokenController extends Controller
{
    /**
     * Lista los tokens emitidos para el agente de inventario
     * y los AgentDevice asociados.
     */
    public function index(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 15), 50000);
        $search = (string) $request->input('search', '');

        // Tokens del personal_access_tokens cuyo nombre indica que son del agente:
        // (los emitimos siempre con la habilidad 'agent:sync').
        $query = DB::table('personal_access_tokens as pat')
            ->leftJoin('users as u', function ($join) {
                $join->on('u.id', '=', 'pat.tokenable_id')
                     ->where('pat.tokenable_type', '=', User::class);
            })
            ->leftJoin('agent_devices as ad', 'ad.token_id', '=', 'pat.id')
            ->select([
                'pat.id',
                'pat.name',
                'pat.abilities',
                'pat.last_used_at',
                'pat.expires_at',
                'pat.created_at',
                'u.id as user_id',
                'u.username as user_username',
                'u.name as user_name',
                'ad.id as device_id',
                'ad.hardware_uuid',
                'ad.computer_id',
                'ad.hostname',
                'ad.serial',
                'ad.windows_username',
                'ad.status as device_status',
                'ad.last_seen_at',
                'ad.last_ip',
                'ad.agent_version',
                'ad.sync_count',
            ])
            ->where('pat.abilities', 'like', '%agent:sync%');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('pat.name', 'like', "%{$search}%")
                  ->orWhere('u.username', 'like', "%{$search}%")
                  ->orWhere('ad.hostname', 'like', "%{$search}%")
                  ->orWhere('ad.hardware_uuid', 'like', "%{$search}%")
                  ->orWhere('ad.serial', 'like', "%{$search}%");
            });
        }

        $tokens = $query->orderByDesc('pat.created_at')->paginate($perPage)->withQueryString();

        // Decodificar abilities (vienen como JSON string)
        $tokens->getCollection()->transform(function ($t) {
            $t->abilities = json_decode($t->abilities ?? '[]', true) ?: [];
            return $t;
        });

        // Listado de usuarios admin/técnico para asociar tokens nuevos
        $users = User::query()
            ->select('id', 'username', 'name', 'role')
            ->where('is_active', 1)
            ->whereIn('role', ['Administrador', 'Técnico'])
            ->orderBy('username')
            ->get();

        return Inertia::render('administracion/agente-tokens', [
            'tokens' => $tokens,
            'users' => $users,
            'filters' => [
                'per_page' => $perPage,
                'search' => $search,
            ],
            // Esta clave reemplaza entera al 'flash' compartido de HandleInertiaRequests (la fusión
            // de props no es profunda): sin success/error aquí, los avisos de revocar o de
            // permisos no llegaban nunca a la página.
            'flash' => [
                'plain_token' => $request->session()->pull('plain_token'),
                'token_meta' => $request->session()->pull('token_meta'),
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }

    /**
     * Emite un nuevo token de agente para un usuario administrativo.
     * Devuelve el plainTextToken UNA SOLA vez vía flash.
     */
    public function store(Request $request)
    {
        if ($denegado = $this->soloAdministradores()) {
            return $denegado;
        }

        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'name' => 'required|string|max:120',
            'days' => 'nullable|integer|min:0|max:3650',
        ]);

        $user = User::findOrFail($data['user_id']);
        $days = (int) ($data['days'] ?? 0);
        $expiresAt = $days > 0 ? now()->addDays($days) : null;

        $newToken = $user->createToken($data['name'], ['agent:sync'], $expiresAt);

        return redirect()
            ->route('administracion.agente-tokens')
            ->with('plain_token', $newToken->plainTextToken)
            ->with('token_meta', [
                'id' => $newToken->accessToken->id,
                'name' => $data['name'],
                'user' => $user->username,
                'expires_at' => $expiresAt?->toIso8601String(),
            ]);
    }

    /**
     * Revoca un token (lo elimina). El AgentDevice asociado queda
     * sin token_id (y se marca como disabled si tiene un device).
     */
    public function destroy(int $id)
    {
        if ($denegado = $this->soloAdministradores()) {
            return $denegado;
        }

        // Solo tokens del agente. Antes se borraba cualquier fila de personal_access_tokens con
        // ese id, fuera o no del agente de inventario.
        $esDelAgente = DB::table('personal_access_tokens')
            ->where('id', $id)
            ->where('abilities', 'like', '%agent:sync%')
            ->exists();

        if (! $esDelAgente) {
            return redirect()
                ->route('administracion.agente-tokens')
                ->with('error', 'Ese token no existe o no pertenece al agente de inventario.');
        }

        DB::transaction(function () use ($id) {
            // Si hay un AgentDevice atado, lo desactivamos pero conservamos
            // el histórico de hardware (no lo borramos).
            DB::table('agent_devices')
                ->where('token_id', $id)
                ->update(['status' => 'disabled', 'token_id' => 0]);

            DB::table('personal_access_tokens')->where('id', $id)->delete();
        });

        return redirect()
            ->route('administracion.agente-tokens')
            ->with('success', 'Token revocado correctamente.');
    }

    /**
     * Cambia el estado del AgentDevice (active/disabled).
     */
    public function toggleDevice(int $id)
    {
        if ($denegado = $this->soloAdministradores()) {
            return $denegado;
        }

        $device = AgentDevice::findOrFail($id);
        $device->status = $device->status === 'active' ? 'disabled' : 'active';
        $device->save();

        return redirect()
            ->route('administracion.agente-tokens')
            ->with('success', 'Estado del equipo actualizado.');
    }

    /**
     * Emitir, revocar y activar/desactivar son acciones de administrador — la página ya ocultaba
     * esos botones a los demás roles, pero el servidor no lo exigía: la ruta solo pide sesión, así
     * que cualquier usuario autenticado podía emitirse tokens a nombre de otra cuenta o revocarlos.
     */
    private function soloAdministradores()
    {
        if (auth()->user()?->role !== 'Administrador') {
            return redirect()
                ->route('administracion.agente-tokens')
                ->with('error', 'No tienes permisos para realizar esta acción');
        }

        return null;
    }
}
