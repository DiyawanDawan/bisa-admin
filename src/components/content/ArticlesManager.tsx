"use client";
import AdminMediaImage from "@/components/common/AdminMediaImage";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createArticle,
  deleteArticle,
  fetchArticle,
  fetchArticles,
  updateArticle,
} from "@/lib/api/content";
import { fetchCategories } from "@/lib/api/admin";
import { resolveMediaUrl } from "@/lib/media-url";
import type { CategoryItem } from "@/types/admin";
import type { ArticleItem, PostStatus } from "@/types/content";
import { formatDate } from "@/lib/format";
import { useCallback, useEffect, useState } from "react";

const STATUSES: PostStatus[] = ["PUBLISHED", "DRAFT", "ARCHIVED"];

export default function ArticlesManager() {
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<PostStatus>("DRAFT");
  const [saving, setSaving] = useState(false);
  const [detailArticle, setDetailArticle] = useState<ArticleItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [articlesRes, cats] = await Promise.all([
        fetchArticles({ page: 1, limit: 50 }),
        fetchCategories(),
      ]);
      setItems(articlesRes.items);
      setCategories(cats.filter((c) => c.categoryType === "ARTICLE"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat artikel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditId(null);
    setTitle("");
    setContent("");
    setImageUrl("");
    setCategoryId("");
    setStatus("DRAFT");
  }

  function startEdit(article: ArticleItem) {
    setEditId(article.id);
    setTitle(article.title);
    setContent(article.content);
    setImageUrl(article.imageUrl ?? "");
    setCategoryId(article.categoryId ?? "");
    setStatus(article.status);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.length < 5 || content.length < 20) {
      setError("Judul min. 5 karakter, konten min. 20 karakter.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        content,
        status,
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
        ...(categoryId ? { categoryId } : {}),
      };
      if (editId) {
        await updateArticle(editId, payload);
      } else {
        await createArticle(payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan artikel.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus artikel ini?")) return;
    try {
      await deleteArticle(id);
      if (editId === id) resetForm();
      if (detailArticle?.id === id) setDetailArticle(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
    }
  }

  async function openDetail(article: ArticleItem) {
    setDetailLoading(true);
    setDetailArticle(article);
    try {
      setDetailArticle(await fetchArticle(article.id));
    } catch {
      /* fallback ke data baris tabel */
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailArticle(null);
    setDetailLoading(false);
  }

  function statusBadgeColor(s: PostStatus): "success" | "warning" | "light" {
    if (s === "PUBLISHED") return "success";
    if (s === "DRAFT") return "warning";
    return "light";
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}

      <ComponentCard
        title={editId ? "Edit artikel" : "Artikel baru"}
        desc="Blog / konten edukasi untuk aplikasi mobile"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-theme-xs text-gray-500">Judul</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-theme-xs text-gray-500">Konten</label>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PostStatus)}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-500">Kategori (ARTICLE)</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="">— Tanpa kategori —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-theme-xs text-gray-500">URL gambar (opsional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Menyimpan..." : editId ? "Perbarui" : "Publikasikan"}
            </Button>
            {editId && (
              <Button type="button" size="sm" variant="outline" onClick={resetForm}>
                Batal edit
              </Button>
            )}
          </div>
        </form>
      </ComponentCard>

      <ComponentCard title="Daftar artikel">
        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                  Judul
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                  Status
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                  Diperbarui
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-end text-theme-xs text-gray-500">
                  Aksi
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    Belum ada artikel.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="px-4 py-3 text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => void openDetail(a)}
                        className="text-left text-brand-700 hover:underline dark:text-brand-400"
                      >
                        {a.title}
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge color={statusBadgeColor(a.status)} size="sm">
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(a.updatedAt ?? a.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => void openDetail(a)}>
                          Detail
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEdit(a)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(a.id)}>
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </ComponentCard>

      <Modal isOpen={detailArticle != null} onClose={closeDetail} className="max-w-3xl p-6">
        {detailArticle ? (
          <div className="max-h-[85vh] overflow-y-auto pr-1">
            {detailLoading ? (
              <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                      {detailArticle.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <Badge color={statusBadgeColor(detailArticle.status)} size="sm">
                        {detailArticle.status}
                      </Badge>
                      {detailArticle.category?.name ? (
                        <span>Kategori: {detailArticle.category.name}</span>
                      ) : null}
                      {detailArticle.author?.fullName ? (
                        <span>Penulis: {detailArticle.author.fullName}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {detailArticle.imageUrl ? (
                  <AdminMediaImage
                    src={detailArticle.imageUrl}
                    alt={detailArticle.title}
                    className="mb-4 max-h-64 w-full rounded-xl border border-gray-200 object-cover dark:border-gray-700"
                  />
                ) : null}

                <dl className="mb-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-gray-500">Dibuat</dt>
                    <dd>{formatDate(detailArticle.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Diperbarui</dt>
                    <dd>{formatDate(detailArticle.updatedAt)}</dd>
                  </div>
                  {detailArticle.publishedAt ? (
                    <div>
                      <dt className="text-gray-500">Dipublikasikan</dt>
                      <dd>{formatDate(detailArticle.publishedAt)}</dd>
                    </div>
                  ) : null}
                  {detailArticle.imageUrl ? (
                    <div className="sm:col-span-2">
                      <dt className="text-gray-500">URL gambar</dt>
                      <dd className="break-all">
                        <a
                          href={resolveMediaUrl(detailArticle.imageUrl) ?? detailArticle.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {detailArticle.imageUrl}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="mb-2 text-theme-xs font-medium uppercase tracking-wide text-gray-500">
                    Konten
                  </p>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-white/90">
                    {detailArticle.content}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      startEdit(detailArticle);
                      closeDetail();
                    }}
                  >
                    Edit artikel
                  </Button>
                  <Button size="sm" variant="outline" onClick={closeDetail}>
                    Tutup
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
