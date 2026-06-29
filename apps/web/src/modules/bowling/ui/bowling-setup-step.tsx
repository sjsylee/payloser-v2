"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, WalletCards } from "lucide-react";
import { useState } from "react";
import type { ApiGroupMember } from "@/adapters/payloser-api";
import {
  formatAmountInput,
  normalizeAmountInput,
} from "@/modules/bowling/model/money-input";
import { formatWon } from "@/shared/model/number-format";
import { MemberProfileAvatar } from "@/modules/group/ui/group-avatars";

function ParticipantPickerCard({
  allMembers,
  selectedParticipantIds,
  setParticipantIds,
}: {
  allMembers: ApiGroupMember[];
  selectedParticipantIds: string[];
  setParticipantIds: (memberIds: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedIdSet = new Set(selectedParticipantIds);
  const selectedMembers = allMembers.filter((member) =>
    selectedIdSet.has(member.id),
  );
  const visibleMembers = selectedMembers.slice(0, 4);
  const hiddenMemberCount = Math.max(
    0,
    selectedMembers.length - visibleMembers.length,
  );
  const allMembersSelected =
    allMembers.length > 0 && selectedMembers.length === allMembers.length;
  const toggleMember = (memberId: string) => {
    const nextIds = selectedIdSet.has(memberId)
      ? selectedParticipantIds.filter((id) => id !== memberId)
      : [...selectedParticipantIds, memberId];

    setParticipantIds(nextIds.length > 0 ? nextIds : [memberId]);
  };
  const toggleAllMembers = () => {
    setParticipantIds(
      allMembersSelected ? [] : allMembers.map((member) => member.id),
    );
  };

  return (
    <div className="rounded-[24px] bg-[#F4F0E8] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-ink/45">오늘 참여자</p>
          <p className="text-sm font-black">무제한 볼링 칠 멤버</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="h-10 rounded-[18px] bg-white px-4 text-xs font-black text-ink transition active:scale-[0.98]"
        >
          {selectedMembers.length}명 선택
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {visibleMembers.map((member) => (
          <span
            key={member.id}
            className="flex h-9 items-center gap-1.5 rounded-full bg-white py-0.5 pl-0.5 pr-3 text-xs font-black"
          >
            <MemberProfileAvatar member={member} size="sm" />
            {member.displayName}
          </span>
        ))}
        {hiddenMemberCount > 0 ? (
          <span className="flex h-9 items-center rounded-full bg-ink px-3 text-xs font-black text-white">
            +{hiddenMemberCount}명
          </span>
        ) : null}
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="participant-picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/35 px-4 backdrop-blur-sm lg:absolute lg:rounded-[32px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-[370px] rounded-[28px] bg-white p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-ink/45">오늘 참여자</p>
                  <p className="text-lg font-black">
                    {selectedMembers.length}명 선택됨
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-10 rounded-full bg-[#F4F0E8] px-3 text-xs font-black text-ink/55"
                >
                  닫기
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={toggleAllMembers}
                  className={`col-span-2 h-11 rounded-[18px] text-xs font-black transition active:scale-[0.98] ${
                    allMembersSelected
                      ? "bg-[#F4F0E8] text-ink/62"
                      : "bg-ink text-white"
                  }`}
                >
                  {allMembersSelected ? "모두 해제" : "모두 선택"}
                </button>
                {allMembers.map((member) => {
                  const selected = selectedIdSet.has(member.id);

                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className={`flex min-h-12 items-center gap-2 rounded-[18px] px-3 text-left text-xs font-black transition active:scale-[0.98] ${
                        selected
                          ? "bg-[#FEE500] text-ink"
                          : "bg-[#F4F0E8] text-ink/62"
                      }`}
                    >
                      <MemberProfileAvatar member={member} size="sm" />
                      <span className="min-w-0 flex-1 whitespace-nowrap">
                        {member.displayName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function BowlingSetupStep({
  amountPresets,
  allMembers,
  members,
  memberCount,
  onRememberPreset,
  occurredDate,
  payerMemberId,
  perPersonAmount,
  selectedParticipantIds,
  setOccurredDate,
  setParticipantIds,
  setPayerMemberId,
  setPerPersonAmount,
  setShoesIncluded,
  shoesIncluded,
  totalAmount,
}: {
  amountPresets: string[];
  allMembers: ApiGroupMember[];
  members: ApiGroupMember[];
  memberCount: number;
  onRememberPreset: () => void;
  occurredDate: string;
  payerMemberId: string | null;
  perPersonAmount: string;
  selectedParticipantIds: string[];
  setOccurredDate: (value: string) => void;
  setParticipantIds: (memberIds: string[]) => void;
  setPayerMemberId: (memberId: string) => void;
  setPerPersonAmount: (value: string) => void;
  setShoesIncluded: (included: boolean) => void;
  shoesIncluded: boolean;
  totalAmount: number;
}) {
  const [payerPickerOpen, setPayerPickerOpen] = useState(false);
  const selectedPayer =
    members.find((member) => member.id === payerMemberId) ?? members[0];

  return (
    <div key="bowling-setup" className="space-y-3">
      <div className="relative overflow-hidden rounded-[30px] bg-ink p-4 text-white">
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FEE500] text-ink">
              <WalletCards className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black text-white/50">인당 금액</p>
              <p className="truncate text-sm font-black">시작 금액</p>
            </div>
          </div>
          <div className="shrink-0 rounded-[20px] bg-white px-3 py-2 text-right text-ink">
            <p className="text-[10px] font-black text-ink/45">총액</p>
            <p className="text-sm font-black leading-tight">
              {formatWon(totalAmount)}
            </p>
            <p className="text-[10px] font-bold text-ink/42">{memberCount}명</p>
          </div>
        </div>
        <label className="relative mt-3 block min-w-0">
          <div className="flex h-16 items-end rounded-[22px] bg-white/10 px-4 pb-3">
            <input
              value={formatAmountInput(perPersonAmount)}
              onChange={(event) =>
                setPerPersonAmount(normalizeAmountInput(event.target.value))
              }
              inputMode="numeric"
              className="w-full min-w-0 border-0 bg-transparent text-3xl font-black leading-none text-[#FEE500] outline-none placeholder:text-white/20"
              placeholder="0"
            />
            <span className="pb-0.5 text-sm font-black text-white/55">원</span>
          </div>
        </label>
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          {amountPresets.map((preset) => (
            <button
              key={preset}
              onClick={() => setPerPersonAmount(preset)}
              className={`h-11 rounded-[18px] px-2 text-xs font-black transition active:scale-[0.98] ${
                perPersonAmount === preset
                  ? "bg-[#FEE500] text-ink"
                  : "bg-white/12 text-white/72"
              }`}
            >
              {formatWon(Number(preset))}
            </button>
          ))}
        </div>
      </div>
      <ParticipantPickerCard
        allMembers={allMembers}
        selectedParticipantIds={selectedParticipantIds}
        setParticipantIds={setParticipantIds}
      />
      <div className="rounded-[24px] bg-[#F4F0E8] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-ink/45">결제자</p>
            <p className="text-sm font-black">정산금을 받을 멤버</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/55">
            {memberCount}명
          </span>
        </div>
        <button
          onClick={() => setPayerPickerOpen(true)}
          className="mt-3 flex min-h-14 w-full items-center justify-between gap-3 rounded-[20px] bg-white p-2.5 text-left transition active:scale-[0.99]"
        >
          <span className="flex min-w-0 items-center gap-2">
            {selectedPayer ? (
              <MemberProfileAvatar member={selectedPayer} size="sm" />
            ) : null}
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">
                {selectedPayer?.displayName ?? "결제자 선택"}
              </span>
              <span className="block text-xs font-bold text-ink/42">
                송금 목록의 받을 사람
              </span>
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-[#F4F0E8] px-3 py-1 text-xs font-black text-ink/55">
            변경
          </span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {payerPickerOpen ? (
          <motion.div
            key="payer-picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/35 px-4 backdrop-blur-sm lg:absolute lg:rounded-[32px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-[360px] rounded-[28px] bg-white p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-ink/45">결제자</p>
                  <p className="text-lg font-black">받을 멤버 선택</p>
                </div>
                <button
                  onClick={() => setPayerPickerOpen(false)}
                  className="h-10 rounded-full bg-[#F4F0E8] px-3 text-xs font-black text-ink/55"
                >
                  닫기
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setPayerMemberId(member.id);
                      setPayerPickerOpen(false);
                    }}
                    className={`flex min-h-12 items-center gap-2 rounded-[18px] px-3 text-left text-xs font-black transition active:scale-[0.98] ${
                      payerMemberId === member.id
                        ? "bg-[#FEE500] text-ink"
                        : "bg-[#F4F0E8] text-ink/68"
                    }`}
                  >
                    <MemberProfileAvatar member={member} size="sm" />
                    <span className="truncate">{member.displayName}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <label className="flex min-h-14 items-center justify-between gap-3 rounded-[24px] bg-[#F4F0E8] px-3 py-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-ink">
            <CalendarDays className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-black text-ink/45">
              경기 날짜
            </span>
            <span className="block text-sm font-black">기록 기준일</span>
          </span>
        </span>
        <input
          value={occurredDate}
          onChange={(event) => setOccurredDate(event.target.value)}
          type="date"
          className="h-10 shrink-0 rounded-[18px] border-0 bg-white px-3 text-xs font-black text-ink outline-none"
        />
      </label>
      <div className="grid grid-cols-2 rounded-[24px] bg-[#F4F0E8] p-1">
        {[
          { label: "신발 포함", value: true },
          { label: "신발 별도", value: false },
        ].map((option) => (
          <button
            key={option.label}
            onClick={() => setShoesIncluded(option.value)}
            className={`relative h-11 rounded-[18px] text-xs font-black transition active:scale-[0.98] ${
              shoesIncluded === option.value ? "text-ink" : "text-ink/45"
            }`}
          >
            {shoesIncluded === option.value ? (
              <motion.span
                layoutId="bowling-shoes-included"
                className="absolute inset-0 rounded-[18px] bg-white shadow-sm"
              />
            ) : null}
            <span className="relative">{option.label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="rounded-[24px] bg-[#F4F0E8] p-4">
          <p className="text-xs font-black text-ink/45">오늘 참가</p>
          <p className="mt-1 text-xl font-black">{memberCount}명</p>
          <p className="mt-1 text-xs font-bold text-ink/42">
            {shoesIncluded ? "신발값 포함 금액" : "신발값은 별도 정산"}
          </p>
        </div>
        <button
          onClick={onRememberPreset}
          className="w-28 rounded-[24px] bg-[#FEE500] px-3 text-xs font-black text-ink transition active:scale-[0.98]"
        >
          프리셋 저장
        </button>
      </div>
    </div>
  );
}
