"use client";

import { resolveMediaUrl } from "@/lib/media-url";
import type { ReactNode } from "react";
import { useState } from "react";

type AdminMediaImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: ReactNode;
};

export default function AdminMediaImage({
  src,
  alt,
  className = "",
  fallback,
}: AdminMediaImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveMediaUrl(src);
  const show = resolved && !failed;

  if (!show) {
    return (
      <>
        {fallback ?? (
          <div
            className={`flex items-center justify-center bg-gray-100 text-theme-xs text-gray-400 dark:bg-gray-800 ${className}`}
          >
            Tanpa gambar
          </div>
        )}
      </>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={`object-cover ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
