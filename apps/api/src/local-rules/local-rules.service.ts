import { Injectable } from "@nestjs/common";
import { GroupMembershipPolicy } from "../groups/group-membership-policy";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateLocalRulePresetBody } from "./local-rules.schemas";

interface CreateLocalRulePresetInput {
  requesterUserId: string;
  groupId: string;
  input: CreateLocalRulePresetBody;
}

interface ListLocalRulePresetsInput {
  requesterUserId: string;
  groupId: string;
}

@Injectable()
export class LocalRulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipPolicy: GroupMembershipPolicy = new GroupMembershipPolicy(
      prisma,
    ),
  ) {}

  async createPreset({
    requesterUserId,
    groupId,
    input,
  }: CreateLocalRulePresetInput) {
    await this.membershipPolicy.assertMember({
      groupId,
      userId: requesterUserId,
    });

    return this.prisma.localRulePreset.create({
      data: {
        groupId,
        name: input.name,
        type: input.type,
        threshold: input.threshold ?? null,
      },
    });
  }

  async listPresets({ requesterUserId, groupId }: ListLocalRulePresetsInput) {
    await this.membershipPolicy.assertMember({
      groupId,
      userId: requesterUserId,
    });

    return this.prisma.localRulePreset.findMany({
      where: {
        groupId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }
}
