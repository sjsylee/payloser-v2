import { z } from "zod";

export const CreateRpsRecordBodySchema = z.object({
  groupId: z.string().uuid(),
  loserMemberId: z.string().uuid(),
  loserHand: z.enum(["ROCK", "PAPER", "SCISSORS"]),
  context: z.string().trim().min(1).max(80),
  memo: z.string().trim().max(500).optional(),
  occurredAt: z.string().datetime().optional()
});

export type CreateRpsRecordBody = z.infer<typeof CreateRpsRecordBodySchema>;
