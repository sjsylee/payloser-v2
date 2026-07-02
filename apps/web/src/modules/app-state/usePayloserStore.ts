import { create } from "zustand";
import { api, mapKoreanRpsHand } from "@/adapters/payloser-api";
import {
  buildGroupWorkspaceState,
  decorateGroups,
  defaultGroupImageUrl,
  defaultGroupThemeColor,
  emptyGroupWorkspaceState,
  loadGroupSnapshots,
  putGroupFirst,
  replaceGroup,
  withGroupImage,
} from "./group-workspace";
import {
  clearLocalSession,
  clearSelectedGroupId,
  createLocalSession,
  demoMemberNames,
  readSelectedGroupId,
  readLocalSession,
  toReadyLocalState,
  updateSavedLocalGroup,
  writeLocalSession,
  writeSelectedGroupId,
} from "./local-session";
import type {
  ApiGroup,
  ApiGroupJoinRequest,
  ApiGroupMember,
  ApiUser,
  BowlingSettlementResponse,
  GroupBurdenSummaryRow,
  GroupRecentRecord,
  ScreenBaseballSettlementResponse,
} from "@/adapters/payloser-api";

type ConnectionStatus = "idle" | "connecting" | "ready" | "saving" | "error";

type StoreState = {
  status: ConnectionStatus;
  errorMessage: string | null;
  user: ApiUser | null;
  groups: ApiGroup[];
  group: ApiGroup | null;
  members: ApiGroupMember[];
  joinRequests: ApiGroupJoinRequest[];
  burdenSummary: GroupBurdenSummaryRow[];
  recentRecords: GroupRecentRecord[];
  lastBowlingSettlement: BowlingSettlementResponse | null;
  lastScreenBaseballSettlement: ScreenBaseballSettlementResponse | null;
  lastRpsRecordId: string | null;
  bootstrapSession: () => Promise<void>;
  createGroupInvitation: () => Promise<string | null>;
  createUserGroup: (input: {
    coverImageUrl?: string | null;
    imageUrl?: string | null;
    initialMemberNames?: string[];
    name: string;
    ownerDisplayName?: string;
    themeColor?: string;
  }) => Promise<void>;
  connectDemoGroup: () => Promise<void>;
  loginWithName: (nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  deleteBowlingRecord: (sessionId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  returnToGroupList: () => void;
  selectGroup: (groupId: string) => Promise<void>;
  transferGroupOwner: (groupId: string, memberId: string) => Promise<void>;
  approveGroupJoinRequest: (
    requestId: string,
    input:
      | { mode: "LINK_EXISTING"; memberId: string }
      | { mode: "CREATE_MEMBER"; displayName: string },
  ) => Promise<void>;
  rejectGroupJoinRequest: (requestId: string) => Promise<void>;
  updateCurrentGroup: (input: {
    coverImageUrl?: string | null;
    imageUrl?: string | null;
    name: string;
    themeColor?: string;
  }) => Promise<void>;
  addMember: (displayName: string) => Promise<void>;
  saveBowlingSettlement: (input: {
    occurredAt?: string;
    payerMemberId?: string;
    totalAmount: number;
    totalStacks: number;
    games?: Array<{
      stackAllocations: Array<{
        memberId: string;
        stacks: number;
        reason: string;
      }>;
    }>;
    details?: {
      participantMemberIds: string[];
      games: Array<{
        stackAllocations: Array<{
          memberId: string;
          stacks: number;
          reason: string;
        }>;
        scores?: Array<{
          memberId: string;
          score: number;
        }>;
      }>;
    };
  }) => Promise<boolean>;
  saveScreenBaseballSettlement: (input: {
    totalAmount: number;
    loserName: string;
  }) => Promise<void>;
  saveRpsRecord: (input: {
    loserName: string;
    loserHand: string;
  }) => Promise<void>;
};

async function ensureDefaultGroupForUser(groups: ApiGroup[]) {
  const decoratedGroups = decorateGroups(groups);

  return {
    group: decoratedGroups[0] ?? null,
    groups: decoratedGroups,
  };
}

function getInitialGroupToOpen(groups: ApiGroup[]): ApiGroup | null {
  const selectedGroupId = readSelectedGroupId();
  const rememberedGroup = selectedGroupId
    ? groups.find((group) => group.id === selectedGroupId)
    : null;

  return rememberedGroup ?? (groups.length === 1 ? (groups[0] ?? null) : null);
}

async function buildRestoredGroupState(group: ApiGroup | null) {
  if (!group) {
    return emptyGroupWorkspaceState();
  }

  try {
    const groupState = await buildGroupWorkspaceState(group);
    writeSelectedGroupId(group.id);
    return groupState;
  } catch {
    writeSelectedGroupId(group.id);
    return {
      ...emptyGroupWorkspaceState(),
      group,
      members: group.members,
    };
  }
}

export const usePayloserStore = create<StoreState>((set, get) => ({
  status: "idle",
  errorMessage: null,
  user: null,
  groups: [],
  group: null,
  members: [],
  joinRequests: [],
  burdenSummary: [],
  recentRecords: [],
  lastBowlingSettlement: null,
  lastScreenBaseballSettlement: null,
  lastRpsRecordId: null,

  async bootstrapSession() {
    if (get().status === "connecting") {
      return;
    }

    set({ status: "connecting", errorMessage: null });

    try {
      const session = await api.me();
      let groups: ApiGroup[] = [];
      let groupListErrorMessage: string | null = null;

      try {
        groups = await api.listGroups();
      } catch {
        groupListErrorMessage = "그룹 목록을 불러오지 못했습니다.";
      }

      const defaultGroup = await ensureDefaultGroupForUser(groups);
      const restoredGroupState = await buildRestoredGroupState(
        getInitialGroupToOpen(defaultGroup.groups),
      );

      set({
        ...restoredGroupState,
        status: "ready",
        errorMessage: groupListErrorMessage,
        user: session.user,
        groups: defaultGroup.groups,
      });
    } catch {
      const localSession = readLocalSession();

      if (localSession) {
        set(toReadyLocalState(localSession));
        return;
      }

      set({
        status: "idle",
        user: null,
        groups: [],
        group: null,
        members: [],
        joinRequests: [],
        burdenSummary: [],
        recentRecords: [],
      });
    }
  },

  async loginWithName(nickname) {
    const displayName = nickname.trim();

    if (!displayName) {
      set({ status: "error", errorMessage: "이름을 입력해주세요." });
      return;
    }

    set({ status: "connecting", errorMessage: null });

    try {
      const login = await api.devLogin(displayName);
      let groups: ApiGroup[] = [];
      let groupListErrorMessage: string | null = null;

      try {
        groups = await api.listGroups();
      } catch {
        groupListErrorMessage = "그룹 목록을 불러오지 못했습니다.";
      }

      const defaultGroup = await ensureDefaultGroupForUser(groups);

      set({
        status: "ready",
        errorMessage: groupListErrorMessage,
        user: login.user,
        groups: defaultGroup.groups,
        group: null,
        members: [],
        joinRequests: [],
        burdenSummary: [],
        recentRecords: [],
      });
    } catch (error) {
      const localSession = createLocalSession(displayName);
      writeLocalSession(localSession);
      set(toReadyLocalState(localSession));
    }
  },

  async logout() {
    set({ status: "saving", errorMessage: null });

    try {
      await api.logout();
    } catch {
      // Local logout should still complete even if the API is unavailable.
    }

    clearLocalSession();
    set({
      status: "idle",
      errorMessage: null,
      user: null,
      groups: [],
      group: null,
      members: [],
      joinRequests: [],
      burdenSummary: [],
      recentRecords: [],
      lastBowlingSettlement: null,
      lastScreenBaseballSettlement: null,
      lastRpsRecordId: null,
    });
  },

  async createUserGroup(input) {
    const { user } = get();
    const groupName = input.name.trim();
    const ownerDisplayName = (input.ownerDisplayName ?? user?.nickname ?? "나")
      .trim()
      .slice(0, 40);

    if (!user) {
      set({ status: "error", errorMessage: "로그인이 먼저 필요합니다." });
      return;
    }

    if (!groupName) {
      set({ status: "error", errorMessage: "그룹명을 입력해주세요." });
      return;
    }

    set({ status: "saving", errorMessage: null });

    try {
      let group = await api.createGroup({
        name: groupName,
        ownerDisplayName: ownerDisplayName || user.nickname,
        coverImageUrl: input.coverImageUrl?.trim() || null,
        imageUrl: input.imageUrl?.trim() || null,
        themeColor: input.themeColor || defaultGroupThemeColor,
      });
      const existingNames = new Set(
        group.members.map((member) => member.displayName),
      );
      const invitedMembers: ApiGroupMember[] = [];

      for (const displayName of input.initialMemberNames ?? []) {
        const trimmedName = displayName.trim().slice(0, 40);

        if (trimmedName && !existingNames.has(trimmedName)) {
          invitedMembers.push(
            await api.addTemporaryMember(group.id, trimmedName),
          );
          existingNames.add(trimmedName);
        }
      }

      group = withGroupImage({
        ...group,
        members: [...group.members, ...invitedMembers],
      });
      const groups = putGroupFirst(get().groups, group);
      const groupState = await buildGroupWorkspaceState(group);
      writeSelectedGroupId(group.id);

      set({
        ...groupState,
        status: "ready",
        groups,
      });
    } catch (error) {
      const now = Date.now();
      const ownerMember: ApiGroupMember = {
        id: `local-member-owner-${now}`,
        userId: user.id,
        displayName: ownerDisplayName || user.nickname,
        role: "OWNER",
        isActive: true,
      };
      const group: ApiGroup = {
        id: `local-group-${now}`,
        coverImageUrl: input.coverImageUrl?.trim() || null,
        imageUrl: input.imageUrl?.trim() || defaultGroupImageUrl,
        name: groupName,
        themeColor: input.themeColor || defaultGroupThemeColor,
        members: [
          ownerMember,
          ...(input.initialMemberNames ?? [])
            .map((name) => name.trim().slice(0, 40))
            .filter(Boolean)
            .filter((name) => name !== ownerDisplayName)
            .map((displayName, index) => ({
              id: `local-member-invited-${index + 1}-${now}`,
              userId: null,
              displayName,
              role: "MEMBER" as const,
              isActive: true,
            })),
        ],
      };
      const groups = putGroupFirst(get().groups, group);

      writeLocalSession({ user, group });
      writeSelectedGroupId(group.id);
      set({
        status: "ready",
        errorMessage: null,
        group,
        groups,
        members: group.members,
        joinRequests: [],
        burdenSummary: [],
        recentRecords: [],
      });
    }
  },

  async updateCurrentGroup(input) {
    const { group } = get();
    const name = input.name.trim();
    const coverImageUrl = input.coverImageUrl?.trim() || null;
    const persistedImageUrl = input.imageUrl?.trim() || null;
    const themeColor =
      input.themeColor || group?.themeColor || defaultGroupThemeColor;

    if (!group) {
      set({ status: "error", errorMessage: "그룹 선택이 먼저 필요합니다." });
      return;
    }

    if (!name) {
      set({ status: "error", errorMessage: "그룹명을 입력해주세요." });
      return;
    }

    set({ status: "saving", errorMessage: null });

    try {
      const updatedGroup = withGroupImage(
        await api.updateGroup(group.id, {
          name,
          coverImageUrl,
          imageUrl: persistedImageUrl,
          themeColor,
        }),
      );
      updateSavedLocalGroup(updatedGroup);

      set({
        status: "ready",
        errorMessage: null,
        group: updatedGroup,
        members: updatedGroup.members,
        groups: replaceGroup(get().groups, updatedGroup),
      });
    } catch (error) {
      set({
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "그룹 저장에 실패했습니다.",
      });
      throw error;
    }
  },

  async leaveGroup(groupId) {
    set({ status: "saving", errorMessage: null });

    try {
      await api.leaveGroup(groupId);
      const groups = get().groups.filter((group) => group.id !== groupId);
      if (get().group?.id === groupId || readSelectedGroupId() === groupId) {
        clearSelectedGroupId();
      }

      set({
        status: "ready",
        errorMessage: null,
        groups,
        ...(get().group?.id === groupId ? emptyGroupWorkspaceState() : {}),
      });
    } catch (error) {
      set({
        status: "error",
        errorMessage:
          error instanceof Error
            ? error.message
            : "그룹 나가기에 실패했습니다.",
      });
    }
  },

  async transferGroupOwner(groupId, memberId) {
    set({ status: "saving", errorMessage: null });

    try {
      const updatedGroup = withGroupImage(
        await api.transferGroupOwner(groupId, memberId),
      );

      set({
        status: "ready",
        errorMessage: null,
        groups: replaceGroup(get().groups, updatedGroup),
        ...(get().group?.id === groupId
          ? {
              group: updatedGroup,
              members: updatedGroup.members,
            }
          : {}),
      });
    } catch (error) {
      set({
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "대표 변경에 실패했습니다.",
      });
    }
  },

  async approveGroupJoinRequest(requestId, input) {
    const { group } = get();

    if (!group) {
      set({ status: "error", errorMessage: "그룹 선택이 먼저 필요합니다." });
      return;
    }

    set({ status: "saving", errorMessage: null });

    try {
      const updatedGroup = withGroupImage(
        await api.approveGroupJoinRequest(group.id, requestId, input),
      );

      set({
        status: "ready",
        errorMessage: null,
        group: updatedGroup,
        members: updatedGroup.members,
        groups: replaceGroup(get().groups, updatedGroup),
        joinRequests: get().joinRequests.filter(
          (request) => request.id !== requestId,
        ),
      });
    } catch (error) {
      set({
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "가입 승인에 실패했습니다.",
      });
    }
  },

  async rejectGroupJoinRequest(requestId) {
    const { group } = get();

    if (!group) {
      set({ status: "error", errorMessage: "그룹 선택이 먼저 필요합니다." });
      return;
    }

    set({ status: "saving", errorMessage: null });

    try {
      await api.rejectGroupJoinRequest(group.id, requestId);

      set({
        status: "ready",
        errorMessage: null,
        joinRequests: get().joinRequests.filter(
          (request) => request.id !== requestId,
        ),
      });
    } catch (error) {
      set({
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "가입 거절에 실패했습니다.",
      });
    }
  },

  async deleteGroup(groupId) {
    set({ status: "saving", errorMessage: null });

    try {
      await api.deleteGroup(groupId);
      const groups = get().groups.filter((group) => group.id !== groupId);
      if (get().group?.id === groupId || readSelectedGroupId() === groupId) {
        clearSelectedGroupId();
      }

      set({
        status: "ready",
        errorMessage: null,
        groups,
        ...(get().group?.id === groupId ? emptyGroupWorkspaceState() : {}),
      });
    } catch (error) {
      set({
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "그룹 삭제에 실패했습니다.",
      });
    }
  },

  async deleteBowlingRecord(sessionId) {
    const { group } = get();

    if (!group) {
      set({
        status: "error",
        errorMessage: "그룹 연결이 먼저 필요합니다.",
      });
      return false;
    }

    set({ status: "saving", errorMessage: null });

    try {
      await api.deleteBowlingSession(sessionId);
      const { burdenSummary, recentRecords } = await loadGroupSnapshots(
        group.id,
      );

      set({
        status: "ready",
        burdenSummary,
        errorMessage: null,
        lastBowlingSettlement: null,
        recentRecords,
      });
      return true;
    } catch (error) {
      set({
        status: "error",
        errorMessage:
          error instanceof Error
            ? error.message
            : "볼링 기록 삭제에 실패했습니다.",
      });
      return false;
    }
  },

  async createGroupInvitation() {
    const { group } = get();

    if (!group) {
      set({ status: "error", errorMessage: "그룹 선택이 먼저 필요합니다." });
      return null;
    }

    set({ status: "saving", errorMessage: null });

    try {
      const invitation = await api.createGroupInvitation(group.id);

      set({ status: "ready" });
      return invitation.token;
    } catch (error) {
      set({
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "초대 생성에 실패했습니다.",
      });
      return null;
    }
  },

  returnToGroupList() {
    clearSelectedGroupId();
    set({
      errorMessage: null,
      ...emptyGroupWorkspaceState(),
      status: "ready",
    });
  },

  async selectGroup(groupId) {
    const selectedGroup = get().groups.find((group) => group.id === groupId);

    if (!selectedGroup) {
      set({ status: "error", errorMessage: "그룹을 찾을 수 없습니다." });
      return;
    }

    set({ status: "connecting", errorMessage: null });

    try {
      const groupState = await buildGroupWorkspaceState(
        withGroupImage(selectedGroup),
      );
      writeSelectedGroupId(groupId);

      set({
        ...groupState,
        status: "ready",
      });
    } catch (error) {
      const group = withGroupImage(selectedGroup);

      updateSavedLocalGroup(group);
      writeSelectedGroupId(groupId);
      set({
        status: "ready",
        errorMessage: null,
        ...emptyGroupWorkspaceState(),
        group,
        members: group.members,
      });
    }
  },

  async connectDemoGroup() {
    set({ status: "connecting", errorMessage: null });

    try {
      const login = await api.devLogin("김민수");
      const groups = await api.listGroups();
      let group = groups.find(
        (candidate) => candidate.name === "한강 레인클럽",
      );

      if (!group) {
        group = await api.createGroup({
          name: "한강 레인클럽",
          ownerDisplayName: "김민수",
        });
      }

      const existingNames = new Set(
        group.members.map((member) => member.displayName),
      );
      const addedMembers: ApiGroupMember[] = [];

      for (const displayName of demoMemberNames) {
        if (!existingNames.has(displayName)) {
          addedMembers.push(
            await api.addTemporaryMember(group.id, displayName),
          );
        }
      }

      const members = [...group.members, ...addedMembers];
      const { burdenSummary, joinRequests, recentRecords } =
        await loadGroupSnapshots(group.id);

      set({
        status: "ready",
        user: login.user,
        groups: [
          {
            ...group,
            members,
          },
        ],
        group: {
          ...group,
          members,
        },
        members,
        joinRequests,
        burdenSummary,
        recentRecords,
      });
    } catch (error) {
      set({
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "API 연결에 실패했습니다.",
      });
    }
  },

  async addMember(displayName) {
    const { group, members } = get();
    const trimmedName = displayName.trim();

    if (!group) {
      set({ status: "error", errorMessage: "그룹 연결이 먼저 필요합니다." });
      return;
    }

    if (!trimmedName) {
      set({ status: "error", errorMessage: "멤버 이름을 입력해주세요." });
      return;
    }

    if (members.some((member) => member.displayName === trimmedName)) {
      set({ status: "error", errorMessage: "이미 있는 멤버입니다." });
      return;
    }

    set({ status: "saving", errorMessage: null });

    try {
      const member = await api.addTemporaryMember(group.id, trimmedName);
      const nextMembers = [...members, member];
      const { burdenSummary, recentRecords } = await loadGroupSnapshots(
        group.id,
      );

      set({
        status: "ready",
        group: {
          ...group,
          members: nextMembers,
        },
        groups: replaceGroup(get().groups, { ...group, members: nextMembers }),
        members: nextMembers,
        burdenSummary,
        recentRecords,
      });
    } catch (error) {
      set({
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "멤버 추가에 실패했습니다.",
      });
    }
  },

  async removeMember(memberId) {
    const { group, members } = get();
    const member = members.find((item) => item.id === memberId);

    if (!group) {
      set({ status: "error", errorMessage: "그룹 연결이 먼저 필요합니다." });
      return;
    }

    if (!member) {
      set({ status: "error", errorMessage: "멤버를 찾을 수 없습니다." });
      return;
    }

    if (member.role === "OWNER") {
      set({ status: "error", errorMessage: "대표는 내보낼 수 없습니다." });
      return;
    }

    set({ status: "saving", errorMessage: null });

    try {
      const updatedGroup = withGroupImage(
        await api.removeGroupMember(group.id, memberId),
      );
      const nextMembers = updatedGroup.members.filter(
        (nextMember) => nextMember.isActive !== false,
      );
      const { burdenSummary, joinRequests, recentRecords } =
        await loadGroupSnapshots(group.id);

      set({
        status: "ready",
        group: {
          ...updatedGroup,
          members: nextMembers,
        },
        groups: replaceGroup(get().groups, {
          ...updatedGroup,
          members: nextMembers,
        }),
        members: nextMembers,
        burdenSummary,
        joinRequests,
        recentRecords,
      });
    } catch (error) {
      set({
        status: "error",
        errorMessage:
          error instanceof Error
            ? error.message
            : "멤버를 내보내지 못했습니다.",
      });
    }
  },

  async saveBowlingSettlement({
    occurredAt,
    games,
    details,
    payerMemberId,
    totalAmount,
    totalStacks,
  }) {
    const { group, members } = get();
    const payer =
      members.find((member) => member.id === payerMemberId) ??
      members.find((member) => member.displayName === "김민수") ??
      members[0];
    const burdenMembers = members.filter((member) => member.id !== payer?.id);

    if (!group || !payer || burdenMembers.length === 0) {
      set({
        status: "error",
        errorMessage: "그룹과 멤버 연결이 먼저 필요합니다.",
      });
      return false;
    }

    set({ status: "saving", errorMessage: null });

    try {
      const baseStacks = totalStacks / burdenMembers.length;
      const settlement = await api.createUnlimitedBowlingSettlement({
        groupId: group.id,
        payerMemberId: payer.id,
        title: "무제한 볼링 정산",
        totalAmount,
        roundingUnit: 10,
        ...(occurredAt ? { occurredAt } : {}),
        ...(details ? { details } : {}),
        games: games ?? [
          {
            stackAllocations: [
              { memberId: payer.id, stacks: 0, reason: "FIRST_PLACE" },
              ...burdenMembers.map((member) => ({
                memberId: member.id,
                stacks: baseStacks,
                reason: "UNLIMITED_SESSION_TOTAL",
              })),
            ],
          },
        ],
      });
      const { burdenSummary, recentRecords } = await loadGroupSnapshots(
        group.id,
      );

      set({
        status: "ready",
        lastBowlingSettlement: settlement,
        burdenSummary,
        recentRecords,
      });
      return true;
    } catch (error) {
      set({
        status: "error",
        errorMessage:
          error instanceof Error
            ? error.message
            : "볼링 정산 저장에 실패했습니다.",
      });
      return false;
    }
  },

  async saveRpsRecord({ loserName, loserHand }) {
    const { group, members } = get();
    const loser = members.find((member) => member.displayName === loserName);

    if (!group || !loser) {
      set({
        status: "error",
        errorMessage: "RPS 패자를 그룹 멤버에서 찾을 수 없습니다.",
      });
      return;
    }

    set({ status: "saving", errorMessage: null });

    try {
      const record = await api.createRpsRecord({
        groupId: group.id,
        loserMemberId: loser.id,
        loserHand: mapKoreanRpsHand(loserHand),
        context: "음식물 쓰레기",
      });
      const { burdenSummary, recentRecords } = await loadGroupSnapshots(
        group.id,
      );

      set({
        status: "ready",
        lastRpsRecordId: record.id,
        burdenSummary,
        recentRecords,
      });
    } catch (error) {
      set({
        status: "error",
        errorMessage:
          error instanceof Error
            ? error.message
            : "RPS 기록 저장에 실패했습니다.",
      });
    }
  },

  async saveScreenBaseballSettlement({ totalAmount, loserName }) {
    const { group, members } = get();
    const payer =
      members.find((member) => member.displayName === "김민수") ?? members[0];
    const loser = members.find((member) => member.displayName === loserName);

    if (!group || !payer || !loser) {
      set({
        status: "error",
        errorMessage: "스크린야구 결제자 또는 패자를 찾을 수 없습니다.",
      });
      return;
    }

    set({ status: "saving", errorMessage: null });

    try {
      const settlement = await api.createScreenBaseballSettlement({
        groupId: group.id,
        payerMemberId: payer.id,
        loserMemberIds: [loser.id],
        title: "스크린야구 정산",
        totalAmount,
      });
      const { burdenSummary, recentRecords } = await loadGroupSnapshots(
        group.id,
      );

      set({
        status: "ready",
        lastScreenBaseballSettlement: settlement,
        burdenSummary,
        recentRecords,
      });
    } catch (error) {
      set({
        status: "error",
        errorMessage:
          error instanceof Error
            ? error.message
            : "스크린야구 정산 저장에 실패했습니다.",
      });
    }
  },
}));
