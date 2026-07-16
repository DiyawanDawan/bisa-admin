"use client";
import AdminInfoBanner from "@/components/common/AdminInfoBanner";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  createAdminIotDevice, 
  fetchAdminIotDevices,
  updateAdminIotDevice,
  deleteAdminIotDevice 
} from "@/lib/api/extended";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { AdminIotDeviceItem, AdminIotProvisionResult } from "@/types/extended";
import { useCallback, useEffect } from "react";

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
  
  // Edit/Delete states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  
  // Modal states
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<AdminIotDeviceItem | null>(null);

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

  const handleEdit = (device: AdminIotDeviceItem) => {
    setEditingId(device.id);
    setEditName(device.name || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleSaveEdit = async (deviceId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await updateAdminIotDevice(deviceId, {
        name: editName.trim() || undefined,
      });
      await load();
      handleCancelEdit();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal update perangkat");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (deviceId: string, deviceName: string) => {
    if (!confirm(`Hapus perangkat "${deviceName}"? Semua data sensor akan hilang!`)) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await deleteAdminIotDevice(deviceId);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal menghapus perangkat");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSecret = (deviceId: string) => {
    setShowSecret(prev => ({ ...prev, [deviceId]: !prev[deviceId] }));
  };

  const handleShowSecretModal = (device: AdminIotDeviceItem) => {
    setSelectedDevice(device);
    setShowSecretModal(true);
  };

  const handleCloseSecretModal = () => {
    setShowSecretModal(false);
    setSelectedDevice(null);
  };

  const handleDownloadQr = () => {
    if (!selectedDevice) return;
    
    // Build QR payload
    const qrPayload = {
      serialNumber: selectedDevice.deviceId,
      deviceSecret: selectedDevice.deviceSecret,
    };
    
    // Create canvas from QR code
    const svg = document.getElementById('device-secret-qr');
    if (!svg) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${selectedDevice.deviceId}-qr.png`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
      });
      
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
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
                  <TableCell isHeader>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      {editingId === d.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nama perangkat"
                          className="mb-2"
                        />
                      ) : (
                        <div className="font-medium text-gray-800 dark:text-white/90">
                          {d.name}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">{d.deviceId}</div>
                    </TableCell>
                    <TableCell>
                      {d.ownerName ? (
                        <>
                          <div className="font-medium">{d.ownerName}</div>
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
                      <span className="font-semibold text-gray-800 dark:text-white/90">
                        {d.lastTemp != null ? `${d.lastTemp}°C` : "—"}
                      </span>
                      {d.thresholdMin != null && d.thresholdMax != null && (
                        <div className="text-xs text-gray-500 mt-1">
                          Range: {d.thresholdMin}°C - {d.thresholdMax}°C
                        </div>
                      )}
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
                    <TableCell>
                      {editingId === d.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(d.id)}
                            disabled={submitting}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleCancelEdit}
                            disabled={submitting}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleShowSecretModal(d)}
                            disabled={submitting}
                            className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
                            title="Show QR & Secret"
                          >
                            QR
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(d)}
                            disabled={submitting}
                            className="rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600 disabled:opacity-50"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(d.id, d.name)}
                            disabled={submitting}
                            className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600 disabled:opacity-50"
                            title="Delete"
                          >
                            Del
                          </button>
                        </div>
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

      {/* Device Secret Modal */}
      {showSecretModal && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            {/* Close button */}
            <button
              type="button"
              onClick={handleCloseSecretModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal content */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Device Secret & QR Code
              </h3>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedDevice.name}
                </p>
                <p className="text-xs text-gray-500">{selectedDevice.deviceId}</p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
                <QRCodeSVG 
                  id="device-secret-qr"
                  value={JSON.stringify({
                    serialNumber: selectedDevice.deviceId,
                    deviceSecret: selectedDevice.deviceSecret,
                  })} 
                  size={220} 
                  level="M" 
                  includeMargin 
                />
                <p className="text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                  Scan untuk re-provision atau backup
                </p>
              </div>

              {/* Device Secret */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Device Secret (X-Device-Token)
                </label>
                <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                  <code className="block break-all text-xs text-gray-800 dark:text-gray-200">
                    {selectedDevice.deviceSecret}
                  </code>
                </div>
              </div>

              {/* Owner Info */}
              {selectedDevice.ownerName && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Owner
                  </label>
                  <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {selectedDevice.ownerName}
                    </p>
                    <p className="text-xs text-gray-500">{selectedDevice.ownerEmail}</p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDownloadQr}
                  className="flex-1"
                >
                  Download QR
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleCloseSecretModal}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
