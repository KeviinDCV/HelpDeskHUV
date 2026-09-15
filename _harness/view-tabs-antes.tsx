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
    <div className="px-4 sm:px-6 pt-5 sm:pt-8 pb-3 sm:pb-5">
      <div className="bg-gray-200/50 p-1.5 rounded-2xl inline-flex w-full sm:w-auto overflow-hidden">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <button
              key={tab.name}
              onClick={() => onTabChange(tab.name)}
              // aria-pressed y no role="tab": estos botones filtran una lista en la MISMA página,
              // no conmutan tabpanels. Sin esto, cuál está activa se transmite solo por el fondo
              // blanco — invisible para un lector de pantalla.
              aria-pressed={isActive}
              className={`relative flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-2 text-sm font-medium transition-colors duration-300 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#2c4370] ${isActive
                  ? "text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
                }`}
            >
              {isActive && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm"
                  style={{ zIndex: -1 }}
                />
              )}
              <div className="flex items-center justify-center gap-2">
                <span>{tab.name}</span>
                {tab.count > 0 && (
                  <>
                    {/* El número suelto se oía como "Reportes Públicos 5": se le da unidad. */}
                    <span
                      aria-hidden="true"
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${isActive
                          ? "bg-[#2c4370] text-white"
                          : "bg-gray-400 text-white"
                        }`}
                    >
                      {tab.count}
                    </span>
                    <span className="sr-only">
                      ({tab.count} {tab.count === 1 ? 'reporte' : 'reportes'})
                    </span>
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
