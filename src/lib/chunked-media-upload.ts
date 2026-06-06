import { apiGet, apiPost, getApiBaseUrl } from "@/lib/api-client";
import { getAccessToken } from "@/lib/session";

export interface UploadedMediaResult {
  path: string;
  url?: string;
}

interface InitUploadResponse {
  sessionId: string;
  uploadMode: "proxy" | "presigned";
  partSize: number;
  totalParts: number;
}

interface PresignPartResponse {
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
}

const CHUNK_TIMEOUT_MS = 120_000;

async function uploadPartProxy(
  uploadUrl: string,
  chunk: Blob,
  headers: Record<string, string>,
): Promise<string> {
  const token = getAccessToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHUNK_TIMEOUT_MS);

  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: chunk,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Upload chunk gagal (${response.status})`);
    }

    const body = (await response.json()) as {
      data?: { etag?: string };
    };
    if (body.data?.etag) return body.data.etag;

    const etag = response.headers.get("etag") ?? response.headers.get("ETag");
    if (etag) return etag.replace(/"/g, "");
    throw new Error("ETag tidak ditemukan pada response chunk");
  } finally {
    clearTimeout(timer);
  }
}

async function uploadPartPresigned(
  uploadUrl: string,
  chunk: Blob,
  headers: Record<string, string>,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHUNK_TIMEOUT_MS);

  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers,
      body: chunk,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Upload chunk gagal (${response.status})`);
    }

    const etag = response.headers.get("etag") ?? response.headers.get("ETag");
    if (etag) return etag.replace(/"/g, "");
    throw new Error("ETag tidak ditemukan pada response chunk");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Upload file via chunked multipart API (proxy mode di dev, presigned di prod).
 */
export async function uploadFileChunked(
  file: File,
  folder: string,
  onProgress?: (progress: number) => void,
): Promise<UploadedMediaResult> {
  const init = await apiPost<InitUploadResponse>("/media/uploads/init", {
    folder,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    totalBytes: file.size,
  });

  const { sessionId, partSize, totalParts, uploadMode } = init.data;
  const parts: { partNumber: number; etag: string }[] = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const start = (partNumber - 1) * partSize;
    const end = Math.min(start + partSize, file.size);
    const chunk = file.slice(start, end);

    const presign = await apiGet<PresignPartResponse>(
      `/media/uploads/${sessionId}/parts/${partNumber}/presign`,
    );

    let uploadUrl = presign.data.uploadUrl;
    if (uploadMode === "proxy" && uploadUrl.startsWith("/")) {
      uploadUrl = `${getApiBaseUrl()}${uploadUrl}`;
    }

    const etag =
      uploadMode === "proxy"
        ? await uploadPartProxy(uploadUrl, chunk, presign.data.headers)
        : await uploadPartPresigned(uploadUrl, chunk, presign.data.headers);

    parts.push({ partNumber, etag });
    onProgress?.(partNumber / totalParts);
  }

  const complete = await apiPost<UploadedMediaResult>(
    `/media/uploads/${sessionId}/complete`,
    { parts },
  );

  return complete.data;
}

export async function uploadFilesChunked(
  files: File[],
  folder: string,
  onProgress?: (completed: number, total: number, fileProgress: number) => void,
  maxConcurrent = 2,
): Promise<UploadedMediaResult[]> {
  const results: UploadedMediaResult[] = new Array(files.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < files.length) {
      const index = nextIndex++;
      const file = files[index];
      results[index] = await uploadFileChunked(file, folder, (fileProgress) => {
        onProgress?.(index, files.length, fileProgress);
      });
    }
  }

  const workers = Array.from(
    { length: Math.min(maxConcurrent, files.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}
