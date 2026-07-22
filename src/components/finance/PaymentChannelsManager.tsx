"use client";

import AdminInfoBanner from "@/components/common/AdminInfoBanner";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createPaymentChannelAdmin,
  createPayoutBankAdmin,
  deletePaymentChannelAdmin,
  deletePayoutBankAdmin,
  fetchPaymentChannelsAdmin,
  fetchPayoutBanksAdmin,
  updatePaymentChannelAdmin,
  updatePayoutBankAdmin,
} from "@/lib/api/admin";
import { formatIDR } from "@/lib/format";
import type { PaymentChannelAdminItem, PayoutBankAdminItem } from "@/types/admin";
import { useCallback, useEffect, useState } from "react";

const PAYMENT_GROUPS = [
  { value: "", label: "Tanpa grup" },
  { value: "BANK_TRANSFER", label: "Transfer / VA" },
  { value: "E_WALLET", label: "E-Wallet" },
  { value: "QRIS", label: "QRIS" },
  { value: "CREDIT_CARD", label: "Kartu kredit" },
  { value: "CASH", label: "Tunai" },
] as const;

type BankForm = {
  name: string;
  code: string;
  channelType: string;
  minAmount: string;
  maxAmount: string;
  isActive: boolean;
};

type ChannelForm = {
  name: string;
  code: string;
  group: string;
  minAmount: string;
  maxAmount: string;
  isActive: boolean;
};

const emptyBank: BankForm = {
  name: "",
  code: "",
  channelType: "Bank",
  minAmount: "",
  maxAmount: "",
  isActive: true,
};

const emptyChannel: ChannelForm = {
  name: "",
  code: "",
  group: "BANK_TRANSFER",
  minAmount: "",
  maxAmount: "",
  isActive: true,
};

function parseOptionalNumber(v: string): number | undefined {
  const t = v.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export default function PaymentChannelsManager() {
  const [banks, setBanks] = useState<PayoutBankAdminItem[]>([]);
  const [channels, setChannels] = useState<PaymentChannelAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [bankForm, setBankForm] = useState<BankForm>(emptyBank);
  const [channelForm, setChannelForm] = useState<ChannelForm>(emptyChannel);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = search.trim() || undefined;
      const [bankRes, channelRes] = await Promise.all([
        fetchPayoutBanksAdmin({ search: q }),
        fetchPaymentChannelsAdmin({ search: q }),
      ]);
      setBanks(bankRes);
      setChannels(channelRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat bank & channel.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  function startEditBank(b: PayoutBankAdminItem) {
    setEditingBankId(b.id);
    setBankForm({
      name: b.name,
      code: b.code,
      channelType: b.channelType ?? "Bank",
      minAmount: b.minAmount != null ? String(b.minAmount) : "",
      maxAmount: b.maxAmount != null ? String(b.maxAmount) : "",
      isActive: b.isActive,
    });
  }

  function startEditChannel(c: PaymentChannelAdminItem) {
    setEditingChannelId(c.id);
    setChannelForm({
      name: c.name,
      code: c.code,
      group: c.group ?? "",
      minAmount: c.minAmount != null ? String(c.minAmount) : "",
      maxAmount: c.maxAmount != null ? String(c.maxAmount) : "",
      isActive: c.isActive,
    });
  }

  async function submitBank(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: bankForm.name.trim(),
        code: bankForm.code.trim(),
        channelType: bankForm.channelType.trim() || undefined,
        minAmount: parseOptionalNumber(bankForm.minAmount),
        maxAmount: parseOptionalNumber(bankForm.maxAmount),
        isActive: bankForm.isActive,
      };
      if (editingBankId) {
        await updatePayoutBankAdmin(editingBankId, payload);
      } else {
        await createPayoutBankAdmin(payload);
      }
      setBankForm(emptyBank);
      setEditingBankId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan bank.");
    } finally {
      setSaving(false);
    }
  }

  async function submitChannel(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: channelForm.name.trim(),
        code: channelForm.code.trim(),
        group: channelForm.group || undefined,
        minAmount: parseOptionalNumber(channelForm.minAmount),
        maxAmount: parseOptionalNumber(channelForm.maxAmount),
        isActive: channelForm.isActive,
      };
      if (editingChannelId) {
        await updatePaymentChannelAdmin(editingChannelId, {
          ...payload,
          group: channelForm.group || null,
        });
      } else {
        await createPaymentChannelAdmin(payload);
      }
      setChannelForm(emptyChannel);
      setEditingChannelId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan channel.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleBank(b: PayoutBankAdminItem) {
    setActionId(b.id);
    setError(null);
    try {
      await updatePayoutBankAdmin(b.id, { isActive: !b.isActive });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status bank.");
    } finally {
      setActionId(null);
    }
  }

  async function toggleChannel(c: PaymentChannelAdminItem) {
    setActionId(c.id);
    setError(null);
    try {
      await updatePaymentChannelAdmin(c.id, { isActive: !c.isActive });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status channel.");
    } finally {
      setActionId(null);
    }
  }

  async function removeBank(b: PayoutBankAdminItem) {
    if (!b.canDelete) {
      setError(
        "Bank ini sudah dipakai rekening/payout. Nonaktifkan saja — jangan dihapus.",
      );
      return;
    }
    if (!window.confirm(`Hapus bank ${b.name}? Hanya boleh jika belum pernah dipakai.`)) {
      return;
    }
    setActionId(b.id);
    setError(null);
    try {
      await deletePayoutBankAdmin(b.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus bank.");
    } finally {
      setActionId(null);
    }
  }

  async function removeChannel(c: PaymentChannelAdminItem) {
    if (!c.canDelete) {
      setError(
        "Channel ini sudah dipakai transaksi. Nonaktifkan saja — jangan dihapus.",
      );
      return;
    }
    if (!window.confirm(`Hapus channel ${c.name}?`)) return;
    setActionId(c.id);
    setError(null);
    try {
      await deletePaymentChannelAdmin(c.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus channel.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminInfoBanner>
        Atur channel bayar (checkout) dan bank payout (penarikan). Toggle{" "}
        <strong>Tersedia / Nonaktif</strong> untuk menampilkan atau menyembunyikan. Bank
        yang sudah dipakai rekening payout <strong>tidak bisa dihapus</strong> — nonaktifkan
        saja.
      </AdminInfoBanner>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama / kode…"
          className="h-10 min-w-[220px] flex-1 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <Button size="sm" variant="outline" onClick={() => load()} disabled={loading}>
          Muat ulang
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <ComponentCard
          title="Bank payout"
          desc="Bank untuk rekening penarikan supplier"
        >
          <form onSubmit={submitBank} className="mb-4 space-y-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
            <p className="text-theme-xs font-medium text-gray-500">
              {editingBankId ? "Edit bank" : "Tambah bank"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                required
                value={bankForm.name}
                onChange={(e) => setBankForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nama (Bank Mandiri)"
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <input
                required
                value={bankForm.code}
                onChange={(e) => setBankForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="Kode Xendit (ID_MANDIRI)"
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <input
                value={bankForm.channelType}
                onChange={(e) => setBankForm((f) => ({ ...f, channelType: e.target.value }))}
                placeholder="Tipe (Bank / E-Wallet)"
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={bankForm.isActive}
                  onChange={(e) => setBankForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Tersedia
              </label>
              <input
                value={bankForm.minAmount}
                onChange={(e) => setBankForm((f) => ({ ...f, minAmount: e.target.value }))}
                placeholder="Min penarikan"
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <input
                value={bankForm.maxAmount}
                onChange={(e) => setBankForm((f) => ({ ...f, maxAmount: e.target.value }))}
                placeholder="Max penarikan"
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Menyimpan…" : editingBankId ? "Perbarui" : "Tambah"}
              </Button>
              {editingBankId && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingBankId(null);
                    setBankForm(emptyBank);
                  }}
                >
                  Batal
                </Button>
              )}
            </div>
          </form>

          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ) : banks.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">Belum ada bank.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="px-3 py-2 text-theme-xs text-gray-500">
                      Bank
                    </TableCell>
                    <TableCell isHeader className="px-3 py-2 text-theme-xs text-gray-500">
                      Pemakaian
                    </TableCell>
                    <TableCell isHeader className="px-3 py-2 text-end text-theme-xs text-gray-500">
                      Aksi
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banks.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="px-3 py-2">
                        <p className="text-sm font-medium">{b.name}</p>
                        <p className="text-theme-xs text-gray-400">
                          {b.code}
                          {b.channelType ? ` · ${b.channelType}` : ""}
                        </p>
                        <Badge color={b.isActive ? "success" : "light"} size="sm">
                          {b.isActive ? "Tersedia" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-theme-xs text-gray-600">
                        <p>{b.usage.accountCount} rekening</p>
                        <p>
                          {b.usage.payoutCount} payout · {formatIDR(b.usage.payoutVolume)}
                        </p>
                        {b.usage.pendingPayoutCount > 0 && (
                          <p className="text-warning-600">
                            {b.usage.pendingPayoutCount} pending
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionId === b.id}
                            onClick={() => toggleBank(b)}
                          >
                            {b.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => startEditBank(b)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionId === b.id || !b.canDelete}
                            title={
                              b.canDelete
                                ? "Hapus bank"
                                : "Tidak bisa dihapus — sudah dipakai"
                            }
                            onClick={() => removeBank(b)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ComponentCard>

        <ComponentCard
          title="Channel pembayaran"
          desc="Metode bayar di checkout (VA, e-wallet, QRIS)"
        >
          <form
            onSubmit={submitChannel}
            className="mb-4 space-y-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800"
          >
            <p className="text-theme-xs font-medium text-gray-500">
              {editingChannelId ? "Edit channel" : "Tambah channel"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                required
                value={channelForm.name}
                onChange={(e) => setChannelForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nama (Mandiri VA)"
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <input
                required
                value={channelForm.code}
                onChange={(e) => setChannelForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="Kode (MANDIRI)"
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <select
                value={channelForm.group}
                onChange={(e) => setChannelForm((f) => ({ ...f, group: e.target.value }))}
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                {PAYMENT_GROUPS.map((g) => (
                  <option key={g.value || "none"} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={channelForm.isActive}
                  onChange={(e) =>
                    setChannelForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                Tersedia
              </label>
              <input
                value={channelForm.minAmount}
                onChange={(e) =>
                  setChannelForm((f) => ({ ...f, minAmount: e.target.value }))
                }
                placeholder="Min bayar"
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <input
                value={channelForm.maxAmount}
                onChange={(e) =>
                  setChannelForm((f) => ({ ...f, maxAmount: e.target.value }))
                }
                placeholder="Max bayar"
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Menyimpan…" : editingChannelId ? "Perbarui" : "Tambah"}
              </Button>
              {editingChannelId && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingChannelId(null);
                    setChannelForm(emptyChannel);
                  }}
                >
                  Batal
                </Button>
              )}
            </div>
          </form>

          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ) : channels.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">Belum ada channel.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="px-3 py-2 text-theme-xs text-gray-500">
                      Channel
                    </TableCell>
                    <TableCell isHeader className="px-3 py-2 text-theme-xs text-gray-500">
                      Pemakaian
                    </TableCell>
                    <TableCell isHeader className="px-3 py-2 text-end text-theme-xs text-gray-500">
                      Aksi
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="px-3 py-2">
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-theme-xs text-gray-400">
                          {c.code}
                          {c.group ? ` · ${c.group}` : ""}
                        </p>
                        <Badge color={c.isActive ? "success" : "light"} size="sm">
                          {c.isActive ? "Tersedia" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-theme-xs text-gray-600">
                        <p>{c.usage.transactionCount} transaksi</p>
                        <p>Volume sukses: {formatIDR(c.usage.paidVolume)}</p>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionId === c.id}
                            onClick={() => toggleChannel(c)}
                          >
                            {c.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditChannel(c)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionId === c.id || !c.canDelete}
                            title={
                              c.canDelete
                                ? "Hapus channel"
                                : "Tidak bisa dihapus — sudah dipakai"
                            }
                            onClick={() => removeChannel(c)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
