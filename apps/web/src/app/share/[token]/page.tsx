import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowRight, ReceiptText, Trophy } from "lucide-react";
import type { PublicSharedSessionResponse } from "@/adapters/payloser-api";
import {
  formatStack,
  formatWon,
} from "@/modules/settlement/model/settlement-view";
import { BowlingIcon } from "@/shared/ui/sport-icons";

type SharePageProps = {
  params: Promise<{
    token: string;
  }>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const session = await fetchPublicSession(token);
  const origin = await getRequestOrigin();

  if (!session) {
    return {
      title: "정산표를 찾을 수 없어요 | Payloser",
      robots: {
        follow: false,
        index: false,
      },
    };
  }

  const title = `${session.group.name} 정산표 도착`;
  const description = `${session.summary.participantCount}명 · ${formatWon(
    session.summary.totalAmount,
  )}`;

  return {
    title,
    description,
    metadataBase: new URL(origin),
    openGraph: {
      title,
      description,
      type: "website",
      url: `/share/${token}`,
    },
    robots: {
      follow: false,
      index: false,
    },
  };
}

export default async function ShareResultPage({ params }: SharePageProps) {
  const { token } = await params;
  const session = await fetchPublicSession(token);

  if (!session) {
    notFound();
  }

  const costRows = [...session.participants].sort((left, right) => {
    if (right.amount !== left.amount) {
      return right.amount - left.amount;
    }

    return (right.stacks ?? -1) - (left.stacks ?? -1);
  });
  const stackRows = [...session.participants].sort((left, right) => {
    if ((right.stacks ?? -1) !== (left.stacks ?? -1)) {
      return (right.stacks ?? -1) - (left.stacks ?? -1);
    }

    return right.amount - left.amount;
  });

  return (
    <main className="min-h-svh bg-[#B7C6BE] px-4 py-5 text-ink">
      <div className="mx-auto flex min-h-[calc(100svh-40px)] w-full max-w-[480px] flex-col overflow-hidden rounded-[34px] bg-[#F4F0E8] shadow-2xl">
        <section className="relative overflow-hidden bg-ink px-6 pb-7 pt-6 text-white">
          <div className="absolute -right-14 top-8 h-36 w-36 rounded-full border-[18px] border-white/10" />
          <div className="absolute right-10 top-6 h-20 w-20 rounded-full bg-[#2F806F]/25 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#FEE500]">
              <BowlingIcon className="h-8 w-8" />
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/70">
              {session.group.name}
            </span>
          </div>
          <div className="relative mt-8">
            <p className="text-xs font-black text-[#FEE500]">
              {dateFormat.format(new Date(session.occurredAt))}
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight">
              오늘 정산표
              <br />
              도착했어요
            </h1>
            <p className="mt-3 text-sm font-bold leading-6 text-white/62">
              누가 얼마나 부담했는지, 계산 근거까지 한 번에 확인해요.
            </p>
          </div>
        </section>

        <section className="space-y-3 px-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            <SummaryTile
              label="참여"
              value={`${session.summary.participantCount}명`}
            />
            <SummaryTile
              label="총액"
              value={formatWon(session.summary.totalAmount)}
            />
            <SummaryTile
              label="총스택"
              value={
                session.summary.totalStacks === null
                  ? "-"
                  : `${formatStack(session.summary.totalStacks)}스택`
              }
            />
          </div>

          <RankSection label="비용 순위" rows={costRows} type="amount" />
          <RankSection label="스택 순위" rows={stackRows} type="stack" />

          <div className="rounded-[26px] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F0E8]">
                <ReceiptText className="h-5 w-5 text-lane" />
              </div>
              <div>
                <p className="text-sm font-black">계산 기준</p>
                <p className="mt-1 text-xs font-bold text-ink/45">
                  이 링크는 읽기 전용으로만 열립니다.
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-[20px] bg-[#F4F0E8] p-3 text-xs font-bold leading-5 text-ink/55">
              정산 상세는 저장된 기록을 기준으로 보여주며, 그룹 내부 멤버 ID나
              세션 정보는 공개하지 않습니다.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white p-3 shadow-sm">
      <p className="text-[11px] font-black text-ink/42">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function RankSection({
  label,
  rows,
  type,
}: {
  label: string;
  rows: PublicSharedSessionResponse["participants"];
  type: "amount" | "stack";
}) {
  return (
    <div className="rounded-[26px] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black">{label}</p>
        <Trophy className="h-5 w-5 text-[#FEE500]" />
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((row, index) => (
          <div
            key={`${label}-${row.displayName}-${index}`}
            className="flex min-h-14 items-center gap-3 rounded-[20px] bg-[#F4F0E8] p-2.5"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-black ${
                index === 0 ? "bg-[#FEE500]" : "bg-white"
              }`}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">{row.displayName}</p>
              <p className="mt-0.5 text-[11px] font-bold text-ink/42">
                {row.averageScore === null
                  ? "평균 점수 없음"
                  : `평균 ${row.averageScore}점`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-right">
              <p className="text-sm font-black">
                {type === "amount"
                  ? formatWon(row.amount)
                  : row.stacks === null
                    ? "-"
                    : `${formatStack(row.stacks)}스택`}
              </p>
              <ArrowRight className="h-4 w-4 text-ink/25" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function fetchPublicSession(token: string) {
  const response = await fetch(`${API_BASE_URL}/share/sessions/${token}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PublicSharedSessionResponse;
}

async function getRequestOrigin() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";

  if (host) {
    return `${protocol}://${host}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3002";
}
