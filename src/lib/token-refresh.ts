import { getRefreshToken, updateTokens } from "@/lib/session";

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

  try {
    const response = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ token: refreshToken }),
    });

    if (!response.ok) return false;

    const body = (await response.json()) as {
      meta: { success: boolean };
      data: { accessToken: string; refreshToken: string };
    };

    if (!body.meta?.success) return false;

    updateTokens(body.data.accessToken, body.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}
