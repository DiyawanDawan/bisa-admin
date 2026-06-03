"use client";
import AdminAreaChart from "@/components/charts/area/AdminAreaChart";
import AdminBarChart from "@/components/charts/bar/AdminBarChart";
import AdminInfoBanner from "@/components/common/AdminInfoBanner";
import AdminMetricCard from "@/components/common/AdminMetricCard";
import ComponentCard from "@/components/common/ComponentCard";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { fetchMarketTrendsAdmin } from "@/lib/api/extended";
import { formatDate } from "@/lib/format";
import type { MarketCategoryFilter, MarketTrendItem } from "@/types/extended";
import { useCallback, useEffect, useMemo, useState } from "react";

const CATEGORY_OPTIONS: { id: MarketCategoryFilter; label: string }[] = [
  { id: "", label: "Semua" },
  { id: "CARBON", label: "Karbon" },
  { id: "BIOMASSA", label: "Biomassa" },
  { id: "LOGISTICS", label: "Logistik" },
];

const CATEGORY_LABELS: Record<string, string> = {
  CARBON: "Karbon / Biochar",
  BIOMASSA: "Biomassa",
  LOGISTICS: "Logistik",
};

const TREND_META: Record<
  string,
  { label: string; badge: "success" | "error" | "light"; color: string }
> = {
  UP: { label: "Naik", badge: "success", color: "#059669" },
  DOWN: { label: "Turun", badge: "error", color: "#dc2626" },
  STABLE: { label: "Stabil", badge: "light", color: "#6b7280" },
};

function normalizeHistory(
  raw: MarketTrendItem["historyData"],
): { categories: string[]; values: number[] } {
  if (!raw || !Array.isArray(raw)) return { categories: [], values: [] };
  const points = raw
    .map((p) => ({
      x: String(p.x ?? ""),
      y: typeof p.y === "number" ? p.y : Number(p.y),
    }))
    .filter((p) => p.x && Number.isFinite(p.y));
  return {
    categories: points.map((p) => p.x),
    values: points.map((p) => p.y),
  };
}

function formatChartValue(val: number): string {
  if (val >= 1_000_000) {
    return new Intl.NumberFormat("id-ID", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(val);
  }
  return new Intl.NumberFormat("id-ID").format(val);
}

export default function MarketTrendsView() {
  const [items, setItems] = useState<MarketTrendItem[]>([]);
  const [category, setCategory] = useState<MarketCategoryFilter>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const stats = useMemo(() => {
    const up = items.filter((t) => t.trendType === "UP").length;
    const down = items.filter((t) => t.trendType === "DOWN").length;
    const stable = items.filter((t) => t.trendType === "STABLE").length;
    return { up, down, stable, total: items.length };
  }, [items]);

  const selectedHistory = useMemo(
    () => (selected ? normalizeHistory(selected.historyData) : { categories: [], values: [] }),
    [selected],
  );

  const compareChart = useMemo(() => {
    const withHistory = items.filter((t) => {
      const h = normalizeHistory(t.historyData);
      return h.values.length > 0;
    });
    return {
      categories: withHistory.map((t) => t.label),
      values: withHistory.map((t) => {
        const h = normalizeHistory(t.historyData);
        return h.values[h.values.length - 1] ?? 0;
      }),
      colors: withHistory.map((t) => TREND_META[t.trendType]?.color ?? "#135122"),
    };
  }, [items]);

  const lineColor = selected
    ? TREND_META[selected.trendType]?.color ?? "#135122"
    : "#135122";

  if (error && !loading && items.length === 0) {
    return (
      <Alert variant="error" title="Tren pasar" message={error} />
    );
  }

  return (
    <div className="space-y-6">
      <AdminInfoBanner>
        Data ini sama dengan <strong>Market Intelligence</strong> di aplikasi mobile. Grafik
        memakai riwayat harga bulanan. Perubahan data dilakukan lewat seed/backend, bukan form di
        admin.
      </AdminInfoBanner>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.id || "all"}
            type="button"
            onClick={() => setCategory(opt.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminMetricCard
          label="Total indikator"
          value={loading ? "—" : String(stats.total)}
        />
        <AdminMetricCard label="Tren naik" value={loading ? "—" : String(stats.up)} />
        <AdminMetricCard label="Tren turun" value={loading ? "—" : String(stats.down)} />
        <AdminMetricCard label="Stabil" value={loading ? "—" : String(stats.stable)} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-1">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Harga pasar hari ini
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500">Tidak ada data untuk filter ini.</p>
          ) : (
            items.map((t) => {
              const meta = TREND_META[t.trendType] ?? TREND_META.STABLE;
              const isSelected = selected?.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:bg-brand-500/10"
                      : "border-gray-200 bg-white hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">{t.label}</p>
                      <p className="mt-0.5 text-theme-xs text-gray-500">
                        {CATEGORY_LABELS[t.category] ?? t.category}
                      </p>
                    </div>
                    <Badge color={meta.badge} size="sm">
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="mt-2 text-lg font-semibold" style={{ color: meta.color }}>
                    {t.currentValue}
                  </p>
                  <p className="mt-1 text-theme-xs text-gray-400">
                    Diperbarui {formatDate(t.updatedAt)}
                  </p>
                </button>
              );
            })
          )}
        </div>

        <div className="space-y-6 xl:col-span-2">
          <ComponentCard
            title={selected ? `Riwayat: ${selected.label}` : "Riwayat harga"}
            desc="Garis tren 12 bulan terakhir (nilai numerik dari backend)"
          >
            {!selected ? (
              <p className="py-12 text-center text-sm text-gray-500">
                Pilih indikator di kiri untuk melihat grafik.
              </p>
            ) : (
              <AdminAreaChart
                categories={selectedHistory.categories}
                series={{ name: selected.label, data: selectedHistory.values }}
                height={300}
                colors={[lineColor]}
                formatY={formatChartValue}
                formatTooltipY={formatChartValue}
                loading={loading}
                emptyMessage="Belum ada data riwayat untuk indikator ini."
                extraOptions={{
                  chart: { type: "line" },
                  stroke: { curve: "smooth", width: 3 },
                  markers: { size: 4, strokeWidth: 0 },
                }}
              />
            )}
          </ComponentCard>

          {compareChart.categories.length > 1 && (
            <ComponentCard
              title="Perbandingan nilai terakhir"
              desc="Batang = nilai bulan terakhir di historyData masing-masing indikator"
            >
              <AdminBarChart
                categories={compareChart.categories}
                series={{ name: "Nilai", data: compareChart.values }}
                colors={compareChart.colors}
                height={280}
                formatY={formatChartValue}
                formatTooltipY={formatChartValue}
                loading={loading}
                extraOptions={{
                  plotOptions: {
                    bar: { borderRadius: 6, columnWidth: "55%", distributed: true },
                  },
                  legend: { show: false },
                }}
              />
            </ComponentCard>
          )}
        </div>
      </div>
    </div>
  );
}
