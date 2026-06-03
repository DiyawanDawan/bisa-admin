"use client";
import AdminAreaChart from "@/components/charts/area/AdminAreaChart";
import AdminBarChart from "@/components/charts/bar/AdminBarChart";
import AdminDonutChart from "@/components/charts/donut/AdminDonutChart";
import AdminInfoBanner from "@/components/common/AdminInfoBanner";
import AdminMetricCard from "@/components/common/AdminMetricCard";
import ComponentCard from "@/components/common/ComponentCard";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import { fetchOrderAnalytics } from "@/lib/api/extended";
import { formatIDR } from "@/lib/format";
import type { OrderAnalytics } from "@/types/extended";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu bayar",
  CONFIRMED: "Dikonfirmasi",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  DISPUTED: "Sengketa",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#0ea5e9",
  PROCESSING: "#6366f1",
  SHIPPED: "#8b5cf6",
  COMPLETED: "#059669",
  CANCELLED: "#9ca3af",
  DISPUTED: "#dc2626",
};

function formatDayLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
}

function compactIdr(val: number): string {
  if (val >= 1_000_000) {
    return new Intl.NumberFormat("id-ID", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(val);
  }
  return formatIDR(val);
}

function orderStatusBadge(status: string): "success" | "warning" | "error" | "light" {
  const s = status.toUpperCase();
  if (s === "COMPLETED") return "success";
  if (s === "DISPUTED" || s === "CANCELLED") return s === "DISPUTED" ? "error" : "light";
  if (["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(s)) return "warning";
  return "light";
}

type Props = {
  onStatusClick?: (status: string) => void;
};

export default function OrdersStatsPanel({ onStatusClick }: Props) {
  const [data, setData] = useState<OrderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchOrderAnalytics());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat statistik order.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const statusChart = useMemo(() => {
    if (!data?.byStatus.length) {
      return { labels: [], series: [], colors: [], raw: [] as { status: string; count: number }[] };
    }
    const sorted = [...data.byStatus].sort((a, b) => b.count - a.count);
    return {
      labels: sorted.map((s) => STATUS_LABELS[s.status] ?? s.status),
      series: sorted.map((s) => s.count),
      colors: sorted.map((s) => STATUS_COLORS[s.status] ?? "#135122"),
      raw: sorted,
    };
  }, [data]);

  const dailyCategories = useMemo(
    () => data?.dailyOrders.map((p) => formatDayLabel(p.x)) ?? [],
    [data],
  );

  const monthlyCategories = useMemo(
    () => data?.monthlyOrders.map((p) => formatMonthLabel(p.x)) ?? [],
    [data],
  );

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
        <div className="col-span-full h-72 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert
        variant="error"
        title="Statistik order"
        message={error ?? "Data statistik tidak tersedia."}
      />
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-6">
      <AdminInfoBanner>
        Pantau volume order, GMV, dan distribusi status. Klik chip status di bawah untuk
        memfilter tabel.
        {summary.activeDisputes > 0 && (
          <>
            {" "}
            <Link href="/disputes" className="font-medium text-brand-700 underline">
              {summary.activeDisputes} sengketa
            </Link>{" "}
            menunggu penyelesaian.
          </>
        )}
      </AdminInfoBanner>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AdminMetricCard
          label="Total order"
          value={String(summary.totalOrders)}
          desc="Semua status"
        />
        <AdminMetricCard
          label="Dalam proses"
          value={String(summary.inProgress)}
          desc="Belum selesai / batal"
        />
        <AdminMetricCard
          label="Sengketa aktif"
          value={String(summary.activeDisputes)}
          desc="Perlu moderasi"
          href="/disputes"
        />
        <AdminMetricCard
          label="GMV selesai"
          value={formatIDR(summary.completedGmv)}
          desc={`${summary.completedOrders} order completed`}
          href="/finance"
        />
        <AdminMetricCard
          label="Bulan ini"
          value={String(summary.thisMonthOrders)}
          desc={`${formatIDR(summary.thisMonthGmv)} GMV`}
        />
      </div>

      {statusChart.raw.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {statusChart.raw.map((s) => (
            <button
              key={s.status}
              type="button"
              onClick={() => onStatusClick?.(s.status)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs transition hover:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
            >
              <Badge color={orderStatusBadge(s.status)} size="sm">
                {STATUS_LABELS[s.status] ?? s.status}
              </Badge>
              <span className="font-semibold text-gray-700 dark:text-gray-200">{s.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ComponentCard title="Distribusi status" desc="Donut seluruh order">
          <AdminDonutChart
            labels={statusChart.labels}
            series={statusChart.series}
            centerLabel="Total order"
            formatTotal={(sum) => String(Math.round(sum))}
            formatValue={(val) => String(Math.round(val))}
            height={300}
            emptyMessage="Belum ada data status."
          />
        </ComponentCard>
        <ComponentCard title="Status per jumlah" desc="Bar horizontal">
          <AdminBarChart
            categories={statusChart.labels}
            series={{ name: "Jumlah", data: statusChart.series }}
            horizontal
            colors={statusChart.colors}
            height={300}
            emptyMessage="Belum ada data status."
            extraOptions={{
              dataLabels: { enabled: true },
              legend: { show: false },
            }}
          />
        </ComponentCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ComponentCard title="Volume order harian" desc="30 hari terakhir">
          <AdminAreaChart
            categories={dailyCategories}
            series={{ name: "Order", data: data.dailyOrders.map((p) => p.y) }}
            formatY={(v) => String(Math.round(v))}
          />
        </ComponentCard>
        <ComponentCard title="GMV harian" desc="Order selesai — 30 hari">
          <AdminAreaChart
            categories={dailyCategories}
            series={{ name: "GMV", data: data.dailyRevenue.map((p) => p.y) }}
            colors={["#059669"]}
            formatY={compactIdr}
            formatTooltipY={(v) => formatIDR(v)}
          />
        </ComponentCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ComponentCard title="Order per bulan" desc="12 bulan terakhir">
          <AdminBarChart
            categories={monthlyCategories}
            series={{ name: "Order", data: data.monthlyOrders.map((p) => p.y) }}
            height={260}
            colors={["#0ea5e9"]}
          />
        </ComponentCard>
        <ComponentCard title="GMV bulanan" desc="Order selesai">
          <AdminBarChart
            categories={monthlyCategories}
            series={{ name: "GMV", data: data.monthlyRevenue.map((p) => p.y) }}
            height={260}
            formatY={compactIdr}
            formatTooltipY={(v) => formatIDR(v)}
          />
        </ComponentCard>
      </div>
    </div>
  );
}
