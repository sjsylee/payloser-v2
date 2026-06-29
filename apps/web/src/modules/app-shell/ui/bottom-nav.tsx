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
    <nav className="fixed bottom-[calc(14px+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100vw-32px)] max-w-[388px] -translate-x-1/2 rounded-[28px] bg-[#FFFDF7] p-1.5 text-[#615B52] shadow-[0_18px_44px_rgba(24,23,22,0.22)]">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex h-14 flex-col items-center justify-center gap-1 rounded-[22px] text-[11px] font-black transition-colors duration-150 ${
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
