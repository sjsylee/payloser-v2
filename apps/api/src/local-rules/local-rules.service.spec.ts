import { ForbiddenException } from "@nestjs/common";
import { LocalRulesService } from "./local-rules.service";
import type { PrismaService } from "../prisma/prisma.service";

describe("LocalRulesService", () => {
  it("creates a preset only after confirming group membership", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue({ id: "member-1" })
      },
      localRulePreset: {
        create: jest.fn().mockResolvedValue({ id: "rule-1" })
      }
    } as unknown as PrismaService;
    const service = new LocalRulesService(prisma);

    await expect(
      service.createPreset({
        requesterUserId: "user-1",
        groupId: "group-1",
        input: {
          name: "100점 미만 독박",
          type: "UNDER_SCORE_SOLO",
          threshold: 100
        }
      })
    ).resolves.toEqual({ id: "rule-1" });
    expect(prisma.groupMember.findFirst).toHaveBeenCalledWith({
      where: {
        groupId: "group-1",
        userId: "user-1",
        isActive: true
      },
      select: {
        id: true
      }
    });
    expect(prisma.localRulePreset.create).toHaveBeenCalledWith({
      data: {
        groupId: "group-1",
        name: "100점 미만 독박",
        type: "UNDER_SCORE_SOLO",
        threshold: 100
      }
    });
  });

  it("rejects preset listing for non-members", async () => {
    const prisma = {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue(null)
      },
      localRulePreset: {
        findMany: jest.fn()
      }
    } as unknown as PrismaService;
    const service = new LocalRulesService(prisma);

    await expect(
      service.listPresets({
        requesterUserId: "user-1",
        groupId: "group-1"
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.localRulePreset.findMany).not.toHaveBeenCalled();
  });
});
