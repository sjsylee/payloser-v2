"use client";

import { motion } from "framer-motion";
import { WalletCards } from "lucide-react";
import type { ApiGroupMember } from "@/adapters/payloser-api";
import type { BowlingGamePreview } from "@/modules/bowling/model/bowling-draft";
import { parseAmount } from "@/modules/bowling/model/bowling-draft";
import { getTeamDisplayName } from "@/modules/bowling/model/bowling-view";
import { formatStack, formatWon } from "@/shared/model/number-format";

export function BowlingReviewStep({
  gamePreviews,
  gameCount,
  members,
  perPersonAmount,
  preview,
  shoesIncluded,
  totalStacks,
  unitAmount,
}: {
  gamePreviews: Array<{
    gameId: string;
    preview: BowlingGamePreview | null;
  }>;
  gameCount: number;
  members: ApiGroupMember[];
  perPersonAmount: string;
  preview: BowlingGamePreview | null;
  shoesIncluded: boolean;
  totalStacks: number;
  unitAmount: number;
}) {
  const payerRows = members
    .map((member) => {
      const stacks = gamePreviews.reduce((sum, game) => {
        const memberStacks =
          game.preview?.allocations
            .filter((allocation) => allocation.memberId === member.id)
            .reduce(
              (stackSum, allocation) => stackSum + allocation.stacks,
              0,
            ) ?? 0;

        return sum + memberStacks;
      }, 0);

      return {
        amount: Math.round(stacks * unitAmount),
        memberId: member.id,
        name: member.displayName,
        stacks,
      };
    })
    .filter((row) => row.stacks > 0)
    .sort((left, right) => {
      if (right.amount !== left.amount) {
        return right.amount - left.amount;
      }

      return right.stacks - left.stacks;
    });
  const topPayer = payerRows[0];
  const stackBadges = ["지갑 타격왕", "스택 수집가", "오늘 좀 맞음"];
  const previewSummary = preview?.soloSummaries
    ? preview.soloSummaries
        .filter((summary) => summary.stacks > 0)
        .map(
          (summary) => `${summary.rank}등 ${formatStack(summary.stacks)}스택`,
        )
        .join(" · ") || "개인전 스택 없음"
    : preview?.teamSummaries.length
      ? preview.teamSummaries
          .map((team) => `${getTeamDisplayName(team.teamId)} ${team.rank}등`)
          .join(" · ")
      : "판 정보 없음";

  return (
    <motion.div
      key="bowling-review"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between gap-3 rounded-[22px] bg-[#FEE500] p-3">
        <div>
          <p className="text-xs font-black text-ink/45">저장 전 미리보기</p>
          <p className="text-sm font-black">스택 폭탄 순위 확인</p>
        </div>
        <span className="rounded-full bg-ink px-3 py-1 text-xs font-black text-white">
          미등록
        </span>
      </div>
      <div className="rounded-[26px] bg-ink p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black text-white/45">
              오늘의 지갑 타격왕
            </p>
            <p className="mt-1 text-2xl font-black text-[#FEE500]">
              {topPayer ? topPayer.name : "아직 없음"}
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/70">
            {topPayer ? `${formatStack(topPayer.stacks)}스택` : "0스택"}
          </span>
        </div>
        {topPayer ? (
          <div className="mt-3 flex items-center gap-2 rounded-[22px] bg-white/10 p-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FEE500] text-ink">
              <WalletCards className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-black text-white/45">
                예정 부담액
              </p>
              <p className="text-2xl font-black text-[#FEE500]">
                {formatWon(topPayer.amount)}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm font-black">
            팀 배정과 점수를 채우면 순위가 나옵니다.
          </p>
        )}
      </div>
      <div className="space-y-2">
        {payerRows.length > 0 ? (
          payerRows.map((row, index) => (
            <div
              key={row.memberId}
              className="flex min-h-16 items-center gap-3 rounded-[24px] bg-[#F4F0E8] p-3"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black ${
                  index === 0 ? "bg-[#FEE500] text-ink" : "bg-white text-ink"
                }`}
              >
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-black">{row.name}</p>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-ink/55">
                    {stackBadges[index] ?? "스택 탑승"}
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold text-ink/45">
                  {formatStack(row.stacks)}스택 먹고 지갑 출동
                </p>
              </div>
              <div className="shrink-0 rounded-[20px] bg-white px-3 py-2 text-right shadow-sm">
                <p className="flex items-center justify-end gap-1 text-[10px] font-black text-ink/45">
                  <WalletCards className="h-3 w-3" />
                  부담액
                </p>
                <p className="mt-0.5 text-base font-black text-ink">
                  {formatWon(row.amount)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[24px] bg-[#F4F0E8] p-5 text-center">
            <p className="text-sm font-black">아직 맞은 스택이 없어요</p>
            <p className="mt-1 text-xs font-bold text-ink/45">
              판 입력에서 팀과 점수를 채우면 순위가 생깁니다.
            </p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[20px] bg-[#F4F0E8] p-3">
          <p className="text-[11px] font-black text-ink/45">스택 단가</p>
          <p className="mt-1 text-sm font-black">{formatWon(unitAmount)}</p>
        </div>
        <div className="rounded-[20px] bg-[#F4F0E8] p-3">
          <p className="text-[11px] font-black text-ink/45">진행 판</p>
          <p className="mt-1 text-sm font-black">{gameCount}판</p>
        </div>
        <div className="rounded-[20px] bg-[#F4F0E8] p-3">
          <p className="text-[11px] font-black text-ink/45">총스택</p>
          <p className="mt-1 text-sm font-black">
            {formatStack(totalStacks)}스택
          </p>
        </div>
      </div>
      <div className="rounded-[20px] bg-white p-3 shadow-sm">
        <p className="text-xs font-black text-ink/45">계산 기준</p>
        <p className="mt-1 text-xs font-bold text-ink/55">
          인당{" "}
          {formatWon(Math.max(0, Math.round(parseAmount(perPersonAmount))))} ·{" "}
          {shoesIncluded ? "신발값 포함" : "신발값 별도"} · 마지막 판{" "}
          {previewSummary}
        </p>
      </div>
    </motion.div>
  );
}
