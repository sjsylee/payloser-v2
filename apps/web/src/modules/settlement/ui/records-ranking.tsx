import { AnimatePresence, motion } from "framer-motion";
import {
  History,
  Medal,
  Plus,
  Share2,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "@/adapters/payloser-api";
import type {
  ApiGroupMember,
  BowlingSettlementResponse,
} from "@/adapters/payloser-api";
import { BowlingIcon } from "@/shared/ui/sport-icons";
import type { BurdenRow } from "@/shared/fixtures/app-fixtures";
import { MemberProfileAvatar } from "@/modules/group/ui/group-avatars";
import {
  buildBowlingRecordDetailView,
  formatStack,
  formatWon,
} from "@/modules/settlement/model/settlement-view";
import type {
  BowlingRecordDetailRow,
  RecordItem,
} from "@/modules/settlement/model/settlement-view";
import { sendKakaoTextShare } from "@/shared/kakao/kakao-share";

const DELETE_CONFIRM_TEXT = "기록 삭제";

export function RecordsTab({
  canDeleteRecords,
  groupName,
  members,
  onDeleteBowlingRecord,
  records: recordRows,
}: {
  canDeleteRecords: boolean;
  groupName: string;
  members: ApiGroupMember[];
  onDeleteBowlingRecord: (sessionId: string) => Promise<boolean>;
  records: RecordItem[];
}) {
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [settlement, setSettlement] =
    useState<BowlingSettlementResponse | null>(null);
  const [loadingRecordId, setLoadingRecordId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const openRecord = async (record: RecordItem) => {
    if (record.kind !== "bowling") {
      return;
    }

    setSelectedRecord(record);
    setSettlement(null);
    setDetailError(null);
    setLoadingRecordId(record.id);

    try {
      const nextSettlement = await api.getBowlingSessionSettlement(record.id);

      setSettlement(nextSettlement);
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "기록 상세를 불러오지 못했습니다.",
      );
    } finally {
      setLoadingRecordId(null);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-ink/45">최근 기록</p>
            <h2 className="text-xl font-black">오늘 쌓인 내역</h2>
          </div>
          <History className="h-6 w-6 text-lane" />
        </div>
      </section>

      <section className="space-y-2">
        {recordRows.length === 0 ? (
          <div className="rounded-[24px] bg-white p-5 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F0E8]">
              <Plus className="h-5 w-5 text-lane" />
            </div>
            <p className="mt-3 text-sm font-black">아직 쌓인 기록이 없어요</p>
            <p className="mt-1 text-xs font-bold text-ink/45">
              정산 탭에서 첫 판부터 저장하면 여기에 바로 나타납니다.
            </p>
          </div>
        ) : (
          recordRows.map((record) => (
            <button
              key={record.id}
              onClick={() => void openRecord(record)}
              className="flex min-h-20 w-full items-center gap-3 rounded-[24px] bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F0E8]">
                {record.kind === "bowling" ? (
                  <BowlingIcon className="h-6 w-6" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{record.title}</p>
                <p className="mt-1 truncate text-xs font-bold text-ink/45">
                  {record.meta}
                </p>
              </div>
              <p className="text-sm font-black">{record.value}</p>
            </button>
          ))
        )}
      </section>
      <BowlingRecordDetailSheet
        canDelete={canDeleteRecords}
        errorMessage={detailError}
        groupName={groupName}
        loading={Boolean(loadingRecordId)}
        members={members}
        onClose={() => {
          setSelectedRecord(null);
          setSettlement(null);
          setDetailError(null);
        }}
        onDelete={async (recordId) => {
          const deleted = await onDeleteBowlingRecord(recordId);

          if (deleted) {
            setSelectedRecord(null);
            setSettlement(null);
            setDetailError(null);
          }
        }}
        open={Boolean(selectedRecord)}
        record={selectedRecord}
        settlement={settlement}
      />
    </div>
  );
}

function BowlingRecordDetailSheet({
  canDelete,
  errorMessage,
  groupName,
  loading,
  members,
  onClose,
  onDelete,
  open,
  record,
  settlement,
}: {
  canDelete: boolean;
  errorMessage: string | null;
  groupName: string;
  loading: boolean;
  members: ApiGroupMember[];
  onClose: () => void;
  onDelete: (recordId: string) => Promise<void>;
  open: boolean;
  record: RecordItem | null;
  settlement: BowlingSettlementResponse | null;
}) {
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const detail = useMemo(
    () =>
      record && settlement
        ? buildBowlingRecordDetailView({
            groupName,
            members,
            record,
            settlement,
          })
        : null,
    [groupName, members, record, settlement],
  );

  const shareDetail = async () => {
    if (!detail) {
      return;
    }

    let shared = false;

    try {
      shared = await sendKakaoTextShare({
        buttonTitle: "기록 보기",
        description: `${detail.participantCount}명 · ${formatWon(detail.totalAmount)}`,
        title: record?.title ?? "볼링 기록",
        url: window.location.href,
      });
    } catch {
      shared = false;
    }

    if (!shared) {
      await navigator.clipboard.writeText(detail.shareText);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1400);
    }
  };

  const deleteRecord = async () => {
    if (!record || deleteInput !== DELETE_CONFIRM_TEXT || deleting) {
      return;
    }

    setDeleting(true);

    try {
      await onDelete(record.id);
      setDeleteInput("");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[145] flex items-end bg-ink/35 px-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-sm lg:absolute lg:rounded-[32px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            className="max-h-[min(760px,calc(100svh-28px))] w-full overflow-y-auto rounded-[30px] bg-white p-4 shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-ink/45">기록 상세</p>
                <h2 className="mt-1 text-xl font-black">
                  {record?.title ?? "볼링 기록"}
                </h2>
                <p className="mt-1 text-xs font-bold text-ink/45">
                  {record?.meta}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4F0E8] text-ink/55"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loading ? (
              <div className="mt-4 rounded-[24px] bg-[#F4F0E8] p-5 text-center">
                <p className="text-sm font-black">기록 여는 중</p>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-4 rounded-[22px] bg-[#FFF4F1] p-4 text-sm font-black text-strike">
                {errorMessage}
              </div>
            ) : null}

            {detail ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-[26px] bg-ink p-4 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-white/45">
                        참여 인원
                      </p>
                      <p className="mt-1 text-2xl font-black text-[#FEE500]">
                        {detail.participantCount}명
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-white/45">총액</p>
                      <p className="mt-1 text-xl font-black">
                        {formatWon(detail.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-[18px] bg-white/10 p-3">
                      <p className="text-[11px] font-black text-white/42">
                        총스택
                      </p>
                      <p className="mt-1 text-sm font-black">
                        {detail.totalStacks === null
                          ? "기록 없음"
                          : `${formatStack(detail.totalStacks)}스택`}
                      </p>
                    </div>
                    <button
                      onClick={() => void shareDetail()}
                      className="flex items-center justify-center gap-2 rounded-[18px] bg-[#FEE500] p-3 text-xs font-black text-ink transition active:scale-[0.98]"
                    >
                      <Share2 className="h-4 w-4" />
                      {shareCopied ? "복사 완료" : "다시 공유"}
                    </button>
                  </div>
                </div>

                <DetailRankSection
                  label="비용순위"
                  rows={detail.costRows}
                  valueType="amount"
                />
                <DetailRankSection
                  label="스택순위"
                  rows={detail.stackRows}
                  valueType="stack"
                />

                {canDelete ? (
                  <div className="rounded-[24px] bg-[#FFF4F1] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-strike/70">
                          대표 전용
                        </p>
                        <p className="text-sm font-black">기록 삭제</p>
                      </div>
                      <Trash2 className="h-5 w-5 text-strike" />
                    </div>
                    <p className="mt-2 text-xs font-bold text-ink/50">
                      삭제하려면 `{DELETE_CONFIRM_TEXT}`를 입력하세요.
                    </p>
                    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_78px] gap-2">
                      <input
                        value={deleteInput}
                        onChange={(event) => setDeleteInput(event.target.value)}
                        placeholder={DELETE_CONFIRM_TEXT}
                        className="h-11 min-w-0 rounded-[17px] border-0 bg-white px-3 text-sm font-black outline-none"
                      />
                      <button
                        onClick={() => void deleteRecord()}
                        disabled={
                          deleteInput !== DELETE_CONFIRM_TEXT || deleting
                        }
                        className="h-11 rounded-[17px] bg-strike text-xs font-black text-white transition active:scale-[0.98] disabled:opacity-35"
                      >
                        {deleting ? "삭제 중" : "삭제"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DetailRankSection({
  label,
  rows,
  valueType,
}: {
  label: string;
  rows: BowlingRecordDetailRow[];
  valueType: "amount" | "stack";
}) {
  return (
    <div className="rounded-[24px] bg-[#F4F0E8] p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black">{label}</p>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-ink/45">
          {rows.length}명
        </span>
      </div>
      <div className="mt-2 space-y-2">
        {rows.map((row, index) => (
          <div
            key={`${label}-${row.memberId}`}
            className="flex min-h-14 items-center gap-2 rounded-[20px] bg-white p-2"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-black ${
                index === 0 ? "bg-[#FEE500]" : "bg-[#F4F0E8]"
              }`}
            >
              {index + 1}
            </span>
            {row.member ? (
              <MemberProfileAvatar member={row.member} size="sm" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{row.name}</p>
              <p className="text-[11px] font-bold text-ink/42">
                {row.averageScore === null
                  ? "평균 점수 없음"
                  : `평균 ${row.averageScore}점`}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-black">
                {valueType === "amount"
                  ? formatWon(row.amount)
                  : row.stacks === null
                    ? "-"
                    : `${formatStack(row.stacks)}스택`}
              </p>
              {valueType === "amount" && row.stacks !== null ? (
                <p className="text-[10px] font-black text-ink/35">
                  {formatStack(row.stacks)}스택
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RankingTab({
  ranking,
}: {
  ranking: Array<BurdenRow & { rank: number }>;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-ink/45">누적 부담</p>
            <h2 className="text-xl font-black">누가 제일 많이 냈나</h2>
          </div>
          <WalletCards className="h-6 w-6 text-lane" />
        </div>
        <div className="mt-4 rounded-[20px] bg-[#F4F0E8] px-4 py-3">
          <p className="text-sm font-black">볼링 누적 부담액</p>
          <p className="mt-1 text-xs font-bold text-ink/45">
            기록된 정산 기준으로 누적됩니다.
          </p>
        </div>
      </section>

      <section className="space-y-2">
        {ranking.map((row) => {
          const max = ranking[0]?.bowling || 1;
          const width = `${Math.max(10, (row.bowling / max) * 100)}%`;

          return (
            <div
              key={row.name}
              className="rounded-[24px] bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4F0E8]">
                  {row.rank === 1 ? (
                    <Medal className="h-5 w-5 text-strike" />
                  ) : (
                    <span className="text-sm font-black">{row.rank}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black">{row.name}</p>
                    <p className="text-sm font-black">
                      {formatWon(row.bowling)}
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F4F0E8]">
                    <motion.div
                      className="h-full rounded-full bg-[#FEE500]"
                      initial={{ width: "10%" }}
                      animate={{ width }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 28,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
