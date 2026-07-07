"use client";
import AdminInfoBanner from "@/components/common/AdminInfoBanner";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdminIotDevice, fetchAdminIotDevices } from "@/lib/api/extended";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { AdminIotDeviceItem, AdminIotProvisionResult } from "@/types/extended";
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serialNumber, setSerialNumber] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [provisioned, setProvisioned] = useState<AdminIotProvisionResult | null>(null);

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

  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrintQr = () => {
    if (!printAreaRef.current) return;
    const printWindow = window.open("", "_blank", "width=420,height=560");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Label QR Perangkat IoT</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 24px; }
            .label { font-size: 12px; margin-top: 12px; word-break: break-all; }
          </style>
        </head>
        <body>${printAreaRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleCreateDevice = async () => {
    if (!serialNumber.trim()) {
      setError("Serial number wajib diisi");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await createAdminIotDevice({
        serialNumber: serialNumber.trim(),
        name: deviceName.trim() || undefined,
      });
      setProvisioned(result);
      setSerialNumber("");
      setDeviceName("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal membuat perangkat IoT");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminInfoBanner>
        Admin mem-provision perangkat lebih dulu: input serial number, generate
        device secret, lalu tempel QR di alat. Setelah petani claim, ownership akan
        muncul otomatis di tabel ini.
      </AdminInfoBanner>

      <ComponentCard title="Provision Perangkat IoT Baru">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Input
            placeholder="Serial Number (contoh: ESP32-LOMBOK-001)"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
          />
          <Input
            placeholder="Nama internal opsional"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            disabled={submitting || !serialNumber.trim()}
            onClick={handleCreateDevice}
          >
            {submitting ? "Generating..." : "Generate QR Data"}
          </Button>
        </div>

        {provisioned && (
          <div className="mt-4 flex flex-col gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800 md:flex-row">
            <div
              ref={printAreaRef}
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-700"
            >
              <QRCodeSVG value={provisioned.qrData} size={180} level="M" includeMargin />
              <p className="label text-xs font-semibold text-gray-800 dark:text-white/90">
                {provisioned.serialNumber}
              </p>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Device berhasil diprovision
                </p>
                <p className="text-xs text-gray-500">
                  Cetak / tempel QR di badan alat sebelum dikirim ke petani.
                </p>
              </div>
              <Input value={provisioned.serialNumber} disabled hint="Serial number" />
              <Input value={provisioned.deviceSecret} disabled hint="Device secret / X-Device-Token" />
              <Button type="button" size="sm" onClick={handlePrintQr}>
                Cetak Label QR
              </Button>
            </div>
          </div>
        )}
      </ComponentCard>

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
                  <TableCell isHeader>Owner</TableCell>
                  <TableCell isHeader>Claim</TableCell>
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
                      {d.ownerName ? (
                        <>
                          <div>{d.ownerName}</div>
                          <div className="text-xs text-gray-500">{d.ownerEmail}</div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Belum di-claim</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge color={d.isClaimed ? "success" : "light"} size="sm">
                        {d.isClaimed ? "Claimed" : "Pending"}
                      </Badge>
                      <div className="mt-1 text-xs text-gray-500">
                        {d.ownedAt ? formatDate(d.ownedAt) : "—"}
                      </div>
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
