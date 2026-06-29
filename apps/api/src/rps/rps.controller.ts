import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { SESSION_COOKIE_NAME } from "../auth/auth.constants";
import type { CookieRequest } from "../auth/auth.controller";
import { AuthService } from "../auth/auth.service";
import { CreateRpsRecordBodySchema } from "./rps.schemas";
import { RpsService } from "./rps.service";

@Controller("rps")
export class RpsController {
  constructor(
    private readonly rpsService: RpsService,
    private readonly authService: AuthService
  ) {}

  @Post("records")
  async createRecord(@Body() body: unknown, @Req() request: CookieRequest) {
    const input = CreateRpsRecordBodySchema.parse(body);
    const session = await this.authService.getSessionUser(request.cookies?.[SESSION_COOKIE_NAME]);

    return this.rpsService.createRecord({
      requesterUserId: session.user.id,
      input
    });
  }

  @Get("groups/:groupId/summary")
  async summarizeGroupLosses(@Param("groupId") groupId: string, @Req() request: CookieRequest) {
    const session = await this.authService.getSessionUser(request.cookies?.[SESSION_COOKIE_NAME]);

    return this.rpsService.summarizeGroupLosses({
      requesterUserId: session.user.id,
      groupId
    });
  }
}
