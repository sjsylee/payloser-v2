"use client";

import { useEffect, useRef, useState } from "react";
import type { TabId } from "@/modules/app-shell/ui/bottom-nav";
import { usePayloserStore } from "@/modules/app-state/usePayloserStore";
import { useBowlingSettlementDraft } from "@/modules/bowling/hooks/use-bowling-settlement-draft";
import { useSettlementShare } from "@/modules/settlement/model/use-settlement-share";
import { useHomePageModel } from "./use-home-page-model";

export function useGroupWorkspaceController() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [groupSheetOpen, setGroupSheetOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const [saveCompleteOpen, setSaveCompleteOpen] = useState(false);
  const contentScrollRef = useRef<HTMLElement | null>(null);
  const saveCompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const store = usePayloserStore();
  const {
    addMember,
    approveGroupJoinRequest,
    bootstrapSession,
    burdenSummary,
    createGroupInvitation,
    deleteBowlingRecord,
    errorMessage,
    group,
    joinRequests,
    lastBowlingSettlement,
    recentRecords,
    rejectGroupJoinRequest,
    returnToGroupList,
    saveBowlingSettlement,
    status,
    updateCurrentGroup,
    user,
  } = store;

  useEffect(() => {
    void bootstrapSession().finally(() => {
      setSessionChecked(true);
    });
  }, [bootstrapSession]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const syncLayout = () => setIsDesktopLayout(mediaQuery.matches);

    syncLayout();
    mediaQuery.addEventListener("change", syncLayout);

    return () => {
      mediaQuery.removeEventListener("change", syncLayout);
    };
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const authError = searchParams.get("authError");

    if (!authError) {
      return;
    }

    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const homeModel = useHomePageModel({
    burdenSummary,
    group,
    lastBowlingSettlement,
    recentRecords,
    userId: user?.id,
  });
  const bowlingDraft = useBowlingSettlementDraft({
    members: homeModel.groupMembersForHeader,
  });
  const settlementShare = useSettlementShare(homeModel.shareText, group?.name);

  useEffect(() => {
    contentScrollRef.current?.scrollTo({
      left: 0,
      top: 0,
      behavior: "auto",
    });
  }, [activeTab, bowlingDraft.step]);

  useEffect(
    () => () => {
      if (saveCompleteTimeoutRef.current) {
        clearTimeout(saveCompleteTimeoutRef.current);
      }
    },
    [],
  );

  const openGroupSheet = () => setGroupSheetOpen(true);
  const closeGroupSheet = () => setGroupSheetOpen(false);
  const openRecords = () => setActiveTab("records");
  const startSettlement = () => {
    bowlingDraft.setStep("setup");
    setActiveTab("settle");
  };

  const handleSaveBowling = async () => {
    bowlingDraft.rememberAmountPreset();
    bowlingDraft.setStep("review");

    const saved = await saveBowlingSettlement(bowlingDraft.buildSaveInput());

    if (!saved) {
      return;
    }

    if (saveCompleteTimeoutRef.current) {
      clearTimeout(saveCompleteTimeoutRef.current);
    }

    setSaveCompleteOpen(true);
    saveCompleteTimeoutRef.current = setTimeout(() => {
      bowlingDraft.resetDraft();
      setSaveCompleteOpen(false);
    }, 1450);
  };

  return {
    activeTab,
    authOnboardingProps: {
      errorMessage: store.errorMessage,
      groups: store.groups,
      onCreateGroup: store.createUserGroup,
      onDeleteGroup: store.deleteGroup,
      onLeaveGroup: store.leaveGroup,
      onLogout: store.logout,
      onSelectGroup: store.selectGroup,
      onTransferOwner: store.transferGroupOwner,
      status: store.status,
      user: store.user,
    },
    bowlingDraft,
    canManageGroup: homeModel.canManage,
    closeGroupSheet,
    contentScrollRef,
    currentUserMembership: homeModel.currentUserMembership,
    deleteBowlingRecord,
    errorMessage,
    group,
    groupMembersForHeader: homeModel.groupMembersForHeader,
    groupOwnerMember: homeModel.ownerMember,
    groupSheetProps: group
      ? {
          canManage: homeModel.canManage,
          currentGroup: group,
          currentUserMemberId: homeModel.currentUserMembership?.id ?? null,
          disabled: status === "connecting" || status === "saving",
          errorMessage,
          joinRequests,
          onAddMember: addMember,
          onApproveJoinRequest: approveGroupJoinRequest,
          onClose: closeGroupSheet,
          onCreateInvitation: createGroupInvitation,
          onRejectJoinRequest: rejectGroupJoinRequest,
          onSubmitName: updateCurrentGroup,
          open: groupSheetOpen,
          ownerMember: homeModel.ownerMember,
        }
      : null,
    handleSaveBowling,
    headerMembers: homeModel.headerMembers,
    isDesktopLayout,
    lastBowlingSettlement,
    openGroupSheet,
    openRecords,
    ranking: homeModel.ranking,
    recordRows: homeModel.recordRows,
    returnToGroupList,
    saveCompleteOpen,
    sessionChecked,
    setActiveTab,
    settlementShare,
    startSettlement,
    status,
    transferRowsForView: homeModel.transferRowsForView,
    user,
  };
}
