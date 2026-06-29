import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type BettingBurdenActivity = "BOWLING" | "SCREEN_BASEBALL";

interface RecordBettingBurdenSessionInput {
  groupId: string;
  activity: BettingBurdenActivity;
  title: string;
  metadata?: Prisma.InputJsonValue;
  occurredAt?: string | undefined;
  createdById: string;
  payerMemberId: string;
  totalAmount: number;
  allocations: Array<{
    memberId: string;
    amount: number;
    rankingAmount?: number;
    reason: string;
  }>;
}

@Injectable()
export class SettlementRecorder {
  constructor(private readonly prisma: PrismaService) {}

  async recordBettingBurdenSession(input: RecordBettingBurdenSessionInput) {
    return this.prisma.$transaction(async (prisma) => {
      const session = await prisma.session.create({
        data: {
          groupId: input.groupId,
          activity: input.activity,
          title: input.title,
          ...(input.metadata ? { metadata: input.metadata } : {}),
          occurredAt: input.occurredAt
            ? new Date(input.occurredAt)
            : new Date(),
          createdById: input.createdById,
          updatedById: input.createdById,
        },
      });
      const expenseItem = await prisma.expenseItem.create({
        data: {
          sessionId: session.id,
          payerMemberId: input.payerMemberId,
          kind: "BETTING_BURDEN",
          title: input.title,
          totalAmount: input.totalAmount,
        },
      });

      await prisma.expenseAllocation.createMany({
        data: input.allocations.map((allocation) => ({
          expenseItemId: expenseItem.id,
          memberId: allocation.memberId,
          amount: allocation.amount,
          rankingAmount: allocation.rankingAmount ?? allocation.amount,
          reason: allocation.reason,
        })),
      });

      return { session, expenseItem };
    });
  }
}
