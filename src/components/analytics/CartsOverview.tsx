"use client";
import AdminMetricCard from "@/components/common/AdminMetricCard";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchCartOverview } from "@/lib/api/extended";
import { formatDate, formatIDR } from "@/lib/format";
import { useCallback, useEffect, useState } from "react";

export default function CartsOverview() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchCartOverview>> | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchCartOverview({ page: 1, limit: 50, search: search || undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat keranjang.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <Label>Cari</Label>
        <Input
          placeholder="Cari pembeli / produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error ? <Alert variant="error" title="Keranjang" message={error} /> : null}

      {data?.stats ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <AdminMetricCard
            label="Baris keranjang"
            value={String(data.stats.totalLineItems)}
          />
          <AdminMetricCard
            label="Pembeli unik"
            value={String(data.stats.uniqueBuyers)}
          />
        </div>
      ) : null}

      <ComponentCard title="Isi keranjang platform">
        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                  Pembeli
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                  Produk
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                  Qty
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                  Diperbarui
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-4 py-3 text-sm">
                    {row.user.fullName}
                    <span className="block text-theme-xs text-gray-400">{row.user.email}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    {row.product.name}
                    <span className="block text-theme-xs text-gray-400">
                      {formatIDR(Number(row.product.pricePerUnit))}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">{Number(row.quantity)}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(row.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ComponentCard>
    </div>
  );
}
