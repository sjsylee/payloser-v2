export type BowlingAutoTeamId = "A" | "B" | "C";

const teamOrder: BowlingAutoTeamId[] = ["A", "B", "C"];

export function autoCompleteBowlingTeamAssignments({
  memberIds,
  teamAssignments,
  teamCount,
}: {
  memberIds: string[];
  teamAssignments: Record<string, BowlingAutoTeamId>;
  teamCount: 2 | 3;
}): Record<string, BowlingAutoTeamId> {
  const teamOptions: BowlingAutoTeamId[] =
    teamCount === 2 ? ["A", "B"] : ["A", "B", "C"];
  const activeTeamSet = new Set(teamOptions);
  const nextAssignments = Object.fromEntries(
    Object.entries(teamAssignments).filter(
      ([memberId, teamId]) =>
        memberIds.includes(memberId) && activeTeamSet.has(teamId),
    ),
  ) as Record<string, BowlingAutoTeamId>;
  const unassignedMemberIds = memberIds.filter(
    (memberId) => !nextAssignments[memberId],
  );

  if (unassignedMemberIds.length === 0) {
    return nextAssignments;
  }

  const maxMembersPerTeam = Math.ceil(memberIds.length / teamCount);
  const minMembersForDecidedTeam = Math.floor(memberIds.length / teamCount);
  const teamMemberCounts = new Map(
    teamOptions.map((teamId) => [
      teamId,
      memberIds.filter((memberId) => nextAssignments[memberId] === teamId)
        .length,
    ]),
  );
  const emptyTeamIds = teamOptions.filter(
    (teamId) => (teamMemberCounts.get(teamId) ?? 0) === 0,
  );
  const decidedTeamIds = teamOptions.filter(
    (teamId) => (teamMemberCounts.get(teamId) ?? 0) >= minMembersForDecidedTeam,
  );

  if (
    emptyTeamIds.length !== 1 ||
    unassignedMemberIds.length > maxMembersPerTeam
  ) {
    return nextAssignments;
  }

  if (teamCount === 2 && decidedTeamIds.length !== 1) {
    return nextAssignments;
  }

  if (teamCount === 3 && decidedTeamIds.length !== 2) {
    return nextAssignments;
  }

  const remainingTeamId = emptyTeamIds[0];

  if (!remainingTeamId) {
    return nextAssignments;
  }

  return {
    ...nextAssignments,
    ...Object.fromEntries(
      unassignedMemberIds.map((memberId) => [memberId, remainingTeamId]),
    ),
  };
}

export function createRandomBowlingTeamAssignments({
  memberIds,
  previousTeamAssignments,
  random = Math.random,
  teamCount,
}: {
  memberIds: string[];
  previousTeamAssignments: Array<Record<string, BowlingAutoTeamId>>;
  random?: () => number;
  teamCount: 2 | 3;
}): Record<string, BowlingAutoTeamId> {
  const teamIds = teamOrder.slice(0, teamCount);
  const teamSizes = getBalancedTeamSizes(memberIds.length, teamCount);
  const previousPairKeys = new Set(
    previousTeamAssignments.flatMap((assignments) =>
      getSameTeamPairKeys(memberIds, assignments),
    ),
  );
  const candidates = buildTeamAssignmentCandidates({
    memberIds,
    teamIds,
    teamSizes,
  });

  if (candidates.length === 0) {
    return {};
  }

  const scoredCandidates = candidates.map((assignments) => ({
    assignments,
    repeatedPairCount: getSameTeamPairKeys(memberIds, assignments).filter(
      (pairKey) => previousPairKeys.has(pairKey),
    ).length,
  }));
  const lowestRepeatedPairCount = Math.min(
    ...scoredCandidates.map((candidate) => candidate.repeatedPairCount),
  );
  const bestCandidates = scoredCandidates
    .filter(
      (candidate) => candidate.repeatedPairCount === lowestRepeatedPairCount,
    )
    .map((candidate) => candidate.assignments);
  const selectedIndex = Math.min(
    bestCandidates.length - 1,
    Math.floor(random() * bestCandidates.length),
  );

  return bestCandidates[selectedIndex] ?? bestCandidates[0] ?? {};
}

function getBalancedTeamSizes(memberCount: number, teamCount: 2 | 3) {
  const baseSize = Math.floor(memberCount / teamCount);
  const remainder = memberCount % teamCount;

  return Array.from(
    { length: teamCount },
    (_, index) => baseSize + (index < remainder ? 1 : 0),
  );
}

function buildTeamAssignmentCandidates({
  memberIds,
  teamIds,
  teamSizes,
}: {
  memberIds: string[];
  teamIds: BowlingAutoTeamId[];
  teamSizes: number[];
}) {
  const candidates: Array<Record<string, BowlingAutoTeamId>> = [];

  const assignNextMember = (
    memberIndex: number,
    remainingTeamSizes: number[],
    assignments: Record<string, BowlingAutoTeamId>,
  ) => {
    const memberId = memberIds[memberIndex];

    if (!memberId) {
      candidates.push(assignments);
      return;
    }

    for (let teamIndex = 0; teamIndex < teamIds.length; teamIndex += 1) {
      const teamId = teamIds[teamIndex];
      const remainingSize = remainingTeamSizes[teamIndex] ?? 0;

      if (!teamId || remainingSize <= 0) {
        continue;
      }

      const nextRemainingTeamSizes = [...remainingTeamSizes];
      nextRemainingTeamSizes[teamIndex] = remainingSize - 1;
      assignNextMember(memberIndex + 1, nextRemainingTeamSizes, {
        ...assignments,
        [memberId]: teamId,
      });
    }
  };

  assignNextMember(0, teamSizes, {});

  return candidates;
}

function getSameTeamPairKeys(
  memberIds: string[],
  teamAssignments: Record<string, BowlingAutoTeamId>,
) {
  const pairKeys: string[] = [];

  for (let leftIndex = 0; leftIndex < memberIds.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < memberIds.length;
      rightIndex += 1
    ) {
      const leftMemberId = memberIds[leftIndex];
      const rightMemberId = memberIds[rightIndex];

      if (
        !leftMemberId ||
        !rightMemberId ||
        teamAssignments[leftMemberId] !== teamAssignments[rightMemberId]
      ) {
        continue;
      }

      pairKeys.push([leftMemberId, rightMemberId].sort().join(":"));
    }
  }

  return pairKeys;
}
