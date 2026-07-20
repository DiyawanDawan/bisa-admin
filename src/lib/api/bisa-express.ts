import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";
import type {
  BisaExpressCoverageItem,
  BisaExpressDashboard,
  BisaExpressDriverItem,
  BisaExpressHubItem,
  BisaExpressRateItem,
  BisaExpressServiceRuleItem,
  BisaExpressShipmentItem,
} from "@/types/bisa-express";

const BASE = "/admin/bisa-express";

export async function fetchBisaExpressDashboard(): Promise<BisaExpressDashboard> {
  const res = await apiGet<BisaExpressDashboard>(`${BASE}/dashboard`);
  return res.data;
}

export async function fetchBisaExpressShipments(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<{ items: BisaExpressShipmentItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await apiGet<{
    items: BisaExpressShipmentItem[];
    total: number;
    page?: number;
    limit?: number;
  }>(`${BASE}/shipments${qs ? `?${qs}` : ""}`);
  return {
    items: res.data.items ?? [],
    total: res.data.total ?? res.pagination?.total ?? 0,
  };
}

export async function assignBisaExpressDrivers(
  shipmentId: string,
  body: { pickupDriverId?: string; deliveryDriverId?: string },
): Promise<unknown> {
  const res = await apiPut(`${BASE}/shipments/${shipmentId}/assign`, body);
  return res.data;
}

export async function overrideBisaExpressStatus(
  shipmentId: string,
  body: { status: string; description?: string },
): Promise<unknown> {
  const res = await apiPut(`${BASE}/shipments/${shipmentId}/override-status`, body);
  return res.data;
}

export async function fetchBisaExpressRates(): Promise<BisaExpressRateItem[]> {
  const res = await apiGet<BisaExpressRateItem[]>(`${BASE}/rates`);
  return res.data;
}

export async function upsertBisaExpressRate(
  body: Partial<BisaExpressRateItem> & {
    originZone: string;
    destinationZone: string;
    serviceType: string;
    baseCost: number;
    perUnitCost: number;
    etdDays: number;
  },
): Promise<BisaExpressRateItem> {
  if (body.id) {
    const { id, ...rest } = body;
    const res = await apiPut<BisaExpressRateItem>(`${BASE}/rates/${id}`, rest);
    return res.data;
  }
  const res = await apiPost<BisaExpressRateItem>(`${BASE}/rates`, body);
  return res.data;
}

export async function deleteBisaExpressRate(id: string): Promise<void> {
  await apiDelete(`${BASE}/rates/${id}`);
}

export async function fetchBisaExpressCoverage(): Promise<BisaExpressCoverageItem[]> {
  const res = await apiGet<BisaExpressCoverageItem[]>(`${BASE}/coverage`);
  return res.data;
}

export async function fetchBisaExpressServiceRules(): Promise<BisaExpressServiceRuleItem[]> {
  const res = await apiGet<BisaExpressServiceRuleItem[]>(`${BASE}/service-rules`);
  return res.data;
}

export async function upsertBisaExpressServiceRule(
  body: Partial<BisaExpressServiceRuleItem> & {
    serviceType: string;
    minWeight: number;
    maxWeight: number;
  },
): Promise<BisaExpressServiceRuleItem> {
  if (body.id) {
    const { id, ...rest } = body;
    const res = await apiPut<BisaExpressServiceRuleItem>(`${BASE}/service-rules/${id}`, rest);
    return res.data;
  }
  const res = await apiPost<BisaExpressServiceRuleItem>(`${BASE}/service-rules`, body);
  return res.data;
}

export async function deactivateBisaExpressServiceRule(id: string): Promise<void> {
  await apiDelete(`${BASE}/service-rules/${id}`);
}

export async function fetchBisaExpressDrivers(): Promise<BisaExpressDriverItem[]> {
  const res = await apiGet<BisaExpressDriverItem[]>(`${BASE}/drivers`);
  return res.data;
}

export async function createBisaExpressDriver(body: {
  userId: string;
  employeeCode: string;
  vehicleType?: string;
  vehiclePlate?: string;
  maxCapacityKg?: number;
  homeHubId?: string;
}): Promise<BisaExpressDriverItem> {
  const res = await apiPost<BisaExpressDriverItem>(`${BASE}/drivers`, body);
  return res.data;
}

export async function fetchBisaExpressHubs(): Promise<BisaExpressHubItem[]> {
  const res = await apiGet<BisaExpressHubItem[]>(`${BASE}/hubs`);
  return res.data;
}
