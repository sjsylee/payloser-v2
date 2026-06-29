import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("product UI copy guard", () => {
  it("keeps internal planning language out of the visible app surface", () => {
    const forbiddenInternalCopy = [
      "MVP",
      "mvp",
      "우선",
      "후에",
      "나중",
      "임시",
      "TODO",
    ];

    for (const copy of forbiddenInternalCopy) {
      expect(pageSource).not.toContain(copy);
    }
  });

  it("keeps deferred activities out of the bowling-focused MVP screen", () => {
    const deferredActivityCopy = ["야구", "스크린야구"];

    for (const copy of deferredActivityCopy) {
      expect(pageSource).not.toContain(copy);
    }
  });
});
