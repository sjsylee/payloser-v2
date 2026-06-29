import { describe, expect, it } from "vitest";
import {
  buildThreeTeamStackAllocations,
  buildTwoTeamStackAllocations,
  buildManualRankedTeams,
  getLocalDateInputValue,
  swapManualTeamRank,
  toOccurredAtIsoDate,
} from "./bowling-session";

describe("bowling session helpers", () => {
  it("formats the local settlement date for the date input", () => {
    expect(getLocalDateInputValue(new Date("2026-06-24T03:20:00"))).toBe(
      "2026-06-24",
    );
  });

  it("keeps the selected play date with the current save time", () => {
    expect(
      toOccurredAtIsoDate("2026-06-22", new Date(2026, 5, 29, 14, 4)),
    ).toBe(new Date(2026, 5, 22, 14, 4).toISOString());
    expect(toOccurredAtIsoDate("")).toBeUndefined();
  });

  it("builds manual team rankings without using score totals", () => {
    expect(
      buildManualRankedTeams(
        [
          { teamId: "A", memberIds: ["m1", "m2"] },
          { teamId: "B", memberIds: ["m3", "m4"] },
          { teamId: "C", memberIds: ["m5", "m6"] },
        ],
        {
          A: "2",
          B: "3",
          C: "1",
        },
      ).map((team) => ({
        rank: team.rank,
        teamId: team.teamId,
      })),
    ).toEqual([
      { rank: 1, teamId: "C" },
      { rank: 2, teamId: "A" },
      { rank: 3, teamId: "B" },
    ]);
  });

  it("swaps an existing rank when a team is moved", () => {
    expect(
      swapManualTeamRank({
        rank: 1,
        teamId: "C",
        teamOptions: ["A", "B", "C"],
        teamRanks: {
          A: "1",
          B: "2",
          C: "3",
        },
      }),
    ).toEqual({
      A: "3",
      B: "2",
      C: "1",
    });
  });

  it("charges each last-place member one extra stack when a smaller team wins", () => {
    expect(
      buildThreeTeamStackAllocations([
        { memberIds: ["winner-1", "winner-2"], rank: 1 },
        { memberIds: ["second-1", "second-2", "second-3"], rank: 2 },
        { memberIds: ["last-1", "last-2", "last-3"], rank: 3 },
      ]).filter((allocation) => allocation.memberId.startsWith("last-")),
    ).toEqual([
      {
        memberId: "last-1",
        stacks: 2,
        reason: "LAST_PLACE_PLUS_FIRST_PLACE_SHARE",
      },
      {
        memberId: "last-2",
        stacks: 2,
        reason: "LAST_PLACE_PLUS_FIRST_PLACE_SHARE",
      },
      {
        memberId: "last-3",
        stacks: 2,
        reason: "LAST_PLACE_PLUS_FIRST_PLACE_SHARE",
      },
    ]);
  });

  it("charges last place for first place when team sizes match", () => {
    expect(
      buildThreeTeamStackAllocations([
        { memberIds: ["winner-1", "winner-2", "winner-3"], rank: 1 },
        { memberIds: ["second-1", "second-2", "second-3"], rank: 2 },
        { memberIds: ["last-1", "last-2", "last-3"], rank: 3 },
      ]).filter((allocation) => allocation.memberId.startsWith("last-")),
    ).toEqual([
      {
        memberId: "last-1",
        stacks: 2,
        reason: "LAST_PLACE_PLUS_FIRST_PLACE_SHARE",
      },
      {
        memberId: "last-2",
        stacks: 2,
        reason: "LAST_PLACE_PLUS_FIRST_PLACE_SHARE",
      },
      {
        memberId: "last-3",
        stacks: 2,
        reason: "LAST_PLACE_PLUS_FIRST_PLACE_SHARE",
      },
    ]);
  });

  it("still splits a larger winning team across fewer losers", () => {
    expect(
      buildTwoTeamStackAllocations([
        { memberIds: ["winner-1", "winner-2", "winner-3"], rank: 1 },
        { memberIds: ["loser-1", "loser-2"], rank: 2 },
      ]).filter((allocation) => allocation.memberId.startsWith("loser-")),
    ).toEqual([
      {
        memberId: "loser-1",
        stacks: 2.5,
        reason: "LOSING_TEAM_PLUS_WINNER_SHARE",
      },
      {
        memberId: "loser-2",
        stacks: 2.5,
        reason: "LOSING_TEAM_PLUS_WINNER_SHARE",
      },
    ]);
  });

  it("charges the losing team for the winning team when two-team sizes match", () => {
    expect(
      buildTwoTeamStackAllocations([
        { memberIds: ["winner-1", "winner-2", "winner-3"], rank: 1 },
        { memberIds: ["loser-1", "loser-2", "loser-3"], rank: 2 },
      ]).filter((allocation) => allocation.memberId.startsWith("loser-")),
    ).toEqual([
      {
        memberId: "loser-1",
        stacks: 2,
        reason: "LOSING_TEAM_PLUS_WINNER_SHARE",
      },
      {
        memberId: "loser-2",
        stacks: 2,
        reason: "LOSING_TEAM_PLUS_WINNER_SHARE",
      },
      {
        memberId: "loser-3",
        stacks: 2,
        reason: "LOSING_TEAM_PLUS_WINNER_SHARE",
      },
    ]);
  });

  it("charges each loser one extra stack when a smaller two-person team wins", () => {
    expect(
      buildTwoTeamStackAllocations([
        { memberIds: ["winner-1", "winner-2"], rank: 1 },
        { memberIds: ["loser-1", "loser-2", "loser-3"], rank: 2 },
      ]).filter((allocation) => allocation.memberId.startsWith("loser-")),
    ).toEqual([
      {
        memberId: "loser-1",
        stacks: 2,
        reason: "LOSING_TEAM_PLUS_WINNER_SHARE",
      },
      {
        memberId: "loser-2",
        stacks: 2,
        reason: "LOSING_TEAM_PLUS_WINNER_SHARE",
      },
      {
        memberId: "loser-3",
        stacks: 2,
        reason: "LOSING_TEAM_PLUS_WINNER_SHARE",
      },
    ]);
  });
});
