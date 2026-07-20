"use client";

import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  markDisputeReadyToResolve,
  startDisputeMediation,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api-client";
import type { DisputeMediationMeta } from "@/types/admin";
import Link from "next/link";
import { useState } from "react";

interface DisputeMediationActionsProps {
  orderId: string;
  orderNumber: string;
  canMediate?: boolean;
  mediation: DisputeMediationMeta | null;
  onMediationChange?: (mediation: DisputeMediationMeta) => void;
}

export default function DisputeMediationActions({
  orderId,
  orderNumber,
  canMediate = true,
  mediation,
  onMediationChange,
}: DisputeMediationActionsProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const chatHref =
    mediation?.negotiationId != null
      ? `/chat?tab=dispute&room=${mediation.negotiationId}`
      : null;

  async function handleStart() {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const next = await startDisputeMediation(orderId);
      onMediationChange?.(next);
      setMsg("Grup mediasi sengketa dibuat. Lanjutkan diskusi di menu Chat → Grup Sengketa.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat grup mediasi.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkReady() {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const next = await markDisputeReadyToResolve(orderId);
      onMediationChange?.(next);
      setMsg("Mediasi ditandai siap putus. Anda dapat menyelesaikan sengketa di bawah.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menandai siap putus.");
    } finally {
      setBusy(false);
    }
  }

  if (!canMediate) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Mediasi hanya tersedia saat order berstatus DISPUTED.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge color="warning" size="sm">
          Hakim BISA
        </Badge>
        <span className="text-sm text-gray-600 dark:text-gray-300">{orderNumber}</span>
        {mediation?.mediationStartedAt ? (
          <Badge color="success" size="sm">
            Grup aktif
          </Badge>
        ) : (
          <Badge color="light" size="sm">
            Belum dibuat
          </Badge>
        )}
        {mediation?.readyToResolveAt ? (
          <Badge color="success" size="sm">
            Siap putus
          </Badge>
        ) : null}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        Buat grup mediasi 3 pihak (pembeli, penjual, admin) lalu diskusikan di{" "}
        <strong>Chat → Grup Sengketa</strong>. Halaman sengketa hanya untuk membuat grup dan
        memutus keputusan akhir.
      </p>

      {error ? (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      ) : null}
      {msg ? (
        <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-800 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-200">
          {msg}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!mediation?.mediationStartedAt ? (
          <Button size="md" onClick={() => void handleStart()} disabled={busy}>
            Buat Grup Mediasi Sengketa
          </Button>
        ) : (
          <>
            {chatHref ? (
              <Link href={chatHref}>
                <Button size="md">Buka Chat Grup Sengketa</Button>
              </Link>
            ) : null}
            {mediation.canMarkReady ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleMarkReady()}
                disabled={busy}
              >
                Tandai Siap Putus
              </Button>
            ) : null}
          </>
        )}
      </div>

      {mediation?.mediationStartedAt && mediation.adminMessageCount === 0 ? (
        <p className="text-xs text-gray-500">
          Kirim minimal satu pesan di chat grup sebelum menandai siap putus.
        </p>
      ) : null}
    </div>
  );
}
