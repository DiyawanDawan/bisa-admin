export type UserRole = "ADMIN" | "BUYER" | "SUPPLIER";
export type UserStatus = "ACTIVE" | "BLOCKED" | "INACTIVE" | "DELETED";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED";
export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  user: AdminUser;
  token: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalGMV: number;
  activeDisputes: number;
  totalBiomassTons: number;
}

export interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  tier: string | null;
  createdAt: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  avatarUrl?: string | null;
}

export interface PayoutAccountItem {
  id: string;
  accountNumber: string;
  accountHolderName: string;
  isMain: boolean;
  bank?: { name: string; code?: string };
}

export interface UserWalletSummary {
  balance?: number | string;
  totalEarned?: number | string;
  totalWithdrawn?: number | string;
}

export interface RoleReadinessSummary {
  ready: boolean;
  missing: string[];
  messages: string[];
}

export interface UserReadinessSummary {
  role: string;
  store: RoleReadinessSummary | null;
  buyer: RoleReadinessSummary | null;
}

export interface UserDossier extends UserListItem {
  profile?: Record<string, unknown> | null;
  wallet?: UserWalletSummary | null;
  payoutAccounts?: PayoutAccountItem[];
  verification?: Record<string, unknown> | null;
  recentOrders?: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number | string;
    createdAt: string;
  }>;
  readiness?: UserReadinessSummary | null;
  _count?: {
    ordersAsBuyer: number;
    ordersAsSeller: number;
    products: number;
  };
}

export interface UserDossierApiResponse {
  profile: UserDossier & {
    payoutAccounts?: PayoutAccountItem[];
    wallet?: UserWalletSummary | null;
  };
  stats: {
    totalBuyerOrders: number;
    totalSellerOrders: number;
    totalProducts: number;
  };
  recentOrders: UserDossier["recentOrders"];
  readiness?: UserReadinessSummary | null;
}

export interface KYCQueueItem {
  id: string;
  userId: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
  ktpUrl?: string | null;
  selfieUrl?: string | null;
  nibUrl?: string | null;
  siupUrl?: string | null;
  businessName?: string | null;
  user: { fullName: string; email: string };
}

export interface OrderDispute {
  id: string;
  orderId: string;
  reason: string;
  description?: string | null;
  evidenceUrls: string[];
  sellerResponse?: string | null;
  sellerEvidenceUrls: string[];
  status: DisputeStatus;
  resolution?: string | null;
  resolutionNote?: string | null;
  mediationStartedAt?: string | null;
  readyToResolveAt?: string | null;
  createdAt: string;
}

export interface DisputeMediationMeta {
  negotiationId: string | null;
  mediationStartedAt: string | null;
  readyToResolveAt: string | null;
  adminMessageCount: number;
  canMediate: boolean;
  canMarkReady: boolean;
  canResolve: boolean;
}

export interface DisputeChatMessage {
  id: string;
  negotiationId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string | null;
  isSystemMessage: boolean;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    role?: UserRole;
  };
}

export interface DisputeChatThread {
  negotiation: {
    id: string;
    status: string;
    buyer: { id: string; fullName: string; email?: string };
    seller: { id: string; fullName: string; email?: string };
    product?: { id: string; name: string };
  };
  messages: DisputeChatMessage[];
  mediation: DisputeMediationMeta;
  pagination: PaginationMeta;
}

export interface DisputeOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
  buyer: {
    fullName: string;
    email?: string;
    phone?: string;
    avatarUrl?: string | null;
  };
  seller: {
    fullName: string;
    email?: string;
    phone?: string;
    avatarUrl?: string | null;
  };
  dispute?: OrderDispute | null;
  negotiationId?: string | null;
  mediation?: DisputeMediationMeta;
  items?: Array<{
    id: string;
    quantity: number;
    pricePerUnit: number;
    subtotal: number;
    product?: {
      id?: string;
      name: string;
      thumbnailUrl?: string | null;
      unit?: string | null;
    } | null;
  }>;
  transaction?: { status: string; amount: number } | null;
}

export interface RevenueChartData {
  series: Array<{
    name: string;
    data: Array<{ x: string; y: number }>;
  }>;
}

export interface ChartPoint {
  x: string;
  y: number;
}

export interface DonutChartData {
  labels: string[];
  series: number[];
}

export interface UserAnalyticsData {
  roles: DonutChartData;
  statuses: DonutChartData;
}

export interface UserChartPoint {
  x: string;
  y: number;
}

export interface UserAnalyticsSummary {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  suppliers: number;
  buyers: number;
  admins: number;
  pendingKyc: number;
  verifiedKyc: number;
  rejectedKyc: number;
  thisMonthUsers: number;
  emailVerified: number;
}

export interface UserAnalyticsStats {
  summary: UserAnalyticsSummary;
  roles: { role: string; count: number }[];
  statuses: { status: string; count: number }[];
  kyc: { status: string; count: number }[];
  dailySignups: UserChartPoint[];
  monthlySignups: UserChartPoint[];
}

export interface TopSuppliersChartData {
  labels: string[];
  series: Array<{ name: string; data: number[] }>;
}

export type DisputeResolution = "RELEASE" | "REFUND";

export type ProductStatus =
  | "ACTIVE"
  | "DRAFT"
  | "INACTIVE"
  | "BLOCKED"
  | "OUT_OF_STOCK"
  | "DELETED";

export type CategoryType = "PRODUK" | "FORUM" | "ARTICLE";
export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type PayoutStatus = "COMPLETED" | "FAILED" | "RELEASED" | "PENDING" | "ESCROW_HELD" | "REFUNDED";

export interface ProductListItem {
  id: string;
  name: string;
  status: ProductStatus;
  isCertified: boolean;
  thumbnailUrl?: string | null;
  pricePerUnit: number;
  stock: number;
  isIotMonitored: boolean;
  isEscrowProtected: boolean;
  createdAt: string;
  user: { fullName: string; email: string };
  category?: { name: string } | null;
}

export interface CategoryItem {
  id: string;
  name: string;
  description?: string | null;
  categoryType: CategoryType;
  createdAt: string;
}

export interface FinanceStats {
  totalInEscrow: number;
  totalReleased: number;
  totalRefunded: number;
  platformRevenue: number;
}

export interface TransactionItem {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  user?: { fullName: string; email: string };
  order?: { orderNumber: string };
}

export interface PlatformFee {
  id: string;
  name: string;
  amount: number;
  type: string;
  isActive: boolean;
  description?: string | null;
}

export interface PayoutItem {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user?: { fullName: string; email: string };
}

export interface BroadcastPayload {
  title: string;
  message: string;
  priority: NotificationPriority;
  targetRole?: UserRole;
}

export interface NotificationAdminStats {
  totalNotifications: number;
  unreadNotifications: number;
  systemAnnouncements7d: number;
  activeUsers: number;
  pushDevices: number;
  broadcastCount: number;
  byPriority: { priority: string; count: number }[];
}

export interface BroadcastHistoryItem {
  id: string;
  title: string;
  messagePreview: string | null;
  priority: string;
  targetRole: string | null;
  recipientCount: number;
  sentAt: string;
  sentBy: { id: string; fullName: string; email: string } | null;
}

export interface BroadcastResult {
  success: boolean;
  count: number;
}

export interface DashboardPlatformAnalytics {
  summary: {
    totalProducts: number;
    activeProducts: number;
    certifiedProducts: number;
    productsThisMonth: number;
    totalStoreBanners: number;
    activeStoreBanners: number;
    suppliersWithBanner: number;
    activeSuppliers: number;
    publishedForumPosts: number;
    pendingKyc: number;
  };
  productsByStatus: Array<{ status: ProductStatus; count: number }>;
}

export interface DashboardVisualGallery {
  products: Array<{
    id: string;
    name: string;
    status: ProductStatus;
    pricePerUnit: number | string;
    createdAt: string;
    thumbnailUrl: string | null;
    supplierName: string;
    supplierAvatarUrl: string | null;
  }>;
  storeBanners: Array<{
    id: string;
    title: string | null;
    imageUrl: string;
    sortOrder: number;
    createdAt: string;
    storeName: string;
    supplierId: string;
    supplierAvatarUrl: string | null;
  }>;
  supplierStores: Array<{
    id: string;
    fullName: string;
    companyName: string | null;
    avatarUrl: string | null;
    productCount: number;
    bannerCount: number;
  }>;
  forumMedia: Array<{
    id: string;
    title: string;
    imageUrl: string;
    mediaCount: number;
    createdAt: string;
    authorName: string;
    authorAvatarUrl: string | null;
  }>;
}
