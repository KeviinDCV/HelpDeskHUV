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
    <div className="w-80 space-y-4">
      {/* Estadísticas rápidas */}
      <Card className="bg-white border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#2c5599]">
            Resumen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/soporte/casos?filter=unassigned" className="block">
            <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <TicketIcon className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-700">Sin asignar</span>
              </div>
              <span className="font-bold text-red-600">{stats.publicUnassigned}</span>
            </div>
          </Link>
          <Link href="/soporte/casos?filter=my_cases" className="block">
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">Mis casos</span>
              </div>
              <span className="font-bold text-blue-600">{stats.myTickets}</span>
            </div>
          </Link>
          <Link href="/soporte/casos?filter=resolved_today" className="block">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Resueltos hoy</span>
              </div>
              <span className="font-bold text-green-600">{stats.resolvedToday}</span>
            </div>
          </Link>
        </CardContent>
      </Card>

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
  )
}
