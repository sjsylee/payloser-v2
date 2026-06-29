import type { ApiGroupMember } from "@/adapters/payloser-api";
import { getMemberTone } from "@/modules/group/model/group-view";

export function Avatar({
  member,
  size = "md",
}: {
  member: Pick<
    { name: string; profileImageUrl?: string | null; tone: string },
    "name" | "profileImageUrl" | "tone"
  >;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={`${size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"} flex shrink-0 overflow-hidden rounded-2xl font-black ${member.profileImageUrl ? "bg-transparent" : member.tone}`}
    >
      {member.profileImageUrl ? (
        <img
          src={member.profileImageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {member.name.slice(0, 1)}
        </span>
      )}
    </div>
  );
}

export function GroupPhoto({
  className = "",
  group,
}: {
  className?: string;
  group: {
    imageUrl?: string | null | undefined;
    name: string;
    themeColor?: string | null | undefined;
  };
}) {
  if (group.imageUrl) {
    return (
      <img
        src={group.imageUrl}
        alt=""
        className={`shrink-0 rounded-[18px] object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-[18px] text-lg font-black text-ink ${className}`}
      style={{ backgroundColor: group.themeColor ?? "#FEE500" }}
      aria-hidden="true"
    >
      {group.name.slice(0, 1)}
    </div>
  );
}

export function MemberProfileAvatar({
  member,
  size = "md",
}: {
  member: Pick<ApiGroupMember, "displayName" | "profileImageUrl">;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-xs";
  const fallbackTone = getMemberTone(member.displayName);

  return (
    <span
      className={`${sizeClass} flex shrink-0 overflow-hidden rounded-2xl ${member.profileImageUrl ? "bg-transparent" : fallbackTone}`}
    >
      {member.profileImageUrl ? (
        <img
          src={member.profileImageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-black">
          {member.displayName.slice(0, 1)}
        </span>
      )}
    </span>
  );
}
