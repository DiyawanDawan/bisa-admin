/**
 * Resolve media path from API to display URL.
 * API returns R2 keys only (e.g. products/seed-stock/foo.jpg).
 */
function mediaBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
  const api = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  return api.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
}

function useDirectCdn(base: string): boolean {
  return base.toLowerCase().includes("cdn.");
}

const STORAGE_PREFIXES = [
  "products/",
  "avatars/",
  "store-banners/",
  "general/",
  "forum/",
  "negotiations/",
  "articles/",
  "categories/",
];

function isStorageObjectPath(path: string): boolean {
  return STORAGE_PREFIXES.some((p) => path.startsWith(p));
}

function extractStorageKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const assetsIdx = parsed.pathname.indexOf("/storage/assets/");
    if (assetsIdx !== -1) {
      return decodeURIComponent(
        parsed.pathname.slice(assetsIdx + "/storage/assets/".length),
      );
    }
    const pathKey = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    return isStorageObjectPath(pathKey) ? pathKey : null;
  } catch {
    return null;
  }
}

export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  const value = path.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    const key = extractStorageKeyFromUrl(value);
    if (key) return resolveMediaUrl(key);
    return value;
  }
  if (value.startsWith("external/")) return value;

  const base = mediaBaseUrl();
  if (!base) return value;

  const normalized = value.replace(/^\//, "");
  if (useDirectCdn(base)) {
    return `${base}/${normalized}`;
  }
  return `${base}/api/v1/storage/assets/${normalized}`;
}
