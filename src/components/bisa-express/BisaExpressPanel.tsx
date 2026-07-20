"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Input from "@/components/form/input/InputField";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/tables/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api-client";
import {
  assignBisaExpressDrivers,
  createBisaExpressDriver,
  deleteBisaExpressRate,
  fetchBisaExpressCoverage,
  fetchBisaExpressDashboard,
  fetchBisaExpressDrivers,
  fetchBisaExpressHubs,
  fetchBisaExpressRates,
  fetchBisaExpressServiceRules,
  fetchBisaExpressShipments,
  overrideBisaExpressStatus,
  upsertBisaExpressRate,
  upsertBisaExpressServiceRule,
} from "@/lib/api/bisa-express";
import { fetchUsers } from "@/lib/api/admin";
import type {
  BisaExpressDashboard,
  BisaExpressDriverItem,
  BisaExpressHubItem,
  BisaExpressRateItem,
  BisaExpressServiceRuleItem,
  BisaExpressShipmentItem,
} from "@/types/bisa-express";

type Tab = "overview" | "shipments" | "rates" | "rules" | "drivers";

const STATUS_OPTIONS = [
  "AWAITING_PICKUP",
  "PICKUP_ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT_TO_HUB",
  "AT_ORIGIN_HUB",
  "IN_TRANSIT",
  "AT_DESTINATION_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED_DELIVERY",
  "RETURNED",
  "CANCELLED",
] as const;

const SERVICE_TYPES = ["REGULER", "EXPRESS", "SAME_DAY", "CARGO", "VIP_EXPRESS"] as const;
const WEIGHT_UNITS = ["KG", "TON"] as const;
const VEHICLE_TYPES = [
  "MOTORCYCLE",
  "VAN",
  "PICKUP_TRUCK",
  "TRUCK_CDD",
  "TRUCK_FUSO",
  "TRUCK_TRONTON",
] as const;

type RateFormState = {
  id?: string;
  originZone: string;
  destinationZone: string;
  serviceType: string;
  minWeight: string;
  maxWeight: string;
  weightUnit: "KG" | "TON";
  baseCost: string;
  perUnitCost: string;
  etdDays: string;
};

const emptyRateForm = (): RateFormState => ({
  originZone: "",
  destinationZone: "",
  serviceType: "REGULER",
  minWeight: "0",
  maxWeight: "50",
  weightUnit: "KG",
  baseCost: "",
  perUnitCost: "",
  etdDays: "2",
});

function money(v: number | string | undefined) {
  const n = Number(v ?? 0);
  return Number.isFinite(n)
    ? n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
    : "-";
}

function statusColor(status: string): "success" | "warning" | "error" | "light" | "info" {
  if (status === "DELIVERED") return "success";
  if (status.includes("FAILED") || status === "CANCELLED" || status === "RETURNED") return "error";
  if (status.includes("OUT_FOR") || status.includes("PICKUP")) return "warning";
  if (status.includes("TRANSIT") || status.includes("HUB")) return "info";
  return "light";
}

export default function BisaExpressPanel() {
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [dashboard, setDashboard] = useState<BisaExpressDashboard | null>(null);
  const [shipments, setShipments] = useState<BisaExpressShipmentItem[]>([]);
  const [shipTotal, setShipTotal] = useState(0);
  const [shipPage, setShipPage] = useState(1);
  const [shipSearch, setShipSearch] = useState("");
  const [rates, setRates] = useState<BisaExpressRateItem[]>([]);
  const [rules, setRules] = useState<BisaExpressServiceRuleItem[]>([]);
  const [drivers, setDrivers] = useState<BisaExpressDriverItem[]>([]);
  const [hubs, setHubs] = useState<BisaExpressHubItem[]>([]);

  const [actionShipment, setActionShipment] = useState<BisaExpressShipmentItem | null>(null);
  const [pickupDriverId, setPickupDriverId] = useState("");
  const [deliveryDriverId, setDeliveryDriverId] = useState("");
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideNote, setOverrideNote] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const [rateForm, setRateForm] = useState<RateFormState>(emptyRateForm);
  const [rateFormOpen, setRateFormOpen] = useState(false);
  const [rateBusy, setRateBusy] = useState(false);
  const [rateMsg, setRateMsg] = useState<string | null>(null);
  const [zoneOptions, setZoneOptions] = useState<string[]>([]);

  const [driverFormOpen, setDriverFormOpen] = useState(false);
  const [driverBusy, setDriverBusy] = useState(false);
  const [driverMsg, setDriverMsg] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userHits, setUserHits] = useState<
    { id: string; fullName: string; email: string; role: string }[]
  >([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [vehicleType, setVehicleType] = useState<string>("PICKUP_TRUCK");
  const [vehiclePlate, setVehiclePlate] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, hubList] = await Promise.all([
        fetchBisaExpressDashboard(),
        fetchBisaExpressHubs(),
      ]);
      setDashboard(dash);
      setHubs(hubList);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, driverList] = await Promise.all([
        fetchBisaExpressShipments({
          page: shipPage,
          limit: 20,
          search: shipSearch || undefined,
        }),
        fetchBisaExpressDrivers(),
      ]);
      setShipments(res.items);
      setShipTotal(res.total);
      setDrivers(driverList);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat shipment");
    } finally {
      setLoading(false);
    }
  }, [shipPage, shipSearch]);

  const openShipmentAction = (s: BisaExpressShipmentItem) => {
    setActionShipment(s);
    setPickupDriverId("");
    setDeliveryDriverId("");
    setOverrideStatus(s.status);
    setOverrideNote("");
    setActionMsg(null);
  };

  const submitAssign = async () => {
    if (!actionShipment) return;
    if (!pickupDriverId && !deliveryDriverId) {
      setActionMsg("Pilih minimal satu driver");
      return;
    }
    setActionBusy(true);
    setActionMsg(null);
    try {
      await assignBisaExpressDrivers(actionShipment.id, {
        pickupDriverId: pickupDriverId || undefined,
        deliveryDriverId: deliveryDriverId || undefined,
      });
      setActionMsg("Driver berhasil di-assign");
      await loadShipments();
    } catch (e) {
      setActionMsg(e instanceof ApiError ? e.message : "Gagal assign driver");
    } finally {
      setActionBusy(false);
    }
  };

  const submitOverride = async () => {
    if (!actionShipment || !overrideStatus) return;
    setActionBusy(true);
    setActionMsg(null);
    try {
      await overrideBisaExpressStatus(actionShipment.id, {
        status: overrideStatus,
        description: overrideNote || undefined,
      });
      setActionMsg("Status berhasil di-override");
      await loadShipments();
    } catch (e) {
      setActionMsg(e instanceof ApiError ? e.message : "Gagal override status");
    } finally {
      setActionBusy(false);
    }
  };

  const loadRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rateList, coverage] = await Promise.all([
        fetchBisaExpressRates(),
        fetchBisaExpressCoverage().catch(() => []),
      ]);
      setRates(rateList);
      const fromRates = rateList.flatMap((r) => [r.originZone, r.destinationZone]);
      const fromCoverage = coverage.map((c) => c.zone);
      setZoneOptions(
        [...new Set([...fromCoverage, ...fromRates].filter(Boolean))].sort((a, b) =>
          a.localeCompare(b),
        ),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat tarif");
    } finally {
      setLoading(false);
    }
  }, []);

  const openCreateRate = () => {
    setRateForm(emptyRateForm());
    setRateMsg(null);
    setRateFormOpen(true);
  };

  const openEditRate = (r: BisaExpressRateItem) => {
    setRateForm({
      id: r.id,
      originZone: r.originZone,
      destinationZone: r.destinationZone,
      serviceType: r.serviceType,
      minWeight: String(r.minWeight),
      maxWeight: String(r.maxWeight),
      weightUnit: r.weightUnit === "TON" ? "TON" : "KG",
      baseCost: String(r.baseCost),
      perUnitCost: String(r.perUnitCost),
      etdDays: String(r.etdDays),
    });
    setRateMsg(null);
    setRateFormOpen(true);
  };

  const submitRateForm = async () => {
    const originZone = rateForm.originZone.trim();
    const destinationZone = rateForm.destinationZone.trim();
    if (!originZone || !destinationZone) {
      setRateMsg("Zona asal dan tujuan wajib diisi");
      return;
    }
    const baseCost = Number(rateForm.baseCost);
    const perUnitCost = Number(rateForm.perUnitCost);
    const minWeight = Number(rateForm.minWeight);
    const maxWeight = Number(rateForm.maxWeight);
    const etdDays = Number(rateForm.etdDays);
    if (![baseCost, perUnitCost, minWeight, maxWeight, etdDays].every((n) => Number.isFinite(n))) {
      setRateMsg("Isi angka biaya / berat / ETD dengan benar");
      return;
    }
    if (maxWeight <= minWeight) {
      setRateMsg("maxWeight harus lebih besar dari minWeight");
      return;
    }

    setRateBusy(true);
    setRateMsg(null);
    try {
      await upsertBisaExpressRate({
        id: rateForm.id,
        originZone,
        destinationZone,
        serviceType: rateForm.serviceType,
        minWeight,
        maxWeight,
        weightUnit: rateForm.weightUnit,
        baseCost,
        perUnitCost,
        etdDays,
      });
      setRateMsg(rateForm.id ? "Tarif diperbarui" : "Tarif ditambahkan");
      setRateFormOpen(false);
      setRateForm(emptyRateForm());
      await loadRates();
    } catch (e) {
      setRateMsg(e instanceof ApiError ? e.message : "Gagal menyimpan tarif");
    } finally {
      setRateBusy(false);
    }
  };

  const removeRate = async (r: BisaExpressRateItem) => {
    if (
      !window.confirm(
        `Hapus tarif ${r.serviceType} ${r.originZone} → ${r.destinationZone}?`,
      )
    ) {
      return;
    }
    setRateBusy(true);
    setRateMsg(null);
    try {
      await deleteBisaExpressRate(r.id);
      setRateMsg("Tarif dihapus");
      if (rateForm.id === r.id) {
        setRateFormOpen(false);
        setRateForm(emptyRateForm());
      }
      await loadRates();
    } catch (e) {
      setRateMsg(e instanceof ApiError ? e.message : "Gagal menghapus tarif");
    } finally {
      setRateBusy(false);
    }
  };

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRules(await fetchBisaExpressServiceRules());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat aturan layanan");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDrivers(await fetchBisaExpressDrivers());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat driver");
    } finally {
      setLoading(false);
    }
  }, []);

  const searchUsersForDriver = async () => {
    const q = userSearch.trim();
    if (q.length < 2) {
      setDriverMsg("Ketik minimal 2 karakter (nama / email)");
      return;
    }
    setDriverBusy(true);
    setDriverMsg(null);
    try {
      const res = await fetchUsers({ search: q, limit: 20, page: 1 });
      setUserHits(
        (res.items ?? []).map((u) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
        })),
      );
      if ((res.items ?? []).length === 0) setDriverMsg("User tidak ditemukan");
    } catch (e) {
      setDriverMsg(e instanceof ApiError ? e.message : "Gagal cari user");
    } finally {
      setDriverBusy(false);
    }
  };

  const submitCreateDriver = async () => {
    if (!selectedUserId) {
      setDriverMsg("Pilih user dulu");
      return;
    }
    if (employeeCode.trim().length < 3) {
      setDriverMsg("Kode karyawan minimal 3 karakter");
      return;
    }
    setDriverBusy(true);
    setDriverMsg(null);
    try {
      await createBisaExpressDriver({
        userId: selectedUserId,
        employeeCode: employeeCode.trim(),
        vehicleType,
        vehiclePlate: vehiclePlate.trim() || undefined,
      });
      setDriverMsg("Driver didaftarkan · role user → COURIER (jika bukan ADMIN)");
      setDriverFormOpen(false);
      setSelectedUserId("");
      setEmployeeCode("");
      setVehiclePlate("");
      setUserHits([]);
      setUserSearch("");
      await loadDrivers();
    } catch (e) {
      setDriverMsg(e instanceof ApiError ? e.message : "Gagal daftar driver");
    } finally {
      setDriverBusy(false);
    }
  };

  useEffect(() => {
    if (tab === "overview") void loadOverview();
    if (tab === "shipments") void loadShipments();
    if (tab === "rates") void loadRates();
    if (tab === "rules") void loadRules();
    if (tab === "drivers") void loadDrivers();
  }, [tab, loadOverview, loadShipments, loadRates, loadRules, loadDrivers]);

  const byStatus = Array.isArray(dashboard?.byStatus) ? dashboard!.byStatus : [];

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "shipments", label: "Shipments" },
    { id: "rates", label: "Tarif" },
    { id: "rules", label: "Aturan layanan" },
    { id: "drivers", label: "Driver" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={tab === t.id ? "primary" : "outline"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}
      {loading && <p className="text-sm text-gray-500">Memuat…</p>}

      {tab === "overview" && dashboard && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ComponentCard title="Shipment hari ini">
            <p className="text-2xl font-semibold">{Number(dashboard.todayCount ?? 0)}</p>
          </ComponentCard>
          <ComponentCard title="Driver aktif">
            <p className="text-2xl font-semibold">{Number(dashboard.activeDrivers ?? 0)}</p>
          </ComponentCard>
          <ComponentCard title="Hub aktif">
            <p className="text-2xl font-semibold">
              {hubs.filter((h) => h.isActive).length}
            </p>
          </ComponentCard>
          <ComponentCard title="Status breakdown">
            <ul className="space-y-1 text-sm">
              {byStatus.map((row: { status?: string; _count?: { _all?: number } }) => (
                <li key={String(row.status)} className="flex justify-between gap-2">
                  <span>{row.status}</span>
                  <span className="font-medium">{row._count?._all ?? 0}</span>
                </li>
              ))}
              {byStatus.length === 0 && <li className="text-gray-500">Belum ada shipment</li>}
            </ul>
          </ComponentCard>
        </div>
      )}

      {tab === "shipments" && (
        <ComponentCard title="Shipment BISA Express">
          <div className="mb-4 flex flex-wrap gap-2">
            <Input
              placeholder="Cari AWB / order…"
              defaultValue={shipSearch}
              onChange={(e) => setShipSearch(e.target.value)}
            />
            <Button size="sm" onClick={() => { setShipPage(1); void loadShipments(); }}>
              Cari
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>AWB</TableCell>
                  <TableCell isHeader>Order</TableCell>
                  <TableCell isHeader>Status</TableCell>
                  <TableCell isHeader>Layanan</TableCell>
                  <TableCell isHeader>Berat</TableCell>
                  <TableCell isHeader>Ongkir</TableCell>
                  <TableCell isHeader>Aksi</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.awbNumber}</TableCell>
                    <TableCell>{s.order?.orderNumber ?? "-"}</TableCell>
                    <TableCell>
                      <Badge color={statusColor(s.status)}>{s.status}</Badge>
                    </TableCell>
                    <TableCell>{s.serviceType ?? "-"}</TableCell>
                    <TableCell>
                      {s.weight != null ? `${s.weight} ${s.weightUnit ?? ""}` : "-"}
                    </TableCell>
                    <TableCell>{money(s.shippingCost)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openShipmentAction(s)}>
                        Kelola
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {shipments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      Belum ada shipment
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4">
            <Pagination
              currentPage={shipPage}
              totalPages={Math.max(1, Math.ceil(shipTotal / 20))}
              onPageChange={setShipPage}
            />
          </div>

          {actionShipment && (
            <div className="mt-6 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">Kelola shipment</p>
                  <p className="font-mono text-xs text-gray-500">{actionShipment.awbNumber}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActionShipment(null)}>
                  Tutup
                </Button>
              </div>

              {actionMsg && (
                <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">{actionMsg}</p>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Assign driver</p>
                  <label className="block text-xs text-gray-500">Pickup driver</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
                    value={pickupDriverId}
                    onChange={(e) => setPickupDriverId(e.target.value)}
                  >
                    <option value="">— pilih —</option>
                    {drivers
                      .filter((d) => d.isActive)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.employeeCode} · {d.user?.fullName ?? d.status}
                        </option>
                      ))}
                  </select>
                  <label className="block text-xs text-gray-500">Delivery driver</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
                    value={deliveryDriverId}
                    onChange={(e) => setDeliveryDriverId(e.target.value)}
                  >
                    <option value="">— pilih —</option>
                    {drivers
                      .filter((d) => d.isActive)
                      .map((d) => (
                        <option key={`d-${d.id}`} value={d.id}>
                          {d.employeeCode} · {d.user?.fullName ?? d.status}
                        </option>
                      ))}
                  </select>
                  <Button size="sm" disabled={actionBusy} onClick={() => void submitAssign()}>
                    Simpan assign
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Override status</p>
                  <label className="block text-xs text-gray-500">Status baru</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <label className="block text-xs text-gray-500">Catatan (opsional)</label>
                  <Input
                    placeholder="Alasan override…"
                    value={overrideNote}
                    onChange={(e) => setOverrideNote(e.target.value)}
                  />
                  <Button size="sm" disabled={actionBusy} onClick={() => void submitOverride()}>
                    Simpan status
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ComponentCard>
      )}

      {tab === "rates" && (
        <ComponentCard title="Tarif (per UnitStatus)">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={openCreateRate}>
              + Tambah tarif
            </Button>
            {rateMsg && (
              <p className="text-sm text-gray-600 dark:text-gray-300">{rateMsg}</p>
            )}
          </div>

          {rateFormOpen && (
            <div className="mb-6 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex items-start justify-between gap-3">
                <p className="font-semibold">
                  {rateForm.id ? "Edit tarif" : "Tarif baru"}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRateFormOpen(false);
                    setRateForm(emptyRateForm());
                  }}
                >
                  Tutup
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Zona asal</label>
                  <Input
                    list="bisa-zone-options"
                    placeholder="mis. JABODETABEK"
                    value={rateForm.originZone}
                    onChange={(e) =>
                      setRateForm((f) => ({ ...f, originZone: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Zona tujuan</label>
                  <Input
                    list="bisa-zone-options"
                    placeholder="mis. JAWA_BARAT"
                    value={rateForm.destinationZone}
                    onChange={(e) =>
                      setRateForm((f) => ({ ...f, destinationZone: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Layanan</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
                    value={rateForm.serviceType}
                    onChange={(e) =>
                      setRateForm((f) => ({ ...f, serviceType: e.target.value }))
                    }
                  >
                    {SERVICE_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Min berat</label>
                  <Input
                    type="number"
                    step={0.001}
                    value={rateForm.minWeight}
                    onChange={(e) =>
                      setRateForm((f) => ({ ...f, minWeight: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Max berat</label>
                  <Input
                    type="number"
                    step={0.001}
                    value={rateForm.maxWeight}
                    onChange={(e) =>
                      setRateForm((f) => ({ ...f, maxWeight: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Unit berat</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
                    value={rateForm.weightUnit}
                    onChange={(e) =>
                      setRateForm((f) => ({
                        ...f,
                        weightUnit: e.target.value === "TON" ? "TON" : "KG",
                      }))
                    }
                  >
                    {WEIGHT_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Base cost (IDR)</label>
                  <Input
                    type="number"
                    value={rateForm.baseCost}
                    onChange={(e) =>
                      setRateForm((f) => ({ ...f, baseCost: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Per unit (IDR)</label>
                  <Input
                    type="number"
                    value={rateForm.perUnitCost}
                    onChange={(e) =>
                      setRateForm((f) => ({ ...f, perUnitCost: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">ETD (hari)</label>
                  <Input
                    type="number"
                    value={rateForm.etdDays}
                    onChange={(e) =>
                      setRateForm((f) => ({ ...f, etdDays: e.target.value }))
                    }
                  />
                </div>
              </div>

              <datalist id="bisa-zone-options">
                {zoneOptions.map((z) => (
                  <option key={z} value={z} />
                ))}
              </datalist>

              <div className="mt-4">
                <Button size="sm" disabled={rateBusy} onClick={() => void submitRateForm()}>
                  {rateForm.id ? "Simpan perubahan" : "Simpan tarif"}
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Asal</TableCell>
                  <TableCell isHeader>Tujuan</TableCell>
                  <TableCell isHeader>Layanan</TableCell>
                  <TableCell isHeader>Band berat</TableCell>
                  <TableCell isHeader>Unit</TableCell>
                  <TableCell isHeader>Base</TableCell>
                  <TableCell isHeader>Per unit</TableCell>
                  <TableCell isHeader>ETD</TableCell>
                  <TableCell isHeader>Aksi</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.originZone}</TableCell>
                    <TableCell>{r.destinationZone}</TableCell>
                    <TableCell>{r.serviceType}</TableCell>
                    <TableCell>
                      {r.minWeight} – {r.maxWeight}
                    </TableCell>
                    <TableCell>{r.weightUnit}</TableCell>
                    <TableCell>{money(r.baseCost)}</TableCell>
                    <TableCell>{money(r.perUnitCost)}</TableCell>
                    <TableCell>{r.etdDays}h</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={rateBusy}
                          onClick={() => openEditRate(r)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={rateBusy}
                          onClick={() => void removeRate(r)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500">
                      Belum ada tarif
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </ComponentCard>
      )}

      {tab === "rules" && (
        <ComponentCard title="Aturan layanan vs berat">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Layanan</TableCell>
                  <TableCell isHeader>Label</TableCell>
                  <TableCell isHeader>Min–Max</TableCell>
                  <TableCell isHeader>Unit</TableCell>
                  <TableCell isHeader>Always</TableCell>
                  <TableCell isHeader>Aktif</TableCell>
                  <TableCell isHeader></TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.serviceType}</TableCell>
                    <TableCell>{r.label ?? "-"}</TableCell>
                    <TableCell>
                      {r.minWeight} – {r.maxWeight}
                    </TableCell>
                    <TableCell>{r.weightUnit}</TableCell>
                    <TableCell>{r.alwaysAvailable ? "Ya" : "Tidak"}</TableCell>
                    <TableCell>
                      <Badge color={r.isActive ? "success" : "light"}>
                        {r.isActive ? "Aktif" : "Off"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await upsertBisaExpressServiceRule({
                              id: r.id,
                              serviceType: r.serviceType,
                              minWeight: Number(r.minWeight),
                              maxWeight: Number(r.maxWeight),
                              weightUnit: r.weightUnit,
                              alwaysAvailable: r.alwaysAvailable,
                              isActive: !r.isActive,
                              label: r.label,
                              sortOrder: r.sortOrder,
                              note: r.note,
                            });
                            await loadRules();
                          } catch (e) {
                            setError(
                              e instanceof ApiError ? e.message : "Gagal update rule",
                            );
                          }
                        }}
                      >
                        {r.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ComponentCard>
      )}

      {tab === "drivers" && (
        <ComponentCard title="Driver BISA Express">
          <p className="mb-3 text-sm text-gray-500">
            Role <strong>COURIER</strong> hanya label di admin (belum ada app kurir).
            Mendaftarkan driver akan mengubah role user jadi COURIER (kecuali ADMIN).
          </p>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setDriverFormOpen(true);
                setDriverMsg(null);
              }}
            >
              + Daftarkan driver
            </Button>
            {driverMsg && (
              <p className="text-sm text-gray-600 dark:text-gray-300">{driverMsg}</p>
            )}
          </div>

          {driverFormOpen && (
            <div className="mb-6 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex items-start justify-between gap-3">
                <p className="font-semibold">Daftarkan user sebagai kurir</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDriverFormOpen(false)}
                >
                  Tutup
                </Button>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Input
                  placeholder="Cari nama / email user…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={driverBusy}
                  onClick={() => void searchUsersForDriver()}
                >
                  Cari user
                </Button>
              </div>
              {userHits.length > 0 && (
                <div className="mb-3 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  {userHits.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedUserId === u.id ? "bg-brand-50 dark:bg-brand-500/10" : ""
                      }`}
                      onClick={() => setSelectedUserId(u.id)}
                    >
                      <span className="font-medium">{u.fullName}</span>
                      <span className="text-gray-500"> · {u.email}</span>
                      <span className="text-gray-400"> · {u.role}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Kode karyawan</label>
                  <Input
                    placeholder="DRV-001"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Jenis kendaraan</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                  >
                    {VEHICLE_TYPES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Plat (opsional)</label>
                  <Input
                    placeholder="B 1234 XX"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button
                  size="sm"
                  disabled={driverBusy}
                  onClick={() => void submitCreateDriver()}
                >
                  Simpan driver
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Kode</TableCell>
                  <TableCell isHeader>Nama</TableCell>
                  <TableCell isHeader>Role</TableCell>
                  <TableCell isHeader>Status</TableCell>
                  <TableCell isHeader>Kendaraan</TableCell>
                  <TableCell isHeader>Aktif</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.employeeCode}</TableCell>
                    <TableCell>{d.user?.fullName ?? "-"}</TableCell>
                    <TableCell>
                      <Badge color={d.user?.role === "COURIER" ? "warning" : "light"}>
                        {d.user?.role ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge color={statusColor(d.status)}>{d.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {d.vehicleType ?? "-"} {d.vehiclePlate ? `· ${d.vehiclePlate}` : ""}
                    </TableCell>
                    <TableCell>{d.isActive ? "Ya" : "Tidak"}</TableCell>
                  </TableRow>
                ))}
                {drivers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      Belum ada driver
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </ComponentCard>
      )}
    </div>
  );
}
