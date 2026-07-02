import { Injectable } from "@nestjs/common";
import { GroupMembershipPolicy } from "../groups/group-membership-policy";
import { PrismaService } from "../prisma/prisma.service";
import { SharedCalculatorLoader } from "../shared-calculators/shared-calculator-loader";
import type { CreateRpsRecordBody } from "./rps.schemas";

type RpsHand = "ROCK" | "PAPER" | "SCISSORS";

interface RpsLossRecord {
  loserMemberId: string;
  loserHand: RpsHand;
  context: string;
  occurredAt: string;
}

interface CreateRpsRecordInput {
  requesterUserId: string;
  input: CreateRpsRecordBody;
}

interface GetGroupSummaryInput {
  requesterUserId: string;
  groupId: string;
}

@Injectable()
export class RpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipPolicy: GroupMembershipPolicy = new GroupMembershipPolicy(
      prisma,
    ),
    private readonly calculators: SharedCalculatorLoader = new SharedCalculatorLoader(),
  ) {}

  async createRecord({ requesterUserId, input }: CreateRpsRecordInput) {
    await this.membershipPolicy.assertMember({
      groupId: input.groupId,
      userId: requesterUserId,
    });
    await this.membershipPolicy.assertActiveMember({
      groupId: input.groupId,
      memberId: input.loserMemberId,
      notFoundMessage: "RPS loser member was not found in this group.",
    });

    return this.prisma.$transaction(async (prisma) => {
      const session = await prisma.session.create({
        data: {
          groupId: input.groupId,
          activity: "ROCK_PAPER_SCISSORS",
          title: input.context,
          occurredAt: input.occurredAt
            ? new Date(input.occurredAt)
            : new Date(),
          createdById: requesterUserId,
          updatedById: requesterUserId,
        },
      });
      const record = await prisma.rpsRecord.create({
        data: {
          sessionId: session.id,
          loserMemberId: input.loserMemberId,
          loserHand: input.loserHand,
          context: input.context,
          memo: input.memo ?? null,
        },
      });
      await prisma.group.update({
        where: {
          id: input.groupId,
        },
        data: {
          revision: {
            increment: 1,
          },
        },
        select: {
          id: true,
        },
      });

      return {
        ...session,
        rpsRecords: [record],
      };
    });
  }

  async summarizeGroupLosses({
    requesterUserId,
    groupId,
  }: GetGroupSummaryInput) {
    await this.membershipPolicy.assertMember({
      groupId,
      userId: requesterUserId,
    });

    const records = await this.prisma.rpsRecord.findMany({
      where: {
        session: {
          groupId,
          activity: "ROCK_PAPER_SCISSORS",
        },
      },
      select: {
        loserMemberId: true,
        loserHand: true,
        context: true,
        session: {
          select: {
            occurredAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const { summarizeRpsLosses } = await this.calculators.rps();

    return summarizeRpsLosses({
      records: records.map((record) => ({
        loserMemberId: record.loserMemberId,
        loserHand: record.loserHand,
        context: record.context,
        occurredAt: record.session.occurredAt.toISOString(),
      })),
    });
  }
}
