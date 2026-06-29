import { z } from "zod";

export const LocalRulePresetTypeSchema = z.enum([
  "UNDER_SCORE_SOLO",
  "TEAM_INTERNAL_LAST_SOLO",
  "MANUAL_SOLO"
]);

export const CreateLocalRulePresetBodySchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    type: LocalRulePresetTypeSchema,
    threshold: z.number().int().min(0).max(300).optional()
  })
  .superRefine((input, context) => {
    if (input.type === "UNDER_SCORE_SOLO" && input.threshold === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["threshold"],
        message: "threshold is required for UNDER_SCORE_SOLO."
      });
    }
  });

export type CreateLocalRulePresetBody = z.infer<typeof CreateLocalRulePresetBodySchema>;
