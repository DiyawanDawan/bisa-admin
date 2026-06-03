"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { fetchBroadcastHistory, fetchNotificationStats } from "@/lib/api/admin";
import type { BroadcastHistoryItem, NotificationAdminStats } from "@/types/admin";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<NotificationAdminStats | null>(null);
  const [items, setItems] = useState<BroadcastHistoryItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [s, h] = await Promise.all([
          fetchNotificationStats(),
          fetchBroadcastHistory({ page: 1, limit: 5 }),
        ]);
        if (!cancelled) {
          setStats(s);
          setItems(h.items);
        }
      } catch {
        if (!cancelled) {
          setStats(null);
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const badgeCount = useMemo(() => {
    const count = stats?.unreadNotifications ?? 0;
    return count > 99 ? "99+" : `${count}`;
  }, [stats]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifikasi"
        className="dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={() => setIsOpen((open) => !open)}
      >
        {(stats?.unreadNotifications ?? 0) > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold leading-none text-white">
            {badgeCount}
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute -right-[240px] mt-[17px] flex w-[320px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[340px] lg:right-0"
      >
        <h5 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
          Notifikasi
        </h5>
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Memuat notifikasi...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Belum ada broadcast terbaru. Gunakan halaman{" "}
            <span className="font-medium text-brand-600">Notifikasi</span> untuk kirim pengumuman.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-100 p-2 dark:border-gray-800"
              >
                <p className="line-clamp-1 text-xs font-semibold text-gray-800 dark:text-gray-100">
                  {item.title}
                </p>
                <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                  {item.messagePreview ?? "-"}
                </p>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                  {new Date(item.sentAt).toLocaleString("id-ID")}
                </p>
              </div>
            ))}
          </div>
        )}
      </Dropdown>
    </div>
  );
}
