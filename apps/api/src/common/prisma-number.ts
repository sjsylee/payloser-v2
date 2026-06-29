export function toPrismaNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber(): number }).toNumber();
  }

  return Number(value);
}
