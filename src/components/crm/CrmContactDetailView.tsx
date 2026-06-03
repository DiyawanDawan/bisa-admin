"use client";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  createCrmNote,
  fetchCrmContactDetail,
  updateCrmContact,
} from "@/lib/api/extended";
import { formatDate, formatIDR } from "@/lib/format";
import type { CrmContactDetail, CrmStage } from "@/types/extended";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const STAGES: CrmStage[] = ["LEAD", "PROSPECT", "ACTIVE", "VIP", "AT_RISK"];
const STAGE_LABELS: Record<CrmStage, string> = {
  LEAD: "Lead",
  PROSPECT: "Prospek",
  ACTIVE: "Aktif",
  VIP: "VIP",
  AT_RISK: "Berisiko",
};

export default function CrmContactDetailView({ userId }: { userId: string }) {
  const [data, setData] = useState<CrmContactDetail | null>(null);
  const [note, setNote] = useState("");
  const [stage, setStage] = useState<CrmStage>("LEAD");
  const [followUp, setFollowUp] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCrmContactDetail(userId);
      setData(res);
      setStage(res.contact.stage as CrmStage);
      setFollowUp(
        res.contact.nextFollowUpAt
          ? new Date(res.contact.nextFollowUpAt).toISOString().slice(0, 10)
          : "",
      );
    } catch {
      setError("Gagal memuat detail kontak.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      await createCrmNote(userId, { content: note.trim(), noteType: "NOTE" });
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan catatan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateMeta() {
    setSaving(true);
    setError(null);
    try {
      await updateCrmContact(userId, {
        stage,
        nextFollowUpAt: followUp ? new Date(followUp).toISOString() : null,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui kontak.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;
  }

  if (error && !data) {
    return (
      <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
        {error}
        <Link href="/crm" className="ml-2 underline">
          Kembali
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const c = data.contact;
  const metrics = c.metrics as {
    completedOrders: number;
    completedGmv: number;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/crm" className="text-sm text-brand-600 hover:underline">
          ← CRM
        </Link>
        <p className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {String(c.fullName)}
        </p>
        <Badge color="primary">{String(c.role)}</Badge>
        <Badge color={c.status === "ACTIVE" ? "success" : "warning"}>
          {String(c.status)}
        </Badge>
        <Badge color="light">{STAGE_LABELS[c.stage as CrmStage] ?? c.stage}</Badge>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <ComponentCard title="Ringkasan" desc="Nilai & aktivitas">
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Email / telepon</dt>
              <dd>
                {String(c.email)} {c.phone ? `· ${String(c.phone)}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">GMV selesai</dt>
              <dd className="font-semibold text-brand-700">
                {formatIDR(metrics.completedGmv)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Order selesai</dt>
              <dd>{metrics.completedOrders}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Stage (otomatis)</dt>
              <dd>{STAGE_LABELS[c.stageComputed as CrmStage] ?? c.stageComputed}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/users/${userId}`} className="text-sm text-brand-600 hover:underline">
              Dossier lengkap
            </Link>
            <Link href={`/chat`} className="text-sm text-brand-600 hover:underline">
              Chat negosiasi
            </Link>
          </div>
        </ComponentCard>

        <ComponentCard title="Pipeline" desc="Stage & follow-up manual">
          <div className="space-y-3">
            <label className="block text-theme-xs text-gray-500">
              Stage CRM
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as CrmStage)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-theme-xs text-gray-500">
              Follow-up berikutnya
              <input
                type="date"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <Button size="sm" disabled={saving} onClick={handleUpdateMeta}>
              Simpan pipeline
            </Button>
          </div>
        </ComponentCard>

        <ComponentCard title="Catatan baru" desc="Tersimpan di audit log CRM">
          <form onSubmit={handleNote} className="space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Catatan call, email, atau kunjungan..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
            <Button type="submit" size="sm" disabled={saving || !note.trim()}>
              Tambah catatan
            </Button>
          </form>
        </ComponentCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ComponentCard title="Order terbaru">
          <ul className="space-y-2 text-sm">
            {data.recentOrders.length === 0 ? (
              <li className="text-gray-500">Belum ada order.</li>
            ) : (
              data.recentOrders.map((o) => (
                <li key={o.id} className="flex justify-between gap-2 border-b border-gray-50 pb-2 dark:border-gray-800">
                  <Link href={`/orders/${o.id}`} className="text-brand-600 hover:underline">
                    {o.orderNumber}
                  </Link>
                  <span>
                    {formatIDR(Number(o.totalAmount))} · {o.status}
                  </span>
                </li>
              ))
            )}
          </ul>
        </ComponentCard>

        <ComponentCard title="Negosiasi terbaru">
          <ul className="space-y-2 text-sm">
            {data.recentNegotiations.length === 0 ? (
              <li className="text-gray-500">Belum ada negosiasi.</li>
            ) : (
              data.recentNegotiations.map((n) => (
                <li key={n.id} className="flex justify-between gap-2 border-b border-gray-50 pb-2 dark:border-gray-800">
                  <Link href={`/chat?room=${n.id}`} className="text-brand-600 hover:underline">
                    {n.product.name}
                  </Link>
                  <span className="text-theme-xs text-gray-500">{n.status}</span>
                </li>
              ))
            )}
          </ul>
        </ComponentCard>
      </div>

      <ComponentCard title="Riwayat catatan & aktivitas CRM">
        <ul className="space-y-3">
          {data.notes.length === 0 ? (
            <li className="text-sm text-gray-500">Belum ada catatan admin.</li>
          ) : (
            data.notes.map((n) => (
              <li
                key={n.id}
                className="rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800"
              >
                <p className="text-theme-xs text-gray-500">
                  {n.authorName} · {formatDate(n.createdAt)} · {n.action}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {n.content}
                </p>
              </li>
            ))
          )}
        </ul>
      </ComponentCard>
    </div>
  );
}
