import { describe, expect, it } from "vitest";
import { calculateScreenBaseballSettlement } from "./index";

describe("screen baseball calculator", () => {
  it("allocates the whole cost to selected losers and builds payer recovery", () => {
    expect(
      calculateScreenBaseballSettlement({
        payerMemberId: "a",
        totalAmount: 60_000,
        loserMemberIds: ["b", "c"]
      })
    ).toEqual({
      burdens: [
        { memberId: "b", amount: 30_000, reason: "SCREEN_BASEBALL_LOSER" },
        { memberId: "c", amount: 30_000, reason: "SCREEN_BASEBALL_LOSER" }
      ],
      recovery: {
        payerMemberId: "a",
        totalAmount: 60_000,
        payerOwnBurdenAmount: 0,
        payerReceivableAmount: 60_000,
        requests: [
          { fromMemberId: "b", toMemberId: "a", amount: 30_000 },
          { fromMemberId: "c", toMemberId: "a", amount: 30_000 }
        ]
      }
    });
  });
});

