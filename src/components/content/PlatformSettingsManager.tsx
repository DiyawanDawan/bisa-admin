"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  fetchPlatformSettingsAdmin,
  savePlatformSettingsAdmin,
} from "@/lib/api/platform-settings";
import type { PlatformSettingItem } from "@/types/platform-settings";
import { useCallback, useEffect, useState } from "react";

function sourceLabel(source: PlatformSettingItem["source"]) {
  switch (source) {
    case "database":
      return "Database";
    case "environment":
      return "Environment (.env)";
    default:
      return "Belum diisi";
  }
}

function sourceColor(source: PlatformSettingItem["source"]) {
  switch (source) {
    case "database":
      return "success" as const;
    case "environment":
      return "warning" as const;
    default:
      return "light" as const;
  }
}

export default function PlatformSettingsManager() {
  const [items, setItems] = useState<PlatformSettingItem[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlatformSettingsAdmin();
      setItems(data);
      setValues(Object.fromEntries(data.map((i) => [i.key, i.value])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pengaturan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await savePlatformSettingsAdmin(values);
      setItems(saved);
      setValues(Object.fromEntries(saved.map((i) => [i.key, i.value])));
      setSuccess("Pengaturan disimpan. Mobile & landing publik memakai nilai baru.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-800">
          {success}
        </div>
      )}

      <ComponentCard title="Pengaturan Platform BISA">
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Mengatur kontak CS, URL verifikasi QR tagihan, dan parameter pembayaran
          Xendit. Setelah disimpan, nilai disimpan di database dan dipakai aplikasi
          mobile serta halaman publik <code className="text-xs">/verify</code> dan{" "}
          <code className="text-xs">/track</code>.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          {items.map((item) => (
            <div
              key={item.key}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <label
                  htmlFor={item.key}
                  className="text-sm font-semibold text-gray-800 dark:text-white/90"
                >
                  {item.label}
                </label>
                <Badge size="sm" color={sourceColor(item.source)}>
                  {sourceLabel(item.source)}
                </Badge>
                <span className="text-theme-xs font-mono text-gray-400">
                  {item.key}
                </span>
              </div>
              <p className="mb-3 text-theme-xs text-gray-500">{item.description}</p>
              <input
                id={item.key}
                type={item.type === "number" ? "number" : "text"}
                value={values[item.key] ?? ""}
                onChange={(e) => updateValue(item.key, e.target.value)}
                placeholder={item.placeholder}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          ))}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan semua pengaturan"}
            </Button>
            <Button type="button" variant="outline" onClick={load} disabled={saving}>
              Muat ulang
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
