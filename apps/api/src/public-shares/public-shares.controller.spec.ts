import type { AuthService } from "../auth/auth.service";
import { PublicSharesController } from "./public-shares.controller";
import type { PublicSharesService } from "./public-shares.service";

describe("PublicSharesController", () => {
  it("adds noindex headers to public shared session responses", async () => {
    const service = {
      getPublicSession: jest.fn().mockResolvedValue({
        title: "무제한 볼링",
      }),
    } as unknown as PublicSharesService;
    const controller = new PublicSharesController(
      service,
      {} as unknown as AuthService,
    );
    const response = {
      setHeader: jest.fn(),
    };

    await expect(
      controller.getPublicSession("share-token", response as never),
    ).resolves.toEqual({
      title: "무제한 볼링",
    });
    expect(response.setHeader).toHaveBeenCalledWith(
      "X-Robots-Tag",
      "noindex, nofollow",
    );
  });

  it("rotates a share token for the current session user", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: { id: "owner-user" },
      }),
    } as unknown as AuthService;
    const service = {
      rotateSessionShareToken: jest.fn().mockResolvedValue({
        shareToken: "next-share-token",
      }),
    } as unknown as PublicSharesService;
    const controller = new PublicSharesController(service, authService);

    await expect(
      controller.rotateSessionShareToken("session-1", {
        cookies: { payloser_session: "session-token" },
      }),
    ).resolves.toEqual({
      shareToken: "next-share-token",
    });
    expect(service.rotateSessionShareToken).toHaveBeenCalledWith({
      requesterUserId: "owner-user",
      sessionId: "session-1",
    });
  });

  it("revokes a share token for the current session user", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: { id: "owner-user" },
      }),
    } as unknown as AuthService;
    const service = {
      revokeSessionShareToken: jest.fn().mockResolvedValue({
        ok: true,
      }),
    } as unknown as PublicSharesService;
    const controller = new PublicSharesController(service, authService);

    await expect(
      controller.revokeSessionShareToken("session-1", {
        cookies: { payloser_session: "session-token" },
      }),
    ).resolves.toEqual({
      ok: true,
    });
    expect(service.revokeSessionShareToken).toHaveBeenCalledWith({
      requesterUserId: "owner-user",
      sessionId: "session-1",
    });
  });
});
