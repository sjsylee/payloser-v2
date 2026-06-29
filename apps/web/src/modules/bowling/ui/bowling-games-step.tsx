"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BowlingGameJudgementPanel } from "@/modules/bowling/ui/bowling-game-judgement-panel";
import { BowlingGameModeControls } from "@/modules/bowling/ui/bowling-game-mode-controls";
import { BowlingGameOptionsPopover } from "@/modules/bowling/ui/bowling-game-options-popover";
import { BowlingSoloScorePanel } from "@/modules/bowling/ui/bowling-solo-score-panel";
import { BowlingTeamCompositionCard } from "@/modules/bowling/ui/bowling-team-composition-card";
import { BowlingTeamScorePanel } from "@/modules/bowling/ui/bowling-team-score-panel";
import { TeamAssignmentSheet } from "@/modules/bowling/ui/team-assignment-sheet";
import type { ApiGroupMember } from "@/adapters/payloser-api";
import {
  getAssignedTeam,
  getSoloRankStackValue,
  normalizeBowlingScoreInput,
  normalizeDecimalInput,
} from "@/modules/bowling/model/bowling-draft";
import type {
  BowlingGameDraft,
  BowlingGameMode,
  BowlingGamePreview,
  BowlingLaneId,
  BowlingResultInputMode,
  BowlingSideCostId,
  BowlingSpecialRuleId,
} from "@/modules/bowling/model/bowling-draft";
import { swapManualTeamRank } from "@/modules/bowling/model/bowling-session";
import type { BowlingTeamId } from "@/modules/bowling/model/bowling-session";
import {
  autoCompleteBowlingTeamAssignments,
  createRandomBowlingTeamAssignments,
} from "@/modules/bowling/model/team-assignment";
import { writeSavedBowlingHandicap } from "@/modules/bowling/storage/bowling-handicap-storage";

export function BowlingGamesStep({
  games,
  members,
  onAddGame,
  onDeleteGame,
  onSelectGame,
  onUpdateGame,
  preview,
  selectedGame,
  selectedGameId,
}: {
  games: BowlingGameDraft[];
  members: ApiGroupMember[];
  onAddGame: () => void;
  onDeleteGame: (gameId: string) => void;
  onSelectGame: (gameId: string) => void;
  onUpdateGame: (
    gameId: string,
    patch: Partial<Omit<BowlingGameDraft, "id">>,
  ) => void;
  preview: BowlingGamePreview | null;
  selectedGame: BowlingGameDraft | undefined;
  selectedGameId: string;
}) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [gamePickerOpen, setGamePickerOpen] = useState(false);
  const selectedGameIndex = Math.max(
    0,
    games.findIndex((game) => game.id === selectedGameId),
  );
  const previousGame = games[selectedGameIndex - 1];
  const nextGame = games[selectedGameIndex + 1];
  const canDeleteGame = games.length > 1 && Boolean(selectedGame);

  return (
    <motion.div
      key="bowling-games"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-3"
    >
      <div className="relative rounded-[24px] bg-[#F4F0E8] p-2.5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-ink/45">게임 보드</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/58">
            {games.length}판
          </span>
        </div>
        <div className="grid grid-cols-[38px_minmax(0,1fr)_38px_42px_42px] gap-1.5">
          <button
            onClick={() => {
              if (previousGame) {
                onSelectGame(previousGame.id);
                setDeleteConfirmOpen(false);
              }
            }}
            disabled={!previousGame}
            className="flex h-11 items-center justify-center rounded-[16px] bg-white text-ink transition active:scale-[0.98] disabled:opacity-35"
            aria-label="이전 판"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setGamePickerOpen((open) => !open)}
            className="flex h-11 min-w-0 items-center justify-between rounded-[16px] bg-[#FEE500] px-3 text-left text-ink shadow-sm transition active:scale-[0.99]"
          >
            <span className="min-w-0">
              <span className="block text-xs font-black text-ink/45">
                현재 판
              </span>
              <span className="block truncate text-sm font-black">
                {selectedGameIndex + 1}게임
              </span>
            </span>
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-black">
              {games.length}판
            </span>
          </button>
          <button
            onClick={() => {
              if (nextGame) {
                onSelectGame(nextGame.id);
                setDeleteConfirmOpen(false);
              }
            }}
            disabled={!nextGame}
            className="flex h-11 items-center justify-center rounded-[16px] bg-white text-ink transition active:scale-[0.98] disabled:opacity-35"
            aria-label="다음 판"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              onAddGame();
              setDeleteConfirmOpen(false);
              setGamePickerOpen(false);
            }}
            className="flex h-11 items-center justify-center rounded-[16px] bg-ink text-white transition active:scale-[0.98]"
            aria-label="판 추가"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (canDeleteGame) {
                setDeleteConfirmOpen((open) => !open);
                setGamePickerOpen(false);
              }
            }}
            disabled={!canDeleteGame}
            className="flex h-11 items-center justify-center rounded-[16px] bg-white text-ink transition active:scale-[0.98] disabled:opacity-35"
            aria-label="현재 판 삭제"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <AnimatePresence initial={false}>
          {deleteConfirmOpen && selectedGame ? (
            <motion.div
              key="delete-game-confirm"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute right-2 top-[calc(100%-2px)] z-40 w-[212px] rounded-[22px] bg-ink p-2.5 text-white shadow-2xl"
            >
              <p className="text-xs font-black text-white/45">
                {selectedGameIndex + 1}게임 삭제
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="h-10 rounded-[15px] bg-white/10 text-xs font-black text-white/70"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    onDeleteGame(selectedGame.id);
                    setDeleteConfirmOpen(false);
                  }}
                  className="h-10 rounded-[15px] bg-[#FEE500] text-xs font-black text-ink"
                >
                  삭제
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {gamePickerOpen ? (
            <motion.div
              key="bowling-game-picker"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {games.map((game, index) => (
                  <button
                    key={game.id}
                    onClick={() => {
                      onSelectGame(game.id);
                      setDeleteConfirmOpen(false);
                      setGamePickerOpen(false);
                    }}
                    className={`h-10 rounded-[16px] text-xs font-black transition active:scale-[0.98] ${
                      selectedGameId === game.id
                        ? "bg-ink text-white"
                        : "bg-white text-ink/55"
                    }`}
                  >
                    {index + 1}게임
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      {selectedGame ? (
        <BowlingTeamGameEditor
          key={selectedGame.id}
          gameNumber={selectedGameIndex + 1}
          handicaps={selectedGame.handicaps}
          members={members}
          laneAssignments={selectedGame.laneAssignments}
          laneSplitEnabled={selectedGame.laneSplitEnabled}
          mode={selectedGame.mode}
          resultInputMode={selectedGame.resultInputMode}
          sideCosts={selectedGame.sideCosts}
          soloStackRules={selectedGame.soloStackRules}
          scores={selectedGame.scores}
          specialRules={selectedGame.specialRules}
          teamRanks={selectedGame.teamRanks}
          setLaneAssignments={(laneAssignments) =>
            onUpdateGame(selectedGame.id, { laneAssignments })
          }
          setLaneSplitEnabled={(laneSplitEnabled) =>
            onUpdateGame(selectedGame.id, { laneSplitEnabled })
          }
          setMode={(mode) => onUpdateGame(selectedGame.id, { mode })}
          setResultInputMode={(resultInputMode) =>
            onUpdateGame(selectedGame.id, { resultInputMode })
          }
          setHandicaps={(handicaps) =>
            onUpdateGame(selectedGame.id, { handicaps })
          }
          setSideCosts={(sideCosts) =>
            onUpdateGame(selectedGame.id, { sideCosts })
          }
          setSoloStackRules={(soloStackRules) =>
            onUpdateGame(selectedGame.id, { soloStackRules })
          }
          setScores={(scores) => onUpdateGame(selectedGame.id, { scores })}
          setSpecialRules={(specialRules) =>
            onUpdateGame(selectedGame.id, { specialRules })
          }
          teamAssignments={selectedGame.teamAssignments}
          setTeamAssignments={(teamAssignments) =>
            onUpdateGame(selectedGame.id, { teamAssignments })
          }
          teamCount={selectedGame.teamCount}
          setTeamCount={(teamCount) =>
            onUpdateGame(selectedGame.id, { teamCount })
          }
          setTeamRanks={(teamRanks) =>
            onUpdateGame(selectedGame.id, { teamRanks })
          }
          preview={preview}
          previousTeamAssignments={games
            .slice(0, selectedGameIndex)
            .map((game) => game.teamAssignments)}
        />
      ) : null}
    </motion.div>
  );
}

function BowlingTeamGameEditor({
  gameNumber,
  handicaps,
  laneAssignments,
  laneSplitEnabled,
  members,
  mode,
  preview,
  previousTeamAssignments,
  resultInputMode,
  sideCosts,
  soloStackRules,
  scores,
  specialRules,
  teamRanks,
  setHandicaps,
  setLaneAssignments,
  setLaneSplitEnabled,
  setMode,
  setResultInputMode,
  setSideCosts,
  setSoloStackRules,
  setScores,
  setSpecialRules,
  setTeamAssignments,
  setTeamCount,
  setTeamRanks,
  teamAssignments,
  teamCount,
}: {
  gameNumber: number;
  handicaps: Record<string, string>;
  laneAssignments: Record<string, BowlingLaneId>;
  laneSplitEnabled: boolean;
  members: ApiGroupMember[];
  mode: BowlingGameMode;
  preview: BowlingGamePreview | null;
  previousTeamAssignments: Array<Record<string, BowlingTeamId>>;
  resultInputMode: BowlingResultInputMode;
  sideCosts: Record<BowlingSideCostId, boolean>;
  soloStackRules: Record<string, string>;
  scores: Record<string, string>;
  specialRules: Record<BowlingSpecialRuleId, boolean>;
  teamRanks: Record<string, string>;
  setHandicaps: (handicaps: Record<string, string>) => void;
  setLaneAssignments: (assignments: Record<string, BowlingLaneId>) => void;
  setLaneSplitEnabled: (enabled: boolean) => void;
  setMode: (mode: BowlingGameMode) => void;
  setResultInputMode: (mode: BowlingResultInputMode) => void;
  setSideCosts: (sideCosts: Record<BowlingSideCostId, boolean>) => void;
  setSoloStackRules: (soloStackRules: Record<string, string>) => void;
  setScores: (scores: Record<string, string>) => void;
  setSpecialRules: (
    specialRules: Record<BowlingSpecialRuleId, boolean>,
  ) => void;
  setTeamAssignments: (assignments: Record<string, BowlingTeamId>) => void;
  setTeamCount: (teamCount: 2 | 3) => void;
  setTeamRanks: (ranks: Record<string, string>) => void;
  teamAssignments: Record<string, BowlingTeamId>;
  teamCount: 2 | 3;
}) {
  const [assignmentSheetTeam, setAssignmentSheetTeam] =
    useState<BowlingTeamId | null>(null);
  const [optionsPopoverOpen, setOptionsPopoverOpen] = useState(false);
  const [selectedScoreTeam, setSelectedScoreTeam] =
    useState<BowlingTeamId>("A");
  const teamOptions: BowlingTeamId[] =
    teamCount === 2 ? ["A", "B"] : ["A", "B", "C"];
  const teamRows = teamOptions.map((teamId) => ({
    teamId,
    members: members.filter(
      (member) =>
        getAssignedTeam({ memberId: member.id, teamAssignments, teamCount }) ===
        teamId,
    ),
  }));
  const unassignedMembers = members.filter(
    (member) =>
      !getAssignedTeam({ memberId: member.id, teamAssignments, teamCount }),
  );
  const selectedScoreMembers =
    teamRows.find((team) => team.teamId === selectedScoreTeam)?.members ?? [];
  const soloRankRows = Array.from({ length: members.length }, (_, index) => {
    const rank = index + 1;

    return {
      rank,
      value: getSoloRankStackValue({
        memberCount: members.length,
        rank,
        soloStackRules,
      }),
    };
  }).reverse();

  useEffect(() => {
    if (!teamOptions.includes(selectedScoreTeam)) {
      setSelectedScoreTeam("A");
    }
  }, [selectedScoreTeam, teamOptions]);

  const completeTeamAssignments = (
    assignments: Record<string, BowlingTeamId>,
    count: 2 | 3 = teamCount,
  ) =>
    autoCompleteBowlingTeamAssignments({
      memberIds: members.map((member) => member.id),
      teamAssignments: assignments,
      teamCount: count,
    }) as Record<string, BowlingTeamId>;

  const updateTeamCount = (count: 2 | 3) => {
    const nextAssignments =
      count === 2
        ? (Object.fromEntries(
            Object.entries(teamAssignments).map(([memberId, teamId]) => [
              memberId,
              teamId === "C" ? "B" : teamId,
            ]),
          ) as Record<string, BowlingTeamId>)
        : teamAssignments;

    setTeamAssignments(completeTeamAssignments(nextAssignments, count));
    setTeamRanks(
      Object.fromEntries(
        (count === 2 ? ["A", "B"] : ["A", "B", "C"]).map((teamId, index) => [
          teamId,
          String(index + 1),
        ]),
      ),
    );
    setTeamCount(count);
  };
  const randomizeTeamAssignments = () => {
    setTeamAssignments(
      createRandomBowlingTeamAssignments({
        memberIds: members.map((member) => member.id),
        previousTeamAssignments,
        teamCount,
      }) as Record<string, BowlingTeamId>,
    );
    setSelectedScoreTeam("A");
  };
  const updateMode = (nextMode: BowlingGameMode) => {
    setMode(nextMode);
    setAssignmentSheetTeam(null);
    setOptionsPopoverOpen(false);
    setSelectedScoreTeam("A");
  };
  const updateTeamRank = (teamId: BowlingTeamId, rank: number) => {
    setTeamRanks(
      swapManualTeamRank({
        rank,
        teamId,
        teamOptions,
        teamRanks,
      }),
    );
  };
  const getNextTeamAssignmentsForToggle = (
    memberId: string,
    teamId: BowlingTeamId,
    currentAssignments: Record<string, BowlingTeamId> = teamAssignments,
  ) => {
    const assignedTeam = getAssignedTeam({
      memberId,
      teamAssignments: currentAssignments,
      teamCount,
    });
    const maxMembersPerTeam = Math.ceil(members.length / teamCount);
    const selectedMemberCount = members.filter(
      (member) =>
        getAssignedTeam({
          memberId: member.id,
          teamAssignments: currentAssignments,
          teamCount,
        }) === teamId,
    ).length;

    if (assignedTeam === teamId) {
      const { [memberId]: _removed, ...nextAssignments } = currentAssignments;
      return nextAssignments;
    }

    if (selectedMemberCount >= maxMembersPerTeam) {
      return currentAssignments;
    }

    return completeTeamAssignments({
      ...currentAssignments,
      [memberId]: teamId,
    });
  };
  const toggleSideCost = (sideCost: BowlingSideCostId) => {
    setSideCosts({
      ...sideCosts,
      [sideCost]: !sideCosts[sideCost],
    });
  };
  const toggleSpecialRule = (specialRule: BowlingSpecialRuleId) => {
    setSpecialRules({
      ...specialRules,
      [specialRule]: !specialRules[specialRule],
    });
  };
  const updateHandicap = (memberId: string, value: string) => {
    const nextValue = normalizeBowlingScoreInput(value);

    setHandicaps({
      ...handicaps,
      [memberId]: nextValue,
    });
    writeSavedBowlingHandicap(memberId, nextValue);
  };
  const removeHandicap = (memberId: string) => {
    const { [memberId]: _removed, ...nextHandicaps } = handicaps;
    setHandicaps(nextHandicaps);
    writeSavedBowlingHandicap(memberId, null);
  };
  const updateSoloRankStack = (rank: number, value: string) => {
    setSoloStackRules({
      ...soloStackRules,
      [String(rank)]: normalizeDecimalInput(value),
    });
  };

  if (members.length === 0) {
    return (
      <div className="rounded-[24px] bg-[#F4F0E8] p-4 text-center">
        <p className="text-sm font-black">팀전을 쓰려면 참여자가 필요해요</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <BowlingGameModeControls
        gameNumber={gameNumber}
        mode={mode}
        onModeChange={updateMode}
        onResultInputModeChange={setResultInputMode}
        resultInputMode={resultInputMode}
      />
      {mode === "team" ? (
        <BowlingTeamCompositionCard
          gameNumber={gameNumber}
          handicaps={handicaps}
          onOpenTeam={setAssignmentSheetTeam}
          onRandomize={randomizeTeamAssignments}
          onTeamCountChange={updateTeamCount}
          teamCount={teamCount}
          teamOptions={teamOptions}
          teamRows={teamRows}
          unassignedMembers={unassignedMembers}
        />
      ) : (
        <BowlingSoloScorePanel
          handicaps={handicaps}
          members={members}
          onRemoveHandicap={removeHandicap}
          onScoreChange={(memberId, value) =>
            setScores({
              ...scores,
              [memberId]: normalizeBowlingScoreInput(value),
            })
          }
          onSoloRankStackChange={updateSoloRankStack}
          onUpdateHandicap={updateHandicap}
          scores={scores}
          soloRankRows={soloRankRows}
        />
      )}
      <BowlingGameOptionsPopover
        onOpenChange={setOptionsPopoverOpen}
        onToggleSideCost={toggleSideCost}
        onToggleSpecialRule={toggleSpecialRule}
        open={optionsPopoverOpen}
        sideCosts={sideCosts}
        specialRules={specialRules}
      />
      {mode === "team" ? (
        <BowlingTeamScorePanel
          handicaps={handicaps}
          laneAssignments={laneAssignments}
          laneSplitEnabled={laneSplitEnabled}
          members={members}
          onLaneAssignmentsChange={setLaneAssignments}
          onLaneSplitEnabledChange={setLaneSplitEnabled}
          onRemoveHandicap={removeHandicap}
          onScoreChange={(memberId, value) =>
            setScores({
              ...scores,
              [memberId]: normalizeBowlingScoreInput(value),
            })
          }
          onSelectedScoreTeamChange={setSelectedScoreTeam}
          onTeamRankChange={updateTeamRank}
          onUpdateHandicap={updateHandicap}
          resultInputMode={resultInputMode}
          scores={scores}
          selectedScoreMembers={selectedScoreMembers}
          selectedScoreTeam={selectedScoreTeam}
          teamAssignments={teamAssignments}
          teamCount={teamCount}
          teamOptions={teamOptions}
          teamRanks={teamRanks}
        />
      ) : null}
      <BowlingGameJudgementPanel
        members={members}
        mode={mode}
        preview={preview}
        resultInputMode={resultInputMode}
      />
      {mode === "team" ? (
        <TeamAssignmentSheet
          getNextTeamAssignments={getNextTeamAssignmentsForToggle}
          members={members}
          onApplyAssignments={(assignments, teamId) => {
            setTeamAssignments(assignments);
            setSelectedScoreTeam(teamId);
          }}
          onClose={() => setAssignmentSheetTeam(null)}
          openTeam={assignmentSheetTeam}
          teamAssignments={teamAssignments}
          teamCount={teamCount}
        />
      ) : null}
    </div>
  );
}
