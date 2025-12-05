import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pin, TicketIcon, UserCheck, CheckCircle2 } from 'lucide-react'
import { Link } from '@inertiajs/react'

interface Stats {
  publicUnassigned: number;
  myTickets: number;
  resolvedToday: number;
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
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 lg:space-y-3 lg:gap-0">
            <Link href="/soporte/casos?filter=unassigned" className="block">
              <div className="flex flex-col lg:flex-row items-center lg:justify-between p-2 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2">
                  <TicketIcon className="w-5 h-5 lg:w-4 lg:h-4 text-red-500" />
                  <span className="text-xs lg:text-sm text-gray-700">Sin asignar</span>
                </div>
                <span className="font-bold text-red-600 text-lg lg:text-base">{stats.publicUnassigned}</span>
              </div>
            </Link>
            <Link href="/soporte/casos?filter=my_cases" className="block">
              <div className="flex flex-col lg:flex-row items-center lg:justify-between p-2 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2">
                  <UserCheck className="w-5 h-5 lg:w-4 lg:h-4 text-blue-500" />
                  <span className="text-xs lg:text-sm text-gray-700">Mis casos</span>
                </div>
                <span className="font-bold text-blue-600 text-lg lg:text-base">{stats.myTickets}</span>
              </div>
            </Link>
            <Link href="/soporte/casos?filter=resolved_today" className="block">
              <div className="flex flex-col lg:flex-row items-center lg:justify-between p-2 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2">
                  <CheckCircle2 className="w-5 h-5 lg:w-4 lg:h-4 text-green-500" />
                  <span className="text-xs lg:text-sm text-gray-700">Resueltos</span>
                </div>
                <span className="font-bold text-green-600 text-lg lg:text-base">{stats.resolvedToday}</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Hidden on mobile - shown on desktop */}
      <div className="hidden lg:block space-y-4">
        {/* Su planeación Card */}
        <Card className="bg-gray-100 border-gray-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-center text-[#2c5599]">
              Su planeación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-center text-muted-foreground">
              No hay eventos para mostrar
            </p>
          </CardContent>
        </Card>

        {/* Recordatorios personales Card */}
        <Card className="bg-gray-100 border-gray-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#2c5599] flex-1 text-center">
                Recordatorios personales
              </CardTitle>
              <Pin className="h-4 w-4 text-gray-500" />
            </div>
          </CardHeader>
        </Card>

        {/* Recordatorios públicos Card */}
        <Card className="bg-gray-100 border-gray-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#2c5599] flex-1 text-center">
                Recordatorios públicos
              </CardTitle>
              <Pin className="h-4 w-4 text-gray-500" />
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
