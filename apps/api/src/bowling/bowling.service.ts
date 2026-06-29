import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { toPrismaNumber } from "../common/prisma-number";
import { GroupMembershipPolicy } from "../groups/group-membership-policy";
import { PrismaService } from "../prisma/prisma.service";
import { SettlementRecorder } from "../settlements/settlement-recorder";
import { SharedCalculatorLoader } from "../shared-calculators/shared-calculator-loader";
import type { CreateUnlimitedBowlingSettlementBody } from "./bowling.schemas";

interface CreateUnlimitedSessionSettlementInput {
  requesterUserId: string;
  input: CreateUnlimitedBowlingSettlementBody;
}

interface GetSessionSettlementInput {
  requesterUserId: string;
  sessionId: string;
}

interface DeleteSessionSettlementInput {
  requesterUserId: string;
  sessionId: string;
}

@Injectable()
export class BowlingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipPolicy: GroupMembershipPolicy = new GroupMembershipPolicy(
      prisma,
    ),
    private readonly settlementRecorder: SettlementRecorder = new SettlementRecorder(
      prisma,
    ),
    private readonly calculators: SharedCalculatorLoader = new SharedCalculatorLoader(),
  ) {}

  async createUnlimitedSessionSettlement({
    requesterUserId,
    input,
  }: CreateUnlimitedSessionSettlementInput) {
    await this.membershipPolicy.assertMember({
      groupId: input.groupId,
      userId: requesterUserId,
    });
    await this.membershipPolicy.assertActiveMembers({
      groupId: input.groupId,
      memberIds: this.getSettlementMemberIds(input),
      notFoundMessage: "Bowling settlement member was not found in this group.",
    });

    const { calculateUnlimitedBowlingSessionSettlement } =
      await this.calculators.bowling();
    const calculated = calculateUnlimitedBowlingSessionSettlement({
      payerMemberId: input.payerMemberId,
      totalAmount: input.totalAmount,
      roundingUnit: input.roundingUnit,
      games: input.games,
    });
    const metadata = this.buildSettlementMetadata({
      calculated,
      input,
    });

    const { session, expenseItem } =
      await this.settlementRecorder.recordBettingBurdenSession({
        groupId: input.groupId,
        activity: "BOWLING",
        title: input.title,
        ...(metadata ? { metadata } : {}),
        occurredAt: input.occurredAt,
        createdById: requesterUserId,
        payerMemberId: input.payerMemberId,
        totalAmount: input.totalAmount,
        allocations: calculated.settlement.burdens.map((burden) => ({
          memberId: burden.memberId,
          amount: burden.roundedAmount,
          rankingAmount: burden.roundedAmount,
          reason: burden.reason,
        })),
      });

    return {
      session,
      expenseItem,
      settlement: {
        totalStacks: calculated.totalStacks,
        stackUnitPrice: calculated.stackUnitPrice,
        burdens: calculated.settlement.burdens,
      },
      recovery: calculated.settlement.recovery,
    };
  }

  async getSessionSettlement({
    requesterUserId,
    sessionId,
  }: GetSessionSettlementInput) {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        activity: "BOWLING",
      },
      include: {
        expenseItems: {
          where: {
            kind: "BETTING_BURDEN",
          },
          include: {
            allocations: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException("Bowling session was not found.");
    }

    await this.membershipPolicy.assertMember({
      groupId: session.groupId,
      userId: requesterUserId,
    });

    const expenseItem = session.expenseItems[0];
    if (!expenseItem) {
      throw new NotFoundException("Bowling betting burden was not found.");
    }

    const burdens = expenseItem.allocations.map((allocation) => {
      const amount = toPrismaNumber(allocation.amount);

      return {
        memberId: allocation.memberId,
        exactAmount: amount,
        roundedAmount: amount,
        reason: allocation.reason,
      };
    });
    const { buildRepresentativePayerRecovery } =
      await this.calculators.bowling();

    return {
      session,
      expenseItem,
      settlement: {
        totalAmount: toPrismaNumber(expenseItem.totalAmount),
        totalStacks: this.getMetadataNumber(session.metadata, "totalStacks"),
        stackUnitPrice: this.getMetadataNumber(
          session.metadata,
          "stackUnitPrice",
        ),
        burdens,
      },
      details: this.getSettlementDetails(session.metadata),
      recovery: buildRepresentativePayerRecovery({
        payerMemberId: expenseItem.payerMemberId,
        totalAmount: toPrismaNumber(expenseItem.totalAmount),
        burdens,
      }),
    };
  }

  async deleteSessionSettlement({
    requesterUserId,
    sessionId,
  }: DeleteSessionSettlementInput) {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        activity: "BOWLING",
      },
      select: {
        id: true,
        groupId: true,
      },
    });

    if (!session) {
      throw new NotFoundException("Bowling session was not found.");
    }

    await this.membershipPolicy.assertOwner({
      groupId: session.groupId,
      userId: requesterUserId,
    });

    await this.prisma.$transaction(async (prisma) => {
      const expenseItems = await prisma.expenseItem.findMany({
        where: {
          sessionId,
        },
        select: {
          id: true,
        },
      });
      const expenseItemIds = expenseItems.map((item) => item.id);

      if (expenseItemIds.length > 0) {
        await prisma.expenseAllocation.deleteMany({
          where: {
            expenseItemId: {
              in: expenseItemIds,
            },
          },
        });
      }

      await prisma.expenseItem.deleteMany({
        where: {
          sessionId,
        },
      });
      await prisma.rpsRecord.deleteMany({
        where: {
          sessionId,
        },
      });
      await prisma.session.delete({
        where: {
          id: sessionId,
        },
      });
    });

    return { ok: true };
  }

  private getSettlementMemberIds(
    input: CreateUnlimitedBowlingSettlementBody,
  ): string[] {
    return [
      ...new Set([
        input.payerMemberId,
        ...(input.details?.participantMemberIds ?? []),
        ...input.games.flatMap((game) =>
          game.stackAllocations.map((allocation) => allocation.memberId),
        ),
        ...(input.details?.games.flatMap((game) => [
          ...game.stackAllocations.map((allocation) => allocation.memberId),
          ...(game.scores?.map((score) => score.memberId) ?? []),
        ]) ?? []),
      ]),
    ];
  }

  private buildSettlementMetadata({
    calculated,
    input,
  }: {
    calculated: {
      totalStacks: number;
      stackUnitPrice: number;
    };
    input: CreateUnlimitedBowlingSettlementBody;
  }): Prisma.InputJsonObject | undefined {
    if (!input.details) {
      return undefined;
    }

    return {
      kind: "BOWLING_UNLIMITED_DETAIL",
      version: 1,
      participantMemberIds: input.details.participantMemberIds,
      totalStacks: calculated.totalStacks,
      stackUnitPrice: calculated.stackUnitPrice,
      games: input.details.games,
    };
  }

  private getSettlementDetails(metadata: unknown) {
    if (!metadata || typeof metadata !== "object") {
      return null;
    }

    const detail = metadata as Record<string, unknown>;

    if (detail.kind !== "BOWLING_UNLIMITED_DETAIL") {
      return null;
    }

    return detail;
  }

  private getMetadataNumber(metadata: unknown, key: string): number | null {
    if (!metadata || typeof metadata !== "object") {
      return null;
    }

    const value = (metadata as Record<string, unknown>)[key];

    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }
}
