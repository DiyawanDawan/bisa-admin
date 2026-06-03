import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

/** Banner info netral — selaras kartu TailAdmin (bukan strip hijau custom). */
export default function AdminInfoBanner({ children, className = "" }: Props) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 ${className}`}
    >
      {children}
    </div>
  );
}
