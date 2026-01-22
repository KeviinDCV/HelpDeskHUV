<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Mostrar el dashboard con tickets
     */
    public function index()
    {
        $user = auth()->user();
        
        // Obtener reportes públicos sin asignar (creados desde /reportar - users_id_recipient = 0)
        $publicTickets = $this->getPublicUnassignedTickets();
        
        // Obtener mis reportes (asignados a mí, no cerrados)
        $myTickets = $this->getMyTickets($user);

        // Estadísticas rápidas
        $stats = [
            'publicUnassigned' => $publicTickets->count(),
            'myTickets' => $this->getMyTicketsCount($user), // Todos mis casos
            'myPending' => $myTickets->count(), // Mis casos sin resolver
            'myResolved' => $this->getMyResolvedCount($user), // Mis casos resueltos
        ];

        // Obtener técnicos/admins para asignar (solo admins pueden asignar)
        // Filtrar solo usuarios activos de la tabla users de Laravel (donde se marca Activo/Inactivo)
        $technicians = [];
        if ($user->role === 'Administrador') {
            // Usar la tabla users de Laravel que es donde está el estado real de activo/inactivo
            $technicians = \App\Models\User::select('id', 'name')
                ->where('is_active', 1)
                ->whereIn('role', ['Técnico', 'Administrador'])
                ->orderBy('name')
                ->get();
        }

        return Inertia::render('dashboard', [
            'publicTickets' => $publicTickets,
            'myTickets' => $myTickets,
            'stats' => $stats,
            'technicians' => $technicians,
            'auth' => [
                'user' => $user
            ]
        ]);
    }

    /**
     * Obtener tickets actualizados (para polling en tiempo real)
     */
    public function getTickets()
    {
        $user = auth()->user();
        
        $publicTickets = $this->getPublicUnassignedTickets();
        $myTickets = $this->getMyTickets($user);

        $stats = [
            'publicUnassigned' => $publicTickets->count(),
            'myTickets' => $this->getMyTicketsCount($user), // Todos mis casos
            'myPending' => $myTickets->count(), // Mis casos sin resolver
            'myResolved' => $this->getMyResolvedCount($user), // Mis casos resueltos
        ];

        return response()->json([
            'publicTickets' => $publicTickets,
            'myTickets' => $myTickets,
            'stats' => $stats,
        ]);
    }

    /**
     * Obtener detalles de un ticket
     */
    public function getTicketDetails($id)
    {
        $ticket = DB::table('glpi_tickets as t')
            ->select(
                't.*',
                'cat.completename as category_name',
                'loc.completename as location_name',
                DB::raw("CASE 
                    WHEN t.priority = 1 THEN 'Muy baja'
                    WHEN t.priority = 2 THEN 'Baja'
                    WHEN t.priority = 3 THEN 'Media'
                    WHEN t.priority = 4 THEN 'Alta'
                    WHEN t.priority = 5 THEN 'Muy alta'
                    WHEN t.priority = 6 THEN 'Urgente'
                    ELSE 'Media'
                END as priority_name"),
                DB::raw("CASE 
                    WHEN t.status = 1 THEN 'Nuevo'
                    WHEN t.status = 2 THEN 'En curso (asignado)'
                    WHEN t.status = 3 THEN 'En curso (planificado)'
                    WHEN t.status = 4 THEN 'En espera'
                    WHEN t.status = 5 THEN 'Resuelto'
                    WHEN t.status = 6 THEN 'Cerrado'
                    ELSE 'Nuevo'
                END as status_name")
            )
            ->leftJoin('glpi_itilcategories as cat', 't.itilcategories_id', '=', 'cat.id')
            ->leftJoin('glpi_locations as loc', 't.locations_id', '=', 'loc.id')
            ->where('t.id', $id)
            ->first();

        if (!$ticket) {
            return response()->json(['error' => 'Ticket no encontrado'], 404);
        }

        // Obtener técnico asignado
        $assignedTech = DB::table('glpi_tickets_users as tu')
            ->join('glpi_users as u', 'tu.users_id', '=', 'u.id')
            ->where('tu.tickets_id', $id)
            ->where('tu.type', 2)
            ->select(DB::raw("CONCAT(u.firstname, ' ', u.realname) as name"))
            ->first();

        $ticket->assigned_tech = $assignedTech ? $assignedTech->name : null;

        // Obtener solución del caso (si existe)
        $solution = DB::table('glpi_itilsolutions')
            ->select(
                'glpi_itilsolutions.id',
                'glpi_itilsolutions.content',
                'glpi_itilsolutions.date_creation',
                DB::raw("COALESCE(NULLIF(CONCAT(gu.firstname, ' ', gu.realname), ' '), lu.name) as solved_by")
            )
            ->leftJoin('glpi_users as gu', 'glpi_itilsolutions.users_id', '=', 'gu.id')
            ->leftJoin('users as lu', 'glpi_itilsolutions.users_id', '=', 'lu.glpi_user_id')
            ->where('glpi_itilsolutions.itemtype', 'Ticket')
            ->where('glpi_itilsolutions.items_id', $id)
            ->orderBy('glpi_itilsolutions.id', 'desc')
            ->first();

        $ticket->solution = $solution;

        return response()->json($ticket);
    }

    /**
     * Asignar ticket a un técnico específico
     */
    public function assignTicket(Request $request, $id)
    {
        $user = auth()->user();
        
        if ($user->role !== 'Administrador') {
            return redirect()->back()->with('error', 'Solo los administradores pueden asignar tickets.');
        }

        $technicianId = $request->input('technician_id');
        
        if (!$technicianId) {
            return redirect()->back()->with('error', 'Debe seleccionar un técnico.');
        }

        $ticket = DB::table('glpi_tickets')
            ->where('id', $id)
            ->where('is_deleted', 0)
            ->first();

        if (!$ticket) {
            return redirect()->back()->with('error', 'Ticket no encontrado.');
        }

        // Obtener el glpi_user_id del técnico seleccionado
        $technician = \App\Models\User::find($technicianId);
        
        if (!$technician || !$technician->glpi_user_id) {
            return redirect()->back()->with('error', 'El técnico seleccionado no está vinculado con GLPI.');
        }
        
        $glpiUserId = $technician->glpi_user_id;

        DB::beginTransaction();
        try {
            // Eliminar asignaciones anteriores de técnicos
            DB::table('glpi_tickets_users')
                ->where('tickets_id', $id)
                ->where('type', 2)
                ->delete();

            // Asignar el nuevo técnico usando su glpi_user_id
            DB::table('glpi_tickets_users')->insert([
                'tickets_id' => $id,
                'users_id' => $glpiUserId,
                'type' => 2,
                'use_notification' => 1,
            ]);

            // Cambiar estado a "En curso (asignado)"
            DB::table('glpi_tickets')
                ->where('id', $id)
                ->update([
                    'status' => 2,
                    'date_mod' => now(),
                ]);

            DB::commit();

            return redirect()->back()->with('success', "Ticket asignado exitosamente a {$technician->name}.");

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al asignar el ticket: ' . $e->getMessage());
        }
    }

    /**
     * Obtener reportes públicos sin asignar (creados desde /reportar)
     */
    private function getPublicUnassignedTickets()
    {
        return DB::table('glpi_tickets as t')
            ->select(
                't.id',
                't.name',
                't.content',
                't.date',
                't.date_creation',
                't.priority',
                't.status',
                'cat.completename as category_name',
                DB::raw("CASE 
                    WHEN t.priority = 1 THEN 'Muy baja'
                    WHEN t.priority = 2 THEN 'Baja'
                    WHEN t.priority = 3 THEN 'Media'
                    WHEN t.priority = 4 THEN 'Alta'
                    WHEN t.priority = 5 THEN 'Muy alta'
                    WHEN t.priority = 6 THEN 'Urgente'
                    ELSE 'Media'
                END as priority_name"),
                DB::raw("CASE 
                    WHEN t.status = 1 THEN 'Nuevo'
                    WHEN t.status = 2 THEN 'En curso (asignado)'
                    WHEN t.status = 3 THEN 'En curso (planificado)'
                    WHEN t.status = 4 THEN 'En espera'
                    WHEN t.status = 5 THEN 'Resuelto'
                    WHEN t.status = 6 THEN 'Cerrado'
                    ELSE 'Nuevo'
                END as status_name")
            )
            ->leftJoin('glpi_itilcategories as cat', 't.itilcategories_id', '=', 'cat.id')
            ->where('t.is_deleted', 0)
            ->where('t.users_id_recipient', 0) // Creados desde reporte público
            ->where('t.status', 1) // Solo tickets nuevos (sin asignar)
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('glpi_tickets_users')
                    ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                    ->where('glpi_tickets_users.type', 2); // Sin técnico asignado
            })
            ->orderBy('t.priority', 'desc')
            ->orderBy('t.date_creation', 'desc')
            ->limit(50)
            ->get();
    }

    /**
     * Obtener mis tickets (asignados a mí, no cerrados)
     */
    private function getMyTickets($user)
    {
        // Usar el campo glpi_user_id del usuario de Laravel
        $glpiUserId = $user->glpi_user_id;
        
        if (!$glpiUserId) {
            return collect([]); // Retornar colección vacía si no tiene glpi_user_id
        }

        return DB::table('glpi_tickets as t')
            ->select(
                't.id',
                't.name',
                't.content',
                't.date',
                't.date_creation',
                't.date_mod',
                't.priority',
                't.status',
                'cat.completename as category_name',
                DB::raw("CASE 
                    WHEN t.priority = 1 THEN 'Muy baja'
                    WHEN t.priority = 2 THEN 'Baja'
                    WHEN t.priority = 3 THEN 'Media'
                    WHEN t.priority = 4 THEN 'Alta'
                    WHEN t.priority = 5 THEN 'Muy alta'
                    WHEN t.priority = 6 THEN 'Urgente'
                    ELSE 'Media'
                END as priority_name"),
                DB::raw("CASE 
                    WHEN t.status = 1 THEN 'Nuevo'
                    WHEN t.status = 2 THEN 'En curso (asignado)'
                    WHEN t.status = 3 THEN 'En curso (planificado)'
                    WHEN t.status = 4 THEN 'En espera'
                    WHEN t.status = 5 THEN 'Resuelto'
                    WHEN t.status = 6 THEN 'Cerrado'
                    ELSE 'Nuevo'
                END as status_name")
            )
            ->join('glpi_tickets_users as tu', function($join) use ($glpiUserId) {
                $join->on('t.id', '=', 'tu.tickets_id')
                    ->where('tu.users_id', '=', $glpiUserId)
                    ->where('tu.type', '=', 2); // Técnico asignado
            })
            ->leftJoin('glpi_itilcategories as cat', 't.itilcategories_id', '=', 'cat.id')
            ->where('t.is_deleted', 0)
            ->whereNotIn('t.status', [5, 6]) // No resueltos ni cerrados
            ->orderBy('t.priority', 'desc')
            ->orderBy('t.date_mod', 'desc')
            ->limit(50)
            ->get();
    }

    /**
     * Tomar un ticket (asignarse a sí mismo)
     */
    public function takeTicket(Request $request, $id)
    {
        $user = auth()->user();
        
        // Verificar que el ticket existe y está sin asignar
        $ticket = DB::table('glpi_tickets')
            ->where('id', $id)
            ->where('is_deleted', 0)
            ->where('status', 1)
            ->first();

        if (!$ticket) {
            return redirect()->back()->with('error', 'Ticket no encontrado o ya está en proceso.');
        }

        // Verificar que no tenga técnico asignado
        $hasAssigned = DB::table('glpi_tickets_users')
            ->where('tickets_id', $id)
            ->where('type', 2) // Técnico asignado
            ->exists();

        if ($hasAssigned) {
            return redirect()->back()->with('error', 'Este ticket ya fue tomado por otro técnico.');
        }

        // Obtener el ID del usuario en GLPI usando el campo glpi_user_id
        $glpiUserId = $user->glpi_user_id;
        
        if (!$glpiUserId) {
            return redirect()->back()->with('error', 'Tu usuario no está vinculado con GLPI. Contacta al administrador.');
        }

        DB::beginTransaction();
        try {
            // Asignar el técnico
            DB::table('glpi_tickets_users')->insert([
                'tickets_id' => $id,
                'users_id' => $glpiUserId,
                'type' => 2, // Técnico asignado
                'use_notification' => 1,
            ]);

            // Cambiar estado a "En curso (asignado)"
            DB::table('glpi_tickets')
                ->where('id', $id)
                ->update([
                    'status' => 2, // En curso (asignado)
                    'date_mod' => now(),
                ]);

            DB::commit();

            return redirect()->back()->with('success', '¡Ticket tomado exitosamente! Ahora está asignado a ti.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al tomar el ticket: ' . $e->getMessage());
        }
    }

    /**
     * Resolver un ticket (marcar como solucionado)
     */
    public function solveTicket(Request $request, $id)
    {
        \Log::info('solveTicket START', ['id' => $id, 'all_input' => $request->all()]);
        
        $user = auth()->user();
        $solution = $request->input('solution');
        $solveDate = $request->input('solve_date'); // Fecha opcional
        
        \Log::info('solveTicket data', ['user' => $user->username ?? 'unknown', 'solution' => $solution, 'solveDate' => $solveDate]);
        
        if (!$solution || trim($solution) === '') {
            \Log::warning('solveTicket: Empty solution');
            return redirect()->back()->with('error', 'Debe ingresar una descripción de la solución.');
        }

        $ticket = DB::table('glpi_tickets')
            ->where('id', $id)
            ->where('is_deleted', 0)
            ->first();

        \Log::info('solveTicket: ticket lookup', ['found' => $ticket ? true : false]);

        if (!$ticket) {
            \Log::warning('solveTicket: Ticket not found');
            return redirect()->back()->with('error', 'Ticket no encontrado.');
        }

        // Usar el campo glpi_user_id del usuario de Laravel
        $glpiUserId = $user->glpi_user_id;
        
        if (!$glpiUserId) {
            return redirect()->back()->with('error', 'Tu usuario no está vinculado con GLPI. Contacta al administrador.');
        }
        
        \Log::info('solveTicket: glpi user', ['glpiUserId' => $glpiUserId]);

        // Verificar que el usuario esté asignado al ticket
        $isAssigned = DB::table('glpi_tickets_users')
            ->where('tickets_id', $id)
            ->where('users_id', $glpiUserId)
            ->where('type', 2)
            ->exists();

        \Log::info('solveTicket: permission check', ['isAssigned' => $isAssigned, 'userRole' => $user->role]);

        if (!$isAssigned && $user->role !== 'Administrador') {
            \Log::warning('solveTicket: No permission');
            return redirect()->back()->with('error', 'No tienes permiso para resolver este ticket.');
        }

        // Determinar la fecha de solución (usar la proporcionada o la actual)
        try {
            if ($solveDate && !empty($solveDate)) {
                $resolveDateTime = \Carbon\Carbon::parse($solveDate);
            } else {
                $resolveDateTime = now();
            }
        } catch (\Exception $e) {
            \Log::error('Error parsing solve_date: ' . $solveDate . ' - ' . $e->getMessage());
            $resolveDateTime = now();
        }
        
        // Validar que la fecha no sea anterior a la fecha de apertura del ticket (campo 'date')
        $ticketDate = \Carbon\Carbon::parse($ticket->date);
        \Log::info('solveTicket: date check', ['resolveDateTime' => $resolveDateTime->toDateTimeString(), 'ticketDate' => $ticketDate->toDateTimeString()]);
        
        if ($resolveDateTime->lt($ticketDate)) {
            \Log::warning('solveTicket: Date before opening');
            return redirect()->back()->with('error', 'La fecha de solución no puede ser anterior a la fecha de apertura del caso.');
        }

        DB::beginTransaction();
        try {
            \Log::info('Solving ticket', [
                'ticket_id' => $id,
                'user_id' => $glpiUserId,
                'solution' => substr($solution, 0, 100),
                'resolve_date' => $resolveDateTime->toDateTimeString()
            ]);
            
            // Insertar la solución en glpi_itilsolutions
            DB::table('glpi_itilsolutions')->insert([
                'itemtype' => 'Ticket',
                'items_id' => $id,
                'content' => $solution,
                'date_creation' => $resolveDateTime,
                'date_mod' => $resolveDateTime,
                'users_id' => $glpiUserId,
                'users_id_editor' => 0,
                'users_id_approval' => 0,
                'status' => 2, // Aprobado
            ]);

            // Cambiar estado a "Cerrado" (status = 6)
            DB::table('glpi_tickets')
                ->where('id', $id)
                ->update([
                    'status' => 6,
                    'date_mod' => $resolveDateTime,
                    'solvedate' => $resolveDateTime,
                    'closedate' => $resolveDateTime,
                ]);

            DB::commit();
            
            \Log::info('Ticket solved successfully', ['ticket_id' => $id]);

            return redirect()->back()->with('success', '¡Ticket resuelto exitosamente!');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error solving ticket', [
                'ticket_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->with('error', 'Error al resolver el ticket: ' . $e->getMessage());
        }
    }

    /**
     * Contar todos los tickets asignados al usuario (incluyendo resueltos)
     */
    private function getMyTicketsCount($user): int
    {
        $glpiUserId = $user->glpi_user_id;
        
        if (!$glpiUserId) {
            return 0;
        }
        
        return DB::table('glpi_tickets as t')
            ->join('glpi_tickets_users as tu', 't.id', '=', 'tu.tickets_id')
            ->where('tu.type', 2) // Técnico asignado
            ->where('tu.users_id', $glpiUserId)
            ->where('t.is_deleted', 0)
            ->where('t.status', '!=', 6) // Excluir cerrados
            ->count();
    }

    /**
     * Contar tickets resueltos del usuario
     * Incluye tickets resueltos por el usuario aunque no estuvieran asignados formalmente
     */
    private function getMyResolvedCount($user): int
    {
        $glpiUserId = $user->glpi_user_id;
        
        if (!$glpiUserId) {
            return 0;
        }
        
        // Contar tickets donde el usuario dio la solución (glpi_itilsolutions)
        // O donde el usuario estaba asignado y el ticket está resuelto/cerrado
        return DB::table('glpi_tickets as t')
            ->where('t.is_deleted', 0)
            ->whereIn('t.status', [5, 6]) // Resuelto o Cerrado
            ->where(function($query) use ($glpiUserId) {
                // Tickets donde el usuario dio la solución
                $query->whereExists(function($sub) use ($glpiUserId) {
                    $sub->select(DB::raw(1))
                        ->from('glpi_itilsolutions')
                        ->whereColumn('glpi_itilsolutions.items_id', 't.id')
                        ->where('glpi_itilsolutions.itemtype', 'Ticket')
                        ->where('glpi_itilsolutions.users_id', $glpiUserId);
                })
                // O tickets donde el usuario estaba asignado
                ->orWhereExists(function($sub) use ($glpiUserId) {
                    $sub->select(DB::raw(1))
                        ->from('glpi_tickets_users')
                        ->whereColumn('glpi_tickets_users.tickets_id', 't.id')
                        ->where('glpi_tickets_users.type', 2)
                        ->where('glpi_tickets_users.users_id', $glpiUserId);
                });
            })
            ->count();
    }
}
