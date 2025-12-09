import { Button } from "@/components/ui/button"

interface ViewTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  publicCount?: number;
  myCount?: number;
}

export function ViewTabs({ activeTab, onTabChange, publicCount = 0, myCount = 0 }: ViewTabsProps) {
  const tabs = [
    { name: "Reportes Públicos", count: publicCount },
    { name: "Mis Reportes", count: myCount },
  ]

  return (
    <div className="px-3 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
      <div className="bg-white shadow-sm border border-gray-200 inline-flex w-full sm:w-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.name}
            variant="ghost"
            onClick={() => onTabChange(tab.name)}
            className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === tab.name
                ? "bg-[#2c4370] text-white hover:bg-[#2c4370]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {tab.name}
            {tab.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === tab.name
                  ? "bg-white/20 text-white"
                  : "bg-red-500 text-white"
              }`}>
                {tab.count}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}
