import { LogOut, Search, Menu, X, ChevronDown, Command, Moon, Sun } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { router, usePage } from '@inertiajs/react'
import { ReactNode, useState, useEffect } from 'react'
import { GlobalSearch } from '@/components/global-search'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { NotificationsDropdown } from "@/components/notifications-dropdown"

const inventarioItems = [
  { name: 'Computadores', href: '/inventario/computadores' },
  { name: 'Monitores', href: '/inventario/monitores' },
  { name: 'Programas', href: '/inventario/programas' },
  { name: 'Dispositivos para redes', href: '/inventario/dispositivos-red' },
  { name: 'Dispositivos', href: '/inventario/dispositivos' },
  { name: 'Impresoras', href: '/inventario/impresoras' },
  { name: 'Cartuchos', href: '/inventario/cartuchos' },
  { name: 'Consumibles', href: '/inventario/consumibles' },
  { name: 'Teléfonos', href: '/inventario/telefonos' },
  { name: 'Gabinetes', href: '/inventario/gabinetes' },
  { name: 'Multitomas', href: '/inventario/multitomas' },
  { name: 'Global', href: '/inventario/global' },
]

const soporteItems = [
  { name: 'Crear caso', href: '/soporte/crear-caso' },
  { name: 'Casos', href: '/soporte/casos' },
  { name: 'Estadísticas', href: '/soporte/estadisticas' },
]

const gestionItems = [
  { name: 'Licencias', href: '/gestion/licencias' },
  { name: 'Documentos', href: '/gestion/documentos' },
  { name: 'Líneas', href: '/gestion/lineas' },
  { name: 'Certificados', href: '/gestion/certificados' },
  { name: 'Centros de datos', href: '/gestion/centros-datos' },
]

const utilesItems = [
  { name: 'Proyectos', href: '/utiles/proyectos' },
  { name: 'Recordatorios', href: '/utiles/recordatorios' },
  { name: 'Canales RSS', href: '/utiles/canales-rss' },
  { name: 'Base de conocimiento', href: '/utiles/base-conocimiento' },
  { name: 'Reservas', href: '/utiles/reservas' },
  { name: 'Reportes', href: '/utiles/reportes' },
]

const administracionItems = [
  { name: 'Usuarios', href: '/administracion/usuarios' },
  { name: 'Grupos', href: '/administracion/grupos' },
  { name: 'Entidades', href: '/administracion/entidades' },
  { name: 'Reglas', href: '/administracion/reglas' },
]

const configuracionItems = [
  { name: 'Desplegables', href: '/configuracion/desplegables' },
  { name: 'Niveles de servicio', href: '/configuracion/niveles-servicio' },
]

interface GLPIHeaderProps {
  breadcrumb?: ReactNode;
}

interface AuthUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  avatar: string | null;
}

// Menú móvil items agrupados
const mobileMenuSections = [
  { title: 'Inventario', items: inventarioItems },
  { title: 'Soporte', items: soporteItems },
  { title: 'Gestión', items: gestionItems },
  { title: 'Útiles', items: utilesItems },
  { title: 'Administración', items: administracionItems },
  { title: 'Configuración', items: configuracionItems },
];

export function GLPIHeader({ breadcrumb }: GLPIHeaderProps) {
  const { auth } = usePage<{ auth: { user: AuthUser } }>().props;
  const user = auth?.user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Cargar preferencia de tema al iniciar
  useEffect(() => {
    const savedTheme = localStorage.getItem('helpdesk_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle modo oscuro
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('helpdesk_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('helpdesk_theme', 'light');
    }
  };
  
  // Atajo CTRL+K para abrir buscador
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const handleLogout = () => {
    window.location.href = '/salir';
  }

  const toggleSection = (title: string) => {
    setExpandedSection(expandedSection === title ? null : title);
  };

  const navigateTo = (href: string) => {
    setMobileMenuOpen(false);
    router.visit(href);
  };

  return (
    <header className="bg-[#2c4370] text-white sticky top-0 z-50">
      {/* Top Navigation Bar */}
      <div className={`flex items-center justify-between px-3 sm:px-4 py-2 ${mobileMenuOpen ? 'lg:border-b lg:border-[#3d5583]' : 'border-b border-[#3d5583]'}`}>
        <div className="flex items-center gap-2 sm:gap-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-[#3d5583] transition-colors"
            aria-label="Menú"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo - Clicable para ir al Dashboard */}
          <button 
            onClick={() => router.visit('/dashboard')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="text-lg sm:text-2xl font-bold whitespace-nowrap">HelpDesk HUV</span>
          </button>
          
          {/* Main Navigation - Hidden on mobile */}
          <NavigationMenu viewport={false} className="hidden lg:flex">
            <NavigationMenuList className="gap-1">
              {/* Inventario Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-[#3d5583] hover:text-white data-[state=open]:bg-[#3d5583] h-9 px-3 focus-visible:ring-0 text-sm">
                  Inventario
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!p-0">
                  <div className="grid grid-cols-2 w-[420px] gap-0.5 p-1.5 bg-white shadow-lg border border-gray-200">
                    {inventarioItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => router.visit(item.href)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Soporte Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-[#3d5583] hover:text-white data-[state=open]:bg-[#3d5583] h-9 px-3 focus-visible:ring-0 text-sm">
                  Soporte
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!p-0">
                  <div className="grid grid-cols-2 w-[360px] gap-0.5 p-1.5 bg-white shadow-lg border border-gray-200">
                    {soporteItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => router.visit(item.href)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Gestión Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-[#3d5583] hover:text-white data-[state=open]:bg-[#3d5583] h-9 px-3 focus-visible:ring-0 text-sm">
                  Gestión
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!p-0">
                  <div className="grid grid-cols-2 w-[360px] gap-0.5 p-1.5 bg-white shadow-lg border border-gray-200">
                    {gestionItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => router.visit(item.href)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Útiles Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-[#3d5583] hover:text-white data-[state=open]:bg-[#3d5583] h-9 px-3 focus-visible:ring-0 text-sm">
                  Útiles
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!p-0">
                  <div className="grid grid-cols-2 w-[360px] gap-0.5 p-1.5 bg-white shadow-lg border border-gray-200">
                    {utilesItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => router.visit(item.href)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Administración Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-[#3d5583] hover:text-white data-[state=open]:bg-[#3d5583] h-9 px-3 focus-visible:ring-0 text-sm">
                  Administración
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!p-0">
                  <div className="grid grid-cols-2 w-[280px] gap-0.5 p-1.5 bg-white shadow-lg border border-gray-200">
                    {administracionItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => router.visit(item.href)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Configuración Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-[#3d5583] hover:text-white data-[state=open]:bg-[#3d5583] h-9 px-3 focus-visible:ring-0 text-sm">
                  Configuración
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!p-0">
                  <div className="grid w-[240px] gap-0.5 p-1.5 bg-white shadow-lg border border-gray-200">
                    {configuracionItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => router.visit(item.href)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-[#3d5583] transition-colors rounded"
            title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* Search Button - Opens Global Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 h-9 px-3 bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
          >
            <Search className="h-4 w-4" />
            <span className="text-sm hidden md:inline">Buscar...</span>
            <kbd className="hidden md:inline-flex h-5 items-center gap-0.5 border border-white/20 bg-white/10 px-1.5 text-[10px] font-medium">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>
          {/* Mobile Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden p-2 hover:bg-[#3d5583] transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Notificaciones */}
          <NotificationsDropdown />
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-[#3d5583] text-sm flex items-center gap-2 px-2 sm:px-3">
                {user?.avatar ? (
                  <img 
                    src={`/storage/${user.avatar}`} 
                    alt={user.name} 
                    className="w-7 h-7 object-cover border border-white/30"
                  />
                ) : (
                  <div className="w-7 h-7 bg-white/20 flex items-center justify-center text-xs font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="hidden md:inline">
                  {user?.name ? (user.name.length > 15 ? user.name.substring(0, 15) + '...' : user.name) : 'Usuario'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="text-xs text-gray-500 cursor-default">{user?.role || 'Usuario'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.visit('/settings/profile')}>Perfil</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logout Button - Hidden on mobile (available in dropdown) */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-[#3d5583] hidden sm:flex"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 top-14 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div className={`lg:hidden fixed top-14 left-0 bottom-0 w-72 bg-[#2c4370] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Mobile Search Button */}
        <div className="p-3 border-b border-[#3d5583] shrink-0">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setSearchOpen(true);
            }}
            className="w-full flex items-center gap-3 h-9 px-3 bg-white/10 hover:bg-white/20 transition-colors text-white/70"
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Buscar...</span>
          </button>
        </div>

        {/* Mobile Navigation Sections - Scrollable */}
        <nav className="py-2 flex-1 overflow-y-auto">
          {mobileMenuSections.map((section) => (
            <div key={section.title} className="border-b border-[#3d5583]/50 last:border-b-0">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-[#3d5583] transition-colors"
              >
                <span className="font-medium">{section.title}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${expandedSection === section.title ? 'rotate-180' : ''}`} />
              </button>
              {expandedSection === section.title && (
                <div className="bg-[#1e3255] py-1">
                  {section.items.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => navigateTo(item.href)}
                      className="w-full text-left px-6 py-2 text-sm text-white/80 hover:text-white hover:bg-[#3d5583] transition-colors"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Dark Mode Toggle in Mobile Menu */}
          <div className="border-t border-[#3d5583]/50 mt-2 pt-2">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-[#3d5583] transition-colors"
            >
              <div className="flex items-center gap-3">
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="font-medium">{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'}`}>
                {darkMode ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </nav>

        {/* Mobile User Info - Compacto y siempre visible */}
        <div className="px-3 py-3 border-t border-[#3d5583] bg-[#1e3255] shrink-0">
          <div className="flex items-center gap-2">
            {user?.avatar ? (
              <img src={`/storage/${user.avatar}`} alt={user.name} className="w-8 h-8 object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 bg-white/20 flex items-center justify-center text-sm font-medium text-white shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">{user?.name || 'Usuario'}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="shrink-0 border-white/30 text-white hover:bg-white/10 h-8 text-xs"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar - Hidden on mobile when menu is open */}
      <div className={`bg-white text-foreground border-b ${mobileMenuOpen ? 'lg:block hidden' : ''}`}>
        <div className="flex items-center justify-between px-3 sm:px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm whitespace-nowrap">
              {breadcrumb || <span className="font-medium">Inicio</span>}
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm cursor-default ml-2 shrink-0 hidden sm:flex">
            {user?.role || 'Usuario'}
          </Button>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
