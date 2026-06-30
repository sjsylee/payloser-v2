import { Controller, Delete, Get, Param, Post, Req, Res } from "@nestjs/common";
import { SESSION_COOKIE_NAME } from "../auth/auth.constants";
import type { CookieRequest, CookieResponse } from "../auth/auth.controller";
import { AuthService } from "../auth/auth.service";
import { PublicSharesService } from "./public-shares.service";

type HeaderResponse = CookieResponse & {
  setHeader?(name: string, value: string): void;
};

@Controller("share")
export class PublicSharesController {
  constructor(
    private readonly publicSharesService: PublicSharesService,
    private readonly authService: AuthService,
  ) {}

  @Get("sessions/:token")
  async getPublicSession(
    @Param("token") token: string,
    @Res({ passthrough: true }) response: HeaderResponse,
  ) {
    response.setHeader?.("X-Robots-Tag", "noindex, nofollow");

    return this.publicSharesService.getPublicSession(token);
  }

  @Post("sessions/:sessionId/rotate")
  async rotateSessionShareToken(
    @Param("sessionId") sessionId: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.publicSharesService.rotateSessionShareToken({
      requesterUserId: session.user.id,
      sessionId,
    });
  }

  @Delete("sessions/:sessionId")
  async revokeSessionShareToken(
    @Param("sessionId") sessionId: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.publicSharesService.revokeSessionShareToken({
      requesterUserId: session.user.id,
      sessionId,
    });
  }
}
