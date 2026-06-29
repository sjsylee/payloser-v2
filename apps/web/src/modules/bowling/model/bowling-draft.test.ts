import { describe, expect, it } from "vitest";
import {
  appendBowlingGameDraft,
  buildBowlingGamePreview,
  buildBowlingSettlementSaveInput,
  buildBowlingStackPreview,
  buildBowlingSessionGames,
  createBowlingGameDraft,
  deleteBowlingGameDraft,
  filterValidBowlingAmountPresets,
  getBowlingSessionTotalStacks,
  getMemberLane,
  normalizeBowlingScoreInput,
  reconcileBowlingParticipantIds,
  rememberBowlingAmountPreset,
  resolveBowlingPayerMemberId,
  selectBowlingParticipants,
  updateBowlingGameDrafts,
} from "./bowling-draft";
import { defaultBowlingTeamRanks } from "./bowling-session";
import type { BowlingGameDraft } from "./bowling-draft";

const members = [
  { id: "m1" },
  { id: "m2" },
  { id: "m3" },
  { id: "m4" },
  { id: "m5" },
  { id: "m6" },
];
const completeScores = {
  m1: "120",
  m2: "120",
  m3: "130",
  m4: "130",
  m5: "100",
  m6: "100",
};

function createTeamGame(
  patch: Partial<Omit<BowlingGameDraft, "id">> = {},
): BowlingGameDraft {
  return {
    id: "game-1",
    handicaps: {},
    laneAssignments: {},
    laneSplitEnabled: false,
    mode: "team",
    resultInputMode: "score",
    sideCosts: { drink: false, shoes: false },
    soloStackRules: {},
    specialRules: { under100: true },
    teamAssignments: {
      m1: "A",
      m2: "A",
      m3: "B",
      m4: "B",
      m5: "C",
      m6: "C",
    },
    teamCount: 3,
    teamRanks: { ...defaultBowlingTeamRanks },
    scores: {},
    ...patch,
  };
}

describe("bowling draft", () => {
  it("creates the first draft game with local defaults", () => {
    expect(createBowlingGameDraft({ id: "game-1" })).toMatchObject({
      id: "game-1",
      laneAssignments: {},
      laneSplitEnabled: false,
      mode: "team",
      resultInputMode: "score",
      sideCosts: { drink: false, shoes: false },
      soloStackRules: {},
      specialRules: { under100: true },
      teamAssignments: {},
      teamCount: 3,
      teamRanks: { A: "1", B: "2", C: "3" },
      scores: {},
    });
  });

  it("appends a blank next game while keeping only mode and team count", () => {
    const previous = createTeamGame({
      mode: "solo",
      teamAssignments: {
        m1: "A",
        m2: "B",
      },
      teamCount: 2,
    });

    expect(
      appendBowlingGameDraft({
        games: [previous],
        handicaps: { m1: "30" },
        nextGameId: "game-2",
        selectedGameId: previous.id,
      }),
    ).toEqual({
      games: [
        previous,
        {
          ...createBowlingGameDraft({
            handicaps: { m1: "30" },
            id: "game-2",
            previousGame: previous,
          }),
          mode: "solo",
          teamCount: 2,
        },
      ],
      selectedGameId: "game-2",
    });
  });

  it("updates and deletes draft games without leaking UI logic into the caller", () => {
    const game1 = { ...createTeamGame(), id: "game-1" };
    const game2 = { ...createTeamGame(), id: "game-2" };
    const updatedGames = updateBowlingGameDrafts({
      gameId: "game-2",
      games: [game1, game2],
      patch: { mode: "solo" },
    });

    expect(updatedGames[1]?.mode).toBe("solo");
    expect(
      deleteBowlingGameDraft({
        gameId: "game-2",
        games: updatedGames,
        selectedGameId: "game-2",
      }),
    ).toEqual({
      games: [game1],
      selectedGameId: "game-1",
    });
  });

  it("builds team previews from scores and handicaps", () => {
    const preview = buildBowlingGamePreview({
      game: createTeamGame({
        handicaps: {
          m5: "30",
        },
        scores: {
          m1: "120",
          m2: "120",
          m3: "130",
          m4: "130",
          m5: "100",
          m6: "100",
        },
      }),
      members,
    });

    expect(preview?.teamSummaries).toEqual([
      { normalizedScore: 260, rank: 1, teamId: "B" },
      { normalizedScore: 240, rank: 2, teamId: "A" },
      { normalizedScore: 230, rank: 3, teamId: "C" },
    ]);
    expect(preview?.allocations).toEqual([
      { memberId: "m3", reason: "FIRST_PLACE", stacks: 0 },
      { memberId: "m4", reason: "FIRST_PLACE", stacks: 0 },
      { memberId: "m1", reason: "SECOND_PLACE", stacks: 1 },
      { memberId: "m2", reason: "SECOND_PLACE", stacks: 1 },
      {
        memberId: "m5",
        reason: "LAST_PLACE_PLUS_FIRST_PLACE_SHARE",
        stacks: 2,
      },
      {
        memberId: "m6",
        reason: "LAST_PLACE_PLUS_FIRST_PLACE_SHARE",
        stacks: 2,
      },
    ]);
  });

  it("builds solo previews from rank-specific stacks", () => {
    const preview = buildBowlingGamePreview({
      game: createTeamGame({
        mode: "solo",
        scores: {
          m1: "90",
          m2: "130",
          m3: "110",
          m4: "80",
          m5: "160",
          m6: "100",
        },
        soloStackRules: {
          "5": "1",
          "6": "3",
        },
      }),
      members,
    });

    expect(preview?.soloSummaries).toEqual([
      { memberId: "m5", rank: 1, score: 160, stacks: 0 },
      { memberId: "m2", rank: 2, score: 130, stacks: 0 },
      { memberId: "m3", rank: 3, score: 110, stacks: 0 },
      { memberId: "m6", rank: 4, score: 100, stacks: 0 },
      { memberId: "m1", rank: 5, score: 90, stacks: 1 },
      { memberId: "m4", rank: 6, score: 80, stacks: 3 },
    ]);
  });

  it("sums only valid game previews for session stack totals", () => {
    expect(
      getBowlingSessionTotalStacks(
        [
          createTeamGame({ scores: completeScores }),
          createTeamGame({
            teamAssignments: {},
          }),
        ],
        members,
      ),
    ).toBe(6);
  });

  it("does not calculate stacks for a score-based game before scores are entered", () => {
    expect(
      buildBowlingGamePreview({
        game: createTeamGame(),
        members,
      }),
    ).toBeNull();
    expect(
      buildBowlingGamePreview({
        game: createTeamGame({
          resultInputMode: "rank",
        }),
        members,
      })?.totalStacks,
    ).toBe(6);
  });

  it("keeps amount presets valid, recent, and bounded", () => {
    expect(
      filterValidBowlingAmountPresets(["20000", "nope", "0", "18000", "-1"]),
    ).toEqual(["20000", "18000"]);
    expect(
      rememberBowlingAmountPreset({
        amountInput: "20,000",
        presets: ["18000", "20000", "22000"],
      }),
    ).toEqual(["20000", "18000", "22000"]);
  });

  it("reconciles selected participants against the current group members", () => {
    expect(
      reconcileBowlingParticipantIds({
        memberIds: ["m1", "m2"],
        previousSelectedIds: ["missing"],
      }),
    ).toEqual(["m1", "m2"]);
    expect(
      reconcileBowlingParticipantIds({
        memberIds: ["m1", "m2", "m3", "m4"],
        previousMemberIds: ["m1", "m2", "m3"],
        previousSelectedIds: ["m1"],
      }),
    ).toEqual(["m1", "m4"]);
    expect(
      reconcileBowlingParticipantIds({
        memberIds: ["m1", "m2", "m3"],
        previousMemberIds: ["m1", "m2", "m3"],
        previousSelectedIds: [],
      }),
    ).toEqual([]);
    expect(
      selectBowlingParticipants({
        members,
        selectedIds: ["m2", "m4"],
      }),
    ).toEqual([{ id: "m2" }, { id: "m4" }]);
    expect(
      selectBowlingParticipants({
        members,
        selectedIds: [],
      }),
    ).toEqual([]);
  });

  it("resolves the bowling payer to a current participant", () => {
    expect(
      resolveBowlingPayerMemberId({
        currentPayerMemberId: "m2",
        members,
      }),
    ).toBe("m2");
    expect(
      resolveBowlingPayerMemberId({
        currentPayerMemberId: "missing",
        members,
      }),
    ).toBe("m1");
    expect(
      resolveBowlingPayerMemberId({
        currentPayerMemberId: "missing",
        members: [],
      }),
    ).toBeNull();
  });

  it("builds stack previews for team input and quick input", () => {
    expect(
      buildBowlingStackPreview({
        games: [createTeamGame()],
        inputMode: "team",
        members,
        perPersonAmountInput: "20,000",
        totalStacksInput: "42",
      }),
    ).toEqual({
      amount: 120000,
      gameCount: 0,
      perGameStacks: 0,
      totalStacks: 0,
      unit: 0,
    });
    expect(
      buildBowlingStackPreview({
        games: [createTeamGame({ scores: completeScores })],
        inputMode: "team",
        members,
        perPersonAmountInput: "20,000",
        totalStacksInput: "42",
      }),
    ).toEqual({
      amount: 120000,
      gameCount: 1,
      perGameStacks: 6,
      totalStacks: 6,
      unit: 20000,
    });
    expect(
      buildBowlingStackPreview({
        games: [],
        inputMode: "quick",
        members,
        perPersonAmountInput: "20,000",
        totalStacksInput: "42",
      }),
    ).toEqual({
      amount: 120000,
      gameCount: 1,
      perGameStacks: 42,
      totalStacks: 42,
      unit: 2857,
    });
  });

  it("builds settlement save input from valid team previews", () => {
    const game = createTeamGame({ scores: completeScores });
    const gamePreview = buildBowlingGamePreview({ game, members });

    expect(
      buildBowlingSettlementSaveInput({
        games: [game],
        inputMode: "team",
        members,
        payerMemberId: "m1",
        totalAmount: 120000,
        totalStacksInput: "42",
      }),
    ).toEqual({
      details: {
        games: [
          {
            scores: [
              { memberId: "m1", score: 120 },
              { memberId: "m2", score: 120 },
              { memberId: "m3", score: 130 },
              { memberId: "m4", score: 130 },
              { memberId: "m5", score: 100 },
              { memberId: "m6", score: 100 },
            ],
            stackAllocations: gamePreview?.allocations,
          },
        ],
        participantMemberIds: ["m1", "m2", "m3", "m4", "m5", "m6"],
      },
      games: buildBowlingSessionGames([gamePreview]),
      payerMemberId: "m1",
      totalAmount: 120000,
      totalStacks: 6,
    });
  });

  it("keeps score-based draft games out of save input until scores are entered", () => {
    const game = createTeamGame();

    expect(
      buildBowlingSettlementSaveInput({
        games: [game],
        inputMode: "team",
        members,
        payerMemberId: "m1",
        totalAmount: 120000,
        totalStacksInput: "42",
      }),
    ).toEqual({
      games: [],
      payerMemberId: "m1",
      totalAmount: 120000,
      totalStacks: 0,
    });
  });

  it("builds quick save input from typed total stacks", () => {
    expect(
      buildBowlingSettlementSaveInput({
        games: [],
        inputMode: "quick",
        members,
        payerMemberId: null,
        totalAmount: 120000,
        totalStacksInput: "42.4",
      }),
    ).toEqual({
      totalAmount: 120000,
      totalStacks: 42,
    });
  });

  it("keeps lane defaults and explicit split lanes behind the draft module", () => {
    expect(
      getMemberLane({
        laneAssignments: {},
        laneSplitEnabled: false,
        memberId: "m1",
        memberIndex: 1,
        teamAssignments: {},
        teamCount: 3,
      }),
    ).toBe("2");
    expect(
      getMemberLane({
        laneAssignments: { m1: "3" },
        laneSplitEnabled: true,
        memberId: "m1",
        memberIndex: 1,
        teamAssignments: {},
        teamCount: 3,
      }),
    ).toBe("3");
  });

  it("normalizes bowling scores to the real scoring range", () => {
    expect(normalizeBowlingScoreInput("301")).toBe("300");
    expect(normalizeBowlingScoreInput("-10")).toBe("10");
    expect(normalizeBowlingScoreInput("")).toBe("");
  });
});
