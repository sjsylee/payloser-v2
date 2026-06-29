"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MemberProfileAvatar } from "@/modules/group/ui/group-avatars";
import { bowlingTeamStyles } from "@/modules/bowling/ui/bowling-team-composition-card";
import type { ApiGroupMember } from "@/adapters/payloser-api";
import type {
  BowlingLaneId,
  BowlingResultInputMode,
} from "@/modules/bowling/model/bowling-draft";
import { getMemberLane } from "@/modules/bowling/model/bowling-draft";
import {
  defaultBowlingTeamRanks,
  type BowlingTeamId,
} from "@/modules/bowling/model/bowling-session";
import { getTeamDisplayName } from "@/modules/bowling/model/bowling-view";

const laneOptions: BowlingLaneId[] = ["1", "2", "3"];

export function BowlingTeamScorePanel({
  handicaps,
  laneAssignments,
  laneSplitEnabled,
  members,
  onLaneAssignmentsChange,
  onLaneSplitEnabledChange,
  onRemoveHandicap,
  onScoreChange,
  onSelectedScoreTeamChange,
  onTeamRankChange,
  onUpdateHandicap,
  resultInputMode,
  scores,
  selectedScoreMembers,
  selectedScoreTeam,
  teamAssignments,
  teamCount,
  teamOptions,
  teamRanks,
}: {
  handicaps: Record<string, string>;
  laneAssignments: Record<string, BowlingLaneId>;
  laneSplitEnabled: boolean;
  members: ApiGroupMember[];
  onLaneAssignmentsChange: (assignments: Record<string, BowlingLaneId>) => void;
  onLaneSplitEnabledChange: (enabled: boolean) => void;
  onRemoveHandicap: (memberId: string) => void;
  onScoreChange: (memberId: string, value: string) => void;
  onSelectedScoreTeamChange: (teamId: BowlingTeamId) => void;
  onTeamRankChange: (teamId: BowlingTeamId, rank: number) => void;
  onUpdateHandicap: (memberId: string, value: string) => void;
  resultInputMode: BowlingResultInputMode;
  scores: Record<string, string>;
  selectedScoreMembers: ApiGroupMember[];
  selectedScoreTeam: BowlingTeamId;
  teamAssignments: Record<string, BowlingTeamId>;
  teamCount: 2 | 3;
  teamOptions: BowlingTeamId[];
  teamRanks: Record<string, string>;
}) {
  return (
    <>
      <button
        onClick={() => onLaneSplitEnabledChange(!laneSplitEnabled)}
        className="flex min-h-12 w-full items-center justify-between rounded-[22px] bg-[#F4F0E8] px-4 text-left transition active:scale-[0.99]"
      >
        <span>
          <span className="block text-xs font-black text-ink/45">
            레인 설정
          </span>
          <span className="block text-sm font-black">
            {laneSplitEnabled ? "팀 안에서 레인 나누기" : "같은 팀은 같은 레인"}
          </span>
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${laneSplitEnabled ? "bg-ink text-white" : "bg-white text-ink/55"}`}
        >
          {laneSplitEnabled ? "분리" : "기본"}
        </span>
      </button>
      {resultInputMode === "rank" ? (
        <div className="rounded-[24px] bg-[#F4F0E8] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-ink/45">팀 순위</p>
              <p className="text-sm font-black">졌던 팀만 빠르게 맞추기</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-black text-ink/45">
              {teamOptions.length}팀
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {teamOptions.map((teamId) => (
              <div
                key={teamId}
                className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-2 rounded-[20px] bg-white p-2"
              >
                <div
                  className={`rounded-[15px] px-2 py-2 text-center text-xs font-black ${bowlingTeamStyles[teamId]}`}
                >
                  {getTeamDisplayName(teamId)}
                </div>
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${teamOptions.length}, minmax(0, 1fr))`,
                  }}
                >
                  {teamOptions.map((_, index) => {
                    const rank = index + 1;
                    const selectedRank =
                      Number(
                        teamRanks[teamId] ?? defaultBowlingTeamRanks[teamId],
                      ) === rank;

                    return (
                      <button
                        key={rank}
                        onClick={() => onTeamRankChange(teamId, rank)}
                        className={`h-9 rounded-[14px] text-xs font-black transition active:scale-[0.98] ${
                          selectedRank
                            ? "bg-[#FEE500] text-ink"
                            : "bg-[#F4F0E8] text-ink/45"
                        }`}
                      >
                        {rank}등
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className={resultInputMode === "rank" ? "hidden" : undefined}>
        <div className="flex items-center justify-between gap-3 px-1 pb-2">
          <p className="text-xs font-black text-ink/45">팀별 점수 조정</p>
          <span className="text-xs font-black text-ink/35">
            {getTeamDisplayName(selectedScoreTeam)}
          </span>
        </div>
        <div
          className="mb-2 grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${teamOptions.length}, minmax(0, 1fr))`,
          }}
        >
          {teamOptions.map((teamId) => (
            <button
              key={teamId}
              onClick={() => onSelectedScoreTeamChange(teamId)}
              className={`h-10 rounded-[18px] text-xs font-black transition active:scale-[0.98] ${
                selectedScoreTeam === teamId
                  ? bowlingTeamStyles[teamId]
                  : "bg-[#F4F0E8] text-ink/45"
              }`}
            >
              {getTeamDisplayName(teamId)}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {selectedScoreMembers.length > 0 ? (
            selectedScoreMembers.map((member) => {
              const memberIndex = members.findIndex(
                (candidate) => candidate.id === member.id,
              );
              const handicapValue = handicaps[member.id];
              const hasHandicap = handicapValue !== undefined;

              return (
                <div
                  key={member.id}
                  className="rounded-[24px] bg-[#F4F0E8] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <MemberProfileAvatar member={member} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {member.displayName}
                        </p>
                        <p className="mt-1 text-xs font-bold text-ink/42">
                          {getTeamDisplayName(selectedScoreTeam)} ·{" "}
                          {getMemberLane({
                            laneAssignments,
                            laneSplitEnabled,
                            memberId: member.id,
                            memberIndex,
                            teamAssignments,
                            teamCount,
                          })}
                          레인
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <AnimatePresence initial={false}>
                        {hasHandicap ? (
                          <motion.label
                            key={`${member.id}-handicap`}
                            initial={{ opacity: 0, width: 0, x: 8 }}
                            animate={{ opacity: 1, width: 100, x: 0 }}
                            exit={{ opacity: 0, width: 0, x: 8 }}
                            transition={{ duration: 0.16 }}
                            className="flex h-10 items-center gap-1.5 overflow-hidden rounded-[18px] bg-white px-2 ring-1 ring-[#FEE500]"
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
                          className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-white text-xs font-black text-ink/45 transition active:scale-[0.98]"
                          aria-label={`${member.displayName} 핸디캡 제거`}
                        >
                          ×
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateHandicap(member.id, "10")}
                          className="h-10 rounded-[18px] bg-white px-3 text-xs font-black text-ink/45 transition active:scale-[0.98]"
                        >
                          +핸디
                        </button>
                      )}
                      <label className="flex h-10 w-24 items-center rounded-[18px] bg-white px-2">
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
                  <AnimatePresence initial={false}>
                    {laneSplitEnabled ? (
                      <motion.div
                        key={`${member.id}-lane-split`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 grid grid-cols-3 gap-1.5">
                          {laneOptions.map((laneId) => {
                            const selectedLane = getMemberLane({
                              laneAssignments,
                              laneSplitEnabled,
                              memberId: member.id,
                              memberIndex,
                              teamAssignments,
                              teamCount,
                            });

                            return (
                              <button
                                key={laneId}
                                onClick={() =>
                                  onLaneAssignmentsChange({
                                    ...laneAssignments,
                                    [member.id]: laneId,
                                  })
                                }
                                className={`h-9 rounded-2xl text-xs font-black ${
                                  selectedLane === laneId
                                    ? "bg-ink text-white"
                                    : "bg-white text-ink/45"
                                }`}
                              >
                                {laneId}레인
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="rounded-[24px] bg-[#F4F0E8] p-4 text-center text-sm font-black text-ink/45">
              이 팀에는 아직 멤버가 없어요
            </div>
          )}
        </div>
      </div>
    </>
  );
}
