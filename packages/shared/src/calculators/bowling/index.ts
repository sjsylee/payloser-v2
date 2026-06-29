import type {
  BowlingRoundedBurdenAmount,
  BowlingStackAllocation,
  BowlingTeamInput,
  CustomStackInput,
  RankedBowlingTeam,
  RankedTeamGameStackInput,
  RepresentativePayerRecovery,
  RepresentativePayerRecoveryInput,
  RoundedBurdenAmountInput,
  SoloBurdenRuleInput,
  SoloBurdenRuleResult,
  StackExpenseSettlement,
  StackExpenseSettlementInput,
  TeamRankingInput,
  TeamRankingResult,
  UnlimitedBowlingSessionSettlement,
  UnlimitedBowlingSessionSettlementInput,
} from "./types";

export type * from "./types";

export function normalizeTeamScore(
  scores: number[],
  largestTeamSize: number,
): number {
  if (scores.length === 0) {
    throw new Error("Cannot normalize an empty team.");
  }

  const total = scores.reduce((sum, score) => sum + score, 0);
  return (total / scores.length) * largestTeamSize;
}

export function rankTeamsByNormalizedScore(
  input: TeamRankingInput,
): TeamRankingResult {
  if (input.teams.length < 2 || input.teams.length > 3) {
    throw new Error("Team ranking supports 2 or 3 teams.");
  }

  const largestTeamSize = Math.max(
    ...input.teams.map((team) => team.memberIds.length),
  );
  const scoredTeams = input.teams
    .map((team) => ({
      id: team.id,
      memberIds: team.memberIds,
      normalizedScore: normalizeTeamScore(extractScores(team), largestTeamSize),
    }))
    .sort((left, right) => right.normalizedScore - left.normalizedScore);

  const tiedTeamIds = findTiedTeamIds(scoredTeams);
  if (tiedTeamIds.length > 0) {
    return {
      status: "TIE",
      tiedTeamIds,
      teams: scoredTeams,
    };
  }

  return {
    status: "RANKED",
    teams: scoredTeams.map((team, index) => ({
      ...team,
      rank: (index + 1) as RankedBowlingTeam["rank"],
    })),
  };
}

export function calculateUnlimitedStackUnitPrice(
  totalAmount: number,
  totalStacks: number,
): number {
  if (totalStacks <= 0) {
    throw new Error("Total stacks must be greater than zero.");
  }

  return totalAmount / totalStacks;
}

export function allocateCustomGameStacks(
  input: CustomStackInput,
): BowlingStackAllocation[] {
  return input.allocations.map((allocation) => {
    if (allocation.stacks < 0) {
      throw new Error("Custom stacks cannot be negative.");
    }

    return {
      memberId: allocation.memberId,
      stacks: allocation.stacks,
      reason: "CUSTOM_STACK",
    };
  });
}

export function calculateRoundedBurdenAmounts(
  input: RoundedBurdenAmountInput,
): BowlingRoundedBurdenAmount[] {
  const totalStacks = input.stackAllocations.reduce(
    (sum, allocation) => sum + allocation.stacks,
    0,
  );

  if (totalStacks <= 0) {
    throw new Error("Total stacks must be greater than zero.");
  }

  const stackUnitPrice = input.totalAmount / totalStacks;
  const rounded = input.stackAllocations.map((allocation) => {
    const exactAmount = allocation.stacks * stackUnitPrice;

    return {
      memberId: allocation.memberId,
      exactAmount,
      roundedAmount: roundToUnit(exactAmount, input.roundingUnit),
      reason: allocation.reason,
    };
  });

  return adjustRoundedTotal(rounded, input.totalAmount, input.roundingUnit);
}

export function applySoloBurdenRule(
  input: SoloBurdenRuleInput,
): SoloBurdenRuleResult {
  if (!input.affectedMemberIds.includes(input.targetMemberId)) {
    throw new Error("Solo burden target must be in the affected team.");
  }

  const affectedMemberIds = new Set(input.affectedMemberIds);
  const before = input.stackAllocations.filter((allocation) =>
    affectedMemberIds.has(allocation.memberId),
  );
  const affectedStackTotal = before.reduce(
    (sum, allocation) => sum + allocation.stacks,
    0,
  );

  return {
    before,
    after: input.stackAllocations.map((allocation) => {
      if (!affectedMemberIds.has(allocation.memberId)) {
        return allocation;
      }

      return {
        memberId: allocation.memberId,
        stacks:
          allocation.memberId === input.targetMemberId ? affectedStackTotal : 0,
        reason: input.reason,
      };
    }),
  };
}

export function buildRepresentativePayerRecovery(
  input: RepresentativePayerRecoveryInput,
): RepresentativePayerRecovery {
  const burdenTotal = input.burdens.reduce(
    (sum, burden) => sum + burden.roundedAmount,
    0,
  );

  if (burdenTotal !== input.totalAmount) {
    throw new Error("Rounded burdens must sum to the total amount.");
  }

  const payerBurden = input.burdens.find(
    (burden) => burden.memberId === input.payerMemberId,
  );
  if (!payerBurden) {
    throw new Error("Payer must have a burden amount.");
  }

  return {
    payerMemberId: input.payerMemberId,
    totalAmount: input.totalAmount,
    payerOwnBurdenAmount: payerBurden.roundedAmount,
    payerReceivableAmount: input.totalAmount - payerBurden.roundedAmount,
    requests: input.burdens
      .filter(
        (burden) =>
          burden.memberId !== input.payerMemberId && burden.roundedAmount > 0,
      )
      .map((burden) => ({
        fromMemberId: burden.memberId,
        toMemberId: input.payerMemberId,
        amount: burden.roundedAmount,
      })),
  };
}

export function calculateStackExpenseSettlement(
  input: StackExpenseSettlementInput,
): StackExpenseSettlement {
  const burdens = calculateRoundedBurdenAmounts({
    totalAmount: input.totalAmount,
    roundingUnit: input.roundingUnit,
    stackAllocations: input.stackAllocations,
  });

  return {
    burdens,
    recovery: buildRepresentativePayerRecovery({
      payerMemberId: input.payerMemberId,
      totalAmount: input.totalAmount,
      burdens,
    }),
  };
}

export function calculateUnlimitedBowlingSessionSettlement(
  input: UnlimitedBowlingSessionSettlementInput,
): UnlimitedBowlingSessionSettlement {
  const stackAllocations = aggregateMemberStacks(
    input.games.flatMap((game) => game.stackAllocations),
    "UNLIMITED_SESSION_TOTAL",
  );
  const totalStacks = stackAllocations.reduce(
    (sum, allocation) => sum + allocation.stacks,
    0,
  );

  return {
    totalStacks,
    stackUnitPrice: calculateUnlimitedStackUnitPrice(
      input.totalAmount,
      totalStacks,
    ),
    settlement: calculateStackExpenseSettlement({
      payerMemberId: input.payerMemberId,
      totalAmount: input.totalAmount,
      roundingUnit: input.roundingUnit,
      stackAllocations,
    }),
  };
}

export function allocateRankedTeamGameStacks(
  input: RankedTeamGameStackInput,
): BowlingStackAllocation[] {
  if (input.teams.length === 2) {
    return allocateTwoTeamGameStacks(input.teams);
  }

  if (input.teams.length === 3) {
    return allocateThreeTeamGameStacks(input.teams);
  }

  throw new Error("Normal stack allocation supports 2 or 3 teams.");
}

function allocateTwoTeamGameStacks(
  teams: RankedBowlingTeam[],
): BowlingStackAllocation[] {
  const winner = findTeamByRank(teams, 1);
  const loser = findTeamByRank(teams, 2);
  const winnerShareStackTotal = Math.max(
    winner.memberIds.length,
    loser.memberIds.length,
  );
  const loserStack = 1 + winnerShareStackTotal / loser.memberIds.length;

  return [
    ...winner.memberIds.map((memberId) => ({
      memberId,
      stacks: 0,
      reason: "WINNING_TEAM",
    })),
    ...loser.memberIds.map((memberId) => ({
      memberId,
      stacks: loserStack,
      reason: "LOSING_TEAM_PLUS_WINNER_SHARE",
    })),
  ];
}

function allocateThreeTeamGameStacks(
  teams: RankedBowlingTeam[],
): BowlingStackAllocation[] {
  const firstPlaceTeam = findTeamByRank(teams, 1);
  const secondPlaceTeam = findTeamByRank(teams, 2);
  const lastPlaceTeam = findTeamByRank(teams, 3);

  const firstPlaceSharePerLastMember =
    Math.max(firstPlaceTeam.memberIds.length, lastPlaceTeam.memberIds.length) /
    lastPlaceTeam.memberIds.length;

  return [
    ...firstPlaceTeam.memberIds.map((memberId) => ({
      memberId,
      stacks: 0,
      reason: "FIRST_PLACE",
    })),
    ...secondPlaceTeam.memberIds.map((memberId) => ({
      memberId,
      stacks: 1,
      reason: "SECOND_PLACE",
    })),
    ...lastPlaceTeam.memberIds.map((memberId) => ({
      memberId,
      stacks: 1 + firstPlaceSharePerLastMember,
      reason: "LAST_PLACE_PLUS_FIRST_PLACE_SHARE",
    })),
  ];
}

function findTeamByRank(
  teams: RankedBowlingTeam[],
  rank: RankedBowlingTeam["rank"],
): RankedBowlingTeam {
  const team = teams.find((candidate) => candidate.rank === rank);

  if (!team) {
    throw new Error(`Missing rank ${rank} team.`);
  }

  if (team.memberIds.length === 0) {
    throw new Error(`Rank ${rank} team must have at least one member.`);
  }

  return team;
}

function aggregateMemberStacks(
  allocations: BowlingStackAllocation[],
  reason: string,
): BowlingStackAllocation[] {
  const stackByMember = new Map<string, number>();

  for (const allocation of allocations) {
    stackByMember.set(
      allocation.memberId,
      (stackByMember.get(allocation.memberId) ?? 0) + allocation.stacks,
    );
  }

  return [...stackByMember.entries()].map(([memberId, stacks]) => ({
    memberId,
    stacks,
    reason,
  }));
}

function extractScores(team: BowlingTeamInput): number[] {
  if (team.memberIds.length === 0) {
    throw new Error("Team must have at least one member.");
  }

  if (team.scores.length !== team.memberIds.length) {
    throw new Error("Every team member must have one score.");
  }

  return team.memberIds.map((memberId) => {
    const score = team.scores.find(
      (candidate) => candidate.memberId === memberId,
    );
    if (!score) {
      throw new Error(`Missing score for member ${memberId}.`);
    }

    return score.score;
  });
}

function findTiedTeamIds(
  teams: Array<{ id: string; normalizedScore: number }>,
): string[] {
  const tiedIds = new Set<string>();

  for (let leftIndex = 0; leftIndex < teams.length; leftIndex += 1) {
    const left = teams[leftIndex];
    if (!left) {
      continue;
    }

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < teams.length;
      rightIndex += 1
    ) {
      const right = teams[rightIndex];
      if (right && left.normalizedScore === right.normalizedScore) {
        tiedIds.add(left.id);
        tiedIds.add(right.id);
      }
    }
  }

  return [...tiedIds];
}

function roundToUnit(amount: number, unit: number): number {
  return Math.round(amount / unit) * unit;
}

function adjustRoundedTotal(
  amounts: BowlingRoundedBurdenAmount[],
  expectedTotal: number,
  unit: number,
): BowlingRoundedBurdenAmount[] {
  const currentTotal = amounts.reduce(
    (sum, amount) => sum + amount.roundedAmount,
    0,
  );
  let difference = expectedTotal - currentTotal;

  if (difference === 0) {
    return amounts;
  }

  const direction = difference > 0 ? 1 : -1;
  const steps = Math.round(Math.abs(difference) / unit);
  const adjusted = amounts.map((amount, index) => ({ ...amount, index }));
  const candidates = adjusted.slice().sort((left, right) => {
    const leftGap = left.exactAmount - left.roundedAmount;
    const rightGap = right.exactAmount - right.roundedAmount;
    const gapOrder = direction > 0 ? rightGap - leftGap : leftGap - rightGap;

    if (gapOrder !== 0) {
      return gapOrder;
    }

    return left.index - right.index;
  });

  for (let step = 0; step < steps; step += 1) {
    const candidate = candidates[step % candidates.length];
    if (!candidate) {
      throw new Error("Cannot adjust rounded total without candidates.");
    }

    candidate.roundedAmount += direction * unit;
    difference -= direction * unit;
  }

  return adjusted
    .sort((left, right) => left.index - right.index)
    .map(({ index: _index, ...amount }) => amount);
}
