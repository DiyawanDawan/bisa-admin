import { ApiEnvelope, getApiBaseUrl } from "@/lib/api-client";

export async function fetchPublicApi<T>(path: string): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Respons server tidak valid");
  }

  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !body.meta?.success) {
    throw new Error(body.meta?.message ?? "Permintaan gagal");
  }

  return body;
}
