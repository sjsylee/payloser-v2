"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ApiGroup,
  ApiGroupJoinRequest,
  ApiGroupMember,
} from "@/adapters/payloser-api";
import {
  preloadKakaoShare,
  sendKakaoTextShare,
} from "@/shared/kakao/kakao-share";
import { uploadGroupImageFile } from "./group-actions";
import { buildUpdateGroupInput, getEditableGroupImageUrl } from "./group-view";

type UseGroupManagementWorkflowInput = {
  currentGroup: ApiGroup;
  joinRequests: ApiGroupJoinRequest[];
  onAddMember: (displayName: string) => Promise<void>;
  onApproveJoinRequest: (
    requestId: string,
    input:
      | { mode: "LINK_EXISTING"; memberId: string }
      | { mode: "CREATE_MEMBER"; displayName: string },
  ) => Promise<void>;
  onCreateInvitation: () => Promise<string | null>;
  onSubmitName: (input: {
    coverImageUrl?: string | null;
    imageUrl?: string | null;
    name: string;
    themeColor?: string;
  }) => Promise<void>;
  open: boolean;
};

export function useGroupManagementWorkflow({
  currentGroup,
  joinRequests,
  onAddMember,
  onApproveJoinRequest,
  onCreateInvitation,
  onSubmitName,
  open,
}: UseGroupManagementWorkflowInput) {
  const [copied, setCopied] = useState(false);
  const currentEditableImageUrl = getEditableGroupImageUrl(
    currentGroup.imageUrl,
  );
  const [groupImageUrl, setGroupImageUrl] = useState(currentEditableImageUrl);
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);
  const [groupImagePreview, setGroupImagePreview] = useState<string | null>(
    null,
  );
  const [coverImageUrl, setCoverImageUrl] = useState(
    currentGroup.coverImageUrl ?? "",
  );
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null,
  );
  const [groupName, setGroupName] = useState(currentGroup.name);
  const [groupThemeColor, setGroupThemeColor] = useState(
    currentGroup.themeColor,
  );
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteWorking, setInviteWorking] = useState(false);
  const [directAddOpen, setDirectAddOpen] = useState(false);
  const [directMemberName, setDirectMemberName] = useState("");
  const [directAddWorking, setDirectAddWorking] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [selectedPendingMemberId, setSelectedPendingMemberId] = useState<
    string | null
  >(null);
  const [newMemberDisplayName, setNewMemberDisplayName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(
    null,
  );
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const coverImageInputRef = useRef<HTMLInputElement | null>(null);
  const directMemberInputRef = useRef<HTMLInputElement | null>(null);
  const prefetchingInviteRef = useRef(false);
  const inviteUrl = inviteToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inviteToken}`
    : "";
  const updateGroupInput = buildUpdateGroupInput({
    currentGroup,
    draftCoverImageUrl: coverImageUrl,
    draftImageUrl: groupImageUrl,
    draftName: groupName,
    draftThemeColor: groupThemeColor,
    hasNewCoverImageFile: Boolean(coverImageFile),
    hasNewImageFile: Boolean(groupImageFile),
  });
  const pendingMembers = currentGroup.members.filter(
    (member) => member.isActive !== false && !member.userId,
  );
  const activeJoinRequest =
    joinRequests.find((request) => request.id === activeRequestId) ?? null;

  useEffect(() => {
    if (open) {
      setGroupImageUrl(currentEditableImageUrl);
      setGroupImageFile(null);
      setGroupImagePreview(null);
      setCoverImageUrl(currentGroup.coverImageUrl ?? "");
      setCoverImageFile(null);
      setCoverImagePreview(null);
      setGroupName(currentGroup.name);
      setGroupThemeColor(currentGroup.themeColor);
      setActiveRequestId(null);
      setInviteToken(null);
      setSelectedPendingMemberId(null);
      setNewMemberDisplayName("");
      setProfileErrorMessage(null);
      setDirectAddOpen(false);
      setDirectMemberName("");
    }
  }, [
    currentEditableImageUrl,
    currentGroup.coverImageUrl,
    currentGroup.id,
    currentGroup.name,
    currentGroup.themeColor,
    open,
  ]);

  useEffect(() => {
    return () => {
      if (groupImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(groupImagePreview);
      }
      if (coverImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(coverImagePreview);
      }
    };
  }, [coverImagePreview, groupImagePreview]);

  useEffect(() => {
    if (directAddOpen) {
      directMemberInputRef.current?.focus();
    }
  }, [directAddOpen]);

  useEffect(() => {
    if (!open) {
      prefetchingInviteRef.current = false;
      return;
    }

    void preloadKakaoShare();

    if (inviteToken || prefetchingInviteRef.current) {
      return;
    }

    let canceled = false;
    prefetchingInviteRef.current = true;

    onCreateInvitation()
      .then((token) => {
        if (!canceled && token) {
          setInviteToken(token);
          setCopied(false);
        }
      })
      .catch(() => {
        // The share button still has the explicit copy fallback path.
      })
      .finally(() => {
        if (!canceled) {
          prefetchingInviteRef.current = false;
        }
      });

    return () => {
      canceled = true;
    };
  }, [inviteToken, onCreateInvitation, open]);

  const selectGroupImageFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    if (groupImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(groupImagePreview);
    }

    setGroupImageFile(file);
    setGroupImagePreview(URL.createObjectURL(file));
    setProfileErrorMessage(null);
  };

  const selectCoverImageFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    if (coverImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(coverImagePreview);
    }

    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
    setProfileErrorMessage(null);
  };

  const getOrCreateInviteUrl = async () => {
    if (inviteUrl) {
      return inviteUrl;
    }

    const token = await onCreateInvitation();

    if (token) {
      setInviteToken(token);
      setCopied(false);
      return `${window.location.origin}/invite/${token}`;
    }

    return null;
  };

  const shareInvitation = async () => {
    if (inviteWorking) {
      return;
    }

    setInviteWorking(true);

    try {
      const nextInviteUrl = inviteUrl || (await getOrCreateInviteUrl());

      if (!nextInviteUrl) {
        return;
      }

      let shared = false;

      try {
        shared = await sendKakaoTextShare({
          buttonTitle: "초대장 열기",
          description: "같이 친 사람만 쏙 고르고, 진 사람 계산은 알아서 착착.",
          title: `${currentGroup.name} 초대장이 왔어요`,
          url: nextInviteUrl,
        });
      } catch {
        shared = false;
      }

      if (!shared) {
        await navigator.clipboard.writeText(
          `${currentGroup.name} 초대장이 왔어요.\n같이 친 사람만 쏙 고르고, 진 사람 계산은 알아서 착착.\n${nextInviteUrl}`,
        );
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }
    } finally {
      setInviteWorking(false);
    }
  };

  const submitGroupProfile = async () => {
    setUploadingImage(Boolean(groupImageFile || coverImageFile));
    setProfileErrorMessage(null);

    try {
      const [uploadedImage, uploadedCoverImage] = await Promise.all([
        uploadGroupImageFile(groupImageFile),
        uploadGroupImageFile(coverImageFile),
      ]);
      const nextUpdateGroupInput = buildUpdateGroupInput({
        currentGroup,
        draftCoverImageUrl: coverImageUrl,
        draftImageUrl: groupImageUrl,
        draftName: groupName,
        draftThemeColor: groupThemeColor,
        hasNewCoverImageFile: Boolean(coverImageFile),
        hasNewImageFile: Boolean(groupImageFile),
        uploadedCoverImageUrl: uploadedCoverImage?.url ?? null,
        uploadedImageUrl: uploadedImage?.url ?? null,
      });

      if (nextUpdateGroupInput) {
        await onSubmitName(nextUpdateGroupInput);
        setGroupImageFile(null);
        setCoverImageFile(null);
        setGroupImagePreview(null);
        setCoverImagePreview(null);
        setGroupImageUrl(uploadedImage?.url ?? groupImageUrl);
        setCoverImageUrl(uploadedCoverImage?.url ?? coverImageUrl);
      }
    } catch {
      setProfileErrorMessage("사진 저장이 막혔어요. 다시 시도해주세요.");
    } finally {
      setUploadingImage(false);
    }
  };

  const submitDirectMember = async () => {
    const displayName = directMemberName.trim();

    if (!displayName || directAddWorking) {
      return;
    }

    setDirectAddWorking(true);

    try {
      await onAddMember(displayName);
      setDirectMemberName("");
      setDirectAddOpen(false);
    } finally {
      setDirectAddWorking(false);
    }
  };

  const openApprovePanel = (request: ApiGroupJoinRequest) => {
    setActiveRequestId(request.id);
    setSelectedPendingMemberId(pendingMembers[0]?.id ?? null);
    setNewMemberDisplayName(request.user.nickname.slice(0, 40));
  };

  const approveWithExistingMember = async () => {
    if (!activeJoinRequest || !selectedPendingMemberId) {
      return;
    }

    await onApproveJoinRequest(activeJoinRequest.id, {
      mode: "LINK_EXISTING",
      memberId: selectedPendingMemberId,
    });
    setActiveRequestId(null);
  };

  const approveWithNewMember = async () => {
    if (!activeJoinRequest) {
      return;
    }

    const displayName = newMemberDisplayName.trim();

    if (!displayName) {
      return;
    }

    await onApproveJoinRequest(activeJoinRequest.id, {
      mode: "CREATE_MEMBER",
      displayName,
    });
    setActiveRequestId(null);
  };

  return {
    activeJoinRequest,
    approveWithExistingMember,
    approveWithNewMember,
    copied,
    coverImageFile,
    coverImageInputRef,
    coverImagePreview,
    coverImageUrl,
    directAddOpen,
    directAddWorking,
    directMemberInputRef,
    directMemberName,
    groupImageFile,
    groupImagePreview,
    groupImageUrl,
    groupName,
    groupThemeColor,
    imageInputRef,
    inviteWorking,
    newMemberDisplayName,
    openApprovePanel,
    pendingMembers,
    profileErrorMessage,
    selectCoverImageFile,
    selectGroupImageFile,
    selectedPendingMemberId,
    setDirectAddOpen,
    setDirectMemberName,
    setGroupName,
    setNewMemberDisplayName,
    setSelectedPendingMemberId,
    shareInvitation,
    submitDirectMember,
    submitGroupProfile,
    updateGroupInput,
    uploadingImage,
  };
}
