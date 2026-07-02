import type {
  AddTemporaryMemberBody,
  ApproveJoinRequestBody,
  CreateGroupBodyInput,
  DevLoginBody,
  TransferOwnerBody,
  UpdateGroupBody,
} from "@payloser/shared";
import type {
  ApiGroup,
  ApiGroupRevision,
  ApiGroupInvitation,
  ApiGroupInvitationDetails,
  ApiGroupJoinRequest,
  ApiGroupMember,
  ApiRequestToJoinResponse,
  ApiUser,
  BowlingSettlementResponse,
  GroupBurdenSummaryRow,
  GroupRecentRecord,
  PublicSharedSessionResponse,
  RpsHand,
  ScreenBaseballSettlementResponse,
} from "./payloser-api.types";

export type {
  ApiGroup,
  ApiGroupRevision,
  ApiGroupInvitation,
  ApiGroupInvitationDetails,
  ApiGroupJoinRequest,
  ApiGroupMember,
  ApiRequestToJoinResponse,
  ApiUser,
  BowlingSettlementResponse,
  GroupBurdenSummaryRow,
  GroupRecentRecord,
  PublicSharedSessionResponse,
  ScreenBaseballSettlementResponse,
} from "./payloser-api.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getKakaoLoginUrl(returnTo?: string) {
    const url = new URL(`${API_BASE_URL}/auth/kakao/start`);

    if (returnTo) {
      url.searchParams.set("returnTo", returnTo);
    }

    return url.toString();
  },

  devLogin(nickname: string, profileImageUrl?: string | null) {
    const body: DevLoginBody = { nickname, profileImageUrl };

    return request<{ user: ApiUser }>("/auth/dev-login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  logout() {
    return request<{ ok: true }>("/auth/logout", {
      method: "POST",
    });
  },

  me() {
    return request<{ user: ApiUser }>("/auth/me");
  },

  listGroups() {
    return request<ApiGroup[]>("/groups");
  },

  getGroup(groupId: string) {
    return request<ApiGroup>(`/groups/${groupId}`);
  },

  getGroupRevision(groupId: string) {
    return request<ApiGroupRevision>(`/groups/${groupId}/revision`);
  },

  createGroup(input: CreateGroupBodyInput) {
    return request<ApiGroup>("/groups", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateGroup(groupId: string, input: UpdateGroupBody) {
    return request<ApiGroup>(`/groups/${groupId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  addTemporaryMember(
    groupId: string,
    displayName: string,
    profileImageUrl?: string | null,
  ) {
    const body: AddTemporaryMemberBody = { displayName, profileImageUrl };

    return request<ApiGroupMember>(`/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  removeGroupMember(groupId: string, memberId: string) {
    return request<ApiGroup>(`/groups/${groupId}/members/${memberId}`, {
      method: "DELETE",
    });
  },

  getGroupSummary(groupId: string) {
    return request<GroupBurdenSummaryRow[]>(`/groups/${groupId}/summary`);
  },

  listGroupRecords(groupId: string) {
    return request<GroupRecentRecord[]>(`/groups/${groupId}/records`);
  },

  createGroupInvitation(groupId: string) {
    return request<ApiGroupInvitation>(`/groups/${groupId}/invitations`, {
      method: "POST",
    });
  },

  rotateGroupInvitation(groupId: string) {
    return request<ApiGroupInvitation>(
      `/groups/${groupId}/invitations/rotate`,
      {
        method: "POST",
      },
    );
  },

  revokeGroupInvitation(groupId: string, invitationId: string) {
    return request<{ ok: true }>(
      `/groups/${groupId}/invitations/${invitationId}`,
      {
        method: "DELETE",
      },
    );
  },

  getGroupInvitation(token: string) {
    return request<ApiGroupInvitationDetails>(`/groups/invitations/${token}`);
  },

  requestGroupJoin(token: string) {
    return request<ApiRequestToJoinResponse>(
      `/groups/invitations/${token}/requests`,
      {
        method: "POST",
      },
    );
  },

  cancelGroupJoinRequest(token: string) {
    return request<{ ok: true }>(
      `/groups/invitations/${token}/requests/cancel`,
      {
        method: "POST",
      },
    );
  },

  listGroupJoinRequests(groupId: string) {
    return request<ApiGroupJoinRequest[]>(`/groups/${groupId}/join-requests`);
  },

  approveGroupJoinRequest(
    groupId: string,
    requestId: string,
    input: ApproveJoinRequestBody,
  ) {
    return request<ApiGroup>(
      `/groups/${groupId}/join-requests/${requestId}/approve`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },

  rejectGroupJoinRequest(groupId: string, requestId: string) {
    return request<{ ok: true }>(
      `/groups/${groupId}/join-requests/${requestId}/reject`,
      {
        method: "POST",
      },
    );
  },

  uploadImage(file: File) {
    const body = new FormData();
    body.append("file", file);

    return request<{ url: string }>("/uploads/images", {
      method: "POST",
      body,
    });
  },

  leaveGroup(groupId: string) {
    return request<{ ok: true }>(`/groups/${groupId}/leave`, {
      method: "POST",
    });
  },

  transferGroupOwner(groupId: string, memberId: string) {
    const body: TransferOwnerBody = { memberId };

    return request<ApiGroup>(`/groups/${groupId}/owner`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  deleteGroup(groupId: string) {
    return request<{ ok: true }>(`/groups/${groupId}`, {
      method: "DELETE",
    });
  },

  createUnlimitedBowlingSettlement(input: {
    groupId: string;
    payerMemberId: string;
    title: string;
    totalAmount: number;
    roundingUnit: 1 | 10 | 100;
    occurredAt?: string;
    games: Array<{
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
  }) {
    return request<BowlingSettlementResponse>(
      "/bowling/sessions/unlimited-settlements",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },

  getBowlingSessionSettlement(sessionId: string) {
    return request<BowlingSettlementResponse>(
      `/bowling/sessions/${sessionId}/settlement`,
    );
  },

  getPublicSharedSession(token: string) {
    return request<PublicSharedSessionResponse>(`/share/sessions/${token}`);
  },

  deleteBowlingSession(sessionId: string) {
    return request<{ ok: true }>(`/bowling/sessions/${sessionId}`, {
      method: "DELETE",
    });
  },

  createRpsRecord(input: {
    groupId: string;
    loserMemberId: string;
    loserHand: RpsHand;
    context: string;
  }) {
    return request<{ id: string; activity: "ROCK_PAPER_SCISSORS" }>(
      "/rps/records",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },

  createScreenBaseballSettlement(input: {
    groupId: string;
    payerMemberId: string;
    loserMemberIds: string[];
    title: string;
    totalAmount: number;
  }) {
    return request<ScreenBaseballSettlementResponse>(
      "/screen-baseball/settlements",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },
};

export function mapKoreanRpsHand(hand: string): RpsHand {
  if (hand === "바위") {
    return "ROCK";
  }

  if (hand === "가위") {
    return "SCISSORS";
  }

  return "PAPER";
}
