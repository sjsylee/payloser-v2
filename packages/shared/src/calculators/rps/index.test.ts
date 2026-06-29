import { describe, expect, it } from "vitest";
import { getTopRpsLosers, summarizeRpsLosses } from "./index";

describe("rock-paper-scissors statistics", () => {
  it("summarizes losses and loser-hand distribution by member", () => {
    expect(
      summarizeRpsLosses({
        records: [
          {
            loserMemberId: "a",
            loserHand: "ROCK",
            context: "trash",
            occurredAt: "2026-06-22T10:00:00.000Z"
          },
          {
            loserMemberId: "a",
            loserHand: "SCISSORS",
            context: "trash",
            occurredAt: "2026-06-22T10:05:00.000Z"
          },
          {
            loserMemberId: "b",
            loserHand: "ROCK",
            context: "dish",
            occurredAt: "2026-06-22T10:10:00.000Z"
          }
        ]
      })
    ).toEqual([
      {
        memberId: "a",
        lossCount: 2,
        handCounts: {
          ROCK: 1,
          PAPER: 0,
          SCISSORS: 1
        },
        contextCounts: {
          trash: 2
        }
      },
      {
        memberId: "b",
        lossCount: 1,
        handCounts: {
          ROCK: 1,
          PAPER: 0,
          SCISSORS: 0
        },
        contextCounts: {
          dish: 1
        }
      }
    ]);
  });

  it("returns top losers with deterministic tie ordering", () => {
    expect(
      getTopRpsLosers({
        limit: 2,
        records: [
          {
            loserMemberId: "b",
            loserHand: "PAPER",
            context: "trash",
            occurredAt: "2026-06-22T10:00:00.000Z"
          },
          {
            loserMemberId: "a",
            loserHand: "ROCK",
            context: "trash",
            occurredAt: "2026-06-22T10:05:00.000Z"
          },
          {
            loserMemberId: "c",
            loserHand: "SCISSORS",
            context: "dish",
            occurredAt: "2026-06-22T10:10:00.000Z"
          },
          {
            loserMemberId: "c",
            loserHand: "ROCK",
            context: "coffee",
            occurredAt: "2026-06-22T10:15:00.000Z"
          }
        ]
      })
    ).toEqual([
      { memberId: "c", lossCount: 2 },
      { memberId: "a", lossCount: 1 }
    ]);
  });
});
