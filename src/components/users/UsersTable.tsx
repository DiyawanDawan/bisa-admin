"use client";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import UserAvatar from "@/components/common/UserAvatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchUsers, updateUserStatus } from "@/lib/api/admin";
import { formatDate } from "@/lib/format";
import type { UserListItem, UserStatus } from "@/types/admin";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const ROLES = ["", "SUPPLIER", "BUYER", "ADMIN"] as const;
const STATUSES = ["", "ACTIVE", "BLOCKED", "INACTIVE", "DELETED"] as const;

const ROLE_LABELS: Record<string, string> = {
  SUPPLIER: "Supplier",
  BUYER: "Pembeli",
  ADMIN: "Admin",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif",
  BLOCKED: "Diblokir",
  INACTIVE: "Nonaktif",
  DELETED: "Dihapus",
};

function roleBadge(role: string) {
  const color =
    role === "ADMIN" ? "dark" : role === "SUPPLIER" ? "primary" : "info";
  return (
    <Badge color={color as "dark" | "primary" | "info"} size="sm">
      {ROLE_LABELS[role] ?? role}
    </Badge>
  );
}

function statusBadge(status: string) {
  const map: Record<string, "success" | "error" | "warning" | "light"> = {
    ACTIVE: "success",
    BLOCKED: "error",
    INACTIVE: "warning",
    DELETED: "light",
  };
  return (
    <Badge color={map[status] ?? "light"} size="sm">
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

type Props = {
  roleFilter?: string;
  statusFilter?: string;
  onRoleFilterChange?: (role: string) => void;
  onStatusFilterChange?: (status: string) => void;
};

export default function UsersTable({
  roleFilter = "",
  statusFilter = "",
  onRoleFilterChange,
  onStatusFilterChange,
}: Props) {
  const [items, setItems] = useState<UserListItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUsers({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        status: (statusFilter || undefined) as UserStatus | undefined,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setError("Gagal memuat daftar pengguna.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleBlock(user: UserListItem) {
    const next: UserStatus = user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED";
    if (!confirm(`${next === "BLOCKED" ? "Blokir" : "Aktifkan"} ${user.fullName}?`)) {
      return;
    }
    setActionId(user.id);
    try {
      await updateUserStatus(user.id, next);
      await load();
    } catch {
      alert("Gagal memperbarui status user.");
    } finally {
      setActionId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 10));

  return (
    <div id="users-table" className="scroll-mt-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:px-6">
        <div>
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            Daftar pengguna
          </h3>
          {!loading && (
            <p className="mt-0.5 text-theme-xs text-gray-500">{total} akun</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Cari nama / email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full min-w-[180px] rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 sm:max-w-xs"
          />
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange?.(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {ROLES.map((r) => (
              <option key={r || "all"} value={r}>
                {r ? (ROLE_LABELS[r] ?? r) : "Semua role"}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange?.(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {STATUSES.map((s) => (
              <option key={s || "all"} value={s}>
                {s ? (STATUS_LABELS[s] ?? s) : "Semua status"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 text-sm text-error-600">
          {error}
          <button type="button" onClick={load} className="ml-2 underline">
            Coba lagi
          </button>
        </div>
      )}

      {loading ? (
        <div className="mx-6 mb-6 h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      ) : items.length === 0 ? (
        <div className="mx-6 mb-6 rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tidak ada pengguna untuk filter ini.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">
                  Pengguna
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">
                  Email
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">
                  Role
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">
                  Bergabung
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500">
                  Aksi
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar src={user.avatarUrl} name={user.fullName} />
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {user.fullName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {user.email}
                  </TableCell>
                  <TableCell className="px-5 py-4">{roleBadge(user.role)}</TableCell>
                  <TableCell className="px-5 py-4">{statusBadge(user.status)}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-end">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/users/${user.id}`}
                        className="text-sm text-brand-600 hover:underline"
                      >
                        Dossier
                      </Link>
                      {user.role !== "ADMIN" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionId === user.id}
                          onClick={() => toggleBlock(user)}
                        >
                          {user.status === "BLOCKED" ? "Aktifkan" : "Blokir"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <span className="text-sm text-gray-500">
            Halaman {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
