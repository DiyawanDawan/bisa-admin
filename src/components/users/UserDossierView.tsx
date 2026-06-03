"use client";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import { fetchUserDossier } from "@/lib/api/admin";
import { formatDate, formatIDR } from "@/lib/format";
import type { UserDossier } from "@/types/admin";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function UserDossierView({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserDossier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDossier(userId)
      .then(setUser)
      .catch(() => setError("Gagal memuat dossier user."))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;
  }

  if (error || !user) {
    return (
      <div className="rounded-2xl border border-error-200 bg-error-50 px-5 py-4 text-sm text-error-700">
        {error ?? "User tidak ditemukan"}
        <Link href="/users" className="ml-2 underline">
          Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/users" className="text-sm text-brand-600 hover:underline">
          ← Daftar pengguna
        </Link>
        <p className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {user.fullName}
        </p>
        <Badge color="primary">{user.role}</Badge>
        <Badge color={user.status === "ACTIVE" ? "success" : "error"}>
          {user.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComponentCard title="Profil" desc="Informasi akun">
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Tier</dt>
              <dd>{user.tier ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Bergabung</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Verifikasi email / telepon</dt>
              <dd>
                {user.isEmailVerified ? "Email ✓" : "Email ✗"} /{" "}
                {user.isPhoneVerified ? "Telepon ✓" : "Telepon ✗"}
              </dd>
            </div>
          </dl>
        </ComponentCard>

        <ComponentCard title="Aktivitas" desc="Ringkasan transaksi">
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Order sebagai pembeli</dt>
              <dd>{user._count?.ordersAsBuyer ?? 0}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Order sebagai penjual</dt>
              <dd>{user._count?.ordersAsSeller ?? 0}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Produk</dt>
              <dd>{user._count?.products ?? 0}</dd>
            </div>
          </dl>
        </ComponentCard>

        <ComponentCard title="Dompet & payout" desc="Saldo dan rekening penarikan">
          {user.wallet ? (
            <dl className="mb-4 space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Saldo tersedia</dt>
                <dd className="font-medium">
                  {formatIDR(Number(user.wallet.balance ?? 0))}
                </dd>
              </div>
              {user.wallet.totalEarned != null && (
                <div>
                  <dt className="text-gray-500">Total pendapatan</dt>
                  <dd>{formatIDR(Number(user.wallet.totalEarned))}</dd>
                </div>
              )}
              {user.wallet.totalWithdrawn != null && (
                <div>
                  <dt className="text-gray-500">Total ditarik</dt>
                  <dd>{formatIDR(Number(user.wallet.totalWithdrawn))}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mb-4 text-sm text-gray-500">Belum ada dompet.</p>
          )}
          {user.payoutAccounts && user.payoutAccounts.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {user.payoutAccounts.map((acc) => (
                <li
                  key={acc.id}
                  className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800"
                >
                  <p className="font-medium">
                    {acc.bank?.name ?? "Bank"} — {acc.accountHolderName}
                    {acc.isMain ? (
                      <span className="ml-2 text-xs text-brand-600">Utama</span>
                    ) : null}
                  </p>
                  <p className="text-gray-500">{acc.accountNumber}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Belum ada rekening payout.</p>
          )}
          <p className="mt-3 text-theme-xs text-gray-400">
            Antrean penarikan platform: menu Keuangan → tab Penarikan.
          </p>
        </ComponentCard>

        {user.recentOrders && user.recentOrders.length > 0 && (
          <ComponentCard title="Order terbaru" className="lg:col-span-2">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {user.recentOrders.map((o) => (
                <li key={o.id} className="flex justify-between py-2 text-sm">
                  <span>{o.orderNumber}</span>
                  <span className="text-gray-500">{o.status}</span>
                  <span>{formatIDR(Number(o.totalAmount))}</span>
                </li>
              ))}
            </ul>
          </ComponentCard>
        )}
      </div>
    </div>
  );
}
