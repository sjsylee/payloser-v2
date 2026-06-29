"use client";

import { useMemo } from "react";
import type {
  ApiGroup,
  ApiGroupMember,
  BowlingSettlementResponse,
  GroupBurdenSummaryRow,
  GroupRecentRecord,
} from "@/adapters/payloser-api";
import {
  sampleBurdens,
  sampleMembers,
  sampleRecords,
  sampleTransferRows,
} from "@/shared/fixtures/app-fixtures";
import {
  buildGroupAccessModel,
  buildHeaderMemberModels,
  sortMembersWithCurrentUserFirst,
} from "@/modules/group/model/group-view";
import {
  buildShareText,
  buildTransferRows,
  mapRecentRecord,
} from "@/modules/settlement/model/settlement-view";

type UseHomePageModelInput = {
  burdenSummary: GroupBurdenSummaryRow[];
  group: ApiGroup | null;
  lastBowlingSettlement: BowlingSettlementResponse | null;
  recentRecords: GroupRecentRecord[];
  userId: string | null | undefined;
};

export function useHomePageModel({
  burdenSummary,
  group,
  lastBowlingSettlement,
  recentRecords,
  userId,
}: UseHomePageModelInput) {
  const groupMembersForHeader = useMemo<ApiGroupMember[]>(
    () => (group ? sortMembersWithCurrentUserFirst(group.members, userId) : []),
    [group, userId],
  );

  const rankingRows = useMemo(
    () =>
      burdenSummary.length > 0
        ? burdenSummary.map((row) => ({
            name: row.displayName,
            bowling: row.bowlingAmount,
            rpsLosses: row.rpsLosses,
          }))
        : sampleBurdens,
    [burdenSummary],
  );

  const ranking = useMemo(
    () =>
      [...rankingRows]
        .sort((left, right) => right.bowling - left.bowling)
        .map((row, index) => ({ ...row, rank: index + 1 })),
    [rankingRows],
  );

  const recordRows = useMemo(
    () =>
      (group ? recentRecords.map(mapRecentRecord) : sampleRecords).filter(
        (record) => record.kind === "bowling",
      ),
    [group, recentRecords],
  );

  const liveTransferRows = useMemo(
    () =>
      buildTransferRows({
        bowlingSettlement: lastBowlingSettlement,
        members: group?.members ?? [],
      }),
    [group?.members, lastBowlingSettlement],
  );

  const transferRowsForView = group ? liveTransferRows : sampleTransferRows;

  const shareText = useMemo(
    () => buildShareText(group?.name ?? "한강 레인클럽", transferRowsForView),
    [group?.name, transferRowsForView],
  );

  const headerMembers = useMemo(
    () =>
      group ? buildHeaderMemberModels(groupMembersForHeader) : sampleMembers,
    [groupMembersForHeader, group],
  );

  const groupAccessModel = useMemo(
    () =>
      buildGroupAccessModel({
        group,
        userId,
      }),
    [group, userId],
  );

  return {
    groupMembersForHeader,
    headerMembers,
    ranking,
    recordRows,
    shareText,
    transferRowsForView,
    ...groupAccessModel,
  };
}
