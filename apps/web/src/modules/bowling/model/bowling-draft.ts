import {
  allocateRankedTeamGameStacks,
  rankTeamsByNormalizedScore,
} from "@payloser/shared";
import {
  buildManualRankedTeams,
  defaultBowlingTeamRanks,
} from "./bowling-session";
import type { BowlingTeamId } from "./bowling-session";

export type BowlingLaneId = "1" | "2" | "3";
export type BowlingGameMode = "team" | "solo";
export type BowlingSideCostId = "shoes" | "drink";
export type BowlingSpecialRuleId = "under100";
export type BowlingResultInputMode = "score" | "rank";
export type BowlingInputMode = "quick" | "team";

export type BowlingParticipant = {
  id: string;
};

export type BowlingStackPreview = {
  gameCount: number;
  unit: number;
  perGameStacks: number;
  amount: number;
  totalStacks: number;
};

export type BowlingGamePreview = {
  allocations: Array<{
    memberId: string;
    stacks: number;
    reason: string;
  }>;
  teamSummaries: Array<{
    teamId: BowlingTeamId;
    normalizedScore: number;
    rank: number;
  }>;
  soloSummaries?: Array<{
    memberId: string;
    rank: number;
    score: number;
    stacks: number;
  }>;
  totalStacks: number;
};

export type BowlingGameDraft = {
  id: string;
  laneAssignments: Record<string, BowlingLaneId>;
  laneSplitEnabled: boolean;
  mode: BowlingGameMode;
  resultInputMode: BowlingResultInputMode;
  handicaps: Record<string, string>;
  sideCosts: Record<BowlingSideCostId, boolean>;
  soloStackRules: Record<string, string>;
  specialRules: Record<BowlingSpecialRuleId, boolean>;
  teamCount: 2 | 3;
  teamAssignments: Record<string, BowlingTeamId>;
  teamRanks: Record<string, string>;
  scores: Record<string, string>;
};

export const defaultBowlingSideCosts: Record<BowlingSideCostId, boolean> = {
  drink: false,
  shoes: false,
};

export const defaultBowlingSpecialRules: Record<BowlingSpecialRuleId, boolean> =
  {
    under100: true,
  };

export function filterValidBowlingAmountPresets(input: unknown, limit = 6) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(
      (value): value is string =>
        typeof value === "string" &&
        Number.isFinite(Number(value)) &&
        Number(value) > 0,
    )
    .slice(0, limit);
}

export function rememberBowlingAmountPreset({
  amountInput,
  presets,
  limit = 6,
}: {
  amountInput: string;
  presets: string[];
  limit?: number;
}) {
  const amount = String(Math.max(1, Math.round(parseAmount(amountInput))));

  return [amount, ...presets.filter((preset) => preset !== amount)].slice(
    0,
    limit,
  );
}

export function reconcileBowlingParticipantIds({
  memberIds,
  previousMemberIds = [],
  previousSelectedIds,
}: {
  memberIds: string[];
  previousMemberIds?: string[];
  previousSelectedIds: string[];
}) {
  const memberIdSet = new Set(memberIds);
  const previousMemberIdSet = new Set(previousMemberIds);
  const validPreviousIds = previousSelectedIds.filter((memberId) =>
    memberIdSet.has(memberId),
  );
  const addedMemberIds = memberIds.filter(
    (memberId) => !previousMemberIdSet.has(memberId),
  );

  if (validPreviousIds.length === 0) {
    if (previousSelectedIds.length === 0 && previousMemberIds.length > 0) {
      return addedMemberIds;
    }

    return memberIds;
  }

  const selectedIdSet = new Set(validPreviousIds);
  const nextSelectedIds = [...validPreviousIds];

  for (const memberId of addedMemberIds) {
    if (!selectedIdSet.has(memberId)) {
      nextSelectedIds.push(memberId);
    }
  }

  return nextSelectedIds;
}

export function selectBowlingParticipants<T extends BowlingParticipant>({
  members,
  selectedIds,
}: {
  members: T[];
  selectedIds: string[];
}) {
  const selectedIdSet = new Set(selectedIds);
  const selectedMembers = members.filter((member) =>
    selectedIdSet.has(member.id),
  );

  return selectedMembers;
}

export function resolveBowlingPayerMemberId<T extends BowlingParticipant>({
  currentPayerMemberId,
  members,
}: {
  currentPayerMemberId: string | null;
  members: T[];
}) {
  if (members.length === 0) {
    return null;
  }

  if (
    currentPayerMemberId &&
    members.some((member) => member.id === currentPayerMemberId)
  ) {
    return currentPayerMemberId;
  }

  return members[0]?.id ?? null;
}

export function buildBowlingStackPreview({
  games,
  inputMode,
  members,
  perPersonAmountInput,
  totalStacksInput,
}: {
  games: BowlingGameDraft[];
  inputMode: BowlingInputMode;
  members: BowlingParticipant[];
  perPersonAmountInput: string;
  totalStacksInput: string;
}): BowlingStackPreview {
  const amount =
    Math.max(0, Math.round(parseAmount(perPersonAmountInput))) * members.length;
  const teamGamePreviews =
    inputMode === "team"
      ? games
          .map((game) => buildBowlingGamePreview({ game, members }))
          .filter((preview): preview is BowlingGamePreview => Boolean(preview))
      : [];
  const teamGameStacks =
    inputMode === "team"
      ? teamGamePreviews.reduce((sum, preview) => sum + preview.totalStacks, 0)
      : 0;
  const stacks =
    inputMode === "team"
      ? teamGameStacks
      : Math.max(1, Math.round(parseAmount(totalStacksInput)));
  const gameCount = inputMode === "team" ? teamGamePreviews.length : 1;

  return {
    gameCount,
    unit: stacks > 0 ? Math.round(amount / stacks) : 0,
    perGameStacks: gameCount > 0 ? Math.round(stacks / gameCount) : 0,
    amount,
    totalStacks: stacks,
  };
}

export function createBowlingGameDraft({
  handicaps = {},
  id,
  previousGame,
}: {
  handicaps?: Record<string, string>;
  id: string;
  previousGame?: Pick<BowlingGameDraft, "mode" | "teamCount">;
}): BowlingGameDraft {
  return {
    id,
    handicaps,
    laneAssignments: {},
    laneSplitEnabled: false,
    mode: previousGame?.mode ?? "team",
    resultInputMode: "score",
    sideCosts: { ...defaultBowlingSideCosts },
    soloStackRules: {},
    specialRules: { ...defaultBowlingSpecialRules },
    teamCount: previousGame?.teamCount ?? 3,
    teamAssignments: {},
    teamRanks: { ...defaultBowlingTeamRanks },
    scores: {},
  };
}

export function updateBowlingGameDrafts({
  gameId,
  games,
  patch,
}: {
  gameId: string;
  games: BowlingGameDraft[];
  patch: Partial<Omit<BowlingGameDraft, "id">>;
}) {
  return games.map((game) =>
    game.id === gameId
      ? {
          ...game,
          ...patch,
        }
      : game,
  );
}

export function appendBowlingGameDraft({
  games,
  handicaps = {},
  nextGameId,
  selectedGameId,
}: {
  games: BowlingGameDraft[];
  handicaps?: Record<string, string>;
  nextGameId: string;
  selectedGameId: string;
}) {
  const previousGame =
    games.find((game) => game.id === selectedGameId) ?? games[games.length - 1];
  const nextGame = createBowlingGameDraft({
    handicaps,
    id: nextGameId,
    ...(previousGame ? { previousGame } : {}),
  });

  return {
    games: [...games, nextGame],
    selectedGameId: nextGame.id,
  };
}

export function deleteBowlingGameDraft({
  gameId,
  games,
  selectedGameId,
}: {
  gameId: string;
  games: BowlingGameDraft[];
  selectedGameId: string;
}) {
  if (games.length <= 1) {
    return {
      games,
      selectedGameId,
    };
  }

  const deletedGameIndex = games.findIndex((game) => game.id === gameId);
  const nextGames = games.filter((game) => game.id !== gameId);
  const nextSelectedGame =
    selectedGameId === gameId
      ? (nextGames[Math.max(0, deletedGameIndex - 1)] ?? nextGames[0])
      : games.find((game) => game.id === selectedGameId);

  return {
    games: nextGames,
    selectedGameId: nextSelectedGame?.id ?? nextGames[0]?.id ?? selectedGameId,
  };
}

export function buildBowlingSessionGames(
  previews: Array<BowlingGamePreview | null>,
) {
  return previews
    .filter((preview): preview is BowlingGamePreview => Boolean(preview))
    .map((preview) => ({
      stackAllocations: preview.allocations,
    }));
}

export function buildBowlingSettlementSaveInput({
  games,
  inputMode,
  members,
  payerMemberId,
  totalAmount,
  totalStacksInput,
}: {
  games: BowlingGameDraft[];
  inputMode: BowlingInputMode;
  members: BowlingParticipant[];
  payerMemberId?: string | null;
  totalAmount: number;
  totalStacksInput: string;
}) {
  const sessionGames =
    inputMode === "team"
      ? buildBowlingSessionGames(
          games.map((game) => buildBowlingGamePreview({ game, members })),
        )
      : [];
  const details =
    inputMode === "team"
      ? buildBowlingSettlementDetails({
          games,
          members,
        })
      : undefined;

  return {
    totalAmount,
    totalStacks:
      inputMode === "team"
        ? getBowlingSessionTotalStacks(games, members)
        : Math.max(1, Math.round(parseAmount(totalStacksInput))),
    ...(payerMemberId ? { payerMemberId } : {}),
    ...(inputMode === "team" ? { games: sessionGames } : {}),
    ...(details ? { details } : {}),
  };
}

export function buildBowlingSettlementDetails({
  games,
  members,
}: {
  games: BowlingGameDraft[];
  members: BowlingParticipant[];
}) {
  const participantMemberIds = members.map((member) => member.id);
  const detailedGames = games
    .map((game) => {
      const preview = buildBowlingGamePreview({ game, members });

      if (!preview) {
        return null;
      }

      const scores = members
        .map((member) => {
          const rawScore = game.scores[member.id];

          if (rawScore === undefined || rawScore.trim() === "") {
            return null;
          }

          return {
            memberId: member.id,
            score: Math.max(0, Math.round(parseAmount(rawScore))),
          };
        })
        .filter((score): score is { memberId: string; score: number } =>
          Boolean(score),
        );

      return {
        stackAllocations: preview.allocations,
        ...(scores.length > 0 ? { scores } : {}),
      };
    })
    .filter(
      (
        game,
      ): game is {
        stackAllocations: BowlingGamePreview["allocations"];
        scores?: Array<{ memberId: string; score: number }>;
      } => Boolean(game),
    );

  if (detailedGames.length === 0) {
    return undefined;
  }

  return {
    participantMemberIds,
    games: detailedGames,
  };
}

export function getDefaultTeam(memberIndex: number, teamCount: 2 | 3) {
  const teams: BowlingTeamId[] = teamCount === 2 ? ["A", "B"] : ["A", "B", "C"];
  return teams[memberIndex % teams.length] ?? "A";
}

export function getDefaultLane(teamId: BowlingTeamId): BowlingLaneId {
  const lanes: Record<BowlingTeamId, BowlingLaneId> = {
    A: "1",
    B: "2",
    C: "3",
  };

  return lanes[teamId];
}

export function getAssignedTeam({
  memberId,
  teamAssignments,
  teamCount,
}: {
  memberId: string;
  teamAssignments: Record<string, BowlingTeamId>;
  teamCount: 2 | 3;
}) {
  const assignedTeam = teamAssignments[memberId];

  if (!assignedTeam) {
    return null;
  }

  if (teamCount === 2 && assignedTeam === "C") {
    return null;
  }

  return assignedTeam;
}

export function getMemberLane({
  laneAssignments,
  laneSplitEnabled,
  memberId,
  memberIndex,
  teamAssignments,
  teamCount,
}: {
  laneAssignments: Record<string, BowlingLaneId>;
  laneSplitEnabled: boolean;
  memberId: string;
  memberIndex: number;
  teamAssignments: Record<string, BowlingTeamId>;
  teamCount: 2 | 3;
}) {
  if (laneSplitEnabled && laneAssignments[memberId]) {
    return laneAssignments[memberId];
  }

  return getDefaultLane(
    teamAssignments[memberId] ?? getDefaultTeam(memberIndex, teamCount),
  );
}

export function buildBowlingGamePreview({
  game,
  members,
}: {
  game: BowlingGameDraft;
  members: BowlingParticipant[];
}) {
  if (game.mode === "solo") {
    return buildBowlingSoloGamePreview({
      handicaps: game.handicaps,
      members,
      scores: game.scores,
      soloStackRules: game.soloStackRules,
    });
  }

  return buildBowlingTeamGamePreview({
    handicaps: game.handicaps,
    members,
    resultInputMode: game.resultInputMode,
    scores: game.scores,
    teamAssignments: game.teamAssignments,
    teamCount: game.teamCount,
    teamRanks: game.teamRanks,
  });
}

export function getBowlingSessionTotalStacks(
  games: BowlingGameDraft[],
  members: BowlingParticipant[],
) {
  return games.reduce((sum, game) => {
    const preview = buildBowlingGamePreview({ game, members });

    return sum + (preview?.totalStacks ?? 0);
  }, 0);
}

export function getSoloRankStackValue({
  memberCount,
  rank,
  soloStackRules,
}: {
  memberCount: number;
  rank: number;
  soloStackRules: Record<string, string>;
}) {
  const explicitValue = soloStackRules[String(rank)];

  if (explicitValue !== undefined) {
    return explicitValue;
  }

  return rank === memberCount ? "1" : "0";
}

export function parseAmount(value: string) {
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeDecimalInput(value: string) {
  const sanitized = value.replace(/[^\d.]/g, "");
  const [integer = "", ...decimalParts] = sanitized.split(".");

  if (decimalParts.length === 0) {
    return integer;
  }

  return `${integer}.${decimalParts.join("").slice(0, 1)}`;
}

export function normalizeBowlingScoreInput(value: string) {
  const sanitized = value.replace(/[^\d]/g, "");

  if (sanitized === "") {
    return "";
  }

  return String(Math.min(300, Math.max(0, Number(sanitized))));
}

function buildBowlingTeamGamePreview({
  members,
  handicaps,
  resultInputMode,
  scores,
  teamAssignments,
  teamCount,
  teamRanks,
}: {
  members: BowlingParticipant[];
  handicaps: Record<string, string>;
  resultInputMode: BowlingResultInputMode;
  scores: Record<string, string>;
  teamAssignments: Record<string, BowlingTeamId>;
  teamCount: 2 | 3;
  teamRanks: Record<string, string>;
}): BowlingGamePreview | null {
  if (members.length < 2) {
    return null;
  }

  if (resultInputMode === "score" && hasMissingScore({ members, scores })) {
    return null;
  }

  const teamIds: BowlingTeamId[] =
    teamCount === 2 ? ["A", "B"] : ["A", "B", "C"];
  const hasUnassignedMember = members.some(
    (member) =>
      !getAssignedTeam({ memberId: member.id, teamAssignments, teamCount }),
  );

  if (hasUnassignedMember) {
    return null;
  }

  const unrankedTeams = teamIds
    .map((teamId) => {
      const teamMembers = members.filter(
        (member) =>
          getAssignedTeam({
            memberId: member.id,
            teamAssignments,
            teamCount,
          }) === teamId,
      );
      return {
        teamId,
        memberIds: teamMembers.map((member) => member.id),
        scores: teamMembers.map((member) => ({
          memberId: member.id,
          score:
            Math.max(0, Math.round(parseAmount(scores[member.id] ?? "100"))) +
            Math.max(0, Math.round(parseAmount(handicaps[member.id] ?? "0"))),
        })),
      };
    })
    .filter((team) => team.memberIds.length > 0);
  const teams = (() => {
    if (resultInputMode === "rank") {
      return buildManualRankedTeams(
        unrankedTeams.map((team) => ({
          teamId: team.teamId,
          memberIds: team.memberIds,
          normalizedScore: 0,
        })),
        teamRanks,
      );
    }

    const rankingResult = rankTeamsByNormalizedScore({
      teams: unrankedTeams.map((team) => ({
        id: team.teamId,
        memberIds: team.memberIds,
        scores: team.scores,
      })),
    });

    if (rankingResult.status !== "RANKED") {
      return [];
    }

    return rankingResult.teams.map((team) => ({
      teamId: team.id as BowlingTeamId,
      memberIds: team.memberIds,
      normalizedScore: team.normalizedScore,
      rank: team.rank,
    }));
  })();

  const uniqueRanks = new Set(teams.map((team) => team.rank));

  if (
    teams.length < 2 ||
    teams.some((team) => team.rank < 1 || team.rank > teams.length) ||
    uniqueRanks.size !== teams.length
  ) {
    return null;
  }

  const allocations = allocateRankedTeamGameStacks({
    teams: teams.map((team) => ({
      id: team.teamId,
      rank: team.rank as 1 | 2 | 3,
      memberIds: team.memberIds,
    })),
  });
  const totalStacks = allocations.reduce(
    (sum, allocation) => sum + allocation.stacks,
    0,
  );

  return {
    allocations,
    teamSummaries: teams.map((team) => ({
      teamId: team.teamId,
      normalizedScore: Math.round(team.normalizedScore),
      rank: team.rank,
    })),
    totalStacks,
  };
}

function buildBowlingSoloGamePreview({
  handicaps,
  members,
  scores,
  soloStackRules,
}: {
  handicaps: Record<string, string>;
  members: BowlingParticipant[];
  scores: Record<string, string>;
  soloStackRules: Record<string, string>;
}): BowlingGamePreview | null {
  if (members.length < 2) {
    return null;
  }

  if (hasMissingScore({ members, scores })) {
    return null;
  }

  const rankedMembers = members
    .map((member) => {
      const score = Math.max(
        0,
        Math.round(parseAmount(scores[member.id] ?? "100")),
      );
      const handicap = Math.max(
        0,
        Math.round(parseAmount(handicaps[member.id] ?? "0")),
      );

      return {
        memberId: member.id,
        score: score + handicap,
      };
    })
    .sort((left, right) => right.score - left.score)
    .map((member, index) => {
      const rank = index + 1;
      const stacks = Math.max(
        0,
        parseAmount(
          getSoloRankStackValue({
            memberCount: members.length,
            rank,
            soloStackRules,
          }),
        ),
      );

      return {
        ...member,
        rank,
        stacks,
      };
    });
  const allocations = rankedMembers.map((member) => ({
    memberId: member.memberId,
    stacks: member.stacks,
    reason: `${member.rank}등 개인전`,
  }));

  return {
    allocations,
    soloSummaries: rankedMembers,
    teamSummaries: [],
    totalStacks: allocations.reduce(
      (sum, allocation) => sum + allocation.stacks,
      0,
    ),
  };
}

function hasMissingScore({
  members,
  scores,
}: {
  members: BowlingParticipant[];
  scores: Record<string, string>;
}) {
  return members.some((member) => (scores[member.id] ?? "").trim() === "");
}
