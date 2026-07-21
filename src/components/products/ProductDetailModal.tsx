"use client";

import AdminMediaImage from "@/components/common/AdminMediaImage";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { fetchProductCertificatesByProduct } from "@/lib/api/admin";
import { formatDate, formatIDR, formatNumber } from "@/lib/format";
import type { ProductCertificateItem, ProductDetail } from "@/types/admin";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  isOpen: boolean;
  product: ProductDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
};

function valueLabel(value: unknown, suffix = ""): string {
  if (value === null || value === undefined || value === "") return "—";
  return `${String(value)}${suffix}`;
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-theme-xs text-gray-400">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-gray-800 dark:text-white/90">
        {value}
      </div>
    </div>
  );
}

export default function ProductDetailModal({
  isOpen,
  product,
  loading,
  error,
  onClose,
}: Props) {
  const [certificates, setCertificates] = useState<ProductCertificateItem[]>([]);
  const [certsLoading, setCertsLoading] = useState(false);

  useEffect(() => {
    if (!product?.id || !isOpen) {
      setCertificates([]);
      return;
    }
    setCertsLoading(true);
    fetchProductCertificatesByProduct(product.id)
      .then(setCertificates)
      .catch(() => setCertificates([]))
      .finally(() => setCertsLoading(false));
  }, [product?.id, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-h-[90vh] max-w-5xl overflow-y-auto p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-theme-xs font-medium uppercase tracking-wide text-brand-600">
            Detail produk
          </p>
          <h3 className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
            {product?.name ?? "Memuat produk…"}
          </h3>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>
          Tutup
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      ) : product ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)]">
            <div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(product.images.length > 0
                  ? product.images
                  : [{ id: "thumbnail", url: product.thumbnailUrl ?? "", isPrimary: true, order: 0 }]
                ).map((image) => (
                  <AdminMediaImage
                    key={image.id}
                    src={image.url}
                    alt={product.name}
                    className="aspect-square w-full rounded-xl border border-gray-200 dark:border-gray-800"
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
              <div className="flex flex-wrap gap-2">
                <Badge color={product.status === "ACTIVE" ? "success" : "warning"} size="sm">
                  {product.status}
                </Badge>
                {product.isCertified ? <Badge color="primary">Certified</Badge> : null}
                <Badge color={product.isEscrowProtected ? "success" : "light"} size="sm">
                  Escrow {product.isEscrowProtected ? "aktif" : "nonaktif"}
                </Badge>
              </div>
              <p className="mt-4 text-2xl font-bold text-gray-800 dark:text-white/90">
                {formatIDR(Number(product.pricePerUnit))}
                <span className="ml-1 text-sm font-normal text-gray-400">/ {product.unit}</span>
              </p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <DetailItem label="Stok" value={`${valueLabel(product.stock)} ${product.unit}`} />
                <DetailItem
                  label="Minimum order"
                  value={`${valueLabel(product.minOrder)} ${product.unit}`}
                />
                <DetailItem label="Terjual" value={formatNumber(product.totalSold)} />
                <DetailItem label="Dilihat" value={formatNumber(product.viewCount)} />
                <DetailItem
                  label="Rating"
                  value={`${valueLabel(product.averageRating)} (${product.totalReviews} ulasan)`}
                />
                <DetailItem label="Dibuat" value={formatDate(product.createdAt)} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
              <h4 className="font-semibold text-gray-800 dark:text-white/90">Informasi listing</h4>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <DetailItem label="Kategori" value={product.category?.name ?? "—"} />
                <DetailItem label="Mode produk" value={product.productMode} />
                <DetailItem label="Jenis biomassa" value={product.biomassaType} />
                <DetailItem label="Grade" value={product.grade ?? "—"} />
                <DetailItem
                  label="Lokasi"
                  value={[product.regency, product.province].filter(Boolean).join(", ") || "—"}
                />
                <DetailItem
                  label="Sampel"
                  value={product.allowsSample ? "Tersedia" : "Tidak tersedia"}
                />
              </div>
              <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
                {product.description?.trim() || "Tidak ada deskripsi produk."}
              </p>
            </section>

            <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
              <h4 className="font-semibold text-gray-800 dark:text-white/90">Penjual & aktivitas</h4>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <DetailItem
                  label="Penjual"
                  value={product.user.profile?.companyName || product.user.fullName}
                />
                <DetailItem label="Email" value={product.user.email} />
                <DetailItem label="Telepon" value={product.user.phone ?? "—"} />
                <DetailItem label="Sertifikat" value={product._count.certificates} />
                <DetailItem label="Pertanyaan" value={product._count.questions} />
                <DetailItem label="Item order" value={product._count.orderItems} />
              </div>
            </section>
          </div>

          {product.specs.length > 0 ? (
            <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
              <h4 className="font-semibold text-gray-800 dark:text-white/90">Spesifikasi tambahan</h4>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {product.specs.map((spec) => (
                  <DetailItem key={spec.id} label={spec.label} value={spec.value} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-gray-800 dark:text-white/90">Sertifikat produk</h4>
              <Link href="/products/certificates" className="text-theme-xs text-brand-600 hover:underline">
                Antrean sertifikasi →
              </Link>
            </div>
            {certsLoading ? (
              <p className="mt-4 text-sm text-gray-500">Memuat sertifikat…</p>
            ) : certificates.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">Belum ada sertifikat untuk produk ini.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {certificates.map((cert) => (
                  <Link
                    key={cert.id}
                    href={`/products/certificates/${cert.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 px-4 py-3 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {cert.title}
                      </p>
                      <p className="text-theme-xs text-gray-500">
                        {cert.certificateType} · {cert.certificateNumber ?? "—"}
                      </p>
                    </div>
                    <Badge
                      color={
                        cert.status === "APPROVED"
                          ? "success"
                          : cert.status === "REJECTED"
                            ? "error"
                            : "warning"
                      }
                      size="sm"
                    >
                      {cert.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}
