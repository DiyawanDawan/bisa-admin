"use client";

import {
  fetchProductCertificate,
  reviewProductCertificate,
} from "@/lib/api/admin";
import type { ProductCertificateItem } from "@/types/admin";
import { validateCertificateDecision } from "@/lib/certificate-review";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProductCertificateDetailView({ id }: { id: string }) {
  const [item, setItem] = useState<ProductCertificateItem | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductCertificate(id)
      .then(setItem)
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat detail."))
      .finally(() => setLoading(false));
  }, [id]);

  async function decide(status: "APPROVED" | "REJECTED") {
    const validationError = validateCertificateDecision(status, reason);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await reviewProductCertificate(id, status, reason.trim() || undefined);
      setItem((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan keputusan.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="p-8 text-center text-sm text-gray-500">Memuat...</p>;
  if (!item) return <p className="p-8 text-center text-sm text-error-500">{error}</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{item.title}</h2>
            <p className="text-sm text-gray-500">{item.certificateType}</p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
            {item.status}
          </span>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Field label="Produk" value={item.product.name} />
          <Field label="Supplier" value={item.product.user.fullName} />
          <Field label="Penerbit" value={item.issuerName} />
          <Field label="Nomor sertifikat" value={item.certificateNumber} />
          <Field label="Tanggal terbit" value={item.issuedAt?.slice(0, 10)} />
          <Field label="Berlaku sampai" value={item.expiresAt?.slice(0, 10)} />
          <Field label="Nama file" value={item.fileName} />
          <Field label="Ukuran" value={`${Math.ceil(item.fileSizeBytes / 1024)} KB`} />
        </dl>
        {item.documentUrl ? (
          <>
            <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              {item.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.documentUrl}
                  alt={item.title}
                  className="max-h-[520px] w-full object-contain"
                />
              ) : (
                <iframe
                  src={item.documentUrl}
                  title={`Dokumen ${item.title}`}
                  className="h-[520px] w-full"
                />
              )}
            </div>
            <a
              href={item.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Buka dokumen di tab baru
            </a>
          </>
        ) : null}
      </section>

      <aside className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="font-bold text-gray-900 dark:text-white">Keputusan admin</h3>
        {item.status === "PENDING" ? (
          <>
            <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Alasan penolakan
            </label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={5}
              placeholder="Wajib diisi jika sertifikat ditolak"
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
            {error ? <p className="mt-2 text-sm text-error-500">{error}</p> : null}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                disabled={submitting}
                onClick={() => void decide("REJECTED")}
                className="rounded-lg border border-error-500 px-4 py-2.5 text-sm font-semibold text-error-500 disabled:opacity-50"
              >
                Tolak
              </button>
              <button
                disabled={submitting}
                onClick={() => void decide("APPROVED")}
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Setujui
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p>Keputusan: {item.status}</p>
            {item.rejectionReason ? <p className="mt-2">Alasan: {item.rejectionReason}</p> : null}
            <p className="mt-2">Reviewer: {item.reviewedBy?.fullName || "-"}</p>
            <p className="mt-2">
              Waktu review:{" "}
              {item.reviewedAt
                ? new Date(item.reviewedAt).toLocaleString("id-ID")
                : "-"}
            </p>
          </div>
        )}
        <Link href="/products/certificates" className="mt-6 inline-block text-sm text-brand-500">
          Kembali ke antrean
        </Link>
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="mt-1 font-medium text-gray-800 dark:text-white">{value || "-"}</dd>
    </div>
  );
}
