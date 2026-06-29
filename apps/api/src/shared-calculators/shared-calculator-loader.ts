import { Injectable } from "@nestjs/common";

type BowlingBurden = {
  memberId: string;
  exactAmount: number;
  roundedAmount: number;
  reason: string;
};

type RepresentativePayerRecovery = {
  payerMemberId: string;
  totalAmount: number;
  payerOwnBurdenAmount: number;
  payerReceivableAmount: number;
  requests: Array<{
    fromMemberId: string;
    toMemberId: string;
    amount: number;
  }>;
};

export interface BowlingCalculatorModule {
  calculateUnlimitedBowlingSessionSettlement(input: {
    payerMemberId: string;
    totalAmount: number;
    roundingUnit: number;
    games: Array<{
      stackAllocations: Array<{
        memberId: string;
        stacks: number;
        reason: string;
      }>;
    }>;
  }): {
    totalStacks: number;
    stackUnitPrice: number;
    settlement: {
      burdens: BowlingBurden[];
      recovery: RepresentativePayerRecovery;
    };
  };
  buildRepresentativePayerRecovery(input: {
    payerMemberId: string;
    totalAmount: number;
    burdens: BowlingBurden[];
  }): RepresentativePayerRecovery;
}

export interface ScreenBaseballCalculatorModule {
  calculateScreenBaseballSettlement(input: {
    payerMemberId: string;
    totalAmount: number;
    loserMemberIds: string[];
  }): {
    burdens: Array<{
      memberId: string;
      amount: number;
      reason: "SCREEN_BASEBALL_LOSER";
    }>;
    recovery: RepresentativePayerRecovery;
  };
}

type RpsHand = "ROCK" | "PAPER" | "SCISSORS";

export interface RpsCalculatorModule {
  summarizeRpsLosses(input: {
    records: Array<{
      loserMemberId: string;
      loserHand: RpsHand;
      context: string;
      occurredAt: string;
    }>;
  }): Array<{
    memberId: string;
    lossCount: number;
    handCounts: Record<RpsHand, number>;
    contextCounts: Record<string, number>;
  }>;
}

type CalculatorName = "bowling" | "screen-baseball" | "rps";

const importCalculator = new Function(
  "specifier",
  "return import(specifier)",
) as (specifier: string) => Promise<unknown>;

const calculatorPaths: Record<
  CalculatorName,
  {
    source: string;
    dist: string;
  }
> = {
  bowling: {
    source: "../../../../packages/shared/src/calculators/bowling",
    dist: "../../../../packages/shared/dist/calculators/bowling/index.js",
  },
  "screen-baseball": {
    source: "../../../../packages/shared/src/calculators/screen-baseball",
    dist: "../../../../packages/shared/dist/calculators/screen-baseball/index.js",
  },
  rps: {
    source: "../../../../packages/shared/src/calculators/rps",
    dist: "../../../../packages/shared/dist/calculators/rps/index.js",
  },
};

@Injectable()
export class SharedCalculatorLoader {
  async bowling(): Promise<BowlingCalculatorModule> {
    return this.load("bowling") as Promise<BowlingCalculatorModule>;
  }

  async screenBaseball(): Promise<ScreenBaseballCalculatorModule> {
    return this.load(
      "screen-baseball",
    ) as Promise<ScreenBaseballCalculatorModule>;
  }

  async rps(): Promise<RpsCalculatorModule> {
    return this.load("rps") as Promise<RpsCalculatorModule>;
  }

  private async load(name: CalculatorName): Promise<unknown> {
    const paths = calculatorPaths[name];

    if (process.env.JEST_WORKER_ID) {
      return require(paths.source);
    }

    return importCalculator(paths.dist);
  }
}
