import * as React from 'react'
import { useEffect, useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { 
    Search, 
    Monitor, 
    Printer, 
    Ticket, 
    User, 
    FileText, 
    Phone,
    Network,
    HardDrive,
    Command,
    Loader2,
    ArrowRight
} from 'lucide-react'
import { Dialog, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog'
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { Input } from '@/components/ui/input'

interface SearchResult {
    id: number;
    type: 'ticket' | 'computer' | 'monitor' | 'printer' | 'user' | 'phone' | 'network' | 'peripheral';
    title: string;
    subtitle: string;
    url: string;
    icon: string;
}

interface GlobalSearchProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    ticket: { icon: Ticket, color: 'text-blue-500 bg-blue-50', label: 'Caso' },
    computer: { icon: Monitor, color: 'text-green-500 bg-green-50', label: 'Computador' },
    monitor: { icon: Monitor, color: 'text-purple-500 bg-purple-50', label: 'Monitor' },
    printer: { icon: Printer, color: 'text-orange-500 bg-orange-50', label: 'Impresora' },
    user: { icon: User, color: 'text-indigo-500 bg-indigo-50', label: 'Usuario' },
    phone: { icon: Phone, color: 'text-cyan-500 bg-cyan-50', label: 'Teléfono' },
    network: { icon: Network, color: 'text-red-500 bg-red-50', label: 'Dispositivo Red' },
    peripheral: { icon: HardDrive, color: 'text-yellow-500 bg-yellow-50', label: 'Dispositivo' },
}

const quickActions = [
    { name: 'Crear caso', href: '/soporte/crear-caso', icon: Ticket },
    { name: 'Ver casos', href: '/soporte/casos', icon: FileText },
    { name: 'Computadores', href: '/inventario/computadores', icon: Monitor },
    { name: 'Usuarios', href: '/administracion/usuarios', icon: User },
]

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Buscar cuando cambia el query
    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        const searchTimeout = setTimeout(async () => {
            setLoading(true)
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
                    credentials: 'same-origin',
                    headers: { 'Accept': 'application/json' }
                })
                const data = await response.json()
                setResults(data.results || [])
                setSelectedIndex(0)
            } catch (error) {
                console.error('Error searching:', error)
                setResults([])
            } finally {
                setLoading(false)
            }
        }, 300) // Debounce de 300ms

        return () => clearTimeout(searchTimeout)
    }, [query])

    // Focus input cuando se abre
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100)
        } else {
            setQuery('')
            setResults([])
            setSelectedIndex(0)
        }
    }, [open])

    // Navegación con teclado
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const items = query.trim() ? results : quickActions
        
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => Math.min(prev + 1, items.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (query.trim() && results[selectedIndex]) {
                navigateTo(results[selectedIndex].url)
            } else if (!query.trim() && quickActions[selectedIndex]) {
                navigateTo(quickActions[selectedIndex].href)
            }
        } else if (e.key === 'Escape') {
            onOpenChange(false)
        }
    }, [query, results, selectedIndex, onOpenChange])

    const navigateTo = (url: string) => {
        onOpenChange(false)
        router.visit(url)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay />
                <DialogPrimitive.Content
                    className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] rounded-lg border shadow-lg duration-200 sm:max-w-2xl p-0 gap-0 overflow-hidden"
                >
                    {/* Hidden title for accessibility */}
                    <DialogTitle className="sr-only">Búsqueda global</DialogTitle>
                
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b">
                    <Search className="h-5 w-5 text-gray-400 shrink-0" />
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Buscar casos, computadores, usuarios..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base placeholder:text-gray-400"
                    />
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                    <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-gray-100 px-1.5 text-[10px] font-medium text-gray-500">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto">
                    {query.trim() ? (
                        // Search Results
                        results.length > 0 ? (
                            <div className="py-2">
                                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Resultados ({results.length})
                                </div>
                                {results.map((result, index) => {
                                    const config = typeConfig[result.type] || typeConfig.ticket
                                    const Icon = config.icon
                                    return (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            onClick={() => navigateTo(result.url)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                                selectedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-lg ${config.color}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {result.title}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {config.label} • {result.subtitle}
                                                </div>
                                            </div>
                                            {selectedIndex === index && (
                                                <ArrowRight className="h-4 w-4 text-gray-400" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        ) : !loading ? (
                            <div className="py-12 text-center text-gray-500">
                                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No se encontraron resultados para "{query}"</p>
                            </div>
                        ) : null
                    ) : (
                        // Quick Actions (cuando no hay búsqueda)
                        <div className="py-2">
                            <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Acciones rápidas
                            </div>
                            {quickActions.map((action, index) => {
                                const Icon = action.icon
                                return (
                                    <button
                                        key={action.href}
                                        onClick={() => navigateTo(action.href)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                            selectedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="p-2 rounded-lg bg-gray-100">
                                            <Icon className="h-4 w-4 text-gray-600" />
                                        </div>
                                        <span className="font-medium text-gray-700">{action.name}</span>
                                        {selectedIndex === index && (
                                            <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded border text-[10px]">↑↓</kbd>
                            navegar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded border text-[10px]">↵</kbd>
                            seleccionar
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Command className="h-3 w-3" />
                        <span>+</span>
                        <kbd className="px-1.5 py-0.5 bg-white rounded border text-[10px]">K</kbd>
                        <span>para abrir</span>
                    </div>
                </div>
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    )
}

// Hook para usar el atajo CTRL+K globalmente
export function useGlobalSearch() {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setOpen(prev => !prev)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    return { open, setOpen }
}
