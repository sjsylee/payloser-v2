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
      sessionToken: await this.sessionTokens.sign(user.id),
    };
  }

  async getSessionUser(token: string | undefined) {
    if (!token) {
      throw new UnauthorizedException("Missing session.");
    }

    const payload = await this.sessionTokens.verify(token);
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.userId,
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
      sessionToken: await this.sessionTokens.sign(user.id),
    };
  }
}
