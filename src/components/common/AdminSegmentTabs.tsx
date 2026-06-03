import React from "react";
import Badge from "@/components/ui/badge/Badge";

export type SegmentTabItem = {
  id: string;
  label: string;
  hint?: string;
  badge?: number;
};

type Props<T extends string> = {
  tabs: SegmentTabItem[];
  active: T;
  onChange: (id: T) => void;
  /** pills = TailAdmin ChartTab; cards = legacy grid (hindari untuk modul baru) */
  variant?: "pills" | "cards";
  columnsClassName?: string;
};

/**
 * Tab modul admin — default pill (TailAdmin), bukan kartu grid custom.
 */
export default function AdminSegmentTabs<T extends string>({
  tabs,
  active,
  onChange,
  variant = "pills",
  columnsClassName = "grid grid-cols-2 gap-2 sm:grid-cols-3",
}: Props<T>) {
  if (variant === "cards") {
    return (
      <div className={columnsClassName}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id as T)}
            className={`relative rounded-xl border px-3 py-3 text-left transition ${
              active === t.id
                ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:border-brand-600 dark:bg-brand-500/15 dark:ring-brand-600"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03]"
            }`}
          >
            <span className="block text-sm font-medium text-gray-800 dark:text-white/90">
              {t.label}
            </span>
            {t.hint ? (
              <span className="mt-0.5 block text-[10px] text-gray-500">{t.hint}</span>
            ) : null}
            {t.badge != null && t.badge > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <div className="inline-flex min-w-full items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900 sm:min-w-0">
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id as T)}
              className={`relative flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-theme-sm font-medium transition hover:text-gray-900 dark:hover:text-white ${
                isActive
                  ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {t.label}
              {t.badge != null && t.badge > 0 ? (
                <Badge color="error" size="sm">
                  {t.badge}
                </Badge>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
