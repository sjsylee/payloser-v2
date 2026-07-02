import { api } from "@/adapters/payloser-api";
import type { ApiGroup } from "@/adapters/payloser-api";

export const defaultGroupThemeColor = "#FEE500";
export const defaultGroupImageUrl =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20160%20160'%3E%3Crect%20width='160'%20height='160'%20rx='36'%20fill='%23F4F0E8'/%3E%3Ccircle%20cx='58'%20cy='56'%20r='34'%20fill='%23FEE500'/%3E%3Ccircle%20cx='105'%20cy='58'%20r='30'%20fill='%232F8677'/%3E%3Ccircle%20cx='80'%20cy='101'%20r='34'%20fill='%23181716'/%3E%3Crect%20x='45'%20y='116'%20width='70'%20height='10'%20rx='5'%20fill='%23EF4D3D'/%3E%3C/svg%3E";

export function withGroupImage(group: ApiGroup): ApiGroup {
  return {
    ...group,
    imageUrl: group.imageUrl || defaultGroupImageUrl,
    revision: group.revision ?? 1,
    themeColor: group.themeColor || defaultGroupThemeColor,
  };
}

export async function loadGroupSnapshots(groupId: string) {
  const [burdenSummary, recentRecords, joinRequests] = await Promise.all([
    api.getGroupSummary(groupId),
    api.listGroupRecords(groupId),
    api.listGroupJoinRequests(groupId).catch(() => []),
  ]);

  return { burdenSummary, joinRequests, recentRecords };
}

export async function buildGroupWorkspaceState(group: ApiGroup | null) {
  if (!group) {
    return emptyGroupWorkspaceState();
  }

  const { burdenSummary, joinRequests, recentRecords } =
    await loadGroupSnapshots(group.id);

  return {
    burdenSummary,
    group,
    joinRequests,
    members: group.members,
    recentRecords,
  };
}

export function emptyGroupWorkspaceState() {
  return {
    burdenSummary: [],
    group: null,
    joinRequests: [],
    members: [],
    recentRecords: [],
  };
}

export function decorateGroups(groups: ApiGroup[]) {
  return groups.map(withGroupImage);
}

export function replaceGroup(groups: ApiGroup[], nextGroup: ApiGroup) {
  return groups.map((group) => (group.id === nextGroup.id ? nextGroup : group));
}

export function putGroupFirst(groups: ApiGroup[], nextGroup: ApiGroup) {
  return [nextGroup, ...groups.filter((group) => group.id !== nextGroup.id)];
}
