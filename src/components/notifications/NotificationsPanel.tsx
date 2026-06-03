"use client";
import AdminInfoBanner from "@/components/common/AdminInfoBanner";
import AdminMetricCard from "@/components/common/AdminMetricCard";
import AdminSegmentTabs from "@/components/common/AdminSegmentTabs";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
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
import {
  fetchBroadcastHistory,
  fetchNotificationStats,
  sendBroadcast,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type {
  BroadcastHistoryItem,
  NotificationAdminStats,
  NotificationPriority,
  UserRole,
} from "@/types/admin";
import { useCallback, useEffect, useMemo, useState } from "react";

type Tab = "compose" | "history";

const selectClass =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const PRIORITY_META: Record<
  NotificationPriority,
  { label: string; badge: "success" | "warning" | "error" | "light" }
> = {
  LOW: { label: "Rendah", badge: "light" },
  MEDIUM: { label: "Normal", badge: "success" },
  HIGH: { label: "Tinggi", badge: "warning" },
  URGENT: { label: "Mendesak", badge: "error" },
};

const ROLE_LABELS: Record<string, string> = {
  BUYER: "Pembeli",
  SUPPLIER: "Supplier",
  ADMIN: "Admin",
};

const TEMPLATES = [
  {
    title: "Pemeliharaan sistem",
    message:
      "Aplikasi BISA akan menjalani pemeliharaan singkat malam ini pukul 00:00–02:00 WIB. Mohon selesaikan transaksi penting sebelum jadwal tersebut.",
    priority: "HIGH" as NotificationPriority,
  },
  {
    title: "Promo biomassa terbatas",
    message:
      "Stok biomassa premium tersedia terbatas minggu ini. Cek marketplace untuk penawaran supplier terverifikasi di wilayah Anda.",
    priority: "MEDIUM" as NotificationPriority,
  },
  {
    title: "Lengkapi verifikasi KYC",
    message:
      "Akun Anda belum terverifikasi sepenuhnya. Lengkapi dokumen KYC agar dapat melakukan penarikan dan transaksi tanpa batas.",
    priority: "URGENT" as NotificationPriority,
  },
];

export default function NotificationsPanel() {
  const [tab, setTab] = useState<Tab>("compose");
  const [stats, setStats] = useState<NotificationAdminStats | null>(null);
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<NotificationPriority>("MEDIUM");
  const [targetRole, setTargetRole] = useState<UserRole | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const [s, h] = await Promise.all([
        fetchNotificationStats(),
        fetchBroadcastHistory({ page: 1, limit: 15 }),
      ]);
      setStats(s);
      setHistory(h.items);
    } catch {
      /* stats opsional */
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const audienceLabel = useMemo(() => {
    if (!targetRole) return "Semua pengguna aktif";
    return ROLE_LABELS[targetRole] ?? targetRole;
  }, [targetRole]);

  const canSubmit = title.trim().length >= 5 && message.trim().length >= 10;

  const kpiCards = stats
    ? [
        {
          label: "Total notifikasi",
          value: stats.totalNotifications.toLocaleString("id-ID"),
        },
        {
          label: "Belum dibaca",
          value: stats.unreadNotifications.toLocaleString("id-ID"),
        },
        {
          label: "Broadcast 7 hari",
          value: stats.systemAnnouncements7d.toLocaleString("id-ID"),
        },
        {
          label: "User aktif",
          value: stats.activeUsers.toLocaleString("id-ID"),
        },
        {
          label: "Riwayat broadcast",
          value: stats.broadcastCount.toLocaleString("id-ID"),
        },
      ]
    : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await sendBroadcast({
        title: title.trim(),
        message: message.trim(),
        priority,
        ...(targetRole ? { targetRole } : {}),
      });
      setSuccess(
        `Broadcast terkirim ke ${result.count.toLocaleString("id-ID")} pengguna (${audienceLabel}).`,
      );
      setTitle("");
      setMessage("");
      await loadMeta();
      setTab("history");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim broadcast.");
    } finally {
      setLoading(false);
    }
  }

  function applyTemplate(t: (typeof TEMPLATES)[0]) {
    setTitle(t.title);
    setMessage(t.message);
    setPriority(t.priority);
    setError(null);
  }

  function resetForm() {
    setTitle("");
    setMessage("");
    setPriority("MEDIUM");
    setTargetRole("");
    setError(null);
  }

  return (
    <div className="space-y-6">
      <AdminInfoBanner>
        Kirim <strong className="text-brand-800 dark:text-brand-300">pengumuman sistem</strong> ke
        inbox aplikasi mobile & web. Push FCM mengikuti device yang terdaftar.
      </AdminInfoBanner>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {loadingMeta
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
              />
            ))
          : kpiCards.map((k) => (
              <AdminMetricCard key={k.label} label={k.label} value={k.value} />
            ))}
      </div>

      <AdminSegmentTabs
        tabs={[
          { id: "compose", label: "Kirim broadcast", hint: "Form & pratinjau" },
          { id: "history", label: "Riwayat", hint: `${history.length} terakhir` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {error ? <Alert variant="error" title="Gagal" message={error} /> : null}
      {success ? <Alert variant="success" title="Berhasil" message={success} /> : null}

      {tab === "compose" && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <ComponentCard title="Buat pengumuman" desc="Judul, pesan, prioritas, dan audiens">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label>Template cepat</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TEMPLATES.map((t, i) => (
                      <Button
                        key={i}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => applyTemplate(t)}
                      >
                        {t.title}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>
                    Judul <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Pemeliharaan sistem BISA"
                    hint={`Min. 5 karakter · ${title.length}/120`}
                  />
                </div>

                <div>
                  <Label>
                    Pesan <span className="text-error-500">*</span>
                  </Label>
                  <TextArea
                    rows={6}
                    value={message}
                    onChange={setMessage}
                    placeholder="Isi pengumuman yang akan tampil di notifikasi user..."
                    hint={`Min. 10 karakter · ${message.length}/2000`}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Prioritas</Label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                      className={selectClass}
                    >
                      {(Object.keys(PRIORITY_META) as NotificationPriority[]).map((p) => (
                        <option key={p} value={p}>
                          {PRIORITY_META[p].label} ({p})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Target penerima</Label>
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value as UserRole | "")}
                      className={selectClass}
                    >
                      <option value="">Semua pengguna aktif</option>
                      <option value="BUYER">Hanya pembeli</option>
                      <option value="SUPPLIER">Hanya supplier</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <Button type="submit" disabled={loading || !canSubmit}>
                    {loading ? "Mengirim…" : "Kirim broadcast"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Reset form
                  </Button>
                </div>
              </form>
            </ComponentCard>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <ComponentCard title="Pratinjau di aplikasi" desc="Tampilan notifikasi inbox user">
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-theme-xs font-semibold uppercase text-brand-600 dark:text-brand-400">
                    BISA · Sistem
                  </span>
                  <Badge color={PRIORITY_META[priority].badge} size="sm">
                    {PRIORITY_META[priority].label}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                  {title.trim() || "Judul pengumuman"}
                </p>
                <p className="mt-2 line-clamp-6 text-sm text-gray-600 dark:text-gray-400">
                  {message.trim() || "Isi pesan akan tampil di sini…"}
                </p>
                <p className="mt-3 text-theme-xs text-gray-500">
                  Ke: {audienceLabel}
                  {stats && ` · ~${stats.activeUsers.toLocaleString("id-ID")} user aktif`}
                </p>
              </div>
            </ComponentCard>

            {stats && stats.byPriority.length > 0 ? (
              <ComponentCard title="Notifikasi 7 hari" desc="Per prioritas">
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {stats.byPriority.map((p) => (
                    <li
                      key={p.priority}
                      className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        {PRIORITY_META[p.priority as NotificationPriority]?.label ?? p.priority}
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white/90">
                        {p.count.toLocaleString("id-ID")}
                      </span>
                    </li>
                  ))}
                </ul>
              </ComponentCard>
            ) : null}
          </div>
        </div>
      )}

      {tab === "history" && (
        <ComponentCard
          title="Riwayat broadcast"
          desc="Log audit admin — judul, penerima, dan pengirim"
        >
          {loadingMeta ? (
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ) : history.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">Belum ada riwayat broadcast.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Judul
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Prioritas
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Target
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Penerima
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Dikirim
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Oleh
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="max-w-xs px-4 py-3">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {h.title}
                      </p>
                      {h.messagePreview ? (
                        <p className="mt-0.5 line-clamp-2 text-theme-xs text-gray-500">
                          {h.messagePreview}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        color={
                          PRIORITY_META[h.priority as NotificationPriority]?.badge ?? "light"
                        }
                        size="sm"
                      >
                        {PRIORITY_META[h.priority as NotificationPriority]?.label ?? h.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {h.targetRole ? (ROLE_LABELS[h.targetRole] ?? h.targetRole) : "Semua"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold">
                      {h.recipientCount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm whitespace-nowrap text-gray-500">
                      {formatDate(h.sentAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {h.sentBy?.fullName ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ComponentCard>
      )}
    </div>
  );
}
