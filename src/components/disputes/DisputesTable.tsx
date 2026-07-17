"use client";
import Badge from "@/components/ui/badge/Badge";
import AdminMediaImage from "@/components/common/AdminMediaImage";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchDisputes } from "@/lib/api/admin";
import { formatDate, formatIDR } from "@/lib/format";
import type { DisputeOrder } from "@/types/admin";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function statusBadge(status: string) {
  switch (status) {
    case "DISPUTED":
      return (
        <Badge color="error" size="sm">
          Sengketa
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge color="success" size="sm">
          Selesai
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge color="warning" size="sm">
          Dibatalkan
        </Badge>
      );
    default:
      return (
        <Badge color="light" size="sm">
          {status}
        </Badge>
      );
  }
}

function primaryProduct(order: DisputeOrder) {
  return order.items?.[0]?.product ?? null;
}

export default function DisputesTable() {
  const [items, setItems] = useState<DisputeOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("DISPUTED");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDisputes({
        page,
        limit: 10,
        search: search.trim() || undefined,
        statusFilter: statusFilter || undefined,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setError("Gagal memuat daftar sengketa.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / 10));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
          Daftar Sengketa
        </h3>
        <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row">
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="DISPUTED">Sengketa aktif</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
          <input
            type="search"
            placeholder="Cari order / nama..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 text-sm text-error-600 dark:text-error-400">
          {error}
          <button
            type="button"
            onClick={load}
            className="ml-2 text-brand-600 underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Order
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Produk
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Pembeli / Penjual
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Nilai
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Status
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Diperbarui
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Aksi
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j} className="px-5 py-4">
                      <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell
                  className="px-5 py-10 text-center text-sm text-gray-500"
                  colSpan={7}
                >
                  Tidak ada sengketa.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              items.map((order) => {
                const product = primaryProduct(order);
                return (
                  <TableRow key={order.id}>
                    <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex max-w-[220px] items-center gap-3">
                        <AdminMediaImage
                          src={product?.thumbnailUrl}
                          alt={product?.name ?? "Produk"}
                          className="h-11 w-11 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <span className="line-clamp-2 text-sm font-medium text-gray-800 dark:text-white/90">
                          {product?.name ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <AdminMediaImage
                            src={order.buyer.avatarUrl}
                            alt={order.buyer.fullName}
                            className="h-8 w-8 shrink-0 rounded-full border border-gray-200 dark:border-gray-700"
                            fallback={
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-light-100 text-theme-xs font-semibold text-blue-light-700 dark:bg-blue-light-500/20 dark:text-blue-light-300">
                                {order.buyer.fullName.charAt(0).toUpperCase()}
                              </span>
                            }
                          />
                          <span className="min-w-0 truncate">{order.buyer.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AdminMediaImage
                            src={order.seller.avatarUrl}
                            alt={order.seller.fullName}
                            className="h-8 w-8 shrink-0 rounded-full border border-gray-200 dark:border-gray-700"
                            fallback={
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-100 text-theme-xs font-semibold text-success-700 dark:bg-success-500/20 dark:text-success-300">
                                {order.seller.fullName.charAt(0).toUpperCase()}
                              </span>
                            }
                          />
                          <span className="min-w-0 truncate text-theme-xs text-gray-400">
                            {order.seller.fullName}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {formatIDR(Number(order.totalAmount))}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-1">
                          {statusBadge(order.status)}
                          {order.mediation?.mediationStartedAt ? (
                            <Badge color="warning" size="sm">
                              Mediasi
                            </Badge>
                          ) : null}
                          {order.mediation?.readyToResolveAt ? (
                            <Badge color="success" size="sm">
                              Siap putus
                            </Badge>
                          ) : null}
                        </div>
                        {order.mediation?.mediationStartedAt ? (
                          <span className="text-theme-xs text-gray-400">
                            {order.mediation.adminMessageCount} pesan admin
                            {order.mediation.canResolve ? " · siap putus" : ""}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500">
                      {formatDate(order.updatedAt)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-end">
                      <Link
                        href={`/disputes/${order.id}`}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        Detail
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-800 sm:px-6">
          <span className="text-sm text-gray-500">
            Halaman {page} dari {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-700"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-700"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
