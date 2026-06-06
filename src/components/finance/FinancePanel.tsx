"use client";
import AdminInfoBanner from "@/components/common/AdminInfoBanner";
import AdminMetricCard from "@/components/common/AdminMetricCard";
import AdminSegmentTabs from "@/components/common/AdminSegmentTabs";
import AdminDonutChart from "@/components/charts/donut/AdminDonutChart";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import WalletsList from "@/components/finance/WalletsList";
import {
  approvePayout,
  createFee,
  exportFinanceReport,
  fetchFees,
  fetchFinanceStats,
  fetchPayouts,
  fetchTransactions,
  updateFee,
} from "@/lib/api/admin";
import { selectClass } from "@/lib/form-classes";
import { formatDate, formatIDR } from "@/lib/format";
import type { FinanceStats, PayoutItem, PlatformFee, TransactionItem } from "@/types/admin";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Tab = "overview" | "transactions" | "fees" | "payouts" | "wallets" | "export";

const FEE_TYPES = [
  "TRANSACTION_FEE",
  "WITHDRAWAL_FEE",
  "ADMIN_FEE",
  "LOGISTICS_FEE",
  "CARBON_FEE",
  "BIOMASS_FEE",
  "SUBSCRIPTION",
  "VAT",
] as const;

const FEE_TYPE_LABELS: Record<(typeof FEE_TYPES)[number], string> = {
  TRANSACTION_FEE: "Biaya Transaksi",
  WITHDRAWAL_FEE: "Biaya Penarikan",
  ADMIN_FEE: "Biaya Admin",
  LOGISTICS_FEE: "Biaya Logistik",
  CARBON_FEE: "Biaya Karbon",
  BIOMASS_FEE: "Biaya Biomassa",
  SUBSCRIPTION: "Langganan",
  VAT: "PPN",
};

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "overview", label: "Ringkasan", hint: "Grafik & KPI" },
  { id: "payouts", label: "Penarikan", hint: "Antrean approve" },
  { id: "transactions", label: "Transaksi", hint: "Ledger escrow" },
  { id: "fees", label: "Biaya platform", hint: "Fee & komisi" },
  { id: "wallets", label: "Dompet user", hint: "Saldo supplier" },
  { id: "export", label: "Export CSV", hint: "Laporan max 31 hari" },
];

function formatFeeValue(fee: PlatformFee): string {
  if (fee.type === "PERCENTAGE") return `${fee.amount}%`;
  return formatIDR(Number(fee.amount));
}

function txStatusColor(status: string): "success" | "warning" | "error" | "light" {
  const s = status.toUpperCase();
  if (s.includes("RELEASE") || s.includes("COMPLETE") || s.includes("SUCCESS")) return "success";
  if (s.includes("PENDING") || s.includes("HOLD") || s.includes("ESCROW")) return "warning";
  if (s.includes("FAIL") || s.includes("REFUND") || s.includes("CANCEL")) return "error";
  return "light";
}

function payoutStatusColor(status: string): "success" | "warning" | "error" | "light" {
  const s = status.toUpperCase();
  if (s === "COMPLETED" || s === "RELEASED") return "success";
  if (s === "PENDING" || s === "PROCESSING") return "warning";
  if (s === "FAILED") return "error";
  return "light";
}

const TAB_IDS = new Set<string>(TABS.map((t) => t.id));

function tabFromQuery(value: string | null): Tab | null {
  if (!value || !TAB_IDS.has(value)) return null;
  return value as Tab;
}

export default function FinancePanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [tab, setTab] = useState<Tab>(() => tabFromQuery(searchParams.get("tab")) ?? "overview");

  const selectTab = useCallback(
    (next: Tab) => {
      setTab(next);
      setError(null);
      const path = next === "overview" ? "/finance" : `/finance?tab=${next}`;
      router.replace(path, { scroll: false });
    },
    [router],
  );
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [fees, setFees] = useState<PlatformFee[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [feeName, setFeeName] = useState<(typeof FEE_TYPES)[number]>("TRANSACTION_FEE");
  const [feeCalcType, setFeeCalcType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [feeAmount, setFeeAmount] = useState("");
  const [feeDescription, setFeeDescription] = useState("");
  const [creatingFee, setCreatingFee] = useState(false);
  const [payoutActionId, setPayoutActionId] = useState<string | null>(null);

  const pendingPayouts = useMemo(
    () => payouts.filter((p) => ["PENDING", "PROCESSING"].includes(p.status.toUpperCase())).length,
    [payouts],
  );

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(await fetchFinanceStats());
    } catch {
      setError("Gagal memuat ringkasan keuangan.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadTab = useCallback(async () => {
    if (tab === "overview" || tab === "export" || tab === "wallets") return;
    setLoading(true);
    setError(null);
    try {
      if (tab === "transactions") {
        const res = await fetchTransactions({
          page: 1,
          limit: 30,
          search: txSearch.trim() || undefined,
          type: txTypeFilter || undefined,
          status: txStatusFilter || undefined,
        });
        setTransactions(res.items);
      } else if (tab === "fees") {
        setFees(await fetchFees());
      } else if (tab === "payouts") {
        const res = await fetchPayouts({ page: 1, limit: 30 });
        setPayouts(res.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [tab, txSearch, txTypeFilter, txStatusFilter]);

  useEffect(() => {
    const q = tabFromQuery(searchParams.get("tab"));
    if (q) setTab(q);
  }, [searchParams]);

  useEffect(() => {
    loadStats();
    (async () => {
      try {
        const [pRes, f] = await Promise.all([
          fetchPayouts({ page: 1, limit: 50 }),
          fetchFees(),
        ]);
        setPayouts(pRes.items);
        setFees(f);
      } catch {
        /* ringkasan tetap tampil */
      }
    })();
  }, [loadStats]);

  useEffect(() => {
    loadTab();
  }, [loadTab]);

  const donut = useMemo(() => {
    if (!stats) return { series: [], labels: [] };
    const values = [
      Number(stats.totalInEscrow) || 0,
      Number(stats.totalReleased) || 0,
      Number(stats.totalRefunded) || 0,
      Number(stats.platformRevenue) || 0,
    ];
    const total = values.reduce((a, b) => a + b, 0);
    if (total <= 0) return { series: [], labels: [] };
    return {
      series: values,
      labels: ["Dana escrow", "Sudah cair", "Refund", "Pendapatan platform"],
    };
  }, [stats]);

  const segmentTabs = useMemo(
    () =>
      TABS.map((t) => ({
        id: t.id,
        label: t.label,
        hint: t.hint,
        badge: t.id === "payouts" ? pendingPayouts : undefined,
      })),
    [pendingPayouts],
  );

  async function handleFeeUpdate(fee: PlatformFee, isActive: boolean) {
    try {
      await updateFee(fee.id, { isActive });
      setFees(await fetchFees());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui biaya.");
    }
  }

  async function handleCreateFee(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(feeAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Nilai biaya tidak valid.");
      return;
    }
    setCreatingFee(true);
    setError(null);
    try {
      await createFee({
        name: feeName,
        amount,
        type: feeCalcType,
        description: feeDescription.trim() || undefined,
        isActive: true,
      });
      setFeeAmount("");
      setFeeDescription("");
      setShowFeeForm(false);
      setFees(await fetchFees());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah biaya.");
    } finally {
      setCreatingFee(false);
    }
  }

  async function handlePayout(id: string, status: "COMPLETED" | "FAILED") {
    const label = status === "COMPLETED" ? "menyetujui" : "menolak";
    if (!confirm(`Yakin ingin ${label} penarikan ini?`)) return;
    setPayoutActionId(id);
    setError(null);
    try {
      await approvePayout(id, status);
      const res = await fetchPayouts({ page: 1, limit: 30 });
      setPayouts(res.items);
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses penarikan.");
    } finally {
      setPayoutActionId(null);
    }
  }

  async function handleExport() {
    if (!startDate || !endDate) return;
    setExporting(true);
    try {
      await exportFinanceReport(startDate, endDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export gagal.");
    } finally {
      setExporting(false);
    }
  }

  const kpiCards = stats
    ? [
        {
          label: "Dana di escrow",
          value: formatIDR(stats.totalInEscrow),
          desc: "Order belum selesai / ditahan",
        },
        {
          label: "Sudah dicairkan",
          value: formatIDR(stats.totalReleased),
          desc: "Dana ke penjual",
        },
        {
          label: "Total refund",
          value: formatIDR(stats.totalRefunded),
          desc: "Pengembalian ke pembeli",
        },
        {
          label: "Pendapatan platform",
          value: formatIDR(stats.platformRevenue),
          desc: "Komisi & biaya BISA",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <AdminInfoBanner>
        <strong className="text-gray-800 dark:text-white/90">Modul keuangan:</strong> pantau escrow,
        setujui penarikan supplier, atur biaya platform, dan unduh laporan CSV. Dana per user ada di
        tab Dompet.
      </AdminInfoBanner>

      <AdminSegmentTabs tabs={segmentTabs} active={tab} onChange={selectTab} />

      {error ? (
        <div className="flex flex-wrap items-start gap-3">
          <Alert variant="error" title="Terjadi kesalahan" message={error} />
          <Button size="sm" variant="outline" onClick={() => setError(null)}>
            Tutup
          </Button>
        </div>
      ) : null}

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statsLoading
              ? [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
                  />
                ))
              : kpiCards.map((m) => (
                  <AdminMetricCard key={m.label} label={m.label} value={m.value} desc={m.desc} />
                ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ComponentCard title="Komposisi aliran dana" desc="Proporsi escrow, cair, refund, revenue">
              <AdminDonutChart
                labels={donut.labels}
                series={donut.series}
                centerLabel="Total aliran"
                formatTotal={formatIDR}
                formatValue={formatIDR}
                height={300}
                loading={statsLoading}
                emptyMessage="Belum ada data finansial."
              />
            </ComponentCard>

            <ComponentCard title="Tindakan cepat" desc="Shortcut modul keuangan">
              <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                <li className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <span className="text-gray-700 dark:text-gray-300">
                    Penarikan menunggu persetujuan
                  </span>
                  <Badge color={pendingPayouts > 0 ? "error" : "success"} size="sm">
                    {pendingPayouts}
                  </Badge>
                </li>
                <li className="flex items-center justify-between gap-3 py-3 last:pb-0">
                  <span className="text-gray-700 dark:text-gray-300">Biaya platform aktif</span>
                  <Badge color="light" size="sm">
                    {fees.filter((f) => f.isActive).length || "—"}
                  </Badge>
                </li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                <Button size="sm" onClick={() => selectTab("payouts")}>
                  Buka antrean penarikan
                </Button>
                <Button size="sm" variant="outline" onClick={() => selectTab("fees")}>
                  Kelola biaya
                </Button>
                <Button size="sm" variant="outline" onClick={() => selectTab("export")}>
                  Export CSV
                </Button>
              </div>
            </ComponentCard>
          </div>
        </div>
      )}

      {tab === "payouts" && (
        <ComponentCard
          title="Antrean penarikan dana"
          desc="Setujui atau tolak permintaan withdraw supplier. Prioritas: status PENDING."
        >
          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ) : payouts.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">Tidak ada antrean penarikan.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Supplier
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Jumlah
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Status
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Diajukan
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-end text-theme-xs text-gray-500">
                    Aksi
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => {
                  const canAct = ["PENDING", "PROCESSING"].includes(p.status.toUpperCase());
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="px-4 py-3 text-sm">
                        <span className="font-medium">{p.user?.fullName ?? "—"}</span>
                        {p.user?.email && (
                          <span className="block text-theme-xs text-gray-400">{p.user.email}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm font-semibold">
                        {formatIDR(Number(p.amount))}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge color={payoutStatusColor(p.status)} size="sm">
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(p.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-end">
                        {canAct ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              disabled={payoutActionId === p.id}
                              onClick={() => handlePayout(p.id, "COMPLETED")}
                            >
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={payoutActionId === p.id}
                              onClick={() => handlePayout(p.id, "FAILED")}
                            >
                              Tolak
                            </Button>
                          </div>
                        ) : (
                          <span className="text-theme-xs text-gray-400">Selesai</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ComponentCard>
      )}

      {tab === "transactions" && (
        <ComponentCard title="Ledger transaksi" desc="Semua pergerakan dana terkait escrow">
          <form
            className="mb-4 flex max-w-3xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              loadTab();
            }}
          >
            <div className="min-w-[140px] flex-1">
              <Label>Cari user</Label>
              <Input
                placeholder="Nama user..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
              />
            </div>
            <div className="min-w-[140px]">
              <Label>Tipe</Label>
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">Semua</option>
                <option value="PAYMENT">PAYMENT</option>
                <option value="ESCROW">ESCROW</option>
                <option value="PAYOUT">PAYOUT</option>
                <option value="REFUND">REFUND</option>
              </select>
            </div>
            <div className="min-w-[140px]">
              <Label>Status</Label>
              <select
                value={txStatusFilter}
                onChange={(e) => setTxStatusFilter(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">Semua</option>
                <option value="PENDING">PENDING</option>
                <option value="ESCROW_HELD">ESCROW_HELD</option>
                <option value="RELEASED">RELEASED</option>
                <option value="REFUNDED">REFUNDED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
            <Button type="submit" size="sm">
              Terapkan
            </Button>
          </form>
          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ) : transactions.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">Tidak ada transaksi.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    User
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Tipe
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Jumlah
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Status
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Tanggal
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="px-4 py-3 text-sm">
                      {tx.user?.fullName ?? "—"}
                      {tx.order?.orderNumber && (
                        <span className="block text-theme-xs text-gray-400">
                          Order {tx.order.orderNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500">{tx.type}</TableCell>
                    <TableCell className="px-4 py-3 text-sm font-medium">
                      {formatIDR(Number(tx.amount))}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge color={txStatusColor(tx.status)} size="sm">
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ComponentCard>
      )}

      {tab === "fees" && (
        <ComponentCard title="Pengaturan biaya platform">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              Biaya diterapkan saat checkout / withdraw (persentase atau nominal tetap).
            </p>
            <Button size="sm" variant="outline" onClick={() => setShowFeeForm((v) => !v)}>
              {showFeeForm ? "Tutup form" : "+ Tambah biaya"}
            </Button>
          </div>

          {showFeeForm && (
            <form
              onSubmit={handleCreateFee}
              className="mb-6 rounded-2xl border border-gray-200 p-5 dark:border-gray-800"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Jenis</Label>
                  <select
                    value={feeName}
                    onChange={(e) => setFeeName(e.target.value as (typeof FEE_TYPES)[number])}
                    className={selectClass}
                  >
                    {FEE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {FEE_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Perhitungan</Label>
                  <select
                    value={feeCalcType}
                    onChange={(e) => setFeeCalcType(e.target.value as "PERCENTAGE" | "FIXED")}
                    className={selectClass}
                  >
                    <option value="PERCENTAGE">Persentase (%)</option>
                    <option value="FIXED">Nominal IDR</option>
                  </select>
                </div>
                <div>
                  <Label>Nilai</Label>
                  <Input
                    type="number"
                    min="0"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Deskripsi</Label>
                  <Input
                    value={feeDescription}
                    onChange={(e) => setFeeDescription(e.target.value)}
                    placeholder="Opsional"
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="mt-4" disabled={creatingFee || !feeAmount}>
                {creatingFee ? "Menyimpan..." : "Simpan biaya"}
              </Button>
            </form>
          )}

          {loading ? (
            <div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ) : fees.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">Belum ada biaya platform.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Jenis
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Nilai
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Status
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-end text-theme-xs text-gray-500">
                    Aksi
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      {FEE_TYPE_LABELS[fee.name as (typeof FEE_TYPES)[number]] ?? fee.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold text-brand-700 dark:text-brand-400">
                      {formatFeeValue(fee)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge color={fee.isActive ? "success" : "warning"} size="sm">
                        {fee.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFeeUpdate(fee, !fee.isActive)}
                      >
                        {fee.isActive ? "Matikan" : "Aktifkan"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ComponentCard>
      )}

      {tab === "wallets" && (
        <ComponentCard
          title="Dompet pengguna"
          desc="Saldo dan pendapatan kumulatif supplier — klik nama untuk dossier"
        >
          <WalletsList embedded />
        </ComponentCard>
      )}

      {tab === "export" && (
        <ComponentCard
          title="Export laporan transaksi"
          desc="Rentang tanggal maksimal 31 hari — file CSV unduh otomatis"
        >
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label>Dari tanggal</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Sampai tanggal</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button disabled={exporting || !startDate || !endDate} onClick={handleExport}>
              {exporting ? "Mengunduh..." : "Unduh CSV"}
            </Button>
          </div>
        </ComponentCard>
      )}
    </div>
  );
}
