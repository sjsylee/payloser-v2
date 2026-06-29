import { ScreenBaseballController } from "./screen-baseball.controller";
import type { AuthService } from "../auth/auth.service";
import type { ScreenBaseballService } from "./screen-baseball.service";

describe("ScreenBaseballController", () => {
  const groupId = "00000000-0000-4000-8000-000000000001";
  const payerMemberId = "00000000-0000-4000-8000-000000000101";
  const loserMemberId = "00000000-0000-4000-8000-000000000102";

  it("creates a screen baseball settlement for the current session user", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준"
        }
      })
    } as unknown as AuthService;
    const service = {
      createSettlement: jest.fn().mockResolvedValue({
        session: {
          id: "session-1",
          activity: "SCREEN_BASEBALL"
        },
        settlement: {
          burdens: [{ memberId: loserMemberId, amount: 12000 }]
        }
      })
    } as unknown as ScreenBaseballService;
    const controller = new ScreenBaseballController(service, authService);

    await expect(
      controller.createSettlement(
        {
          groupId,
          payerMemberId,
          loserMemberIds: [loserMemberId],
          title: " 스크린야구 정산 ",
          totalAmount: 12000
        },
        { cookies: { payloser_session: "session-token" } }
      )
    ).resolves.toMatchObject({
      session: {
        id: "session-1",
        activity: "SCREEN_BASEBALL"
      }
    });
    expect(authService.getSessionUser).toHaveBeenCalledWith("session-token");
    expect(service.createSettlement).toHaveBeenCalledWith({
      requesterUserId: "user-1",
      input: {
        groupId,
        payerMemberId,
        loserMemberIds: [loserMemberId],
        title: "스크린야구 정산",
        totalAmount: 12000
      }
    });
  });
});
