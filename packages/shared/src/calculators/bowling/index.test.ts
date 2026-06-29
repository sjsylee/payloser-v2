import { describe, expect, it } from "vitest";
import {
  allocateCustomGameStacks,
  allocateRankedTeamGameStacks,
  applySoloBurdenRule,
  buildRepresentativePayerRecovery,
  calculateUnlimitedBowlingSessionSettlement,
  calculateRoundedBurdenAmounts,
  calculateStackExpenseSettlement,
  calculateUnlimitedStackUnitPrice,
  normalizeTeamScore,
  rankTeamsByNormalizedScore,
} from "./index";

describe("bowling calculator primitives", () => {
  it("normalizes smaller-team scores by average times largest team size", () => {
    expect(normalizeTeamScore([120, 150], 3)).toBe(405);
  });

  it("ranks teams by normalized team score", () => {
    expect(
      rankTeamsByNormalizedScore({
        teams: [
          {
            id: "three-person-team",
            memberIds: ["a", "b", "c"],
            scores: [
              { memberId: "a", score: 100 },
              { memberId: "b", score: 110 },
              { memberId: "c", score: 120 },
            ],
          },
          {
            id: "two-person-team",
            memberIds: ["d", "e"],
            scores: [
              { memberId: "d", score: 150 },
              { memberId: "e", score: 150 },
            ],
          },
        ],
      }),
    ).toEqual({
      status: "RANKED",
      teams: [
        {
          id: "two-person-team",
          memberIds: ["d", "e"],
          normalizedScore: 450,
          rank: 1,
        },
        {
          id: "three-person-team",
          memberIds: ["a", "b", "c"],
          normalizedScore: 330,
          rank: 2,
        },
      ],
    });
  });

  it("detects ties instead of assigning automatic ranks", () => {
    expect(
      rankTeamsByNormalizedScore({
        teams: [
          {
            id: "team-a",
            memberIds: ["a", "b"],
            scores: [
              { memberId: "a", score: 120 },
              { memberId: "b", score: 120 },
            ],
          },
          {
            id: "team-b",
            memberIds: ["c", "d"],
            scores: [
              { memberId: "c", score: 120 },
              { memberId: "d", score: 120 },
            ],
          },
        ],
      }),
    ).toEqual({
      status: "TIE",
      tiedTeamIds: ["team-a", "team-b"],
      teams: [
        {
          id: "team-a",
          memberIds: ["a", "b"],
          normalizedScore: 240,
        },
        {
          id: "team-b",
          memberIds: ["c", "d"],
          normalizedScore: 240,
        },
      ],
    });
  });

  it("derives unlimited stack unit price from total cost and total stacks", () => {
    expect(calculateUnlimitedStackUnitPrice(120_000, 42)).toBeCloseTo(
      2857.142857,
      5,
    );
  });

  it("allocates a normal 3-team 3/3/2 game by rank", () => {
    expect(
      allocateRankedTeamGameStacks({
        teams: [
          { id: "first", rank: 1, memberIds: ["a", "b", "c"] },
          { id: "second", rank: 2, memberIds: ["d", "e", "f"] },
          { id: "last", rank: 3, memberIds: ["g", "h"] },
        ],
      }),
    ).toEqual([
      { memberId: "a", stacks: 0, reason: "FIRST_PLACE" },
      { memberId: "b", stacks: 0, reason: "FIRST_PLACE" },
      { memberId: "c", stacks: 0, reason: "FIRST_PLACE" },
      { memberId: "d", stacks: 1, reason: "SECOND_PLACE" },
      { memberId: "e", stacks: 1, reason: "SECOND_PLACE" },
      { memberId: "f", stacks: 1, reason: "SECOND_PLACE" },
      {
        memberId: "g",
        stacks: 2.5,
        reason: "LAST_PLACE_PLUS_FIRST_PLACE_SHARE",
      },
      {
        memberId: "h",
        stacks: 2.5,
        reason: "LAST_PLACE_PLUS_FIRST_PLACE_SHARE",
      },
    ]);
  });

  it("charges each last-place member one extra stack when a smaller team wins a 3-team game", () => {
    expect(
      allocateRankedTeamGameStacks({
        teams: [
          { id: "first", rank: 1, memberIds: ["a", "b"] },
          { id: "second", rank: 2, memberIds: ["c", "d", "e"] },
          { id: "last", rank: 3, memberIds: ["f", "g", "h"] },
        ],
      }).filter((allocation) => allocation.memberId >= "f"),
    ).toEqual([
      { memberId: "f", stacks: 2, reason: "LAST_PLACE_PLUS_FIRST_PLACE_SHARE" },
      { memberId: "g", stacks: 2, reason: "LAST_PLACE_PLUS_FIRST_PLACE_SHARE" },
      { memberId: "h", stacks: 2, reason: "LAST_PLACE_PLUS_FIRST_PLACE_SHARE" },
    ]);
  });

  it("allocates a normal 2-team game entirely to the losing team", () => {
    expect(
      allocateRankedTeamGameStacks({
        teams: [
          { id: "winner", rank: 1, memberIds: ["a", "b", "c"] },
          { id: "loser", rank: 2, memberIds: ["d", "e", "f"] },
        ],
      }),
    ).toEqual([
      { memberId: "a", stacks: 0, reason: "WINNING_TEAM" },
      { memberId: "b", stacks: 0, reason: "WINNING_TEAM" },
      { memberId: "c", stacks: 0, reason: "WINNING_TEAM" },
      { memberId: "d", stacks: 2, reason: "LOSING_TEAM_PLUS_WINNER_SHARE" },
      { memberId: "e", stacks: 2, reason: "LOSING_TEAM_PLUS_WINNER_SHARE" },
      { memberId: "f", stacks: 2, reason: "LOSING_TEAM_PLUS_WINNER_SHARE" },
    ]);
  });

  it("charges each loser one extra stack when a smaller team wins a 2-team game", () => {
    expect(
      allocateRankedTeamGameStacks({
        teams: [
          { id: "winner", rank: 1, memberIds: ["a", "b"] },
          { id: "loser", rank: 2, memberIds: ["c", "d", "e"] },
        ],
      }).filter((allocation) => allocation.memberId >= "c"),
    ).toEqual([
      { memberId: "c", stacks: 2, reason: "LOSING_TEAM_PLUS_WINNER_SHARE" },
      { memberId: "d", stacks: 2, reason: "LOSING_TEAM_PLUS_WINNER_SHARE" },
      { memberId: "e", stacks: 2, reason: "LOSING_TEAM_PLUS_WINNER_SHARE" },
    ]);
  });

  it("uses custom stack allocation as the game total", () => {
    expect(
      allocateCustomGameStacks({
        allocations: [
          { memberId: "a", stacks: 0 },
          { memberId: "b", stacks: 0 },
          { memberId: "c", stacks: 1 },
          { memberId: "d", stacks: 3 },
          { memberId: "e", stacks: 4 },
        ],
      }),
    ).toEqual([
      { memberId: "a", stacks: 0, reason: "CUSTOM_STACK" },
      { memberId: "b", stacks: 0, reason: "CUSTOM_STACK" },
      { memberId: "c", stacks: 1, reason: "CUSTOM_STACK" },
      { memberId: "d", stacks: 3, reason: "CUSTOM_STACK" },
      { memberId: "e", stacks: 4, reason: "CUSTOM_STACK" },
    ]);
  });

  it("rounds burden amounts and adjusts the difference so the payer recovers the total", () => {
    expect(
      calculateRoundedBurdenAmounts({
        totalAmount: 100,
        roundingUnit: 10,
        stackAllocations: [
          { memberId: "a", stacks: 1, reason: "TEST" },
          { memberId: "b", stacks: 1, reason: "TEST" },
          { memberId: "c", stacks: 1, reason: "TEST" },
        ],
      }),
    ).toEqual([
      {
        memberId: "a",
        exactAmount: 100 / 3,
        roundedAmount: 40,
        reason: "TEST",
      },
      {
        memberId: "b",
        exactAmount: 100 / 3,
        roundedAmount: 30,
        reason: "TEST",
      },
      {
        memberId: "c",
        exactAmount: 100 / 3,
        roundedAmount: 30,
        reason: "TEST",
      },
    ]);
  });

  it("moves an affected team's stacks to one local-rule target member", () => {
    expect(
      applySoloBurdenRule({
        stackAllocations: [
          { memberId: "a", stacks: 0, reason: "FIRST_PLACE" },
          { memberId: "b", stacks: 0, reason: "FIRST_PLACE" },
          { memberId: "c", stacks: 1, reason: "SECOND_PLACE" },
          { memberId: "d", stacks: 1, reason: "SECOND_PLACE" },
          { memberId: "e", stacks: 1, reason: "SECOND_PLACE" },
        ],
        affectedMemberIds: ["c", "d", "e"],
        targetMemberId: "d",
        reason: "UNDER_SCORE_SOLO",
      }),
    ).toEqual({
      before: [
        { memberId: "c", stacks: 1, reason: "SECOND_PLACE" },
        { memberId: "d", stacks: 1, reason: "SECOND_PLACE" },
        { memberId: "e", stacks: 1, reason: "SECOND_PLACE" },
      ],
      after: [
        { memberId: "a", stacks: 0, reason: "FIRST_PLACE" },
        { memberId: "b", stacks: 0, reason: "FIRST_PLACE" },
        { memberId: "c", stacks: 0, reason: "UNDER_SCORE_SOLO" },
        { memberId: "d", stacks: 3, reason: "UNDER_SCORE_SOLO" },
        { memberId: "e", stacks: 0, reason: "UNDER_SCORE_SOLO" },
      ],
    });
  });

  it("builds representative payer recovery without asking the payer to send money to themselves", () => {
    expect(
      buildRepresentativePayerRecovery({
        payerMemberId: "a",
        totalAmount: 120_000,
        burdens: [
          {
            memberId: "a",
            exactAmount: 10_000,
            roundedAmount: 10_000,
            reason: "TEST",
          },
          {
            memberId: "b",
            exactAmount: 35_000,
            roundedAmount: 35_000,
            reason: "TEST",
          },
          {
            memberId: "c",
            exactAmount: 75_000,
            roundedAmount: 75_000,
            reason: "TEST",
          },
        ],
      }),
    ).toEqual({
      payerMemberId: "a",
      totalAmount: 120_000,
      payerOwnBurdenAmount: 10_000,
      payerReceivableAmount: 110_000,
      requests: [
        { fromMemberId: "b", toMemberId: "a", amount: 35_000 },
        { fromMemberId: "c", toMemberId: "a", amount: 75_000 },
      ],
    });
  });

  it("calculates a full stack expense settlement for a representative payer", () => {
    expect(
      calculateStackExpenseSettlement({
        payerMemberId: "a",
        totalAmount: 120_000,
        roundingUnit: 10,
        stackAllocations: [
          { memberId: "a", stacks: 0, reason: "FIRST_PLACE" },
          { memberId: "b", stacks: 1, reason: "SECOND_PLACE" },
          { memberId: "c", stacks: 2, reason: "LAST_PLACE" },
        ],
      }),
    ).toEqual({
      burdens: [
        {
          memberId: "a",
          exactAmount: 0,
          roundedAmount: 0,
          reason: "FIRST_PLACE",
        },
        {
          memberId: "b",
          exactAmount: 40_000,
          roundedAmount: 40_000,
          reason: "SECOND_PLACE",
        },
        {
          memberId: "c",
          exactAmount: 80_000,
          roundedAmount: 80_000,
          reason: "LAST_PLACE",
        },
      ],
      recovery: {
        payerMemberId: "a",
        totalAmount: 120_000,
        payerOwnBurdenAmount: 0,
        payerReceivableAmount: 120_000,
        requests: [
          { fromMemberId: "b", toMemberId: "a", amount: 40_000 },
          { fromMemberId: "c", toMemberId: "a", amount: 80_000 },
        ],
      },
    });
  });

  it("calculates an unlimited bowling session settlement across multiple games", () => {
    expect(
      calculateUnlimitedBowlingSessionSettlement({
        payerMemberId: "a",
        totalAmount: 120_000,
        roundingUnit: 10,
        games: [
          {
            stackAllocations: [
              { memberId: "a", stacks: 0, reason: "FIRST_PLACE" },
              { memberId: "b", stacks: 1, reason: "SECOND_PLACE" },
              { memberId: "c", stacks: 2, reason: "LAST_PLACE" },
            ],
          },
          {
            stackAllocations: [
              { memberId: "a", stacks: 1, reason: "SECOND_PLACE" },
              { memberId: "b", stacks: 0, reason: "FIRST_PLACE" },
              { memberId: "c", stacks: 2, reason: "LAST_PLACE" },
            ],
          },
        ],
      }),
    ).toEqual({
      totalStacks: 6,
      stackUnitPrice: 20_000,
      settlement: {
        burdens: [
          {
            memberId: "a",
            exactAmount: 20_000,
            roundedAmount: 20_000,
            reason: "UNLIMITED_SESSION_TOTAL",
          },
          {
            memberId: "b",
            exactAmount: 20_000,
            roundedAmount: 20_000,
            reason: "UNLIMITED_SESSION_TOTAL",
          },
          {
            memberId: "c",
            exactAmount: 80_000,
            roundedAmount: 80_000,
            reason: "UNLIMITED_SESSION_TOTAL",
          },
        ],
        recovery: {
          payerMemberId: "a",
          totalAmount: 120_000,
          payerOwnBurdenAmount: 20_000,
          payerReceivableAmount: 100_000,
          requests: [
            { fromMemberId: "b", toMemberId: "a", amount: 20_000 },
            { fromMemberId: "c", toMemberId: "a", amount: 80_000 },
          ],
        },
      },
    });
  });
});
