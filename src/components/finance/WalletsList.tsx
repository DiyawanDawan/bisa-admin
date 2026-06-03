"use client";
import AdminMetricCard from "@/components/common/AdminMetricCard";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAdminWallets } from "@/lib/api/extended";
import { formatIDR } from "@/lib/format";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  /** Sembunyikan judul kartu saat dipakai di tab Keuangan */
  embedded?: boolean;
};

export default function WalletsList({ embedded = false }: Props) {
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchAdminWallets>>["items"]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminWallets({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
      });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dompet.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    let balance = 0;
    let earned = 0;
    for (const w of items) {
      balance += Number(w.balance) || 0;
      earned += Number(w.totalEarned) || 0;
    }
    return { balance, earned, count: items.length };
  }, [items]);

  const table = (
    <>
      <div className="mb-4 max-w-md">
        <Label>Cari supplier</Label>
        <Input
          placeholder="Nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!loading && items.length > 0 && (
        <p className="mb-4 text-theme-xs text-gray-500 dark:text-gray-400">
          Menampilkan {items.length} dompet
          {debouncedSearch ? ` untuk “${debouncedSearch}”` : ""}
        </p>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <AdminMetricCard
          label="Total saldo (halaman)"
          value={loading ? "—" : formatIDR(totals.balance)}
          desc="Agregat baris saat ini"
        />
        <AdminMetricCard
          label="Total earned (halaman)"
          value={loading ? "—" : formatIDR(totals.earned)}
          desc="Pendapatan kumulatif"
        />
        <AdminMetricCard
          label="Jumlah dompet"
          value={loading ? "—" : String(totals.count)}
          desc="Hasil filter aktif"
        />
      </div>

      {error ? (
        <div className="mb-4 flex flex-wrap items-start gap-3">
          <Alert variant="error" title="Gagal memuat" message={error} />
          <Button size="sm" variant="outline" onClick={load}>
            Coba lagi
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">
          {debouncedSearch
            ? "Tidak ada dompet untuk kata kunci tersebut."
            : "Belum ada data dompet."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                Supplier
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                Saldo tersedia
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                Total pendapatan
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                Status
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((w) => {
              const bal = Number(w.balance) || 0;
              return (
                <TableRow key={w.id}>
                  <TableCell className="px-4 py-3 text-sm">
                    <Link
                      href={`/users/${w.user.id}`}
                      className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {w.user.fullName}
                    </Link>
                    <span className="block text-theme-xs text-gray-400">{w.user.email}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-semibold text-brand-700 dark:text-brand-400">
                    {formatIDR(bal)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    {formatIDR(Number(w.totalEarned))}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge color={bal > 0 ? "success" : "light"} size="sm">
                      {bal > 0 ? "Ada saldo" : "Kosong"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );

  if (embedded) {
    return <div>{table}</div>;
  }

  return (
    <ComponentCard title="Dompet pengguna" desc="Saldo dan pendapatan kumulatif supplier">
      {table}
    </ComponentCard>
  );
}
