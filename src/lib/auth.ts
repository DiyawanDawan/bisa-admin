import type { AdminUser, LoginResponse } from "@/types/admin";
import { apiPost, ApiError } from "@/lib/api-client";
import {
  clearSession,
  getRefreshToken,
  setSession,
} from "@/lib/session";

export { getStoredUser, isAdminSessionValid } from "@/lib/session";
export { refreshAccessToken } from "@/lib/token-refresh";

export async function loginAdmin(
  email: string,
  password: string,
): Promise<AdminUser> {
  const response = await apiPost<LoginResponse>(
    "/auth/login",
    { email, password },
    false,
  );

  const { user, token } = response.data;

  if (user.role !== "ADMIN") {
    throw new ApiError(403, "Akun ini bukan admin BISA.");
  }

  setSession(token.accessToken, token.refreshToken, user);
  return user;
}

export async function logoutAdmin(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiPost("/auth/logout", { refreshToken }, true);
    }
  } catch {
    // Clear local session even if backend logout fails
  } finally {
    clearSession();
  }
}
