import { LocalRulesController } from "./local-rules.controller";
import type { AuthService } from "../auth/auth.service";
import type { LocalRulesService } from "./local-rules.service";

describe("LocalRulesController", () => {
  it("creates a local rule preset for the current session user", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준"
        }
      })
    } as unknown as AuthService;
    const service = {
      createPreset: jest.fn().mockResolvedValue({
        id: "rule-1",
        groupId: "group-1",
        name: "100점 못 넘으면 독박",
        type: "UNDER_SCORE_SOLO",
        threshold: 100
      })
    } as unknown as LocalRulesService;
    const controller = new LocalRulesController(service, authService);

    await expect(
      controller.createPreset(
        "group-1",
        { name: " 100점 못 넘으면 독박 ", type: "UNDER_SCORE_SOLO", threshold: 100 },
        { cookies: { payloser_session: "session-token" } }
      )
    ).resolves.toMatchObject({
      id: "rule-1",
      threshold: 100
    });
    expect(authService.getSessionUser).toHaveBeenCalledWith("session-token");
    expect(service.createPreset).toHaveBeenCalledWith({
      requesterUserId: "user-1",
      groupId: "group-1",
      input: {
        name: "100점 못 넘으면 독박",
        type: "UNDER_SCORE_SOLO",
        threshold: 100
      }
    });
  });

  it("lists local rule presets for the current session user", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준"
        }
      })
    } as unknown as AuthService;
    const service = {
      listPresets: jest.fn().mockResolvedValue([
        {
          id: "rule-1",
          groupId: "group-1",
          name: "팀내 꼴찌 독박",
          type: "TEAM_INTERNAL_LAST_SOLO",
          threshold: null
        }
      ])
    } as unknown as LocalRulesService;
    const controller = new LocalRulesController(service, authService);

    await expect(
      controller.listPresets("group-1", { cookies: { payloser_session: "session-token" } })
    ).resolves.toEqual([
      {
        id: "rule-1",
        groupId: "group-1",
        name: "팀내 꼴찌 독박",
        type: "TEAM_INTERNAL_LAST_SOLO",
        threshold: null
      }
    ]);
    expect(service.listPresets).toHaveBeenCalledWith({
      requesterUserId: "user-1",
      groupId: "group-1"
    });
  });
});
