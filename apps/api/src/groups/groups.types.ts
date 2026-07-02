import type {
  AddTemporaryMemberBody,
  ApproveJoinRequestBody,
  CreateGroupBody,
  TransferOwnerBody,
  UpdateGroupBody,
} from "./groups.schemas";

export interface CreateGroupForUserInput {
  userId: string;
  input: CreateGroupBody;
}

export interface AddTemporaryMemberInput {
  requesterUserId: string;
  groupId: string;
  input: AddTemporaryMemberBody;
}

export interface UpdateGroupInput {
  requesterUserId: string;
  groupId: string;
  input: UpdateGroupBody;
}

export interface CreateInvitationInput {
  requesterUserId: string;
  groupId: string;
}

export interface RotateInvitationInput {
  requesterUserId: string;
  groupId: string;
}

export interface RevokeInvitationInput {
  requesterUserId: string;
  groupId: string;
  invitationId: string;
}

export interface RemoveGroupMemberInput {
  requesterUserId: string;
  groupId: string;
  memberId: string;
}

export interface GetInvitationInput {
  token: string;
  viewerUserId?: string | null;
}

export interface RequestToJoinInput {
  token: string;
  userId: string;
}

export interface ListJoinRequestsInput {
  requesterUserId: string;
  groupId: string;
}

export interface ApproveJoinRequestInput {
  requesterUserId: string;
  groupId: string;
  requestId: string;
  input: ApproveJoinRequestBody;
}

export interface ResolveJoinRequestInput {
  requesterUserId: string;
  groupId: string;
  requestId: string;
}

export interface CancelJoinRequestInput {
  token: string;
  userId: string;
}

export interface TransferOwnerInput {
  requesterUserId: string;
  groupId: string;
  input: TransferOwnerBody;
}

export interface SummarizeGroupInput {
  requesterUserId: string;
  groupId: string;
}

export type GroupBurdenSummaryRow = {
  memberId: string;
  displayName: string;
  bowlingAmount: number;
  screenBaseballAmount: number;
  totalAmount: number;
  rpsLosses: number;
};

export type GroupRecentRecord = {
  id: string;
  activity: "BOWLING" | "SCREEN_BASEBALL" | "ROCK_PAPER_SCISSORS";
  title: string;
  occurredAt: string;
  totalAmount: number;
  rpsLossCount: number;
};
