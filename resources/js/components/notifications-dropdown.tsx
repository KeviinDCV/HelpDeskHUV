import { Bell, Check, CheckCheck, Trash2, UserPlus, MessageSquare, CheckCircle, XCircle, AlertTriangle, RefreshCw, Clock, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  icon: string
  color: string
  action_url: string | null
  read: boolean
  created_at: string
  created_at_full: string
}

const iconMap: Record<string, React.ElementType> = {
  UserPlus,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
  Bell,
}

const colorMap: Record<string, string> = {
  blue: 'text-blue-500 bg-blue-50',
  green: 'text-green-500 bg-green-50',
  red: 'text-red-500 bg-red-50',
  yellow: 'text-yellow-500 bg-yellow-50',
  purple: 'text-purple-500 bg-purple-50',
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Obtener CSRF token del meta tag
  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
  }

  // Helper para fetch con CSRF token
  const fetchWithCsrf = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken(),
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers,
      },
      credentials: 'same-origin',
    })
  }

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetchWithCsrf('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unread_count)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await fetchWithCsrf('/api/notifications/unread-count')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    // Polling cada 30 segundos para nuevas notificaciones
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetchWithCsrf(`/api/notifications/${id}/read`, { method: 'POST' })
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetchWithCsrf('/api/notifications/read-all', { method: 'POST' })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      fetchWithCsrf(`/api/notifications/${notification.id}/read`, { method: 'POST' })
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    if (notification.action_url) {
      router.visit(notification.action_url)
    }
    setIsOpen(false)
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetchWithCsrf(`/api/notifications/${id}`, { method: 'DELETE' })
      const notification = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white hover:bg-[#3d5583] relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold text-sm">Notificaciones</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todo leído
            </button>
          )}
        </div>
        
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Cargando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tienes notificaciones</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const IconComponent = iconMap[notification.icon] || Bell
              const colorClass = colorMap[notification.color] || colorMap.blue
              
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-3 py-2.5 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Marcar como leído"
                            >
                              <Check className="h-3 w-3 text-gray-500" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.created_at}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
