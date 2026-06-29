import type {
  BowlingSettlementResponse,
  ApiGroupMember,
  GroupRecentRecord,
} from "@/adapters/payloser-api";
import { formatStack, formatWon } from "../../../shared/model/number-format";
export {
  formatNumber,
  formatStack,
  formatWon,
} from "../../../shared/model/number-format";

export type RecordKind = "bowling" | "rps";

export type RecordItem = {
  id: string;
  title: string;
  meta: string;
  value: string;
  kind: RecordKind;
};

export type TransferRow = {
  memberId: string;
  name: string;
  toName: string;
  amount: number;
  meta: string;
};

export type BowlingRecordDetailRow = {
  amount: number;
  averageScore: number | null;
  member: ApiGroupMember | null;
  memberId: string;
  name: string;
  stacks: number | null;
};

export type BowlingRecordDetailView = {
  costRows: BowlingRecordDetailRow[];
  participantCount: number;
  shareText: string;
  stackRows: BowlingRecordDetailRow[];
  totalAmount: number;
  totalStacks: number | null;
};

const recordDateFormat = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function mapRecentRecord(record: GroupRecentRecord): RecordItem {
  const kind: RecordKind = record.activity === "BOWLING" ? "bowling" : "rps";
  const label = kind === "bowling" ? "볼링" : "가위바위보";
  const occurredAt = recordDateFormat.format(new Date(record.occurredAt));

  return {
    id: record.id,
    title: record.title,
    meta: `${label} · ${occurredAt}`,
    value:
      kind === "rps"
        ? `${record.rpsLossCount}회`
        : formatWon(record.totalAmount),
    kind,
  };
}

export function buildTransferRows({
  bowlingSettlement,
  members,
}: {
  bowlingSettlement: BowlingSettlementResponse | null;
  members: Array<{ id: string; displayName: string }>;
}): TransferRow[] {
  const memberNames = new Map(
    members.map((member) => [member.id, member.displayName]),
  );
  const rows = new Map<string, TransferRow & { metaParts: string[] }>();

  const addRequests = (
    requests: Array<{
      fromMemberId: string;
      toMemberId: string;
      amount: number;
    }>,
    meta: string,
  ) => {
    for (const request of requests) {
      const existing = rows.get(request.fromMemberId);

      if (existing) {
        existing.amount += request.amount;
        existing.metaParts.push(meta);
        existing.meta = existing.metaParts.join(" + ");
        continue;
      }

      rows.set(request.fromMemberId, {
        memberId: request.fromMemberId,
        name: memberNames.get(request.fromMemberId) ?? "멤버",
        toName: memberNames.get(request.toMemberId) ?? "결제자",
        amount: request.amount,
        meta,
        metaParts: [meta],
      });
    }
  };

  if (bowlingSettlement) {
    addRequests(bowlingSettlement.recovery.requests, "볼링 정산");
  }

  return [...rows.values()].map(({ metaParts: _metaParts, ...row }) => row);
}

export function buildShareText(groupName: string, rows: TransferRow[]) {
  if (rows.length === 0) {
    return "";
  }

  return [
    `[${groupName} 정산]`,
    ...rows.map(
      (row) =>
        `${row.name} → ${row.toName} ${formatWon(row.amount)} (${row.meta})`,
    ),
    "계산 근거는 Payloser 기록 탭에서 확인",
  ].join("\n");
}

export function buildBowlingRecordDetailView({
  groupName,
  members,
  record,
  settlement,
}: {
  groupName: string;
  members: ApiGroupMember[];
  record: RecordItem;
  settlement: BowlingSettlementResponse;
}): BowlingRecordDetailView {
  const memberById = new Map(members.map((member) => [member.id, member]));
  const burdenByMember = new Map(
    settlement.settlement.burdens.map((burden) => [
      burden.memberId,
      burden.roundedAmount,
    ]),
  );
  const stackByMember = new Map<string, number>();
  const scoresByMember = new Map<string, number[]>();

  for (const game of settlement.details?.games ?? []) {
    for (const allocation of game.stackAllocations) {
      stackByMember.set(
        allocation.memberId,
        (stackByMember.get(allocation.memberId) ?? 0) + allocation.stacks,
      );
    }

    for (const score of game.scores ?? []) {
      const scores = scoresByMember.get(score.memberId) ?? [];

      scores.push(score.score);
      scoresByMember.set(score.memberId, scores);
    }
  }

  const participantIds = settlement.details?.participantMemberIds.length
    ? settlement.details.participantMemberIds
    : [
        ...new Set([
          ...settlement.settlement.burdens.map((burden) => burden.memberId),
        ]),
      ];
  const rows = participantIds.map((memberId) => {
    const member = memberById.get(memberId) ?? null;
    const scores = scoresByMember.get(memberId) ?? [];
    const averageScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length,
          )
        : null;

    return {
      amount: burdenByMember.get(memberId) ?? 0,
      averageScore,
      member,
      memberId,
      name: member?.displayName ?? "멤버",
      stacks: stackByMember.has(memberId)
        ? (stackByMember.get(memberId) ?? 0)
        : null,
    };
  });
  const costRows = [...rows].sort((left, right) => {
    if (right.amount !== left.amount) {
      return right.amount - left.amount;
    }

    return (right.stacks ?? -1) - (left.stacks ?? -1);
  });
  const stackRows = [...rows].sort((left, right) => {
    if ((right.stacks ?? -1) !== (left.stacks ?? -1)) {
      return (right.stacks ?? -1) - (left.stacks ?? -1);
    }

    return right.amount - left.amount;
  });
  const totalAmount =
    settlement.settlement.totalAmount ??
    settlement.expenseItem?.totalAmount ??
    rows.reduce((sum, row) => sum + row.amount, 0);
  const totalStacks =
    settlement.details?.totalStacks ??
    settlement.settlement.totalStacks ??
    null;
  const shareText = [
    `[${groupName} 기록]`,
    record.title,
    ...costRows
      .filter((row) => row.amount > 0 || (row.stacks ?? 0) > 0)
      .map((row, index) => {
        const stackText =
          row.stacks === null
            ? "스택 기록 없음"
            : `${formatStack(row.stacks)}스택`;

        return `${index + 1}. ${row.name} ${formatWon(row.amount)} · ${stackText}`;
      }),
  ].join("\n");

  return {
    costRows,
    participantCount: participantIds.length,
    shareText,
    stackRows,
    totalAmount,
    totalStacks,
  };
}
