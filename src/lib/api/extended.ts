import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type {
  AdminOrderDetail,
  AdminOrderListItem,
  CartOverview,
  ChatInboxItem,
  ChatMessageItem,
  ChatStats,
  ChatThreadData,
  CrmContactDetail,
  CrmContactListItem,
  CrmNoteItem,
  CrmOverview,
  CrmStage,
  AdminIotDeviceItem,
  AdminIotProvisionResult,
  ForumCategoryOption,
  ForumPostAdmin,
  MarketTrendItem,
  OrderAnalytics,
  PolicyItem,
  WalletListItem,
} from "@/types/extended";
import type { RegionAdminList, RegionItem } from "@/types/content";

export async function fetchOrderAnalytics(): Promise<OrderAnalytics> {
  const res = await apiGet<OrderAnalytics>("/admin/orders/stats");
  return res.data;
}

export async function fetchAdminOrders(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  courierCode?: string;
  deliveryStatus?: string;
}): Promise<{ items: AdminOrderListItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.courierCode) query.set("courierCode", params.courierCode);
  if (params?.deliveryStatus) query.set("deliveryStatus", params.deliveryStatus);
  const qs = query.toString();
  const res = await apiGet<AdminOrderListItem[]>(
    `/admin/orders${qs ? `?${qs}` : ""}`,
  );
  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
  };
}

export async function fetchAdminOrderDetail(
  orderId: string,
): Promise<AdminOrderDetail> {
  const res = await apiGet<AdminOrderDetail>(`/admin/orders/${orderId}`);
  return res.data;
}

export async function fetchCartOverview(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<CartOverview & { total: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await apiGet<CartOverview>(`/admin/analytics/carts${qs ? `?${qs}` : ""}`);
  return {
    ...res.data,
    total: res.pagination?.total ?? res.data.items.length,
  };
}

export async function fetchAdminWallets(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ items: WalletListItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await apiGet<WalletListItem[]>(`/admin/wallets${qs ? `?${qs}` : ""}`);
  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
  };
}

export async function fetchForumPostsAdmin(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<{ items: ForumPostAdmin[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiGet<ForumPostAdmin[]>(`/admin/forum/posts${qs ? `?${qs}` : ""}`);
  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
  };
}

export async function fetchForumCategoriesAdmin(): Promise<ForumCategoryOption[]> {
  const res = await apiGet<ForumCategoryOption[]>("/admin/forum/categories");
  return res.data;
}

export async function fetchForumPostAdmin(id: string): Promise<ForumPostAdmin> {
  const res = await apiGet<ForumPostAdmin>(`/admin/forum/posts/${id}`);
  return res.data;
}

export async function createForumPostAdmin(payload: {
  title: string;
  content: string;
  status?: string;
  categoryId?: string;
  authorUserId?: string;
  tags?: string[];
}): Promise<ForumPostAdmin> {
  const res = await apiPost<ForumPostAdmin>("/admin/forum/posts", payload);
  return res.data;
}

export async function updateForumPostAdmin(
  id: string,
  payload: {
    title?: string;
    content?: string;
    status?: string;
    categoryId?: string | null;
    tags?: string[];
  },
): Promise<ForumPostAdmin> {
  const res = await apiPatch<ForumPostAdmin>(`/admin/forum/posts/${id}`, payload);
  return res.data;
}

/** @deprecated gunakan updateForumPostAdmin */
export async function moderateForumPost(
  id: string,
  status: string,
): Promise<void> {
  await updateForumPostAdmin(id, { status });
}

export async function fetchPoliciesAdmin(): Promise<PolicyItem[]> {
  const res = await apiGet<PolicyItem[]>("/admin/policies");
  return res.data;
}

export async function updatePolicyAdmin(
  id: string,
  payload: { content?: string; version?: string; isActive?: boolean },
): Promise<PolicyItem> {
  const res = await apiPatch<PolicyItem>(`/admin/policies/${id}`, payload);
  return res.data;
}

export async function fetchMarketTrendsAdmin(
  category?: string,
): Promise<MarketTrendItem[]> {
  const qs = category ? `?category=${category}` : "";
  const res = await apiGet<MarketTrendItem[]>(`/admin/market/trends${qs}`);
  return res.data;
}

export async function fetchAdminRegions(params: {
  level: string;
  parentId?: string;
  search?: string;
}): Promise<RegionAdminList> {
  const query = new URLSearchParams({ level: params.level });
  if (params.parentId) query.set("parentId", params.parentId);
  if (params.search) query.set("search", params.search);
  const res = await apiGet<RegionAdminList>(`/admin/gis/regions?${query.toString()}`);
  return res.data;
}

export async function createRegion(payload: {
  level: string;
  parentId?: string;
  name: string;
  code: string;
  shortCode?: string;
  continent?: string;
  villageType?: string;
}): Promise<RegionItem> {
  const res = await apiPost<RegionItem>("/admin/gis/regions", payload);
  return res.data;
}

export async function updateRegion(
  id: string,
  payload: {
    level: string;
    name?: string;
    code?: string;
    shortCode?: string;
    continent?: string;
    villageType?: string;
  },
): Promise<RegionItem> {
  const res = await apiPatch<RegionItem>(`/admin/gis/regions/${id}`, payload);
  return res.data;
}

export async function deleteRegion(id: string, level: string): Promise<void> {
  await apiDelete(`/admin/gis/regions/${id}?level=${level}`);
}

export async function fetchChatStats(): Promise<ChatStats> {
  const res = await apiGet<ChatStats>("/admin/chat/stats");
  return res.data;
}

export async function fetchChatInbox(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<{ items: ChatInboxItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiGet<ChatInboxItem[]>(`/admin/chat${qs ? `?${qs}` : ""}`);
  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
  };
}

export async function fetchChatThread(
  negotiationId: string,
  params?: { page?: number; limit?: number },
): Promise<ChatThreadData> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiGet<ChatThreadData>(
    `/admin/chat/${negotiationId}${qs ? `?${qs}` : ""}`,
  );
  return res.data;
}

export async function sendAdminChatMessage(
  negotiationId: string,
  content: string,
): Promise<ChatMessageItem> {
  const res = await apiPost<ChatMessageItem>(
    `/admin/chat/${negotiationId}/messages`,
    { content },
  );
  return res.data;
}

export async function fetchCrmOverview(): Promise<CrmOverview> {
  const res = await apiGet<CrmOverview>("/admin/crm/overview");
  return res.data;
}

export async function fetchCrmContacts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  stage?: CrmStage;
}): Promise<{ items: CrmContactListItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.role) query.set("role", params.role);
  if (params?.stage) query.set("stage", params.stage);
  const qs = query.toString();
  const res = await apiGet<CrmContactListItem[]>(`/admin/crm/contacts${qs ? `?${qs}` : ""}`);
  return { items: res.data, total: res.pagination?.total ?? res.data.length };
}

export async function fetchCrmContactDetail(userId: string): Promise<CrmContactDetail> {
  const res = await apiGet<CrmContactDetail>(`/admin/crm/contacts/${userId}`);
  return res.data;
}

export async function createCrmNote(
  userId: string,
  payload: { content: string; noteType?: string },
): Promise<CrmNoteItem> {
  const res = await apiPost<CrmNoteItem>(`/admin/crm/contacts/${userId}/notes`, payload);
  return res.data;
}

export async function updateCrmContact(
  userId: string,
  payload: { stage?: CrmStage; nextFollowUpAt?: string | null },
): Promise<{ stage: CrmStage; nextFollowUpAt: string | null }> {
  const res = await apiPatch<{ stage: CrmStage; nextFollowUpAt: string | null }>(
    `/admin/crm/contacts/${userId}`,
    payload,
  );
  return res.data;
}

export async function fetchAdminIotDevices(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ items: AdminIotDeviceItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await apiGet<AdminIotDeviceItem[]>(
    `/admin/iot/devices${qs ? `?${qs}` : ""}`,
  );
  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
  };
}

export async function createAdminIotDevice(payload: {
  serialNumber: string;
  name?: string;
}): Promise<AdminIotProvisionResult> {
  const res = await apiPost<AdminIotProvisionResult>("/admin/iot/devices", payload);
  return res.data;
}
