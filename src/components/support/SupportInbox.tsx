"use client";

import {
  fetchSupportTicket,
  fetchSupportTickets,
  replySupportTicket,
  resolveSupportTicket,
  updateSupportTicket,
} from "@/lib/api/support";
import type {
  SupportMessage,
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/types/support";
import { FormEvent, useCallback, useEffect, useState } from "react";

const activeStatuses = new Set<SupportTicketStatus>(["OPEN", "ASSIGNED", "WAITING_USER"]);

export default function SupportInbox() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [status, setStatus] = useState<SupportTicketStatus | "">("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const items = await fetchSupportTickets({
        status: status || undefined,
        search: search.trim() || undefined,
      });
      setTickets(items);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Antrean tiket gagal dimuat.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadTickets(), 250);
    return () => window.clearTimeout(timeout);
  }, [loadTickets]);

  useEffect(() => {
    const interval = window.setInterval(() => void loadTickets(true), 15000);
    return () => window.clearInterval(interval);
  }, [loadTickets]);

  async function selectTicket(ticket: SupportTicket) {
    setSelected(ticket);
    try {
      setSelected(await fetchSupportTicket(ticket.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Detail tiket gagal dimuat.");
    }
  }

  function updateSelected(ticket: SupportTicket) {
    setSelected(ticket);
    setTickets((current) =>
      current.map((item) => (item.id === ticket.id ? ticket : item)),
    );
  }

  return (
    <div className="grid min-h-[640px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[360px_1fr] dark:border-gray-800 dark:bg-gray-900">
      <aside className="border-b border-gray-200 lg:border-b-0 lg:border-r dark:border-gray-800">
        <div className="space-y-3 border-b border-gray-200 p-4 dark:border-gray-800">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari subjek, nama, atau email"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as SupportTicketStatus | "")}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Semua status</option>
            <option value="OPEN">Menunggu CS</option>
            <option value="ASSIGNED">Ditangani</option>
            <option value="WAITING_USER">Menunggu user</option>
            <option value="RESOLVED">Selesai</option>
            <option value="CLOSED">Ditutup</option>
          </select>
        </div>

        <div className="max-h-[550px] overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : error && tickets.length === 0 ? (
            <p className="p-6 text-center text-sm text-error-500">{error}</p>
          ) : tickets.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">Tidak ada tiket pada filter ini.</p>
          ) : (
            tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => void selectTicket(ticket)}
                className={`w-full border-b border-gray-100 p-4 text-left transition hover:bg-brand-50 dark:border-gray-800 dark:hover:bg-gray-800 ${
                  selected?.id === ticket.id ? "bg-brand-50 dark:bg-gray-800" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 text-sm font-semibold text-gray-800 dark:text-white">
                    {ticket.subject}
                  </p>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="mt-2 truncate text-xs text-gray-500">
                  {ticket.user?.fullName ?? "User"} · {categoryLabel(ticket.category)}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  {new Date(ticket.updatedAt).toLocaleString("id-ID")}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      {selected ? (
        <TicketThread ticket={selected} onChange={updateSelected} />
      ) : (
        <div className="flex min-h-[420px] items-center justify-center p-8 text-center">
          <div>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-2xl">
              🎧
            </div>
            <h2 className="font-semibold text-gray-800 dark:text-white">Pilih tiket</h2>
            <p className="mt-2 text-sm text-gray-500">
              Pilih antrean di sebelah kiri untuk mulai membantu user.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketThread({
  ticket,
  onChange,
}: {
  ticket: SupportTicket;
  onChange: (ticket: SupportTicket) => void;
}) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const isActive = activeStatuses.has(ticket.status);

  async function sendReply(event: FormEvent) {
    event.preventDefault();
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const updated = await replySupportTicket(ticket.id, reply.trim());
      setReply("");
      setError("");
      onChange(updated);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Balasan gagal dikirim.");
    } finally {
      setSending(false);
    }
  }

  async function changePriority(priority: SupportTicketPriority) {
    try {
      onChange(await updateSupportTicket(ticket.id, { priority }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Prioritas gagal diperbarui.");
    }
  }

  async function resolveTicket() {
    if (!window.confirm("Tandai tiket ini selesai?")) return;
    try {
      onChange(await resolveSupportTicket(ticket.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Tiket gagal diselesaikan.");
    }
  }

  return (
    <section className="flex min-h-[640px] min-w-0 flex-col">
      <header className="border-b border-gray-200 p-4 dark:border-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="wrap-break-word font-semibold text-gray-800 dark:text-white">
                {ticket.subject}
              </h2>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {ticket.user.fullName} · {ticket.user.email} · {categoryLabel(ticket.category)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Prioritas tiket"
              value={ticket.priority}
              onChange={(event) => void changePriority(event.target.value as SupportTicketPriority)}
              disabled={!isActive}
              className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="LOW">Rendah</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">Tinggi</option>
            </select>
            {isActive && (
              <button
                type="button"
                onClick={() => void resolveTicket()}
                className="h-9 rounded-lg bg-brand-500 px-3 text-xs font-semibold text-white hover:bg-brand-600"
              >
                Selesaikan
              </button>
            )}
          </div>
        </div>
        {ticket.aiTranscript && ticket.aiTranscript.length > 0 && (
          <details className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <summary className="cursor-pointer text-xs font-semibold text-brand-600">
              Lihat konteks percakapan AI ({ticket.aiTranscript.length} pesan)
            </summary>
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
              {ticket.aiTranscript.map((message, index) => (
                <p key={`${message.role}-${index}`} className="text-xs leading-5 text-gray-600 dark:text-gray-300">
                  <strong>{message.role === "user" ? "User" : "AI"}:</strong> {message.content}
                </p>
              ))}
            </div>
          </details>
        )}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-950">
        {ticket.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      <form onSubmit={sendReply} className="border-t border-gray-200 p-4 dark:border-gray-800">
        {error && <p className="mb-2 text-xs text-error-500">{error}</p>}
        {isActive ? (
          <div className="flex items-end gap-3">
            <textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              maxLength={4000}
              rows={2}
              placeholder="Tulis balasan Customer Service..."
              className="min-h-12 flex-1 resize-none rounded-xl border border-gray-300 bg-transparent p-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="h-11 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Mengirim..." : "Kirim"}
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500">Tiket telah selesai dan tidak menerima balasan baru.</p>
        )}
      </form>
    </section>
  );
}

function MessageBubble({ message }: { message: SupportMessage }) {
  if (message.senderType === "SYSTEM") {
    return <p className="py-2 text-center text-xs text-gray-400">{message.content}</p>;
  }
  const isAdmin = message.senderType === "ADMIN";
  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
          isAdmin
            ? "bg-brand-500 text-white"
            : "border border-gray-200 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
        }`}
      >
        {!isAdmin && <p className="mb-1 text-[10px] font-semibold text-brand-600">{message.sender?.fullName ?? "User"}</p>}
        <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
        <p className={`mt-1 text-[10px] ${isAdmin ? "text-white/70" : "text-gray-400"}`}>
          {new Date(message.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SupportTicketStatus }) {
  const label: Record<SupportTicketStatus, string> = {
    OPEN: "Menunggu CS",
    ASSIGNED: "Ditangani",
    WAITING_USER: "Menunggu user",
    RESOLVED: "Selesai",
    CLOSED: "Ditutup",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
        activeStatuses.has(status)
          ? "bg-brand-50 text-brand-700"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
      }`}
    >
      {label[status]}
    </span>
  );
}

function categoryLabel(category: SupportTicket["category"]) {
  return {
    ACCOUNT: "Akun",
    PAYMENT: "Pembayaran",
    KYC: "Verifikasi/KYC",
    ORDER: "Pesanan",
    OTHER: "Lainnya",
  }[category];
}
