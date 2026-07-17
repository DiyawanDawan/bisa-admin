"use client";
import Badge from "@/components/ui/badge/Badge";
import ComponentCard from "@/components/common/ComponentCard";
import AdminMediaImage from "@/components/common/AdminMediaImage";
import DisputeMediationChat from "@/components/disputes/DisputeMediationChat";
import ResolveDisputeForm from "@/components/disputes/ResolveDisputeForm";
import { fetchDisputeDetail } from "@/lib/api/admin";
import { resolveMediaUrl } from "@/lib/media-url";
import { formatDate, formatIDR } from "@/lib/format";
import type { DisputeMediationMeta, DisputeOrder } from "@/types/admin";
import Link from "next/link";
import { useEffect, useState } from "react";

function disputeStatusBadge(status?: string) {
  switch (status) {
    case "OPEN":
      return <Badge color="error">Terbuka</Badge>;
    case "UNDER_REVIEW":
      return <Badge color="warning">Mediasi / ditinjau</Badge>;
    case "RESOLVED":
      return <Badge color="success">Selesai</Badge>;
    default:
      return <Badge color="light">{status ?? "—"}</Badge>;
  }
}

export default function DisputeDetailView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<DisputeOrder | null>(null);
  const [mediation, setMediation] = useState<DisputeMediationMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputeDetail(orderId)
      .then((data) => {
        setOrder(data);
        setMediation(data.mediation ?? null);
      })
      .catch(() => setError("Gagal memuat detail sengketa."))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-error-200 bg-error-50 px-5 py-4 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
        {error ?? "Data tidak ditemukan"}
        <Link href="/disputes" className="ml-2 text-brand-600 underline dark:text-brand-400">
          Kembali
        </Link>
      </div>
    );
  }

  const dispute = order.dispute;
  const evidence = (dispute?.evidenceUrls as string[] | undefined) ?? [];
  const sellerEvidence =
    (dispute?.sellerEvidenceUrls as string[] | undefined) ?? [];
  const orderItems = order.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/disputes"
          className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          ← Daftar sengketa
        </Link>
        <p className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {order.orderNumber}
        </p>
        <Badge color={order.status === "DISPUTED" ? "error" : "light"}>
          {order.status}
        </Badge>
        {dispute && disputeStatusBadge(dispute.status)}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComponentCard title="Informasi Order" desc="Ringkasan transaksi">
          <dl className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <dt className="mb-2 text-gray-500">Pembeli</dt>
              <dd className="flex items-center gap-3 font-medium text-gray-800 dark:text-white/90">
                <AdminMediaImage
                  src={order.buyer.avatarUrl}
                  alt={order.buyer.fullName}
                  className="h-11 w-11 shrink-0 rounded-full border border-gray-200 dark:border-gray-700"
                  fallback={
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-light-100 text-sm font-semibold text-blue-light-700 dark:bg-blue-light-500/20 dark:text-blue-light-300">
                      {order.buyer.fullName.charAt(0).toUpperCase()}
                    </span>
                  }
                />
                <div className="min-w-0">
                  <p className="truncate">{order.buyer.fullName}</p>
                  {order.buyer.email ? (
                    <p className="truncate text-theme-xs font-normal text-gray-500">
                      {order.buyer.email}
                    </p>
                  ) : null}
                </div>
              </dd>
            </div>
            <div>
              <dt className="mb-2 text-gray-500">Penjual / Supplier</dt>
              <dd className="flex items-center gap-3 font-medium text-gray-800 dark:text-white/90">
                <AdminMediaImage
                  src={order.seller.avatarUrl}
                  alt={order.seller.fullName}
                  className="h-11 w-11 shrink-0 rounded-full border border-gray-200 dark:border-gray-700"
                  fallback={
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success-100 text-sm font-semibold text-success-700 dark:bg-success-500/20 dark:text-success-300">
                      {order.seller.fullName.charAt(0).toUpperCase()}
                    </span>
                  }
                />
                <div className="min-w-0">
                  <p className="truncate">{order.seller.fullName}</p>
                  {order.seller.email ? (
                    <p className="truncate text-theme-xs font-normal text-gray-500">
                      {order.seller.email}
                    </p>
                  ) : null}
                </div>
              </dd>
            </div>
            <div>
              <dt className="mb-2 text-gray-500">Produk order</dt>
              <dd>
                {orderItems.length === 0 ? (
                  <p className="text-gray-500">Tidak ada item.</p>
                ) : (
                  <ul className="space-y-3">
                    {orderItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-2 dark:border-gray-800"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <AdminMediaImage
                            src={item.product?.thumbnailUrl}
                            alt={item.product?.name ?? "Produk"}
                            className="h-12 w-12 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-800 dark:text-white/90">
                              {item.product?.name ?? "—"}
                            </p>
                            <p className="text-theme-xs text-gray-500">
                              {Number(item.quantity)}
                              {item.product?.unit ? ` ${item.product.unit}` : ""}{" "}
                              × {formatIDR(Number(item.pricePerUnit))}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {formatIDR(Number(item.subtotal))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Total</dt>
              <dd className="font-medium">{formatIDR(Number(order.totalAmount))}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Dibuat</dt>
              <dd>{formatDate(order.createdAt)}</dd>
            </div>
          </dl>
        </ComponentCard>

        <ComponentCard title="Detail Sengketa" desc="Bukti dan alasan">
          {dispute ? (
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Alasan</dt>
                <dd className="font-medium">{dispute.reason}</dd>
              </div>
              {dispute.description && (
                <div>
                  <dt className="text-gray-500">Deskripsi pembeli</dt>
                  <dd>{dispute.description}</dd>
                </div>
              )}
              {dispute.sellerResponse && (
                <div>
                  <dt className="text-gray-500">Respon penjual</dt>
                  <dd>{dispute.sellerResponse}</dd>
                </div>
              )}
              {evidence.length > 0 && (
                <div>
                  <dt className="mb-2 text-gray-500">Bukti pembeli</dt>
                  <dd className="flex flex-wrap gap-3">
                    {evidence.map((url, index) => (
                      <EvidenceThumb key={`${url}-${index}`} url={url} label={`Bukti ${index + 1}`} />
                    ))}
                  </dd>
                </div>
              )}
              {sellerEvidence.length > 0 && (
                <div>
                  <dt className="mb-2 text-gray-500">Bukti penjual</dt>
                  <dd className="flex flex-wrap gap-3">
                    {sellerEvidence.map((url, index) => (
                      <EvidenceThumb
                        key={`${url}-${index}`}
                        url={url}
                        label={`Bukti penjual ${index + 1}`}
                      />
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-gray-500">Data sengketa tidak tersedia.</p>
          )}
        </ComponentCard>
      </div>

      <ComponentCard
        title="Mediasi Chat (Hakim BISA)"
        desc="Diskusikan masalah dengan pembeli dan supplier sebelum putus release/refund"
      >
        {!order.mediation?.mediationStartedAt && (
          <div className="mb-4 rounded-lg border-2 border-warning-300 bg-warning-50 px-4 py-3 dark:border-warning-700 dark:bg-warning-900/20">
            <p className="text-sm font-semibold text-warning-800 dark:text-warning-200 mb-2">
              Mediasi belum dimulai!
            </p>
            <p className="text-sm text-warning-700 dark:text-warning-300 mb-3">
              Anda harus membuka chat group mediasi untuk bernegosiasi dengan pembeli dan penjual sebelum bisa memutuskan sengketa.
            </p>
            <p className="text-sm text-warning-700 dark:text-warning-300 font-medium">
              Klik tombol &quot;Mulai Mediasi&quot; di bawah ini
            </p>
          </div>
        )}
        <DisputeMediationChat
          orderId={order.id}
          orderNumber={order.orderNumber}
          canMediate={order.status === "DISPUTED"}
          initialMediation={order.mediation ?? undefined}
          onMediationChange={setMediation}
        />
      </ComponentCard>

      <ComponentCard
        title="Resolusi Admin"
        desc="Putuskan release dana ke penjual atau refund ke pembeli setelah mediasi selesai"
      >
        <ResolveDisputeForm
          orderId={order.id}
          disabled={order.status !== "DISPUTED"}
          canResolve={mediation?.canResolve ?? false}
        />
      </ComponentCard>
    </div>
  );
}

function EvidenceThumb({ url, label }: { url: string; label: string }) {
  const href = resolveMediaUrl(url) ?? url;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col items-center gap-1"
    >
      <AdminMediaImage
        src={url}
        alt={label}
        className="h-20 w-20 rounded-lg border border-gray-200 transition group-hover:border-brand-400 dark:border-gray-700"
      />
      <span className="text-theme-xs text-brand-600 group-hover:underline dark:text-brand-400">
        {label}
      </span>
    </a>
  );
}
