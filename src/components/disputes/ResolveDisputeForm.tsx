"use client";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import { resolveDispute } from "@/lib/api/admin";
import { ApiError } from "@/lib/api-client";
import type { DisputeResolution } from "@/types/admin";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ResolveDisputeFormProps {
  orderId: string;
  disabled?: boolean;
  canResolve?: boolean;
}

export default function ResolveDisputeForm({
  orderId,
  disabled = false,
  canResolve = false,
}: ResolveDisputeFormProps) {
  const router = useRouter();
  const [resolution, setResolution] = useState<DisputeResolution>("RELEASE");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (note.trim().length < 5) {
      setError("Catatan resolusi minimal 5 karakter.");
      return;
    }

    setLoading(true);
    try {
      await resolveDispute(orderId, resolution, note.trim());
      setSuccess("Sengketa berhasil diselesaikan.");
      router.refresh();
      setTimeout(() => router.push("/disputes"), 1500);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menyelesaikan sengketa.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (disabled) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Order ini sudah tidak dalam status sengketa.
      </p>
    );
  }

  if (!canResolve) {
    return (
      <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-200">
        Selesaikan mediasi terlebih dahulu: mulai mediasi, kirim pesan sebagai
        Hakim BISA, lalu klik <strong>Tandai siap putus</strong> sebelum release
        atau refund.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
          {success}
        </div>
      )}

      <div>
        <Label>Keputusan</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
            <input
              type="radio"
              name="resolution"
              value="RELEASE"
              checked={resolution === "RELEASE"}
              onChange={() => setResolution("RELEASE")}
            />
            Release ke penjual (order selesai)
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
            <input
              type="radio"
              name="resolution"
              value="REFUND"
              checked={resolution === "REFUND"}
              onChange={() => setResolution("REFUND")}
            />
            Refund ke pembeli (order dibatalkan)
          </label>
        </div>
      </div>

      <div>
        <Label>
          Catatan resolusi <span className="text-error-500">*</span>
        </Label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Jelaskan alasan keputusan (min. 5 karakter)"
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <Button type="submit" disabled={loading || note.trim().length < 5}>
        {loading ? "Menyimpan..." : "Selesaikan Sengketa"}
      </Button>
    </form>
  );
}
