import Link from "next/link";
import React from "react";

type Props = {
  label: string;
  value: string;
  desc?: string;
  /** Opsional — hindari border-warna tebal (bukan pola TailAdmin CRM) */
  accent?: string;
  href?: string;
  action?: React.ReactNode;
};

/** KPI — pola kartu metrik TailAdmin (CartsOverview / CRM Active Deal). */
export default function AdminMetricCard({
  label,
  value,
  desc,
  accent = "",
  href,
  action,
}: Props) {
  const card = (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] ${accent}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {action}
      </div>
      <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{value}</p>
      {desc ? <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{desc}</p> : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition hover:opacity-90">
        {card}
      </Link>
    );
  }

  return card;
}
