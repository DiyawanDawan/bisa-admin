"use client";

import Pagination from "@/components/tables/Pagination";
import { fetchProductCertificates } from "@/lib/api/admin";
import type {
  ProductCertificateItem,
  ProductCertificateStatus,
} from "@/types/admin";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const statuses: Array<{ value: "" | ProductCertificateStatus; label: string }> = [
  { value: "", label: "Semua status" },
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
];

export default function ProductCertificateQueue() {
  const [items, setItems] = useState<ProductCertificateItem[]>([]);
  const [status, setStatus] = useState<"" | ProductCertificateStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProductCertificates({
        page,
        limit,
        search: search.trim() || undefined,
        status: status || undefined,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat sertifikat.");
    } finally {
      setLoading(false);
    }
  }, [limit, page, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-5 dark:border-gray-800 md:flex-row">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Cari produk, nomor, atau judul sertifikat"
          className="h-11 flex-1 rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as "" | ProductCertificateStatus);
            setPage(1);
          }}
          className="h-11 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="p-5 text-sm text-error-500">{error}</p> : null}
      {loading ? (
        <p className="p-8 text-center text-sm text-gray-500">Memuat antrean...</p>
      ) : items.length === 0 ? (
        <p className="p-8 text-center text-sm text-gray-500">Tidak ada sertifikat.</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/products/certificates/${item.id}`}
              className="grid gap-2 p-5 transition hover:bg-gray-50 dark:hover:bg-white/[0.03] md:grid-cols-[1.4fr_1fr_auto]"
            >
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">{item.title}</p>
                <p className="text-sm text-gray-500">
                  {item.certificateType} · {item.product.name}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                <p>{item.product.user.fullName}</p>
                <p>{item.issuerName || "Penerbit belum diisi"}</p>
              </div>
              <span className="self-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {item.status}
              </span>
            </Link>
          ))}
        </div>
      )}
      <Pagination
        page={page}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(value) => {
          setLimit(value);
          setPage(1);
        }}
      />
    </div>
  );
}
