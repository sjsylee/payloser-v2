import { NotFoundException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service";
import { BowlingService } from "./bowling.service";

describe("BowlingService", () => {
  const groupId = "00000000-0000-4000-8000-000000000001";
  const payerMemberId = "00000000-0000-4000-8000-000000000101";
  const secondMemberId = "00000000-0000-4000-8000-000000000102";
  const thirdMemberId = "00000000-0000-4000-8000-000000000103";

  it("creates an unlimited bowling settlement for an active group member", async () => {
    const occurredAt = new Date("2026-06-22T12:30:00.000Z");
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: "requester-member" }),
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: payerMemberId },
            { id: secondMemberId },
            { id: thirdMemberId },
          ]),
      },
      session: {
        create: jest.fn().mockResolvedValue({
          id: "session-1",
          groupId,
          activity: "BOWLING",
          title: "무제한 볼링 정산",
          occurredAt,
          createdById: "user-1",
          updatedById: "user-1",
        }),
      },
      expenseItem: {
        create: jest.fn().mockResolvedValue({
          id: "expense-1",
          sessionId: "session-1",
          payerMemberId,
          kind: "BETTING_BURDEN",
          title: "무제한 볼링 정산",
          totalAmount: 100000,
        }),
      },
      expenseAllocation: {
        createMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      $transaction: jest.fn(async (callback) => callback(prisma)),
    } as unknown as PrismaService;
    const service = new BowlingService(prisma);

    await expect(
      service.createUnlimitedSessionSettlement({
        requesterUserId: "user-1",
        input: {
          groupId,
          payerMemberId,
          title: "무제한 볼링 정산",
          totalAmount: 100000,
          roundingUnit: 10,
          occurredAt: "2026-06-22T12:30:00.000Z",
          games: [
            {
              stackAllocations: [
                { memberId: payerMemberId, stacks: 0, reason: "FIRST_PLACE" },
                { memberId: secondMemberId, stacks: 1, reason: "SECOND_PLACE" },
                { memberId: thirdMemberId, stacks: 2, reason: "LAST_PLACE" },
              ],
            },
            {
              stackAllocations: [
                { memberId: payerMemberId, stacks: 1, reason: "SECOND_PLACE" },
                { memberId: secondMemberId, stacks: 0, reason: "FIRST_PLACE" },
                { memberId: thirdMemberId, stacks: 1, reason: "SECOND_PLACE" },
              ],
            },
          ],
        },
      }),
    ).resolves.toMatchObject({
      session: {
        id: "session-1",
        activity: "BOWLING",
      },
      expenseItem: {
        id: "expense-1",
        kind: "BETTING_BURDEN",
      },
      settlement: {
        totalStacks: 5,
        stackUnitPrice: 20000,
        burdens: [
          {
            memberId: payerMemberId,
            exactAmount: 20000,
            roundedAmount: 20000,
            reason: "UNLIMITED_SESSION_TOTAL",
          },
          {
            memberId: secondMemberId,
            exactAmount: 20000,
            roundedAmount: 20000,
            reason: "UNLIMITED_SESSION_TOTAL",
          },
          {
            memberId: thirdMemberId,
            exactAmount: 60000,
            roundedAmount: 60000,
            reason: "UNLIMITED_SESSION_TOTAL",
          },
        ],
      },
      recovery: {
        payerMemberId,
        totalAmount: 100000,
        payerOwnBurdenAmount: 20000,
        payerReceivableAmount: 80000,
        requests: [
          {
            fromMemberId: secondMemberId,
            toMemberId: payerMemberId,
            amount: 20000,
          },
          {
            fromMemberId: thirdMemberId,
            toMemberId: payerMemberId,
            amount: 60000,
          },
        ],
      },
    });
    expect(prisma.groupMember.findFirst).toHaveBeenCalledWith({
      where: {
        groupId,
        userId: "user-1",
        isActive: true,
      },
      select: {
        id: true,
      },
    });
    expect(prisma.groupMember.findMany).toHaveBeenCalledWith({
      where: {
        groupId,
        isActive: true,
        id: {
          in: [payerMemberId, secondMemberId, thirdMemberId],
        },
      },
      select: {
        id: true,
      },
    });
    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        groupId,
        activity: "BOWLING",
        title: "무제한 볼링 정산",
        occurredAt,
        shareExpiresAt: expect.any(Date),
        shareToken: expect.any(String),
        createdById: "user-1",
        updatedById: "user-1",
      },
    });
    expect(prisma.expenseItem.create).toHaveBeenCalledWith({
      data: {
        sessionId: "session-1",
        payerMemberId,
        kind: "BETTING_BURDEN",
        title: "무제한 볼링 정산",
        totalAmount: 100000,
      },
    });
    expect(prisma.expenseAllocation.createMany).toHaveBeenCalledWith({
      data: [
        {
          expenseItemId: "expense-1",
          memberId: payerMemberId,
          amount: 20000,
          rankingAmount: 20000,
          reason: "UNLIMITED_SESSION_TOTAL",
        },
        {
          expenseItemId: "expense-1",
          memberId: secondMemberId,
          amount: 20000,
          rankingAmount: 20000,
          reason: "UNLIMITED_SESSION_TOTAL",
        },
        {
          expenseItemId: "expense-1",
          memberId: thirdMemberId,
          amount: 60000,
          rankingAmount: 60000,
          reason: "UNLIMITED_SESSION_TOTAL",
        },
      ],
    });
  });

  it("returns a stored bowling settlement for an active group member", async () => {
    const prisma = {
      session: {
        findFirst: jest.fn().mockResolvedValue({
          id: "session-1",
          groupId,
          activity: "BOWLING",
          title: "무제한 볼링 정산",
          occurredAt: new Date("2026-06-22T12:30:00.000Z"),
          metadata: {
            kind: "BOWLING_UNLIMITED_DETAIL",
            version: 1,
            participantMemberIds: [
              payerMemberId,
              secondMemberId,
              thirdMemberId,
            ],
            totalStacks: 5,
            stackUnitPrice: 20000,
            games: [
              {
                stackAllocations: [
                  {
                    memberId: payerMemberId,
                    stacks: 1,
                    reason: "SECOND_PLACE",
                  },
                  {
                    memberId: secondMemberId,
                    stacks: 0,
                    reason: "FIRST_PLACE",
                  },
                  { memberId: thirdMemberId, stacks: 4, reason: "LAST_PLACE" },
                ],
                scores: [
                  { memberId: payerMemberId, score: 120 },
                  { memberId: secondMemberId, score: 150 },
                  { memberId: thirdMemberId, score: 90 },
                ],
              },
            ],
          },
          expenseItems: [
            {
              id: "expense-1",
              payerMemberId,
              kind: "BETTING_BURDEN",
              title: "무제한 볼링 정산",
              totalAmount: 100000,
              allocations: [
                {
                  memberId: payerMemberId,
                  amount: 20000,
                  rankingAmount: 20000,
                  reason: "UNLIMITED_SESSION_TOTAL",
                },
                {
                  memberId: secondMemberId,
                  amount: 20000,
                  rankingAmount: 20000,
                  reason: "UNLIMITED_SESSION_TOTAL",
                },
                {
                  memberId: thirdMemberId,
                  amount: 60000,
                  rankingAmount: 60000,
                  reason: "UNLIMITED_SESSION_TOTAL",
                },
              ],
            },
          ],
        }),
      },
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: "requester-member" }),
      },
    } as unknown as PrismaService;
    const service = new BowlingService(prisma);

    await expect(
      service.getSessionSettlement({
        requesterUserId: "user-1",
        sessionId: "session-1",
      }),
    ).resolves.toMatchObject({
      session: {
        id: "session-1",
        activity: "BOWLING",
      },
      expenseItem: {
        id: "expense-1",
        kind: "BETTING_BURDEN",
      },
      settlement: {
        totalAmount: 100000,
        totalStacks: 5,
        stackUnitPrice: 20000,
        burdens: [
          {
            memberId: payerMemberId,
            exactAmount: 20000,
            roundedAmount: 20000,
            reason: "UNLIMITED_SESSION_TOTAL",
          },
          {
            memberId: secondMemberId,
            exactAmount: 20000,
            roundedAmount: 20000,
            reason: "UNLIMITED_SESSION_TOTAL",
          },
          {
            memberId: thirdMemberId,
            exactAmount: 60000,
            roundedAmount: 60000,
            reason: "UNLIMITED_SESSION_TOTAL",
          },
        ],
      },
      details: {
        participantMemberIds: [payerMemberId, secondMemberId, thirdMemberId],
        totalStacks: 5,
        stackUnitPrice: 20000,
      },
      recovery: {
        payerMemberId,
        totalAmount: 100000,
        payerOwnBurdenAmount: 20000,
        payerReceivableAmount: 80000,
        requests: [
          {
            fromMemberId: secondMemberId,
            toMemberId: payerMemberId,
            amount: 20000,
          },
          {
            fromMemberId: thirdMemberId,
            toMemberId: payerMemberId,
            amount: 60000,
          },
        ],
      },
    });
    expect(prisma.session.findFirst).toHaveBeenCalledWith({
      where: {
        id: "session-1",
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
    expect(prisma.groupMember.findFirst).toHaveBeenCalledWith({
      where: {
        groupId,
        userId: "user-1",
        isActive: true,
      },
      select: {
        id: true,
      },
    });
  });

  it("deletes a stored bowling settlement for a group owner", async () => {
    const transactionClient = {
      expenseItem: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: "expense-1" }, { id: "expense-2" }]),
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      expenseAllocation: {
        deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      rpsRecord: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      session: {
        delete: jest.fn().mockResolvedValue({ id: "session-1" }),
      },
    };
    const prisma = {
      session: {
        findFirst: jest.fn().mockResolvedValue({
          id: "session-1",
          groupId,
        }),
      },
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: "owner-member" }),
      },
      $transaction: jest.fn(async (callback) => callback(transactionClient)),
    } as unknown as PrismaService;
    const service = new BowlingService(prisma);

    await expect(
      service.deleteSessionSettlement({
        requesterUserId: "user-1",
        sessionId: "session-1",
      }),
    ).resolves.toEqual({ ok: true });
    expect(prisma.groupMember.findFirst).toHaveBeenCalledWith({
      where: {
        groupId,
        userId: "user-1",
        role: "OWNER",
        isActive: true,
      },
      select: {
        id: true,
      },
    });
    expect(transactionClient.expenseAllocation.deleteMany).toHaveBeenCalledWith(
      {
        where: {
          expenseItemId: {
            in: ["expense-1", "expense-2"],
          },
        },
      },
    );
    expect(transactionClient.session.delete).toHaveBeenCalledWith({
      where: {
        id: "session-1",
      },
    });
  });

  it("rejects a settlement when any payer or allocation member is not active in the group", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: "requester-member" }),
        findMany: jest.fn().mockResolvedValue([{ id: payerMemberId }]),
      },
      session: {
        create: jest.fn(),
      },
      expenseItem: {
        create: jest.fn(),
      },
      expenseAllocation: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    } as unknown as PrismaService;
    const service = new BowlingService(prisma);

    await expect(
      service.createUnlimitedSessionSettlement({
        requesterUserId: "user-1",
        input: {
          groupId,
          payerMemberId,
          title: "무제한 볼링 정산",
          totalAmount: 50000,
          roundingUnit: 10,
          games: [
            {
              stackAllocations: [
                { memberId: payerMemberId, stacks: 0, reason: "FIRST_PLACE" },
                {
                  memberId: secondMemberId,
                  stacks: 2,
                  reason: "LOSING_TEAM_BARES_ALL",
                },
              ],
            },
          ],
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
