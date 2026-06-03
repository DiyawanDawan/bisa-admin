"use client";
import AdminAreaChart from "@/components/charts/area/AdminAreaChart";
import AdminBarChart from "@/components/charts/bar/AdminBarChart";
import AdminDonutChart from "@/components/charts/donut/AdminDonutChart";
import AdminInfoBanner from "@/components/common/AdminInfoBanner";
import AdminMetricCard from "@/components/common/AdminMetricCard";
import ComponentCard from "@/components/common/ComponentCard";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import { fetchUserAnalyticsStats } from "@/lib/api/admin";
import type { UserAnalyticsStats } from "@/types/admin";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const ROLE_LABELS: Record<string, string> = {
  SUPPLIER: "Supplier",
  BUYER: "Pembeli",
  ADMIN: "Admin",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif",
  BLOCKED: "Diblokir",
  INACTIVE: "Nonaktif",
  DELETED: "Dihapus",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#059669",
  BLOCKED: "#dc2626",
  INACTIVE: "#f59e0b",
  DELETED: "#9ca3af",
};

const KYC_LABELS: Record<string, string> = {
  PENDING: "Menunggu review",
  VERIFIED: "Terverifikasi",
  REJECTED: "Ditolak",
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

type Props = {
  onRoleClick?: (role: string) => void;
  onStatusClick?: (status: string) => void;
};

export default function UsersStatsPanel({ onRoleClick, onStatusClick }: Props) {
  const [data, setData] = useState<UserAnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchUserAnalyticsStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat statistik pengguna.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const roleChart = useMemo(() => {
    if (!data?.roles.length) {
      return { labels: [], series: [], raw: [] as { role: string; count: number }[] };
    }
    const sorted = [...data.roles].sort((a, b) => b.count - a.count);
    return {
      labels: sorted.map((r) => ROLE_LABELS[r.role] ?? r.role),
      series: sorted.map((r) => r.count),
      raw: sorted,
    };
  }, [data]);

  const statusChart = useMemo(() => {
    if (!data?.statuses.length) {
      return { labels: [], series: [], colors: [], raw: [] as { status: string; count: number }[] };
    }
    const sorted = [...data.statuses].sort((a, b) => b.count - a.count);
    return {
      labels: sorted.map((s) => STATUS_LABELS[s.status] ?? s.status),
      series: sorted.map((s) => s.count),
      colors: sorted.map((s) => STATUS_COLORS[s.status] ?? "#135122"),
      raw: sorted,
    };
  }, [data]);

  const kycChart = useMemo(() => {
    if (!data?.kyc.length) {
      return { labels: [], series: [] };
    }
    const sorted = [...data.kyc].sort((a, b) => b.count - a.count);
    return {
      labels: sorted.map((k) => KYC_LABELS[k.status] ?? k.status),
      series: sorted.map((k) => k.count),
    };
  }, [data]);

  const dailyCategories = useMemo(
    () => data?.dailySignups.map((p) => formatDayLabel(p.x)) ?? [],
    [data],
  );

  const monthlyCategories = useMemo(
    () => data?.monthlySignups.map((p) => formatMonthLabel(p.x)) ?? [],
    [data],
  );

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ))}
        <div className="col-span-full h-72 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert
        variant="error"
        title="Statistik pengguna"
        message={error ?? "Data statistik tidak tersedia."}
      />
    );
  }

  const { summary } = data;
  const emailVerifiedPct =
    summary.totalUsers > 0
      ? Math.round((summary.emailVerified / summary.totalUsers) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <AdminInfoBanner>
        Demografi role & status, progres KYC, dan tren pendaftaran. Klik chip untuk memfilter
        tabel di bawah.
        {summary.pendingKyc > 0 && (
          <>
            {" "}
            <Link href="/users/verifications" className="font-medium text-brand-700 underline">
              {summary.pendingKyc} verifikasi
            </Link>{" "}
            menunggu review.
          </>
        )}
      </AdminInfoBanner>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AdminMetricCard
          label="Total pengguna"
          value={String(summary.totalUsers)}
          desc={`${summary.thisMonthUsers} baru bulan ini`}
        />
        <AdminMetricCard
          label="Aktif"
          value={String(summary.activeUsers)}
          desc={`${summary.blockedUsers} diblokir`}
        />
        <AdminMetricCard
          label="Supplier / Pembeli"
          value={`${summary.suppliers} / ${summary.buyers}`}
          desc={`${summary.admins} admin`}
        />
        <AdminMetricCard
          label="KYC menunggu"
          value={String(summary.pendingKyc)}
          desc={`${summary.verifiedKyc} terverifikasi`}
          href="/users/verifications"
        />
        <AdminMetricCard
          label="Email terverifikasi"
          value={`${emailVerifiedPct}%`}
          desc={`${summary.emailVerified} akun`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {roleChart.raw.map((r) => (
          <button
            key={r.role}
            type="button"
            onClick={() => onRoleClick?.(r.role)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs transition hover:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
          >
            <Badge color="primary" size="sm">
              {ROLE_LABELS[r.role] ?? r.role}
            </Badge>
            <span className="font-semibold text-gray-700 dark:text-gray-200">{r.count}</span>
          </button>
        ))}
        {statusChart.raw.map((s) => (
          <button
            key={s.status}
            type="button"
            onClick={() => onStatusClick?.(s.status)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs transition hover:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
          >
            <Badge
              color={
                s.status === "ACTIVE" ? "success" : s.status === "BLOCKED" ? "error" : "warning"
              }
              size="sm"
            >
              {STATUS_LABELS[s.status] ?? s.status}
            </Badge>
            <span className="font-semibold text-gray-700 dark:text-gray-200">{s.count}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ComponentCard title="Per role" desc="Distribusi pengguna">
          <AdminDonutChart
            labels={roleChart.labels}
            series={roleChart.series}
            centerLabel="Pengguna"
            formatTotal={(sum) => String(Math.round(sum))}
            formatValue={(val) => String(Math.round(val))}
            height={280}
            emptyMessage="Belum ada data role."
          />
        </ComponentCard>
        <ComponentCard title="Status akun" desc="Aktif, blokir, dll.">
          <AdminDonutChart
            labels={statusChart.labels}
            series={statusChart.series}
            centerLabel="Status akun"
            formatTotal={(sum) => String(Math.round(sum))}
            formatValue={(val) => String(Math.round(val))}
            height={280}
            emptyMessage="Belum ada data status."
          />
        </ComponentCard>
        <ComponentCard title="KYC" desc="Status verifikasi dokumen">
          <AdminDonutChart
            labels={kycChart.labels}
            series={kycChart.series}
            centerLabel="Dokumen KYC"
            formatTotal={(sum) => String(Math.round(sum))}
            formatValue={(val) => String(Math.round(val))}
            height={280}
            emptyMessage="Belum ada data KYC."
          />
        </ComponentCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ComponentCard title="Pendaftaran harian" desc="30 hari terakhir">
          <AdminAreaChart
            categories={dailyCategories}
            series={{ name: "Pendaftar", data: data.dailySignups.map((p) => p.y) }}
          />
        </ComponentCard>
        <ComponentCard title="Status akun" desc="Bar horizontal">
          <AdminBarChart
            categories={statusChart.labels}
            series={{ name: "Jumlah", data: statusChart.series }}
            horizontal
            colors={statusChart.colors}
            emptyMessage="Belum ada data status."
            extraOptions={{
              dataLabels: { enabled: true },
              legend: { show: false },
            }}
          />
        </ComponentCard>
      </div>

      <ComponentCard title="Pendaftaran per bulan" desc="12 bulan terakhir">
        <AdminBarChart
          categories={monthlyCategories}
          series={{ name: "Pendaftar", data: data.monthlySignups.map((p) => p.y) }}
          height={260}
          colors={["#0ea5e9"]}
        />
      </ComponentCard>
    </div>
  );
}
