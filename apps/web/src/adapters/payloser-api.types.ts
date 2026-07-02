export type ApiUser = {
  id: string;
  nickname: string;
  profileImageUrl?: string | null;
};

export type ApiGroupMember = {
  id: string;
  userId: string | null;
  displayName: string;
  role: "OWNER" | "MEMBER";
  isActive?: boolean;
  profileImageUrl?: string | null;
};

export type ApiGroup = {
  coverImageUrl?: string | null;
  id: string;
  imageUrl?: string | null;
  name: string;
  revision?: number;
  themeColor: string;
  members: ApiGroupMember[];
};

export type ApiGroupRevision = {
  id: string;
  revision: number;
};

export type ApiGroupInvitation = {
  id: string;
  groupId: string;
  token: string;
  createdByUserId: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
};

export type ApiGroupInvitationDetails = {
  group: {
    coverImageUrl?: string | null;
    id: string;
    imageUrl?: string | null;
    memberCount: number;
    name: string;
    themeColor: string;
  };
  token: string;
  viewer: {
    joinRequest: {
      id: string;
      requestedAt: string;
      status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
    } | null;
    member: {
      displayName: string;
      id: string;
      role: "OWNER" | "MEMBER";
    } | null;
    membership: "MEMBER" | "NONE";
  } | null;
};

export type ApiGroupJoinRequest = {
  id: string;
  requestedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  user: {
    id: string;
    nickname: string;
    profileImageUrl?: string | null;
  };
};

export type ApiRequestToJoinResponse = {
  groupId: string;
  request: ApiGroupJoinRequest | null;
  status: "ALREADY_MEMBER" | "PENDING";
};

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

export type BowlingSettlementResponse = {
  session: {
    id: string;
    activity: "BOWLING";
    title: string;
    occurredAt?: string;
    shareToken?: string | null;
  };
  expenseItem?: {
    totalAmount: number;
  };
  settlement: {
    totalAmount?: number;
    totalStacks?: number | null;
    stackUnitPrice?: number | null;
    burdens: Array<{
      memberId: string;
      exactAmount?: number;
      roundedAmount: number;
      reason: string;
    }>;
  };
  details?: {
    kind: "BOWLING_UNLIMITED_DETAIL";
    version: number;
    participantMemberIds: string[];
    totalStacks: number;
    stackUnitPrice: number;
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
  } | null;
  recovery: {
    payerMemberId: string;
    payerReceivableAmount: number;
    requests: Array<{
      fromMemberId: string;
      toMemberId: string;
      amount: number;
    }>;
  };
};

export type PublicSharedSessionResponse = {
  activity: "BOWLING" | "SCREEN_BASEBALL" | "ROCK_PAPER_SCISSORS";
  group: {
    name: string;
    themeColor: string;
  };
  occurredAt: string;
  title: string;
  summary: {
    participantCount: number;
    stackUnitPrice: number | null;
    totalAmount: number;
    totalStacks: number | null;
  };
  participants: Array<{
    amount: number;
    averageScore: number | null;
    displayName: string;
    stacks: number | null;
  }>;
  expenseItems: Array<{
    allocations: Array<{
      amount: number;
      displayName: string;
      rankingAmount: number;
      reason: string;
    }>;
    payerDisplayName: string;
    title: string;
    totalAmount: number;
  }>;
};

export type RpsHand = "ROCK" | "PAPER" | "SCISSORS";

export type ScreenBaseballSettlementResponse = {
  session: {
    id: string;
    activity: "SCREEN_BASEBALL";
    title: string;
  };
  settlement: {
    burdens: Array<{
      memberId: string;
      amount: number;
      reason: "SCREEN_BASEBALL_LOSER";
    }>;
  };
  recovery: {
    payerMemberId: string;
    payerReceivableAmount: number;
    requests: Array<{
      fromMemberId: string;
      toMemberId: string;
      amount: number;
    }>;
  };
};
