"use client";

import { UserRound, UsersRound } from "lucide-react";
import type {
  BowlingGameMode,
  BowlingResultInputMode,
} from "@/modules/bowling/model/bowling-draft";

export function BowlingGameModeControls({
  gameNumber,
  mode,
  onModeChange,
  onResultInputModeChange,
  resultInputMode,
}: {
  gameNumber: number;
  mode: BowlingGameMode;
  onModeChange: (mode: BowlingGameMode) => void;
  onResultInputModeChange: (mode: BowlingResultInputMode) => void;
  resultInputMode: BowlingResultInputMode;
}) {
  return (
    <>
      <div className="rounded-[24px] bg-[#F4F0E8] p-2.5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-black text-ink/45">
            {gameNumber}게임 방식
          </p>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-black text-ink/45">
            {mode === "solo" ? "개인전" : "팀전"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { icon: UsersRound, id: "team", label: "팀전", meta: "팀 배정" },
              {
                icon: UserRound,
                id: "solo",
                label: "개인전",
                meta: "등수 스택",
              },
            ] as const
          ).map((option) => {
            const Icon = option.icon;

            return (
              <button
                key={option.id}
                onClick={() => onModeChange(option.id)}
                className={`flex h-12 flex-col items-center justify-center rounded-[17px] text-center transition active:scale-[0.98] ${
                  mode === option.id
                    ? "bg-[#FEE500] text-ink shadow-sm"
                    : "bg-white text-ink/48"
                }`}
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-black">{option.label}</span>
                </span>
                <span className="mt-0.5 block text-[10px] font-black leading-none opacity-55">
                  {option.meta}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {mode === "team" ? (
        <div className="rounded-[24px] bg-[#F4F0E8] p-2">
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { id: "score", label: "점수 입력", meta: "편차 기록" },
                { id: "rank", label: "순위 직접", meta: "순위만 기록" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                onClick={() => onResultInputModeChange(option.id)}
                className={`flex h-11 flex-col items-center justify-center rounded-[16px] text-center transition active:scale-[0.98] ${
                  resultInputMode === option.id
                    ? "bg-ink text-white shadow-sm"
                    : "bg-white text-ink/48"
                }`}
              >
                <span className="text-xs font-black">{option.label}</span>
                <span className="mt-0.5 text-[10px] font-black opacity-55">
                  {option.meta}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
