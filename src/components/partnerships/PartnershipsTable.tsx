"use client";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchPartnerships } from "@/lib/api/admin";
import { formatDate } from "@/lib/format";
import PartyAvatar from "@/components/common/PartyAvatar";
import Pagination from "@/components/tables/Pagination";
import type {
  PartnershipContract,
  PartnershipListFilter,
  PartnershipStatus,
} from "@/types/admin";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function statusBadge(status: PartnershipStatus) {
  switch (status) {
    case "PENDING":
      return (
        <Badge color="warning" size="sm">
          Draf / menunggu supplier
        </Badge>
      );
    case "AWAITING_SIGNATURE":
      return (
        <Badge color="info" size="sm">
          Menunggu TTD
        </Badge>
      );
    case "ACTIVE":
      return (
        <Badge color="success" size="sm">
          Aktif
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge color="error" size="sm">
          Ditolak
        </Badge>
      );
    case "TERMINATED":
      return (
        <Badge color="error" size="sm">
          Diakhiri
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge color="light" size="sm">
          Kedaluwarsa
        </Badge>
      );
    case "RENEWAL_PENDING":
      return (
        <Badge color="warning" size="sm">
          Perpanjangan
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

function partyName(p: PartnershipContract["buyer"]) {
  return p.companyName?.trim() || p.fullName;
}

export default function PartnershipsTable() {
  const [items, setItems] = useState<PartnershipContract[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PartnershipListFilter>("needs_action");
  const [status, setStatus] = useState<PartnershipStatus | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, filter, status, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPartnerships({
        page,
        limit,
        search: search.trim() || undefined,
        filter: status ? "all" : filter,
        status: status || undefined,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setError("Gagal memuat daftar kontrak kerjasama.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filter, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            Kontrak kerjasama mitra
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Termasuk draf, menunggu TTD buyer/supplier/BISA
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row">
          <select
            value={filter}
            disabled={Boolean(status)}
            onChange={(e) => {
              setPage(1);
              setFilter(e.target.value as PartnershipListFilter);
            }}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="needs_action">Perlu tindakan</option>
            <option value="draft_pending">Draf / pending</option>
            <option value="needs_platform_sign">Menunggu TTD BISA</option>
            <option value="all">Semua status</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as PartnershipStatus | "");
            }}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Filter status…</option>
            <option value="PENDING">PENDING</option>
            <option value="AWAITING_SIGNATURE">AWAITING_SIGNATURE</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="REJECTED">REJECTED</option>
            <option value="TERMINATED">TERMINATED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="RENEWAL_PENDING">RENEWAL_PENDING</option>
          </select>
          <input
            type="search"
            placeholder="Cari nomor / judul / nama…"
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
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Kontrak
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Pihak
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Tanda tangan
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Periode
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Aksi
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell className="px-5 py-8 text-sm text-gray-500" colSpan={6}>
                  Memuat…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-8 text-sm text-gray-500" colSpan={6}>
                  Tidak ada kontrak pada filter ini.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id} className="border-b border-gray-50 dark:border-gray-800/60">
                  <TableCell className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {row.contractNumber}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{row.title}</p>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex flex-col gap-2">
                      <PartyAvatar
                        name={partyName(row.buyer)}
                        avatarUrl={row.buyer.avatarUrl}
                        subtitle={`Buyer · ${row.buyer.fullName}`}
                        tone="buyer"
                      />
                      <PartyAvatar
                        name={partyName(row.supplier)}
                        avatarUrl={row.supplier.avatarUrl}
                        subtitle={`Supplier · ${row.supplier.fullName}`}
                        tone="seller"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">{statusBadge(row.status)}</TableCell>
                  <TableCell className="px-5 py-4 text-sm">
                    <p className="font-medium text-gray-800 dark:text-white/90">
                      {row.signatureLabel ?? `${row.signedCount}/${row.requiredSigners}`}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      B:{row.signers?.buyer ? "✓" : "—"} · S:
                      {row.signers?.supplier ? "✓" : "—"} · BISA:
                      {row.signers?.platform ? "✓" : "—"}
                    </p>
                    {row.needsPlatformSign && (
                      <p className="mt-1 text-xs font-medium text-warning-600 dark:text-warning-400">
                        Perlu TTD BISA
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-xs text-gray-600 dark:text-gray-400">
                    {formatDate(row.startDate)} → {formatDate(row.endDate)}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Link
                      href={`/partnerships/${row.id}`}
                      className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                    >
                      Detail
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        limitOptions={[10, 15, 20, 50]}
      />
    </div>
  );
}
