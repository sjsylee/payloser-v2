import { describe, expect, it } from "vitest";
import {
  appendInvitedMemberName,
  buildCreateGroupInput,
  buildGroupAccessModel,
  buildGroupCardModels,
  buildHeaderMemberModels,
  buildGroupMenuModel,
  buildUpdateGroupInput,
  getEditableGroupImageUrl,
  getMemberTone,
  isGeneratedGroupPhotoUrl,
  normalizeInvitedMemberNames,
  sortMembersWithCurrentUserFirst,
} from "./group-view";
import type { ApiGroup } from "@/adapters/payloser-api";

const group: ApiGroup = {
  id: "group-1",
  imageUrl: null,
  name: "한강 레인클럽",
  themeColor: "#FEE500",
  members: [
    {
      displayName: "김민수",
      id: "member-1",
      isActive: true,
      role: "OWNER",
      userId: "user-1",
    },
    {
      displayName: "강지운",
      id: "member-2",
      isActive: true,
      role: "MEMBER",
      userId: "user-2",
    },
    {
      displayName: "휴면 멤버",
      id: "member-3",
      isActive: false,
      role: "MEMBER",
      userId: null,
    },
  ],
};

describe("group view", () => {
  it("sorts the current user to the front without mutating the members", () => {
    const members = [
      { id: "member-1", userId: "user-1" },
      { id: "member-2", userId: "user-2" },
    ];

    expect(sortMembersWithCurrentUserFirst(members, "user-2")).toEqual([
      { id: "member-2", userId: "user-2" },
      { id: "member-1", userId: "user-1" },
    ]);
    expect(members[0]?.id).toBe("member-1");
  });

  it("selects stable member tones", () => {
    expect(getMemberTone("김민수")).toBe("bg-[#FEE500] text-ink");
    expect(getMemberTone("새멤버", 1)).toBe("bg-[#2F7D6D] text-white");
    expect(getMemberTone("새멤버")).toContain("text-");
  });

  it("detects generated group photo URLs", () => {
    expect(isGeneratedGroupPhotoUrl("data:image/svg+xml,%3Csvg")).toBe(true);
    expect(isGeneratedGroupPhotoUrl("/uploads/groups/photo.jpg")).toBe(false);
    expect(isGeneratedGroupPhotoUrl(null)).toBe(false);
    expect(getEditableGroupImageUrl("data:image/svg+xml,%3Csvg")).toBe("");
    expect(getEditableGroupImageUrl("/uploads/groups/photo.jpg")).toBe(
      "/uploads/groups/photo.jpg",
    );
  });

  it("normalizes invited member names for the group creation draft", () => {
    expect(
      normalizeInvitedMemberNames({
        invitedNames: [" 강지운 ", "김민수", "", "강지운", "최하린"],
        ownerDisplayName: "김민수",
      }),
    ).toEqual(["강지운", "최하린"]);
    expect(
      appendInvitedMemberName({
        inputName: " 강지운 ",
        invitedNames: ["최하린"],
        ownerDisplayName: "김민수",
      }),
    ).toEqual(["최하린", "강지운"]);
  });

  it("builds a validated group creation input", () => {
    expect(
      buildCreateGroupInput({
        groupName: " 한강 레인클럽 ",
        imageUrl: "/uploads/groups/photo.jpg",
        invitedNames: ["강지운", "김민수", "강지운"],
        ownerDisplayName: "김민수",
        themeColor: "#FEE500",
      }),
    ).toEqual({
      imageUrl: "/uploads/groups/photo.jpg",
      initialMemberNames: ["강지운"],
      name: "한강 레인클럽",
      ownerDisplayName: "김민수",
      themeColor: "#FEE500",
    });
    expect(
      buildCreateGroupInput({
        groupName: "   ",
        invitedNames: ["강지운"],
        ownerDisplayName: "김민수",
        themeColor: "#FEE500",
      }),
    ).toBeNull();
  });

  it("builds lobby group card models", () => {
    expect(
      buildGroupCardModels({
        fallbackOwnerName: "김민수",
        groups: [group],
        userId: "user-1",
      }),
    ).toEqual([
      {
        group,
        id: "group-1",
        isOwner: true,
        memberCount: 3,
        name: "한강 레인클럽",
        ownerName: "김민수",
        previewMembers: group.members.slice(0, 3),
      },
    ]);
  });

  it("builds header member and group access models", () => {
    expect(buildHeaderMemberModels(group.members)).toEqual([
      {
        name: "김민수",
        profileImageUrl: null,
        tone: "bg-[#FEE500] text-ink",
      },
      {
        name: "강지운",
        profileImageUrl: null,
        tone: "bg-[#2F7D6D] text-white",
      },
      {
        name: "휴면 멤버",
        profileImageUrl: null,
        tone: "bg-[#E84D3D] text-white",
      },
    ]);
    expect(
      buildGroupAccessModel({
        group,
        userId: "user-1",
      }),
    ).toEqual({
      canManage: true,
      currentUserMembership: group.members[0],
      ownerMember: group.members[0],
    });
    expect(
      buildGroupAccessModel({
        group,
        userId: "missing",
      }),
    ).toEqual({
      canManage: false,
      currentUserMembership: null,
      ownerMember: group.members[0],
    });
  });

  it("builds group update input only when a valid draft changed", () => {
    expect(
      buildUpdateGroupInput({
        currentGroup: group,
        draftImageUrl: "",
        draftName: "한강 레인클럽",
        draftThemeColor: "#FEE500",
        hasNewImageFile: false,
      }),
    ).toBeNull();
    expect(
      buildUpdateGroupInput({
        currentGroup: group,
        draftImageUrl: "",
        draftName: "  ",
        draftThemeColor: "#FEE500",
        hasNewImageFile: false,
      }),
    ).toBeNull();
    expect(
      buildUpdateGroupInput({
        currentGroup: group,
        draftImageUrl: "",
        draftName: " 새 레인클럽 ",
        draftThemeColor: "#181716",
        hasNewImageFile: true,
        uploadedImageUrl: "/uploads/groups/new.jpg",
      }),
    ).toEqual({
      imageUrl: "/uploads/groups/new.jpg",
      name: "새 레인클럽",
      themeColor: "#181716",
    });
  });

  it("builds the lobby group menu model for owner actions", () => {
    expect(
      buildGroupMenuModel({
        groupMenuId: "group-1",
        groups: [group],
        userId: "user-1",
      }),
    ).toMatchObject({
      activeMembers: [group.members[0], group.members[1]],
      currentMembership: group.members[0],
      isOwner: true,
      menuAction: {
        kind: "transfer-owner",
        label: "대표 넘기기",
        notice: "대표는 먼저 다른 멤버에게 대표를 넘겨야 나갈 수 있어요.",
      },
      owner: group.members[0],
      selectedGroup: group,
      transferCandidates: [group.members[1]],
    });
  });

  it("uses delete and leave actions for single-owner and member menus", () => {
    expect(
      buildGroupMenuModel({
        groupMenuId: "group-1",
        groups: [
          {
            ...group,
            members: [group.members[0]!],
          },
        ],
        userId: "user-1",
      }).menuAction,
    ).toEqual({
      confirmMessage: "이 그룹을 삭제할까요?",
      kind: "delete-group",
      label: "그룹 삭제",
    });
    expect(
      buildGroupMenuModel({
        groupMenuId: "group-1",
        groups: [group],
        userId: "user-2",
      }).menuAction,
    ).toEqual({
      confirmMessage: "이 그룹에서 나갈까요?",
      kind: "leave-group",
      label: "그룹 나가기",
    });
  });

  it("builds an empty lobby group menu model when no group is selected", () => {
    expect(
      buildGroupMenuModel({
        groupMenuId: null,
        groups: [group],
        userId: "user-1",
      }),
    ).toEqual({
      activeMembers: [],
      currentMembership: undefined,
      isOwner: false,
      menuAction: { kind: "none" },
      owner: undefined,
      selectedGroup: null,
      transferCandidates: [],
    });
  });
});
