"use client";
import AdminInfoBanner from "@/components/common/AdminInfoBanner";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAdminIotDevices } from "@/lib/api/extended";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { AdminIotDeviceItem } from "@/types/extended";
import { useCallback, useEffect, useState } from "react";

function liveBadgeColor(status: string): "success" | "warning" | "error" | "light" {
  if (status === "ONLINE") return "success";
  if (status === "ALERT") return "error";
  return "warning";
}

export default function IotDevicesPanel() {
  const [items, setItems] = useState<AdminIotDeviceItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminIotDevices({ page, limit: 20, search });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat perangkat IoT");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <AdminInfoBanner>
        Monitoring IoT read-only: status live supplier, suhu terakhir, dan peringatan
        aktif. Data telemetry detail tetap di aplikasi mobile PRO.
      </AdminInfoBanner>

      {error && (
        <Alert variant="error" title="Error" message={error} />
      )}

      <ComponentCard title="Perangkat IoT Supplier">
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Cari nama atau device ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Memuat...</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Perangkat</TableCell>
                  <TableCell isHeader>Supplier</TableCell>
                  <TableCell isHeader>Status</TableCell>
                  <TableCell isHeader>Suhu</TableCell>
                  <TableCell isHeader>Terakhir</TableCell>
                  <TableCell isHeader>Alert</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium text-gray-800 dark:text-white/90">
                        {d.name}
                      </div>
                      <div className="text-xs text-gray-500">{d.deviceId}</div>
                    </TableCell>
                    <TableCell>
                      <div>{d.ownerName}</div>
                      <div className="text-xs text-gray-500">{d.ownerEmail}</div>
                    </TableCell>
                    <TableCell>
                      <Badge color={liveBadgeColor(d.liveStatus)} size="sm">
                        {d.isMonitoringEnabled ? d.liveStatus : "DISABLED"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {d.lastTemp != null ? `${d.lastTemp}°C` : "—"}
                    </TableCell>
                    <TableCell>
                      {d.lastSeen ? formatDate(d.lastSeen) : "—"}
                    </TableCell>
                    <TableCell>
                      {d.hasUnreadAlert ? (
                        <Badge color="error" size="sm">
                          Aktif
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500">
          Total {total} perangkat · Halaman {page}
        </p>
      </ComponentCard>
    </div>
  );
}
