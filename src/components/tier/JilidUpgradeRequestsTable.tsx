"use client";

import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Bentuk data siap di-wire ke API nanti. */
export type JilidUpgradeRequest = {
  id: string;
  userName: string;
  userEmail: string;
  currentTier: string;
  requestedTier: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

/** Sementara kosong — isi dari API saat endpoint tersedia. */
const PLACEHOLDER_ROWS: JilidUpgradeRequest[] = [];

function statusBadge(status: JilidUpgradeRequest["status"]) {
  if (status === "APPROVED") {
    return (
      <Badge color="success" size="sm">
        Disetujui
      </Badge>
    );
  }
  if (status === "REJECTED") {
    return (
      <Badge color="error" size="sm">
        Ditolak
      </Badge>
    );
  }
  return (
    <Badge color="warning" size="sm">
      Menunggu
    </Badge>
  );
}

export default function JilidUpgradeRequestsTable() {
  const rows = PLACEHOLDER_ROWS;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell
                isHeader
                className="w-12 px-4 py-3 text-theme-xs text-gray-500"
              >
                {/* Kolom centang — aksi massal nanti */}
                <span className="sr-only">Pilih</span>
                <input
                  type="checkbox"
                  disabled
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 opacity-40"
                  aria-label="Pilih semua (segera)"
                />
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                Pengguna
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                Tier saat ini
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                Diminta
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                Alasan
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                Status
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                Diajukan
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-end text-theme-xs text-gray-500"
              >
                Aksi
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="px-4 py-16 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  Belum ada permintaan naik jilid.
                  <span className="mt-1 block text-theme-xs text-gray-400">
                    Tabel siap; centang + aksi setuju/tolak akan ditambahkan setelah API
                    terhubung.
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-4 py-3">
                    <input
                      type="checkbox"
                      disabled
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 opacity-40"
                      aria-label={`Pilih ${row.userName}`}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {row.userName}
                    </span>
                    <span className="block text-theme-xs text-gray-400">
                      {row.userEmail}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {row.currentTier}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                    {row.requestedTier}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate px-4 py-3 text-sm text-gray-500">
                    {row.reason || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {statusBadge(row.status)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-500">
                    {row.createdAt}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-end text-theme-xs text-gray-400">
                    —
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
