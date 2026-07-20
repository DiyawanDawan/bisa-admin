"use client";
import AdminInfoBanner from "@/components/common/AdminInfoBanner";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { resolveMediaUrl } from "@/lib/media-url";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  certifyProduct,
  fetchProducts,
  moderateProduct,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api-client";
import { formatDate, formatIDR } from "@/lib/format";
import type { ProductListItem, ProductStatus } from "@/types/admin";
import Pagination from "@/components/tables/Pagination";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const STATUS_OPTIONS: ProductStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "BLOCKED",
  "DRAFT",
];

const STATUS_LABELS: Record<ProductStatus, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  BLOCKED: "Diblokir",
  DRAFT: "Draft",
  OUT_OF_STOCK: "Stok habis",
  DELETED: "Dihapus",
};

/** Selaras dengan validasi backend — status restriktif wajib alasan. */
const REASON_REQUIRED_STATUSES: ProductStatus[] = [
  "BLOCKED",
  "INACTIVE",
  "DRAFT",
  "OUT_OF_STOCK",
  "DELETED",
];

const REASON_MIN = 10;
const REASON_MAX = 500;

const REASON_TEMPLATES: Record<string, string> = {
  BLOCKED:
    "Listing melanggar kebijakan platform (mis. informasi menyesatkan, konten terlarang, atau pelanggaran berulang).",
  INACTIVE:
    "Listing dinonaktifkan sementara untuk peninjauan atau perbaikan data oleh penjual.",
  DRAFT: "Listing dikembalikan ke draft agar penjual memperbaiki deskripsi, harga, atau dokumen pendukung.",
};

function statusRequiresReason(status: ProductStatus): boolean {
  return REASON_REQUIRED_STATUSES.includes(status);
}

function statusBadgeColor(status: ProductStatus): "success" | "warning" | "error" | "light" {
  if (status === "ACTIVE") return "success";
  if (status === "BLOCKED" || status === "DELETED") return "error";
  return "warning";
}

function GalleryImage({
  src,
  alt,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;

  if (!show) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-theme-xs text-gray-400 dark:bg-gray-800 ${className}`}
      >
        Tanpa gambar
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function ProductsTable() {
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<ProductListItem | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ProductStatus | null>(null);
  const [reason, setReason] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProducts({
        page,
        limit,
        search: search.trim() || undefined,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      const msg =
        err instanceof Error && "isRateLimited" in err && (err as { isRateLimited?: boolean }).isRateLimited
          ? err.message
          : "Gagal memuat daftar produk.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    load();
  }, [load]);

  function openModerationModal(product: ProductListItem, status: ProductStatus) {
    setPendingProduct(product);
    setPendingStatus(status);
    setReason(REASON_TEMPLATES[status] ?? "");
    setModalError(null);
    setModalOpen(true);
  }

  function closeModerationModal() {
    setModalOpen(false);
    setPendingProduct(null);
    setPendingStatus(null);
    setReason("");
    setModalError(null);
  }

  function onStatusSelect(product: ProductListItem, status: ProductStatus) {
    if (status === product.status) return;
    if (statusRequiresReason(status)) {
      openModerationModal(product, status);
      return;
    }
    void submitModeration(product, status);
  }

  async function submitModeration(
    product: ProductListItem,
    status: ProductStatus,
    moderationReason?: string,
  ) {
    setActionId(product.id);
    setModalError(null);
    try {
      await moderateProduct(product.id, status, moderationReason);
      closeModerationModal();
      await load();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Gagal memperbarui status produk.";
      if (modalOpen) {
        setModalError(msg);
      } else {
        alert(msg);
      }
    } finally {
      setActionId(null);
    }
  }

  function handleModalConfirm() {
    if (!pendingProduct || !pendingStatus) return;
    const trimmed = reason.trim();
    if (statusRequiresReason(pendingStatus) && trimmed.length < REASON_MIN) {
      setModalError(`Alasan wajib minimal ${REASON_MIN} karakter.`);
      return;
    }
    if (trimmed.length > REASON_MAX) {
      setModalError(`Alasan maksimal ${REASON_MAX} karakter.`);
      return;
    }
    void submitModeration(pendingProduct, pendingStatus, trimmed || undefined);
  }

  async function handleCertify(product: ProductListItem) {
    if (!product.id) {
      alert("ID produk tidak valid. Muat ulang halaman.");
      return;
    }

    const currentlyCertified =
      product.isCertified === true || product.isCertified === ("true" as unknown as boolean);
    const nextCertified = !currentlyCertified;

    if (
      !nextCertified &&
      !confirm(
        `Cabut sertifikasi "${product.name}"? Penjual tidak lagi ditandai sebagai produk terverifikasi.`,
      )
    ) {
      return;
    }

    setActionId(product.id);
    try {
      await certifyProduct(product.id, nextCertified);
      try {
        await load();
      } catch {
        alert(
          "Sertifikasi tersimpan, tetapi daftar produk gagal dimuat ulang. Klik Segarkan atau muat ulang halaman.",
        );
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Gagal memperbarui sertifikasi. Periksa koneksi API dan sesi login.";
      alert(msg);
    } finally {
      setActionId(null);
    }
  }

  const reasonLen = reason.trim().length;
  const canConfirmReason =
    pendingStatus &&
    (!statusRequiresReason(pendingStatus) ||
      (reasonLen >= REASON_MIN && reasonLen <= REASON_MAX));

  return (
    <div className="space-y-6">
      <AdminInfoBanner>
        Blokir, nonaktifkan, atau kembalikan ke draft memerlukan alasan (min. {REASON_MIN}{" "}
        karakter). Alasan dicatat di audit log dan dikirim ke penjual.{" "}
        <Link href="/products/categories" className="font-medium text-brand-700 underline">
          Kelola kategori
        </Link>
      </AdminInfoBanner>

      {error ? (
        <div className="space-y-2">
          <Alert variant="error" title="Gagal memuat produk" message={error} />
          <Button size="sm" variant="outline" onClick={load}>
            Coba lagi
          </Button>
        </div>
      ) : null}

      <ComponentCard title="Daftar produk" desc="Tinjau status, sertifikasi, dan moderasi listing">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <Label htmlFor="product-search">Cari produk</Label>
            <Input
              id="product-search"
              type="search"
              placeholder="Nama produk..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500">
                  Produk
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500">
                  Penjual
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500">
                  Harga
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-end text-theme-xs text-gray-500">
                  Aksi
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-5 py-4">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="h-4 w-14 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </TableCell>
                    <TableCell className="px-5 py-4" />
                  </TableRow>
                ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-8 text-center text-sm text-gray-500">
                    Tidak ada produk.
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
              )}
              {!loading &&
                items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <GalleryImage
                          src={resolveMediaUrl(product.thumbnailUrl)}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg border border-gray-200 dark:border-gray-800"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                            {product.name}
                          </div>
                          <div className="truncate text-theme-xs text-gray-400">
                            {product.category?.name ?? "—"} · {formatDate(product.createdAt)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-600">
                      {product.user.fullName}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm">
                      {formatIDR(product.pricePerUnit)}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge color={statusBadgeColor(product.status)} size="sm">
                          {STATUS_LABELS[product.status] ?? product.status}
                        </Badge>

                        {product.isCertified ? (
                          <Badge color="primary" size="sm">
                            Certified
                          </Badge>
                        ) : null}

                        {product.isIotMonitored ? (
                          <Badge color="success" size="sm">
                            IoT Monitored
                          </Badge>
                        ) : (
                          <Badge color="light" size="sm">
                            IoT Off
                          </Badge>
                        )}

                        {product.isEscrowProtected ? (
                          <Badge color="success" size="sm">
                            Escrow Protected
                          </Badge>
                        ) : (
                          <Badge color="warning" size="sm">
                            Escrow Off
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-end">
                      <div className="flex flex-wrap justify-end gap-1">
                        <select
                          disabled={actionId === product.id}
                          defaultValue=""
                          onChange={(e) => {
                            const v = e.target.value as ProductStatus;
                            if (v) onStatusSelect(product, v);
                            e.target.value = "";
                          }}
                          className="h-9 min-w-[7.5rem] rounded-lg border border-gray-300 bg-white px-2 text-theme-xs shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900"
                          aria-label={`Ubah status ${product.name}`}
                        >
                          <option value="">Ubah status…</option>
                          {STATUS_OPTIONS.filter((s) => s !== product.status).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                              {statusRequiresReason(s) ? " *" : ""}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionId === product.id}
                          onClick={() => handleCertify(product)}
                        >
                          {product.isCertified ? "Cabut sertifikasi" : "Sertifikasi"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        {items.length > 0 && (
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        )}
      </ComponentCard>

      <Modal isOpen={modalOpen} onClose={closeModerationModal} className="max-w-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Alasan moderasi
        </h3>
        {pendingProduct && pendingStatus ? (
          <>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-800 dark:text-white/90">
                {pendingProduct.name}
              </span>
              {" → "}
              <Badge color={statusBadgeColor(pendingStatus)} size="sm">
                {STATUS_LABELS[pendingStatus]}
              </Badge>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Penjual: {pendingProduct.user.fullName} · Alasan akan dikirim ke akun penjual.
            </p>
            <div className="mt-4">
              <Label htmlFor="moderation-reason">
                Alasan <span className="text-error-500">*</span>
              </Label>
              <TextArea
                placeholder="Jelaskan mengapa listing dimoderasi (min. 10 karakter)…"
                rows={5}
                value={reason}
                onChange={(v) => {
                  setReason(v);
                  setModalError(null);
                }}
                error={Boolean(modalError)}
                hint={
                  reasonLen > 0 && reasonLen < REASON_MIN
                    ? `Minimal ${REASON_MIN} karakter`
                    : undefined
                }
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {reasonLen}/{REASON_MAX} karakter
              {reasonLen > 0 && reasonLen < REASON_MIN
                ? ` — minimal ${REASON_MIN} karakter`
                : null}
            </p>
            {modalError ? (
              <p className="mt-2 text-sm text-error-600 dark:text-error-400">{modalError}</p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={closeModerationModal}>
                Batal
              </Button>
              <Button
                size="sm"
                disabled={!canConfirmReason || actionId === pendingProduct.id}
                onClick={handleModalConfirm}
              >
                {actionId === pendingProduct.id ? "Menyimpan…" : "Konfirmasi"}
              </Button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
