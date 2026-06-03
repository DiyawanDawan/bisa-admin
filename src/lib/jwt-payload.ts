/** Decode JWT payload without signature verification (edge middleware hint only). */
export function decodeJwtPayload(
  token: string,
): { role?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(json) as { role?: string; exp?: number };
  } catch {
    return null;
  }
}

export function isAdminAccessToken(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || payload.role !== "ADMIN") return false;
  if (payload.exp && payload.exp * 1000 < Date.now()) return false;
  return true;
}
