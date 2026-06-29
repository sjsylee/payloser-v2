"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TeamAssignmentMemberGrid } from "@/modules/bowling/ui/team-assignment-member-grid";
import type { ApiGroupMember } from "@/adapters/payloser-api";
import type { BowlingTeamId } from "@/modules/bowling/model/bowling-session";
import { getTeamDisplayName } from "@/modules/bowling/model/bowling-view";

export function TeamAssignmentSheet({
  getNextTeamAssignments,
  members,
  onApplyAssignments,
  onClose,
  openTeam,
  teamAssignments,
  teamCount,
}: {
  getNextTeamAssignments: (
    memberId: string,
    teamId: BowlingTeamId,
    currentAssignments: Record<string, BowlingTeamId>,
  ) => Record<string, BowlingTeamId>;
  members: ApiGroupMember[];
  onApplyAssignments: (
    assignments: Record<string, BowlingTeamId>,
    teamId: BowlingTeamId,
  ) => void;
  onClose: () => void;
  openTeam: BowlingTeamId | null;
  teamAssignments: Record<string, BowlingTeamId>;
  teamCount: 2 | 3;
}) {
  const activeTeam =
    openTeam && (teamCount === 3 || openTeam !== "C") ? openTeam : null;
  const maxMembersPerTeam = Math.ceil(members.length / teamCount);
  const [draftTeamAssignments, setDraftTeamAssignments] =
    useState(teamAssignments);

  useEffect(() => {
    if (activeTeam) {
      setDraftTeamAssignments(teamAssignments);
    }
  }, [activeTeam, teamAssignments]);

  const closeWithApply = () => {
    if (activeTeam) {
      onApplyAssignments(draftTeamAssignments, activeTeam);
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {activeTeam ? (
        <motion.div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-ink/35 px-4 py-[calc(16px+env(safe-area-inset-bottom))] backdrop-blur-sm lg:absolute lg:rounded-[32px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeWithApply}
        >
          <motion.div
            initial={{ y: 12, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[78svh] w-full max-w-[380px] overflow-y-auto rounded-[30px] bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-ink/45">
                  {getTeamDisplayName(activeTeam)} 배정
                </p>
                <h2 className="text-lg font-black">멤버 빠른 선택</h2>
              </div>
              <button
                onClick={closeWithApply}
                className="h-10 rounded-[18px] bg-[#F4F0E8] px-4 text-xs font-black text-ink/60"
              >
                닫기
              </button>
            </div>
            <TeamAssignmentMemberGrid
              activeTeam={activeTeam}
              maxMembersPerTeam={maxMembersPerTeam}
              members={members}
              onToggleMember={(memberId, teamId) =>
                setDraftTeamAssignments((currentAssignments) =>
                  getNextTeamAssignments(memberId, teamId, currentAssignments),
                )
              }
              teamAssignments={draftTeamAssignments}
              teamCount={teamCount}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
