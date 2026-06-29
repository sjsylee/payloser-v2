import { z } from "zod";

export const CreateScreenBaseballSettlementBodySchema = z.object({
  groupId: z.string().uuid(),
  payerMemberId: z.string().uuid(),
  loserMemberIds: z.array(z.string().uuid()).min(1),
  title: z.string().trim().min(1).max(80),
  totalAmount: z.number().int().positive(),
  occurredAt: z.string().datetime().optional()
});

export type CreateScreenBaseballSettlementBody = z.infer<
  typeof CreateScreenBaseballSettlementBodySchema
>;
