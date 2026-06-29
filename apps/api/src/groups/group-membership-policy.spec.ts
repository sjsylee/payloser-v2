import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service";
import { GroupMembershipPolicy } from "./group-membership-policy";

describe("GroupMembershipPolicy", () => {
  it("asserts an active group member", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: "member-1" }),
      },
    } as unknown as PrismaService;
    const policy = new GroupMembershipPolicy(prisma);

    await expect(
      policy.assertMember({
        groupId: "group-1",
        userId: "user-1",
      }),
    ).resolves.toEqual({ id: "member-1" });
    expect(prisma.groupMember.findFirst).toHaveBeenCalledWith({
      where: {
        groupId: "group-1",
        userId: "user-1",
        isActive: true,
      },
      select: {
        id: true,
      },
    });
  });

  it("rejects a requester who is not an active group member", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;
    const policy = new GroupMembershipPolicy(prisma);

    await expect(
      policy.assertMember({
        groupId: "group-1",
        userId: "user-1",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects when any referenced member is not active in the group", async () => {
    const prisma = {
      groupMember: {
        findMany: jest.fn().mockResolvedValue([{ id: "member-1" }]),
      },
    } as unknown as PrismaService;
    const policy = new GroupMembershipPolicy(prisma);

    await expect(
      policy.assertActiveMembers({
        groupId: "group-1",
        memberIds: ["member-1", "member-2"],
        notFoundMessage: "Some member is missing.",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
