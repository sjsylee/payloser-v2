import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { SESSION_COOKIE_NAME } from "../auth/auth.constants";
import type { CookieRequest } from "../auth/auth.controller";
import { AuthService } from "../auth/auth.service";
import {
  AddTemporaryMemberBodySchema,
  ApproveJoinRequestBodySchema,
  CreateGroupBodySchema,
  TransferOwnerBodySchema,
  UpdateGroupBodySchema,
} from "./groups.schemas";
import { GroupsService } from "./groups.service";

@Controller("groups")
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async createGroup(@Body() body: unknown, @Req() request: CookieRequest) {
    const input = CreateGroupBodySchema.parse(body);
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );
    return this.groupsService.createGroup({
      userId: session.user.id,
      input,
    });
  }

  @Get()
  async listGroups(@Req() request: CookieRequest) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );
    return this.groupsService.listGroups(session.user.id);
  }

  @Patch(":groupId")
  async updateGroup(
    @Param("groupId") groupId: string,
    @Body() body: unknown,
    @Req() request: CookieRequest,
  ) {
    const input = UpdateGroupBodySchema.parse(body);
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.updateGroup({
      requesterUserId: session.user.id,
      groupId,
      input,
    });
  }

  @Get(":groupId/summary")
  async summarizeGroup(
    @Param("groupId") groupId: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.summarizeGroup({
      requesterUserId: session.user.id,
      groupId,
    });
  }

  @Get(":groupId/records")
  async listRecentRecords(
    @Param("groupId") groupId: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.listRecentRecords({
      requesterUserId: session.user.id,
      groupId,
    });
  }

  @Post(":groupId/members")
  async addTemporaryMember(
    @Param("groupId") groupId: string,
    @Body() body: unknown,
    @Req() request: CookieRequest,
  ) {
    const input = AddTemporaryMemberBodySchema.parse(body);
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.addTemporaryMember({
      requesterUserId: session.user.id,
      groupId,
      input,
    });
  }

  @Post(":groupId/invitations")
  async createInvitation(
    @Param("groupId") groupId: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.createInvitation({
      requesterUserId: session.user.id,
      groupId,
    });
  }

  @Post(":groupId/invitations/rotate")
  async rotateInvitation(
    @Param("groupId") groupId: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.rotateInvitation({
      requesterUserId: session.user.id,
      groupId,
    });
  }

  @Delete(":groupId/invitations/:invitationId")
  async revokeInvitation(
    @Param("groupId") groupId: string,
    @Param("invitationId") invitationId: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.revokeInvitation({
      requesterUserId: session.user.id,
      groupId,
      invitationId,
    });
  }

  @Get("invitations/:token")
  async getInvitation(
    @Param("token") token: string,
    @Req() request: CookieRequest,
  ) {
    const viewerUserId = await this.getOptionalSessionUserId(request);

    return this.groupsService.getInvitation({
      token,
      viewerUserId,
    });
  }

  @Post("invitations/:token/requests")
  async requestToJoin(
    @Param("token") token: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.requestToJoin({
      token,
      userId: session.user.id,
    });
  }

  @Post(":groupId/leave")
  async leaveGroup(
    @Param("groupId") groupId: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.leaveGroup({
      requesterUserId: session.user.id,
      groupId,
    });
  }

  @Patch(":groupId/owner")
  async transferOwner(
    @Param("groupId") groupId: string,
    @Body() body: unknown,
    @Req() request: CookieRequest,
  ) {
    const input = TransferOwnerBodySchema.parse(body);
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.transferOwner({
      requesterUserId: session.user.id,
      groupId,
      input,
    });
  }

  @Get(":groupId/join-requests")
  async listJoinRequests(
    @Param("groupId") groupId: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.listJoinRequests({
      requesterUserId: session.user.id,
      groupId,
    });
  }

  @Post(":groupId/join-requests/:requestId/approve")
  async approveJoinRequest(
    @Param("groupId") groupId: string,
    @Param("requestId") requestId: string,
    @Body() body: unknown,
    @Req() request: CookieRequest,
  ) {
    const input = ApproveJoinRequestBodySchema.parse(body);
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.approveJoinRequest({
      requesterUserId: session.user.id,
      groupId,
      requestId,
      input,
    });
  }

  @Post(":groupId/join-requests/:requestId/reject")
  async rejectJoinRequest(
    @Param("groupId") groupId: string,
    @Param("requestId") requestId: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.rejectJoinRequest({
      requesterUserId: session.user.id,
      groupId,
      requestId,
    });
  }

  @Delete(":groupId")
  async deleteGroup(
    @Param("groupId") groupId: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.deleteGroup({
      requesterUserId: session.user.id,
      groupId,
    });
  }

  @Post("invitations/:token/requests/cancel")
  async cancelJoinRequest(
    @Param("token") token: string,
    @Req() request: CookieRequest,
  ) {
    const session = await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    return this.groupsService.cancelJoinRequest({
      token,
      userId: session.user.id,
    });
  }

  private async getOptionalSessionUserId(request: CookieRequest) {
    const sessionToken = request.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionToken) {
      return null;
    }

    try {
      const session = await this.authService.getSessionUser(sessionToken);
      return session.user.id;
    } catch {
      return null;
    }
  }
}
