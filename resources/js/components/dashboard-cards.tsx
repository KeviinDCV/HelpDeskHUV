import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pin } from 'lucide-react'

export function DashboardCards() {
  return (
    <div className="flex gap-4 p-4">
      {/* Main Content Area */}
      <div className="flex-1">
        {/* Empty space for the main area */}
      </div>

      {/* Right Sidebar */}
      <div className="w-80 space-y-4">
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
