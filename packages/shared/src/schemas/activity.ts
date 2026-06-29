import { z } from "zod";

export const ActivityTypeSchema = z.enum([
  "BOWLING",
  "SCREEN_BASEBALL",
  "ROCK_PAPER_SCISSORS"
]);

export const ExpenseKindSchema = z.enum([
  "BETTING_BURDEN",
  "GENERAL_PARTICIPATION",
  "LOCAL_RULE_SOLO",
  "SIDE_BET"
]);

export type ActivityType = z.infer<typeof ActivityTypeSchema>;
export type ExpenseKind = z.infer<typeof ExpenseKindSchema>;

