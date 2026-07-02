"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  LogOut,
  MoreHorizontal,
  Plus,
  UsersRound,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FloatingMark,
  LoginHeroVisual,
} from "@/modules/app-shell/ui/auth-visuals";
import {
  GroupPhoto,
  MemberProfileAvatar,
} from "@/modules/group/ui/group-avatars";
import { KakaoIcon } from "@/shared/ui/sport-icons";
import { SafeAreaChrome } from "@/shared/ui/safe-area-chrome";
import type { ApiGroup, ApiUser } from "@/adapters/payloser-api";
import {
  startKakaoLogin,
  uploadGroupImageFile,
} from "@/modules/group/model/group-actions";
import {
  appendInvitedMemberName,
  buildCreateGroupInput,
  buildGroupCardModels,
  buildGroupMenuModel,
} from "@/modules/group/model/group-view";

const lobbyTabs: Array<{
  id: "groups" | "profile";
  label: string;
  icon: LucideIcon;
}> = [
  { id: "groups", label: "그룹", icon: UsersRound },
  { id: "profile", label: "내 정보", icon: UserRound },
];

export function AuthOnboarding({
  errorMessage,
  groups,
  onCreateGroup,
  onDeleteGroup,
  onLeaveGroup,
  onLogout,
  onSelectGroup,
  onTransferOwner,
  status,
  user,
}: {
  errorMessage: string | null;
  groups: ApiGroup[];
  onCreateGroup: (input: {
    imageUrl?: string | null;
    initialMemberNames?: string[];
    name: string;
    ownerDisplayName?: string;
    themeColor?: string;
  }) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  onLeaveGroup: (groupId: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onSelectGroup: (groupId: string) => Promise<void>;
  onTransferOwner: (groupId: string, memberId: string) => Promise<void>;
  status: "idle" | "connecting" | "ready" | "saving" | "error";
  user: ApiUser | null;
}) {
  const [groupName, setGroupName] = useState("");
  const busy = status === "connecting" || status === "saving";

  if (user) {
    return (
      <>
        <SafeAreaChrome
          backgroundColor="#F4F0E8"
          bottomColor="#F4F0E8"
          themeColor="#F4F0E8"
          topColor="#F4F0E8"
        />
        <GroupLobby
          busy={busy}
          errorMessage={errorMessage}
          groupName={groupName}
          groups={groups}
          onCreateGroup={onCreateGroup}
          onDeleteGroup={onDeleteGroup}
          onLeaveGroup={onLeaveGroup}
          onLogout={onLogout}
          onSelectGroup={onSelectGroup}
          onTransferOwner={onTransferOwner}
          setGroupName={setGroupName}
          status={status}
          user={user}
        />
      </>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#F4F0E8] text-ink">
      <SafeAreaChrome
        backgroundColor="#F4F0E8"
        bottomColor="#F4F0E8"
        themeColor="#181716"
        topColor="#181716"
      />
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex min-h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-ink shadow-2xl lg:min-h-[calc(100svh-48px)] lg:rounded-[34px]"
      >
        <div className="flex min-h-0 flex-1 flex-col px-7 pb-6 pt-7 text-white">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04, duration: 0.24 }}
          >
            <p className="text-xs font-black text-[#FEE500]">Payloser</p>
          </motion.div>

          <div className="flex min-h-0 flex-1 flex-col justify-center pb-2">
            <motion.div
              aria-hidden
              className="mb-8 flex justify-center"
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.36 }}
            >
              <LoginHeroVisual />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.28 }}
            >
              <h1 className="pt-2 pb-1 text-[33px] font-extrabold leading-[1.28]">
                오늘 진 사람,
                <br />
                계산은 깔끔하게
              </h1>
              <p className="mt-4 text-sm font-semibold leading-6 text-white/64">
                같이 친 사람만 쏙 고르고,
                <br />진 사람 계산은 알아서 착착.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="bg-[#F4F0E8] px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-5 shadow-[0_-18px_38px_rgba(0,0,0,0.2)]">
          {errorMessage ? (
            <div className="mb-3 rounded-[20px] bg-white px-4 py-3 text-sm font-bold text-strike shadow-sm">
              {errorMessage}
            </div>
          ) : null}
          <button
            onClick={() => {
              startKakaoLogin();
            }}
            disabled={busy}
            className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-[22px] bg-[#FEE500] text-[15px] font-black text-ink shadow-[0_14px_28px_rgba(24,23,22,0.14)] transition active:scale-[0.98] disabled:opacity-45"
          >
            {status === "connecting" ? (
              "확인중"
            ) : (
              <>
                <KakaoIcon className="h-6 w-6 text-ink" />
                카카오로 1초 로그인
              </>
            )}
          </button>
        </div>
      </motion.section>
    </main>
  );
}

function GroupLobby({
  busy,
  errorMessage,
  groupName,
  groups,
  onCreateGroup,
  onDeleteGroup,
  onLeaveGroup,
  onLogout,
  onSelectGroup,
  onTransferOwner,
  setGroupName,
  status,
  user,
}: {
  busy: boolean;
  errorMessage: string | null;
  groupName: string;
  groups: ApiGroup[];
  onCreateGroup: (input: {
    imageUrl?: string | null;
    initialMemberNames?: string[];
    name: string;
    ownerDisplayName?: string;
    themeColor?: string;
  }) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  onLeaveGroup: (groupId: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onSelectGroup: (groupId: string) => Promise<void>;
  onTransferOwner: (groupId: string, memberId: string) => Promise<void>;
  setGroupName: (name: string) => void;
  status: "idle" | "connecting" | "ready" | "saving" | "error";
  user: ApiUser;
}) {
  const [view, setView] = useState<"list" | "create">("list");
  const [activeLobbyTab, setActiveLobbyTab] = useState<"groups" | "profile">(
    "groups",
  );
  const [groupMenuId, setGroupMenuId] = useState<string | null>(null);
  const [transferMode, setTransferMode] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [invitedNames, setInvitedNames] = useState<string[]>([]);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<
    string | null
  >(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
    null,
  );
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const userInitial = user.nickname.slice(0, 1);
  const groupCards = useMemo(
    () =>
      buildGroupCardModels({
        fallbackOwnerName: user.nickname,
        groups,
        userId: user.id,
      }),
    [groups, user.id, user.nickname],
  );
  const {
    isOwner: menuIsOwner,
    menuAction: groupMenuAction,
    owner: selectedGroupOwner,
    selectedGroup: selectedMenuGroup,
    transferCandidates,
  } = useMemo(
    () =>
      buildGroupMenuModel({
        groupMenuId,
        groups,
        userId: user.id,
      }),
    [groupMenuId, groups, user.id],
  );

  useEffect(() => {
    return () => {
      if (selectedImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const closeGroupMenu = () => {
    setGroupMenuId(null);
    setTransferMode(false);
  };

  const selectImageFile = (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLocalErrorMessage("이미지 파일만 고를 수 있어요.");
      return;
    }

    if (selectedImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImageFile(file);
    setSelectedImagePreview(URL.createObjectURL(file));
    setLocalErrorMessage(null);
  };

  const addInvitedName = () => {
    setInvitedNames((names) =>
      appendInvitedMemberName({
        inputName: memberName,
        invitedNames: names,
        ownerDisplayName: user.nickname,
      }),
    );
    setMemberName("");
  };

  if (view === "create") {
    return (
      <main className="min-h-[100dvh] bg-[#F4F0E8] text-ink">
        <div className="flex min-h-[100dvh] w-full flex-col bg-[#F4F0E8]">
          <header className="px-5 pb-3 pt-4">
            <button
              onClick={() => setView("list")}
              className="mb-4 flex h-10 items-center gap-1 rounded-2xl bg-[#F4F0E8] px-3 text-xs font-black text-ink/60"
            >
              <ChevronLeft className="h-4 w-4" />
              그룹 목록
            </button>
            <p className="text-xs font-black text-ink/42">새 그룹</p>
            <h1 className="mt-1 text-[26px] font-black leading-tight">
              같이 칠 사람부터
              <br />
              깔끔하게 모아요
            </h1>
          </header>

          <form
            className="flex flex-1 flex-col px-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
            onSubmit={async (event) => {
              event.preventDefault();

              try {
                setUploadingImage(Boolean(selectedImageFile));
                setLocalErrorMessage(null);
                const uploadedImage =
                  await uploadGroupImageFile(selectedImageFile);
                const createInput = buildCreateGroupInput({
                  groupName,
                  imageUrl: uploadedImage?.url ?? null,
                  invitedNames,
                  ownerDisplayName: user.nickname,
                  themeColor: "#FEE500",
                });

                if (!createInput) {
                  return;
                }

                await onCreateGroup(createInput);
              } catch (error) {
                setLocalErrorMessage(
                  error instanceof Error
                    ? error.message
                    : "그룹 생성에 실패했습니다.",
                );
              } finally {
                setUploadingImage(false);
              }
            }}
          >
            <section className="rounded-[28px] bg-ink p-4 text-white">
              <div className="flex items-end gap-3">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="relative flex h-[74px] w-[74px] shrink-0 overflow-hidden rounded-[26px] bg-[#FEE500] text-ink"
                  aria-label="그룹 사진 선택"
                >
                  {selectedImagePreview ? (
                    <img
                      src={selectedImagePreview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center">
                      <ImageIcon className="h-7 w-7" />
                    </span>
                  )}
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => selectImageFile(event.target.files?.[0])}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black text-white/45">그룹</p>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-white/55">
                      {selectedImageFile ? "사진 선택됨" : "사진 선택"}
                    </span>
                  </div>
                  <input
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    className="mt-2 h-12 w-full rounded-[20px] border-0 bg-white px-4 text-base font-black text-ink outline-none"
                    placeholder="예: 한강 레인클럽"
                  />
                </div>
              </div>
              <div className="mt-3 rounded-[22px] bg-white/10 p-3">
                <p className="text-xs font-black text-white/45">대표</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 overflow-hidden rounded-2xl bg-[#FEE500] text-ink">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-xs font-black">
                        {userInitial}
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-black">{user.nickname}</span>
                </div>
              </div>
            </section>

            <section className="mt-3 rounded-[28px] bg-[#F4F0E8] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-ink/45">초대</p>
                  <h2 className="text-base font-black">같이 칠 친구 추가</h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/55">
                  {invitedNames.length}명
                </span>
              </div>
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_64px] gap-2">
                <input
                  value={memberName}
                  onChange={(event) => setMemberName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addInvitedName();
                    }
                  }}
                  className="h-11 min-w-0 rounded-[18px] border-0 bg-white px-4 text-sm font-black outline-none"
                  placeholder="친구 이름"
                />
                <button
                  type="button"
                  onClick={addInvitedName}
                  className="h-11 rounded-[18px] bg-white text-xs font-black text-ink"
                >
                  추가
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="flex h-9 items-center gap-2 rounded-full bg-[#FEE500] px-3 text-xs font-black">
                  {user.nickname}
                  <span className="text-ink/45">대표</span>
                </span>
                {invitedNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() =>
                      setInvitedNames((names) =>
                        names.filter((item) => item !== name),
                      )
                    }
                    className="h-9 rounded-full bg-white px-3 text-xs font-black text-ink"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </section>

            {localErrorMessage || errorMessage ? (
              <div className="mt-3 rounded-[20px] bg-[#FFF3F0] px-4 py-3 text-sm font-bold text-strike">
                {localErrorMessage ?? errorMessage}
              </div>
            ) : null}

            <div className="mt-auto pt-5">
              <button
                type="submit"
                disabled={busy || uploadingImage || !groupName.trim()}
                className="flex h-[58px] w-full items-center justify-center gap-2 rounded-[22px] bg-ink text-[15px] font-black text-white shadow-[0_14px_28px_rgba(24,23,22,0.14)] transition active:scale-[0.98] disabled:opacity-45"
              >
                <Plus className="h-5 w-5 text-[#FEE500]" />
                {status === "saving" || uploadingImage
                  ? "만드는 중"
                  : "그룹 만들고 시작"}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#F4F0E8] text-ink lg:bg-[#B7C6BE] lg:px-6 lg:py-6">
      <div className="mx-auto flex min-h-[100dvh] w-full flex-col bg-[#F4F0E8] lg:min-h-[calc(100svh-48px)] lg:max-w-5xl lg:overflow-hidden lg:rounded-[34px] lg:shadow-2xl">
        <header className="px-5 pb-3 pt-5 lg:px-8 lg:pb-5 lg:pt-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-ink/42">로비</p>
              <h1 className="text-[28px] font-black leading-tight lg:text-[36px]">
                {activeLobbyTab === "groups" ? "내 그룹" : "내 정보"}
              </h1>
            </div>
            <span className="rounded-full bg-[#F4F0E8] px-3 py-1.5 text-xs font-black text-ink/55">
              {activeLobbyTab === "groups" ? `${groups.length}개` : "계정"}
            </span>
          </div>
          <div className="mt-6 hidden max-w-[360px] rounded-[24px] bg-[#F4F0E8] p-1.5 lg:grid lg:grid-cols-2">
            {lobbyTabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeLobbyTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveLobbyTab(tab.id)}
                  className={`flex h-12 items-center justify-center gap-2 rounded-[19px] text-sm font-black transition-colors duration-150 ${
                    selected
                      ? "bg-[#FEE500] text-ink shadow-sm"
                      : "text-[#615B52] hover:text-ink"
                  }`}
                  aria-current={selected ? "page" : undefined}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-2 lg:px-8 lg:pb-8">
          {activeLobbyTab === "groups" ? (
            <>
              {groups.length > 0 ? (
                <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                  {groupCards.map((groupCard) => {
                    return (
                      <motion.div
                        key={groupCard.id}
                        whileTap={{ scale: 0.985 }}
                        className="grid w-full grid-cols-[minmax(0,1fr)_44px] items-center gap-2 rounded-[26px] bg-[#F4F0E8] p-2 lg:min-h-[112px] lg:p-3"
                      >
                        <button
                          onClick={() => void onSelectGroup(groupCard.id)}
                          disabled={busy}
                          className="grid min-w-0 grid-cols-[58px_minmax(0,1fr)] items-center gap-3 rounded-[22px] p-1 text-left transition active:scale-[0.985] disabled:opacity-45 lg:grid-cols-[70px_minmax(0,1fr)]"
                        >
                          <GroupPhoto
                            group={groupCard.group}
                            className="h-14 w-14 rounded-[20px] lg:h-[70px] lg:w-[70px] lg:rounded-[24px]"
                          />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-[15px] font-black">
                                {groupCard.name}
                              </span>
                              {groupCard.isOwner ? (
                                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-ink/55">
                                  대표
                                </span>
                              ) : null}
                              <span className="shrink-0 text-xs font-bold text-ink/35">
                                {groupCard.memberCount}
                              </span>
                            </span>
                            <span className="mt-1 block truncate text-xs font-bold text-ink/45">
                              대표 {groupCard.ownerName}
                            </span>
                            <span className="mt-2 flex -space-x-1.5">
                              {groupCard.previewMembers.map((member) => (
                                <MemberProfileAvatar
                                  key={member.id}
                                  member={member}
                                  size="sm"
                                />
                              ))}
                            </span>
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setGroupMenuId(groupCard.id);
                            setTransferMode(false);
                          }}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink/55"
                          aria-label={`${groupCard.name} 메뉴`}
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-8 rounded-[30px] bg-[#F4F0E8] p-5 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] bg-[#FEE500]">
                    <UsersRound className="h-8 w-8" />
                  </div>
                  <p className="mt-4 text-lg font-black">아직 그룹이 없어요</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-ink/50">
                    자주 같이 치는 친구들을 먼저 묶어두면 정산이 빨라져요.
                  </p>
                </div>
              )}

              <button
                onClick={() => setView("create")}
                disabled={busy}
                className="mt-4 flex h-[58px] w-full items-center justify-center gap-2 rounded-[22px] bg-ink text-sm font-black text-white shadow-[0_14px_28px_rgba(24,23,22,0.14)] transition active:scale-[0.98] disabled:opacity-45 lg:h-16"
              >
                <Plus className="h-5 w-5 text-[#FEE500]" />새 그룹 만들기
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="rounded-[30px] bg-[#F4F0E8] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-16 w-16 shrink-0 overflow-hidden rounded-[24px] bg-[#FEE500] text-ink">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-xl font-black">
                        {userInitial}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black">
                      {user.nickname}
                    </p>
                    <p className="mt-1 text-xs font-bold text-ink/45">
                      참여 중인 그룹 {groups.length}개
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => void onLogout()}
                disabled={busy}
                className="flex h-[58px] w-full items-center justify-center gap-2 rounded-[22px] bg-ink text-sm font-black text-white shadow-[0_14px_28px_rgba(24,23,22,0.14)] transition active:scale-[0.98] disabled:opacity-45"
              >
                <LogOut className="h-5 w-5 text-[#FEE500]" />
                로그아웃
              </button>
            </div>
          )}

          {errorMessage ? (
            <div className="mt-3 rounded-[20px] bg-[#FFF3F0] px-4 py-3 text-sm font-bold text-strike">
              {errorMessage}
            </div>
          ) : null}
        </section>
        <nav className="fixed bottom-[calc(14px+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100vw-32px)] max-w-[388px] -translate-x-1/2 rounded-[28px] bg-[#FFFDF7] p-1.5 text-[#615B52] shadow-[0_18px_44px_rgba(24,23,22,0.22)] lg:hidden">
          <div className="grid grid-cols-2 gap-1">
            {lobbyTabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeLobbyTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveLobbyTab(tab.id)}
                  className={`flex h-14 items-center justify-center gap-2 rounded-[22px] text-[12px] font-black transition-colors duration-150 ${
                    selected
                      ? "bg-[#FEE500] text-ink"
                      : "text-[#615B52] hover:text-ink"
                  }`}
                  aria-current={selected ? "page" : undefined}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <AnimatePresence>
          {selectedMenuGroup ? (
            <motion.div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/35 px-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeGroupMenu}
            >
              <motion.section
                initial={{ y: 18, scale: 0.98 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 14, scale: 0.98 }}
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-[360px] rounded-[30px] bg-white p-4 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <GroupPhoto
                    group={selectedMenuGroup}
                    className="h-14 w-14 rounded-[20px]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-black">
                      {selectedMenuGroup.name}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-ink/45">
                      대표 {selectedGroupOwner?.displayName ?? "없음"}
                    </p>
                  </div>
                  {menuIsOwner ? (
                    <span className="rounded-full bg-[#FEE500] px-3 py-1 text-xs font-black">
                      대표
                    </span>
                  ) : null}
                </div>

                {transferMode ? (
                  <div className="mt-4 rounded-[24px] bg-[#F4F0E8] p-3">
                    <p className="text-xs font-black text-ink/45">
                      대표 넘기기
                    </p>
                    <div className="mt-2 space-y-2">
                      {transferCandidates.map((member) => (
                        <button
                          key={member.id}
                          onClick={async () => {
                            await onTransferOwner(
                              selectedMenuGroup.id,
                              member.id,
                            );
                            closeGroupMenu();
                          }}
                          disabled={busy}
                          className="flex h-12 w-full items-center gap-2 rounded-[18px] bg-white px-3 text-left text-sm font-black disabled:opacity-45"
                        >
                          <MemberProfileAvatar member={member} size="sm" />
                          {member.displayName}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {groupMenuAction.kind === "transfer-owner" ? (
                      <button
                        onClick={() => setTransferMode(true)}
                        className="flex h-12 w-full items-center justify-between rounded-[18px] bg-[#F4F0E8] px-4 text-sm font-black"
                      >
                        {groupMenuAction.label}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : null}
                    {groupMenuAction.kind === "delete-group" ? (
                      <button
                        onClick={async () => {
                          if (window.confirm(groupMenuAction.confirmMessage)) {
                            await onDeleteGroup(selectedMenuGroup.id);
                            closeGroupMenu();
                          }
                        }}
                        disabled={busy}
                        className="flex h-12 w-full items-center justify-center rounded-[18px] bg-ink text-sm font-black text-white disabled:opacity-45"
                      >
                        {groupMenuAction.label}
                      </button>
                    ) : null}
                    {groupMenuAction.kind === "leave-group" ? (
                      <button
                        onClick={async () => {
                          if (window.confirm(groupMenuAction.confirmMessage)) {
                            await onLeaveGroup(selectedMenuGroup.id);
                            closeGroupMenu();
                          }
                        }}
                        disabled={busy}
                        className="flex h-12 w-full items-center justify-center rounded-[18px] bg-ink text-sm font-black text-white disabled:opacity-45"
                      >
                        {groupMenuAction.label}
                      </button>
                    ) : null}
                    {groupMenuAction.notice ? (
                      <div className="rounded-[18px] bg-[#FFF5F1] px-3 py-3 text-xs font-bold leading-5 text-strike">
                        {groupMenuAction.notice}
                      </div>
                    ) : null}
                  </div>
                )}

                <button
                  onClick={closeGroupMenu}
                  className="mt-3 h-11 w-full rounded-[18px] bg-[#F4F0E8] text-xs font-black text-ink/55"
                >
                  닫기
                </button>
              </motion.section>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}
