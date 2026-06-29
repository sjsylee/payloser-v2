import { z } from "zod";

export const DevLoginBodySchema = z.object({
  nickname: z.string().trim().min(1).max(40),
  profileImageUrl: z.string().url().nullable().optional(),
});

export type DevLoginBody = z.infer<typeof DevLoginBodySchema>;
