"use client";

import AdminAreaChart from "@/components/charts/area/AdminAreaChart";
import AdminInfoBanner from "@/components/common/AdminInfoBanner";
import ComponentCard from "@/components/common/ComponentCard";
import MarketCmcTable from "@/components/market/MarketCmcTable";
import MarketFeaturedChart from "@/components/market/MarketFeaturedChart";
import MarketIndexCarousel from "@/components/market/MarketIndexCarousel";
import MarketMoversSection from "@/components/market/MarketMoversSection";
import MarketOverviewKpis from "@/components/market/MarketOverviewKpis";
import MarketPercentBadge from "@/components/market/MarketPercentBadge";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { fetchMarketTrendsAdmin } from "@/lib/api/extended";
import {
  formatChartValue,
  featuredTrend,
  normalizeHistory,
  percentChange,
  trendColorFromChange,
} from "@/lib/marketTrendMetrics";
import { formatDate } from "@/lib/format";
import type { MarketCategoryFilter, MarketTrendItem } from "@/types/extended";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const CATEGORY_OPTIONS: { id: MarketCategoryFilter; label: string }[] = [
  { id: "", label: "Semua" },
  { id: "CARBON", label: "Karbon" },
  { id: "BIOMASSA", label: "Biomassa" },
  { id: "LOGISTICS", label: "Logistik" },
];

export default function MarketTrendsView() {
  const [items, setItems] = useState<MarketTrendItem[]>([]);
  const [category, setCategory] = useState<MarketCategoryFilter>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMarketTrendsAdmin(category || undefined);
      setItems(data);
      setSelectedId((prev) =>
        prev && data.some((t) => t.id === prev) ? prev : data[0]?.id ?? null,
      );
    } catch {
      setError("Gagal memuat tren pasar.");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => items.find((t) => t.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  );

  const featured = useMemo(() => featuredTrend(items), [items]);

  const selectedHistory = useMemo(() => {
    if (!selected) return { categories: [] as string[], values: [] as number[] };
    const h = normalizeHistory(selected.historyData);
    return {
      categories: h.map((p) => p.x),
      values: h.map((p) => p.y),
    };
  }, [selected]);

  const scrollToList = () => {
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (error && !loading && items.length === 0) {
    return <Alert variant="error" title="Tren pasar" message={error} />;
  }

  return (
    <div className="space-y-3.5">
      <AdminInfoBanner>
        Data ini sama dengan <strong>Market Intelligence</strong> di aplikasi mobile. Layout
        kompak ala TradingView / CoinMarketCap — data dari seed/backend, read-only di admin.
      </AdminInfoBanner>

      <div>
        <p className="text-xs font-semibold text-brand-500">Markets / Biomassa</p>
        <h2 className="text-lg font-extrabold text-gray-800 dark:text-white/90">
          Pantau tren harga komoditas biomassa
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.id || "all"}
            type="button"
            onClick={() => setCategory(opt.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              category === opt.id
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          Segarkan
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03]">
          Tidak ada data untuk filter ini.
        </p>
      ) : (
        <>
          <MarketOverviewKpis trends={items} />

          {featured && (
            <MarketFeaturedChart
              trend={featured}
              onSelect={(t) => setSelectedId(t.id)}
            />
          )}

            <div>
              <h3 className="mb-1.5 text-sm font-bold text-gray-800 dark:text-white/90">
                Komoditas utama ›
              </h3>
            <MarketIndexCarousel
              trends={items}
              onSelect={(t) => setSelectedId(t.id)}
            />
          </div>

          <MarketMoversSection
            trends={items}
            onSelect={(t) => setSelectedId(t.id)}
            onSeeAll={scrollToList}
          />

            <div ref={listRef}>
              <h3 className="mb-1.5 text-sm font-bold text-gray-800 dark:text-white/90">
                Harga pasar hari ini ›
              </h3>
            <MarketCmcTable trends={items} onSelect={(t) => setSelectedId(t.id)} />
          </div>

          {selected && (
            <ComponentCard
              title={`Detail: ${selected.label}`}
              desc={`Diperbarui ${formatDate(selected.updatedAt)} · ${selected.currentValue}`}
            >
              <div className="mb-3 flex items-end justify-between gap-2">
                <MarketPercentBadge percent={percentChange(selected)} />
              </div>
              <AdminAreaChart
                categories={selectedHistory.categories}
                series={{ name: selected.label, data: selectedHistory.values }}
                height={260}
                colors={[trendColorFromChange(percentChange(selected))]}
                formatY={formatChartValue}
                formatTooltipY={formatChartValue}
                emptyMessage="Belum ada data riwayat untuk indikator ini."
                extraOptions={{
                  chart: { type: "area" },
                  stroke: { curve: "smooth", width: 2.5 },
                  fill: {
                    type: "gradient",
                    gradient: { opacityFrom: 0.3, opacityTo: 0.05 },
                  },
                  markers: { size: 3, strokeWidth: 0 },
                }}
              />
            </ComponentCard>
          )}
        </>
      )}
    </div>
  );
}
