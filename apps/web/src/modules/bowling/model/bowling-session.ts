import { allocateRankedTeamGameStacks } from "@payloser/shared";

export type BowlingTeamId = "A" | "B" | "C";

export type RankedTeamMembers = {
  memberIds: string[];
  rank: number;
};

export type StackAllocation = {
  memberId: string;
  reason: string;
  stacks: number;
};

export const defaultBowlingTeamRanks: Record<BowlingTeamId, string> = {
  A: "1",
  B: "2",
  C: "3",
};

export type ManualRankedTeam<T extends { teamId: BowlingTeamId }> = T & {
  normalizedScore: number;
  rank: number;
};

export function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toOccurredAtIsoDate(dateInput: string, now = new Date()) {
  if (!dateInput) {
    return undefined;
  }

  const [year, month, day] = dateInput.split("-").map(Number);

  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(
    year,
    month - 1,
    day,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  ).toISOString();
}

export function getManualTeamRank({
  teamId,
  teamRanks,
}: {
  teamId: BowlingTeamId;
  teamRanks: Record<string, string>;
}) {
  return Math.max(
    1,
    Math.round(Number(teamRanks[teamId] ?? defaultBowlingTeamRanks[teamId])),
  );
}

export function buildManualRankedTeams<T extends { teamId: BowlingTeamId }>(
  teams: T[],
  teamRanks: Record<string, string>,
): Array<ManualRankedTeam<T>> {
  return teams
    .map((team) => {
      const rank = getManualTeamRank({ teamId: team.teamId, teamRanks });

      return {
        ...team,
        normalizedScore: (teams.length - rank + 1) * 100,
        rank,
      };
    })
    .sort((left, right) => left.rank - right.rank);
}

export function swapManualTeamRank({
  rank,
  teamId,
  teamOptions,
  teamRanks,
}: {
  rank: number;
  teamId: BowlingTeamId;
  teamOptions: BowlingTeamId[];
  teamRanks: Record<string, string>;
}) {
  const nextRank = String(rank);
  const currentRank = teamRanks[teamId] ?? defaultBowlingTeamRanks[teamId];
  const swappedTeam = teamOptions.find(
    (candidate) => candidate !== teamId && teamRanks[candidate] === nextRank,
  );

  return {
    ...teamRanks,
    [teamId]: nextRank,
    ...(swappedTeam ? { [swappedTeam]: currentRank } : {}),
  };
}

export function buildTwoTeamStackAllocations(
  teams: RankedTeamMembers[],
): StackAllocation[] {
  return allocateRankedTeamGameStacks({
    teams: teams.map((team, index) => ({
      id: `team-${index + 1}`,
      memberIds: team.memberIds,
      rank: team.rank as 1 | 2,
    })),
  });
}

export function buildThreeTeamStackAllocations(
  teams: Array<RankedTeamMembers & { rank: 1 | 2 | 3 }>,
): StackAllocation[] {
  return allocateRankedTeamGameStacks({
    teams: teams.map((team, index) => ({
      id: `team-${index + 1}`,
      memberIds: team.memberIds,
      rank: team.rank,
    })),
  });
}
