"use client";
import ComponentCard from "@/components/common/ComponentCard";
import OrdersStatsPanel from "@/components/orders/OrdersStatsPanel";
import PartyAvatar from "@/components/common/PartyAvatar";
import Pagination from "@/components/tables/Pagination";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAdminOrders } from "@/lib/api/extended";
import { formatDate, formatIDR, formatOrderPayment, formatPaymentStatus } from "@/lib/format";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const STATUSES = [
  "",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
] as const;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu bayar",
  CONFIRMED: "Dikonfirmasi",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  DISPUTED: "Sengketa",
};

function orderStatusBadge(status: string): "success" | "warning" | "error" | "light" {
  const s = status.toUpperCase();
  if (s === "COMPLETED") return "success";
  if (s === "DISPUTED") return "error";
  if (s === "CANCELLED") return "light";
  if (["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(s)) return "warning";
  return "light";
}

export default function OrdersList() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchAdminOrders>>["items"]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [courierCode, setCourierCode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, courierCode, deliveryStatus, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminOrders({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: status || undefined,
        courierCode: courierCode || undefined,
        deliveryStatus: deliveryStatus || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat order.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, status, courierCode, deliveryStatus]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      <OrdersStatsPanel
        onStatusClick={(s) => {
          setStatus(s);
          document.getElementById("orders-table")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <div id="orders-table" className="space-y-4 scroll-mt-6">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Daftar order
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-theme-xs text-gray-500">Pencarian</label>
            <input
              placeholder="No. order, pembeli, atau penjual..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full max-w-md rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              {STATUSES.map((s) => (
                <option key={s || "all"} value={s}>
                  {s ? (STATUS_LABELS[s] ?? s) : "Semua status"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-500">Kurir</label>
            <input
              placeholder="JNE/JNT/SICEPAT"
              value={courierCode}
              onChange={(e) => setCourierCode(e.target.value.toUpperCase())}
              className="h-10 w-[150px] rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-500">Status Kirim</label>
            <input
              placeholder="DELIVERED/ON_PROCESS"
              value={deliveryStatus}
              onChange={(e) => setDeliveryStatus(e.target.value.toUpperCase())}
              className="h-10 w-[180px] rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          {!loading && (
            <p className="pb-2 text-theme-xs text-gray-500">
              {total} order{status ? ` · filter ${STATUS_LABELS[status] ?? status}` : ""}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        <ComponentCard title="Daftar order" desc="Navigasi halaman dan atur jumlah baris per halaman">
          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tidak ada order untuk filter ini.</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                      Order
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                      Pembeli → Penjual
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                      Total
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                      Pembayaran
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
                  {items.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="px-4 py-3 text-sm">
                        <Link
                          href={`/orders/${o.id}`}
                          className="font-medium text-brand-600 hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                        {o.dispute && (
                          <span className="mt-0.5 block text-[10px] text-error-600">Ada sengketa</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex flex-col gap-2">
                          <PartyAvatar
                            name={o.buyer?.fullName ?? "—"}
                            avatarUrl={o.buyer?.avatarUrl}
                            subtitle="Pembeli"
                            tone="buyer"
                          />
                          <PartyAvatar
                            name={o.seller?.fullName ?? "—"}
                            avatarUrl={o.seller?.avatarUrl}
                            subtitle="Supplier"
                            tone="seller"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm font-medium">
                        {formatIDR(Number(o.totalAmount))}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        <p className="font-medium leading-snug">
                          {formatOrderPayment(o.transaction)}
                        </p>
                        {o.transaction?.paymentStatus ? (
                          <p className="mt-0.5 text-[10px] text-gray-500">
                            {formatPaymentStatus(o.transaction.paymentStatus)}
                            {o.transaction.paymentChannel?.code
                              ? ` · ${o.transaction.paymentChannel.code}`
                              : ""}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge color={orderStatusBadge(o.status)} size="sm">
                          {STATUS_LABELS[o.status] ?? o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(o.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
            </>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
