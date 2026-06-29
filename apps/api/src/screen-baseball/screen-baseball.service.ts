import { Injectable } from "@nestjs/common";
import { GroupMembershipPolicy } from "../groups/group-membership-policy";
import { PrismaService } from "../prisma/prisma.service";
import { SettlementRecorder } from "../settlements/settlement-recorder";
import { SharedCalculatorLoader } from "../shared-calculators/shared-calculator-loader";
import type { CreateScreenBaseballSettlementBody } from "./screen-baseball.schemas";

interface CreateSettlementInput {
  requesterUserId: string;
  input: CreateScreenBaseballSettlementBody;
}

@Injectable()
export class ScreenBaseballService {
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

  async createSettlement({ requesterUserId, input }: CreateSettlementInput) {
    await this.membershipPolicy.assertMember({
      groupId: input.groupId,
      userId: requesterUserId,
    });
    await this.membershipPolicy.assertActiveMembers({
      groupId: input.groupId,
      memberIds: [input.payerMemberId, ...input.loserMemberIds],
      notFoundMessage:
        "Screen baseball settlement member was not found in this group.",
    });

    const { calculateScreenBaseballSettlement } =
      await this.calculators.screenBaseball();
    const settlement = calculateScreenBaseballSettlement({
      payerMemberId: input.payerMemberId,
      totalAmount: input.totalAmount,
      loserMemberIds: input.loserMemberIds,
    });

    const { session, expenseItem } =
      await this.settlementRecorder.recordBettingBurdenSession({
        groupId: input.groupId,
        activity: "SCREEN_BASEBALL",
        title: input.title,
        occurredAt: input.occurredAt,
        createdById: requesterUserId,
        payerMemberId: input.payerMemberId,
        totalAmount: input.totalAmount,
        allocations: settlement.burdens.map((burden) => ({
          memberId: burden.memberId,
          amount: burden.amount,
          rankingAmount: burden.amount,
          reason: burden.reason,
        })),
      });

    return {
      session,
      expenseItem,
      settlement,
      recovery: settlement.recovery,
    };
  }
}
