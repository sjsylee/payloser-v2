import { z } from "zod";

export const BowlingStackAllocationSchema = z.object({
  memberId: z.string().uuid(),
  stacks: z.number().nonnegative(),
  reason: z.string().trim().min(1).max(80),
});

export const BowlingScoreSchema = z.object({
  memberId: z.string().uuid(),
  score: z.number().int().min(0).max(300),
});

export const BowlingSettlementDetailSchema = z.object({
  participantMemberIds: z.array(z.string().uuid()).min(1).max(20),
  games: z
    .array(
      z.object({
        stackAllocations: z.array(BowlingStackAllocationSchema).min(1).max(80),
        scores: z.array(BowlingScoreSchema).max(20).optional(),
      }),
    )
    .max(30),
});

export const CreateUnlimitedBowlingSettlementBodySchema = z
  .object({
    groupId: z.string().uuid(),
    payerMemberId: z.string().uuid(),
    title: z.string().trim().min(1).max(80),
    totalAmount: z.number().int().positive(),
    roundingUnit: z.union([z.literal(1), z.literal(10), z.literal(100)]),
    occurredAt: z.string().datetime().optional(),
    games: z
      .array(
        z.object({
          stackAllocations: z
            .array(BowlingStackAllocationSchema)
            .min(1)
            .max(80),
        }),
      )
      .min(1)
      .max(30),
    details: BowlingSettlementDetailSchema.optional(),
  })
  .superRefine((input, context) => {
    if (input.totalAmount % input.roundingUnit !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "totalAmount must be divisible by roundingUnit.",
        path: ["totalAmount"],
      });
    }
  });

export type CreateUnlimitedBowlingSettlementBody = z.infer<
  typeof CreateUnlimitedBowlingSettlementBodySchema
>;
