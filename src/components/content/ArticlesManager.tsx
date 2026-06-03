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
import {
  createArticle,
  deleteArticle,
  fetchArticles,
  updateArticle,
} from "@/lib/api/content";
import { fetchCategories } from "@/lib/api/admin";
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
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="px-4 py-3 text-sm font-medium">{a.title}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      color={
                        a.status === "PUBLISHED"
                          ? "success"
                          : a.status === "DRAFT"
                            ? "warning"
                            : "light"
                      }
                      size="sm"
                    >
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(a.updatedAt ?? a.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-end">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => startEdit(a)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(a.id)}>
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
