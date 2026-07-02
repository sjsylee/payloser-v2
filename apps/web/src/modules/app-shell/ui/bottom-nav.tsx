import { Calculator, History, Home, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { memo } from "react";

export type TabId = "home" | "settle" | "records" | "ranking";

const tabs: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: "home", label: "홈", icon: Home },
  { id: "settle", label: "정산", icon: Calculator },
  { id: "records", label: "기록", icon: History },
  { id: "ranking", label: "랭킹", icon: Trophy },
];

export const BottomNav = memo(function BottomNav({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-ink/[0.06] bg-[#FFFDF7] px-5 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 text-[#615B52]">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex h-14 flex-col items-center justify-center gap-1 rounded-[24px] text-[11px] font-black transition-colors duration-150 ${
                selected
                  ? "bg-[#FEE500] text-ink"
                  : "text-[#615B52] hover:text-ink"
              }`}
              aria-current={selected ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});
