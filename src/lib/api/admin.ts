import type {
  BroadcastPayload,
  BroadcastHistoryItem,
  BroadcastResult,
  NotificationAdminStats,
  CategoryItem,
  CategoryType,
  BiomassaType,
  ProductMode,
  DashboardStats,
  DisputeOrder,
  DisputeResolution,
  DisputeMediationMeta,
  DisputeChatThread,
  DisputeChatMessage,
  FinanceStats,
  KYCQueueItem,
  PaymentChannelAdminItem,
  PayoutBankAdminItem,
  PayoutItem,
  PayoutStatus,
  PlatformFee,
  ProductDetail,
  ProductListItem,
  ProductCertificateItem,
  StoreCertificateItem,
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
import {
  apiDelete,
  apiDownload,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  apiRequest,
} from "@/lib/api-client";
import { invalidateAdminGetCache } from "@/lib/api-cache";

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
  const data = res.data;
  return {
    summary: data?.summary ?? {
      totalUsers: 0,
      activeUsers: 0,
      blockedUsers: 0,
      suppliers: 0,
      buyers: 0,
      admins: 0,
      pendingKyc: 0,
      verifiedKyc: 0,
      rejectedKyc: 0,
      thisMonthUsers: 0,
      emailVerified: 0,
    },
    roles: Array.isArray(data?.roles) ? data.roles : [],
    statuses: Array.isArray(data?.statuses) ? data.statuses : [],
    kyc: Array.isArray(data?.kyc) ? data.kyc : [],
    dailySignups: Array.isArray(data?.dailySignups) ? data.dailySignups : [],
    monthlySignups: Array.isArray(data?.monthlySignups) ? data.monthlySignups : [],
  };
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
  query.set("page", String(params?.page ?? 1));
  query.set("limit", String(params?.limit ?? 50));
  const res = await apiGet<DisputeChatThread>(
    `/admin/orders/disputes/${orderId}/chat?${query.toString()}`,
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

export async function fetchProductDetail(productId: string): Promise<ProductDetail> {
  const res = await apiGet<ProductDetail>(`/admin/products/${productId}`);
  return res.data;
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

export async function fetchProductCertificatesByProduct(
  productId: string,
): Promise<ProductCertificateItem[]> {
  const res = await apiGet<ProductCertificateItem[]>(`/admin/products/${productId}/certificates`);
  return res.data;
}

export async function fetchStoreCertificates(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductCertificateStatus;
}): Promise<{ items: StoreCertificateItem[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiGet<StoreCertificateItem[]>(
    `/admin/products/store-certificates${qs ? `?${qs}` : ""}`,
  );
  return {
    items: res.data,
    total: res.pagination?.total ?? res.data.length,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 20,
  };
}

export async function fetchStoreCertificate(id: string): Promise<StoreCertificateItem> {
  const res = await apiGet<StoreCertificateItem>(`/admin/products/store-certificates/${id}`);
  return res.data;
}

export async function reviewStoreCertificate(
  id: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string,
): Promise<StoreCertificateItem> {
  const res = await apiPatch<StoreCertificateItem>(
    `/admin/products/store-certificates/${id}/review`,
    { status, rejectionReason },
  );
  return res.data;
}

export async function fetchCategories(params?: {
  categoryType?: CategoryType;
  productMode?: ProductMode;
  biomassaType?: BiomassaType;
  search?: string;
}): Promise<CategoryItem[]> {
  const query = new URLSearchParams();
  if (params?.categoryType) query.set("categoryType", params.categoryType);
  if (params?.productMode) query.set("productMode", params.productMode);
  if (params?.biomassaType) query.set("biomassaType", params.biomassaType);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await apiGet<CategoryItem[]>(
    `/admin/products/categories${qs ? `?${qs}` : ""}`,
  );
  return res.data ?? [];
}

export async function createCategory(payload: {
  name: string;
  description?: string;
  categoryType: CategoryType;
  productMode?: ProductMode | null;
  biomassaType?: BiomassaType | null;
}): Promise<CategoryItem> {
  const res = await apiPost<CategoryItem>("/admin/products/categories", payload);
  return res.data;
}

export async function updateCategory(
  id: string,
  payload: {
    name: string;
    description?: string;
    categoryType: CategoryType;
    productMode?: ProductMode | null;
    biomassaType?: BiomassaType | null;
  },
): Promise<CategoryItem> {
  const res = await apiPut<CategoryItem>(`/admin/products/categories/${id}`, payload);
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
  return res.data ?? [];
}

export async function createFee(payload: {
  name: string;
  amount: number;
  type: string;
  description?: string;
  isActive?: boolean;
  applyMode?: string;
  applyScopes?: string[];
}): Promise<PlatformFee> {
  const res = await apiPost<PlatformFee>("/admin/finance/fees", payload);
  invalidateAdminGetCache("/admin/finance/fees");
  return res.data;
}

export async function updateFee(
  id: string,
  payload: {
    amount?: number;
    type?: string;
    description?: string | null;
    isActive?: boolean;
    applyMode?: string;
    applyScopes?: string[] | null;
  },
): Promise<PlatformFee> {
  const res = await apiPatch<PlatformFee>(`/admin/finance/fees/${id}`, payload);
  invalidateAdminGetCache("/admin/finance/fees");
  return res.data;
}

export async function deleteFee(id: string): Promise<PlatformFee> {
  const res = await apiDelete<PlatformFee>(`/admin/finance/fees/${id}`);
  invalidateAdminGetCache("/admin/finance/fees");
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

export async function fetchPayoutBanksAdmin(params?: {
  search?: string;
  isActive?: boolean;
}): Promise<PayoutBankAdminItem[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
  const qs = query.toString();
  const res = await apiGet<PayoutBankAdminItem[]>(
    `/admin/finance/payout-banks${qs ? `?${qs}` : ""}`,
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function createPayoutBankAdmin(payload: {
  name: string;
  code: string;
  channelType?: string;
  country?: string;
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
  flightTime?: string;
  logoUrl?: string;
  isActive?: boolean;
}): Promise<PayoutBankAdminItem> {
  const res = await apiPost<PayoutBankAdminItem>("/admin/finance/payout-banks", payload);
  invalidateAdminGetCache("/admin/finance/payout-banks");
  return res.data;
}

export async function updatePayoutBankAdmin(
  id: string,
  payload: Partial<{
    name: string;
    code: string;
    channelType: string | null;
    country: string | null;
    currency: string | null;
    minAmount: number | null;
    maxAmount: number | null;
    flightTime: string | null;
    logoUrl: string | null;
    isActive: boolean;
  }>,
): Promise<PayoutBankAdminItem> {
  const res = await apiPatch<PayoutBankAdminItem>(`/admin/finance/payout-banks/${id}`, payload);
  invalidateAdminGetCache("/admin/finance/payout-banks");
  return res.data;
}

export async function deletePayoutBankAdmin(id: string): Promise<void> {
  await apiDelete(`/admin/finance/payout-banks/${id}`);
  invalidateAdminGetCache("/admin/finance/payout-banks");
}

export async function fetchPaymentChannelsAdmin(params?: {
  search?: string;
  isActive?: boolean;
}): Promise<PaymentChannelAdminItem[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
  const qs = query.toString();
  const res = await apiGet<PaymentChannelAdminItem[]>(
    `/admin/finance/payment-channels${qs ? `?${qs}` : ""}`,
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function createPaymentChannelAdmin(payload: {
  name: string;
  code: string;
  group?: string;
  country?: string;
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
  settlementTime?: string;
  xenditType?: string;
  logoUrl?: string;
  isActive?: boolean;
}): Promise<PaymentChannelAdminItem> {
  const res = await apiPost<PaymentChannelAdminItem>(
    "/admin/finance/payment-channels",
    payload,
  );
  invalidateAdminGetCache("/admin/finance/payment-channels");
  return res.data;
}

export async function updatePaymentChannelAdmin(
  id: string,
  payload: Partial<{
    name: string;
    code: string;
    group: string | null;
    country: string | null;
    currency: string | null;
    minAmount: number | null;
    maxAmount: number | null;
    settlementTime: string | null;
    xenditType: string | null;
    logoUrl: string | null;
    isActive: boolean;
  }>,
): Promise<PaymentChannelAdminItem> {
  const res = await apiPatch<PaymentChannelAdminItem>(
    `/admin/finance/payment-channels/${id}`,
    payload,
  );
  invalidateAdminGetCache("/admin/finance/payment-channels");
  return res.data;
}

export async function deletePaymentChannelAdmin(id: string): Promise<void> {
  await apiDelete(`/admin/finance/payment-channels/${id}`);
  invalidateAdminGetCache("/admin/finance/payment-channels");
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
