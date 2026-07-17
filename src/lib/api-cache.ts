import type { ApiEnvelope } from "@/lib/api-client";

/**
 * Soft-cache GET admin untuk endpoint agregat (dashboard/CRM/finance stats).
 * Tidak cache stok produk, daftar order live, chat, payout/KYC queue, dll.
 */

const CACHEABLE_PREFIXES = [
  "/admin/dashboard/",
  "/admin/crm/overview",
  "/admin/finance/stats",
  "/admin/finance/fees",
  "/admin/orders/stats",
  "/admin/orders/integration-health",
  "/admin/users/stats",
] as const;

/** Prefix yang selalu bypass cache (data berubah cepat). */
const NEVER_CACHE_PREFIXES = [
  "/admin/products",
  "/admin/orders/disputes",
  "/admin/finance/payouts",
  "/admin/users/verifications",
  "/admin/crm/contacts",
  "/admin/chat",
  "/admin/support",
  "/admin/iot",
] as const;

const DEFAULT_TTL_MS = 45_000;

type CacheEntry = {
  expiresAt: number;
  value: ApiEnvelope<unknown>;
};

const responseCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<ApiEnvelope<unknown>>>();

function pathOnly(path: string): string {
  return path.split("?")[0] ?? path;
}

export function isAdminGetCacheable(path: string): boolean {
  const clean = pathOnly(path);

  if (
    clean.startsWith("/admin/orders/stats") ||
    clean.startsWith("/admin/orders/integration-health")
  ) {
    return true;
  }

  if (NEVER_CACHE_PREFIXES.some((p) => clean.startsWith(p))) {
    return false;
  }

  // Daftar order live — jangan cache
  if (clean === "/admin/orders" || clean.startsWith("/admin/orders/")) {
    return false;
  }

  return CACHEABLE_PREFIXES.some((p) => clean.startsWith(p));
}

export async function withAdminGetCache<T>(
  path: string,
  loader: () => Promise<ApiEnvelope<T>>,
  ttlMs = DEFAULT_TTL_MS,
): Promise<ApiEnvelope<T>> {
  if (!isAdminGetCacheable(path)) {
    return loader();
  }

  const now = Date.now();
  const hit = responseCache.get(path);
  if (hit && hit.expiresAt > now) {
    return hit.value as ApiEnvelope<T>;
  }

  const pending = inflight.get(path);
  if (pending) {
    return pending as Promise<ApiEnvelope<T>>;
  }

  const request = loader()
    .then((value) => {
      responseCache.set(path, {
        expiresAt: Date.now() + ttlMs,
        value: value as ApiEnvelope<unknown>,
      });
      return value;
    })
    .finally(() => {
      inflight.delete(path);
    });

  inflight.set(path, request as Promise<ApiEnvelope<unknown>>);
  return request;
}

/** Panggil setelah mutasi yang mengubah dashboard/fees. */
export function invalidateAdminGetCache(match?: string): void {
  if (!match) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.includes(match)) responseCache.delete(key);
  }
}
