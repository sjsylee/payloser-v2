import { filterValidBowlingAmountPresets } from "../model/bowling-draft";

const bowlingAmountPresetsStorageKey = "payloser:bowling-amount-presets";

type BowlingAmountPresetsStorage = Pick<
  Storage,
  "getItem" | "removeItem" | "setItem"
>;

function getDefaultStorage(): BowlingAmountPresetsStorage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function readSavedBowlingAmountPresets(
  storage: BowlingAmountPresetsStorage | null = getDefaultStorage(),
) {
  if (!storage) {
    return [];
  }

  const savedPresets = storage.getItem(bowlingAmountPresetsStorageKey);

  if (!savedPresets) {
    return [];
  }

  try {
    return filterValidBowlingAmountPresets(JSON.parse(savedPresets));
  } catch {
    storage.removeItem(bowlingAmountPresetsStorageKey);
    return [];
  }
}

export function writeSavedBowlingAmountPresets(
  presets: string[],
  storage: BowlingAmountPresetsStorage | null = getDefaultStorage(),
) {
  if (!storage) {
    return;
  }

  storage.setItem(bowlingAmountPresetsStorageKey, JSON.stringify(presets));
}
