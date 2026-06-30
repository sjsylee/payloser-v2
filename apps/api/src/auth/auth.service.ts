import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { DevLoginBody } from "./auth.schemas";
import { KakaoOAuthProvider } from "./kakao-oauth-provider";
import { SessionTokenIssuer } from "./session-token-issuer";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kakaoOAuthProvider: KakaoOAuthProvider = new KakaoOAuthProvider(),
    private readonly sessionTokens: SessionTokenIssuer = new SessionTokenIssuer(),
  ) {}

  async createDevSession(input: DevLoginBody) {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenException(
        "Development login is disabled in production.",
      );
    }

    const devKakaoId = `dev:${input.nickname}`;
    const user = await this.prisma.user.upsert({
      where: {
        kakaoId: devKakaoId,
      },
      update: {
        nickname: input.nickname,
        profileImageUrl: input.profileImageUrl ?? null,
      },
      create: {
        nickname: input.nickname,
        kakaoId: devKakaoId,
        profileImageUrl: input.profileImageUrl ?? null,
      },
      select: {
        id: true,
        nickname: true,
        profileImageUrl: true,
      },
    });

    return {
      user,
      sessionToken: await this.createSessionToken(user.id),
    };
  }

  async getSessionUser(token: string | undefined) {
    if (!token) {
      throw new UnauthorizedException("Missing session.");
    }

    const payload = await this.sessionTokens.verify(token);
    const session = await this.getActiveSession({
      sessionId: payload.sessionId,
      userId: payload.userId,
    });
    const user = await this.prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        nickname: true,
        profileImageUrl: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Session user not found.");
    }

    return {
      user,
    };
  }

  async revokeSession(token: string | undefined) {
    if (!token) {
      return;
    }

    const payload = await this.sessionTokens.verify(token);

    await this.getUserSessionModel().updateMany({
      where: {
        id: payload.sessionId,
        userId: payload.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  createKakaoAuthorizationUrl(state: string) {
    return this.kakaoOAuthProvider.createAuthorizationUrl(state);
  }

  async createKakaoSession(code: string) {
    if (!code) {
      throw new BadRequestException("Missing Kakao authorization code.");
    }

    const profile = await this.kakaoOAuthProvider.exchangeCodeForProfile(code);
    const existingUser = await this.prisma.user.findUnique({
      where: {
        kakaoId: profile.kakaoId,
      },
      select: {
        nickname: true,
        profileImageUrl: true,
      },
    });
    const nickname = profile.nickname ?? existingUser?.nickname ?? "친구";
    const profileImageUrl =
      profile.profileImageUrl ?? existingUser?.profileImageUrl ?? null;
    const user = await this.prisma.user.upsert({
      where: {
        kakaoId: profile.kakaoId,
      },
      update: {
        nickname,
        profileImageUrl,
      },
      create: {
        kakaoId: profile.kakaoId,
        nickname,
        profileImageUrl,
      },
      select: {
        id: true,
        nickname: true,
        profileImageUrl: true,
      },
    });

    return {
      user,
      sessionToken: await this.createSessionToken(user.id),
    };
  }

  private async createSessionToken(userId: string) {
    const session = await this.getUserSessionModel().create({
      data: {
        userId,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
      select: {
        id: true,
      },
    });

    return this.sessionTokens.sign(userId, session.id);
  }

  private async getActiveSession({
    sessionId,
    userId,
  }: {
    sessionId: string;
    userId: string;
  }) {
    const session = await this.getUserSessionModel().findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        userId: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException("Session has expired or was revoked.");
    }

    return session;
  }

  private getUserSessionModel() {
    return (this.prisma as unknown as { userSession: unknown }).userSession as {
      create(input: {
        data: { userId: string; expiresAt: Date };
        select: { id: true };
      }): Promise<{ id: string }>;
      findFirst(input: {
        where: {
          id: string;
          userId: string;
          revokedAt: null;
          expiresAt: { gt: Date };
        };
        select: { userId: true };
      }): Promise<{ userId: string } | null>;
      updateMany(input: {
        where: { id: string; userId: string; revokedAt: null };
        data: { revokedAt: Date };
      }): Promise<unknown>;
    };
  }
}
