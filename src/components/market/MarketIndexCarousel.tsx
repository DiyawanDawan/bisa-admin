import MarketPercentBadge from "@/components/market/MarketPercentBadge";
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

export default function MarketIndexCarousel({ trends, onSelect }: Props) {
  if (trends.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {trends.map((trend) => {
        const change = percentChange(trend);
        const color = trendColorFromType(trend.trendType);
        return (
          <button
            key={trend.id}
            type="button"
            onClick={() => onSelect?.(trend)}
            className="w-[min(56vw,220px)] shrink-0 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="flex items-start gap-2">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ color, backgroundColor: `${color}18` }}
              >
                {trend.label.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {trend.label}
                </p>
                <p className="truncate text-sm font-extrabold text-gray-900 dark:text-white/90">
                  {trend.currentValue}
                </p>
                <div className="mt-1">
                  <MarketPercentBadge percent={change} compact />
                </div>
                <p className="mt-1 truncate text-[10px] text-gray-400">
                  {CATEGORY_LABELS[trend.category] ?? trend.category}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
