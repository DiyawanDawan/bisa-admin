import type { MarketHistoryPoint, MarketTrendItem } from "@/types/extended";

export type MarketChartRange = "1m" | "3m" | "all";

const TREND_UP = "#059669";
const TREND_DOWN = "#dc2626";
const TREND_STABLE = "#f59e0b";

export function normalizeHistory(
  raw: MarketTrendItem["historyData"],
): MarketHistoryPoint[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((p) => ({
      x: String(p.x ?? ""),
      y: typeof p.y === "number" ? p.y : Number(p.y),
    }))
    .filter((p) => p.x && Number.isFinite(p.y));
}

export function percentChange(trend: MarketTrendItem): number {
  const history = normalizeHistory(trend.historyData);
  if (history.length < 2) return 0;
  const current = history[history.length - 1].y;
  const previous = history[history.length - 2].y;
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function formatPercent(value: number): string {
  if (value > 0) return `+${Math.abs(value).toFixed(1)}%`;
  if (value < 0) return `-${Math.abs(value).toFixed(1)}%`;
  return "0.0%";
}

export function trendColorFromChange(change: number): string {
  if (change > 0.05) return TREND_UP;
  if (change < -0.05) return TREND_DOWN;
  return TREND_STABLE;
}

export function trendColorFromType(trendType: string): string {
  if (trendType === "UP") return TREND_UP;
  if (trendType === "DOWN") return TREND_DOWN;
  return TREND_STABLE;
}

export function sortedByChange(
  trends: MarketTrendItem[],
  descending = true,
): MarketTrendItem[] {
  const copy = [...trends];
  copy.sort((a, b) => {
    const cmp = percentChange(a) - percentChange(b);
    return descending ? -cmp : cmp;
  });
  return copy;
}

export function gainers(trends: MarketTrendItem[], limit = 4): MarketTrendItem[] {
  return sortedByChange(trends)
    .filter((t) => percentChange(t) > 0)
    .slice(0, limit);
}

export function losers(trends: MarketTrendItem[], limit = 4): MarketTrendItem[] {
  return sortedByChange(trends, false)
    .filter((t) => percentChange(t) < 0)
    .slice(0, limit);
}

export function averageChange(trends: MarketTrendItem[]): number {
  if (trends.length === 0) return 0;
  return trends.reduce((s, t) => s + percentChange(t), 0) / trends.length;
}

export function featuredTrend(trends: MarketTrendItem[]): MarketTrendItem | null {
  if (trends.length === 0) return null;
  return sortedByChange(trends)[0] ?? trends[0];
}

export function topMoverLabel(trends: MarketTrendItem[]): string {
  const top = featuredTrend(trends);
  return top?.label ?? "—";
}

export function sliceHistory(
  history: MarketHistoryPoint[],
  range: MarketChartRange,
): MarketHistoryPoint[] {
  if (history.length === 0) return history;
  switch (range) {
    case "1m":
      return history.length <= 4 ? history : history.slice(-4);
    case "3m":
      return history.length <= 12 ? history : history.slice(-12);
    default:
      return history;
  }
}

export function formatChartValue(val: number): string {
  if (val >= 1_000_000) {
    return new Intl.NumberFormat("id-ID", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(val);
  }
  return new Intl.NumberFormat("id-ID").format(val);
}

export const CATEGORY_LABELS: Record<string, string> = {
  CARBON: "Karbon / Biochar",
  BIOMASSA: "Biomassa",
  LOGISTICS: "Logistik",
};
