import { randomUUID } from "node:crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { toPrismaNumber } from "../common/prisma-number";
import { GroupMembershipPolicy } from "../groups/group-membership-policy";
import { PrismaService } from "../prisma/prisma.service";

const SHARE_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type PublicBowlingDetail = {
  games: Array<{
    scores: Array<{
      memberId: string;
      score: number;
    }>;
    stackAllocations: Array<{
      memberId: string;
      stacks: number;
    }>;
  }>;
  participantMemberIds: string[];
  stackUnitPrice: number | null;
  totalStacks: number | null;
};

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
        metadata: true,
        occurredAt: true,
        title: true,
      },
    });

    if (!session) {
      throw new NotFoundException("Shared result was not found.");
    }

    const bowlingDetail = this.getPublicBowlingDetail(session.metadata);
    const memberIds = [
      ...new Set(
        [
          ...(bowlingDetail?.participantMemberIds ?? []),
          ...session.expenseItems.flatMap((item) => [
            item.payerMemberId,
            ...item.allocations.map((allocation) => allocation.memberId),
          ]),
        ].filter(Boolean),
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

    const totalAmount = session.expenseItems.reduce(
      (sum, item) => sum + toPrismaNumber(item.totalAmount),
      0,
    );
    const amountByMemberId = new Map<string, number>();

    for (const item of session.expenseItems) {
      for (const allocation of item.allocations) {
        amountByMemberId.set(
          allocation.memberId,
          (amountByMemberId.get(allocation.memberId) ?? 0) +
            toPrismaNumber(allocation.amount),
        );
      }
    }

    const stackByMemberId = new Map<string, number>();
    const scoresByMemberId = new Map<string, number[]>();

    for (const game of bowlingDetail?.games ?? []) {
      for (const allocation of game.stackAllocations) {
        stackByMemberId.set(
          allocation.memberId,
          (stackByMemberId.get(allocation.memberId) ?? 0) + allocation.stacks,
        );
      }

      for (const score of game.scores) {
        const scores = scoresByMemberId.get(score.memberId) ?? [];

        scores.push(score.score);
        scoresByMemberId.set(score.memberId, scores);
      }
    }

    const participants = memberIds.map((memberId) => {
      const scores = scoresByMemberId.get(memberId) ?? [];
      const averageScore =
        scores.length > 0
          ? Math.round(
              scores.reduce((sum, score) => sum + score, 0) / scores.length,
            )
          : null;

      return {
        amount: amountByMemberId.get(memberId) ?? 0,
        averageScore,
        displayName: displayNameByMemberId.get(memberId) ?? "Unknown member",
        stacks: stackByMemberId.has(memberId)
          ? (stackByMemberId.get(memberId) ?? 0)
          : null,
      };
    });

    return {
      activity: session.activity,
      group: session.group,
      occurredAt: session.occurredAt.toISOString(),
      title: session.title,
      summary: {
        participantCount: memberIds.length,
        stackUnitPrice: bowlingDetail?.stackUnitPrice ?? null,
        totalAmount,
        totalStacks: bowlingDetail?.totalStacks ?? null,
      },
      participants,
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

  private getPublicBowlingDetail(
    metadata: unknown,
  ): PublicBowlingDetail | null {
    if (!metadata || typeof metadata !== "object") {
      return null;
    }

    const detail = metadata as Record<string, unknown>;

    if (detail.kind !== "BOWLING_UNLIMITED_DETAIL") {
      return null;
    }

    const participantMemberIds = Array.isArray(detail.participantMemberIds)
      ? detail.participantMemberIds.filter(
          (memberId): memberId is string => typeof memberId === "string",
        )
      : [];
    const games = Array.isArray(detail.games)
      ? detail.games.map((game) => this.getPublicBowlingGame(game))
      : [];

    return {
      games,
      participantMemberIds,
      stackUnitPrice: this.getFiniteNumber(detail.stackUnitPrice),
      totalStacks: this.getFiniteNumber(detail.totalStacks),
    };
  }

  private getPublicBowlingGame(game: unknown): PublicBowlingDetail["games"][0] {
    if (!game || typeof game !== "object") {
      return {
        scores: [],
        stackAllocations: [],
      };
    }

    const gameRecord = game as Record<string, unknown>;
    const stackAllocations = Array.isArray(gameRecord.stackAllocations)
      ? gameRecord.stackAllocations.flatMap((allocation) => {
          if (!allocation || typeof allocation !== "object") {
            return [];
          }

          const allocationRecord = allocation as Record<string, unknown>;
          const memberId = allocationRecord.memberId;
          const stacks = allocationRecord.stacks;

          return typeof memberId === "string" &&
            typeof stacks === "number" &&
            Number.isFinite(stacks)
            ? [{ memberId, stacks }]
            : [];
        })
      : [];
    const scores = Array.isArray(gameRecord.scores)
      ? gameRecord.scores.flatMap((score) => {
          if (!score || typeof score !== "object") {
            return [];
          }

          const scoreRecord = score as Record<string, unknown>;
          const memberId = scoreRecord.memberId;
          const value = scoreRecord.score;

          return typeof memberId === "string" &&
            typeof value === "number" &&
            Number.isFinite(value)
            ? [{ memberId, score: value }]
            : [];
        })
      : [];

    return {
      scores,
      stackAllocations,
    };
  }

  private getFiniteNumber(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }
}
