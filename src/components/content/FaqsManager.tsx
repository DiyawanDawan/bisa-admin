"use client";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/tables/Pagination";
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
import { formatDate } from "@/lib/format";
import type { FaqItem } from "@/types/content";
import { useCallback, useEffect, useMemo, useState } from "react";

function answerPreview(text: string, max = 100): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export default function FaqsManager() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FaqItem | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFaqs({
        page,
        limit,
        includeInactive: true,
        search: debouncedSearch || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat FAQ.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = useMemo(
    () => items.filter((f) => f.isActive).length,
    [items],
  );

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
    setDetail(faq);
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
      if (detail?.id === id) setDetail(null);
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
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
                  rows={5}
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
                  Aktif (tampil di Help Center)
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

          <ComponentCard
            title="Daftar FAQ"
            desc={`${total} total · ${activeCount} aktif di halaman ini`}
          >
            <div className="mb-3">
              <input
                type="search"
                placeholder="Cari pertanyaan / jawaban..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full max-w-md rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            {loading ? (
              <div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">Belum ada FAQ.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                        #
                      </TableCell>
                      <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                        Pertanyaan & jawaban
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
                      <TableRow
                        key={f.id}
                        className={detail?.id === f.id ? "bg-brand-50/50 dark:bg-brand-500/5" : undefined}
                      >
                        <TableCell className="px-4 py-3 text-sm text-gray-500">
                          {f.order}
                        </TableCell>
                        <TableCell className="max-w-md px-4 py-3">
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {f.question}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-theme-xs text-gray-500">
                            {answerPreview(f.answer)}
                          </p>
                          <p className="mt-1 text-[10px] text-gray-400">
                            Update {formatDate(f.updatedAt)}
                          </p>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge color={f.isActive ? "success" : "warning"} size="sm">
                            {f.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-end">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => setDetail(f)}>
                              Detail
                            </Button>
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
                <Pagination
                  page={page}
                  total={total}
                  limit={limit}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                />
              </>
            )}
          </ComponentCard>
        </div>

        <div className="xl:col-span-2">
          <ComponentCard title="Detail FAQ" desc="Isi lengkap pertanyaan & jawaban">
            {!detail ? (
              <p className="py-10 text-center text-sm text-gray-500">
                Pilih <strong>Detail</strong> pada FAQ untuk melihat jawaban lengkap.
              </p>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color={detail.isActive ? "success" : "warning"} size="sm">
                    {detail.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                  <span className="text-theme-xs text-gray-500">Urutan #{detail.order}</span>
                </div>
                <div>
                  <p className="text-theme-xs font-medium text-gray-500">Pertanyaan</p>
                  <h3 className="mt-1 text-base font-semibold text-gray-800 dark:text-white/90">
                    {detail.question}
                  </h3>
                </div>
                <div>
                  <p className="text-theme-xs font-medium text-gray-500">Jawaban</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">
                    {detail.answer}
                  </p>
                </div>
                <dl className="grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 text-theme-xs dark:border-gray-800 sm:grid-cols-2">
                  <div>
                    <dt className="text-gray-500">Dibuat</dt>
                    <dd>{formatDate(detail.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Diperbarui</dt>
                    <dd>{formatDate(detail.updatedAt)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-gray-500">ID</dt>
                    <dd className="break-all font-mono text-[10px] text-gray-400">{detail.id}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(detail)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(detail.id)}>
                    Hapus
                  </Button>
                </div>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
