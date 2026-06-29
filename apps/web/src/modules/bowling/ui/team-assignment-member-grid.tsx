"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MemberProfileAvatar } from "@/modules/group/ui/group-avatars";
import type { ApiGroupMember } from "@/adapters/payloser-api";
import { getAssignedTeam } from "@/modules/bowling/model/bowling-draft";
import type { BowlingTeamId } from "@/modules/bowling/model/bowling-session";
import { getTeamDisplayName } from "@/modules/bowling/model/bowling-view";

export function TeamAssignmentMemberGrid({
  activeTeam,
  maxMembersPerTeam,
  members,
  onToggleMember,
  teamAssignments,
  teamCount,
}: {
  activeTeam: BowlingTeamId;
  maxMembersPerTeam: number;
  members: ApiGroupMember[];
  onToggleMember: (memberId: string, teamId: BowlingTeamId) => void;
  teamAssignments: Record<string, BowlingTeamId>;
  teamCount: 2 | 3;
}) {
  const selectedMembers = members.filter(
    (member) =>
      getAssignedTeam({ memberId: member.id, teamAssignments, teamCount }) ===
      activeTeam,
  );
  const unassignedMembers = members.filter(
    (member) =>
      !getAssignedTeam({ memberId: member.id, teamAssignments, teamCount }),
  );
  const assignedElsewhereMembers = members.filter((member) => {
    const assignedTeam = getAssignedTeam({
      memberId: member.id,
      teamAssignments,
      teamCount,
    });

    return assignedTeam && assignedTeam !== activeTeam;
  });
  const isFull = selectedMembers.length >= maxMembersPerTeam;
  const assignedTeamBadgeStyles: Record<BowlingTeamId, string> = {
    A: "bg-[#FEE500] text-ink",
    B: "bg-[#2F7D6D] text-white",
    C: "bg-[#E84D3D] text-white",
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-[22px] bg-[#F4F0E8] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black text-ink/45">현재 팀</p>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-ink/55">
            {selectedMembers.length}/{maxMembersPerTeam}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {selectedMembers.length > 0 ? (
            selectedMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => onToggleMember(member.id, activeTeam)}
                className="flex min-h-14 items-center gap-2 rounded-[18px] bg-[#FEE500] px-3 text-left text-sm font-black text-ink transition active:scale-[0.98]"
              >
                <MemberProfileAvatar member={member} />
                <span className="min-w-0">
                  <span className="block truncate">{member.displayName}</span>
                  <span className="mt-1 block text-[11px] font-black text-ink/45">
                    선택됨
                  </span>
                </span>
              </button>
            ))
          ) : (
            <div className="col-span-2 rounded-[18px] bg-white px-3 py-4 text-center text-xs font-black text-ink/35">
              아직 선택된 멤버 없음
            </div>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {unassignedMembers.length > 0 ? (
          <motion.div
            key="modal-unassigned-members"
            initial={{ height: 0, opacity: 0, y: -4 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-1 pb-2">
              <p className="text-xs font-black text-ink/45">미배정 멤버</p>
              {isFull ? (
                <span className="text-xs font-black text-strike">
                  정원 가득
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {unassignedMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    if (!isFull) {
                      onToggleMember(member.id, activeTeam);
                    }
                  }}
                  disabled={isFull}
                  className="flex min-h-14 items-center gap-2 rounded-[18px] bg-[#F4F0E8] px-3 text-left text-sm font-black text-ink/65 transition active:scale-[0.98] disabled:opacity-40"
                >
                  <MemberProfileAvatar member={member} />
                  <span className="min-w-0">
                    <span className="block truncate">{member.displayName}</span>
                    <span className="mt-1 block text-[11px] font-black text-ink/35">
                      미배정
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {assignedElsewhereMembers.length > 0 ? (
        <div className="rounded-[22px] bg-ink p-3 text-white shadow-[0_14px_34px_rgba(24,23,22,0.18)]">
          <div className="flex items-center justify-between gap-3 pb-2">
            <p className="text-xs font-black text-white/55">다른 팀 배정됨</p>
            <span className="rounded-full bg-white/12 px-2.5 py-1 text-xs font-black text-white/55">
              {assignedElsewhereMembers.length}명
            </span>
          </div>
          <div className="grid gap-2">
            {assignedElsewhereMembers.map((member) => {
              const assignedTeam = getAssignedTeam({
                memberId: member.id,
                teamAssignments,
                teamCount,
              });

              return (
                <button
                  key={member.id}
                  onClick={() => {
                    if (!isFull) {
                      onToggleMember(member.id, activeTeam);
                    }
                  }}
                  disabled={isFull}
                  className="group flex min-h-14 items-center gap-2 rounded-[18px] bg-white/10 px-3 text-left text-sm font-black text-white transition ring-1 ring-white/10 active:scale-[0.98] disabled:opacity-40"
                >
                  <MemberProfileAvatar member={member} />
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-white">
                        {member.displayName}
                      </span>
                      <span className="mt-1 block whitespace-nowrap text-[11px] font-black text-white/45">
                        이미 배정됨
                      </span>
                    </span>
                    {assignedTeam ? (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${assignedTeamBadgeStyles[assignedTeam]}`}
                      >
                        {getTeamDisplayName(assignedTeam)}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
