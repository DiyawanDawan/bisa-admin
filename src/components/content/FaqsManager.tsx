"use client";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createFaq, deleteFaq, fetchFaqs, updateFaq } from "@/lib/api/content";
import type { FaqItem } from "@/types/content";
import { useCallback, useEffect, useState } from "react";

export default function FaqsManager() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFaqs({ page: 1, limit: 100, includeInactive: true });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat FAQ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditId(null);
    setQuestion("");
    setAnswer("");
    setOrder("0");
    setIsActive(true);
  }

  function startEdit(faq: FaqItem) {
    setEditId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setOrder(String(faq.order));
    setIsActive(faq.isActive);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        question,
        answer,
        order: Number(order) || 0,
        isActive,
      };
      if (editId) {
        await updateFaq(editId, payload);
      } else {
        await createFaq(payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan FAQ.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus FAQ ini?")) return;
    try {
      await deleteFaq(id);
      if (editId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}

      <ComponentCard title={editId ? "Edit FAQ" : "FAQ baru"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-500">Pertanyaan</label>
            <input
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-500">Jawaban</label>
            <textarea
              required
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-theme-xs text-gray-500">Urutan</label>
              <input
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="h-10 w-24 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Aktif
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Menyimpan..." : editId ? "Perbarui" : "Tambah"}
            </Button>
            {editId && (
              <Button type="button" size="sm" variant="outline" onClick={resetForm}>
                Batal
              </Button>
            )}
          </div>
        </form>
      </ComponentCard>

      <ComponentCard title="Daftar FAQ">
        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                  Pertanyaan
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                  Status
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-end text-theme-xs text-gray-500">
                  Aksi
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="px-4 py-3 text-sm">{f.question}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge color={f.isActive ? "success" : "warning"} size="sm">
                      {f.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-end">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => startEdit(f)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(f.id)}>
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ComponentCard>
    </div>
  );
}
