import { refreshAccessToken } from "@/lib/token-refresh";
import {
  clearSession,
  getAccessToken,
} from "@/lib/session";

export class ApiError extends Error {
  status: number;
  data: unknown;
  isRateLimited: boolean;

  constructor(
    status: number,
    message: string,
    data?: unknown,
    isRateLimited = false,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data ?? null;
    this.isRateLimited = isRateLimited;
  }
}

export interface ApiMeta {
  success: boolean;
  status: number;
  message: string;
}

export interface ApiEnvelope<T> {
  meta: ApiMeta;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export function getApiBaseUrl(): string {
  return API_BASE;
}

function redirectToSignIn(): void {
  if (typeof window === "undefined") return;
  clearSession();
  const redirect = encodeURIComponent(window.location.pathname);
  window.location.href = `/signin?redirect=${redirect}`;
}

async function parseJsonResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
  try {
    return (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(response.status, "Respons server tidak valid");
  }
}

async function executeRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean },
  retried = false,
): Promise<ApiEnvelope<T>> {
  const { auth = true, headers: customHeaders, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(customHeaders as Record<string, string>),
  };

  const hasBody = fetchOptions.body !== undefined && fetchOptions.body !== null;
  if (hasBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 429) {
    throw new ApiError(
      429,
      "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
      null,
      true,
    );
  }

  const isJson =
    response.headers.get("content-type")?.includes("application/json") ??
    false;

  if (!isJson) {
    if (!response.ok) {
      throw new ApiError(response.status, "Permintaan gagal");
    }
    throw new ApiError(response.status, "Format respons tidak didukung");
  }

  const body = await parseJsonResponse<T>(response);

  if (response.status === 401 && auth && !retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return executeRequest<T>(path, options, true);
    }
    redirectToSignIn();
    throw new ApiError(401, "Sesi berakhir. Silakan masuk kembali.");
  }

  if (response.status === 403 && auth) {
    const message = body.meta?.message ?? "Akses ditolak.";
    const isAuthFailure =
      message.toLowerCase().includes("token") ||
      message.toLowerCase().includes("sesi") ||
      message.toLowerCase().includes("unauthorized") ||
      message.toLowerCase().includes("login");
    if (isAuthFailure) {
      redirectToSignIn();
    }
    throw new ApiError(403, message, body.data);
  }

  if (!response.ok || !body.meta?.success) {
    throw new ApiError(
      response.status,
      body.meta?.message ?? "Permintaan gagal",
      body.data,
    );
  }

  return body;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<ApiEnvelope<T>> {
  return executeRequest<T>(path, options);
}

export async function apiGet<T>(
  path: string,
  auth = true,
): Promise<ApiEnvelope<T>> {
  return apiRequest<T>(path, { method: "GET", auth });
}

export async function apiPost<T>(
  path: string,
  payload: unknown,
  auth = true,
): Promise<ApiEnvelope<T>> {
  return apiRequest<T>(path, {
    method: "POST",
    body: JSON.stringify(payload),
    auth,
  });
}

export async function apiPatch<T>(
  path: string,
  payload: unknown,
  auth = true,
): Promise<ApiEnvelope<T>> {
  return apiRequest<T>(path, {
    method: "PATCH",
    body: JSON.stringify(payload),
    auth,
  });
}

export async function apiPut<T>(
  path: string,
  payload: unknown,
  auth = true,
): Promise<ApiEnvelope<T>> {
  return apiRequest<T>(path, {
    method: "PUT",
    body: JSON.stringify(payload),
    auth,
  });
}

export async function apiDelete<T>(
  path: string,
  auth = true,
): Promise<ApiEnvelope<T>> {
  return apiRequest<T>(path, { method: "DELETE", auth });
}

/** CSV export — returns blob, not JSON envelope */
export async function apiDownload(
  path: string,
  filename: string,
): Promise<void> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 429) {
    throw new ApiError(
      429,
      "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
      null,
      true,
    );
  }

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiDownload(path, filename);
    }
    redirectToSignIn();
    throw new ApiError(401, "Sesi berakhir.");
  }

  if (!response.ok) {
    throw new ApiError(response.status, "Gagal mengunduh file.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
