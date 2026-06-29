import { describe, expect, it } from "vitest";
import {
  buildShareText,
  buildTransferRows,
  formatStack,
  formatWon,
  mapRecentRecord,
} from "./settlement-view";
import type {
  BowlingSettlementResponse,
  GroupRecentRecord,
} from "@/adapters/payloser-api";

describe("settlement view", () => {
  it("formats money and stack labels for Korean settlement UI", () => {
    expect(formatWon(120000)).toBe("120,000원");
    expect(formatStack(3)).toBe("3");
    expect(formatStack(2.5)).toBe("2.5");
  });

  it("maps recent group records into render-ready rows", () => {
    const record: GroupRecentRecord = {
      activity: "BOWLING",
      id: "record-1",
      occurredAt: "2026-06-25T06:30:00.000Z",
      rpsLossCount: 0,
      title: "볼링 무제한",
      totalAmount: 120000,
    };

    expect(mapRecentRecord(record)).toMatchObject({
      id: "record-1",
      kind: "bowling",
      title: "볼링 무제한",
      value: "120,000원",
    });
    expect(
      mapRecentRecord({ ...record, activity: "ROCK_PAPER_SCISSORS" }),
    ).toMatchObject({
      kind: "rps",
      value: "0회",
    });
  });

  it("builds transfer rows by aggregating requests per payer", () => {
    const settlement: BowlingSettlementResponse = {
      recovery: {
        payerMemberId: "owner",
        payerReceivableAmount: 30000,
        requests: [
          { amount: 10000, fromMemberId: "m1", toMemberId: "owner" },
          { amount: 20000, fromMemberId: "m1", toMemberId: "owner" },
        ],
      },
      session: {
        activity: "BOWLING",
        id: "session-1",
        title: "볼링 무제한",
      },
      settlement: {
        burdens: [],
        stackUnitPrice: 10000,
        totalStacks: 3,
      },
    };

    expect(
      buildTransferRows({
        bowlingSettlement: settlement,
        members: [
          { displayName: "김민수", id: "owner" },
          { displayName: "강지운", id: "m1" },
        ],
      }),
    ).toEqual([
      {
        amount: 30000,
        memberId: "m1",
        meta: "볼링 정산 + 볼링 정산",
        name: "강지운",
        toName: "김민수",
      },
    ]);
  });

  it("builds share text for group chat paste", () => {
    expect(buildShareText("한강 레인클럽", [])).toBe("");
    expect(
      buildShareText("한강 레인클럽", [
        {
          amount: 30000,
          memberId: "m1",
          meta: "볼링 정산",
          name: "강지운",
          toName: "김민수",
        },
      ]),
    ).toBe(
      [
        "[한강 레인클럽 정산]",
        "강지운 → 김민수 30,000원 (볼링 정산)",
        "계산 근거는 Payloser 기록 탭에서 확인",
      ].join("\n"),
    );
  });
});
