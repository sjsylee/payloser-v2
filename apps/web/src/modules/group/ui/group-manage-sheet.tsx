"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown, Image as ImageIcon, UserPlus } from "lucide-react";
import type {
  ApiGroup,
  ApiGroupJoinRequest,
  ApiGroupMember,
} from "@/adapters/payloser-api";
import { useGroupManagementWorkflow } from "@/modules/group/model/use-group-management-workflow";
import {
  GroupPhoto,
  MemberProfileAvatar,
} from "@/modules/group/ui/group-avatars";
import { KakaoTalkIcon } from "@/shared/ui/kakao-talk-icon";

export function GroupManageSheet({
  canManage,
  currentGroup,
  currentUserMemberId,
  disabled,
  errorMessage,
  joinRequests,
  onAddMember,
  onApproveJoinRequest,
  onClose,
  onCreateInvitation,
  onRejectJoinRequest,
  onSubmitName,
  open,
  ownerMember,
}: {
  canManage: boolean;
  currentGroup: ApiGroup;
  currentUserMemberId: string | null;
  disabled: boolean;
  errorMessage: string | null;
  joinRequests: ApiGroupJoinRequest[];
  onAddMember: (displayName: string) => Promise<void>;
  onApproveJoinRequest: (
    requestId: string,
    input:
      | { mode: "LINK_EXISTING"; memberId: string }
      | { mode: "CREATE_MEMBER"; displayName: string },
  ) => Promise<void>;
  onClose: () => void;
  onCreateInvitation: () => Promise<string | null>;
  onRejectJoinRequest: (requestId: string) => Promise<void>;
  onSubmitName: (input: {
    coverImageUrl?: string | null;
    imageUrl?: string | null;
    name: string;
    themeColor?: string;
  }) => Promise<void>;
  open: boolean;
  ownerMember: ApiGroupMember | null;
}) {
  const {
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
  } = useGroupManagementWorkflow({
    currentGroup,
    joinRequests,
    onAddMember,
    onApproveJoinRequest,
    onCreateInvitation,
    onSubmitName,
    open,
  });

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-ink/35 px-3 backdrop-blur-sm lg:absolute lg:rounded-[32px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[min(760px,calc(100svh-32px))] w-full max-w-[392px] overflow-y-auto rounded-[30px] bg-white p-4 shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-ink/45">그룹</p>
                <h2 className="text-lg font-black">그룹 관리</h2>
              </div>
              <button
                onClick={onClose}
                className="h-10 rounded-2xl bg-[#F4F0E8] px-4 text-xs font-black text-ink/55"
              >
                닫기
              </button>
            </div>

            <div className="mt-4 rounded-[24px] bg-ink p-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <GroupPhoto
                    group={{
                      imageUrl: groupImageUrl || currentGroup.imageUrl,
                      name: groupName || currentGroup.name,
                      themeColor: groupThemeColor,
                    }}
                    className="h-16 w-16"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white/45">
                      현재 그룹
                    </p>
                    <p className="mt-1 truncate text-2xl font-black text-[#FEE500]">
                      {currentGroup.name}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/70">
                  {currentGroup.members.length}명
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-[18px] bg-white/10 p-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FEE500] text-ink">
                  <Crown className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-white/45">대표</p>
                  <p className="truncate text-sm font-black">
                    {ownerMember?.displayName ?? "대표 없음"}
                  </p>
                </div>
              </div>
            </div>

            <form
              className="mt-3 rounded-[24px] bg-[#F4F0E8] p-3"
              onSubmit={async (event) => {
                event.preventDefault();
                await submitGroupProfile();
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black text-ink/45">그룹 정보</p>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-black text-ink/45">
                  {canManage ? "수정 가능" : "대표 전용"}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-[52px_minmax(0,1fr)_66px] gap-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={!canManage || disabled}
                  className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[18px] bg-white disabled:opacity-55"
                  aria-label="그룹 사진 선택"
                >
                  <GroupPhoto
                    group={{
                      imageUrl: groupImagePreview || groupImageUrl,
                      name: groupName,
                      themeColor: groupThemeColor,
                    }}
                    className="h-full w-full rounded-[18px]"
                  />
                  <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-tl-xl bg-ink text-white">
                    <ImageIcon className="h-3 w-3" />
                  </span>
                </button>
                <div className="min-w-0">
                  <input
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    disabled={!canManage || disabled}
                    className="h-12 w-full min-w-0 rounded-[18px] border-0 bg-white px-3 text-sm font-black outline-none disabled:opacity-55"
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      selectGroupImageFile(event.target.files?.[0])
                    }
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    !canManage ||
                    disabled ||
                    uploadingImage ||
                    !updateGroupInput
                  }
                  className="h-12 rounded-[18px] bg-ink text-xs font-black text-white transition active:scale-[0.98] disabled:opacity-35"
                >
                  저장
                </button>
              </div>
              <p className="mt-2 text-[11px] font-bold text-ink/42">
                {groupImageFile
                  ? "새 사진 선택됨"
                  : "사진은 왼쪽 아이콘으로 변경"}
              </p>
              <div className="mt-3 rounded-[22px] bg-white p-2">
                <button
                  type="button"
                  onClick={() => coverImageInputRef.current?.click()}
                  disabled={!canManage || disabled}
                  className="relative flex min-h-[112px] w-full overflow-hidden rounded-[20px] bg-ink text-left disabled:opacity-55"
                  aria-label="홈 카드 배경 선택"
                >
                  {coverImagePreview || coverImageUrl ? (
                    <img
                      src={coverImagePreview || coverImageUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_26%,rgba(254,229,0,0.95),transparent_18%),radial-gradient(circle_at_78%_20%,rgba(47,125,109,0.82),transparent_18%),linear-gradient(135deg,#181716_0%,#2f2d29_100%)]" />
                  )}
                  <div className="absolute inset-0 bg-ink/50" />
                  <div className="relative flex h-full min-h-[112px] w-full flex-col justify-between p-3 text-white">
                    <span className="text-[11px] font-black text-white/60">
                      홈 카드 배경
                    </span>
                    <span>
                      <span className="block text-lg font-black">
                        볼링 정산 바로 시작
                      </span>
                      <span className="mt-1 inline-flex rounded-full bg-[#FEE500] px-3 py-1 text-[11px] font-black text-ink">
                        {coverImageFile ? "새 배경 선택됨" : "배경 바꾸기"}
                      </span>
                    </span>
                  </div>
                </button>
                <input
                  ref={coverImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    selectCoverImageFile(event.target.files?.[0])
                  }
                />
              </div>
            </form>

            {canManage && joinRequests.length > 0 ? (
              <div className="mt-3 rounded-[24px] bg-ink p-3 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-white/45">
                      가입 요청
                    </p>
                    <p className="text-sm font-black">대표가 확인할 차례</p>
                  </div>
                  <span className="rounded-full bg-[#FEE500] px-2.5 py-1 text-[11px] font-black text-ink">
                    {joinRequests.length}건
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {joinRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-[20px] bg-white/10 p-2"
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          name={request.user.nickname}
                          profileImageUrl={request.user.profileImageUrl}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black">
                            {request.user.nickname}
                          </p>
                          <p className="text-[10px] font-black text-white/42">
                            승인 대기
                          </p>
                        </div>
                        <button
                          onClick={() => openApprovePanel(request)}
                          disabled={disabled}
                          className="h-9 rounded-[16px] bg-[#FEE500] px-3 text-xs font-black text-ink transition active:scale-[0.98] disabled:opacity-45"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => void onRejectJoinRequest(request.id)}
                          disabled={disabled}
                          className="h-9 rounded-[16px] bg-white/10 px-3 text-xs font-black text-white/62 transition active:scale-[0.98] disabled:opacity-45"
                        >
                          거절
                        </button>
                      </div>

                      {activeJoinRequest?.id === request.id ? (
                        <div className="mt-2 rounded-[18px] bg-white p-2 text-ink">
                          <p className="text-[11px] font-black text-ink/45">
                            기존 임시 멤버에 연결
                          </p>
                          {pendingMembers.length > 0 ? (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {pendingMembers.map((member) => {
                                const selected =
                                  member.id === selectedPendingMemberId;

                                return (
                                  <button
                                    key={member.id}
                                    onClick={() =>
                                      setSelectedPendingMemberId(member.id)
                                    }
                                    className={`min-h-10 rounded-[16px] px-2 text-left text-xs font-black transition active:scale-[0.98] ${
                                      selected ? "bg-[#FEE500]" : "bg-[#F4F0E8]"
                                    }`}
                                  >
                                    {member.displayName}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="mt-2 rounded-[16px] bg-[#F4F0E8] px-3 py-2 text-xs font-bold text-ink/45">
                              연결할 임시 멤버가 없어요.
                            </p>
                          )}
                          <button
                            onClick={() => void approveWithExistingMember()}
                            disabled={disabled || !selectedPendingMemberId}
                            className="mt-2 h-10 w-full rounded-[16px] bg-ink text-xs font-black text-white transition active:scale-[0.98] disabled:opacity-35"
                          >
                            선택한 멤버에 연결
                          </button>

                          <div className="mt-3 border-t border-ink/10 pt-3">
                            <p className="text-[11px] font-black text-ink/45">
                              새 멤버로 승인
                            </p>
                            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_84px] gap-2">
                              <input
                                value={newMemberDisplayName}
                                onChange={(event) =>
                                  setNewMemberDisplayName(event.target.value)
                                }
                                className="h-10 min-w-0 rounded-[16px] border-0 bg-[#F4F0E8] px-3 text-xs font-black outline-none"
                              />
                              <button
                                onClick={() => void approveWithNewMember()}
                                disabled={
                                  disabled || !newMemberDisplayName.trim()
                                }
                                className="h-10 rounded-[16px] bg-[#FEE500] text-xs font-black text-ink transition active:scale-[0.98] disabled:opacity-35"
                              >
                                승인
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-3 rounded-[24px] bg-[#F4F0E8] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-ink/45">초대</p>
                  <p className="text-sm font-black">카톡으로 그룹 초대</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-ink/45">
                  톡방 선택
                </span>
              </div>
              <button
                type="button"
                onClick={() => void shareInvitation()}
                disabled={disabled || inviteWorking}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-[#FEE500] px-4 text-sm font-black text-ink transition active:scale-[0.99] disabled:bg-[#FFF3A6] disabled:text-ink/35"
              >
                <KakaoTalkIcon className="h-5 w-5 shrink-0" />
                {inviteWorking
                  ? "초대장 준비 중"
                  : copied
                    ? "초대장 링크 복사됨"
                    : "카톡으로 초대"}
              </button>
              <p className="mt-2 text-[11px] font-bold leading-4 text-ink/42">
                카톡에서 보낼 톡방을 고릅니다. 안 열리면 초대 링크를 복사합니다.
              </p>
              <div className="mt-3 rounded-[20px] bg-white p-2">
                <button
                  type="button"
                  onClick={() => setDirectAddOpen((open) => !open)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[17px] px-2 text-left transition active:scale-[0.99]"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-ink text-white">
                      <UserPlus className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-black">
                        임시 멤버 직접 추가
                      </span>
                      <span className="block text-[10px] font-bold text-ink/42">
                        가입 전 친구도 정산에 먼저 넣기
                      </span>
                    </span>
                  </span>
                  <span className="rounded-full bg-[#F4F0E8] px-2.5 py-1 text-[11px] font-black text-ink/45">
                    {directAddOpen ? "닫기" : "열기"}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {directAddOpen ? (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.16 }}
                      className="overflow-hidden"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void submitDirectMember();
                      }}
                    >
                      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_72px] gap-2 border-t border-ink/10 pt-2">
                        <input
                          ref={directMemberInputRef}
                          value={directMemberName}
                          onChange={(event) =>
                            setDirectMemberName(event.target.value)
                          }
                          disabled={disabled || directAddWorking}
                          placeholder="이름"
                          className="h-11 min-w-0 rounded-[17px] border-0 bg-[#F4F0E8] px-3 text-sm font-black outline-none ring-1 ring-transparent transition placeholder:text-ink/32 focus:ring-ink/18 disabled:opacity-45"
                        />
                        <button
                          type="submit"
                          disabled={
                            disabled ||
                            directAddWorking ||
                            directMemberName.trim().length === 0
                          }
                          className="h-11 rounded-[17px] bg-ink text-xs font-black text-white transition active:scale-[0.98] disabled:opacity-35"
                        >
                          {directAddWorking ? "추가 중" : "추가"}
                        </button>
                      </div>
                    </motion.form>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-3 rounded-[24px] bg-[#F4F0E8] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-ink/45">멤버</p>
                  <p className="text-sm font-black">그룹 인원</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-ink/45">
                  {currentGroup.members.length}명
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {currentGroup.members.map((member) => (
                  <div
                    key={member.id}
                    className={`flex min-w-0 items-center gap-2 rounded-[18px] p-2 ${
                      member.id === currentUserMemberId
                        ? "bg-[#FEE500]"
                        : "bg-white"
                    }`}
                  >
                    <MemberProfileAvatar member={member} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black">
                        {member.displayName}
                      </span>
                      <span className="block text-[10px] font-black text-ink/42">
                        {member.role === "OWNER" ? "대표" : "멤버"}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {errorMessage ? (
              <div className="mt-3 rounded-[18px] bg-[#FFF4F1] px-3 py-2 text-xs font-bold text-strike">
                {errorMessage}
              </div>
            ) : null}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function UserAvatar({
  name,
  profileImageUrl,
}: {
  name: string;
  profileImageUrl?: string | null | undefined;
}) {
  return (
    <span className="flex h-9 w-9 shrink-0 overflow-hidden rounded-2xl bg-white/10 text-xs font-black text-white">
      {profileImageUrl ? (
        <img
          src={profileImageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {name.slice(0, 1)}
        </span>
      )}
    </span>
  );
}
