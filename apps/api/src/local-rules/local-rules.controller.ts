import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { SESSION_COOKIE_NAME } from "../auth/auth.constants";
import type { CookieRequest } from "../auth/auth.controller";
import { AuthService } from "../auth/auth.service";
import { CreateLocalRulePresetBodySchema } from "./local-rules.schemas";
import { LocalRulesService } from "./local-rules.service";

@Controller("groups/:groupId/local-rules")
export class LocalRulesController {
  constructor(
    private readonly localRulesService: LocalRulesService,
    private readonly authService: AuthService
  ) {}

  @Post()
  async createPreset(
    @Param("groupId") groupId: string,
    @Body() body: unknown,
    @Req() request: CookieRequest
  ) {
    const input = CreateLocalRulePresetBodySchema.parse(body);
    const session = await this.authService.getSessionUser(request.cookies?.[SESSION_COOKIE_NAME]);

    return this.localRulesService.createPreset({
      requesterUserId: session.user.id,
      groupId,
      input
    });
  }

  @Get()
  async listPresets(@Param("groupId") groupId: string, @Req() request: CookieRequest) {
    const session = await this.authService.getSessionUser(request.cookies?.[SESSION_COOKIE_NAME]);

    return this.localRulesService.listPresets({
      requesterUserId: session.user.id,
      groupId
    });
  }
}
