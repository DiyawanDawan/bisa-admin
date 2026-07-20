export interface OrderAnalyticsSummary {
  totalOrders: number;
  completedOrders: number;
  activeDisputes: number;
  inProgress: number;
  thisMonthOrders: number;
  completedGmv: number;
  thisMonthGmv: number;
}

export interface OrderChartPoint {
  x: string;
  y: number;
}

export interface OrderAnalytics {
  summary: OrderAnalyticsSummary;
  byStatus: { status: string; count: number }[];
  dailyOrders: OrderChartPoint[];
  dailyRevenue: OrderChartPoint[];
  monthlyOrders: OrderChartPoint[];
  monthlyRevenue: OrderChartPoint[];
}

export interface AdminOrderPaymentInfo {
  id: string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  status?: string | null;
  paidAt?: string | null;
  amount?: number | string | null;
  externalId?: string | null;
  paymentChannel?: {
    id: string;
    code: string;
    name: string;
    group?: string | null;
    logoUrl?: string | null;
  } | null;
}

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  totalQuantity: number | string;
  createdAt: string;
  buyer: { id: string; fullName: string; email: string; avatarUrl?: string | null };
  seller: { id: string; fullName: string; email: string; avatarUrl?: string | null };
  courierCode?: string | null;
  deliveryStatus?: string | null;
  dispute?: { id: string; status: string } | null;
  transaction?: AdminOrderPaymentInfo | null;
}

export interface AdminOrderShippingInfo {
  id: string;
  originDestinationId: number;
  destinationDestinationId: number;
  originLabel: string | null;
  destinationLabel: string | null;
  weightGrams: number;
  courierCode: string;
  courierName: string | null;
  serviceCode: string | null;
  serviceName: string;
  serviceDescription: string | null;
  shippingCost: number | string;
  etd: string | null;
  verifiedAt: string;
}

export interface AdminShipmentInfo {
  orderId: string;
  vesselName: string | null;
  originHub: string | null;
  destinationHub: string | null;
  awbNumber?: string | null;
  courierCode?: string | null;
  deliveryStatus?: string | null;
  lastTrackedAt?: string | null;
  updatedAt: string;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  buyer: { fullName: string; email: string; avatarUrl?: string | null; phone?: string | null };
  seller: { fullName: string; email: string; avatarUrl?: string | null; phone?: string | null };
  items: Array<{
    quantity: number | string;
    pricePerUnit: number | string;
    product: { name: string; thumbnailUrl?: string | null };
  }>;
  dispute?: { id: string; status: string } | null;
  transaction?: AdminOrderPaymentInfo | null;
  orderShipping?: AdminOrderShippingInfo | null;
  shipment?: AdminShipmentInfo | null;
}

export interface CartLineItem {
  id: string;
  quantity: number | string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; fullName: string; email: string; role: string };
  product: {
    id: string;
    name: string;
    pricePerUnit: number | string;
    stock: number | string;
    user?: { fullName: string };
  };
}

export interface CartOverview {
  items: CartLineItem[];
  stats: { totalLineItems: number; uniqueBuyers: number };
}

export interface WalletListItem {
  id: string;
  balance: number | string;
  totalEarned: number | string;
  totalWithdrawn: number | string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
  };
}

export interface ForumPostAdmin {
  id: string;
  title: string;
  content: string;
  status: string;
  categoryId?: string | null;
  groupId?: string | null;
  tags?: string[] | null;
  mediaUrls?: Array<{ url: string; type?: string } | string> | null;
  productMentions?: Array<{ id: string; name: string; slug?: string }> | null;
  upvotes: number;
  downvotes: number;
  viewCount: number;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
  category?: { id: string; name: string } | null;
  group?: {
    id: string;
    name: string;
    slug?: string;
    description?: string | null;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    memberCount?: number;
  } | null;
  _count: { comments: number };
}

export interface ForumGroupAdmin {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  isPublic: boolean;
  memberCount: number;
  postCount: number;
  createdAt: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface ForumCategoryOption {
  id: string;
  name: string;
}

export interface PolicyItem {
  id: string;
  title: string;
  content: string;
  version: string;
  isActive: boolean;
  updatedAt: string;
  key: string | null;
}

export interface MarketHistoryPoint {
  x: string;
  y: number;
}

export interface MarketTrendItem {
  id: string;
  label: string;
  currentValue: string;
  trendType: "UP" | "DOWN" | "STABLE" | string;
  category: "CARBON" | "BIOMASSA" | "LOGISTICS" | string;
  updatedAt: string;
  historyData?: MarketHistoryPoint[] | null;
}

export type MarketCategoryFilter = "" | "CARBON" | "BIOMASSA" | "LOGISTICS";

export interface ChatStats {
  totalRooms: number;
  totalMessages: number;
  activeRooms: number;
  openNegotiations: number;
  disputeGroups?: number;
}

export interface ChatInboxItem {
  id: string;
  status: string;
  updatedAt: string;
  createdAt: string;
  totalEstimate: number | string;
  buyer: { id: string; fullName: string; email: string; avatarUrl?: string | null };
  seller: { id: string; fullName: string; email: string; avatarUrl?: string | null };
  product: { id: string; name: string };
  order: {
    id: string;
    orderNumber: string;
    status: string;
    dispute?: {
      mediationStartedAt?: string | null;
      readyToResolveAt?: string | null;
      status?: string;
    } | null;
  } | null;
  _count: { messages: number };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isSystemMessage: boolean;
    sender: { id: string; fullName: string; role: string };
  } | null;
  isDisputeMediation?: boolean;
  mediationStartedAt?: string | null;
  readyToResolveAt?: string | null;
}

export interface ChatMessageItem {
  id: string;
  negotiationId: string;
  senderId: string;
  content: string;
  attachmentUrl: string | null;
  isSystemMessage: boolean;
  isRead: boolean;
  isDeleted: boolean;
  editedAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
  };
}

export interface ChatThreadData {
  negotiation: {
    id: string;
    status: string;
    quantity: number | string;
    pricePerUnit: number | string;
    totalEstimate: number | string;
    createdAt: string;
    updatedAt: string;
    buyer: {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
      avatarUrl?: string | null;
    };
    seller: {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
      avatarUrl?: string | null;
    };
    product: { id: string; name: string; unit: string };
    order: { id: string; orderNumber: string; status: string } | null;
    _count: { messages: number };
  };
  messages: ChatMessageItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export type CrmStage = "LEAD" | "PROSPECT" | "ACTIVE" | "VIP" | "AT_RISK";

export interface CrmOverview {
  summary: {
    totalContacts: number;
    buyers: number;
    suppliers: number;
    newContacts30d: number;
    platformGmv: number;
    openNegotiations: number;
    pendingKyc: number;
  };
  pipeline: Record<CrmStage, number>;
  dailyLeads: { x: string; y: number }[];
}

export interface CrmContactListItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  tier: string | null;
  phone: string | null;
  province: string | null;
  regency: string | null;
  companyName: string | null;
  kycStatus: string | null;
  createdAt: string;
  updatedAt: string;
  isEmailVerified: boolean;
  orderCount: number;
  negotiationCount: number;
  completedOrders: number;
  completedGmv: number;
  lastOrderAt: string | null;
  stage: CrmStage;
  stageComputed: CrmStage;
  stageOverride: CrmStage | null;
  nextFollowUpAt: string | null;
}

export interface CrmNoteItem {
  id: string;
  action: string;
  content: string | undefined;
  authorName: string;
  createdAt: string;
}

export interface AdminIotDeviceItem {
  id: string;
  deviceId: string;
  name: string;
  liveStatus: string;
  isMonitoringEnabled: boolean;
  ownerName: string | null;
  ownerEmail: string | null;
  isClaimed: boolean;
  ownedAt: string | null;
  lastTemp: number | null;
  lastSeen: string | null;
  hasUnreadAlert: boolean;
  thresholdMin: number | null;
  thresholdMax: number | null;
  deviceSecret: string;
}

export interface AdminIotProvisionResult {
  id: string;
  serialNumber: string;
  name: string | null;
  deviceSecret: string;
  qrPayload: {
    serialNumber: string;
    deviceSecret: string;
  };
  qrData: string;
  createdAt: string;
}

export interface CrmContactDetail {
  contact: Record<string, unknown> & {
    stage: CrmStage;
    stageComputed: CrmStage;
    stageOverride: CrmStage | null;
    nextFollowUpAt: string | null;
    metrics: {
      completedOrders: number;
      completedGmv: number;
      lastOrderAt: string | null;
    };
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number | string;
    createdAt: string;
    buyer: { fullName: string };
    seller: { fullName: string };
  }>;
  recentNegotiations: Array<{
    id: string;
    status: string;
    totalEstimate: number | string;
    updatedAt: string;
    product: { name: string };
  }>;
  notes: CrmNoteItem[];
}
