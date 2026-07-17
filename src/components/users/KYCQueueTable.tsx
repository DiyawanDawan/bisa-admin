"use client";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import ComponentCard from "@/components/common/ComponentCard";
import AdminMediaImage from "@/components/common/AdminMediaImage";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchKYCQueue, reviewKYC } from "@/lib/api/admin";
import { resolveMediaUrl } from "@/lib/media-url";
import { formatDate } from "@/lib/format";
import type { KYCQueueItem } from "@/types/admin";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function DocLink({ href, label }: { href?: string | null; label: string }) {
  if (!href) return null;
  const url = resolveMediaUrl(href) ?? href;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col items-center gap-1"
    >
      <AdminMediaImage
        src={href}
        alt={label}
        className="h-14 w-12 rounded border border-gray-200 transition group-hover:border-brand-400 dark:border-gray-700"
      />
      <span className="text-theme-xs text-brand-600 group-hover:underline dark:text-brand-400">
        {label}
      </span>
    </a>
  );
}

export default function KYCQueueTable() {
  const [items, setItems] = useState<KYCQueueItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchKYCQueue({ page, limit: 10, status: "PENDING" });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setError("Gagal memuat antrean KYC.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReview(
    userId: string,
    status: "VERIFIED" | "REJECTED",
  ) {
    let rejectionReason: string | undefined;
    if (status === "REJECTED") {
      rejectionReason = prompt("Alasan penolakan (opsional):") ?? undefined;
    }
    setActionId(userId);
    try {
      await reviewKYC(userId, status, rejectionReason);
      await load();
    } catch {
      alert("Gagal memproses verifikasi.");
    } finally {
      setActionId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 10));

  return (
    <ComponentCard title="Antrean KYC" desc="Verifikasi identitas pengguna">
      {error && (
        <p className="mb-4 text-sm text-error-600">
          {error}
          <button type="button" onClick={load} className="ml-2 underline">
            Coba lagi
          </button>
        </p>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                Pengguna
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                Dokumen
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
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell className="px-4 py-8 text-center text-sm text-gray-500">
                  Antrean KYC kosong.
                </TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
              </TableRow>
            )}
            {!loading &&
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-3 text-sm">
                    <div className="font-medium">{item.user.fullName}</div>
                    <div className="text-theme-xs text-gray-400">{item.user.email}</div>
                    <Link
                      href={`/users/${item.userId}`}
                      className="text-theme-xs text-brand-600 hover:underline dark:text-brand-400"
                    >
                      Lihat dossier →
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <DocLink href={item.ktpUrl} label="KTP" />
                      <DocLink href={item.selfieUrl} label="Selfie" />
                      <DocLink href={item.nibUrl} label="NIB" />
                      <DocLink href={item.siupUrl} label="SIUP" />
                      {!item.ktpUrl && !item.selfieUrl && !item.nibUrl && !item.siupUrl ? (
                        <span className="text-theme-xs text-gray-400">Tanpa URL</span>
                      ) : null}
                    </div>
                    {item.businessName ? (
                      <p className="mt-1 text-theme-xs text-gray-500">{item.businessName}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge color="warning" size="sm">
                      {item.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-end">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={actionId === item.userId}
                        onClick={() => handleReview(item.userId, "VERIFIED")}
                      >
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionId === item.userId}
                        onClick={() => handleReview(item.userId, "REJECTED")}
                      >
                        Tolak
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Berikutnya
          </button>
        </div>
      )}
    </ComponentCard>
  );
}
