import { BadRequestException, ForbiddenException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service";
import { GroupsService } from "./groups.service";

describe("GroupsService", () => {
  const groupId = "00000000-0000-4000-8000-000000000001";
  const requesterUserId = "user-1";
  const ownerMemberId = "00000000-0000-4000-8000-000000000101";
  const minjiMemberId = "00000000-0000-4000-8000-000000000102";
  const doyunMemberId = "00000000-0000-4000-8000-000000000103";

  it("creates a group with an owner member and group image", async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          profileImageUrl: "https://cdn.example.com/seojun.png",
        }),
      },
      group: {
        create: jest.fn().mockResolvedValue({
          id: groupId,
          name: "한강 레인클럽",
          imageUrl: "https://cdn.example.com/group.png",
          members: [
            {
              id: ownerMemberId,
              userId: requesterUserId,
              displayName: "김서준",
              profileImageUrl: "https://cdn.example.com/seojun.png",
              role: "OWNER",
            },
          ],
        }),
      },
    } as unknown as PrismaService;
    const service = new GroupsService(prisma);

    await expect(
      service.createGroup({
        userId: requesterUserId,
        input: {
          name: "한강 레인클럽",
          ownerDisplayName: "김서준",
          imageUrl: "https://cdn.example.com/group.png",
        },
      }),
    ).resolves.toMatchObject({
      id: groupId,
      imageUrl: "https://cdn.example.com/group.png",
    });
    expect(prisma.group.create).toHaveBeenCalledWith({
      data: {
        name: "한강 레인클럽",
        imageUrl: "https://cdn.example.com/group.png",
        themeColor: "#FEE500",
        members: {
          create: {
            userId: requesterUserId,
            displayName: "김서준",
            profileImageUrl: "https://cdn.example.com/seojun.png",
            role: "OWNER",
          },
        },
      },
      include: {
        members: true,
      },
    });
  });

  it("summarizes cumulative burdens by activity and RPS losses for group members", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: ownerMemberId }),
        findMany: jest.fn().mockResolvedValue([
          { id: ownerMemberId, displayName: "서준" },
          { id: minjiMemberId, displayName: "민지" },
          { id: doyunMemberId, displayName: "도윤" },
        ]),
      },
      session: {
        findMany: jest.fn().mockResolvedValue([
          {
            activity: "BOWLING",
            expenseItems: [
              {
                allocations: [
                  { memberId: minjiMemberId, rankingAmount: 20000 },
                  {
                    memberId: doyunMemberId,
                    rankingAmount: { toNumber: () => 35000 },
                  },
                ],
              },
            ],
          },
          {
            activity: "SCREEN_BASEBALL",
            expenseItems: [
              {
                allocations: [
                  { memberId: minjiMemberId, rankingAmount: "12000" },
                ],
              },
            ],
          },
        ]),
      },
      rpsRecord: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { loserMemberId: doyunMemberId },
            { loserMemberId: doyunMemberId },
            { loserMemberId: minjiMemberId },
          ]),
      },
    } as unknown as PrismaService;
    const service = new GroupsService(prisma);

    await expect(
      service.summarizeGroup({
        requesterUserId,
        groupId,
      }),
    ).resolves.toEqual([
      {
        memberId: ownerMemberId,
        displayName: "서준",
        bowlingAmount: 0,
        screenBaseballAmount: 0,
        totalAmount: 0,
        rpsLosses: 0,
      },
      {
        memberId: minjiMemberId,
        displayName: "민지",
        bowlingAmount: 20000,
        screenBaseballAmount: 12000,
        totalAmount: 32000,
        rpsLosses: 1,
      },
      {
        memberId: doyunMemberId,
        displayName: "도윤",
        bowlingAmount: 35000,
        screenBaseballAmount: 0,
        totalAmount: 35000,
        rpsLosses: 2,
      },
    ]);
    expect(prisma.session.findMany).toHaveBeenCalledWith({
      where: {
        groupId,
        activity: {
          in: ["BOWLING", "SCREEN_BASEBALL"],
        },
      },
      select: {
        activity: true,
        expenseItems: {
          select: {
            allocations: {
              select: {
                memberId: true,
                rankingAmount: true,
              },
            },
          },
        },
      },
    });
  });

  it("lists recent group records across settlement and RPS sessions", async () => {
    const occurredAt = new Date("2026-06-22T12:30:00.000Z");
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: ownerMemberId }),
      },
      session: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "session-bowling",
            activity: "BOWLING",
            title: "무제한 볼링",
            occurredAt,
            expenseItems: [{ totalAmount: { toNumber: () => 120000 } }],
            rpsRecords: [],
          },
          {
            id: "session-rps",
            activity: "ROCK_PAPER_SCISSORS",
            title: "음식물 쓰레기",
            occurredAt,
            expenseItems: [],
            rpsRecords: [{ id: "rps-1" }],
          },
        ]),
      },
    } as unknown as PrismaService;
    const service = new GroupsService(prisma);

    await expect(
      service.listRecentRecords({
        requesterUserId,
        groupId,
      }),
    ).resolves.toEqual([
      {
        id: "session-bowling",
        activity: "BOWLING",
        title: "무제한 볼링",
        occurredAt: "2026-06-22T12:30:00.000Z",
        totalAmount: 120000,
        rpsLossCount: 0,
      },
      {
        id: "session-rps",
        activity: "ROCK_PAPER_SCISSORS",
        title: "음식물 쓰레기",
        occurredAt: "2026-06-22T12:30:00.000Z",
        totalAmount: 0,
        rpsLossCount: 1,
      },
    ]);
    expect(prisma.session.findMany).toHaveBeenCalledWith({
      where: {
        groupId,
      },
      orderBy: {
        occurredAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        activity: true,
        title: true,
        occurredAt: true,
        expenseItems: {
          select: {
            totalAmount: true,
          },
        },
        rpsRecords: {
          select: {
            id: true,
          },
        },
      },
    });
  });

  it("updates group information only after confirming owner membership", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: ownerMemberId }),
      },
      group: {
        update: jest.fn().mockResolvedValue({
          id: groupId,
          name: "한강 볼링팟",
          members: [],
        }),
      },
    } as unknown as PrismaService;
    const service = new GroupsService(prisma);

    await expect(
      service.updateGroup({
        requesterUserId,
        groupId,
        input: {
          name: "한강 볼링팟",
        },
      }),
    ).resolves.toMatchObject({
      id: groupId,
      name: "한강 볼링팟",
    });
    expect(prisma.groupMember.findFirst).toHaveBeenCalledWith({
      where: {
        groupId,
        userId: requesterUserId,
        role: "OWNER",
        isActive: true,
      },
      select: {
        id: true,
      },
    });
    expect(prisma.group.update).toHaveBeenCalledWith({
      where: {
        id: groupId,
      },
      data: {
        name: "한강 볼링팟",
      },
      include: {
        members: true,
      },
    });
  });

  it("updates group image when the owner sends one", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: ownerMemberId }),
      },
      group: {
        update: jest.fn().mockResolvedValue({
          id: groupId,
          name: "한강 볼링팟",
          imageUrl: "https://cdn.example.com/group-next.png",
          members: [],
        }),
      },
    } as unknown as PrismaService;
    const service = new GroupsService(prisma);

    await expect(
      service.updateGroup({
        requesterUserId,
        groupId,
        input: {
          name: "한강 볼링팟",
          imageUrl: "https://cdn.example.com/group-next.png",
        },
      }),
    ).resolves.toMatchObject({
      id: groupId,
      imageUrl: "https://cdn.example.com/group-next.png",
    });
    expect(prisma.group.update).toHaveBeenCalledWith({
      where: {
        id: groupId,
      },
      data: {
        name: "한강 볼링팟",
        imageUrl: "https://cdn.example.com/group-next.png",
      },
      include: {
        members: true,
      },
    });
  });

  it("adds a temporary member with an optional profile image", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: ownerMemberId }),
        create: jest.fn().mockResolvedValue({
          id: minjiMemberId,
          groupId,
          userId: null,
          displayName: "민지",
          profileImageUrl: "https://cdn.example.com/minji.png",
          role: "MEMBER",
        }),
      },
    } as unknown as PrismaService;
    const service = new GroupsService(prisma);

    await expect(
      service.addTemporaryMember({
        requesterUserId,
        groupId,
        input: {
          displayName: "민지",
          profileImageUrl: "https://cdn.example.com/minji.png",
        },
      }),
    ).resolves.toMatchObject({
      id: minjiMemberId,
      profileImageUrl: "https://cdn.example.com/minji.png",
    });
    expect(prisma.groupMember.create).toHaveBeenCalledWith({
      data: {
        groupId,
        userId: null,
        displayName: "민지",
        profileImageUrl: "https://cdn.example.com/minji.png",
        role: "MEMBER",
      },
    });
  });

  it("creates invitation tokens with an expiration date", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: ownerMemberId }),
      },
      groupInvitation: {
        create: jest.fn().mockResolvedValue({
          id: "invite-1",
          groupId,
          token: "invite-token",
        }),
      },
    } as unknown as PrismaService;
    const service = new GroupsService(prisma);

    await expect(
      service.createInvitation({
        requesterUserId,
        groupId,
      }),
    ).resolves.toMatchObject({
      token: "invite-token",
    });
    expect(prisma.groupInvitation.create).toHaveBeenCalledWith({
      data: {
        groupId,
        createdByUserId: requesterUserId,
        token: expect.any(String),
        expiresAt: expect.any(Date),
      },
    });
  });

  it("rotates invitation tokens by revoking existing active invitations", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: ownerMemberId }),
      },
      groupInvitation: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({
          id: "invite-2",
          groupId,
          token: "next-token",
        }),
      },
      $transaction: jest.fn(async (callback) => callback(prisma)),
    } as unknown as PrismaService;
    const service = new GroupsService(prisma);

    await expect(
      service.rotateInvitation({
        requesterUserId,
        groupId,
      }),
    ).resolves.toMatchObject({
      token: "next-token",
    });
    expect(prisma.groupInvitation.updateMany).toHaveBeenCalledWith({
      where: {
        groupId,
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
    expect(prisma.groupInvitation.create).toHaveBeenCalledWith({
      data: {
        groupId,
        createdByUserId: requesterUserId,
        token: expect.any(String),
        expiresAt: expect.any(Date),
      },
    });
  });

  it("revokes an invitation token for group owners", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: ownerMemberId }),
      },
      groupInvitation: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    } as unknown as PrismaService;
    const service = new GroupsService(prisma);

    await expect(
      service.revokeInvitation({
        requesterUserId,
        groupId,
        invitationId: "invite-1",
      }),
    ).resolves.toEqual({ ok: true });
    expect(prisma.groupInvitation.updateMany).toHaveBeenCalledWith({
      where: {
        id: "invite-1",
        groupId,
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
  });

  it("rejects revoked invitation tokens", async () => {
    const prisma = {
      groupInvitation: {
        findUnique: jest.fn().mockResolvedValue({
          token: "invite-token",
          expiresAt: null,
          revokedAt: new Date("2026-06-30T00:00:00.000Z"),
          group: {
            id: groupId,
            coverImageUrl: null,
            imageUrl: null,
            name: "한강 레인클럽",
            themeColor: "#FEE500",
            members: [],
          },
        }),
      },
    } as unknown as PrismaService;
    const service = new GroupsService(prisma);

    await expect(
      service.getInvitation({
        token: "invite-token",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("approves a join request by linking the selected temporary member to the user profile", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: ownerMemberId })
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: minjiMemberId,
            groupId,
            userId: null,
            displayName: "민지",
            profileImageUrl: null,
            role: "MEMBER",
            isActive: true,
          }),
        update: jest.fn().mockResolvedValue({
          id: minjiMemberId,
          userId: "user-2",
          displayName: "민지",
          profileImageUrl: "https://cdn.example.com/minji-kakao.png",
          role: "MEMBER",
        }),
      },
      groupJoinRequest: {
        findFirst: jest.fn().mockResolvedValue({
          id: "join-request-1",
          userId: "user-2",
          user: {
            nickname: "민지",
            profileImageUrl: "https://cdn.example.com/minji-kakao.png",
          },
        }),
        update: jest.fn().mockResolvedValue({ id: "join-request-1" }),
      },
      group: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: groupId,
          members: [],
        }),
      },
      $transaction: jest.fn(async (callback) => callback(prisma)),
    } as unknown as PrismaService;
    const service = new GroupsService(prisma);

    await expect(
      service.approveJoinRequest({
        requesterUserId,
        groupId,
        requestId: "join-request-1",
        input: {
          mode: "LINK_EXISTING",
          memberId: minjiMemberId,
        },
      }),
    ).resolves.toMatchObject({
      id: groupId,
    });
    expect(prisma.groupMember.update).toHaveBeenCalledWith({
      where: {
        id: minjiMemberId,
      },
      data: {
        userId: "user-2",
        profileImageUrl: "https://cdn.example.com/minji-kakao.png",
        claimedAt: expect.any(Date),
      },
    });
    expect(prisma.groupJoinRequest.update).toHaveBeenCalledWith({
      where: {
        id: "join-request-1",
      },
      data: {
        status: "APPROVED",
        resolvedAt: expect.any(Date),
        resolvedByUserId: requesterUserId,
        targetMemberId: minjiMemberId,
        displayName: "민지",
      },
    });
  });

  it("rejects group updates from non-owners", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;
    const service = new GroupsService(prisma);

    await expect(
      service.updateGroup({
        requesterUserId,
        groupId,
        input: {
          name: "한강 볼링팟",
        },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects summary requests from non-members", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;
    const service = new GroupsService(prisma);

    await expect(
      service.summarizeGroup({
        requesterUserId,
        groupId,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
