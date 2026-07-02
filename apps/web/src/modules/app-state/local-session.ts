import type {
  ApiGroup,
  ApiGroupMember,
  ApiUser,
} from "@/adapters/payloser-api";
import {
  defaultGroupImageUrl,
  defaultGroupThemeColor,
  withGroupImage,
} from "./group-workspace";

export const demoMemberNames = [
  "강지운",
  "이도윤",
  "최하린",
  "정지우",
  "강태오",
  "한유나",
  "윤건우",
];

const defaultGroupName = "한강 레인클럽";
const localSessionKey = "payloser:local-session";
const selectedGroupKey = "payloser:selected-group-id";

export type LocalSession = {
  user: ApiUser;
  group: ApiGroup;
};

export function createLocalSession(displayName: string): LocalSession {
  const now = Date.now();
  const user: ApiUser = {
    id: `local-user-${now}`,
    nickname: displayName,
  };
  const ownerMember: ApiGroupMember = {
    id: `local-member-owner-${now}`,
    userId: user.id,
    displayName,
    role: "OWNER",
    isActive: true,
  };
  const members = [
    ownerMember,
    ...demoMemberNames.map((name, index) => ({
      id: `local-member-${index + 1}-${now}`,
      userId: null,
      displayName: name,
      role: "MEMBER" as const,
      isActive: true,
    })),
  ];

  return {
    user,
    group: {
      id: `local-group-${now}`,
      imageUrl: defaultGroupImageUrl,
      name: defaultGroupName,
      themeColor: defaultGroupThemeColor,
      members,
    },
  };
}

export function readLocalSession(): LocalSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(localSessionKey);
    return saved ? (JSON.parse(saved) as LocalSession) : null;
  } catch {
    window.localStorage.removeItem(localSessionKey);
    return null;
  }
}

export function writeLocalSession(session: LocalSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(localSessionKey, JSON.stringify(session));
}

export function clearLocalSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(localSessionKey);
  window.localStorage.removeItem(selectedGroupKey);
}

export function updateSavedLocalGroup(group: ApiGroup) {
  const savedSession = readLocalSession();

  if (!savedSession || savedSession.group.id !== group.id) {
    return;
  }

  writeLocalSession({
    ...savedSession,
    group,
  });
}

export function readSelectedGroupId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(selectedGroupKey);
}

export function writeSelectedGroupId(groupId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(selectedGroupKey, groupId);
}

export function clearSelectedGroupId() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(selectedGroupKey);
}

export function toReadyLocalState(session: LocalSession) {
  const group = withGroupImage(session.group);

  return {
    status: "ready" as const,
    errorMessage: null,
    user: session.user,
    groups: [group],
    group: null,
    members: [],
    joinRequests: [],
    burdenSummary: [],
    recentRecords: [],
  };
}
