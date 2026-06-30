import { randomUUID } from "node:crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { toPrismaNumber } from "../common/prisma-number";
import { GroupMembershipPolicy } from "../groups/group-membership-policy";
import { PrismaService } from "../prisma/prisma.service";

const SHARE_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class PublicSharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipPolicy: GroupMembershipPolicy = new GroupMembershipPolicy(
      prisma,
    ),
  ) {}

  async getPublicSession(shareToken: string) {
    const session = await this.prisma.session.findFirst({
      where: {
        shareToken,
        shareRevokedAt: null,
        OR: [
          {
            shareExpiresAt: null,
          },
          {
            shareExpiresAt: {
              gt: new Date(),
            },
          },
        ],
      },
      select: {
        activity: true,
        expenseItems: {
          select: {
            allocations: {
              select: {
                amount: true,
                memberId: true,
                rankingAmount: true,
                reason: true,
              },
            },
            payerMemberId: true,
            title: true,
            totalAmount: true,
          },
        },
        group: {
          select: {
            name: true,
            themeColor: true,
          },
        },
        groupId: true,
        occurredAt: true,
        title: true,
      },
    });

    if (!session) {
      throw new NotFoundException("Shared result was not found.");
    }

    const memberIds = [
      ...new Set(
        session.expenseItems.flatMap((item) => [
          item.payerMemberId,
          ...item.allocations.map((allocation) => allocation.memberId),
        ]),
      ),
    ];
    const members = await this.prisma.groupMember.findMany({
      where: {
        groupId: session.groupId,
        id: {
          in: memberIds,
        },
      },
      select: {
        displayName: true,
        id: true,
      },
    });
    const displayNameByMemberId = new Map(
      members.map((member) => [member.id, member.displayName]),
    );

    return {
      activity: session.activity,
      group: session.group,
      occurredAt: session.occurredAt.toISOString(),
      title: session.title,
      expenseItems: session.expenseItems.map((item) => ({
        allocations: item.allocations.map((allocation) => ({
          amount: toPrismaNumber(allocation.amount),
          displayName:
            displayNameByMemberId.get(allocation.memberId) ?? "Unknown member",
          rankingAmount: toPrismaNumber(allocation.rankingAmount),
          reason: allocation.reason,
        })),
        payerDisplayName:
          displayNameByMemberId.get(item.payerMemberId) ?? "Unknown payer",
        title: item.title,
        totalAmount: toPrismaNumber(item.totalAmount),
      })),
    };
  }

  async rotateSessionShareToken({
    requesterUserId,
    sessionId,
  }: {
    requesterUserId: string;
    sessionId: string;
  }) {
    const session = await this.getSessionForOwnerCheck(sessionId);
    await this.membershipPolicy.assertOwner({
      groupId: session.groupId,
      userId: requesterUserId,
    });

    return this.prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        shareExpiresAt: new Date(Date.now() + SHARE_TOKEN_TTL_MS),
        shareRevokedAt: null,
        shareToken: randomUUID(),
      },
      select: {
        shareExpiresAt: true,
        shareToken: true,
      },
    });
  }

  async revokeSessionShareToken({
    requesterUserId,
    sessionId,
  }: {
    requesterUserId: string;
    sessionId: string;
  }) {
    const session = await this.getSessionForOwnerCheck(sessionId);
    await this.membershipPolicy.assertOwner({
      groupId: session.groupId,
      userId: requesterUserId,
    });

    await this.prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        shareRevokedAt: new Date(),
      },
    });

    return { ok: true };
  }

  private async getSessionForOwnerCheck(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: {
        id: sessionId,
      },
      select: {
        groupId: true,
      },
    });

    if (!session) {
      throw new NotFoundException("Session was not found.");
    }

    return session;
  }
}
