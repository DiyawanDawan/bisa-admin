"use client";

import AdminAreaChart from "@/components/charts/area/AdminAreaChart";
import MarketPercentBadge from "@/components/market/MarketPercentBadge";
import {
  formatChartValue,
  normalizeHistory,
  percentChange,
  sliceHistory,
  trendColorFromChange,
  type MarketChartRange,
} from "@/lib/marketTrendMetrics";
import type { MarketTrendItem } from "@/types/extended";
import { useMemo, useState } from "react";

type Props = {
  trend: MarketTrendItem;
  onSelect?: (trend: MarketTrendItem) => void;
};

const RANGE_OPTIONS: { id: MarketChartRange; label: string }[] = [
  { id: "1m", label: "1B" },
  { id: "3m", label: "3B" },
  { id: "all", label: "Semua" },
];

export default function MarketFeaturedChart({ trend, onSelect }: Props) {
  const [range, setRange] = useState<MarketChartRange>("3m");
  const change = percentChange(trend);
  const color = trendColorFromChange(change);

  const history = useMemo(() => {
    const raw = normalizeHistory(trend.historyData);
    const sliced = sliceHistory(raw, range);
    return {
      categories: sliced.map((p) => p.x),
      values: sliced.map((p) => p.y),
    };
  }, [trend, range]);

  return (
    <div
      className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]"
      onClick={() => onSelect?.(trend)}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(trend)}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-gray-800 dark:text-white/90">
            {trend.label}
          </h3>
          <p className="text-lg font-extrabold text-brand-500">{trend.currentValue}</p>
        </div>
        <MarketPercentBadge percent={change} />
      </div>
      <AdminAreaChart
        categories={history.categories}
        series={{ name: trend.label, data: history.values }}
        height={200}
        colors={[color]}
        formatY={formatChartValue}
        formatTooltipY={formatChartValue}
        emptyMessage="Belum ada riwayat harga."
        extraOptions={{
          chart: { type: "area", sparkline: { enabled: false } },
          stroke: { curve: "smooth", width: 2.5 },
          fill: {
            type: "gradient",
            gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
          },
          markers: { size: 0 },
        }}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRange(opt.id);
            }}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              range === opt.id
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
