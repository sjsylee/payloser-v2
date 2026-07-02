import type { PrismaService } from "../prisma/prisma.service";
import { SettlementRecorder } from "./settlement-recorder";

describe("SettlementRecorder", () => {
  it("records a betting burden session with ranking allocations", async () => {
    const occurredAt = new Date("2026-06-22T12:30:00.000Z");
    const prisma = {
      session: {
        create: jest.fn().mockResolvedValue({
          id: "session-1",
          groupId: "group-1",
          activity: "BOWLING",
          title: "무제한 볼링",
          occurredAt,
        }),
      },
      expenseItem: {
        create: jest.fn().mockResolvedValue({
          id: "expense-1",
          sessionId: "session-1",
          payerMemberId: "member-payer",
          kind: "BETTING_BURDEN",
        }),
      },
      expenseAllocation: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      group: {
        update: jest.fn().mockResolvedValue({ id: "group-1" }),
      },
      $transaction: jest.fn(async (callback) => callback(prisma)),
    } as unknown as PrismaService;
    const recorder = new SettlementRecorder(prisma);

    await expect(
      recorder.recordBettingBurdenSession({
        groupId: "group-1",
        activity: "BOWLING",
        title: "무제한 볼링",
        occurredAt: "2026-06-22T12:30:00.000Z",
        createdById: "user-1",
        payerMemberId: "member-payer",
        totalAmount: 40000,
        allocations: [
          {
            memberId: "member-1",
            amount: 10000,
            reason: "UNLIMITED_SESSION_TOTAL",
          },
          {
            memberId: "member-2",
            amount: 30000,
            rankingAmount: 25000,
            reason: "LOCAL_RULE_ADJUSTMENT",
          },
        ],
      }),
    ).resolves.toMatchObject({
      session: {
        id: "session-1",
      },
      expenseItem: {
        id: "expense-1",
      },
    });
    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        groupId: "group-1",
        activity: "BOWLING",
        title: "무제한 볼링",
        occurredAt,
        shareExpiresAt: expect.any(Date),
        shareToken: expect.any(String),
        createdById: "user-1",
        updatedById: "user-1",
      },
    });
    expect(prisma.expenseAllocation.createMany).toHaveBeenCalledWith({
      data: [
        {
          expenseItemId: "expense-1",
          memberId: "member-1",
          amount: 10000,
          rankingAmount: 10000,
          reason: "UNLIMITED_SESSION_TOTAL",
        },
        {
          expenseItemId: "expense-1",
          memberId: "member-2",
          amount: 30000,
          rankingAmount: 25000,
          reason: "LOCAL_RULE_ADJUSTMENT",
        },
      ],
    });
    expect(prisma.group.update).toHaveBeenCalledWith({
      where: {
        id: "group-1",
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
  });
});
