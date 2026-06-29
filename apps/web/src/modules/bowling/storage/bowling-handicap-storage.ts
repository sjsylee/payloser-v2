const bowlingHandicapStorageKey = "payloser:bowling-handicaps";

type BowlingHandicapStorage = Pick<
  Storage,
  "getItem" | "removeItem" | "setItem"
>;

function getDefaultStorage(): BowlingHandicapStorage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function filterSavedBowlingHandicaps({
  memberIds,
  savedHandicaps,
}: {
  memberIds: string[];
  savedHandicaps: Record<string, string>;
}) {
  return Object.fromEntries(
    memberIds
      .map((memberId) => [memberId, savedHandicaps[memberId]] as const)
      .filter(
        (entry): entry is readonly [string, string] =>
          Boolean(entry[1]) && Number(entry[1]) > 0,
      ),
  );
}

export function readSavedBowlingHandicaps(
  memberIds: string[],
  storage: BowlingHandicapStorage | null = getDefaultStorage(),
) {
  if (!storage) {
    return {};
  }

  try {
    const parsed = JSON.parse(
      storage.getItem(bowlingHandicapStorageKey) ?? "{}",
    ) as Record<string, string>;

    return filterSavedBowlingHandicaps({
      memberIds,
      savedHandicaps: parsed,
    });
  } catch {
    storage.removeItem(bowlingHandicapStorageKey);
    return {};
  }
}

export function writeSavedBowlingHandicap(
  memberId: string,
  value: string | null,
  storage: BowlingHandicapStorage | null = getDefaultStorage(),
) {
  if (!storage) {
    return;
  }

  let saved: Record<string, string> = {};

  try {
    saved = JSON.parse(
      storage.getItem(bowlingHandicapStorageKey) ?? "{}",
    ) as Record<string, string>;
  } catch {
    saved = {};
  }

  if (value && Number(value) > 0) {
    saved[memberId] = value;
  } else {
    delete saved[memberId];
  }

  storage.setItem(bowlingHandicapStorageKey, JSON.stringify(saved));
}
