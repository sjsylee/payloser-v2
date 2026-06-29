"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BowlingGamesStep } from "@/modules/bowling/ui/bowling-games-step";
import { BowlingReviewStep } from "@/modules/bowling/ui/bowling-review-step";
import { BowlingSetupStep } from "@/modules/bowling/ui/bowling-setup-step";
import {
  BowlingStageAction,
  BowlingStepRail,
  SheetTitle,
} from "@/modules/bowling/ui/bowling-step-shell";
import type { BowlingStep } from "@/modules/bowling/model/bowling-flow";
import { BowlingIcon } from "@/shared/ui/sport-icons";
import type { ApiGroupMember } from "@/adapters/payloser-api";
import type {
  BowlingGameDraft,
  BowlingGamePreview,
  BowlingInputMode,
} from "@/modules/bowling/model/bowling-draft";
import { sampleMembers } from "@/shared/fixtures/app-fixtures";

export function SettleTab({
  allBowlingMembers,
  totalStacks,
  setTotalStacks,
  stackPreview,
  bowlingAmountPresets,
  bowlingInputMode,
  setBowlingInputMode,
  bowlingStep,
  setBowlingStep,
  bowlingGames,
  selectedBowlingGame,
  selectedBowlingGameId,
  setSelectedBowlingGameId,
  onAddBowlingGame,
  onDeleteBowlingGame,
  onUpdateBowlingGame,
  selectedBowlingGamePreview,
  bowlingGamePreviews,
  bowlingPerPersonAmount,
  setBowlingPerPersonAmount,
  bowlingPayerMemberId,
  setBowlingPayerMemberId,
  bowlingOccurredDate,
  setBowlingOccurredDate,
  bowlingShoesIncluded,
  setBowlingShoesIncluded,
  onRememberBowlingAmountPreset,
  bowlingMembers,
  selectedBowlingParticipantIds,
  setSelectedBowlingParticipantIds,
  status,
  onSaveBowling,
}: {
  allBowlingMembers: ApiGroupMember[];
  totalStacks: string;
  setTotalStacks: (value: string) => void;
  stackPreview: {
    gameCount: number;
    unit: number;
    perGameStacks: number;
    amount: number;
    totalStacks: number;
  };
  bowlingAmountPresets: string[];
  bowlingInputMode: BowlingInputMode;
  setBowlingInputMode: (mode: BowlingInputMode) => void;
  bowlingStep: BowlingStep;
  setBowlingStep: (step: BowlingStep) => void;
  bowlingGames: BowlingGameDraft[];
  selectedBowlingGame: BowlingGameDraft | undefined;
  selectedBowlingGameId: string;
  setSelectedBowlingGameId: (gameId: string) => void;
  onAddBowlingGame: () => void;
  onDeleteBowlingGame: (gameId: string) => void;
  onUpdateBowlingGame: (
    gameId: string,
    patch: Partial<Omit<BowlingGameDraft, "id">>,
  ) => void;
  selectedBowlingGamePreview: BowlingGamePreview | null;
  bowlingGamePreviews: Array<{
    gameId: string;
    preview: BowlingGamePreview | null;
  }>;
  bowlingPerPersonAmount: string;
  setBowlingPerPersonAmount: (value: string) => void;
  bowlingPayerMemberId: string | null;
  setBowlingPayerMemberId: (memberId: string) => void;
  bowlingOccurredDate: string;
  setBowlingOccurredDate: (value: string) => void;
  bowlingShoesIncluded: boolean;
  setBowlingShoesIncluded: (included: boolean) => void;
  onRememberBowlingAmountPreset: () => void;
  bowlingMembers: ApiGroupMember[];
  selectedBowlingParticipantIds: string[];
  setSelectedBowlingParticipantIds: (memberIds: string[]) => void;
  status: "idle" | "connecting" | "ready" | "saving" | "error";
  onSaveBowling: () => Promise<void>;
}) {
  const saving = status === "saving";
  const hasEnoughBowlingMembers = bowlingMembers.length >= 2;
  const hasValidBowlingGames =
    bowlingGamePreviews.some((game) => Boolean(game.preview)) &&
    stackPreview.totalStacks > 0;
  const bowlingActionLabel =
    bowlingStep === "setup"
      ? hasEnoughBowlingMembers
        ? "판 입력 시작"
        : "2명 이상 필요"
      : bowlingStep === "games"
        ? hasValidBowlingGames
          ? "결과 미리보기"
          : "판 입력 필요"
        : "정산 저장";
  const handlePrimaryAction = () => {
    if (bowlingStep === "setup") {
      if (!hasEnoughBowlingMembers) {
        return;
      }

      setBowlingInputMode("team");
      setBowlingStep("games");
      return;
    }

    if (bowlingStep === "games") {
      if (!hasValidBowlingGames) {
        return;
      }

      setBowlingStep("review");
      return;
    }

    if (!hasValidBowlingGames) {
      return;
    }

    void onSaveBowling();
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        <motion.section
          key="bowling"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          className="rounded-[30px] bg-white p-5 shadow-sm"
        >
          <div className="space-y-4">
            <SheetTitle
              icon={BowlingIcon}
              label="볼링 무제한"
              title={
                bowlingStep === "setup"
                  ? "시작 금액 정하기"
                  : bowlingStep === "games"
                    ? "판 추가와 팀 배정"
                    : "결과 확인"
              }
            />
            <BowlingStepRail
              canEnterReview={hasValidBowlingGames}
              step={bowlingStep}
              onStepChange={setBowlingStep}
            />
            <AnimatePresence mode="wait">
              {bowlingStep === "setup" ? (
                <BowlingSetupStep
                  amountPresets={bowlingAmountPresets}
                  allMembers={allBowlingMembers}
                  members={bowlingMembers}
                  memberCount={bowlingMembers.length || sampleMembers.length}
                  onRememberPreset={onRememberBowlingAmountPreset}
                  occurredDate={bowlingOccurredDate}
                  payerMemberId={bowlingPayerMemberId}
                  perPersonAmount={bowlingPerPersonAmount}
                  selectedParticipantIds={selectedBowlingParticipantIds}
                  shoesIncluded={bowlingShoesIncluded}
                  setOccurredDate={setBowlingOccurredDate}
                  setParticipantIds={setSelectedBowlingParticipantIds}
                  setPayerMemberId={setBowlingPayerMemberId}
                  setPerPersonAmount={setBowlingPerPersonAmount}
                  setShoesIncluded={setBowlingShoesIncluded}
                  totalAmount={stackPreview.amount}
                />
              ) : null}
              {bowlingStep === "games" ? (
                <BowlingGamesStep
                  games={bowlingGames}
                  members={bowlingMembers}
                  onAddGame={onAddBowlingGame}
                  onDeleteGame={onDeleteBowlingGame}
                  onSelectGame={setSelectedBowlingGameId}
                  onUpdateGame={onUpdateBowlingGame}
                  preview={selectedBowlingGamePreview}
                  selectedGame={selectedBowlingGame}
                  selectedGameId={selectedBowlingGameId}
                />
              ) : null}
              {bowlingStep === "review" ? (
                <BowlingReviewStep
                  gamePreviews={bowlingGamePreviews}
                  gameCount={stackPreview.gameCount}
                  members={bowlingMembers}
                  perPersonAmount={bowlingPerPersonAmount}
                  preview={selectedBowlingGamePreview}
                  shoesIncluded={bowlingShoesIncluded}
                  totalStacks={stackPreview.totalStacks}
                  unitAmount={stackPreview.unit}
                />
              ) : null}
            </AnimatePresence>
            <BowlingStageAction
              disabled={
                saving ||
                (bowlingStep === "setup" && !hasEnoughBowlingMembers) ||
                (bowlingStep !== "setup" && !hasValidBowlingGames)
              }
              label={saving ? "저장중" : bowlingActionLabel}
              onClick={handlePrimaryAction}
              step={bowlingStep}
            />
          </div>
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
