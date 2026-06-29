import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import { SESSION_COOKIE_NAME } from "../auth/auth.constants";
import type { CookieRequest } from "../auth/auth.controller";
import { AuthService } from "../auth/auth.service";
import { BowlingService } from "./bowling.service";
import { CreateUnlimitedBowlingSettlementBodySchema } from "./bowling.schemas";

@Controller("bowling")
export class BowlingController {
  constructor(
    private readonly bowlingService: BowlingService,
    private readonly authService: AuthService,
  ) {}

  @Post("sessions/unlimited-settlements")
  async createUnlimitedSessionSettlement(
    @Body() body: unknown,
    @Req() request: CookieRequest,
  ) {
    const input = CreateUnlimitedBowlingSettlementBodySchema.parse(body);
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.bowlingService.createUnlimitedSessionSettlement({
      requesterUserId: session.user.id,
      input,
    });
  }

  @Get("sessions/:sessionId/settlement")
  async getSessionSettlement(
    @Param("sessionId") sessionId: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.bowlingService.getSessionSettlement({
      requesterUserId: session.user.id,
      sessionId,
    });
  }

  @Delete("sessions/:sessionId")
  async deleteSessionSettlement(
    @Param("sessionId") sessionId: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.bowlingService.deleteSessionSettlement({
      requesterUserId: session.user.id,
      sessionId,
    });
  }
}
