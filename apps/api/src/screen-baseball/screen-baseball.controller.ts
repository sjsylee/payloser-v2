import { Body, Controller, Post, Req } from "@nestjs/common";
import { SESSION_COOKIE_NAME } from "../auth/auth.constants";
import type { CookieRequest } from "../auth/auth.controller";
import { AuthService } from "../auth/auth.service";
import { CreateScreenBaseballSettlementBodySchema } from "./screen-baseball.schemas";
import { ScreenBaseballService } from "./screen-baseball.service";

@Controller("screen-baseball")
export class ScreenBaseballController {
  constructor(
    private readonly screenBaseballService: ScreenBaseballService,
    private readonly authService: AuthService
  ) {}

  @Post("settlements")
  async createSettlement(@Body() body: unknown, @Req() request: CookieRequest) {
    const input = CreateScreenBaseballSettlementBodySchema.parse(body);
    const session = await this.authService.getSessionUser(request.cookies?.[SESSION_COOKIE_NAME]);

    return this.screenBaseballService.createSettlement({
      requesterUserId: session.user.id,
      input
    });
  }
}
