import { z } from "zod";

export const KRWAmountSchema = z.number().finite();

export const RoundingUnitSchema = z.union([
  z.literal(1),
  z.literal(10),
  z.literal(100)
]);

export type RoundingUnit = z.infer<typeof RoundingUnitSchema>;

