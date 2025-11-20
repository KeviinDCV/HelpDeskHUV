import { Bell, LogOut, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { router } from '@inertiajs/react'
import { ReactNode } from 'react'
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

const inventarioItems = [
  { name: 'Computadores', href: '/inventario/computadores' },
  { name: 'Monitores', href: '/inventario/monitores' },
  { name: 'Programas', href: '/inventario/programas' },
  { name: 'Dispositivos para redes', href: '/inventario/dispositivos-redes' },
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
  { name: 'Problemas', href: '/soporte/problemas' },
  { name: 'Cambios', href: '/soporte/cambios' },
  { name: 'Planificación', href: '/soporte/planificacion' },
  { name: 'Estadísticas', href: '/soporte/estadisticas' },
  { name: 'Casos recurrentes', href: '/soporte/casos-recurrentes' },
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

export function GLPIHeader({ breadcrumb }: GLPIHeaderProps) {
  const handleLogout = () => {
    router.post('/logout')
  }

  return (
    <header className="bg-[#2c4370] text-white">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#3d5583]">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">HelpDesk HUV</div>
          </div>
          
          {/* Main Navigation */}
          <NavigationMenu viewport={false}>
            <NavigationMenuList className="gap-1">
              {/* Inventario Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-[#3d5583] hover:text-white data-[state=open]:bg-[#3d5583] h-9 px-3 rounded focus-visible:ring-0 text-sm">
                  Inventario
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!p-0">
                  <div className="grid grid-cols-2 w-[420px] gap-0.5 p-1.5 bg-white rounded-md shadow-lg border border-gray-200">
                    {inventarioItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => router.visit(item.href)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Soporte Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-[#3d5583] hover:text-white data-[state=open]:bg-[#3d5583] h-9 px-3 rounded focus-visible:ring-0 text-sm">
                  Soporte
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!p-0">
                  <div className="grid grid-cols-2 w-[360px] gap-0.5 p-1.5 bg-white rounded-md shadow-lg border border-gray-200">
                    {soporteItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => router.visit(item.href)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Gestión Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-[#3d5583] hover:text-white data-[state=open]:bg-[#3d5583] h-9 px-3 rounded focus-visible:ring-0 text-sm">
                  Gestión
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!p-0">
                  <div className="grid grid-cols-2 w-[360px] gap-0.5 p-1.5 bg-white rounded-md shadow-lg border border-gray-200">
                    {gestionItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => router.visit(item.href)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Útiles Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-[#3d5583] hover:text-white data-[state=open]:bg-[#3d5583] h-9 px-3 rounded focus-visible:ring-0 text-sm">
                  Útiles
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!p-0">
                  <div className="grid grid-cols-2 w-[360px] gap-0.5 p-1.5 bg-white rounded-md shadow-lg border border-gray-200">
                    {utilesItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => router.visit(item.href)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Administración Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-[#3d5583] hover:text-white data-[state=open]:bg-[#3d5583] h-9 px-3 rounded focus-visible:ring-0 text-sm">
                  Administración
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!p-0">
                  <div className="grid grid-cols-2 w-[280px] gap-0.5 p-1.5 bg-white rounded-md shadow-lg border border-gray-200">
                    {administracionItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => router.visit(item.href)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Configuración Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-[#3d5583] hover:text-white data-[state=open]:bg-[#3d5583] h-9 px-3 rounded focus-visible:ring-0 text-sm">
                  Configuración
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!p-0">
                  <div className="grid w-[240px] gap-0.5 p-1.5 bg-white rounded-md shadow-lg border border-gray-200">
                    {configuracionItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => router.visit(item.href)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
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
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar"
              className="bg-[#1f3152] border-[#3d5583] text-white placeholder:text-gray-400 w-64 pr-10"
            />
            <Button
              size="sm"
              className="absolute right-0 top-0 h-full bg-gray-600 hover:bg-gray-700 text-white px-3"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Icons */}
          <Button variant="ghost" size="icon" className="text-white hover:bg-[#3d5583]">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-[#3d5583] text-sm">
                Chavarro Erazo Kevin ...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configuración</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-[#3d5583]"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white text-foreground border-b">
        <div className="flex items-center gap-2">
          {breadcrumb || <span className="text-sm font-medium">Inicio</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm">HUV (estructura en árbol)</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-sm">
                Technician
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Technician</DropdownMenuItem>
              <DropdownMenuItem>Administrator</DropdownMenuItem>
              <DropdownMenuItem>User</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
