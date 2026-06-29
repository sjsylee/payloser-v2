import { BowlingController } from "./bowling.controller";
import type { AuthService } from "../auth/auth.service";
import type { BowlingService } from "./bowling.service";

describe("BowlingController", () => {
  const groupId = "00000000-0000-4000-8000-000000000001";
  const payerMemberId = "00000000-0000-4000-8000-000000000101";
  const secondMemberId = "00000000-0000-4000-8000-000000000102";

  it("creates an unlimited bowling settlement for the current session user", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준",
        },
      }),
    } as unknown as AuthService;
    const service = {
      createUnlimitedSessionSettlement: jest.fn().mockResolvedValue({
        session: {
          id: "session-1",
          activity: "BOWLING",
        },
        settlement: {
          totalStacks: 2,
        },
      }),
    } as unknown as BowlingService;
    const controller = new BowlingController(service, authService);

    await expect(
      controller.createUnlimitedSessionSettlement(
        {
          groupId,
          payerMemberId,
          title: " 무제한 볼링 정산 ",
          totalAmount: 50000,
          roundingUnit: 10,
          games: [
            {
              stackAllocations: [
                { memberId: payerMemberId, stacks: 0, reason: " FIRST_PLACE " },
                {
                  memberId: secondMemberId,
                  stacks: 2,
                  reason: " LOSING_TEAM_BARES_ALL ",
                },
              ],
            },
          ],
        },
        { cookies: { payloser_session: "session-token" } },
      ),
    ).resolves.toMatchObject({
      session: {
        id: "session-1",
        activity: "BOWLING",
      },
    });
    expect(authService.getSessionUser).toHaveBeenCalledWith("session-token");
    expect(service.createUnlimitedSessionSettlement).toHaveBeenCalledWith({
      requesterUserId: "user-1",
      input: {
        groupId,
        payerMemberId,
        title: "무제한 볼링 정산",
        totalAmount: 50000,
        roundingUnit: 10,
        games: [
          {
            stackAllocations: [
              { memberId: payerMemberId, stacks: 0, reason: "FIRST_PLACE" },
              {
                memberId: secondMemberId,
                stacks: 2,
                reason: "LOSING_TEAM_BARES_ALL",
              },
            ],
          },
        ],
      },
    });
  });

  it("returns a stored bowling settlement for the current session user", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준",
        },
      }),
    } as unknown as AuthService;
    const service = {
      getSessionSettlement: jest.fn().mockResolvedValue({
        session: {
          id: "session-1",
          activity: "BOWLING",
        },
        recovery: {
          payerMemberId,
        },
      }),
    } as unknown as BowlingService;
    const controller = new BowlingController(service, authService);

    await expect(
      controller.getSessionSettlement("session-1", {
        cookies: { payloser_session: "session-token" },
      }),
    ).resolves.toMatchObject({
      session: {
        id: "session-1",
        activity: "BOWLING",
      },
    });
    expect(authService.getSessionUser).toHaveBeenCalledWith("session-token");
    expect(service.getSessionSettlement).toHaveBeenCalledWith({
      requesterUserId: "user-1",
      sessionId: "session-1",
    });
  });

  it("deletes a stored bowling settlement for the current session user", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준",
        },
      }),
    } as unknown as AuthService;
    const service = {
      deleteSessionSettlement: jest.fn().mockResolvedValue({ ok: true }),
    } as unknown as BowlingService;
    const controller = new BowlingController(service, authService);

    await expect(
      controller.deleteSessionSettlement("session-1", {
        cookies: { payloser_session: "session-token" },
      }),
    ).resolves.toEqual({ ok: true });
    expect(authService.getSessionUser).toHaveBeenCalledWith("session-token");
    expect(service.deleteSessionSettlement).toHaveBeenCalledWith({
      requesterUserId: "user-1",
      sessionId: "session-1",
    });
  });
});
