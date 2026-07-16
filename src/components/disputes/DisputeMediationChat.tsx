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
import type {
  DisputeChatMessage,
  DisputeChatThread,
  DisputeMediationMeta,
} from "@/types/admin";
import { useCallback, useEffect, useRef, useState } from "react";

const ADMIN_PREFIX = "[Admin BISA]";
const POLL_MS = 4000;

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
    msg.content.startsWith(ADMIN_PREFIX) || msg.sender?.role === "ADMIN"
  );
}

type PartyLabel = "admin" | "buyer" | "seller" | "system";

function resolvePartyLabel(
  msg: DisputeChatMessage,
  thread: DisputeChatThread | null,
): PartyLabel {
  if (isAdminMediationMessage(msg)) return "admin";
  if (msg.isSystemMessage && !isAdminMediationMessage(msg)) return "system";
  if (thread?.negotiation.buyer.id === msg.senderId) return "buyer";
  if (thread?.negotiation.seller.id === msg.senderId) return "seller";
  return "system";
}

function partyDisplayName(
  party: PartyLabel,
  msg: DisputeChatMessage,
  thread: DisputeChatThread | null,
): string {
  switch (party) {
    case "admin":
      return "Hakim BISA (Admin)";
    case "buyer":
      return `Pembeli · ${thread?.negotiation.buyer.fullName ?? msg.sender?.fullName ?? "—"}`;
    case "seller":
      return `Penjual · ${thread?.negotiation.seller.fullName ?? msg.sender?.fullName ?? "—"}`;
    default:
      return "Sistem";
  }
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
  const [thread, setThread] = useState<DisputeChatThread | null>(null);
  const [mediation, setMediation] = useState<DisputeMediationMeta | null>(
    initialMediation ?? null,
  );
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveHint, setLiveHint] = useState("Sinkronisasi chat 3 pihak…");
  const bottomRef = useRef<HTMLDivElement>(null);

  const syncMediation = useCallback(
    (next: DisputeMediationMeta) => {
      setMediation(next);
      onMediationChange?.(next);
    },
    [onMediationChange],
  );

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await fetchDisputeChat(orderId, { page: 1, limit: 200 });
        setThread(data);
        setMessages(data.messages);
        syncMediation(data.mediation);
        setLiveHint(
          `Grup mediasi aktif · pembeli, penjual, admin · diperbarui ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
        );
      } catch (err) {
        if (!silent) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Gagal memuat chat mediasi sengketa.",
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [orderId, syncMediation],
  );

  useEffect(() => {
    if (canMediate) load();
  }, [canMediate, load]);

  // Poll agar balasan buyer/seller muncul tanpa refresh manual.
  useEffect(() => {
    if (!canMediate) return;
    const id = window.setInterval(() => {
      void load({ silent: true });
    }, POLL_MS);
    return () => window.clearInterval(id);
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
      <div className="rounded-lg border-2 border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
        <p className="font-semibold mb-2">Mediasi tidak dapat dimulai</p>
        <p>
          Order belum punya data sengketa atau ruang chat. Pastikan buyer sudah
          mengajukan dispute.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge color="warning" size="sm">
          Hakim BISA
        </Badge>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Mediasi 3 pihak · {orderNumber}
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

      {thread ? (
        <div className="grid grid-cols-1 gap-2 rounded-xl border border-gray-200 bg-white/80 p-3 text-xs sm:grid-cols-3 dark:border-gray-800 dark:bg-gray-900/40">
          <div>
            <p className="font-semibold text-gray-500">Pembeli</p>
            <p className="text-gray-800 dark:text-white/90">
              {thread.negotiation.buyer.fullName}
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Penjual</p>
            <p className="text-gray-800 dark:text-white/90">
              {thread.negotiation.seller.fullName}
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Mediator</p>
            <p className="text-gray-800 dark:text-white/90">Admin BISA</p>
          </div>
        </div>
      ) : null}

      <p className={`text-xs ${mutedTextClass}`}>{liveHint}</p>

      {error ? (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!mediation?.mediationStartedAt ? (
          <Button
            size="lg"
            onClick={handleStartMediation}
            disabled={actionLoading || loading}
            className="bg-warning-500 hover:bg-warning-600 text-white font-semibold"
          >
            Mulai Mediasi (buka grup 3 pihak)
          </Button>
        ) : null}
        {mediation?.canMarkReady ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkReady}
            disabled={actionLoading || loading}
          >
            Tandai Siap Putus
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          onClick={() => load()}
          disabled={loading}
        >
          Segarkan chat
        </Button>
      </div>

      <div className="flex h-[360px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading && messages.length === 0 ? (
            <p className={`text-sm ${mutedTextClass}`}>Memuat chat…</p>
          ) : messages.length === 0 ? (
            <p className={`text-sm ${mutedTextClass}`}>
              Belum ada pesan. Mulai mediasi agar pembeli dan penjual bisa
              bergabung di chat yang sama.
            </p>
          ) : (
            messages.map((msg) => {
              const party = resolvePartyLabel(msg, thread);
              const body = msg.content.replace(ADMIN_PREFIX, "").trim();
              const bubbleClass =
                party === "admin"
                  ? "ml-auto border border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-100"
                  : party === "buyer"
                    ? "mr-auto border border-blue-light-200 bg-blue-light-50 text-gray-800 dark:border-blue-light-500/30 dark:bg-blue-light-500/10 dark:text-white/90"
                    : party === "seller"
                      ? "mr-auto border border-success-200 bg-success-50 text-gray-800 dark:border-success-500/30 dark:bg-success-500/10 dark:text-white/90"
                      : "mx-auto border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300";

              return (
                <div
                  key={msg.id}
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${bubbleClass}`}
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">
                    {partyDisplayName(party, msg, thread)}
                  </p>
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
            placeholder="Tulis pesan mediasi sebagai Hakim BISA — pembeli & penjual akan melihatnya di app…"
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
