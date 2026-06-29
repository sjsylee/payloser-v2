"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useGroupWorkspaceController } from "@/modules/app-shell/model/use-group-workspace-controller";
import { AppHeader } from "@/modules/app-shell/ui/app-header";
import { BottomNav } from "@/modules/app-shell/ui/bottom-nav";
import {
  DesktopGroupHeader,
  DesktopGroupPanel,
} from "@/modules/app-shell/ui/desktop-group-panel";
import { BowlingSaveCompleteOverlay } from "@/modules/bowling/ui/bowling-save-complete-overlay";
import { SettleTab } from "@/modules/bowling/ui/settle-tab";
import { AuthOnboarding } from "@/modules/group/ui/group-lobby";
import { GroupManageSheet } from "@/modules/group/ui/group-manage-sheet";
import {
  RankingTab,
  RecordsTab,
} from "@/modules/settlement/ui/records-ranking";
import { HomeTab } from "@/modules/settlement/ui/home-tab";

export default function HomePage() {
  const workspace = useGroupWorkspaceController();
  const { activeTab, bowlingDraft, group, settlementShare, status, user } =
    workspace;

  if (!workspace.sessionChecked) {
    return (
      <main className="grid min-h-svh place-items-center bg-[#B7C6BE] text-ink">
        <div className="h-3 w-24 overflow-hidden rounded-full bg-white/55">
          <div className="h-full w-1/2 animate-[pulse_1.1s_ease-in-out_infinite] rounded-full bg-[#FEE500]" />
        </div>
      </main>
    );
  }

  if (!user || !group) {
    return <AuthOnboarding {...workspace.authOnboardingProps} />;
  }

  const tabContent = (
    <>
      {activeTab === "home" ? (
        <HomeTab
          coverImageUrl={group.coverImageUrl}
          errorMessage={workspace.errorMessage}
          groupName={group.name}
          latestRecord={workspace.recordRows[0] ?? null}
          onOpenRecords={workspace.openRecords}
          onOpenSettle={workspace.startSettlement}
          recordCount={workspace.recordRows.length}
          stackUnit={
            workspace.lastBowlingSettlement?.settlement.stackUnitPrice ??
            bowlingDraft.stackPreview.unit
          }
          transferRows={workspace.transferRowsForView}
          onCopyShareText={settlementShare.copyShareText}
          onShareWithKakao={settlementShare.shareWithKakao}
          shareCopied={settlementShare.shareCopied}
          sharePreviewText={settlementShare.sharePreviewText}
          topRanking={workspace.ranking[0] ?? null}
        />
      ) : null}
      {activeTab === "settle" ? (
        <SettleTab
          totalStacks={bowlingDraft.totalStacks}
          setTotalStacks={bowlingDraft.setTotalStacks}
          stackPreview={bowlingDraft.stackPreview}
          bowlingAmountPresets={bowlingDraft.amountPresets}
          bowlingInputMode={bowlingDraft.inputMode}
          setBowlingInputMode={bowlingDraft.setInputMode}
          bowlingStep={bowlingDraft.step}
          setBowlingStep={bowlingDraft.setStep}
          bowlingGames={bowlingDraft.games}
          selectedBowlingGame={bowlingDraft.selectedGame}
          selectedBowlingGameId={bowlingDraft.selectedGameId}
          setSelectedBowlingGameId={bowlingDraft.setSelectedGameId}
          onAddBowlingGame={bowlingDraft.addGame}
          onDeleteBowlingGame={bowlingDraft.deleteGame}
          onUpdateBowlingGame={bowlingDraft.updateGame}
          selectedBowlingGamePreview={bowlingDraft.selectedGamePreview}
          bowlingGamePreviews={bowlingDraft.gamePreviews}
          bowlingPerPersonAmount={bowlingDraft.perPersonAmount}
          setBowlingPerPersonAmount={bowlingDraft.setPerPersonAmount}
          bowlingPayerMemberId={bowlingDraft.payerMemberId}
          setBowlingPayerMemberId={bowlingDraft.setPayerMemberId}
          bowlingOccurredDate={bowlingDraft.occurredDate}
          setBowlingOccurredDate={bowlingDraft.setOccurredDate}
          bowlingShoesIncluded={bowlingDraft.shoesIncluded}
          setBowlingShoesIncluded={bowlingDraft.setShoesIncluded}
          onRememberBowlingAmountPreset={bowlingDraft.rememberAmountPreset}
          allBowlingMembers={bowlingDraft.members}
          bowlingMembers={bowlingDraft.selectedMembers}
          selectedBowlingParticipantIds={bowlingDraft.selectedParticipantIds}
          setSelectedBowlingParticipantIds={
            bowlingDraft.setSelectedParticipantIds
          }
          status={status}
          onSaveBowling={workspace.handleSaveBowling}
        />
      ) : null}
      {activeTab === "records" ? (
        <RecordsTab
          canDeleteRecords={workspace.canManageGroup}
          groupName={group.name}
          members={workspace.groupMembersForHeader}
          onDeleteBowlingRecord={workspace.deleteBowlingRecord}
          records={workspace.recordRows}
        />
      ) : null}
      {activeTab === "ranking" ? (
        <RankingTab ranking={workspace.ranking} />
      ) : null}
    </>
  );
  const groupSheets = (
    <>
      <BowlingSaveCompleteOverlay open={workspace.saveCompleteOpen} />
      {workspace.groupSheetProps ? (
        <GroupManageSheet {...workspace.groupSheetProps} />
      ) : null}
    </>
  );

  if (workspace.isDesktopLayout) {
    return (
      <main className="min-h-svh bg-[#B7C6BE] px-6 py-6 text-ink">
        <div className="relative mx-auto grid min-h-[calc(100svh-48px)] w-full max-w-7xl grid-cols-[280px_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[34px] bg-[#F4F0E8] shadow-2xl">
          <DesktopGroupHeader
            group={group}
            onOpenGroup={workspace.openGroupSheet}
            onReturnToLobby={workspace.returnToGroupList}
            onStartSettlement={workspace.startSettlement}
            ownerMember={workspace.groupOwnerMember}
          />
          <DesktopGroupPanel
            activeTab={activeTab}
            group={group}
            onSelectTab={workspace.setActiveTab}
          />
          <AnimatePresence mode="wait">
            <motion.section
              key={activeTab}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="scrollbar-none min-h-0 overflow-y-auto overscroll-contain px-8 py-7"
            >
              <div className="mx-auto max-w-4xl">{tabContent}</div>
            </motion.section>
          </AnimatePresence>
          {groupSheets}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-[#B7C6BE] text-ink">
      <div className="relative mx-auto flex min-h-svh w-full max-w-[430px] flex-col">
        <section className="relative flex min-h-svh flex-col overflow-hidden bg-[#F4F0E8] shadow-2xl">
          <AppHeader
            groupImageUrl={group.imageUrl}
            groupName={group.name}
            groupThemeColor={group.themeColor}
            members={workspace.headerMembers}
            onOpenGroup={workspace.openGroupSheet}
            onReturnToLobby={workspace.returnToGroupList}
          />
          <AnimatePresence mode="wait">
            <motion.section
              ref={workspace.contentScrollRef}
              key={activeTab}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="scrollbar-none flex-1 overflow-y-auto overscroll-contain px-4 pb-36 pt-3"
            >
              {tabContent}
            </motion.section>
          </AnimatePresence>
          <BottomNav
            activeTab={activeTab}
            setActiveTab={workspace.setActiveTab}
          />
        </section>
        {groupSheets}
      </div>
    </main>
  );
}
