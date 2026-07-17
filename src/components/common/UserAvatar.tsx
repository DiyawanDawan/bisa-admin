"use client";

import { resolveMediaUrl } from "@/lib/media-url";
import { useState } from "react";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type UserAvatarProps = {
  src?: string | null;
  name: string;
  className?: string;
};

export default function UserAvatar({
  src,
  name,
  className = "h-10 w-10",
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveMediaUrl(src);

  if (resolved && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${className}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-theme-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 ${className}`}
      aria-hidden
    >
      {initials(name) || "?"}
    </div>
  );
}
