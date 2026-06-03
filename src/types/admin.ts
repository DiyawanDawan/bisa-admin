export type UserRole = "ADMIN" | "BUYER" | "SUPPLIER";
export type UserStatus = "ACTIVE" | "BLOCKED" | "INACTIVE" | "DELETED";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED"
  | "REFUNDED";

export type DisputeStatus = "OPEN" | "SELLER_RESPONDED" | "RESOLVED" | "CLOSED";
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
}

export interface KYCQueueItem {
  id: string;
  userId: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
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
  createdAt: string;
}

export interface DisputeOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
  buyer: { fullName: string; email?: string; phone?: string };
  seller: { fullName: string; email?: string; phone?: string };
  dispute?: OrderDispute | null;
  items?: Array<{
    id: string;
    quantity: number;
    pricePerUnit: number;
    subtotal: number;
    product?: { name: string };
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
export type PayoutStatus = "COMPLETED" | "FAILED";

export interface ProductListItem {
  id: string;
  name: string;
  status: ProductStatus;
  isCertified: boolean;
  pricePerUnit: number;
  stock: number;
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
