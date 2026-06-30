import { GroupsController } from "./groups.controller";
import type { AuthService } from "../auth/auth.service";
import type { GroupsService } from "./groups.service";

describe("GroupsController", () => {
  it("validates and forwards group creation", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준",
        },
      }),
    } as unknown as AuthService;
    const service = {
      createGroup: jest.fn().mockResolvedValue({
        id: "group-1",
        name: "볼링팟",
        members: [{ userId: "user-1", displayName: "준", role: "OWNER" }],
      }),
    } as unknown as GroupsService;
    const controller = new GroupsController(service, authService);

    await expect(
      controller.createGroup(
        {
          name: " 볼링팟 ",
          ownerDisplayName: " 준 ",
          imageUrl: "https://cdn.example.com/group.png",
        },
        { cookies: { payloser_session: "session-token" } },
      ),
    ).resolves.toMatchObject({
      id: "group-1",
      name: "볼링팟",
    });
    expect(authService.getSessionUser).toHaveBeenCalledWith("session-token");
    expect(service.createGroup).toHaveBeenCalledWith({
      userId: "user-1",
      input: {
        name: "볼링팟",
        imageUrl: "https://cdn.example.com/group.png",
        themeColor: "#FEE500",
        ownerDisplayName: "준",
      },
    });
  });

  it("lists only groups for the current session user", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준",
        },
      }),
    } as unknown as AuthService;
    const service = {
      listGroups: jest
        .fn()
        .mockResolvedValue([{ id: "group-1", name: "볼링팟" }]),
    } as unknown as GroupsService;
    const controller = new GroupsController(service, authService);

    await expect(
      controller.listGroups({ cookies: { payloser_session: "session-token" } }),
    ).resolves.toEqual([{ id: "group-1", name: "볼링팟" }]);
    expect(service.listGroups).toHaveBeenCalledWith("user-1");
  });

  it("validates and forwards group updates for the current session user", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준",
        },
      }),
    } as unknown as AuthService;
    const service = {
      updateGroup: jest.fn().mockResolvedValue({
        id: "group-1",
        name: "한강 볼링팟",
        members: [],
      }),
    } as unknown as GroupsService;
    const controller = new GroupsController(service, authService);

    await expect(
      controller.updateGroup(
        "group-1",
        {
          name: " 한강 볼링팟 ",
          imageUrl: "https://cdn.example.com/group-next.png",
        },
        { cookies: { payloser_session: "session-token" } },
      ),
    ).resolves.toMatchObject({
      id: "group-1",
      name: "한강 볼링팟",
    });
    expect(service.updateGroup).toHaveBeenCalledWith({
      requesterUserId: "user-1",
      groupId: "group-1",
      input: {
        name: "한강 볼링팟",
        imageUrl: "https://cdn.example.com/group-next.png",
      },
    });
  });

  it("summarizes cumulative group burdens for the current session user", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준",
        },
      }),
    } as unknown as AuthService;
    const service = {
      summarizeGroup: jest.fn().mockResolvedValue([
        {
          memberId: "member-1",
          displayName: "민지",
          bowlingAmount: 20000,
          screenBaseballAmount: 12000,
          totalAmount: 32000,
          rpsLosses: 1,
        },
      ]),
    } as unknown as GroupsService;
    const controller = new GroupsController(service, authService);

    await expect(
      controller.summarizeGroup("group-1", {
        cookies: { payloser_session: "session-token" },
      }),
    ).resolves.toEqual([
      {
        memberId: "member-1",
        displayName: "민지",
        bowlingAmount: 20000,
        screenBaseballAmount: 12000,
        totalAmount: 32000,
        rpsLosses: 1,
      },
    ]);
    expect(service.summarizeGroup).toHaveBeenCalledWith({
      requesterUserId: "user-1",
      groupId: "group-1",
    });
  });

  it("lists recent records for the current session user", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준",
        },
      }),
    } as unknown as AuthService;
    const service = {
      listRecentRecords: jest.fn().mockResolvedValue([
        {
          id: "session-1",
          activity: "BOWLING",
          title: "무제한 볼링",
          occurredAt: "2026-06-22T12:30:00.000Z",
          totalAmount: 120000,
          rpsLossCount: 0,
        },
      ]),
    } as unknown as GroupsService;
    const controller = new GroupsController(service, authService);

    await expect(
      controller.listRecentRecords("group-1", {
        cookies: { payloser_session: "session-token" },
      }),
    ).resolves.toEqual([
      {
        id: "session-1",
        activity: "BOWLING",
        title: "무제한 볼링",
        occurredAt: "2026-06-22T12:30:00.000Z",
        totalAmount: 120000,
        rpsLossCount: 0,
      },
    ]);
    expect(service.listRecentRecords).toHaveBeenCalledWith({
      requesterUserId: "user-1",
      groupId: "group-1",
    });
  });

  it("adds a temporary member to a group for the current session user", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준",
        },
      }),
    } as unknown as AuthService;
    const service = {
      addTemporaryMember: jest.fn().mockResolvedValue({
        id: "member-1",
        groupId: "group-1",
        userId: null,
        displayName: "민수",
        role: "MEMBER",
      }),
    } as unknown as GroupsService;
    const controller = new GroupsController(service, authService);

    await expect(
      controller.addTemporaryMember(
        "group-1",
        {
          displayName: " 민수 ",
          profileImageUrl: "https://cdn.example.com/minsu.png",
        },
        { cookies: { payloser_session: "session-token" } },
      ),
    ).resolves.toMatchObject({
      id: "member-1",
      userId: null,
      displayName: "민수",
    });
    expect(service.addTemporaryMember).toHaveBeenCalledWith({
      requesterUserId: "user-1",
      groupId: "group-1",
      input: {
        displayName: "민수",
        profileImageUrl: "https://cdn.example.com/minsu.png",
      },
    });
  });

  it("creates an invitation token for a group member", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-1",
          nickname: "준",
        },
      }),
    } as unknown as AuthService;
    const service = {
      createInvitation: jest.fn().mockResolvedValue({
        id: "invite-1",
        groupId: "group-1",
        token: "invite-token",
        createdByUserId: "user-1",
      }),
    } as unknown as GroupsService;
    const controller = new GroupsController(service, authService);

    await expect(
      controller.createInvitation("group-1", {
        cookies: { payloser_session: "session-token" },
      }),
    ).resolves.toMatchObject({
      token: "invite-token",
    });
    expect(service.createInvitation).toHaveBeenCalledWith({
      requesterUserId: "user-1",
      groupId: "group-1",
    });
  });

  it("rotates a group invitation token for the current owner", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "owner-user",
          nickname: "대표",
        },
      }),
    } as unknown as AuthService;
    const service = {
      rotateInvitation: jest.fn().mockResolvedValue({
        id: "invite-2",
        token: "next-token",
      }),
    } as unknown as GroupsService;
    const controller = new GroupsController(service, authService);

    await expect(
      controller.rotateInvitation("group-1", {
        cookies: { payloser_session: "session-token" },
      }),
    ).resolves.toMatchObject({
      token: "next-token",
    });
    expect(service.rotateInvitation).toHaveBeenCalledWith({
      requesterUserId: "owner-user",
      groupId: "group-1",
    });
  });

  it("revokes a group invitation token for the current owner", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "owner-user",
          nickname: "대표",
        },
      }),
    } as unknown as AuthService;
    const service = {
      revokeInvitation: jest.fn().mockResolvedValue({
        ok: true,
      }),
    } as unknown as GroupsService;
    const controller = new GroupsController(service, authService);

    await expect(
      controller.revokeInvitation("group-1", "invite-1", {
        cookies: { payloser_session: "session-token" },
      }),
    ).resolves.toEqual({
      ok: true,
    });
    expect(service.revokeInvitation).toHaveBeenCalledWith({
      requesterUserId: "owner-user",
      groupId: "group-1",
      invitationId: "invite-1",
    });
  });

  it("creates a join request from a group invitation", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "user-2",
          nickname: "민수",
        },
      }),
    } as unknown as AuthService;
    const service = {
      requestToJoin: jest.fn().mockResolvedValue({
        groupId: "group-1",
        status: "PENDING",
        request: {
          id: "join-request-1",
          userId: "user-2",
          status: "PENDING",
        },
      }),
    } as unknown as GroupsService;
    const controller = new GroupsController(service, authService);

    await expect(
      controller.requestToJoin("invite-token", {
        cookies: { payloser_session: "session-token" },
      }),
    ).resolves.toMatchObject({
      groupId: "group-1",
      status: "PENDING",
    });
    expect(service.requestToJoin).toHaveBeenCalledWith({
      token: "invite-token",
      userId: "user-2",
    });
  });

  it("approves a join request by linking an existing temporary member", async () => {
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({
        user: {
          id: "owner-user",
          nickname: "대표",
        },
      }),
    } as unknown as AuthService;
    const service = {
      approveJoinRequest: jest.fn().mockResolvedValue({
        id: "group-1",
        members: [],
      }),
    } as unknown as GroupsService;
    const controller = new GroupsController(service, authService);

    await expect(
      controller.approveJoinRequest(
        "group-1",
        "join-request-1",
        {
          mode: "LINK_EXISTING",
          memberId: "member-1",
        },
        { cookies: { payloser_session: "session-token" } },
      ),
    ).resolves.toMatchObject({
      id: "group-1",
    });
    expect(service.approveJoinRequest).toHaveBeenCalledWith({
      requesterUserId: "owner-user",
      groupId: "group-1",
      requestId: "join-request-1",
      input: {
        mode: "LINK_EXISTING",
        memberId: "member-1",
      },
    });
  });
});
