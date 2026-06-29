import { RpsController } from "./rps.controller";
import type { AuthService } from "../auth/auth.service";
import type { RpsService } from "./rps.service";

describe("RpsController", () => {
  it("creates an RPS record for the current session user", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준"
        }
      })
    } as unknown as AuthService;
    const service = {
      createRecord: jest.fn().mockResolvedValue({
        id: "session-1",
        activity: "ROCK_PAPER_SCISSORS",
        rpsRecords: [
          {
            loserMemberId: "00000000-0000-4000-8000-000000000002",
            loserHand: "PAPER",
            context: "음식물 쓰레기"
          }
        ]
      })
    } as unknown as RpsService;
    const controller = new RpsController(service, authService);

    await expect(
      controller.createRecord(
        {
          groupId: "00000000-0000-4000-8000-000000000001",
          loserMemberId: "00000000-0000-4000-8000-000000000002",
          loserHand: "PAPER",
          context: " 음식물 쓰레기 ",
          memo: " 2연패 "
        },
        { cookies: { payloser_session: "session-token" } }
      )
    ).resolves.toMatchObject({
      id: "session-1",
      activity: "ROCK_PAPER_SCISSORS"
    });
    expect(authService.getSessionUser).toHaveBeenCalledWith("session-token");
    expect(service.createRecord).toHaveBeenCalledWith({
      requesterUserId: "user-1",
      input: {
        groupId: "00000000-0000-4000-8000-000000000001",
        loserMemberId: "00000000-0000-4000-8000-000000000002",
        loserHand: "PAPER",
        context: "음식물 쓰레기",
        memo: "2연패"
      }
    });
  });

  it("returns an RPS loss summary for a group member", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준"
        }
      })
    } as unknown as AuthService;
    const service = {
      summarizeGroupLosses: jest.fn().mockResolvedValue([
        {
          memberId: "member-1",
          lossCount: 2,
          handCounts: {
            ROCK: 0,
            PAPER: 2,
            SCISSORS: 0
          },
          contextCounts: {
            "음식물 쓰레기": 2
          }
        }
      ])
    } as unknown as RpsService;
    const controller = new RpsController(service, authService);

    await expect(
      controller.summarizeGroupLosses("group-1", {
        cookies: { payloser_session: "session-token" }
      })
    ).resolves.toEqual([
      {
        memberId: "member-1",
        lossCount: 2,
        handCounts: {
          ROCK: 0,
          PAPER: 2,
          SCISSORS: 0
        },
        contextCounts: {
          "음식물 쓰레기": 2
        }
      }
    ]);
    expect(service.summarizeGroupLosses).toHaveBeenCalledWith({
      requesterUserId: "user-1",
      groupId: "group-1"
    });
  });
});
