import type {
  BroadcastPayload,
  BroadcastHistoryItem,
  BroadcastResult,
  NotificationAdminStats,
  CategoryItem,
  CategoryType,
  DashboardStats,
  DisputeOrder,
  DisputeResolution,
  DisputeMediationMeta,
  DisputeChatThread,
  DisputeChatMessage,
  FinanceStats,
  KYCQueueItem,
  PayoutItem,
  PayoutStatus,
  PlatformFee,
  ProductListItem,
  ProductCertificateItem,
  ProductCertificateStatus,
  ProductStatus,
  RevenueChartData,
  ChartPoint,
  UserAnalyticsData,
  UserAnalyticsStats,
  DonutChartData,
  TopSuppliersChartData,
  DashboardPlatformAnalytics,
  DashboardVisualGallery,
  TransactionItem,
  UserDossier,
  UserDossierApiResponse,
  UserListItem,
  UserStatus,
  VerificationStatus,
  PartnershipContract,
  PartnershipListFilter,
  PartnershipStatus,
} from "@/types/admin";
import { apiDownload, apiGet, apiPatch, apiPost, apiPut, apiRequest } from "@/lib/api-client";

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await apiGet<DashboardStats>("/admin/dashboard/stats");
  return res.data;
}

export async function fetchRevenueChart(): Promise<RevenueChartData> {
  const res = await apiGet<RevenueChartData>(
    "/admin/dashboard/charts/revenue",
  );
  return res.data;
}

export async function fetchBiomassTrend(): Promise<ChartPoint[]> {
  const res = await apiGet<ChartPoint[]>("/admin/dashboard/biomass-trend");
  return res.data ?? [];
}

export async function fetchUserAnalytics(): Promise<UserAnalyticsData> {
  const res = await apiGet<UserAnalyticsData>("/admin/dashboard/charts/users");
  return res.data;
}

export async function fetchUserAnalyticsStats(): Promise<UserAnalyticsStats> {
  const res = await apiGet<UserAnalyticsStats>("/admin/users/stats");
  return res.data;
}

export async function fetchCategoryAnalytics(): Promise<DonutChartData> {
  const res = await apiGet<DonutChartData>(
    "/admin/dashboard/charts/categories",
  );
  return res.data;
}

export async function fetchTopSuppliers(): Promise<TopSuppliersChartData> {
  const res = await apiGet<TopSuppliersChartData>(
    "/admin/dashboard/charts/performance",
  );
  return res.data;
}

export async function fetchDashboardPlatformAnalytics(): Promise<DashboardPlatformAnalytics> {
  const res = await apiGet<DashboardPlatformAnalytics>(
    "/admin/dashboard/analytics/platform",
  );
  return res.data;
}

export async function fetchDashboardVisualGallery(): Promise<DashboardVisualGallery> {
  const res = await apiGet<DashboardVisualGallery>("/admin/dashboard/visual-gallery");
  return res.data;
}

export async function fetchIntegrationHealth(): Promise<{
  generatedAt: string;
  summary: {
    pendingOver24h: number;
    missingShippingMeta: number;
    failedPayments7d: number;
    unreadNotifications: number;
  };
  status: "HEALTHY" | "NEEDS_ATTENTION";
}> {
  const res = await apiGet<{
    generatedAt: string;
    summary: {
      pendingOver24h: number;
      missingShippingMeta: number;
      failedPayments7d: number;
      unreadNotifications: number;
    };
    status: "HEALTHY" | "NEEDS_ATTENTION";
  }>("/admin/orders/integration-health");
  return res.data;
}

export async function fetchDisputes(params?: {
  page?: number;
  limit?: number;
  search?: string;
  statusFilter?: string;
}): Promise<{ items: DisputeOrder[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.statusFilter) query.set("statusFilter", params.statusFilter);

  const qs = query.toString();
  const res = await apiGet<DisputeOrder[]>(
    `/admin/orders/disputes${qs ? `?${qs}` : ""}`,
  );

  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 10,
  };
}

export async function fetchDisputeDetail(orderId: string): Promise<DisputeOrder> {
  const res = await apiGet<DisputeOrder>(`/admin/orders/disputes/${orderId}`);
  return res.data;
}

export async function resolveDispute(
  orderId: string,
  resolution: DisputeResolution,
  note: string,
): Promise<unknown> {
  const res = await apiPost(`/admin/orders/${orderId}/resolve`, {
    resolution,
    note,
  });
  return res.data;
}

export async function fetchDisputeChat(
  orderId: string,
  params?: { page?: number; limit?: number },
): Promise<DisputeChatThread> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiGet<DisputeChatThread>(
    `/admin/orders/disputes/${orderId}/chat${qs ? `?${qs}` : ""}`,
  );
  return res.data;
}

export async function sendDisputeMediationMessage(
  orderId: string,
  content: string,
): Promise<DisputeChatMessage> {
  const res = await apiPost<DisputeChatMessage>(
    `/admin/orders/disputes/${orderId}/chat/messages`,
    { content },
  );
  return res.data;
}

export async function startDisputeMediation(
  orderId: string,
): Promise<DisputeMediationMeta> {
  const res = await apiPost<DisputeMediationMeta>(
    `/admin/orders/disputes/${orderId}/mediation/start`,
    {},
  );
  return res.data;
}

export async function markDisputeReadyToResolve(
  orderId: string,
): Promise<DisputeMediationMeta> {
  const res = await apiPost<DisputeMediationMeta>(
    `/admin/orders/disputes/${orderId}/mediation/ready`,
    {},
  );
  return res.data;
}

export async function fetchUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}): Promise<{ items: UserListItem[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.role) query.set("role", params.role);
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  const res = await apiGet<UserListItem[]>(
    `/admin/users${qs ? `?${qs}` : ""}`,
  );

  return {
    items: res.data ?? [],
    total: res.pagination?.total ?? (res.data?.length ?? 0),
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 10,
  };
}

export async function fetchUserDossier(
  userId: string,
  options?: { unmask?: boolean },
): Promise<UserDossier> {
  const qs = options?.unmask ? "?unmask=true" : "";
  const res = await apiGet<UserDossierApiResponse>(
    `/admin/users/${userId}/dossier${qs}`,
  );
  const { profile, stats, recentOrders, readiness } = res.data;
  type PayoutRow = {
    id: string;
    accountNumber: string;
    accountName?: string;
    accountHolderName?: string;
    isMain: boolean;
    bank?: { name: string; code?: string };
  };
  return {
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    role: profile.role,
    status: profile.status,
    tier: profile.tier,
    createdAt: profile.createdAt,
    isEmailVerified: profile.isEmailVerified,
    isPhoneVerified: profile.isPhoneVerified,
    avatarUrl: profile.avatarUrl ?? null,
    profile: profile.profile,
    wallet: profile.wallet ?? null,
    payoutAccounts: (profile.payoutAccounts ?? []).map((acc: PayoutRow) => ({
      id: acc.id,
      accountNumber: acc.accountNumber,
      accountHolderName: acc.accountHolderName ?? acc.accountName ?? "—",
      isMain: acc.isMain,
      bank: acc.bank,
    })),
    verification: profile.verification,
    recentOrders,
    readiness: readiness ?? null,
    _count: {
      ordersAsBuyer: stats.totalBuyerOrders,
      ordersAsSeller: stats.totalSellerOrders,
      products: stats.totalProducts,
    },
  };
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus,
): Promise<unknown> {
  const res = await apiPatch(`/admin/users/${userId}/status`, { status });
  return res.data;
}

export async function fetchKYCQueue(params?: {
  page?: number;
  limit?: number;
  status?: VerificationStatus;
}): Promise<{ items: KYCQueueItem[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  const res = await apiGet<KYCQueueItem[]>(
    `/admin/users/verifications${qs ? `?${qs}` : ""}`,
  );

  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 10,
  };
}

export async function reviewKYC(
  userId: string,
  status: "VERIFIED" | "REJECTED",
  rejectionReason?: string,
): Promise<unknown> {
  const res = await apiPatch("/admin/users/verifications/review", {
    userId,
    status,
    rejectionReason,
  });
  return res.data;
}

// --- Products ---

export async function fetchProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
}): Promise<{ items: ProductListItem[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiGet<ProductListItem[]>(`/admin/products${qs ? `?${qs}` : ""}`);
  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 10,
  };
}

export async function moderateProduct(
  productId: string,
  status: ProductStatus,
  reason?: string,
): Promise<unknown> {
  const body: { status: ProductStatus; reason?: string } = { status };
  if (reason?.trim()) {
    body.reason = reason.trim();
  }
  const res = await apiPatch(`/admin/products/${productId}/moderate`, body);
  return res.data;
}

export async function certifyProduct(
  productId: string,
  isCertified: boolean,
): Promise<unknown> {
  const res = await apiPatch(`/admin/products/${productId}/certify`, { isCertified });
  return res.data;
}

export async function fetchProductCertificates(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductCertificateStatus;
}): Promise<{ items: ProductCertificateItem[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiGet<ProductCertificateItem[]>(
    `/admin/products/certificates${qs ? `?${qs}` : ""}`,
  );
  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 20,
  };
}

export async function fetchProductCertificate(id: string): Promise<ProductCertificateItem> {
  const res = await apiGet<ProductCertificateItem>(`/admin/products/certificates/${id}`);
  return res.data;
}

export async function reviewProductCertificate(
  id: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string,
): Promise<ProductCertificateItem> {
  const res = await apiPatch<ProductCertificateItem>(
    `/admin/products/certificates/${id}/review`,
    { status, rejectionReason },
  );
  return res.data;
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await apiGet<CategoryItem[]>("/admin/products/categories");
  return res.data;
}

export async function createCategory(payload: {
  name: string;
  description?: string;
  categoryType: CategoryType;
}): Promise<unknown> {
  const res = await apiPost("/admin/products/categories", payload);
  return res.data;
}

export async function updateCategory(
  id: string,
  payload: { name: string; description?: string; categoryType: CategoryType },
): Promise<unknown> {
  const res = await apiPut(`/admin/products/categories/${id}`, payload);
  return res.data;
}

// --- Finance ---

export async function fetchFinanceStats(): Promise<FinanceStats> {
  const res = await apiGet<FinanceStats>("/admin/finance/stats");
  return res.data;
}

export async function fetchTransactions(params?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
}): Promise<{ items: TransactionItem[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.type) query.set("type", params.type);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiGet<TransactionItem[]>(
    `/admin/finance/transactions${qs ? `?${qs}` : ""}`,
  );
  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 10,
  };
}

export async function fetchFees(): Promise<PlatformFee[]> {
  const res = await apiGet<PlatformFee[]>("/admin/finance/fees");
  return res.data;
}

export async function createFee(payload: {
  name: string;
  amount: number;
  type: string;
  description?: string;
  isActive?: boolean;
}): Promise<PlatformFee> {
  const res = await apiPost<PlatformFee>("/admin/finance/fees", payload);
  return res.data;
}

export async function updateFee(
  id: string,
  payload: { amount?: number; isActive?: boolean },
): Promise<unknown> {
  const res = await apiPatch(`/admin/finance/fees/${id}`, payload);
  return res.data;
}

export async function fetchPayouts(params?: {
  page?: number;
  limit?: number;
}): Promise<{ items: PayoutItem[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiGet<PayoutItem[]>(`/admin/finance/payouts${qs ? `?${qs}` : ""}`);
  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 10,
  };
}

export async function approvePayout(
  id: string,
  status: PayoutStatus,
  note?: string,
): Promise<unknown> {
  const res = await apiPatch(`/admin/finance/payouts/${id}/approve`, { status, note });
  return res.data;
}

export async function exportFinanceReport(
  startDate: string,
  endDate: string,
): Promise<void> {
  await apiDownload(
    `/admin/finance/reports/export?startDate=${startDate}&endDate=${endDate}`,
    `Laporan_Transaksi_${startDate}_${endDate}.csv`,
  );
}

// --- Notifications ---

export async function fetchNotificationStats(): Promise<NotificationAdminStats> {
  const res = await apiGet<NotificationAdminStats>("/admin/notifications/stats");
  return res.data;
}

export async function fetchBroadcastHistory(params?: {
  page?: number;
  limit?: number;
}): Promise<{ items: BroadcastHistoryItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiGet<BroadcastHistoryItem[]>(
    `/admin/notifications/history${qs ? `?${qs}` : ""}`,
  );
  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
  };
}

export async function sendBroadcast(payload: BroadcastPayload): Promise<BroadcastResult> {
  const res = await apiPost<BroadcastResult>("/admin/notifications/broadcast", payload);
  return res.data;
}

/** Register browser FCM token for push notifications (admin session). */
export async function registerFcmToken(fcmToken: string): Promise<void> {
  await apiPost<{ id: string }>("/notifications/tokens", {
    fcmToken,
    platform: "WEB",
  });
}

/** Deregister FCM token on admin logout. */
export async function deregisterFcmToken(fcmToken: string): Promise<void> {
  await apiRequest("/notifications/tokens", {
    method: "DELETE",
    body: JSON.stringify({ fcmToken }),
  });
}

export async function fetchPartnerships(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: PartnershipStatus;
  filter?: PartnershipListFilter;
}): Promise<{
  items: PartnershipContract[];
  total: number;
  page: number;
  limit: number;
}> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.filter) query.set("filter", params.filter);

  const qs = query.toString();
  const res = await apiGet<PartnershipContract[]>(
    `/admin/partnerships${qs ? `?${qs}` : ""}`,
  );

  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 20,
  };
}

export async function fetchPartnershipDetail(
  id: string,
): Promise<PartnershipContract> {
  const res = await apiGet<PartnershipContract>(`/admin/partnerships/${id}`);
  return res.data;
}

export async function signPartnershipAsPlatform(
  id: string,
  payload?: { signerName?: string; signerTitle?: string },
): Promise<PartnershipContract> {
  const res = await apiPost<PartnershipContract>(
    `/admin/partnerships/${id}/sign`,
    payload ?? {},
  );
  return res.data;
}
