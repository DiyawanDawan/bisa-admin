import {
  averageChange,
  formatPercent,
  topMoverLabel,
  trendColorFromChange,
} from "@/lib/marketTrendMetrics";
import type { MarketTrendItem } from "@/types/extended";

function KpiCard({
  label,
  value,
  sub,
  color,
  wide,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`shrink-0 rounded-xl border border-gray-200 bg-white p-2.5 dark:border-gray-800 dark:bg-white/[0.03] ${
        wide ? "min-w-[140px]" : "min-w-[110px]"
      }`}
    >
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="truncate text-sm font-extrabold" style={{ color }}>
        {value}
      </p>
      <p className="truncate text-[10px] text-gray-400">{sub}</p>
    </div>
  );
}

export default function MarketOverviewKpis({ trends }: { trends: MarketTrendItem[] }) {
  const up = trends.filter((t) => t.trendType === "UP").length;
  const down = trends.filter((t) => t.trendType === "DOWN").length;
  const avg = averageChange(trends);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <KpiCard label="Naik" value={String(up)} sub="Komoditas naik" color="#135122" />
      <KpiCard label="Turun" value={String(down)} sub="Komoditas turun" color="#dc2626" />
      <KpiCard
        label="Rata-rata"
        value={formatPercent(avg)}
        sub="Perubahan rata-rata"
        color={trendColorFromChange(avg)}
      />
      <KpiCard
        label="Top mover"
        value={topMoverLabel(trends)}
        sub="Teraktif"
        color="#135122"
        wide
      />
    </div>
  );
}
