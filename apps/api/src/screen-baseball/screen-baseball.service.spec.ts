import { NotFoundException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service";
import { ScreenBaseballService } from "./screen-baseball.service";

describe("ScreenBaseballService", () => {
  const groupId = "00000000-0000-4000-8000-000000000001";
  const payerMemberId = "00000000-0000-4000-8000-000000000101";
  const loserMemberId = "00000000-0000-4000-8000-000000000102";

  it("creates a screen baseball settlement for active group members", async () => {
    const occurredAt = new Date("2026-06-22T12:30:00.000Z");
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: "requester-member" }),
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: payerMemberId }, { id: loserMemberId }]),
      },
      session: {
        create: jest.fn().mockResolvedValue({
          id: "session-1",
          groupId,
          activity: "SCREEN_BASEBALL",
          title: "스크린야구 정산",
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
          title: "스크린야구 정산",
          totalAmount: 12000,
        }),
      },
      expenseAllocation: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      group: {
        update: jest.fn().mockResolvedValue({ id: groupId }),
      },
      $transaction: jest.fn(async (callback) => callback(prisma)),
    } as unknown as PrismaService;
    const service = new ScreenBaseballService(prisma);

    await expect(
      service.createSettlement({
        requesterUserId: "user-1",
        input: {
          groupId,
          payerMemberId,
          loserMemberIds: [loserMemberId],
          title: "스크린야구 정산",
          totalAmount: 12000,
          occurredAt: "2026-06-22T12:30:00.000Z",
        },
      }),
    ).resolves.toMatchObject({
      session: {
        id: "session-1",
        activity: "SCREEN_BASEBALL",
      },
      expenseItem: {
        id: "expense-1",
        kind: "BETTING_BURDEN",
      },
      settlement: {
        burdens: [
          {
            memberId: loserMemberId,
            amount: 12000,
            reason: "SCREEN_BASEBALL_LOSER",
          },
        ],
      },
      recovery: {
        payerMemberId,
        totalAmount: 12000,
        payerOwnBurdenAmount: 0,
        payerReceivableAmount: 12000,
        requests: [
          {
            fromMemberId: loserMemberId,
            toMemberId: payerMemberId,
            amount: 12000,
          },
        ],
      },
    });
    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        groupId,
        activity: "SCREEN_BASEBALL",
        title: "스크린야구 정산",
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
          memberId: loserMemberId,
          amount: 12000,
          rankingAmount: 12000,
          reason: "SCREEN_BASEBALL_LOSER",
        },
      ],
    });
  });

  it("rejects a settlement when payer or losers are not active group members", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: "requester-member" }),
        findMany: jest.fn().mockResolvedValue([{ id: payerMemberId }]),
      },
      $transaction: jest.fn(),
    } as unknown as PrismaService;
    const service = new ScreenBaseballService(prisma);

    await expect(
      service.createSettlement({
        requesterUserId: "user-1",
        input: {
          groupId,
          payerMemberId,
          loserMemberIds: [loserMemberId],
          title: "스크린야구 정산",
          totalAmount: 12000,
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
