"use client";

import { motion } from "framer-motion";
import { ChevronRight, ReceiptText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import type { BowlingStep } from "@/modules/bowling/model/bowling-flow";

type AppIcon = LucideIcon | ((props: { className?: string }) => ReactElement);

export function SheetTitle({
  icon: Icon,
  label,
  title,
}: {
  icon: AppIcon;
  label: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FEE500]">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-black text-ink/45">{label}</p>
        <h2 className="text-lg font-black">{title}</h2>
      </div>
    </div>
  );
}

export function BowlingStepRail({
  canEnterReview = true,
  onStepChange,
  step,
}: {
  canEnterReview?: boolean;
  onStepChange: (step: BowlingStep) => void;
  step: BowlingStep;
}) {
  const steps: Array<{ id: BowlingStep; label: string; short: string }> = [
    { id: "setup", label: "준비", short: "1" },
    { id: "games", label: "판 입력", short: "2" },
    { id: "review", label: "결과", short: "3" },
  ];

  return (
    <div className="grid grid-cols-3 rounded-[22px] bg-[#F4F0E8] p-1">
      {steps.map((item) => {
        const disabled = item.id === "review" && !canEnterReview;

        return (
          <button
            key={item.id}
            onClick={() => {
              if (!disabled) {
                onStepChange(item.id);
              }
            }}
            disabled={disabled}
            className={`relative flex h-11 items-center justify-center gap-1.5 rounded-[18px] text-xs font-black transition active:scale-[0.98] disabled:opacity-35 ${
              step === item.id ? "text-ink" : "text-ink/42"
            }`}
          >
            {step === item.id ? (
              <motion.span
                layoutId="bowling-step"
                className="absolute inset-0 rounded-[18px] bg-white shadow-sm"
              />
            ) : null}
            <span
              className={`relative flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${step === item.id ? "bg-[#FEE500]" : "bg-white/80"}`}
            >
              {item.short}
            </span>
            <span className="relative">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function BowlingStageAction({
  disabled,
  label,
  onClick,
  step,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
  step: BowlingStep;
}) {
  return (
    <motion.button
      layout
      onClick={onClick}
      disabled={disabled}
      className="group relative flex min-h-14 w-full items-center justify-between rounded-[24px] bg-ink px-5 text-left text-white shadow-lg outline-none disabled:opacity-45"
      whileTap={{ scale: 0.99 }}
    >
      <span className="relative flex items-center gap-3">
        <motion.span
          className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#FEE500] text-ink"
          animate={{
            rotate: step === "games" ? [0, -4, 4, 0] : [0, 0],
            scale: [1, 1.04, 1],
          }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <ReceiptText className="h-4 w-4" />
        </motion.span>
        <span className="text-sm font-black">{label}</span>
      </span>
      <ChevronRight className="relative h-5 w-5 transition group-active:translate-x-0.5" />
    </motion.button>
  );
}
