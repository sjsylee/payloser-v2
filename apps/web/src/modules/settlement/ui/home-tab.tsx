"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Clipboard,
  History,
  MessageCircle,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { formatWon } from "@/modules/settlement/model/settlement-view";
import type {
  RecordItem,
  TransferRow,
} from "@/modules/settlement/model/settlement-view";
import { KakaoTalkIcon } from "@/shared/ui/kakao-talk-icon";

export function HomeTab({
  errorMessage,
  coverImageUrl,
  groupName,
  latestRecord,
  onCopyShareText,
  onOpenRecords,
  onOpenSettle,
  onShareWithKakao,
  recordCount,
  shareCopied,
  sharePreviewText,
  stackUnit,
  topRanking,
  transferRows,
}: {
  errorMessage: string | null;
  coverImageUrl: string | null | undefined;
  groupName: string | undefined;
  latestRecord: RecordItem | null;
  onCopyShareText: () => Promise<void>;
  onOpenRecords: () => void;
  onOpenSettle: () => void;
  onShareWithKakao: () => Promise<void>;
  recordCount: number;
  shareCopied: boolean;
  sharePreviewText: string | null;
  stackUnit: number;
  topRanking: { bowling: number; name: string; rank: number } | null;
  transferRows: TransferRow[];
}) {
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const hasShareMessage = transferRows.length > 0;
  const transferTotalAmount = transferRows.reduce(
    (sum, row) => sum + row.amount,
    0,
  );

  return (
    <div className="space-y-4">
      <section className="relative isolate overflow-hidden rounded-[32px] bg-ink text-white shadow-sm">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt=""
            className="absolute inset-0 z-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_18%,rgba(254,229,0,0.95),transparent_18%),radial-gradient(circle_at_84%_12%,rgba(47,125,109,0.88),transparent_16%),radial-gradient(circle_at_78%_74%,rgba(232,77,61,0.8),transparent_14%),linear-gradient(135deg,#181716_0%,#27231d_58%,#11100f_100%)]" />
        )}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-ink/20 via-ink/55 to-ink/85" />
        <div className="absolute -right-10 top-20 z-0 h-32 w-32 rounded-full border-[18px] border-white/10" />
        <div className="absolute bottom-5 right-8 z-0 h-3 w-20 rotate-[-10deg] rounded-full bg-[#FEE500]/70" />
        <button
          onClick={onOpenSettle}
          className="group relative z-10 flex min-h-[232px] w-full flex-col p-5 text-left transition active:scale-[0.995]"
        >
          <div className="flex items-start justify-between gap-4">
            <span className="rounded-full bg-[#FEE500] px-3 py-1 text-xs font-black text-ink shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              오늘의 내기
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white/80 backdrop-blur">
              {groupName ?? "내 그룹"}
            </span>
          </div>
          <div className="mt-7">
            <p className="text-xs font-black text-[#FEE500]">
              오늘 진 사람, 계산은 깔끔하게
            </p>
            <h2 className="mt-2 text-[34px] font-black leading-[1.05]">
              오늘 정산
              <br />
              바로 시작
            </h2>
            <div className="mt-6 flex items-center justify-between rounded-[24px] bg-white/95 px-4 py-3 text-ink shadow-[0_16px_34px_rgba(0,0,0,0.22)] backdrop-blur">
              <span>
                <span className="block text-xs font-black text-ink/45">
                  현재 기준 단가
                </span>
                <span className="block text-lg font-black">
                  {formatWon(stackUnit)}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 transition group-active:translate-x-1" />
            </div>
          </div>
        </button>
      </section>

      {errorMessage ? (
        <div className="rounded-[22px] bg-[#FFF4F1] p-4 text-sm font-black text-strike">
          {errorMessage}
        </div>
      ) : null}

      <section className="rounded-[28px] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black text-ink/45">방금 저장한 정산</p>
            <h2 className="mt-1 text-xl font-black">
              {hasShareMessage
                ? "단톡방 메시지 준비됨"
                : "아직 보낼 메시지 없음"}
            </h2>
          </div>
          <MessageCircle
            className={`h-6 w-6 ${hasShareMessage ? "text-lane" : "text-ink/20"}`}
          />
        </div>

        {hasShareMessage ? (
          <>
            <button
              onClick={() => setShareSheetOpen(true)}
              className="mt-4 flex w-full items-center justify-between gap-3 rounded-[24px] bg-[#F4F0E8] p-4 text-left transition active:scale-[0.99]"
            >
              <span>
                <span className="block text-xs font-black text-ink/45">
                  {transferRows.length}명에게 보낼 금액
                </span>
                <span className="mt-1 block text-2xl font-black">
                  {formatWon(transferTotalAmount)}
                </span>
              </span>
              <span className="rounded-full bg-ink px-3 py-2 text-xs font-black text-white">
                메시지 보기
              </span>
            </button>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_92px] gap-2">
              <button
                onClick={() => void onShareWithKakao()}
                className="flex h-12 min-w-0 items-center justify-center gap-2 rounded-[20px] bg-[#FEE500] px-4 text-sm font-black text-ink transition active:scale-[0.99]"
              >
                <KakaoTalkIcon className="h-5 w-5 shrink-0" />
                카톡 공유
              </button>
              <button
                onClick={() => void onCopyShareText()}
                className="flex h-12 items-center justify-center gap-1.5 rounded-[20px] bg-ink px-3 text-xs font-black text-white transition active:scale-[0.99]"
              >
                <Clipboard className="h-4 w-4" />
                {shareCopied ? "완료" : "복사"}
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onOpenSettle}
            className="mt-4 flex h-14 w-full items-center justify-between rounded-[22px] bg-[#F4F0E8] px-4 text-left transition active:scale-[0.99]"
          >
            <span className="text-sm font-black">
              첫 정산을 저장하면 여기에 공유 버튼이 떠요
            </span>
            <ChevronRight className="h-5 w-5 text-ink/35" />
          </button>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button
          onClick={onOpenRecords}
          className="min-h-28 rounded-[26px] bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4F0E8]">
              <History className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-[#F4F0E8] px-2.5 py-1 text-[11px] font-black text-ink/45">
              {recordCount}건
            </span>
          </div>
          <p className="mt-4 text-sm font-black">최근 기록</p>
          <p className="mt-1 line-clamp-1 text-xs font-bold text-ink/45">
            {latestRecord ? latestRecord.title : "저장된 정산 없음"}
          </p>
        </button>

        <button
          onClick={onOpenRecords}
          className="min-h-28 rounded-[26px] bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FEE500]">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-[#F4F0E8] px-2.5 py-1 text-[11px] font-black text-ink/45">
              이번 누적
            </span>
          </div>
          <p className="mt-4 text-sm font-black">지갑 타격왕</p>
          <p className="mt-1 line-clamp-1 text-xs font-bold text-ink/45">
            {topRanking && topRanking.bowling > 0
              ? `${topRanking.name} · ${formatWon(topRanking.bowling)}`
              : "아직 왕좌 비어있음"}
          </p>
        </button>
      </section>

      <AnimatePresence initial={false}>
        {shareSheetOpen ? (
          <motion.div
            key="share-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/35 px-4 backdrop-blur-sm lg:absolute lg:rounded-[32px]"
            onClick={() => setShareSheetOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-[380px] rounded-[30px] bg-white p-4 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-ink/45">정산 메시지</p>
                  <h2 className="text-lg font-black">단톡방에 올릴 내용</h2>
                </div>
                <button
                  onClick={() => setShareSheetOpen(false)}
                  className="h-10 rounded-full bg-[#F4F0E8] px-3 text-xs font-black text-ink/55"
                >
                  닫기
                </button>
              </div>

              <div className="mt-4 rounded-[24px] bg-[#F4F0E8] p-3">
                <div className="flex items-center justify-between text-sm font-black">
                  <span>{transferRows.length}명</span>
                  <span>{formatWon(transferTotalAmount)}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {transferRows.map(({ memberId, name, amount, meta }) => (
                    <div
                      key={memberId}
                      className="flex min-h-14 items-center gap-3 rounded-[18px] bg-white px-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-ink text-xs font-black text-white">
                        {name.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black">{name}</p>
                        <p className="line-clamp-1 text-[11px] font-bold text-ink/42">
                          {meta}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-black">
                        {formatWon(amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {sharePreviewText ? (
                <pre className="mt-3 max-h-[180px] overflow-y-auto whitespace-pre-wrap break-words rounded-[22px] bg-[#FFFDF7] p-3 text-xs font-bold leading-5 text-ink/75">
                  {sharePreviewText}
                </pre>
              ) : null}

              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_92px] gap-2">
                <button
                  onClick={() => void onShareWithKakao()}
                  className="flex h-12 min-w-0 items-center justify-center gap-2 rounded-[20px] bg-[#FEE500] px-4 text-sm font-black text-ink"
                >
                  <KakaoTalkIcon className="h-5 w-5 shrink-0" />
                  카톡 공유
                </button>
                <button
                  onClick={() => void onCopyShareText()}
                  className="flex h-12 items-center justify-center gap-1.5 rounded-[20px] bg-ink px-3 text-xs font-black text-white"
                >
                  <Clipboard className="h-4 w-4" />
                  {shareCopied ? "완료" : "복사"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
