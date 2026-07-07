import { apiDelete, apiGet, apiPost, apiPostForm } from "@/lib/api-client";

export type KnowledgeDocStatus = "PENDING" | "INDEXED" | "FAILED";
export type KnowledgeSourceType = "PDF" | "TXT" | "MD" | "TEXT" | "CSV";

export interface KnowledgeDocumentItem {
  id: string;
  title: string;
  description?: string | null;
  sourceType: KnowledgeSourceType;
  fileName?: string | null;
  mimeType?: string | null;
  storageKey?: string | null;
  chromaCollection: string;
  chunkCount: number;
  status: KnowledgeDocStatus;
  errorMessage?: string | null;
  uploadedById?: string | null;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: { id: string; fullName: string; email: string } | null;
}

export interface KnowledgeListResponse {
  items: KnowledgeDocumentItem[];
  total: number;
  page: number;
  limit: number;
}

export interface KnowledgeStats {
  total: number;
  indexed: number;
  failed: number;
  pending: number;
  chromaConfigured: boolean;
  chromaConfigIssue?: string | null;
}

export async function fetchKnowledgeStats(): Promise<KnowledgeStats> {
  const res = await apiGet<KnowledgeStats>("/admin/knowledge/stats");
  return (
    res.data ?? {
      total: 0,
      indexed: 0,
      failed: 0,
      pending: 0,
      chromaConfigured: false,
    }
  );
}

function normalizeKnowledgeItems(data: unknown): KnowledgeDocumentItem[] {
  if (Array.isArray(data)) {
    return data as KnowledgeDocumentItem[];
  }
  if (data && typeof data === "object" && "items" in data) {
    const nested = (data as { items?: unknown }).items;
    if (Array.isArray(nested)) {
      return nested as KnowledgeDocumentItem[];
    }
  }
  return [];
}

export async function fetchKnowledgeDocuments(params?: {
  page?: number;
  limit?: number;
}): Promise<KnowledgeListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  try {
    const res = await apiGet<{ items?: KnowledgeDocumentItem[] } | KnowledgeDocumentItem[]>(
      `/admin/knowledge${qs ? `?${qs}` : ""}`,
    );
    const items = normalizeKnowledgeItems(res?.data);
    return {
      items,
      total: res?.pagination?.total ?? items.length,
      page: res?.pagination?.page ?? params?.page ?? 1,
      limit: res?.pagination?.limit ?? params?.limit ?? 20,
    };
  } catch {
    return {
      items: [],
      total: 0,
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    };
  }
}

export async function createKnowledgeText(payload: {
  title: string;
  content: string;
  description?: string;
}): Promise<KnowledgeDocumentItem> {
  const res = await apiPost<KnowledgeDocumentItem>("/admin/knowledge/text", payload);
  return res.data;
}

export async function uploadKnowledgeFile(payload: {
  title: string;
  description?: string;
  file: File;
}): Promise<KnowledgeDocumentItem> {
  const form = new FormData();
  form.append("title", payload.title);
  if (payload.description) form.append("description", payload.description);
  form.append("file", payload.file);
  const res = await apiPostForm<KnowledgeDocumentItem>("/admin/knowledge/upload", form);
  return res.data;
}

export async function deleteKnowledgeDocument(id: string): Promise<void> {
  await apiDelete(`/admin/knowledge/${id}`);
}

export async function reindexKnowledgeDocument(id: string): Promise<KnowledgeDocumentItem> {
  const res = await apiPost<KnowledgeDocumentItem>(`/admin/knowledge/${id}/reindex`, {});
  return res.data;
}
