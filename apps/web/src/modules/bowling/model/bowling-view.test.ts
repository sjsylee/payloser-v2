import { describe, expect, it } from "vitest";
import { getTeamDisplayName } from "./bowling-view";

describe("bowling view", () => {
  it("labels bowling teams for the game input UI", () => {
    expect(getTeamDisplayName("A")).toBe("1팀");
    expect(getTeamDisplayName("B")).toBe("2팀");
    expect(getTeamDisplayName("C")).toBe("3팀");
  });
});
