import { describe, expect, it } from "vitest";
import {
  autoCompleteBowlingTeamAssignments,
  createRandomBowlingTeamAssignments,
} from "./team-assignment";

describe("autoCompleteBowlingTeamAssignments", () => {
  it("assigns the rest to the second team once the first team is decided", () => {
    const memberIds = ["m1", "m2", "m3", "m4"];

    expect(
      autoCompleteBowlingTeamAssignments({
        memberIds,
        teamAssignments: {
          m1: "A",
          m2: "A",
        },
        teamCount: 2,
      }),
    ).toEqual({
      m1: "A",
      m2: "A",
      m3: "B",
      m4: "B",
    });
  });

  it("assigns the rest to the only empty team after two teams are decided", () => {
    const memberIds = ["m1", "m2", "m3", "m4", "m5", "m6"];

    expect(
      autoCompleteBowlingTeamAssignments({
        memberIds,
        teamAssignments: {
          m1: "A",
          m2: "A",
          m3: "B",
          m4: "B",
        },
        teamCount: 3,
      }),
    ).toEqual({
      m1: "A",
      m2: "A",
      m3: "B",
      m4: "B",
      m5: "C",
      m6: "C",
    });
  });

  it("does not overfill the last team", () => {
    const memberIds = ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8"];

    expect(
      autoCompleteBowlingTeamAssignments({
        memberIds,
        teamAssignments: {
          m1: "A",
          m2: "A",
          m3: "B",
          m4: "B",
        },
        teamCount: 3,
      }),
    ).toEqual({
      m1: "A",
      m2: "A",
      m3: "B",
      m4: "B",
    });
  });
});

describe("createRandomBowlingTeamAssignments", () => {
  it("avoids member pairs that already played together in a previous game", () => {
    const memberIds = ["m1", "m2", "m3", "m4"];

    expect(
      createRandomBowlingTeamAssignments({
        memberIds,
        previousTeamAssignments: [
          {
            m1: "A",
            m2: "A",
            m3: "B",
            m4: "B",
          },
        ],
        random: () => 0,
        teamCount: 2,
      }),
    ).toEqual({
      m1: "A",
      m2: "B",
      m3: "A",
      m4: "B",
    });
  });

  it("keeps balanced team sizes for three teams", () => {
    const memberIds = ["m1", "m2", "m3", "m4", "m5", "m6", "m7"];
    const assignments = createRandomBowlingTeamAssignments({
      memberIds,
      previousTeamAssignments: [],
      random: () => 0,
      teamCount: 3,
    });
    const teamSizes = memberIds.reduce<Record<string, number>>(
      (counts, memberId) => ({
        ...counts,
        [assignments[memberId] ?? ""]:
          (counts[assignments[memberId] ?? ""] ?? 0) + 1,
      }),
      {},
    );

    expect(teamSizes).toEqual({
      A: 3,
      B: 2,
      C: 2,
    });
  });
});
