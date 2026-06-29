import type { ApiGroup, ApiGroupMember } from "@/adapters/payloser-api";

export const avatarTonePalette = [
  "bg-[#FEE500] text-ink",
  "bg-[#2F7D6D] text-white",
  "bg-[#E84D3D] text-white",
  "bg-ink text-white",
  "bg-[#3B82F6] text-white",
  "bg-[#8B5CF6] text-white",
  "bg-[#16A34A] text-white",
  "bg-[#DB2777] text-white",
  "bg-[#0F766E] text-white",
  "bg-[#B45309] text-white",
];
const fallbackMemberTone = avatarTonePalette[3] ?? "bg-ink text-white";
const memberToneOverrides: Record<string, string> = {
  김민수: avatarTonePalette[0] ?? fallbackMemberTone,
  강지운: avatarTonePalette[1] ?? fallbackMemberTone,
  이도윤: avatarTonePalette[2] ?? fallbackMemberTone,
  최하린: avatarTonePalette[3] ?? fallbackMemberTone,
  정지우: avatarTonePalette[4] ?? fallbackMemberTone,
  강태오: avatarTonePalette[5] ?? fallbackMemberTone,
  한유나: avatarTonePalette[6] ?? fallbackMemberTone,
  윤건우: avatarTonePalette[7] ?? fallbackMemberTone,
};

export type CreateGroupInput = {
  coverImageUrl?: string | null;
  imageUrl?: string | null;
  initialMemberNames: string[];
  name: string;
  ownerDisplayName: string;
  themeColor: string;
};

export type GroupCardModel = {
  group: ApiGroup;
  id: string;
  isOwner: boolean;
  memberCount: number;
  name: string;
  ownerName: string;
  previewMembers: ApiGroupMember[];
};

export type HeaderMemberModel = {
  name: string;
  profileImageUrl: string | null;
  tone: string;
};

export type GroupAccessModel = {
  canManage: boolean;
  currentUserMembership: ApiGroupMember | null;
  ownerMember: ApiGroupMember | null;
};

export type UpdateGroupInput = {
  coverImageUrl?: string | null;
  imageUrl?: string | null;
  name: string;
  themeColor?: string;
};

export type GroupMenuModel = {
  activeMembers: ApiGroupMember[];
  currentMembership: ApiGroupMember | undefined;
  isOwner: boolean;
  menuAction:
    | {
        confirmMessage?: undefined;
        kind: "transfer-owner";
        label: "대표 넘기기";
        notice: "대표는 먼저 다른 멤버에게 대표를 넘겨야 나갈 수 있어요.";
      }
    | {
        confirmMessage: "이 그룹을 삭제할까요?";
        kind: "delete-group";
        label: "그룹 삭제";
        notice?: undefined;
      }
    | {
        confirmMessage: "이 그룹에서 나갈까요?";
        kind: "leave-group";
        label: "그룹 나가기";
        notice?: undefined;
      }
    | {
        confirmMessage?: undefined;
        kind: "none";
        label?: undefined;
        notice?: undefined;
      };
  owner: ApiGroupMember | undefined;
  selectedGroup: ApiGroup | null;
  transferCandidates: ApiGroupMember[];
};

export function isGeneratedGroupPhotoUrl(imageUrl: string | null | undefined) {
  return imageUrl?.startsWith("data:image/svg+xml") ?? false;
}

export function getEditableGroupImageUrl(imageUrl: string | null | undefined) {
  return isGeneratedGroupPhotoUrl(imageUrl) ? "" : (imageUrl ?? "");
}

export function getMemberTone(displayName: string, index?: number) {
  const override = memberToneOverrides[displayName];

  if (override) {
    return override;
  }

  if (index !== undefined) {
    return (
      avatarTonePalette[index % avatarTonePalette.length] ?? fallbackMemberTone
    );
  }

  const hash = Array.from(displayName).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );

  return (
    avatarTonePalette[hash % avatarTonePalette.length] ?? fallbackMemberTone
  );
}

export function sortMembersWithCurrentUserFirst<
  T extends { userId?: string | null },
>(members: T[], userId: string | null | undefined) {
  if (!userId) {
    return members;
  }

  return [...members].sort((left, right) => {
    const leftIsUser = left.userId === userId;
    const rightIsUser = right.userId === userId;

    if (leftIsUser === rightIsUser) {
      return 0;
    }

    return leftIsUser ? -1 : 1;
  });
}

export function normalizeInvitedMemberNames({
  invitedNames,
  ownerDisplayName,
}: {
  invitedNames: string[];
  ownerDisplayName: string;
}) {
  const normalizedNames: string[] = [];

  for (const invitedName of invitedNames) {
    const name = invitedName.trim().slice(0, 40);

    if (name && name !== ownerDisplayName && !normalizedNames.includes(name)) {
      normalizedNames.push(name);
    }
  }

  return normalizedNames;
}

export function appendInvitedMemberName({
  inputName,
  invitedNames,
  ownerDisplayName,
}: {
  inputName: string;
  invitedNames: string[];
  ownerDisplayName: string;
}) {
  return normalizeInvitedMemberNames({
    invitedNames: [...invitedNames, inputName],
    ownerDisplayName,
  });
}

export function buildCreateGroupInput({
  coverImageUrl = null,
  groupName,
  imageUrl = null,
  invitedNames,
  ownerDisplayName,
  themeColor,
}: {
  groupName: string;
  coverImageUrl?: string | null;
  imageUrl?: string | null;
  invitedNames: string[];
  ownerDisplayName: string;
  themeColor: string;
}): CreateGroupInput | null {
  const name = groupName.trim();

  if (!name) {
    return null;
  }

  return {
    ...(coverImageUrl ? { coverImageUrl } : {}),
    imageUrl,
    initialMemberNames: normalizeInvitedMemberNames({
      invitedNames,
      ownerDisplayName,
    }),
    name,
    ownerDisplayName,
    themeColor,
  };
}

export function buildGroupCardModels({
  fallbackOwnerName,
  groups,
  userId,
}: {
  fallbackOwnerName: string;
  groups: ApiGroup[];
  userId: string;
}): GroupCardModel[] {
  return groups.map((group) => {
    const owner = group.members.find((member) => member.role === "OWNER");

    return {
      group,
      id: group.id,
      isOwner: group.members.some(
        (member) => member.userId === userId && member.role === "OWNER",
      ),
      memberCount: group.members.length,
      name: group.name,
      ownerName: owner?.displayName ?? fallbackOwnerName,
      previewMembers: group.members.slice(0, 3),
    };
  });
}

export function buildHeaderMemberModels(
  members: Array<Pick<ApiGroupMember, "displayName" | "profileImageUrl">>,
): HeaderMemberModel[] {
  return members.map((member, index) => ({
    name: member.displayName,
    profileImageUrl: member.profileImageUrl ?? null,
    tone: getMemberTone(member.displayName, index),
  }));
}

export function buildGroupAccessModel({
  group,
  userId,
}: {
  group: ApiGroup | null;
  userId: string | null | undefined;
}): GroupAccessModel {
  const currentUserMembership =
    group?.members.find((member) => member.userId === userId) ?? null;
  const ownerMember =
    group?.members.find((member) => member.role === "OWNER") ?? null;

  return {
    canManage: currentUserMembership?.role === "OWNER",
    currentUserMembership,
    ownerMember,
  };
}

export function buildUpdateGroupInput({
  draftCoverImageUrl,
  currentGroup,
  draftImageUrl,
  draftName,
  draftThemeColor,
  hasNewImageFile,
  hasNewCoverImageFile = false,
  uploadedCoverImageUrl = null,
  uploadedImageUrl = null,
}: {
  currentGroup: ApiGroup;
  draftCoverImageUrl?: string;
  draftImageUrl: string;
  draftName: string;
  draftThemeColor: string;
  hasNewImageFile: boolean;
  hasNewCoverImageFile?: boolean;
  uploadedCoverImageUrl?: string | null;
  uploadedImageUrl?: string | null;
}): UpdateGroupInput | null {
  const name = draftName.trim();
  const imageUrl = uploadedImageUrl ?? draftImageUrl.trim();
  const coverImageUrl =
    uploadedCoverImageUrl ?? draftCoverImageUrl?.trim() ?? null;
  const currentEditableImageUrl = getEditableGroupImageUrl(
    currentGroup.imageUrl,
  );
  const currentCoverImageUrl = currentGroup.coverImageUrl ?? "";
  const coverImageChanged =
    (coverImageUrl ?? "") !== currentCoverImageUrl || hasNewCoverImageFile;

  if (!name) {
    return null;
  }

  if (
    name === currentGroup.name &&
    imageUrl === currentEditableImageUrl &&
    !coverImageChanged &&
    draftThemeColor === currentGroup.themeColor &&
    !hasNewImageFile &&
    !hasNewCoverImageFile
  ) {
    return null;
  }

  return {
    ...(coverImageChanged ? { coverImageUrl } : {}),
    imageUrl,
    name,
    themeColor: draftThemeColor,
  };
}

export function buildGroupMenuModel({
  groupMenuId,
  groups,
  userId,
}: {
  groupMenuId: string | null;
  groups: ApiGroup[];
  userId: string;
}): GroupMenuModel {
  const selectedGroup =
    groups.find((group) => group.id === groupMenuId) ?? null;
  const currentMembership = selectedGroup?.members.find(
    (member) => member.userId === userId,
  );
  const owner = selectedGroup?.members.find(
    (member) => member.role === "OWNER",
  );
  const activeMembers =
    selectedGroup?.members.filter((member) => member.isActive !== false) ?? [];
  const transferCandidates = activeMembers.filter(
    (member) => member.id !== owner?.id,
  );
  const isOwner = currentMembership?.role === "OWNER";
  const menuAction = getGroupMenuAction({
    activeMemberCount: activeMembers.length,
    hasSelectedGroup: Boolean(selectedGroup),
    isOwner,
  });

  return {
    activeMembers,
    currentMembership,
    isOwner,
    menuAction,
    owner,
    selectedGroup,
    transferCandidates,
  };
}

function getGroupMenuAction({
  activeMemberCount,
  hasSelectedGroup,
  isOwner,
}: {
  activeMemberCount: number;
  hasSelectedGroup: boolean;
  isOwner: boolean;
}): GroupMenuModel["menuAction"] {
  if (!hasSelectedGroup) {
    return { kind: "none" };
  }

  if (!isOwner) {
    return {
      confirmMessage: "이 그룹에서 나갈까요?",
      kind: "leave-group",
      label: "그룹 나가기",
    };
  }

  if (activeMemberCount > 1) {
    return {
      kind: "transfer-owner",
      label: "대표 넘기기",
      notice: "대표는 먼저 다른 멤버에게 대표를 넘겨야 나갈 수 있어요.",
    };
  }

  return {
    confirmMessage: "이 그룹을 삭제할까요?",
    kind: "delete-group",
    label: "그룹 삭제",
  };
}
