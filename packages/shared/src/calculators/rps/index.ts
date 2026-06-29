export type RpsHand = "ROCK" | "PAPER" | "SCISSORS";

export interface RpsLossRecord {
  loserMemberId: string;
  loserHand: RpsHand;
  context: string;
  occurredAt: string;
}

export interface RpsLossSummaryInput {
  records: RpsLossRecord[];
}

export interface TopRpsLoserInput extends RpsLossSummaryInput {
  limit: number;
}

export interface TopRpsLoser {
  memberId: string;
  lossCount: number;
}

export interface RpsMemberLossSummary {
  memberId: string;
  lossCount: number;
  handCounts: Record<RpsHand, number>;
  contextCounts: Record<string, number>;
}

export function summarizeRpsLosses(input: RpsLossSummaryInput): RpsMemberLossSummary[] {
  const summaryByMember = new Map<string, RpsMemberLossSummary>();

  for (const record of input.records) {
    const summary =
      summaryByMember.get(record.loserMemberId) ??
      createEmptySummary(record.loserMemberId);

    summary.lossCount += 1;
    summary.handCounts[record.loserHand] += 1;
    summary.contextCounts[record.context] = (summary.contextCounts[record.context] ?? 0) + 1;

    summaryByMember.set(record.loserMemberId, summary);
  }

  return [...summaryByMember.values()].sort((left, right) => {
    if (right.lossCount !== left.lossCount) {
      return right.lossCount - left.lossCount;
    }

    return left.memberId.localeCompare(right.memberId);
  });
}

export function getTopRpsLosers(input: TopRpsLoserInput): TopRpsLoser[] {
  if (input.limit < 1) {
    return [];
  }

  return summarizeRpsLosses({ records: input.records })
    .slice(0, input.limit)
    .map((summary) => ({
      memberId: summary.memberId,
      lossCount: summary.lossCount
    }));
}

function createEmptySummary(memberId: string): RpsMemberLossSummary {
  return {
    memberId,
    lossCount: 0,
    handCounts: {
      ROCK: 0,
      PAPER: 0,
      SCISSORS: 0
    },
    contextCounts: {}
  };
}
