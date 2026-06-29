import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/adapters/payloser-api";
import { usePayloserStore } from "./usePayloserStore";

vi.mock("@/adapters/payloser-api", () => ({
  api: {
    addTemporaryMember: vi.fn(),
    createGroup: vi.fn(),
    createGroupInvitation: vi.fn(),
    createRpsRecord: vi.fn(),
    createScreenBaseballSettlement: vi.fn(),
    createUnlimitedBowlingSettlement: vi.fn(),
    deleteBowlingSession: vi.fn(),
    devLogin: vi.fn(),
    getGroupSummary: vi.fn(),
    listGroupJoinRequests: vi.fn(),
    listGroupRecords: vi.fn(),
    listGroups: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    updateGroup: vi.fn(),
  },
  mapKoreanRpsHand: (hand: string) => hand,
}));

describe("usePayloserStore auth flow", () => {
  beforeEach(() => {
    usePayloserStore.setState({
      burdenSummary: [],
      errorMessage: null,
      group: null,
      groups: [],
      lastBowlingSettlement: null,
      lastRpsRecordId: null,
      lastScreenBaseballSettlement: null,
      members: [],
      recentRecords: [],
      status: "idle",
      user: null,
    });
    vi.mocked(api.devLogin).mockReset();
    vi.mocked(api.createUnlimitedBowlingSettlement).mockReset();
    vi.mocked(api.deleteBowlingSession).mockReset();
    vi.mocked(api.getGroupSummary).mockReset();
    vi.mocked(api.listGroupJoinRequests).mockReset();
    vi.mocked(api.listGroupRecords).mockReset();
    vi.mocked(api.logout).mockReset();
  });

  it("shows a local group list when the API login is unavailable", async () => {
    vi.mocked(api.devLogin).mockRejectedValue(new Error("API unavailable"));

    await usePayloserStore.getState().loginWithName("김서준");

    const state = usePayloserStore.getState();

    expect(state.status).toBe("ready");
    expect(state.user?.nickname).toBe("김서준");
    expect(state.group).toBeNull();
    expect(state.groups[0]?.name).toBe("한강 레인클럽");
    expect(state.groups[0]?.imageUrl).toBeTruthy();
  });

  it("enters the selected local group after login", async () => {
    vi.mocked(api.devLogin).mockRejectedValue(new Error("API unavailable"));
    vi.mocked(api.getGroupSummary).mockRejectedValue(
      new Error("API unavailable"),
    );
    vi.mocked(api.listGroupRecords).mockRejectedValue(
      new Error("API unavailable"),
    );

    await usePayloserStore.getState().loginWithName("김서준");
    const groupId = usePayloserStore.getState().groups[0]?.id;

    expect(groupId).toBeTruthy();

    await usePayloserStore.getState().selectGroup(groupId as string);

    const state = usePayloserStore.getState();

    expect(state.group?.name).toBe("한강 레인클럽");
    expect(state.members).toHaveLength(8);
    expect(state.members[0]).toMatchObject({
      displayName: "김서준",
      role: "OWNER",
      userId: state.user?.id,
    });
  });

  it("clears the current app session on logout", async () => {
    usePayloserStore.setState({
      status: "ready",
      user: {
        id: "user-1",
        nickname: "김서준",
      },
      groups: [
        {
          id: "group-1",
          name: "한강 레인클럽",
          themeColor: "#FEE500",
          members: [],
        },
      ],
      group: {
        id: "group-1",
        name: "한강 레인클럽",
        themeColor: "#FEE500",
        members: [],
      },
      members: [],
    });
    vi.mocked(api.logout).mockResolvedValue({ ok: true });

    await usePayloserStore.getState().logout();

    const state = usePayloserStore.getState();

    expect(api.logout).toHaveBeenCalledOnce();
    expect(state.status).toBe("idle");
    expect(state.user).toBeNull();
    expect(state.groups).toEqual([]);
    expect(state.group).toBeNull();
  });

  it("returns save status for bowling settlements", async () => {
    const payerId = "11111111-1111-4111-8111-111111111111";
    const memberId = "22222222-2222-4222-8222-222222222222";

    usePayloserStore.setState({
      group: {
        id: "33333333-3333-4333-8333-333333333333",
        imageUrl: null,
        members: [
          {
            displayName: "김민수",
            id: payerId,
            role: "OWNER",
            userId: "user-1",
          },
          {
            displayName: "강지운",
            id: memberId,
            role: "MEMBER",
            userId: null,
          },
        ],
        name: "일산볼링클럽",
        themeColor: "#FEE500",
      },
      members: [
        {
          displayName: "김민수",
          id: payerId,
          role: "OWNER",
          userId: "user-1",
        },
        {
          displayName: "강지운",
          id: memberId,
          role: "MEMBER",
          userId: null,
        },
      ],
      status: "ready",
    });
    vi.mocked(api.createUnlimitedBowlingSettlement).mockResolvedValue({
      recovery: {
        payerMemberId: payerId,
        payerReceivableAmount: 60000,
        requests: [],
      },
      session: {
        activity: "BOWLING",
        id: "session-1",
        title: "무제한 볼링 정산",
      },
      settlement: {
        burdens: [],
        stackUnitPrice: 20000,
        totalStacks: 3,
      },
    });
    vi.mocked(api.getGroupSummary).mockResolvedValue([]);
    vi.mocked(api.listGroupRecords).mockResolvedValue([]);
    vi.mocked(api.listGroupJoinRequests).mockResolvedValue([]);

    await expect(
      usePayloserStore.getState().saveBowlingSettlement({
        games: [
          {
            stackAllocations: [
              { memberId: payerId, reason: "FIRST_PLACE", stacks: 0 },
              { memberId, reason: "LAST_PLACE", stacks: 3 },
            ],
          },
        ],
        payerMemberId: payerId,
        totalAmount: 60000,
        totalStacks: 3,
      }),
    ).resolves.toBe(true);
    expect(usePayloserStore.getState().status).toBe("ready");

    vi.mocked(api.createUnlimitedBowlingSettlement).mockRejectedValueOnce(
      new Error("save failed"),
    );

    await expect(
      usePayloserStore.getState().saveBowlingSettlement({
        games: [
          {
            stackAllocations: [
              { memberId: payerId, reason: "FIRST_PLACE", stacks: 0 },
              { memberId, reason: "LAST_PLACE", stacks: 3 },
            ],
          },
        ],
        payerMemberId: payerId,
        totalAmount: 60000,
        totalStacks: 3,
      }),
    ).resolves.toBe(false);
    expect(usePayloserStore.getState().status).toBe("error");
  });

  it("returns delete status for bowling records", async () => {
    usePayloserStore.setState({
      group: {
        id: "33333333-3333-4333-8333-333333333333",
        imageUrl: null,
        members: [],
        name: "일산볼링클럽",
        themeColor: "#FEE500",
      },
      status: "ready",
    });
    vi.mocked(api.deleteBowlingSession).mockResolvedValue({ ok: true });
    vi.mocked(api.getGroupSummary).mockResolvedValue([]);
    vi.mocked(api.listGroupJoinRequests).mockResolvedValue([]);
    vi.mocked(api.listGroupRecords).mockResolvedValue([]);

    await expect(
      usePayloserStore.getState().deleteBowlingRecord("session-1"),
    ).resolves.toBe(true);

    expect(api.deleteBowlingSession).toHaveBeenCalledWith("session-1");
    expect(usePayloserStore.getState().status).toBe("ready");

    vi.mocked(api.deleteBowlingSession).mockRejectedValueOnce(
      new Error("delete failed"),
    );

    await expect(
      usePayloserStore.getState().deleteBowlingRecord("session-1"),
    ).resolves.toBe(false);
    expect(usePayloserStore.getState().status).toBe("error");
  });
});
