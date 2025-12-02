<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'icon',
        'color',
        'reference_id',
        'reference_type',
        'action_url',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    // Tipos de notificación
    const TYPE_TICKET_ASSIGNED = 'ticket_assigned';
    const TYPE_TICKET_COMMENT = 'ticket_comment';
    const TYPE_TICKET_RESOLVED = 'ticket_resolved';
    const TYPE_TICKET_CLOSED = 'ticket_closed';
    const TYPE_TICKET_URGENT = 'ticket_urgent';
    const TYPE_TICKET_STATUS_CHANGE = 'ticket_status_change';
    const TYPE_REMINDER = 'reminder';
    const TYPE_WELCOME = 'welcome';

    // Colores
    const COLOR_BLUE = 'blue';
    const COLOR_GREEN = 'green';
    const COLOR_RED = 'red';
    const COLOR_YELLOW = 'yellow';
    const COLOR_PURPLE = 'purple';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    public function markAsRead(): void
    {
        $this->update(['read_at' => now()]);
    }

    public function markAsUnread(): void
    {
        $this->update(['read_at' => null]);
    }

    // Scope para notificaciones no leídas
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    // Scope para notificaciones de un usuario
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Crear notificación de caso asignado
     */
    public static function createTicketAssigned(int $userId, int $ticketId, string $ticketName, string $assignerName): self
    {
        return self::create([
            'user_id' => $userId,
            'type' => self::TYPE_TICKET_ASSIGNED,
            'title' => 'Caso asignado',
            'message' => "{$assignerName} te ha asignado el caso: {$ticketName}",
            'icon' => 'UserPlus',
            'color' => self::COLOR_BLUE,
            'reference_id' => $ticketId,
            'reference_type' => 'ticket',
            'action_url' => "/soporte/casos/{$ticketId}",
        ]);
    }

    /**
     * Crear notificación de nuevo comentario
     */
    public static function createTicketComment(int $userId, int $ticketId, string $ticketName, string $commenterName): self
    {
        return self::create([
            'user_id' => $userId,
            'type' => self::TYPE_TICKET_COMMENT,
            'title' => 'Nuevo comentario',
            'message' => "{$commenterName} comentó en el caso: {$ticketName}",
            'icon' => 'MessageSquare',
            'color' => self::COLOR_PURPLE,
            'reference_id' => $ticketId,
            'reference_type' => 'ticket',
            'action_url' => "/soporte/casos/{$ticketId}",
        ]);
    }

    /**
     * Crear notificación de caso resuelto
     */
    public static function createTicketResolved(int $userId, int $ticketId, string $ticketName): self
    {
        return self::create([
            'user_id' => $userId,
            'type' => self::TYPE_TICKET_RESOLVED,
            'title' => 'Caso resuelto',
            'message' => "El caso '{$ticketName}' ha sido marcado como resuelto",
            'icon' => 'CheckCircle',
            'color' => self::COLOR_GREEN,
            'reference_id' => $ticketId,
            'reference_type' => 'ticket',
            'action_url' => "/soporte/casos/{$ticketId}",
        ]);
    }

    /**
     * Crear notificación de caso cerrado
     */
    public static function createTicketClosed(int $userId, int $ticketId, string $ticketName): self
    {
        return self::create([
            'user_id' => $userId,
            'type' => self::TYPE_TICKET_CLOSED,
            'title' => 'Caso cerrado',
            'message' => "El caso '{$ticketName}' ha sido cerrado",
            'icon' => 'XCircle',
            'color' => self::COLOR_YELLOW,
            'reference_id' => $ticketId,
            'reference_type' => 'ticket',
            'action_url' => "/soporte/casos/{$ticketId}",
        ]);
    }

    /**
     * Crear notificación de caso urgente
     */
    public static function createTicketUrgent(int $userId, int $ticketId, string $ticketName): self
    {
        return self::create([
            'user_id' => $userId,
            'type' => self::TYPE_TICKET_URGENT,
            'title' => 'Caso urgente',
            'message' => "Nuevo caso urgente: {$ticketName}",
            'icon' => 'AlertTriangle',
            'color' => self::COLOR_RED,
            'reference_id' => $ticketId,
            'reference_type' => 'ticket',
            'action_url' => "/soporte/casos/{$ticketId}",
        ]);
    }

    /**
     * Crear notificación de cambio de estado
     */
    public static function createTicketStatusChange(int $userId, int $ticketId, string $ticketName, string $newStatus): self
    {
        return self::create([
            'user_id' => $userId,
            'type' => self::TYPE_TICKET_STATUS_CHANGE,
            'title' => 'Estado actualizado',
            'message' => "El caso '{$ticketName}' cambió a: {$newStatus}",
            'icon' => 'RefreshCw',
            'color' => self::COLOR_BLUE,
            'reference_id' => $ticketId,
            'reference_type' => 'ticket',
            'action_url' => "/soporte/casos/{$ticketId}",
        ]);
    }

    /**
     * Crear notificación de recordatorio
     */
    public static function createReminder(int $userId, int $reminderId, string $reminderTitle): self
    {
        return self::create([
            'user_id' => $userId,
            'type' => self::TYPE_REMINDER,
            'title' => 'Recordatorio',
            'message' => $reminderTitle,
            'icon' => 'Clock',
            'color' => self::COLOR_YELLOW,
            'reference_id' => $reminderId,
            'reference_type' => 'reminder',
            'action_url' => "/utiles/recordatorios",
        ]);
    }

    /**
     * Crear notificación de bienvenida
     */
    public static function createWelcome(int $userId, string $userName): self
    {
        return self::create([
            'user_id' => $userId,
            'type' => self::TYPE_WELCOME,
            'title' => '¡Bienvenido!',
            'message' => "Hola {$userName}, bienvenido al sistema HelpDesk HUV",
            'icon' => 'Sparkles',
            'color' => self::COLOR_PURPLE,
            'reference_id' => null,
            'reference_type' => null,
            'action_url' => '/dashboard',
        ]);
    }
}
