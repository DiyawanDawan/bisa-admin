"use client";

import AdminMediaImage from "@/components/common/AdminMediaImage";

type PartyAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  subtitle?: string | null;
  tone?: "buyer" | "seller";
  size?: "sm" | "md";
};

const toneClass = {
  buyer:
    "bg-blue-light-100 text-blue-light-700 dark:bg-blue-light-500/20 dark:text-blue-light-300",
  seller:
    "bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300",
};

const sizeClass = {
  sm: "h-8 w-8 text-theme-xs",
  md: "h-11 w-11 text-sm",
};

/** Avatar pembeli/supplier dengan inisial fallback. */
export default function PartyAvatar({
  name,
  avatarUrl,
  subtitle,
  tone = "buyer",
  size = "sm",
}: PartyAvatarProps) {
  const initial = (name?.trim()?.charAt(0) || "?").toUpperCase();
  const box = sizeClass[size];

  return (
    <div className="flex min-w-0 items-center gap-2">
      <AdminMediaImage
        src={avatarUrl}
        alt={name}
        className={`${box} shrink-0 rounded-full border border-gray-200 dark:border-gray-700`}
        fallback={
          <span
            className={`flex ${box} shrink-0 items-center justify-center rounded-full font-semibold ${toneClass[tone]}`}
          >
            {initial}
          </span>
        }
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
          {name}
        </p>
        {subtitle ? (
          <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
