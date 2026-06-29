import type { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      KAKAO_REST_API_KEY: "kakao-rest-api-key",
      KAKAO_REDIRECT_URI: "http://localhost:3001/auth/kakao/callback",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("reuses the same development user for the same nickname", async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({
          id: "user-1",
          nickname: "서준",
          profileImageUrl: "https://cdn.example.com/seojun.png",
        }),
      },
    } as unknown as PrismaService;
    const service = new AuthService(prisma);

    await expect(
      service.createDevSession({
        nickname: "서준",
        profileImageUrl: "https://cdn.example.com/seojun.png",
      }),
    ).resolves.toMatchObject({
      user: {
        id: "user-1",
        nickname: "서준",
        profileImageUrl: "https://cdn.example.com/seojun.png",
      },
      sessionToken: expect.any(String),
    });
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: {
        kakaoId: "dev:서준",
      },
      update: {
        nickname: "서준",
        profileImageUrl: "https://cdn.example.com/seojun.png",
      },
      create: {
        nickname: "서준",
        kakaoId: "dev:서준",
        profileImageUrl: "https://cdn.example.com/seojun.png",
      },
      select: {
        id: true,
        nickname: true,
        profileImageUrl: true,
      },
    });
  });

  it("builds the Kakao authorization URL with a CSRF state", () => {
    const prisma = {} as unknown as PrismaService;
    const service = new AuthService(prisma);

    const url = new URL(service.createKakaoAuthorizationUrl("state-1"));

    expect(url.origin + url.pathname).toBe(
      "https://kauth.kakao.com/oauth/authorize",
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("kakao-rest-api-key");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3001/auth/kakao/callback",
    );
    expect(url.searchParams.get("state")).toBe("state-1");
    expect(url.searchParams.get("scope")).toBe(
      "profile_nickname,profile_image",
    );
  });

  it("creates a session from a Kakao authorization code", async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({
          id: "user-1",
          nickname: "김서준",
          profileImageUrl: "https://cdn.example.com/profile.png",
        }),
      },
    } as unknown as PrismaService;
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: "kakao-access-token",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 12345,
          kakao_account: {
            profile: {
              nickname: "김서준",
              profile_image_url: "https://cdn.example.com/profile.png",
            },
          },
        }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;
    const service = new AuthService(prisma);

    await expect(
      service.createKakaoSession("authorize-code"),
    ).resolves.toMatchObject({
      user: {
        id: "user-1",
        nickname: "김서준",
        profileImageUrl: "https://cdn.example.com/profile.png",
      },
      sessionToken: expect.any(String),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://kauth.kakao.com/oauth/token",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://kapi.kakao.com/v2/user/me",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer kakao-access-token",
        },
      }),
    );
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: {
        kakaoId: "12345",
      },
      update: {
        nickname: "김서준",
        profileImageUrl: "https://cdn.example.com/profile.png",
      },
      create: {
        kakaoId: "12345",
        nickname: "김서준",
        profileImageUrl: "https://cdn.example.com/profile.png",
      },
      select: {
        id: true,
        nickname: true,
        profileImageUrl: true,
      },
    });
  });

  it("keeps an existing Kakao profile when the next Kakao response omits profile fields", async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          nickname: "김민수",
          profileImageUrl: "https://cdn.example.com/minsu.png",
        }),
        upsert: jest.fn().mockResolvedValue({
          id: "user-1",
          nickname: "김민수",
          profileImageUrl: "https://cdn.example.com/minsu.png",
        }),
      },
    } as unknown as PrismaService;
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: "kakao-access-token",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 12345,
          kakao_account: {
            profile_nickname_needs_agreement: true,
            profile_image_needs_agreement: true,
          },
        }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;
    const service = new AuthService(prisma);

    await service.createKakaoSession("authorize-code");

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          nickname: "김민수",
          profileImageUrl: "https://cdn.example.com/minsu.png",
        },
      }),
    );
  });
});
