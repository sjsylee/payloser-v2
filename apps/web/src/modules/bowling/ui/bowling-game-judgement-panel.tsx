"use client";

import { motion } from "framer-motion";
import type { ApiGroupMember } from "@/adapters/payloser-api";
import type {
  BowlingGameMode,
  BowlingGamePreview,
  BowlingResultInputMode,
} from "@/modules/bowling/model/bowling-draft";
import { getTeamDisplayName } from "@/modules/bowling/model/bowling-view";
import { formatStack } from "@/shared/model/number-format";

export function BowlingGameJudgementPanel({
  members,
  mode,
  preview,
  resultInputMode,
}: {
  members: ApiGroupMember[];
  mode: BowlingGameMode;
  preview: BowlingGamePreview | null;
  resultInputMode: BowlingResultInputMode;
}) {
  return (
    <>
      {preview && mode === "team" ? (
        <div className="rounded-[24px] bg-[#F4F0E8] p-2.5">
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <p className="text-xs font-black text-ink/45">판정표</p>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-black text-ink/45">
              {preview.teamSummaries.length}팀
            </span>
          </div>
          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${preview.teamSummaries.length}, minmax(0, 1fr))`,
            }}
          >
            {[...preview.teamSummaries]
              .sort((left, right) => left.rank - right.rank)
              .map((team) => {
                const isFirst = team.rank === 1;
                const isLast = team.rank === preview.teamSummaries.length;
                const mood = isFirst
                  ? {
                      badge: "무사 귀가",
                      card: "bg-[#FEE500] text-ink",
                      chip: "bg-white/70 text-ink",
                    }
                  : isLast
                    ? {
                        badge: "지갑 출전",
                        card: "bg-ink text-white",
                        chip: "bg-[#FEE500] text-ink",
                      }
                    : {
                        badge: "한 스택 탑승",
                        card: "bg-white text-ink",
                        chip: "bg-[#F4F0E8] text-ink/60",
                      };

                return (
                  <motion.div
                    key={team.teamId}
                    layout
                    className={`min-h-[104px] overflow-hidden rounded-[22px] p-2.5 shadow-sm ${mood.card}`}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${mood.chip}`}
                      >
                        {team.rank}
                      </span>
                      <span className="rounded-full bg-black/10 px-2 py-1 text-[10px] font-black opacity-70">
                        {getTeamDisplayName(team.teamId)}
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-black leading-none">
                      {team.rank}등
                    </p>
                    <p className="mt-1 text-[11px] font-black opacity-65">
                      {mood.badge}
                    </p>
                    <p className="mt-2 line-clamp-1 text-[10px] font-black opacity-45">
                      {resultInputMode === "rank"
                        ? "직접 입력"
                        : `보정 ${team.normalizedScore}`}
                    </p>
                  </motion.div>
                );
              })}
          </div>
        </div>
      ) : null}
      {preview?.soloSummaries && mode === "solo" ? (
        <div className="grid grid-cols-2 gap-2">
          {preview.soloSummaries
            .filter(
              (summary) =>
                summary.stacks > 0 || summary.rank === members.length,
            )
            .map((summary) => {
              const member = members.find(
                (candidate) => candidate.id === summary.memberId,
              );

              return (
                <div
                  key={summary.memberId}
                  className="rounded-[22px] bg-ink p-3 text-white"
                >
                  <p className="truncate text-xs font-black text-white/45">
                    {summary.rank}등 · {member?.displayName ?? "멤버"}
                  </p>
                  <p className="mt-1 text-sm font-black text-[#FEE500]">
                    {formatStack(summary.stacks)}스택
                  </p>
                  <p className="mt-1 text-xs font-bold text-white/45">
                    {summary.score}점
                  </p>
                </div>
              );
            })}
        </div>
      ) : null}
    </>
  );
}
