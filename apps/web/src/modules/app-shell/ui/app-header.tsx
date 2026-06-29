"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, GroupPhoto } from "@/modules/group/ui/group-avatars";

type HeaderMember = {
  name: string;
  profileImageUrl?: string | null;
  tone: string;
};

export function AppHeader({
  groupName,
  groupImageUrl,
  groupThemeColor,
  members: headerMembers,
  onOpenGroup,
  onReturnToLobby,
}: {
  groupName: string;
  groupImageUrl?: string | null | undefined;
  groupThemeColor?: string | null | undefined;
  members: HeaderMember[];
  onOpenGroup: () => void;
  onReturnToLobby: () => void;
}) {
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);
  const [visibleMemberCount, setVisibleMemberCount] = useState(3);
  const memberRailRef = useRef<HTMLDivElement | null>(null);
  const visibleMembers = headerMembers.slice(0, visibleMemberCount);
  const hiddenMemberCount = Math.max(
    0,
    headerMembers.length - visibleMembers.length,
  );

  useEffect(() => {
    const rail = memberRailRef.current;

    if (!rail) {
      return;
    }

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const updateVisibleMemberCount = () => {
      const width = rail.clientWidth;
      const reservedMoreButtonWidth = headerMembers.length > 1 ? 58 : 0;
      const tagWidth = 96;
      const gapWidth = 8;
      const availableWidth = Math.max(0, width - reservedMoreButtonWidth);
      const nextCount = Math.min(
        headerMembers.length,
        Math.max(
          1,
          Math.floor((availableWidth + gapWidth) / (tagWidth + gapWidth)),
        ),
      );

      setVisibleMemberCount(nextCount);
    };
    const observer = new ResizeObserver(updateVisibleMemberCount);

    updateVisibleMemberCount();
    observer.observe(rail);

    return () => observer.disconnect();
  }, [headerMembers.length]);

  return (
    <header className="sticky top-0 z-[80] border-b border-ink/10 bg-[#F4F0E8]/92 px-4 pb-3 pt-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={onReturnToLobby}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/78 shadow-sm transition active:scale-[0.98]"
            aria-label="그룹 로비로 이동"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <GroupPhoto
            group={{
              imageUrl: groupImageUrl,
              name: groupName,
              themeColor: groupThemeColor,
            }}
            className="h-12 w-12 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-black text-ink/45">Payloser</p>
            <h1 className="truncate text-lg font-black">{groupName}</h1>
          </div>
        </div>
        <button
          onClick={onOpenGroup}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm"
          aria-label="그룹 설정"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
      <div className="relative mt-3">
        <div ref={memberRailRef} className="flex items-center gap-2">
          {visibleMembers.map((member) => (
            <div
              key={member.name}
              className="flex h-9 w-24 shrink-0 items-center gap-2 rounded-full bg-white px-2 py-1 shadow-sm"
            >
              <Avatar member={member} size="sm" />
              <span className="whitespace-nowrap pr-1 text-xs font-black">
                {member.name}
              </span>
            </div>
          ))}
          {hiddenMemberCount > 0 ? (
            <button
              onClick={() => setMemberPopoverOpen((open) => !open)}
              className="flex h-9 shrink-0 items-center justify-center rounded-full bg-ink px-3 text-xs font-black text-white shadow-sm transition active:scale-[0.98]"
            >
              +{hiddenMemberCount}명
            </button>
          ) : null}
        </div>
        <AnimatePresence initial={false}>
          {memberPopoverOpen ? (
            <motion.div
              key="header-member-popover"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-[90] rounded-[24px] bg-white p-3 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-ink/45">참가 멤버</p>
                  <p className="text-sm font-black">{headerMembers.length}명</p>
                </div>
                <button
                  onClick={() => setMemberPopoverOpen(false)}
                  className="h-9 rounded-full bg-[#F4F0E8] px-3 text-xs font-black text-ink/55"
                >
                  닫기
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {headerMembers.map((member) => (
                  <div
                    key={member.name}
                    className="flex min-w-0 items-center gap-2 rounded-[18px] bg-[#F4F0E8] p-2"
                  >
                    <Avatar member={member} size="sm" />
                    <span className="truncate text-xs font-black">
                      {member.name}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
