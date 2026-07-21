/**
 * Resolve media path from API to display URL.
 * API returns R2 keys only (e.g. products/seed-stock/foo.jpg).
 * Seed avatars use external/loremflickr/... → Picsum (same as backend).
 */
function mediaBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
  const api = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  return api.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
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
  "branding/",
  "product-certificates/",
  "store-certificates/",
];

const LOREM_FLICKR_PREFIX = "external/loremflickr/";

function isStorageObjectPath(path: string): boolean {
  return STORAGE_PREFIXES.some((p) => path.startsWith(p));
}

/** Mirror Backend loremFlickrDbPathToUrl — LoremFlickr hotlink often 404/5xx. */
function loremFlickrPathToPicsum(dbPath: string): string | null {
  if (!dbPath.startsWith(LOREM_FLICKR_PREFIX)) return null;
  const segments = dbPath.slice(LOREM_FLICKR_PREFIX.length).split("/").filter(Boolean);
  if (segments.length < 3) return null;

  const width = segments[0];
  const height = segments[1];
  const keywordParts: string[] = [];
  let i = 2;
  while (i < segments.length && segments[i] !== "lock" && segments[i] !== "random") {
    keywordParts.push(segments[i]);
    i += 1;
  }

  let lock = "0";
  let random = "";
  if (segments[i] === "lock" && segments[i + 1]) {
    lock = segments[i + 1];
    i += 2;
  }
  if (segments[i] === "random" && segments[i + 1]) {
    random = segments[i + 1];
  }

  const kw = keywordParts
    .join("-")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 24);
  const seed = `bisa-lf-${lock}${random ? `-r${random}` : ""}${kw ? `-${kw}` : ""}`.replace(
    /[^a-zA-Z0-9_-]/g,
    "",
  ).slice(0, 64) || "bisa";
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
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

  const picsum = loremFlickrPathToPicsum(value);
  if (picsum) return picsum;

  // Other external/* paths are not served from the admin origin.
  if (value.startsWith("external/")) return null;

  const base = mediaBaseUrl();
  if (!base) return value;

  let normalized = value.replace(/^\//, "");
  if (normalized.startsWith("api/v1/storage/assets/")) {
    normalized = normalized.slice("api/v1/storage/assets/".length);
  }
  return `${base}/${normalized}`;
}
