import MarketPercentBadge from "@/components/market/MarketPercentBadge";
import {
  CATEGORY_LABELS,
  gainers,
  losers,
  percentChange,
  trendColorFromType,
} from "@/lib/marketTrendMetrics";
import type { MarketTrendItem } from "@/types/extended";

type Props = {
  trends: MarketTrendItem[];
  onSelect?: (trend: MarketTrendItem) => void;
  onSeeAll?: () => void;
};

function MoverRow({
  trend,
  onSelect,
}: {
  trend: MarketTrendItem;
  onSelect?: (trend: MarketTrendItem) => void;
}) {
  const change = percentChange(trend);
  const color = trendColorFromType(trend.trendType);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(trend)}
      className="flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
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
      <div className="shrink-0 text-right">
        <p className="text-xs font-bold text-gray-800 dark:text-white/90">{trend.currentValue}</p>
        <MarketPercentBadge percent={change} compact />
      </div>
    </button>
  );
}

function Section({
  title,
  items,
  onSelect,
  onSeeAll,
}: {
  title: string;
  items: MarketTrendItem[];
  onSelect?: (trend: MarketTrendItem) => void;
  onSeeAll?: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white/90">{title}</h3>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs font-semibold text-brand-500 hover:underline"
          >
            Lihat semua →
          </button>
        )}
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {items.map((t) => (
          <MoverRow key={t.id} trend={t} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

export default function MarketMoversSection({ trends, onSelect, onSeeAll }: Props) {
  const up = gainers(trends);
  const down = losers(trends);
  if (up.length === 0 && down.length === 0) return null;

  return (
    <div className="space-y-3.5">
      <Section title="Harga naik" items={up} onSelect={onSelect} onSeeAll={onSeeAll} />
      <Section title="Harga turun" items={down} onSelect={onSelect} onSeeAll={onSeeAll} />
    </div>
  );
}
