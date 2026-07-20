"use client";
import AdminInfoBanner from "@/components/common/AdminInfoBanner";
import AdminMetricCard from "@/components/common/AdminMetricCard";
import AdminSegmentTabs from "@/components/common/AdminSegmentTabs";
import AdminAreaChart from "@/components/charts/area/AdminAreaChart";
import AdminBarChart from "@/components/charts/bar/AdminBarChart";
import AdminDonutChart from "@/components/charts/donut/AdminDonutChart";
import AdminPieChart from "@/components/charts/pie/AdminPieChart";
import DashboardVisualGallerySection from "@/components/dashboard/DashboardVisualGallery";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import {
  fetchBiomassTrend,
  fetchCategoryAnalytics,
  fetchDashboardPlatformAnalytics,
  fetchDashboardStats,
  fetchDashboardVisualGallery,
  fetchIntegrationHealth,
  fetchRevenueChart,
  fetchTopSuppliers,
  fetchUserAnalytics,
} from "@/lib/api/admin";
import { fetchOrderAnalytics } from "@/lib/api/extended";
import { formatIDR, formatNumber, formatTons } from "@/lib/format";
import type {
  ChartPoint,
  DashboardPlatformAnalytics,
  DashboardStats,
  DashboardVisualGallery,
  DonutChartData,
  RevenueChartData,
  TopSuppliersChartData,
  UserAnalyticsData,
} from "@/types/admin";
import type { OrderAnalytics } from "@/types/extended";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Tab = "ringkasan" | "produk" | "order" | "platform";

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  BLOCKED: "Diblokir",
  DRAFT: "Draft",
  OUT_OF_STOCK: "Stok habis",
  DELETED: "Dihapus",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu bayar",
  CONFIRMED: "Dikonfirmasi",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  DISPUTED: "Sengketa",
};

const QUICK_LINKS = [
  { name: "Order", path: "/orders", desc: "Statistik & daftar" },
  { name: "Pengguna", path: "/users", desc: "Analitik akun" },
  { name: "CRM", path: "/crm", desc: "Pipeline kontak" },
  { name: "Keuangan", path: "/finance", desc: "Dompet & payout" },
  { name: "Chat", path: "/chat", desc: "Negosiasi Anda" },
  { name: "Notifikasi", path: "/notifications", desc: "Broadcast sistem" },
  { name: "Forum", path: "/forum", desc: "Moderasi posting" },
  { name: "Produk", path: "/products", desc: "Moderasi listing" },
];

function formatGreetingDate(): string {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function compactIdr(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(val);
}

export default function BisaDashboard() {
  const [tab, setTab] = useState<Tab>("ringkasan");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueChartData | null>(null);
  const [biomass, setBiomass] = useState<ChartPoint[]>([]);
  const [users, setUsers] = useState<UserAnalyticsData | null>(null);
  const [categories, setCategories] = useState<DonutChartData | null>(null);
  const [suppliers, setSuppliers] = useState<TopSuppliersChartData | null>(null);
  const [orders, setOrders] = useState<OrderAnalytics | null>(null);
  const [platform, setPlatform] = useState<DashboardPlatformAnalytics | null>(null);
  const [visualGallery, setVisualGallery] = useState<DashboardVisualGallery | null>(null);
  const [integrationHealth, setIntegrationHealth] = useState<{
    generatedAt: string;
    summary: {
      pendingOver24h: number;
      missingShippingMeta: number;
      failedPayments7d: number;
      unreadNotifications: number;
    };
    status: "HEALTHY" | "NEEDS_ATTENTION";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [
      statsR,
      revR,
      bioR,
      usrR,
      catR,
      supR,
      ordR,
      platR,
      galleryR,
      integR,
    ] = await Promise.allSettled([
      fetchDashboardStats(),
      fetchRevenueChart(),
      fetchBiomassTrend(),
      fetchUserAnalytics(),
      fetchCategoryAnalytics(),
      fetchTopSuppliers(),
      fetchOrderAnalytics(),
      fetchDashboardPlatformAnalytics(),
      fetchDashboardVisualGallery(),
      fetchIntegrationHealth(),
    ]);

    const failed: string[] = [];
    const read = <T,>(result: PromiseSettledResult<T>, label: string, fallback: T): T => {
      if (result.status === "fulfilled") return result.value;
      failed.push(label);
      return fallback;
    };

    setStats(read(statsR, "statistik", null));
    setRevenue(read(revR, "pendapatan", null));
    setBiomass(read(bioR, "biomassa", []));
    setUsers(read(usrR, "pengguna", null));
    setCategories(read(catR, "kategori", null));
    setSuppliers(read(supR, "supplier", null));
    setOrders(read(ordR, "order", null));
    setPlatform(read(platR, "platform", null));
    setVisualGallery(read(galleryR, "galeri", null));
    setIntegrationHealth(read(integR, "health", null));
    setUpdatedAt(new Date());

    if (failed.length > 0) {
      setError(
        `Beberapa data gagal dimuat (${failed.join(", ")}). Periksa koneksi API, sesi login, dan migrasi backend.`,
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const revenueCategories = useMemo(
    () => revenue?.series[0]?.data.map((p) => p.x) ?? [],
    [revenue],
  );
  const revenueValues = useMemo(
    () => revenue?.series[0]?.data.map((p) => p.y) ?? [],
    [revenue],
  );

  const biomassCategories = useMemo(() => biomass.map((p) => p.x), [biomass]);
  const biomassValues = useMemo(() => biomass.map((p) => p.y), [biomass]);

  const userLabels = users?.roles.labels ?? [];
  const userSeries = users?.roles.series ?? [];

  const statusChart = useMemo(() => {
    if (!orders?.byStatus?.length) {
      return { labels: [] as string[], series: [] as number[] };
    }
    const sorted = [...orders.byStatus].sort((a, b) => b.count - a.count);
    return {
      labels: sorted.map((s) => STATUS_LABELS[s.status] ?? s.status),
      series: sorted.map((s) => s.count),
    };
  }, [orders]);

  const dailyOrderCategories = useMemo(
    () =>
      orders?.dailyOrders?.map((p) => {
        const d = new Date(p.x + "T12:00:00");
        return Number.isNaN(d.getTime())
          ? p.x
          : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      }) ?? [],
    [orders],
  );

  const supplierBarData = useMemo(
    () => suppliers?.series[0]?.data ?? [],
    [suppliers],
  );

  const chartTabs = [
    { id: "ringkasan", label: "Ringkasan", hint: "Pendapatan & user" },
    { id: "produk", label: "Biomassa & Produk", hint: "Kategori & supplier" },
    { id: "order", label: "Aktivitas Order", hint: "Status & volume" },
    { id: "platform", label: "Platform", hint: "Produk, toko, KYC" },
  ];

  const productStatusChart = useMemo(() => {
    if (!platform?.productsByStatus?.length) {
      return { labels: [] as string[], series: [] as number[] };
    }
    const sorted = [...platform.productsByStatus].sort((a, b) => b.count - a.count);
    return {
      labels: sorted.map((s) => PRODUCT_STATUS_LABELS[s.status] ?? s.status),
      series: sorted.map((s) => s.count),
    };
  }, [platform]);

  return (
    <div className="space-y-6">
      <AdminInfoBanner>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <strong className="text-gray-800 dark:text-white/90">Dashboard BISA:</strong> ringkasan
            pengguna, transaksi, biomassa, dan akses modul operasional. {formatGreetingDate()}
          </p>
          <div className="flex shrink-0 items-center gap-3">
            {updatedAt ? (
              <span className="text-theme-xs text-gray-500">
                Diperbarui{" "}
                {updatedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : null}
            <Button size="sm" onClick={load} disabled={loading}>
              {loading ? "Memuat…" : "Segarkan"}
            </Button>
          </div>
        </div>
      </AdminInfoBanner>

      {error ? <Alert variant="error" title="Gagal memuat" message={error} /> : null}

      {stats && stats.activeDisputes > 0 ? (
        <Alert
          variant="warning"
          title={`${formatNumber(stats.activeDisputes)} sengketa aktif`}
          message="Perlu peninjauan admin segera."
          showLink
          linkHref="/disputes"
          linkText="Buka halaman sengketa"
        />
      ) : null}
      {integrationHealth?.status === "NEEDS_ATTENTION" ? (
        <Alert
          variant="warning"
          title="Health integrasi perlu perhatian"
          message={`Pending >24j: ${integrationHealth.summary.pendingOver24h}, shipping meta kosong: ${integrationHealth.summary.missingShippingMeta}, payment gagal 7 hari: ${integrationHealth.summary.failedPayments7d}`}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
            />
          ))
        ) : stats ? (
          <>
            <AdminMetricCard
              label="Total pengguna"
              value={formatNumber(stats.totalUsers)}
              desc="Semua role terdaftar"
              href="/users"
            />
            <AdminMetricCard
              label="Total order"
              value={formatNumber(stats.totalOrders)}
              desc={
                orders
                  ? `${formatNumber(orders.summary.inProgress)} sedang berjalan`
                  : "Seluruh status"
              }
              href="/orders"
            />
            <AdminMetricCard
              label="GMV selesai"
              value={formatIDR(stats.totalGMV)}
              desc={
                orders
                  ? `Bulan ini ${formatIDR(orders.summary.thisMonthGmv)}`
                  : "Order completed"
              }
              href="/finance"
            />
            <AdminMetricCard
              label="Biomassa terjual"
              value={formatTons(stats.totalBiomassTons)}
              desc="Akumulasi tonase"
            />
            <AdminMetricCard
              label="Sengketa aktif"
              value={formatNumber(stats.activeDisputes)}
              href="/disputes"
              action={
                stats.activeDisputes > 0 ? (
                  <Badge color="error" size="sm">
                    Perlu tindakan
                  </Badge>
                ) : (
                  <Badge color="success" size="sm">
                    Aman
                  </Badge>
                )
              }
            />
            <AdminMetricCard
              label="Order bulan ini"
              value={formatNumber(orders?.summary.thisMonthOrders ?? 0)}
              desc={
                orders
                  ? `${formatNumber(orders.summary.completedOrders)} selesai total`
                  : "Memuat detail…"
              }
              href="/orders"
            />
          </>
        ) : null}
      </div>

      <ComponentCard title="Akses cepat" desc="Navigasi ke modul admin utama">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {QUICK_LINKS.map((item) => (
            <li
              key={item.path}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{item.name}</p>
                <p className="text-theme-xs text-gray-500">{item.desc}</p>
              </div>
              <Link href={item.path}>
                <Button size="sm" variant="outline">
                  Buka
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </ComponentCard>

      <AdminSegmentTabs tabs={chartTabs} active={tab} onChange={setTab} />

      {tab === "ringkasan" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <ComponentCard title="Tren pendapatan" desc="GMV / pendapatan 12 bulan terakhir">
              <AdminAreaChart
                categories={revenueCategories}
                series={{ name: "Pendapatan", data: revenueValues }}
                height={300}
                formatY={compactIdr}
                formatTooltipY={formatIDR}
                loading={loading}
                emptyMessage="Belum ada data pendapatan."
              />
            </ComponentCard>
          </div>
          <div className="xl:col-span-4">
            <ComponentCard title="Demografi pengguna" desc="Distribusi per role">
              <AdminDonutChart
                labels={userLabels}
                series={userSeries}
                centerLabel="Pengguna"
                formatTotal={formatNumber}
                formatValue={formatNumber}
                height={300}
                loading={loading}
                emptyMessage="Belum ada data pengguna."
              />
            </ComponentCard>
          </div>
        </div>
      )}

      {tab === "produk" && (
        <div className="space-y-6">
          <ComponentCard title="Tren biomassa" desc="Tonase terjual — 30 hari terakhir">
            <AdminBarChart
              categories={biomassCategories}
              series={{ name: "Tonase", data: biomassValues }}
              formatTooltipY={formatTons}
              loading={loading}
              emptyMessage="Belum ada data biomassa."
            />
          </ComponentCard>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ComponentCard title="Produk per kategori" desc="Komposisi listing aktif">
              <AdminPieChart
                labels={categories?.labels ?? []}
                series={categories?.series ?? []}
                loading={loading}
                emptyMessage="Belum ada produk aktif."
              />
            </ComponentCard>
            <ComponentCard title="Top 5 supplier" desc="Berdasarkan GMV">
              <AdminBarChart
                categories={suppliers?.labels ?? []}
                series={{ name: "Volume", data: supplierBarData }}
                horizontal
                formatTooltipY={formatIDR}
                loading={loading}
                emptyMessage="Belum ada data supplier."
              />
            </ComponentCard>
          </div>
        </div>
      )}

      {tab === "order" && (
        <div className="space-y-6">
          {!orders && !loading ? (
            <Alert
              variant="warning"
              title="Statistik order tidak tersedia"
              message="Endpoint analitik order gagal dimuat. Gunakan halaman Order untuk detail lengkap."
              showLink
              linkHref="/orders"
              linkText="Buka Order"
            />
          ) : null}

          {orders ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AdminMetricCard
                label="Dalam proses"
                value={formatNumber(orders.summary.inProgress)}
                href="/orders"
              />
              <AdminMetricCard
                label="Selesai"
                value={formatNumber(orders.summary.completedOrders)}
                href="/orders"
              />
              <AdminMetricCard
                label="GMV selesai"
                value={formatIDR(orders.summary.completedGmv)}
                href="/finance"
              />
              <AdminMetricCard
                label="Sengketa aktif"
                value={formatNumber(orders.summary.activeDisputes)}
                href="/disputes"
                action={
                  orders.summary.activeDisputes > 0 ? (
                    <Badge color="error" size="sm">
                      Perlu tindakan
                    </Badge>
                  ) : (
                    <Badge color="success" size="sm">
                      Aman
                    </Badge>
                  )
                }
              />
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <ComponentCard title="Status order" desc="Distribusi seluruh status">
                <AdminDonutChart
                  labels={statusChart.labels}
                  series={statusChart.series}
                  centerLabel="Order"
                  formatTotal={formatNumber}
                  formatValue={formatNumber}
                  height={280}
                  loading={loading}
                  emptyMessage="Belum ada order."
                />
              </ComponentCard>
            </div>
            <div className="lg:col-span-7">
              <ComponentCard title="Volume harian" desc="Jumlah order — 30 hari terakhir">
                <AdminAreaChart
                  categories={dailyOrderCategories}
                  series={{
                    name: "Order",
                    data: orders?.dailyOrders?.map((p) => p.y) ?? [],
                  }}
                  formatY={(v) => String(Math.round(v))}
                  loading={loading}
                  emptyMessage="Belum ada tren harian."
                />
              </ComponentCard>
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/orders">
              <Button size="sm" variant="outline">
                Analitik order lengkap
              </Button>
            </Link>
          </div>
        </div>
      )}

      {tab === "platform" && (
        <div className="space-y-6">
          {!platform && !loading ? (
            <Alert
              variant="warning"
              title="Analitik platform tidak tersedia"
              message="Endpoint analitik platform gagal dimuat."
            />
          ) : null}

          {platform ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                <AdminMetricCard
                  label="Produk aktif"
                  value={formatNumber(platform.summary.activeProducts)}
                  desc={`${formatNumber(platform.summary.totalProducts)} total`}
                  href="/products"
                />
                <AdminMetricCard
                  label="Produk sertifikasi"
                  value={formatNumber(platform.summary.certifiedProducts)}
                  href="/products"
                />
                <AdminMetricCard
                  label="Produk bulan ini"
                  value={formatNumber(platform.summary.productsThisMonth)}
                  href="/products"
                />
                <AdminMetricCard
                  label="Banner toko aktif"
                  value={formatNumber(platform.summary.activeStoreBanners)}
                  desc={`${formatNumber(platform.summary.suppliersWithBanner)} toko`}
                />
                <AdminMetricCard
                  label="Supplier aktif"
                  value={formatNumber(platform.summary.activeSuppliers)}
                  href="/users"
                />
                <AdminMetricCard
                  label="Post forum"
                  value={formatNumber(platform.summary.publishedForumPosts)}
                  href="/forum"
                />
                <AdminMetricCard
                  label="Antrean KYC"
                  value={formatNumber(platform.summary.pendingKyc)}
                  href="/users/verifications"
                  action={
                    platform.summary.pendingKyc > 0 ? (
                      <Badge color="warning" size="sm">
                        Perlu review
                      </Badge>
                    ) : (
                      <Badge color="success" size="sm">
                        Kosong
                      </Badge>
                    )
                  }
                />
              </div>

              <ComponentCard title="Status produk" desc="Distribusi seluruh listing">
                <AdminDonutChart
                  labels={productStatusChart.labels}
                  series={productStatusChart.series}
                  centerLabel="Produk"
                  formatTotal={formatNumber}
                  formatValue={formatNumber}
                  height={280}
                  loading={loading}
                  emptyMessage="Belum ada produk."
                />
              </ComponentCard>
            </>
          ) : null}
        </div>
      )}

      <ComponentCard
        title="Galeri visual platform"
        desc="Preview gambar produk, banner toko, supplier, dan media forum"
      >
        <DashboardVisualGallerySection data={visualGallery} loading={loading} />
      </ComponentCard>
    </div>
  );
}
