export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatTons(value: number): string {
  return `${formatNumber(value)} ton`;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Transfer Bank / VA",
  E_WALLET: "E-Wallet",
  QRIS: "QRIS",
  CREDIT_CARD: "Kartu Kredit",
  CASH: "Tunai",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu",
  SUCCESS: "Lunas",
  PAID: "Lunas",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
  REFUNDED: "Direfund",
  COMPLETED: "Selesai",
  PROCESSING: "Diproses",
  ESCROW_HELD: "Escrow ditahan",
  RELEASED: "Dana dilepas",
};

/** Label grup metode (BANK_TRANSFER, QRIS, …). */
export function formatPaymentMethod(method?: string | null): string {
  if (!method) return "Belum dipilih";
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

/** Label status pembayaran Xendit/internal. */
export function formatPaymentStatus(status?: string | null): string {
  if (!status) return "—";
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

/**
 * Ringkas metode yang dipakai buyer: nama channel (BCA, OVO) + grup jika ada.
 * Contoh: "Mandiri Virtual Account · Transfer Bank / VA"
 */
export function formatOrderPayment(tx?: {
  paymentMethod?: string | null;
  paymentChannel?: { name?: string | null; code?: string | null; group?: string | null } | null;
} | null): string {
  if (!tx) return "Belum ada transaksi";
  const channel = tx.paymentChannel?.name?.trim() || tx.paymentChannel?.code?.trim();
  const group = formatPaymentMethod(
    tx.paymentChannel?.group ?? tx.paymentMethod,
  );
  if (channel && tx.paymentMethod) {
    const groupOnly = formatPaymentMethod(tx.paymentMethod);
    if (channel.toLowerCase() === groupOnly.toLowerCase()) return channel;
    return `${channel} · ${group}`;
  }
  if (channel) return channel;
  return group;
}
