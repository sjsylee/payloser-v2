export interface ScreenBaseballSettlementInput {
  payerMemberId: string;
  totalAmount: number;
  loserMemberIds: string[];
}

export interface ScreenBaseballBurden {
  memberId: string;
  amount: number;
  reason: "SCREEN_BASEBALL_LOSER";
}

export interface ScreenBaseballPaymentRequest {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

export interface ScreenBaseballSettlement {
  burdens: ScreenBaseballBurden[];
  recovery: {
    payerMemberId: string;
    totalAmount: number;
    payerOwnBurdenAmount: number;
    payerReceivableAmount: number;
    requests: ScreenBaseballPaymentRequest[];
  };
}

export function calculateScreenBaseballSettlement(
  input: ScreenBaseballSettlementInput
): ScreenBaseballSettlement {
  if (input.loserMemberIds.length === 0) {
    throw new Error("At least one loser is required.");
  }

  const perLoserAmount = input.totalAmount / input.loserMemberIds.length;
  const burdens = input.loserMemberIds.map((memberId) => ({
    memberId,
    amount: perLoserAmount,
    reason: "SCREEN_BASEBALL_LOSER" as const
  }));
  const payerBurden = burdens.find((burden) => burden.memberId === input.payerMemberId)?.amount ?? 0;

  return {
    burdens,
    recovery: {
      payerMemberId: input.payerMemberId,
      totalAmount: input.totalAmount,
      payerOwnBurdenAmount: payerBurden,
      payerReceivableAmount: input.totalAmount - payerBurden,
      requests: burdens
        .filter((burden) => burden.memberId !== input.payerMemberId && burden.amount > 0)
        .map((burden) => ({
          fromMemberId: burden.memberId,
          toMemberId: input.payerMemberId,
          amount: burden.amount
        }))
    }
  };
}

