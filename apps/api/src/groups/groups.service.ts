import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { toPrismaNumber } from "../common/prisma-number";
import { PrismaService } from "../prisma/prisma.service";
import { GroupMembershipPolicy } from "./group-membership-policy";
import type {
  AddTemporaryMemberInput,
  ApproveJoinRequestInput,
  CancelJoinRequestInput,
  CreateGroupForUserInput,
  CreateInvitationInput,
  GetInvitationInput,
  GroupBurdenSummaryRow,
  GroupRecentRecord,
  ListJoinRequestsInput,
  RemoveGroupMemberInput,
  RevokeInvitationInput,
  RequestToJoinInput,
  ResolveJoinRequestInput,
  RotateInvitationInput,
  SummarizeGroupInput,
  TransferOwnerInput,
  UpdateGroupInput,
} from "./groups.types";

const INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipPolicy: GroupMembershipPolicy = new GroupMembershipPolicy(
      prisma,
    ),
  ) {}

  async createGroup({ userId, input }: CreateGroupForUserInput) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        profileImageUrl: true,
      },
    });

    return this.prisma.group.create({
      data: {
        name: input.name,
        imageUrl: input.imageUrl ?? null,
        ...(input.coverImageUrl ? { coverImageUrl: input.coverImageUrl } : {}),
        themeColor: input.themeColor ?? "#FEE500",
        members: {
          create: {
            userId,
            displayName: input.ownerDisplayName,
            profileImageUrl: user?.profileImageUrl ?? null,
            role: "OWNER",
          },
        },
      },
      include: {
        members: true,
      },
    });
  }

  async listGroups(userId: string) {
    return this.prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        members: true,
      },
    });
  }

  async updateGroup({ requesterUserId, groupId, input }: UpdateGroupInput) {
    await this.membershipPolicy.assertOwner({
      groupId,
      userId: requesterUserId,
    });
    const data: {
      coverImageUrl?: string | null;
      name: string;
      imageUrl?: string | null;
      themeColor?: string;
    } = {
      name: input.name,
    };

    if ("imageUrl" in input) {
      data.imageUrl = input.imageUrl ?? null;
    }

    if ("coverImageUrl" in input) {
      data.coverImageUrl = input.coverImageUrl ?? null;
    }

    if (input.themeColor) {
      data.themeColor = input.themeColor;
    }

    return this.prisma.group.update({
      where: {
        id: groupId,
      },
      data,
      include: {
        members: true,
      },
    });
  }

  async leaveGroup({
    requesterUserId,
    groupId,
  }: {
    requesterUserId: string;
    groupId: string;
  }) {
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: requesterUserId,
        isActive: true,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException("You are not a member of this group.");
    }

    if (membership.role === "OWNER") {
      throw new BadRequestException("Transfer ownership before leaving.");
    }

    await this.prisma.groupMember.update({
      where: {
        id: membership.id,
      },
      data: {
        isActive: false,
      },
    });

    return { ok: true };
  }

  async transferOwner({ requesterUserId, groupId, input }: TransferOwnerInput) {
    const currentOwner = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: requesterUserId,
        role: "OWNER",
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!currentOwner) {
      throw new ForbiddenException(
        "Only the group owner can transfer ownership.",
      );
    }

    const nextOwner = await this.prisma.groupMember.findFirst({
      where: {
        id: input.memberId,
        groupId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!nextOwner) {
      throw new NotFoundException("New owner member not found.");
    }

    if (nextOwner.id === currentOwner.id) {
      throw new BadRequestException("This member is already the owner.");
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.groupMember.update({
        where: {
          id: currentOwner.id,
        },
        data: {
          role: "MEMBER",
        },
      });
      await prisma.groupMember.update({
        where: {
          id: nextOwner.id,
        },
        data: {
          role: "OWNER",
        },
      });

      return prisma.group.findUniqueOrThrow({
        where: {
          id: groupId,
        },
        include: {
          members: true,
        },
      });
    });
  }

  async deleteGroup({
    requesterUserId,
    groupId,
  }: {
    requesterUserId: string;
    groupId: string;
  }) {
    await this.membershipPolicy.assertOwner({
      groupId,
      userId: requesterUserId,
    });

    const [activeMemberCount, sessionCount] = await Promise.all([
      this.prisma.groupMember.count({
        where: {
          groupId,
          isActive: true,
        },
      }),
      this.prisma.session.count({
        where: {
          groupId,
        },
      }),
    ]);

    if (activeMemberCount > 1) {
      throw new BadRequestException(
        "Transfer ownership before deleting this group.",
      );
    }

    if (sessionCount > 0) {
      throw new BadRequestException(
        "Groups with settlement records cannot be deleted.",
      );
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.groupInvitation.deleteMany({
        where: {
          groupId,
        },
      });
      await prisma.groupJoinRequest.deleteMany({
        where: {
          groupId,
        },
      });
      await prisma.groupMember.deleteMany({
        where: {
          groupId,
        },
      });
      await prisma.group.delete({
        where: {
          id: groupId,
        },
      });
    });

    return { ok: true };
  }

  async summarizeGroup({ requesterUserId, groupId }: SummarizeGroupInput) {
    await this.membershipPolicy.assertMember({
      groupId,
      userId: requesterUserId,
    });

    const members = await this.prisma.groupMember.findMany({
      where: {
        groupId,
        isActive: true,
      },
      select: {
        id: true,
        displayName: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const rows = new Map<string, GroupBurdenSummaryRow>(
      members.map((member) => [
        member.id,
        {
          memberId: member.id,
          displayName: member.displayName,
          bowlingAmount: 0,
          screenBaseballAmount: 0,
          totalAmount: 0,
          rpsLosses: 0,
        },
      ]),
    );

    const expenseSessions = await this.prisma.session.findMany({
      where: {
        groupId,
        activity: {
          in: ["BOWLING", "SCREEN_BASEBALL"],
        },
      },
      select: {
        activity: true,
        expenseItems: {
          select: {
            allocations: {
              select: {
                memberId: true,
                rankingAmount: true,
              },
            },
          },
        },
      },
    });

    for (const session of expenseSessions) {
      for (const item of session.expenseItems) {
        for (const allocation of item.allocations) {
          const row = rows.get(allocation.memberId);

          if (!row) {
            continue;
          }

          const amount = toPrismaNumber(allocation.rankingAmount);
          if (session.activity === "BOWLING") {
            row.bowlingAmount += amount;
          }

          if (session.activity === "SCREEN_BASEBALL") {
            row.screenBaseballAmount += amount;
          }
        }
      }
    }

    const rpsRecords = await this.prisma.rpsRecord.findMany({
      where: {
        session: {
          groupId,
          activity: "ROCK_PAPER_SCISSORS",
        },
      },
      select: {
        loserMemberId: true,
      },
    });

    for (const record of rpsRecords) {
      const row = rows.get(record.loserMemberId);

      if (row) {
        row.rpsLosses += 1;
      }
    }

    return [...rows.values()].map((row) => ({
      ...row,
      totalAmount: row.bowlingAmount + row.screenBaseballAmount,
    }));
  }

  async listRecentRecords({
    requesterUserId,
    groupId,
  }: SummarizeGroupInput): Promise<GroupRecentRecord[]> {
    await this.membershipPolicy.assertMember({
      groupId,
      userId: requesterUserId,
    });

    const sessions = await this.prisma.session.findMany({
      where: {
        groupId,
      },
      orderBy: {
        occurredAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        activity: true,
        title: true,
        occurredAt: true,
        expenseItems: {
          select: {
            totalAmount: true,
          },
        },
        rpsRecords: {
          select: {
            id: true,
          },
        },
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      activity: session.activity,
      title: session.title,
      occurredAt: session.occurredAt.toISOString(),
      totalAmount: session.expenseItems.reduce(
        (sum, item) => sum + toPrismaNumber(item.totalAmount),
        0,
      ),
      rpsLossCount: session.rpsRecords.length,
    }));
  }

  async addTemporaryMember({
    requesterUserId,
    groupId,
    input,
  }: AddTemporaryMemberInput) {
    await this.membershipPolicy.assertOwner({
      groupId,
      userId: requesterUserId,
    });

    return this.prisma.groupMember.create({
      data: {
        groupId,
        userId: null,
        displayName: input.displayName,
        profileImageUrl: input.profileImageUrl ?? null,
        role: "MEMBER",
      },
    });
  }

  async removeMember({
    requesterUserId,
    groupId,
    memberId,
  }: RemoveGroupMemberInput) {
    await this.membershipPolicy.assertOwner({
      groupId,
      userId: requesterUserId,
    });

    const member = await this.prisma.groupMember.findFirst({
      where: {
        id: memberId,
        groupId,
        isActive: true,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!member) {
      throw new NotFoundException("Group member not found.");
    }

    if (member.role === "OWNER") {
      throw new BadRequestException(
        "Transfer ownership before removing owner.",
      );
    }

    await this.prisma.groupMember.update({
      where: {
        id: member.id,
      },
      data: {
        isActive: false,
      },
    });

    return this.prisma.group.findUniqueOrThrow({
      where: {
        id: groupId,
      },
      include: {
        members: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  async createInvitation({ requesterUserId, groupId }: CreateInvitationInput) {
    await this.membershipPolicy.assertMember({
      groupId,
      userId: requesterUserId,
    });

    return this.prisma.groupInvitation.create({
      data: {
        groupId,
        createdByUserId: requesterUserId,
        token: randomUUID(),
        expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      },
    });
  }

  async rotateInvitation({ requesterUserId, groupId }: RotateInvitationInput) {
    await this.membershipPolicy.assertOwner({
      groupId,
      userId: requesterUserId,
    });

    return this.prisma.$transaction(async (prisma) => {
      await prisma.groupInvitation.updateMany({
        where: {
          groupId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return prisma.groupInvitation.create({
        data: {
          groupId,
          createdByUserId: requesterUserId,
          token: randomUUID(),
          expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
        },
      });
    });
  }

  async revokeInvitation({
    requesterUserId,
    groupId,
    invitationId,
  }: RevokeInvitationInput) {
    await this.membershipPolicy.assertOwner({
      groupId,
      userId: requesterUserId,
    });

    const result = await this.prisma.groupInvitation.updateMany({
      where: {
        id: invitationId,
        groupId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException("Invitation not found.");
    }

    return { ok: true };
  }

  async getInvitation({ token, viewerUserId }: GetInvitationInput) {
    const invitation = await this.prisma.groupInvitation.findUnique({
      where: {
        token,
      },
      select: {
        token: true,
        expiresAt: true,
        revokedAt: true,
        group: {
          select: {
            coverImageUrl: true,
            id: true,
            imageUrl: true,
            name: true,
            themeColor: true,
            members: {
              where: {
                isActive: true,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException("Invitation not found.");
    }

    if (invitation.revokedAt) {
      throw new BadRequestException("Invitation has been revoked.");
    }

    if (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("Invitation has expired.");
    }

    const viewer = viewerUserId
      ? await this.getInvitationViewerState({
          groupId: invitation.group.id,
          userId: viewerUserId,
        })
      : null;

    return {
      token: invitation.token,
      group: {
        id: invitation.group.id,
        coverImageUrl: invitation.group.coverImageUrl,
        imageUrl: invitation.group.imageUrl,
        name: invitation.group.name,
        themeColor: invitation.group.themeColor,
        memberCount: invitation.group.members.length,
      },
      viewer,
    };
  }

  async requestToJoin({ token, userId }: RequestToJoinInput) {
    const invitation = await this.prisma.groupInvitation.findUnique({
      where: {
        token,
      },
      select: {
        groupId: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException("Invitation not found.");
    }

    if (invitation.revokedAt) {
      throw new BadRequestException("Invitation has been revoked.");
    }

    if (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("Invitation has expired.");
    }

    const existingMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId: invitation.groupId,
        userId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (existingMember) {
      return {
        groupId: invitation.groupId,
        status: "ALREADY_MEMBER" as const,
        request: null,
      };
    }

    const pendingRequest = await this.prisma.groupJoinRequest.findFirst({
      where: {
        groupId: invitation.groupId,
        userId,
        status: "PENDING",
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    if (pendingRequest) {
      return {
        groupId: invitation.groupId,
        status: "PENDING" as const,
        request: pendingRequest,
      };
    }

    const request = await this.prisma.groupJoinRequest.create({
      data: {
        groupId: invitation.groupId,
        userId,
      },
    });

    return {
      groupId: invitation.groupId,
      status: "PENDING" as const,
      request,
    };
  }

  async listJoinRequests({ requesterUserId, groupId }: ListJoinRequestsInput) {
    await this.membershipPolicy.assertOwner({
      groupId,
      userId: requesterUserId,
    });

    return this.prisma.groupJoinRequest.findMany({
      where: {
        groupId,
        status: "PENDING",
      },
      orderBy: {
        requestedAt: "asc",
      },
      select: {
        id: true,
        status: true,
        requestedAt: true,
        user: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true,
          },
        },
      },
    });
  }

  async approveJoinRequest({
    requesterUserId,
    groupId,
    requestId,
    input,
  }: ApproveJoinRequestInput) {
    await this.membershipPolicy.assertOwner({
      groupId,
      userId: requesterUserId,
    });

    const request = await this.getPendingJoinRequest({
      groupId,
      requestId,
    });
    const alreadyMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: request.userId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (alreadyMember) {
      throw new BadRequestException("User is already a group member.");
    }

    if (input.mode === "LINK_EXISTING") {
      return this.approveJoinRequestWithExistingMember({
        requesterUserId,
        groupId,
        request,
        memberId: input.memberId,
      });
    }

    return this.approveJoinRequestWithNewMember({
      requesterUserId,
      groupId,
      request,
      displayName: input.displayName,
    });
  }

  async rejectJoinRequest({
    requesterUserId,
    groupId,
    requestId,
  }: ResolveJoinRequestInput) {
    await this.membershipPolicy.assertOwner({
      groupId,
      userId: requesterUserId,
    });
    await this.getPendingJoinRequest({
      groupId,
      requestId,
    });

    await this.prisma.groupJoinRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: "REJECTED",
        resolvedAt: new Date(),
        resolvedByUserId: requesterUserId,
      },
    });

    return { ok: true };
  }

  async cancelJoinRequest({ token, userId }: CancelJoinRequestInput) {
    const invitation = await this.prisma.groupInvitation.findUnique({
      where: {
        token,
      },
      select: {
        groupId: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException("Invitation not found.");
    }

    const pendingRequest = await this.prisma.groupJoinRequest.findFirst({
      where: {
        groupId: invitation.groupId,
        userId,
        status: "PENDING",
      },
      orderBy: {
        requestedAt: "desc",
      },
      select: {
        id: true,
      },
    });

    if (!pendingRequest) {
      return { ok: true };
    }

    await this.prisma.groupJoinRequest.update({
      where: {
        id: pendingRequest.id,
      },
      data: {
        status: "CANCELED",
        resolvedAt: new Date(),
      },
    });

    return { ok: true };
  }

  private async getInvitationViewerState({
    groupId,
    userId,
  }: {
    groupId: string;
    userId: string;
  }) {
    const member = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        isActive: true,
      },
      select: {
        id: true,
        displayName: true,
        role: true,
      },
    });

    if (member) {
      return {
        membership: "MEMBER" as const,
        member,
        joinRequest: null,
      };
    }

    const joinRequest = await this.prisma.groupJoinRequest.findFirst({
      where: {
        groupId,
        userId,
      },
      orderBy: {
        requestedAt: "desc",
      },
      select: {
        id: true,
        status: true,
        requestedAt: true,
      },
    });

    return {
      membership: "NONE" as const,
      member: null,
      joinRequest,
    };
  }

  private async getPendingJoinRequest({
    groupId,
    requestId,
  }: {
    groupId: string;
    requestId: string;
  }) {
    const request = await this.prisma.groupJoinRequest.findFirst({
      where: {
        id: requestId,
        groupId,
        status: "PENDING",
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            nickname: true,
            profileImageUrl: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException("Join request not found.");
    }

    return request;
  }

  private async approveJoinRequestWithExistingMember({
    requesterUserId,
    groupId,
    request,
    memberId,
  }: {
    requesterUserId: string;
    groupId: string;
    request: Awaited<ReturnType<GroupsService["getPendingJoinRequest"]>>;
    memberId: string;
  }) {
    const member = await this.prisma.groupMember.findFirst({
      where: {
        id: memberId,
        groupId,
        isActive: true,
        userId: null,
      },
      select: {
        id: true,
        displayName: true,
        profileImageUrl: true,
      },
    });

    if (!member) {
      throw new NotFoundException("Available temporary member not found.");
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.groupMember.update({
        where: {
          id: member.id,
        },
        data: {
          userId: request.userId,
          profileImageUrl:
            request.user.profileImageUrl ?? member.profileImageUrl,
          claimedAt: new Date(),
        },
      });
      await prisma.groupJoinRequest.update({
        where: {
          id: request.id,
        },
        data: {
          status: "APPROVED",
          resolvedAt: new Date(),
          resolvedByUserId: requesterUserId,
          targetMemberId: member.id,
          displayName: member.displayName,
        },
      });

      return prisma.group.findUniqueOrThrow({
        where: {
          id: groupId,
        },
        include: {
          members: true,
        },
      });
    });
  }

  private async approveJoinRequestWithNewMember({
    requesterUserId,
    groupId,
    request,
    displayName,
  }: {
    requesterUserId: string;
    groupId: string;
    request: Awaited<ReturnType<GroupsService["getPendingJoinRequest"]>>;
    displayName: string;
  }) {
    return this.prisma.$transaction(async (prisma) => {
      const member = await prisma.groupMember.create({
        data: {
          groupId,
          userId: request.userId,
          displayName,
          profileImageUrl: request.user.profileImageUrl,
          role: "MEMBER",
          claimedAt: new Date(),
        },
      });
      await prisma.groupJoinRequest.update({
        where: {
          id: request.id,
        },
        data: {
          status: "APPROVED",
          resolvedAt: new Date(),
          resolvedByUserId: requesterUserId,
          targetMemberId: member.id,
          displayName,
        },
      });

      return prisma.group.findUniqueOrThrow({
        where: {
          id: groupId,
        },
        include: {
          members: true,
        },
      });
    });
  }
}
