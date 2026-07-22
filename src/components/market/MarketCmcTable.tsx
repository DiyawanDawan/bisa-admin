import MarketPercentBadge from "@/components/market/MarketPercentBadge";
import MarketSparkline from "@/components/market/MarketSparkline";
import {
  CATEGORY_LABELS,
  percentChange,
  trendColorFromType,
} from "@/lib/marketTrendMetrics";
import type { MarketTrendItem } from "@/types/extended";

type Props = {
  trends: MarketTrendItem[];
  onSelect?: (trend: MarketTrendItem) => void;
};

export default function MarketCmcTable({ trends, onSelect }: Props) {
  if (trends.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800">
        <span className="w-5">#</span>
        <span className="flex-1">Nama</span>
        <span className="hidden w-14 text-center sm:block">7H</span>
        <span className="w-20 text-right">Harga</span>
        <span className="w-12 text-right">24h</span>
      </div>
      {trends.map((trend, index) => {
        const change = percentChange(trend);
        const color = trendColorFromType(trend.trendType);
        return (
          <button
            key={trend.id}
            type="button"
            onClick={() => onSelect?.(trend)}
            className="flex min-h-12 w-full items-center gap-2 border-b border-gray-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
          >
            <span className="w-5 shrink-0 text-xs font-bold text-gray-400">{index + 1}</span>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ color, backgroundColor: `${color}18` }}
            >
              {trend.label.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                {trend.label}
              </p>
              <p className="truncate text-xs text-gray-500">
                {CATEGORY_LABELS[trend.category] ?? trend.category}
              </p>
            </div>
            <MarketSparkline trend={trend} className="hidden shrink-0 sm:block" />
            <div className="w-20 shrink-0 text-right">
              <p className="truncate text-xs font-bold text-gray-800 dark:text-white/90">
                {trend.currentValue}
              </p>
            </div>
            <div className="w-12 shrink-0 text-right">
              <MarketPercentBadge percent={change} compact />
            </div>
          </button>
        );
      })}
    </div>
  );
}
