"use client";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  fetchDisputeChat,
  markDisputeReadyToResolve,
  sendDisputeMediationMessage,
  startDisputeMediation,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api-client";
import { textareaClass } from "@/lib/form-classes";
import { mutedTextClass } from "@/lib/theme-classes";
import type { DisputeChatMessage, DisputeMediationMeta } from "@/types/admin";
import { useCallback, useEffect, useRef, useState } from "react";

const ADMIN_PREFIX = "[Admin BISA]";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isAdminMediationMessage(msg: DisputeChatMessage): boolean {
  return (
    msg.content.startsWith(ADMIN_PREFIX) ||
    msg.sender?.role === "ADMIN"
  );
}

interface DisputeMediationChatProps {
  orderId: string;
  orderNumber: string;
  canMediate?: boolean;
  initialMediation?: DisputeMediationMeta;
  onMediationChange?: (mediation: DisputeMediationMeta) => void;
}

export default function DisputeMediationChat({
  orderId,
  orderNumber,
  canMediate = true,
  initialMediation,
  onMediationChange,
}: DisputeMediationChatProps) {
  const [messages, setMessages] = useState<DisputeChatMessage[]>([]);
  const [mediation, setMediation] = useState<DisputeMediationMeta | null>(
    initialMediation ?? null,
  );
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const syncMediation = useCallback(
    (next: DisputeMediationMeta) => {
      setMediation(next);
      onMediationChange?.(next);
    },
    [onMediationChange],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDisputeChat(orderId, { page: 1, limit: 200 });
      setMessages(data.messages);
      syncMediation(data.mediation);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal memuat chat mediasi sengketa.",
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, syncMediation]);

  useEffect(() => {
    if (canMediate) load();
  }, [canMediate, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleStartMediation() {
    setActionLoading(true);
    setError(null);
    try {
      syncMediation(await startDisputeMediation(orderId));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memulai mediasi.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkReady() {
    setActionLoading(true);
    setError(null);
    try {
      syncMediation(await markDisputeReadyToResolve(orderId));
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menandai siap putus.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;

    setSending(true);
    setError(null);
    try {
      if (!mediation?.mediationStartedAt) {
        await startDisputeMediation(orderId);
      }
      await sendDisputeMediationMessage(orderId, text);
      setDraft("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim pesan.");
    } finally {
      setSending(false);
    }
  }

  if (!canMediate) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Order ini tidak memiliki ruang negosiasi terkait.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge color="warning" size="sm">
          Hakim BISA
        </Badge>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Mediasi chat untuk {orderNumber}
        </span>
        {mediation?.mediationStartedAt ? (
          <Badge color="success" size="sm">
            Mediasi aktif
          </Badge>
        ) : (
          <Badge color="light" size="sm">
            Belum dimulai
          </Badge>
        )}
        {mediation?.readyToResolveAt ? (
          <Badge color="success" size="sm">
            Siap putus
          </Badge>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!mediation?.mediationStartedAt ? (
          <Button
            size="sm"
            onClick={handleStartMediation}
            disabled={actionLoading || loading}
          >
            Mulai mediasi
          </Button>
        ) : null}
        {mediation?.canMarkReady ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkReady}
            disabled={actionLoading || loading}
          >
            Tandai siap putus
          </Button>
        ) : null}
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          Segarkan chat
        </Button>
      </div>

      <div className="flex h-[360px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading ? (
            <p className={`text-sm ${mutedTextClass}`}>Memuat chat…</p>
          ) : messages.length === 0 ? (
            <p className={`text-sm ${mutedTextClass}`}>
              Belum ada pesan. Mulai mediasi untuk diskusi dengan pembeli dan
              supplier.
            </p>
          ) : (
            messages.map((msg) => {
              const adminMsg = isAdminMediationMessage(msg);
              const body = msg.content.replace(ADMIN_PREFIX, "").trim();
              return (
                <div
                  key={msg.id}
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                    adminMsg
                      ? "ml-auto border border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-100"
                      : msg.isSystemMessage
                        ? "mx-auto border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300"
                        : "border border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
                  }`}
                >
                  {adminMsg ? (
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                      Hakim BISA
                    </p>
                  ) : null}
                  <p>{body || msg.content}</p>
                  <p className="mt-1 text-[10px] opacity-60">
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="flex gap-2 border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Tulis pesan mediasi sebagai Hakim BISA…"
            className={`min-h-[44px] flex-1 ${textareaClass}`}
          />
          <Button type="submit" disabled={sending || !draft.trim()}>
            {sending ? "…" : "Kirim"}
          </Button>
        </form>
      </div>
    </div>
  );
}
