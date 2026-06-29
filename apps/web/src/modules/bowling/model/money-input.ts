import { parseAmount } from "./bowling-draft";
import { formatNumber } from "../../../shared/model/number-format";

export function formatAmountInput(value: string) {
  const numericValue = String(Math.max(0, Math.round(parseAmount(value))));

  if (numericValue === "0" && value.trim() === "") {
    return "";
  }

  return formatNumber(Number(numericValue));
}

export function normalizeAmountInput(value: string) {
  return value.replace(/[^\d]/g, "");
}
