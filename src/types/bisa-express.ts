export type BisaExpressDashboard = {
  awaitingPickup?: number;
  inTransit?: number;
  outForDelivery?: number;
  deliveredToday?: number;
  failedDelivery?: number;
  activeDrivers?: number;
  [key: string]: unknown;
};

export type BisaExpressShipmentItem = {
  id: string;
  awbNumber: string;
  status: string;
  serviceType?: string;
  weight?: number | string;
  weightUnit?: "KG" | "TON";
  shippingCost?: number | string;
  createdAt?: string;
  order?: {
    id?: string;
    orderNumber?: string;
  };
  pickupDriver?: { id?: string; employeeCode?: string } | null;
  deliveryDriver?: { id?: string; employeeCode?: string } | null;
};

export type BisaExpressRateItem = {
  id: string;
  originZone: string;
  destinationZone: string;
  serviceType: string;
  minWeight: number | string;
  maxWeight: number | string;
  weightUnit: "KG" | "TON";
  baseCost: number | string;
  perUnitCost: number | string;
  etdDays: number;
  isActive: boolean;
};

export type BisaExpressServiceRuleItem = {
  id: string;
  serviceType: string;
  label?: string | null;
  minWeight: number | string;
  maxWeight: number | string;
  weightUnit: "KG" | "TON";
  alwaysAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
  note?: string | null;
};

export type BisaExpressDriverItem = {
  id: string;
  employeeCode: string;
  status: string;
  isActive: boolean;
  vehicleType?: string;
  vehiclePlate?: string | null;
  maxCapacityKg?: number | string | null;
  user?: { id?: string; fullName?: string; phone?: string | null; email?: string; role?: string };
};

export type BisaExpressCoverageItem = {
  id: string;
  provinceId: string;
  regencyId?: string | null;
  zone: string;
  isPickup: boolean;
  isDelivery: boolean;
  isActive: boolean;
};
