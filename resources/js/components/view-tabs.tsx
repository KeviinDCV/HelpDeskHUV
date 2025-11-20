import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ViewTabs() {
  const [activeTab, setActiveTab] = useState("Vista personal")

  const tabs = [
    "Vista personal",
    "Vista de Grupo",
    "Vista Global",
    "Canales RSS",
    "Todo",
  ]

  return (
    <div className="flex items-center gap-1 border-b bg-white px-4">
      {tabs.map((tab) => (
        <Button
          key={tab}
          variant="ghost"
          onClick={() => setActiveTab(tab)}
          className={`rounded-none border-b-2 px-4 py-2 text-sm font-normal ${
            activeTab === tab
              ? "border-[#2c4370] text-[#2c4370] bg-gray-50"
              : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          {tab}
        </Button>
      ))}
    </div>
  )
}
