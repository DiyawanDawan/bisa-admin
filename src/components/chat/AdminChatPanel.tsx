"use client";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import AdminMediaImage from "@/components/common/AdminMediaImage";
import PartyAvatar from "@/components/common/PartyAvatar";
import {
  fetchChatInbox,
  fetchChatStats,
  fetchChatThread,
  sendAdminChatMessage,
} from "@/lib/api/extended";
import { formatIDR } from "@/lib/format";
import { nativeInputClass, nativeSelectClass, textareaClass } from "@/lib/form-classes";
import { brandLinkClass } from "@/lib/theme-classes";
import type { ChatInboxItem, ChatMessageItem, ChatStats } from "@/types/extended";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const NEGO_STATUS_LABELS: Record<string, string> = {
  OPEN_NEGOTIATION: "Nego terbuka",
  OFFER_SUBMITTED: "Penawaran dikirim",
  OFFER_ACCEPTED: "Disetujui",
  OFFER_REJECTED: "Ditolak",
  EXPIRED: "Kedaluwarsa",
  LOCKED: "Terkunci",
  CANCELLED: "Dibatalkan",
};

const NEGO_STATUSES = ["", "OPEN_NEGOTIATION", "OFFER_ACCEPTED", "LOCKED", "OFFER_REJECTED"] as const;

function negoBadgeColor(status: string): "success" | "warning" | "error" | "light" {
  if (status === "OFFER_ACCEPTED" || status === "LOCKED") return "success";
  if (status === "OFFER_REJECTED" || status === "CANCELLED" || status === "EXPIRED") return "error";
  if (status === "OPEN_NEGOTIATION" || status === "OFFER_SUBMITTED") return "warning";
  return "light";
}

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

function previewText(msg: ChatInboxItem["lastMessage"]): string {
  if (!msg) return "Belum ada pesan";
  const text = msg.content.trim();
  if (!text) return "Lampiran";
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

export default function AdminChatPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");

  const [stats, setStats] = useState<ChatStats | null>(null);
  const [inbox, setInbox] = useState<ChatInboxItem[]>([]);
  const [inboxTotal, setInboxTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [threadMeta, setThreadMeta] = useState<ChatInboxItem | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await fetchChatStats());
    } catch {
      /* opsional */
    }
  }, []);

  const loadInbox = useCallback(async () => {
    setLoadingInbox(true);
    setError(null);
    try {
      const res = await fetchChatInbox({
        page: 1,
        limit: 40,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      });
      setInbox(res.items);
      setInboxTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat inbox chat.");
    } finally {
      setLoadingInbox(false);
    }
  }, [debouncedSearch, statusFilter]);

  const loadThread = useCallback(async (negotiationId: string) => {
    setLoadingThread(true);
    try {
      const data = await fetchChatThread(negotiationId, { page: 1, limit: 200 });
      setMessages(data.messages);
      const n = data.negotiation;
      setThreadMeta({
        id: n.id,
        status: n.status,
        updatedAt: n.updatedAt,
        createdAt: n.createdAt,
        totalEstimate: n.totalEstimate,
        buyer: n.buyer,
        seller: n.seller,
        product: n.product,
        order: n.order,
        _count: n._count,
        lastMessage: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memuat percakapan.";
      setError(msg);
      if (msg.toLowerCase().includes("akses") || msg.includes("403")) {
        router.replace("/chat", { scroll: false });
      }
    } finally {
      setLoadingThread(false);
    }
  }, [router]);

  const selectRoom = useCallback(
    (id: string) => {
      router.replace(`/chat?room=${id}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (roomId) {
      loadThread(roomId);
    } else {
      setMessages([]);
      setThreadMeta(null);
    }
  }, [roomId, loadThread]);

  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(() => loadThread(roomId), 15000);
    return () => clearInterval(interval);
  }, [roomId, loadThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const msg = await sendAdminChatMessage(roomId, draft.trim());
      setMessages((prev) => [...prev, msg]);
      setDraft("");
      await loadInbox();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim pesan.");
    } finally {
      setSending(false);
    }
  }

  const kpis = stats
    ? [
        { label: "Ruang saya", value: stats.totalRooms },
        { label: "Total pesan", value: stats.totalMessages },
        { label: "Aktif 7 hari", value: stats.activeRooms },
        { label: "Nego terbuka", value: stats.openNegotiations },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-100 bg-brand-50/80 px-4 py-3 text-sm text-gray-700 dark:border-brand-900/40 dark:bg-brand-500/10 dark:text-gray-300">
        Hanya menampilkan <strong>chat negosiasi Anda</strong> — ruang di mana akun login ini
        terdaftar sebagai pembeli atau supplier. Chat antar pengguna lain tidak dapat dibuka dari
        panel admin.
      </div>

      {kpis.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <p className="text-theme-xs text-gray-500">{k.label}</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white/90">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10">
          {error}
        </div>
      )}

      <div className="flex h-[calc(100vh-14rem)] min-h-[480px] overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
        {/* Inbox */}
        <aside className="flex w-full max-w-[340px] flex-col border-r border-gray-200 dark:border-gray-800">
          <div className="space-y-2 border-b border-gray-100 p-3 dark:border-gray-800">
            <input
              placeholder="Cari produk, pembeli, supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={nativeInputClass}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={nativeSelectClass}
            >
              {NEGO_STATUSES.map((s) => (
                <option key={s || "all"} value={s}>
                  {s ? (NEGO_STATUS_LABELS[s] ?? s) : "Semua status nego"}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{inboxTotal} ruang negosiasi Anda</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingInbox ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : inbox.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Tidak ada negosiasi untuk akun ini. Login sebagai pembeli/supplier yang ikut nego
                atau buka nego dari aplikasi mobile.
              </p>
            ) : (
              inbox.map((item) => {
                const active = roomId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectRoom(item.id)}
                    className={`w-full border-b border-gray-50 px-3 py-3 text-left transition dark:border-gray-800/80 ${
                      active ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-gray-50 dark:hover:bg-gray-900/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-medium text-gray-800 dark:text-white/90">
                        {item.product.name}
                      </p>
                      <Badge color={negoBadgeColor(item.status)} size="sm">
                        {NEGO_STATUS_LABELS[item.status] ?? item.status}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex min-w-0 flex-col gap-1">
                      <PartyAvatar
                        name={item.buyer.fullName}
                        avatarUrl={item.buyer.avatarUrl}
                        subtitle="Pembeli"
                        tone="buyer"
                        size="sm"
                      />
                      <PartyAvatar
                        name={item.seller.fullName}
                        avatarUrl={item.seller.avatarUrl}
                        subtitle="Supplier"
                        tone="seller"
                        size="sm"
                      />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                      {previewText(item.lastMessage)}
                    </p>
                    <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                      {formatTime(item.updatedAt)} · {item._count.messages} pesan
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className="flex min-w-0 flex-1 flex-col">
          {!roomId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm font-medium">Pilih ruang negosiasi Anda</p>
              <p className="mt-1 text-xs">Hanya percakapan yang melibatkan akun login ini</p>
            </div>
          ) : (
            <>
              {threadMeta && (
                <header className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
                        {threadMeta.product.name}
                      </h2>
                      <p className="text-xs text-gray-500">
                        Estimasi {formatIDR(Number(threadMeta.totalEstimate))}
                      </p>
                    </div>
                    <Badge color={negoBadgeColor(threadMeta.status)} size="sm">
                      {NEGO_STATUS_LABELS[threadMeta.status] ?? threadMeta.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4">
                    <Link href={`/users/${threadMeta.buyer.id}`} className="min-w-0">
                      <PartyAvatar
                        name={threadMeta.buyer.fullName}
                        avatarUrl={threadMeta.buyer.avatarUrl}
                        subtitle="Pembeli"
                        tone="buyer"
                        size="sm"
                      />
                    </Link>
                    <Link href={`/users/${threadMeta.seller.id}`} className="min-w-0">
                      <PartyAvatar
                        name={threadMeta.seller.fullName}
                        avatarUrl={threadMeta.seller.avatarUrl}
                        subtitle="Supplier"
                        tone="seller"
                        size="sm"
                      />
                    </Link>
                    {threadMeta.order && (
                      <Link
                        href={`/orders/${threadMeta.order.id}`}
                        className={`${brandLinkClass} self-center text-xs hover:underline`}
                      >
                        Order {threadMeta.order.orderNumber}
                      </Link>
                    )}
                  </div>
                </header>
              )}

              <div
                ref={threadScrollRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/20"
              >
                {loadingThread && messages.length === 0 ? (
                  <div className="h-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
                ) : (
                  messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="border-t border-gray-100 p-3 dark:border-gray-800"
              >
                <p className="mb-2 text-[10px] text-gray-500 dark:text-gray-400">
                  Pesan dikirim sebagai Anda (pembeli atau supplier) di ruang negosiasi ini
                </p>
                <div className="flex gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Tulis pesan..."
                    rows={2}
                    className={`min-h-[44px] flex-1 ${textareaClass}`}
                  />
                  <Button type="submit" size="sm" disabled={sending || !draft.trim()}>
                    {sending ? "…" : "Kirim"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessageItem }) {
  const isSystem = message.isSystemMessage;
  const isAdmin = message.sender.role === "ADMIN" || message.content.includes("[Admin BISA");

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div
          className={`max-w-[90%] rounded-xl px-3 py-2 text-center text-xs ${
            isAdmin
              ? "border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-100"
              : "bg-gray-200/80 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          <p className="mt-1 text-[10px] opacity-70">{formatTime(message.createdAt)}</p>
        </div>
      </div>
    );
  }

  const isBuyer = message.sender.role === "BUYER";
  const align = isBuyer ? "justify-start" : "justify-end";
  const bubbleClass = isBuyer
    ? "bg-white border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-white/90"
    : "bg-brand-600 text-white dark:bg-brand-500";

  return (
    <div className={`flex items-end gap-2 ${align}`}>
      {isBuyer ? (
        <AdminMediaImage
          src={message.sender.avatarUrl}
          alt={message.sender.fullName}
          className="h-7 w-7 shrink-0 rounded-full border border-gray-200 dark:border-gray-700"
          fallback={
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-light-100 text-[10px] font-semibold text-blue-light-700 dark:bg-blue-light-500/20 dark:text-blue-light-300">
              {(message.sender.fullName?.charAt(0) || "?").toUpperCase()}
            </span>
          }
        />
      ) : null}
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${bubbleClass}`}>
        <p className="text-[10px] font-medium opacity-80 mb-0.5">
          {message.sender.fullName} · {message.sender.role}
        </p>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {message.attachmentUrl && (
          <a
            href={message.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block text-xs underline"
          >
            Lampiran
          </a>
        )}
        <p className={`mt-1 text-[10px] ${isBuyer ? "text-gray-400" : "text-white/70"}`}>
          {formatTime(message.createdAt)}
          {message.editedAt ? " · diedit" : ""}
        </p>
      </div>
      {!isBuyer ? (
        <AdminMediaImage
          src={message.sender.avatarUrl}
          alt={message.sender.fullName}
          className="h-7 w-7 shrink-0 rounded-full border border-gray-200 dark:border-gray-700"
          fallback={
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-100 text-[10px] font-semibold text-success-700 dark:bg-success-500/20 dark:text-success-300">
              {(message.sender.fullName?.charAt(0) || "?").toUpperCase()}
            </span>
          }
        />
      ) : null}
    </div>
  );
}
