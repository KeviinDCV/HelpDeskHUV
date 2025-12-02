<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Obtener notificaciones del usuario actual
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $notifications = Notification::forUser($user->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'icon' => $notification->icon,
                    'color' => $notification->color,
                    'action_url' => $notification->action_url,
                    'read' => $notification->isRead(),
                    'created_at' => $notification->created_at->diffForHumans(),
                    'created_at_full' => $notification->created_at->format('d/m/Y H:i'),
                ];
            });

        $unreadCount = Notification::forUser($user->id)->unread()->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Marcar notificación como leída
     */
    public function markAsRead(Request $request, $id)
    {
        $user = Auth::user();
        
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if ($notification) {
            $notification->markAsRead();
            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false], 404);
    }

    /**
     * Marcar todas las notificaciones como leídas
     */
    public function markAllAsRead(Request $request)
    {
        $user = Auth::user();
        
        Notification::forUser($user->id)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Obtener solo el conteo de notificaciones no leídas
     */
    public function unreadCount()
    {
        $user = Auth::user();
        $count = Notification::forUser($user->id)->unread()->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Eliminar una notificación
     */
    public function destroy($id)
    {
        $user = Auth::user();
        
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if ($notification) {
            $notification->delete();
            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false], 404);
    }

    /**
     * Eliminar todas las notificaciones leídas
     */
    public function clearRead()
    {
        $user = Auth::user();
        
        Notification::forUser($user->id)
            ->whereNotNull('read_at')
            ->delete();

        return response()->json(['success' => true]);
    }
}
