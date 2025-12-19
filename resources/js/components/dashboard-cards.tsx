import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pin, TicketIcon, UserCheck, CheckCircle2, Clock, Plus, Zap } from 'lucide-react'
import { Link } from '@inertiajs/react'

interface Stats {
  publicUnassigned: number;
  myTickets: number;
  myPending: number;
  myResolved: number;
}

interface DashboardCardsProps {
  stats: Stats;
}

export function DashboardCards({ stats }: DashboardCardsProps) {
  return (
    <div className="w-full lg:w-80 space-y-4">
      {/* Estadísticas rápidas - Horizontal scroll on mobile */}
      <Card className="bg-white border shadow-sm">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-sm font-semibold text-[#2c5599]">
            Resumen
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {/* Grid on mobile, stack on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:space-y-3 lg:gap-0">
            <Link href="/soporte/casos?filter=my_cases" className="block">
              <div className="flex flex-col lg:flex-row items-center lg:justify-between p-2 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2">
                  <UserCheck className="w-5 h-5 lg:w-4 lg:h-4 text-blue-500" />
                  <span className="text-xs lg:text-sm text-gray-700">Mis casos</span>
                </div>
                <span className="font-bold text-blue-600 text-lg lg:text-base">{stats.myTickets}</span>
              </div>
            </Link>
            <Link href="/soporte/casos?filter=unassigned" className="block">
              <div className="flex flex-col lg:flex-row items-center lg:justify-between p-2 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2">
                  <TicketIcon className="w-5 h-5 lg:w-4 lg:h-4 text-red-500" />
                  <span className="text-xs lg:text-sm text-gray-700">Sin asignar</span>
                </div>
                <span className="font-bold text-red-600 text-lg lg:text-base">{stats.publicUnassigned}</span>
              </div>
            </Link>
            <Link href="/soporte/casos?filter=my_resolved" className="block">
              <div className="flex flex-col lg:flex-row items-center lg:justify-between p-2 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2">
                  <CheckCircle2 className="w-5 h-5 lg:w-4 lg:h-4 text-green-500" />
                  <span className="text-xs lg:text-sm text-gray-700">Resueltos</span>
                </div>
                <span className="font-bold text-green-600 text-lg lg:text-base">{stats.myResolved}</span>
              </div>
            </Link>
            <Link href="/soporte/casos?filter=my_pending" className="block">
              <div className="flex flex-col lg:flex-row items-center lg:justify-between p-2 bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2">
                  <Clock className="w-5 h-5 lg:w-4 lg:h-4 text-orange-500" />
                  <span className="text-xs lg:text-sm text-gray-700">Sin resolver</span>
                </div>
                <span className="font-bold text-orange-600 text-lg lg:text-base">{stats.myPending}</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Hidden on mobile - shown on desktop */}
      <div className="hidden lg:block space-y-4">
        {/* Shortcuts Card */}
        <Card className="bg-white border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#2c5599]" />
              <CardTitle className="text-sm font-semibold text-[#2c5599]">
                Shortcuts
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/soporte/crear-caso" className="block">
              <div className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg cursor-pointer group">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Crear nuevo caso</p>
                  <p className="text-xs text-gray-500">Reportar un problema o solicitud</p>
                </div>
              </div>
            </Link>
            {/* Futuros shortcuts se agregarán aquí */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
