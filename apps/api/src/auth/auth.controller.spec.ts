import { AuthController } from "./auth.controller";
import type { AuthService } from "./auth.service";

describe("AuthController", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      WEB_ORIGIN: "http://localhost:3002",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("creates a development login session cookie", async () => {
    const response = {
      cookie: jest.fn(),
    };
    const service = {
      createDevSession: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준",
        },
        sessionToken: "signed-session",
      }),
    } as unknown as AuthService;
    const controller = new AuthController(service);

    await expect(
      controller.devLogin({ nickname: " 준 " }, response as never),
    ).resolves.toEqual({
      user: {
        id: "user-1",
        nickname: "준",
      },
    });
    expect(service.createDevSession).toHaveBeenCalledWith({ nickname: "준" });
    expect(response.cookie).toHaveBeenCalledWith(
      "payloser_session",
      "signed-session",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
      }),
    );
  });

  it("clears session cookies on logout", async () => {
    const response = {
      clearCookie: jest.fn(),
    };
    const service = {
      revokeSession: jest.fn(),
    } as unknown as AuthService;
    const controller = new AuthController(service);

    await expect(
      controller.logout(
        { cookies: { payloser_session: "session-token" } },
        response as never,
      ),
    ).resolves.toEqual({
      ok: true,
    });
    expect(service.revokeSession).toHaveBeenCalledWith("session-token");
    expect(response.clearCookie).toHaveBeenCalledWith("payloser_session", {
      path: "/",
    });
    expect(response.clearCookie).toHaveBeenCalledWith(
      "payloser_kakao_oauth_state",
      {
        path: "/",
      },
    );
  });

  it("redirects Kakao login start to the authorization URL with a state cookie", () => {
    const response = {
      cookie: jest.fn(),
      redirect: jest.fn(),
    };
    const service = {
      createKakaoAuthorizationUrl: jest
        .fn()
        .mockReturnValue("https://kauth.kakao.com/oauth/authorize?..."),
    } as unknown as AuthService;
    const controller = new AuthController(service);

    controller.startKakaoLogin(response as never);

    expect(response.cookie).toHaveBeenCalledWith(
      "payloser_kakao_oauth_state",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        maxAge: 600000,
        sameSite: "lax",
      }),
    );
    expect(service.createKakaoAuthorizationUrl).toHaveBeenCalledWith(
      expect.any(String),
    );
    expect(response.redirect).toHaveBeenCalledWith(
      "https://kauth.kakao.com/oauth/authorize?...",
    );
  });

  it("sets a session cookie and redirects home after Kakao callback", async () => {
    const response = {
      clearCookie: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
    };
    const service = {
      createKakaoSession: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준",
        },
        sessionToken: "signed-session",
      }),
    } as unknown as AuthService;
    const controller = new AuthController(service);

    await controller.completeKakaoLogin(
      "authorize-code",
      "state-1",
      undefined,
      {
        cookies: {
          payloser_kakao_oauth_state: "state-1",
        },
      },
      response as never,
    );

    expect(response.clearCookie).toHaveBeenCalledWith(
      "payloser_kakao_oauth_state",
      {
        path: "/",
      },
    );
    expect(service.createKakaoSession).toHaveBeenCalledWith("authorize-code");
    expect(response.cookie).toHaveBeenCalledWith(
      "payloser_session",
      "signed-session",
      expect.objectContaining({
        httpOnly: true,
      }),
    );
    expect(response.redirect).toHaveBeenCalledWith("http://localhost:3002");
  });

  it("rejects a Kakao callback when the state cookie does not match", async () => {
    const response = {
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    };
    const service = {
      createKakaoSession: jest.fn(),
    } as unknown as AuthService;
    const controller = new AuthController(service);

    await controller.completeKakaoLogin(
      "authorize-code",
      "state-1",
      undefined,
      {
        cookies: {
          payloser_kakao_oauth_state: "other-state",
        },
      },
      response as never,
    );

    expect(service.createKakaoSession).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(
      "http://localhost:3002?authError=state_mismatch",
    );
  });
});
