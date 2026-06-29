import {
  ChevronLeft,
  History,
  Home,
  ReceiptText,
  Settings,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ApiGroup, ApiGroupMember } from "@/adapters/payloser-api";
import type { TabId } from "@/modules/app-shell/ui/bottom-nav";
import {
  GroupPhoto,
  MemberProfileAvatar,
} from "@/modules/group/ui/group-avatars";

const desktopTabs: Array<{ id: TabId; icon: LucideIcon; label: string }> = [
  { id: "home", icon: Home, label: "홈" },
  { id: "settle", icon: ReceiptText, label: "정산" },
  { id: "records", icon: History, label: "기록" },
  { id: "ranking", icon: Trophy, label: "랭킹" },
];

export function DesktopGroupPanel({
  activeTab,
  group,
  onSelectTab,
}: {
  activeTab: TabId;
  group: ApiGroup;
  onSelectTab: (tab: TabId) => void;
}) {
  const activeMembers = group.members.filter(
    (member) => member.isActive !== false,
  );

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden bg-ink text-white">
      <nav className="px-4 py-4">
        <div className="space-y-1.5">
          {desktopTabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex h-12 w-full items-center gap-3 rounded-[18px] px-4 text-sm font-black transition ${
                  selected
                    ? "bg-[#FEE500] text-ink"
                    : "text-white/55 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <section className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="rounded-[24px] bg-white/8 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-white/45">그룹 멤버</p>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-white/55">
              {activeMembers.length}명
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {activeMembers.slice(0, 10).map((member) => (
              <div
                key={member.id}
                className="flex h-10 min-w-0 items-center gap-2 rounded-2xl bg-white/10 pl-1.5 pr-2"
              >
                <MemberProfileAvatar member={member} size="sm" />
                <span className="min-w-0 truncate text-xs font-black">
                  {member.displayName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </aside>
  );
}

export function DesktopGroupHeader({
  group,
  onOpenGroup,
  onReturnToLobby,
  onStartSettlement,
  ownerMember,
}: {
  group: ApiGroup;
  onOpenGroup: () => void;
  onReturnToLobby: () => void;
  onStartSettlement: () => void;
  ownerMember: ApiGroupMember | null;
}) {
  const activeMembers = group.members.filter(
    (member) => member.isActive !== false,
  );

  return (
    <header className="relative isolate col-span-2 min-h-[178px] overflow-hidden bg-ink px-6 py-6 text-white">
      {group.coverImageUrl ? (
        <img
          src={group.coverImageUrl}
          alt=""
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_16%_18%,rgba(254,229,0,0.72),transparent_14%),radial-gradient(circle_at_82%_22%,rgba(47,125,109,0.64),transparent_16%),linear-gradient(135deg,rgba(24,23,22,0.98),rgba(24,23,22,0.9))]" />

      <div className="relative z-10 flex h-full items-center justify-between gap-8">
        <div className="flex min-w-0 items-center gap-4">
          <button
            onClick={onReturnToLobby}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-white/12 text-white backdrop-blur transition hover:bg-white/18"
            aria-label="그룹 목록으로 돌아가기"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <GroupPhoto
            group={group}
            className="h-20 w-20 shrink-0 rounded-[26px]"
          />
          <div className="min-w-0">
            <p className="text-xs font-black text-[#FEE500]">Payloser</p>
            <h1 className="max-w-[640px] break-keep text-[34px] font-black leading-tight">
              {group.name}
            </h1>
            <p className="mt-1 text-sm font-bold text-white/58">
              {activeMembers.length}명 · 대표{" "}
              {ownerMember?.displayName ?? "없음"}
            </p>
          </div>
        </div>

        <div className="flex w-[340px] shrink-0 items-center gap-3">
          <button
            onClick={onStartSettlement}
            className="flex min-h-16 flex-1 items-center justify-between rounded-[24px] bg-white px-4 text-left text-ink shadow-[0_18px_36px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5"
          >
            <span>
              <span className="block text-xs font-black text-ink/45">
                오늘 정산
              </span>
              <span className="mt-0.5 block text-lg font-black">
                참여자 고르고 시작
              </span>
            </span>
            <span className="text-xl leading-none">›</span>
          </button>
          <button
            onClick={onOpenGroup}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-white/12 text-white backdrop-blur transition hover:bg-white/18"
            aria-label="그룹 설정"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
