"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MemberProfileAvatar } from "@/modules/group/ui/group-avatars";
import type { ApiGroupMember } from "@/adapters/payloser-api";

export function BowlingSoloScorePanel({
  handicaps,
  members,
  onRemoveHandicap,
  onScoreChange,
  onSoloRankStackChange,
  onUpdateHandicap,
  scores,
  soloRankRows,
}: {
  handicaps: Record<string, string>;
  members: ApiGroupMember[];
  onRemoveHandicap: (memberId: string) => void;
  onScoreChange: (memberId: string, value: string) => void;
  onSoloRankStackChange: (rank: number, value: string) => void;
  onUpdateHandicap: (memberId: string, value: string) => void;
  scores: Record<string, string>;
  soloRankRows: Array<{ rank: number; value: string }>;
}) {
  return (
    <div className="space-y-2 rounded-[24px] bg-[#F4F0E8] p-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black text-ink/45">개인전 점수</p>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-black text-ink/45">
          {members.length}명
        </span>
      </div>
      <div className="space-y-1.5">
        {members.map((member) => {
          const handicapValue = handicaps[member.id];
          const hasHandicap = handicapValue !== undefined;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between gap-2 rounded-[18px] bg-white p-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <MemberProfileAvatar member={member} size="sm" />
                <span className="truncate text-sm font-black">
                  {member.displayName}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <AnimatePresence initial={false}>
                  {hasHandicap ? (
                    <motion.label
                      key={`${member.id}-solo-handicap`}
                      initial={{ opacity: 0, width: 0, x: 8 }}
                      animate={{ opacity: 1, width: 100, x: 0 }}
                      exit={{ opacity: 0, width: 0, x: 8 }}
                      transition={{ duration: 0.16 }}
                      className="flex h-9 items-center gap-1.5 overflow-hidden rounded-[15px] bg-[#F4F0E8] px-2 ring-1 ring-[#FEE500]"
                    >
                      <span className="shrink-0 whitespace-nowrap text-[10px] font-black text-ink/35">
                        핸디
                      </span>
                      <input
                        value={handicapValue}
                        onChange={(event) =>
                          onUpdateHandicap(member.id, event.target.value)
                        }
                        min={0}
                        max={300}
                        inputMode="numeric"
                        type="number"
                        className="w-full border-0 bg-transparent text-right text-sm font-black outline-none"
                        aria-label={`${member.displayName} 핸디캡`}
                      />
                    </motion.label>
                  ) : null}
                </AnimatePresence>
                {hasHandicap ? (
                  <button
                    onClick={() => onRemoveHandicap(member.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-[15px] bg-[#F4F0E8] text-xs font-black text-ink/45 transition active:scale-[0.98]"
                    aria-label={`${member.displayName} 핸디캡 제거`}
                  >
                    ×
                  </button>
                ) : (
                  <button
                    onClick={() => onUpdateHandicap(member.id, "10")}
                    className="h-9 rounded-[15px] bg-[#F4F0E8] px-2.5 text-xs font-black text-ink/45 transition active:scale-[0.98]"
                  >
                    +핸디
                  </button>
                )}
                <label className="flex h-9 w-24 shrink-0 items-center rounded-[15px] bg-[#F4F0E8] px-2">
                  <input
                    value={scores[member.id] ?? "100"}
                    onChange={(event) =>
                      onScoreChange(member.id, event.target.value)
                    }
                    min={0}
                    max={300}
                    inputMode="numeric"
                    type="number"
                    className="w-full border-0 bg-transparent text-right text-sm font-black outline-none"
                  />
                  <span className="ml-1 text-[11px] font-black text-ink/35">
                    점
                  </span>
                </label>
              </div>
            </div>
          );
        })}
      </div>
      <div className="rounded-[20px] bg-white/70 p-2">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-black text-ink/45">등수별 스택</p>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-black text-ink/45">
            개인전
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {soloRankRows.map((rankRow) => (
            <label
              key={rankRow.rank}
              className="flex h-10 items-center justify-between rounded-[16px] bg-white px-2.5"
            >
              <span className="text-xs font-black text-ink/55">
                {rankRow.rank}등
              </span>
              <span className="flex items-center gap-1">
                <input
                  value={rankRow.value}
                  onChange={(event) =>
                    onSoloRankStackChange(rankRow.rank, event.target.value)
                  }
                  inputMode="decimal"
                  className="w-10 border-0 bg-transparent text-right text-sm font-black outline-none"
                />
                <span className="text-[10px] font-black text-ink/35">스택</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
