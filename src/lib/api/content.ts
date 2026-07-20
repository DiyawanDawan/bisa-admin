import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";
import type { ArticleItem, FaqItem, PostStatus, RegionItem } from "@/types/content";

export async function fetchArticles(params?: {
  page?: number;
  limit?: number;
  status?: PostStatus;
  search?: string;
}): Promise<{ items: ArticleItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await apiGet<ArticleItem[]>(`/articles${qs ? `?${qs}` : ""}`);
  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
  };
}

export async function createArticle(payload: {
  title: string;
  content: string;
  categoryId?: string;
  imageUrl?: string;
  status?: PostStatus;
}): Promise<ArticleItem> {
  const res = await apiPost<ArticleItem>("/articles", payload);
  return res.data;
}

export async function updateArticle(
  id: string,
  payload: Partial<{
    title: string;
    content: string;
    categoryId: string;
    imageUrl: string;
    status: PostStatus;
  }>,
): Promise<ArticleItem> {
  const res = await apiPut<ArticleItem>(`/articles/${id}`, payload);
  return res.data;
}

export async function deleteArticle(id: string): Promise<void> {
  await apiDelete(`/articles/${id}`);
}

export async function fetchFaqs(params?: {
  page?: number;
  limit?: number;
  includeInactive?: boolean;
  search?: string;
}): Promise<{ items: FaqItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.includeInactive) query.set("includeInactive", "true");
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await apiGet<FaqItem[]>(`/faqs${qs ? `?${qs}` : ""}`);
  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
  };
}

export async function createFaq(payload: {
  question: string;
  answer: string;
  order?: number;
  isActive?: boolean;
}): Promise<FaqItem> {
  const res = await apiPost<FaqItem>("/faqs", payload);
  return res.data;
}

export async function updateFaq(
  id: string,
  payload: Partial<{
    question: string;
    answer: string;
    order: number;
    isActive: boolean;
  }>,
): Promise<FaqItem> {
  const res = await apiPut<FaqItem>(`/faqs/${id}`, payload);
  return res.data;
}

export async function deleteFaq(id: string): Promise<void> {
  await apiDelete(`/faqs/${id}`);
}

export async function fetchRegions(
  level: string,
  parentId?: string,
): Promise<RegionItem[]> {
  const query = new URLSearchParams({ level });
  if (parentId) query.set("parentId", parentId);
  const res = await apiGet<RegionItem[]>(`/gis?${query.toString()}`, false);
  return res.data;
}
