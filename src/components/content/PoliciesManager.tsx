"use client";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { fetchPoliciesAdmin, updatePolicyAdmin } from "@/lib/api/extended";
import type { PolicyItem } from "@/types/extended";
import { useCallback, useEffect, useState } from "react";

export default function PoliciesManager() {
  const [items, setItems] = useState<PolicyItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [version, setVersion] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchPoliciesAdmin());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat kebijakan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(p: PolicyItem) {
    setEditId(p.id);
    setContent(p.content);
    setVersion(p.version);
    setIsActive(p.isActive);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    setError(null);
    try {
      await updatePolicyAdmin(editId, { content, version, isActive });
      setEditId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {items.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => startEdit(p)}
            className={`rounded-2xl border p-4 text-left transition ${
              editId === p.id
                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                : "border-gray-200 dark:border-gray-800"
            }`}
          >
            <p className="font-medium">{p.title}</p>
            <p className="text-theme-xs text-gray-500">v{p.version}</p>
          </button>
        ))}
      </div>
      {editId && (
        <ComponentCard title="Edit kebijakan">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-theme-xs text-gray-500">Versi</label>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="h-10 w-full max-w-xs rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-theme-xs text-gray-500">Konten</label>
              <textarea
                required
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Aktif
            </label>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </ComponentCard>
      )}
    </div>
  );
}
