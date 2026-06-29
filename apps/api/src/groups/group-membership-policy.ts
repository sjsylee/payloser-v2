import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GroupMembershipPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async assertMember({ groupId, userId }: { groupId: string; userId: string }) {
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException("You are not a member of this group.");
    }

    return membership;
  }

  async assertOwner({ groupId, userId }: { groupId: string; userId: string }) {
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: "OWNER",
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        "Only the group owner can update this group.",
      );
    }

    return membership;
  }

  async assertActiveMembers({
    groupId,
    memberIds,
    notFoundMessage,
  }: {
    groupId: string;
    memberIds: string[];
    notFoundMessage: string;
  }) {
    const uniqueMemberIds = [...new Set(memberIds)];
    const members = await this.prisma.groupMember.findMany({
      where: {
        groupId,
        isActive: true,
        id: {
          in: uniqueMemberIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (members.length !== uniqueMemberIds.length) {
      throw new NotFoundException(notFoundMessage);
    }

    return members;
  }

  async assertActiveMember({
    groupId,
    memberId,
    notFoundMessage,
  }: {
    groupId: string;
    memberId: string;
    notFoundMessage: string;
  }) {
    const member = await this.prisma.groupMember.findFirst({
      where: {
        id: memberId,
        groupId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!member) {
      throw new NotFoundException(notFoundMessage);
    }

    return member;
  }
}
