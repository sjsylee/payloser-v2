"use client";

import { motion } from "framer-motion";
import { ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type {
  ApiGroupInvitationDetails,
  ApiUser,
} from "@/adapters/payloser-api";
import { api } from "@/adapters/payloser-api";
import { GroupPhoto } from "@/modules/group/ui/group-avatars";
import { KakaoTalkIcon } from "@/shared/ui/kakao-talk-icon";
import { SafeAreaChrome } from "@/shared/ui/safe-area-chrome";

type InviteStatus = "loading" | "ready" | "requesting" | "canceling" | "error";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;
  const [invitation, setInvitation] =
    useState<ApiGroupInvitationDetails | null>(null);
  const [status, setStatus] = useState<InviteStatus>("loading");
  const [user, setUser] = useState<ApiUser | null>(null);

  const loadInvitation = async () => {
    setStatus("loading");

    try {
      const [invitationDetails, session] = await Promise.all([
        api.getGroupInvitation(token),
        api.me().catch(() => null),
      ]);

      setInvitation(invitationDetails);
      setUser(session?.user ?? null);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void loadInvitation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loginWithKakao = () => {
    window.location.href = api.getKakaoLoginUrl(window.location.pathname);
  };

  const requestToJoin = async () => {
    setStatus("requesting");

    try {
      const result = await api.requestGroupJoin(token);

      if (result.status === "ALREADY_MEMBER") {
        router.push("/");
        return;
      }

      await loadInvitation();
    } catch {
      setStatus("error");
    }
  };

  const cancelRequest = async () => {
    setStatus("canceling");

    try {
      await api.cancelGroupJoinRequest(token);
      await loadInvitation();
    } catch {
      setStatus("error");
    }
  };

  const viewer = invitation?.viewer ?? null;
  const pendingRequest = viewer?.joinRequest?.status === "PENDING";
  const rejectedRequest = viewer?.joinRequest?.status === "REJECTED";
  const canceledRequest = viewer?.joinRequest?.status === "CANCELED";

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#F4F0E8] px-4 py-6 text-ink">
      <SafeAreaChrome
        backgroundColor="#F4F0E8"
        bottomColor="#F4F0E8"
        themeColor="#F4F0E8"
        topColor="#F4F0E8"
      />
      <motion.section
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[420px] overflow-hidden rounded-[34px] bg-[#F4F0E8] shadow-2xl"
      >
        <div className="bg-ink px-5 py-6 text-white">
          <div className="flex items-center gap-3">
            {invitation ? (
              <GroupPhoto
                group={invitation.group}
                className="h-16 w-16 rounded-[22px]"
              />
            ) : (
              <div className="h-16 w-16 rounded-[22px] bg-white/10" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-black text-white/45">그룹 초대장</p>
              <h1 className="mt-1 truncate text-2xl font-black text-[#FEE500]">
                {invitation?.group.name ?? "초대 확인 중"}
              </h1>
            </div>
          </div>
          <p className="mt-5 text-sm font-bold leading-6 text-white/70">
            같이 친 사람만 쏙 고르고, 진 사람 계산은 알아서 착착.
          </p>
        </div>

        <div className="p-4">
          {status === "loading" ? (
            <div className="flex h-56 flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm font-black text-ink/45">초대장 여는 중</p>
            </div>
          ) : null}

          {status === "error" ? (
            <div className="rounded-[24px] bg-white p-5 text-center">
              <p className="text-lg font-black">초대장을 열 수 없어요</p>
              <p className="mt-2 text-sm font-bold leading-5 text-ink/48">
                링크가 만료됐거나 그룹에서 다시 초대가 필요합니다.
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-5 h-12 w-full rounded-[20px] bg-ink text-sm font-black text-white"
              >
                로비로 이동
              </button>
            </div>
          ) : null}

          {status !== "loading" && status !== "error" && invitation ? (
            <div className="space-y-3">
              {!user ? (
                <ActionPanel
                  eyebrow={`${invitation.group.memberCount}명이 있는 그룹`}
                  title="카카오로 들어오면 요청을 보낼 수 있어요"
                  description="대표가 확인한 뒤 그룹에 입장됩니다."
                >
                  <button
                    onClick={loginWithKakao}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-[#FEE500] text-sm font-black text-ink"
                  >
                    <KakaoTalkIcon className="h-5 w-5 shrink-0" />
                    카카오로 1초 로그인
                  </button>
                </ActionPanel>
              ) : viewer?.membership === "MEMBER" ? (
                <ActionPanel
                  eyebrow="이미 참여 중"
                  title={`${viewer.member?.displayName ?? user.nickname}님은 이미 들어와 있어요`}
                  description="새 요청을 만들지 않고 바로 그룹으로 이동합니다."
                >
                  <button
                    onClick={() => router.push("/")}
                    className="mt-4 flex h-12 w-full items-center justify-between rounded-[20px] bg-ink px-5 text-sm font-black text-white"
                  >
                    그룹으로 이동
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </ActionPanel>
              ) : pendingRequest ? (
                <ActionPanel
                  eyebrow={user.nickname}
                  title="참여 요청을 보냈어요"
                  description="대표가 확인하면 그룹에 들어갈 수 있어요."
                >
                  <button
                    onClick={() => void cancelRequest()}
                    disabled={status === "canceling"}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-[#F4F0E8] text-sm font-black text-ink transition active:scale-[0.99] disabled:opacity-45"
                  >
                    {status === "canceling" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    요청 취소
                  </button>
                </ActionPanel>
              ) : (
                <ActionPanel
                  eyebrow={user.nickname}
                  title={
                    rejectedRequest
                      ? "다시 요청할 수 있어요"
                      : "참여 요청 보내기"
                  }
                  description={
                    canceledRequest
                      ? "취소한 요청은 다시 보낼 수 있어요."
                      : "대표가 기존 멤버와 연결하거나 새 멤버로 승인합니다."
                  }
                >
                  <button
                    onClick={() => void requestToJoin()}
                    disabled={status === "requesting"}
                    className="mt-4 flex h-12 w-full items-center justify-between rounded-[20px] bg-ink px-5 text-sm font-black text-white transition active:scale-[0.99] disabled:opacity-45"
                  >
                    <span className="flex items-center gap-2">
                      {status === "requesting" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      요청 보내기
                    </span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </ActionPanel>
              )}
            </div>
          ) : null}
        </div>
      </motion.section>
    </main>
  );
}

function ActionPanel({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="rounded-[24px] bg-white p-4">
      <p className="text-sm font-black text-ink/45">{eyebrow}</p>
      <p className="mt-1 text-xl font-black leading-tight">{title}</p>
      <p className="mt-2 text-sm font-bold leading-5 text-ink/48">
        {description}
      </p>
      {children}
    </div>
  );
}
