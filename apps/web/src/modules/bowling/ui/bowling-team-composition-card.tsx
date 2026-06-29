"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Shuffle } from "lucide-react";
import { useState } from "react";
import { MemberProfileAvatar } from "@/modules/group/ui/group-avatars";
import type { ApiGroupMember } from "@/adapters/payloser-api";
import type { BowlingTeamId } from "@/modules/bowling/model/bowling-session";
import { getTeamDisplayName } from "@/modules/bowling/model/bowling-view";
import { getDefaultLane } from "@/modules/bowling/model/bowling-draft";

export const bowlingTeamStyles: Record<BowlingTeamId, string> = {
  A: "bg-[#FEE500] text-ink",
  B: "bg-[#2F7D6D] text-white",
  C: "bg-[#E84D3D] text-white",
};

export function BowlingTeamCompositionCard({
  gameNumber,
  handicaps,
  onOpenTeam,
  onRandomize,
  onTeamCountChange,
  teamCount,
  teamOptions,
  teamRows,
  unassignedMembers,
}: {
  gameNumber: number;
  handicaps: Record<string, string>;
  onOpenTeam: (teamId: BowlingTeamId) => void;
  onRandomize: () => void;
  onTeamCountChange: (teamCount: 2 | 3) => void;
  teamCount: 2 | 3;
  teamOptions: BowlingTeamId[];
  teamRows: Array<{ members: ApiGroupMember[]; teamId: BowlingTeamId }>;
  unassignedMembers: ApiGroupMember[];
}) {
  const [randomConfirmOpen, setRandomConfirmOpen] = useState(false);

  return (
    <div className="relative rounded-[24px] bg-[#F4F0E8] p-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-ink/45">
            {gameNumber}게임 팀 구성
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="flex rounded-[16px] bg-white p-0.5">
            {([2, 3] as const).map((count) => (
              <button
                key={count}
                onClick={() => {
                  setRandomConfirmOpen(false);
                  onTeamCountChange(count);
                }}
                className={`h-8 rounded-[14px] px-3 text-xs font-black transition active:scale-[0.98] ${
                  teamCount === count ? "bg-ink text-white" : "text-ink/45"
                }`}
              >
                {count}개
              </button>
            ))}
          </div>
          <button
            onClick={() => setRandomConfirmOpen((open) => !open)}
            className="flex h-9 items-center gap-1.5 rounded-[16px] bg-white px-3 text-xs font-black text-ink transition active:scale-[0.98]"
          >
            <Shuffle className="h-3.5 w-3.5" />
            랜덤
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {randomConfirmOpen ? (
          <motion.div
            key="random-team-confirm"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-2 top-12 z-40 w-[220px] rounded-[22px] bg-ink p-2.5 text-white shadow-2xl"
          >
            <p className="text-xs font-black text-white/45">랜덤 팀 배정</p>
            <p className="mt-1 text-sm font-black">현재 배정을 바꿀까요?</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setRandomConfirmOpen(false)}
                className="h-10 rounded-[15px] bg-white/10 text-xs font-black text-white/70"
              >
                취소
              </button>
              <button
                onClick={() => {
                  onRandomize();
                  setRandomConfirmOpen(false);
                }}
                className="h-10 rounded-[15px] bg-[#FEE500] text-xs font-black text-ink"
              >
                배정
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div
        className="mt-2 grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${teamOptions.length}, minmax(0, 1fr))`,
        }}
      >
        {teamRows.map((team) => (
          <button
            key={team.teamId}
            onClick={() => onOpenTeam(team.teamId)}
            className="flex min-h-[74px] flex-col justify-start rounded-[20px] bg-white p-1.5 text-left transition active:scale-[0.99]"
          >
            <div
              className={`flex h-8 shrink-0 items-center justify-center rounded-[15px] px-2 text-center text-xs font-black ${bowlingTeamStyles[team.teamId]}`}
            >
              {getTeamDisplayName(team.teamId)} · {getDefaultLane(team.teamId)}
              레인
            </div>
            <div className="mt-1.5 w-full space-y-1">
              {team.members.length > 0 ? (
                team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex w-full items-center gap-1.5 rounded-[13px] bg-[#F4F0E8] px-1.5 py-1 text-left text-xs font-black"
                  >
                    <MemberProfileAvatar member={member} size="sm" />
                    <span className="min-w-0 flex-1 truncate">
                      {member.displayName}
                    </span>
                    {handicaps[member.id] ? (
                      <span className="shrink-0 rounded-full bg-[#FEE500] px-1.5 py-0.5 text-[10px] font-black text-ink">
                        +{handicaps[member.id]}
                      </span>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[13px] bg-[#F4F0E8] px-2 py-1.5 text-center text-xs font-black text-ink/35">
                  빈 팀
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      <AnimatePresence initial={false}>
        {unassignedMembers.length > 0 ? (
          <motion.div
            key="unassigned-members"
            initial={{ height: 0, opacity: 0, y: -4 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-[18px] bg-white/70 p-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black text-ink/45">미배정</p>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-black text-ink/45">
                  {unassignedMembers.length}명
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {unassignedMembers.map((member) => (
                  <span
                    key={member.id}
                    className="flex items-center gap-1.5 rounded-full bg-white py-0.5 pl-0.5 pr-2.5 text-xs font-black text-ink/65"
                  >
                    <MemberProfileAvatar member={member} size="sm" />
                    <span>{member.displayName}</span>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
