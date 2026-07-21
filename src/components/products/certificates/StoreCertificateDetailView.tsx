"use client";

import {
  fetchStoreCertificate,
  reviewStoreCertificate,
} from "@/lib/api/admin";
import type { StoreCertificateItem } from "@/types/admin";
import { validateCertificateDecision } from "@/lib/certificate-review";
import Link from "next/link";
import { useEffect, useState } from "react";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-800 dark:text-white/90">{value || "—"}</dd>
    </div>
  );
}

export default function StoreCertificateDetailView({ id }: { id: string }) {
  const [item, setItem] = useState<StoreCertificateItem | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStoreCertificate(id)
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
      setItem(await reviewStoreCertificate(id, status, reason.trim() || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan keputusan.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="p-8 text-center text-sm text-gray-500">Memuat...</p>;
  if (!item) return <p className="p-8 text-center text-sm text-error-500">{error}</p>;

  const storeName = item.supplier.profile?.companyName || item.supplier.fullName;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-theme-xs font-medium uppercase tracking-wide text-brand-600">
              Sertifikat toko supplier
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{item.title}</h2>
            <p className="text-sm text-gray-500">{item.certificateType}</p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
            {item.status}
          </span>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Field label="Toko / Supplier" value={storeName} />
          <Field label="Email" value={item.supplier.email} />
          <Field label="Penerbit" value={item.issuerName} />
          <Field label="Nomor sertifikat" value={item.certificateNumber} />
          <Field label="Tanggal terbit" value={item.issuedAt?.slice(0, 10)} />
          <Field label="Berlaku sampai" value={item.expiresAt?.slice(0, 10)} />
          <Field label="Nama file" value={item.fileName} />
          <Field label="Ukuran" value={`${Math.ceil(item.fileSizeBytes / 1024)} KB`} />
        </dl>
        {item.documentUrl ? (
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
                title={item.title}
                className="h-[520px] w-full"
              />
            )}
          </div>
        ) : null}
      </section>

      <aside className="space-y-4">
        <Link
          href="/products/certificates"
          className="inline-block text-sm text-brand-600 hover:underline"
        >
          ← Kembali ke antrean
        </Link>
        {item.status === "PENDING" ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="font-semibold text-gray-800 dark:text-white">Keputusan review</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Alasan penolakan (wajib jika ditolak)"
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              rows={4}
            />
            {error ? <p className="mt-2 text-sm text-error-500">{error}</p> : null}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void decide("APPROVED")}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
              >
                Setujui
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void decide("REJECTED")}
                className="rounded-lg border border-error-300 px-4 py-2 text-sm font-medium text-error-600"
              >
                Tolak
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 text-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <p>
              Ditinjau: {item.reviewedBy?.fullName ?? "—"} ·{" "}
              {item.reviewedAt ? item.reviewedAt.slice(0, 10) : "—"}
            </p>
            {item.rejectionReason ? (
              <p className="mt-2 text-error-600">Alasan: {item.rejectionReason}</p>
            ) : null}
          </section>
        )}
      </aside>
    </div>
  );
}
