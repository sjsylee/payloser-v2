"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, CupSoda } from "lucide-react";
import type { ComponentType } from "react";
import type {
  BowlingSideCostId,
  BowlingSpecialRuleId,
} from "@/modules/bowling/model/bowling-draft";
import { ShoeIcon } from "@/shared/ui/sport-icons";

type AppIcon = ComponentType<{ className?: string }>;

const sideCostOptions: Array<{
  icon: AppIcon;
  id: BowlingSideCostId;
  label: string;
  meta: string;
}> = [
  { icon: ShoeIcon, id: "shoes", label: "신발", meta: "2,000" },
  { icon: CupSoda, id: "drink", label: "음료", meta: "1,500" },
];

const specialRuleOptions: Array<{
  icon: AppIcon;
  id: BowlingSpecialRuleId;
  label: string;
  meta: string;
}> = [{ icon: CircleAlert, id: "under100", label: "100점 미만", meta: "독박" }];

export function BowlingGameOptionsPopover({
  onOpenChange,
  onToggleSideCost,
  onToggleSpecialRule,
  open,
  sideCosts,
  specialRules,
}: {
  onOpenChange: (open: boolean) => void;
  onToggleSideCost: (sideCost: BowlingSideCostId) => void;
  onToggleSpecialRule: (specialRule: BowlingSpecialRuleId) => void;
  open: boolean;
  sideCosts: Record<BowlingSideCostId, boolean>;
  specialRules: Record<BowlingSpecialRuleId, boolean>;
}) {
  const activeSideCostCount = Object.values(sideCosts).filter(Boolean).length;
  const activeSpecialRuleCount =
    Object.values(specialRules).filter(Boolean).length;
  const activeOptionCount = activeSideCostCount + activeSpecialRuleCount;
  const optionSummary =
    [
      ...sideCostOptions
        .filter((option) => sideCosts[option.id])
        .map((option) => option.label),
      ...specialRuleOptions
        .filter((option) => specialRules[option.id])
        .map((option) => option.label),
    ].join(" · ") || "기본";

  return (
    <div className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        className="flex min-h-12 w-full items-center justify-between rounded-[22px] bg-[#F4F0E8] px-4 text-left transition active:scale-[0.99]"
      >
        <span className="min-w-0">
          <span className="block text-xs font-black text-ink/45">판 옵션</span>
          <span className="block truncate text-sm font-black">
            {optionSummary}
          </span>
        </span>
        <span className="ml-3 rounded-full bg-white px-3 py-1 text-xs font-black text-ink/55">
          {activeOptionCount}개
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="bowling-options-popover"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-[24px] bg-white p-2.5 shadow-2xl"
          >
            <div className="grid grid-cols-2 gap-1.5">
              {sideCostOptions.map((option) => {
                const selected = sideCosts[option.id];
                const Icon = option.icon;

                return (
                  <button
                    key={option.id}
                    onClick={() => onToggleSideCost(option.id)}
                    className={`flex h-11 flex-col items-center justify-center rounded-[16px] px-2 text-center transition active:scale-[0.98] ${
                      selected
                        ? "bg-[#FEE500] text-ink shadow-sm"
                        : "bg-[#F4F0E8] text-ink/48"
                    }`}
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-black">{option.label}</span>
                    </span>
                    <span className="mt-0.5 block text-[10px] font-black leading-none opacity-55">
                      {option.meta}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1.5">
              {specialRuleOptions.map((option) => {
                const selected = specialRules[option.id];
                const Icon = option.icon;

                return (
                  <button
                    key={option.id}
                    onClick={() => onToggleSpecialRule(option.id)}
                    className={`flex h-11 items-center justify-center gap-2 rounded-[16px] px-3 text-center transition active:scale-[0.98] ${
                      selected
                        ? "bg-ink text-white shadow-sm"
                        : "bg-[#F4F0E8] text-ink/48"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-black">{option.label}</span>
                    <span className="text-[10px] font-black opacity-55">
                      {option.meta}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
