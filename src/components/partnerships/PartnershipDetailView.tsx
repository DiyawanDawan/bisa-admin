"use client";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import ComponentCard from "@/components/common/ComponentCard";
import {
  fetchPartnershipDetail,
  signPartnershipAsPlatform,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import PartyAvatar from "@/components/common/PartyAvatar";
import type { PartnershipContract, PartnershipStatus } from "@/types/admin";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function statusLabel(status: PartnershipStatus) {
  switch (status) {
    case "PENDING":
      return "Draf / menunggu supplier";
    case "AWAITING_SIGNATURE":
      return "Menunggu tanda tangan";
    case "ACTIVE":
      return "Aktif";
    case "REJECTED":
      return "Ditolak";
    case "TERMINATED":
      return "Diakhiri";
    case "EXPIRED":
      return "Kedaluwarsa";
    case "RENEWAL_PENDING":
      return "Menunggu perpanjangan";
    default:
      return status;
  }
}

export default function PartnershipDetailView({ id }: { id: string }) {
  const [row, setRow] = useState<PartnershipContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPartnershipDetail(id);
      setRow(data);
    } catch {
      setError("Gagal memuat detail kontrak.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const canSignPlatform =
    Boolean(row?.buyerSignedAt && row?.sellerSignedAt && !row?.platformSignedAt) &&
    (row?.status === "PENDING" || row?.status === "AWAITING_SIGNATURE");

  const onSign = async () => {
    if (!row || signing) return;
    setSigning(true);
    setActionMsg(null);
    try {
      const updated = await signPartnershipAsPlatform(row.id, {
        signerName: "BISA Agri",
        signerTitle: "Penengah Platform",
      });
      setRow(updated);
      setActionMsg("Tanda tangan penengah BISA berhasil disimpan.");
    } catch (err) {
      setActionMsg(
        err instanceof ApiError
          ? err.message
          : "Gagal menandatangani sebagai penengah BISA.",
      );
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
    );
  }

  if (error || !row) {
    return (
      <div className="rounded-2xl border border-error-200 bg-error-50 px-5 py-4 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
        {error ?? "Data tidak ditemukan"}
        <Link href="/partnerships" className="ml-2 text-brand-600 underline">
          Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/partnerships"
          className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          ← Daftar kontrak
        </Link>
        <p className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {row.contractNumber}
        </p>
        <Badge color={row.status === "ACTIVE" ? "success" : "warning"} size="sm">
          {statusLabel(row.status)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ComponentCard title="Ringkasan kontrak" desc={row.title}>
          <dl className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <dt className="text-xs text-gray-500">Periode</dt>
              <dd>
                {formatDate(row.startDate)} → {formatDate(row.endDate)}
              </dd>
            </div>
            {row.productCategory && (
              <div>
                <dt className="text-xs text-gray-500">Kategori produk</dt>
                <dd>{row.productCategory}</dd>
              </div>
            )}
            {row.priceAgreement && (
              <div>
                <dt className="text-xs text-gray-500">Kesepakatan harga</dt>
                <dd className="whitespace-pre-wrap">{row.priceAgreement}</dd>
              </div>
            )}
            {row.deliveryTerms && (
              <div>
                <dt className="text-xs text-gray-500">Syarat pengiriman</dt>
                <dd className="whitespace-pre-wrap">{row.deliveryTerms}</dd>
              </div>
            )}
            {row.paymentTerms && (
              <div>
                <dt className="text-xs text-gray-500">Syarat pembayaran</dt>
                <dd className="whitespace-pre-wrap">{row.paymentTerms}</dd>
              </div>
            )}
            {row.description && (
              <div>
                <dt className="text-xs text-gray-500">Deskripsi</dt>
                <dd className="whitespace-pre-wrap">{row.description}</dd>
              </div>
            )}
            {row.rejectionReason && (
              <div>
                <dt className="text-xs text-error-500">Alasan penolakan</dt>
                <dd>{row.rejectionReason}</dd>
              </div>
            )}
          </dl>
        </ComponentCard>

        <ComponentCard
          title="Pihak & tanda tangan"
          desc={`${row.signedCount}/${row.requiredSigners} sudah menandatangani`}
        >
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
              <p className="mb-2 text-xs text-gray-500">Buyer</p>
              <PartyAvatar
                name={row.buyer.companyName || row.buyer.fullName}
                avatarUrl={row.buyer.avatarUrl}
                subtitle={row.buyer.fullName}
                tone="buyer"
                size="md"
              />
              <p className="mt-2 text-xs">
                TTD:{" "}
                {row.buyerSignedAt
                  ? formatDate(row.buyerSignedAt)
                  : "Belum"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
              <p className="mb-2 text-xs text-gray-500">Supplier</p>
              <PartyAvatar
                name={row.supplier.companyName || row.supplier.fullName}
                avatarUrl={row.supplier.avatarUrl}
                subtitle={row.supplier.fullName}
                tone="seller"
                size="md"
              />
              <p className="mt-2 text-xs">
                TTD:{" "}
                {row.sellerSignedAt
                  ? formatDate(row.sellerSignedAt)
                  : "Belum"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
              <p className="text-xs text-gray-500">Penengah BISA</p>
              <p className="font-medium text-gray-800 dark:text-white/90">
                BISA Agri
              </p>
              <p className="mt-1 text-xs">
                TTD:{" "}
                {row.platformSignedAt
                  ? formatDate(row.platformSignedAt)
                  : "Belum"}
              </p>
            </div>

            {canSignPlatform && (
              <div className="rounded-lg border border-warning-300 bg-warning-50 px-4 py-3 dark:border-warning-700 dark:bg-warning-900/20">
                <p className="mb-2 text-sm font-semibold text-warning-800 dark:text-warning-200">
                  Buyer & supplier sudah TTD — menunggu penengah BISA
                </p>
                <Button
                  size="sm"
                  onClick={onSign}
                  disabled={signing}
                >
                  {signing ? "Menandatangani…" : "Tanda tangan sebagai BISA"}
                </Button>
              </div>
            )}

            {actionMsg && (
              <p className="text-sm text-gray-600 dark:text-gray-300">{actionMsg}</p>
            )}
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
