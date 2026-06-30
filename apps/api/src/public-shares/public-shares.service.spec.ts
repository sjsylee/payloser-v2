import { NotFoundException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service";
import { PublicSharesService } from "./public-shares.service";

describe("PublicSharesService", () => {
  it("returns a public read model without internal member ids", async () => {
    const occurredAt = new Date("2026-06-30T12:00:00.000Z");
    const prisma = {
      groupMember: {
        findMany: jest.fn().mockResolvedValue([
          { id: "payer-member", displayName: "서준" },
          { id: "loser-member", displayName: "민지" },
        ]),
      },
      session: {
        findFirst: jest.fn().mockResolvedValue({
          activity: "BOWLING",
          expenseItems: [
            {
              allocations: [
                {
                  amount: 20000,
                  memberId: "loser-member",
                  rankingAmount: 20000,
                  reason: "LAST_PLACE",
                },
              ],
              payerMemberId: "payer-member",
              title: "무제한 볼링",
              totalAmount: 20000,
            },
          ],
          group: {
            name: "한강 레인클럽",
            themeColor: "#FEE500",
          },
          groupId: "group-1",
          occurredAt,
          title: "무제한 볼링",
        }),
      },
    } as unknown as PrismaService;
    const service = new PublicSharesService(prisma);

    await expect(service.getPublicSession("share-token")).resolves.toEqual({
      activity: "BOWLING",
      expenseItems: [
        {
          allocations: [
            {
              amount: 20000,
              displayName: "민지",
              rankingAmount: 20000,
              reason: "LAST_PLACE",
            },
          ],
          payerDisplayName: "서준",
          title: "무제한 볼링",
          totalAmount: 20000,
        },
      ],
      group: {
        name: "한강 레인클럽",
        themeColor: "#FEE500",
      },
      occurredAt: "2026-06-30T12:00:00.000Z",
      title: "무제한 볼링",
    });
    expect(prisma.session.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          shareRevokedAt: null,
          shareToken: "share-token",
        }),
      }),
    );
  });

  it("rejects missing, expired, or revoked share tokens as not found", async () => {
    const prisma = {
      session: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;
    const service = new PublicSharesService(prisma);

    await expect(
      service.getPublicSession("missing-token"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rotates a share token after owner verification", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: "owner-member" }),
      },
      session: {
        findUnique: jest.fn().mockResolvedValue({ groupId: "group-1" }),
        update: jest.fn().mockResolvedValue({
          shareExpiresAt: new Date("2026-07-30T00:00:00.000Z"),
          shareToken: "next-share-token",
        }),
      },
    } as unknown as PrismaService;
    const service = new PublicSharesService(prisma);

    await expect(
      service.rotateSessionShareToken({
        requesterUserId: "owner-user",
        sessionId: "session-1",
      }),
    ).resolves.toMatchObject({
      shareToken: "next-share-token",
    });
    expect(prisma.session.update).toHaveBeenCalledWith({
      where: {
        id: "session-1",
      },
      data: {
        shareExpiresAt: expect.any(Date),
        shareRevokedAt: null,
        shareToken: expect.any(String),
      },
      select: {
        shareExpiresAt: true,
        shareToken: true,
      },
    });
  });

  it("revokes a share token after owner verification", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: "owner-member" }),
      },
      session: {
        findUnique: jest.fn().mockResolvedValue({ groupId: "group-1" }),
        update: jest.fn().mockResolvedValue({ id: "session-1" }),
      },
    } as unknown as PrismaService;
    const service = new PublicSharesService(prisma);

    await expect(
      service.revokeSessionShareToken({
        requesterUserId: "owner-user",
        sessionId: "session-1",
      }),
    ).resolves.toEqual({ ok: true });
    expect(prisma.session.update).toHaveBeenCalledWith({
      where: {
        id: "session-1",
      },
      data: {
        shareRevokedAt: expect.any(Date),
      },
    });
  });
});
