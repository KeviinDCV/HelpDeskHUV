import { Button } from "@/components/ui/button"

interface ViewTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ViewTabs({ activeTab, onTabChange }: ViewTabsProps) {
  const tabs = [
    "Reportes Públicos",
    "Mis Reportes",
  ]

  return (
    <div className="px-6 pt-6 pb-4">
      <div className="bg-white rounded-lg shadow-sm inline-flex w-auto">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant="ghost"
            onClick={() => onTabChange(tab)}
            className={`px-6 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab
                ? "bg-[#2c4370] text-white hover:bg-[#2c4370]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {tab}
          </Button>
        ))}
      </div>
    </div>
  )
}
