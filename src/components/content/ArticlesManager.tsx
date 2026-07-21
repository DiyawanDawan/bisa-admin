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
import { uploadFileChunked } from "@/lib/chunked-media-upload";
import type { CategoryItem } from "@/types/admin";
import type { ArticleItem, PostStatus } from "@/types/content";
import { formatDate } from "@/lib/format";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

const STATUSES: PostStatus[] = ["PUBLISHED", "DRAFT", "ARCHIVED"];

export default function ArticlesManager() {
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  /** Path storage hasil chunked upload (bukan URL eksternal). */
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<PostStatus>("DRAFT");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    setImagePath(null);
    setCategoryId("");
    setStatus("DRAFT");
    setUploadProgress(0);
  }

  function startEdit(article: ArticleItem) {
    setEditId(article.id);
    setTitle(article.title);
    setContent(article.content);
    setImagePath(article.imageUrl ?? null);
    setCategoryId(article.categoryId ?? "");
    setStatus(article.status);
  }

  const onDropCover = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setUploadProgress(0);
    try {
      const result = await uploadFileChunked(file, "articles", (p) =>
        setUploadProgress(Math.round(p * 100)),
      );
      setImagePath(result.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gambar gagal.");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCover,
    disabled: uploading || saving,
    multiple: false,
    maxFiles: 1,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.length < 5 || content.length < 20) {
      setError("Judul min. 5 karakter, konten min. 20 karakter.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editId) {
        await updateArticle(editId, {
          title,
          content,
          status,
          imageUrl: imagePath,
          categoryId: categoryId || null,
        });
      } else {
        await createArticle({
          title,
          content,
          status,
          ...(imagePath ? { imageUrl: imagePath } : {}),
          ...(categoryId ? { categoryId } : {}),
        });
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
        desc="Cover diunggah via multipart chunked ke storage — bukan URL eksternal"
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
            <label className="mb-1 block text-theme-xs text-gray-500">
              Gambar cover (opsional)
            </label>
            {imagePath ? (
              <div className="flex flex-wrap items-start gap-4 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <AdminMediaImage
                  src={imagePath}
                  alt="Cover artikel"
                  className="h-28 w-40 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="truncate text-theme-xs text-gray-500">{imagePath}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => setImagePath(null)}
                    >
                      Hapus cover
                    </Button>
                    <div
                      {...getRootProps()}
                      className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-brand-600 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03]"
                    >
                      <input {...getInputProps()} />
                      Ganti gambar
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-xl border border-dashed px-4 py-8 text-center transition ${
                  isDragActive
                    ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10"
                    : "border-gray-300 bg-gray-50 hover:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
                } ${uploading ? "pointer-events-none opacity-60" : ""}`}
              >
                <input {...getInputProps()} />
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {uploading
                    ? `Mengunggah… ${uploadProgress}%`
                    : isDragActive
                      ? "Lepaskan gambar di sini"
                      : "Seret & lepas gambar, atau klik untuk pilih"}
                </p>
                <p className="mt-1 text-theme-xs text-gray-500">
                  PNG, JPG, WebP — upload multipart chunked ke folder articles/
                </p>
                {uploading && (
                  <div className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" size="sm" disabled={saving || uploading}>
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
                  Artikel
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
                        className="flex min-w-0 items-center gap-3 text-left"
                      >
                        {a.imageUrl ? (
                          <AdminMediaImage
                            src={a.imageUrl}
                            alt={a.title}
                            className="h-10 w-14 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-gray-100 text-[10px] text-gray-400 dark:bg-gray-800">
                            —
                          </span>
                        )}
                        <span className="truncate text-brand-700 hover:underline dark:text-brand-400">
                          {a.title}
                        </span>
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
