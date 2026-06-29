export type BowlingPricingMode = "UNLIMITED" | "PER_GAME";

export type BowlingRank = 1 | 2 | 3;

export interface BowlingMemberScore {
  memberId: string;
  score: number;
}

export interface BowlingTeamInput {
  id: string;
  memberIds: string[];
  scores: BowlingMemberScore[];
}

export interface RankedScoredBowlingTeam {
  id: string;
  memberIds: string[];
  normalizedScore: number;
  rank: BowlingRank;
}

export type TeamRankingResult =
  | {
      status: "RANKED";
      teams: RankedScoredBowlingTeam[];
    }
  | {
      status: "TIE";
      tiedTeamIds: string[];
      teams: Array<Omit<RankedScoredBowlingTeam, "rank">>;
    };

export interface TeamRankingInput {
  teams: BowlingTeamInput[];
}

export interface BowlingStackAllocation {
  memberId: string;
  stacks: number;
  reason: string;
}

export interface BowlingRoundedBurdenAmount {
  memberId: string;
  exactAmount: number;
  roundedAmount: number;
  reason: string;
}

export interface PaymentRequest {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

export interface RepresentativePayerRecoveryInput {
  payerMemberId: string;
  totalAmount: number;
  burdens: BowlingRoundedBurdenAmount[];
}

export interface RepresentativePayerRecovery {
  payerMemberId: string;
  totalAmount: number;
  payerOwnBurdenAmount: number;
  payerReceivableAmount: number;
  requests: PaymentRequest[];
}

export interface StackExpenseSettlementInput {
  payerMemberId: string;
  totalAmount: number;
  roundingUnit: 1 | 10 | 100;
  stackAllocations: BowlingStackAllocation[];
}

export interface StackExpenseSettlement {
  burdens: BowlingRoundedBurdenAmount[];
  recovery: RepresentativePayerRecovery;
}

export interface UnlimitedBowlingGameSettlementInput {
  stackAllocations: BowlingStackAllocation[];
}

export interface UnlimitedBowlingSessionSettlementInput {
  payerMemberId: string;
  totalAmount: number;
  roundingUnit: 1 | 10 | 100;
  games: UnlimitedBowlingGameSettlementInput[];
}

export interface UnlimitedBowlingSessionSettlement {
  totalStacks: number;
  stackUnitPrice: number;
  settlement: StackExpenseSettlement;
}

export interface RoundedBurdenAmountInput {
  totalAmount: number;
  roundingUnit: 1 | 10 | 100;
  stackAllocations: BowlingStackAllocation[];
}

export interface SoloBurdenRuleInput {
  stackAllocations: BowlingStackAllocation[];
  affectedMemberIds: string[];
  targetMemberId: string;
  reason: string;
}

export interface SoloBurdenRuleResult {
  before: BowlingStackAllocation[];
  after: BowlingStackAllocation[];
}

export interface RankedBowlingTeam {
  id: string;
  rank: BowlingRank;
  memberIds: string[];
}

export interface RankedTeamGameStackInput {
  teams: RankedBowlingTeam[];
}

export interface CustomStackInput {
  allocations: Array<{
    memberId: string;
    stacks: number;
  }>;
}

export interface BowlingLocalRuleApplication {
  presetId: string;
  targetMemberId: string;
  affectedTeamId: string;
  rationale: string;
  before: BowlingStackAllocation[];
  after: BowlingStackAllocation[];
}
