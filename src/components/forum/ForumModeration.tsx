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
import { fetchUsers } from "@/lib/api/admin";
import {
  createForumPostAdmin,
  fetchForumCategoriesAdmin,
  fetchForumPostAdmin,
  fetchForumPostsAdmin,
  updateForumPostAdmin,
} from "@/lib/api/extended";
import { formatDate } from "@/lib/format";
import type { ForumPostAdmin } from "@/types/extended";
import { useCallback, useEffect, useState } from "react";

const STATUSES = ["PUBLISHED", "DRAFT", "ARCHIVED"] as const;

const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "Terbit",
  DRAFT: "Draft",
  ARCHIVED: "Arsip",
};

function statusBadge(status: string) {
  const color =
    status === "PUBLISHED" ? "success" : status === "DRAFT" ? "warning" : "light";
  return (
    <Badge color={color} size="sm">
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

type FormState = {
  title: string;
  content: string;
  status: string;
  categoryId: string;
  authorUserId: string;
  tagsText: string;
};

const emptyForm: FormState = {
  title: "",
  content: "",
  status: "PUBLISHED",
  categoryId: "",
  authorUserId: "",
  tagsText: "",
};

export default function ForumModeration() {
  const [items, setItems] = useState<ForumPostAdmin[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [authors, setAuthors] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchForumPostsAdmin({
        page: 1,
        limit: 40,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat forum.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const [cats, usersRes] = await Promise.all([
          fetchForumCategoriesAdmin(),
          fetchUsers({ page: 1, limit: 50 }),
        ]);
        setCategories(cats);
        setAuthors(
          usersRes.items
            .filter((u) => u.role !== "ADMIN")
            .map((u) => ({ id: u.id, fullName: u.fullName, email: u.email })),
        );
      } catch {
        /* opsional */
      }
    })();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  }

  async function openEdit(id: string) {
    setError(null);
    try {
      const post = await fetchForumPostAdmin(id);
      const tags = Array.isArray(post.tags) ? post.tags.join(", ") : "";
      setEditingId(id);
      setForm({
        title: post.title,
        content: post.content,
        status: post.status,
        categoryId: post.categoryId ?? "",
        authorUserId: "",
        tagsText: tags,
      });
      setShowForm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat posting.");
    }
  }

  function parseTags(text: string): string[] | undefined {
    const tags = text
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    return tags.length > 0 ? tags : undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        status: form.status,
        categoryId: form.categoryId || undefined,
        tags: parseTags(form.tagsText),
      };

      if (editingId) {
        await updateForumPostAdmin(editingId, {
          ...payload,
          categoryId: form.categoryId || null,
        });
      } else {
        await createForumPostAdmin({
          ...payload,
          authorUserId: form.authorUserId || undefined,
        });
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan posting.");
    } finally {
      setSaving(false);
    }
  }

  async function quickStatus(id: string, next: string) {
    try {
      await updateForumPostAdmin(id, { status: next });
      await load();
    } catch {
      setError("Gagal mengubah status.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-100 bg-brand-50/80 px-4 py-3 text-sm text-gray-700 dark:border-brand-900/40 dark:bg-brand-500/10 dark:text-gray-300">
        Buat dan edit posting forum atas nama admin atau pengguna. Status: terbit, draft, atau arsip.
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          placeholder="Cari judul / isi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 min-w-[200px] flex-1 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">Semua status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={openCreate}>
          + Buat postingan
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10">
          {error}
        </div>
      )}

      {showForm && (
        <ComponentCard
          title={editingId ? "Edit postingan" : "Postingan baru"}
          desc={editingId ? "Perbarui konten atau status" : "Posting sebagai admin atau pilih penulis"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {editingId && items.find((p) => p.id === editingId) && (
              <p className="text-theme-xs text-gray-500">
                Penulis: {items.find((p) => p.id === editingId)?.user.fullName}
              </p>
            )}
            {!editingId && (
              <label className="block text-sm">
                <span className="text-gray-500">Penulis (kosongkan = akun admin)</span>
                <select
                  value={form.authorUserId}
                  onChange={(e) => setForm((f) => ({ ...f, authorUserId: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="">Admin (saya)</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} ({a.email})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block text-sm">
              <span className="text-gray-500">Judul *</span>
              <input
                required
                minLength={5}
                maxLength={150}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-500">Konten * (min. 10 karakter)</span>
              <textarea
                required
                minLength={10}
                rows={6}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                placeholder="Isi diskusi. Gunakan #tag untuk hashtag."
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-gray-500">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 dark:border-gray-700 dark:bg-gray-900"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-gray-500">Kategori forum</span>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="">Tanpa kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-gray-500">Tag (pisahkan koma)</span>
              <input
                value={form.tagsText}
                onChange={(e) => setForm((f) => ({ ...f, tagsText: e.target.value }))}
                placeholder="biomassa, karbon, tips"
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan…" : editingId ? "Simpan perubahan" : "Terbitkan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Batal
              </Button>
            </div>
          </form>
        </ComponentCard>
      )}

      <ComponentCard title="Daftar postingan" desc="Klik Edit untuk ubah konten">
        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Belum ada posting.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Judul
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Penulis
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Status
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Tanggal
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-end text-theme-xs text-gray-500">
                    Aksi
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-xs px-4 py-3">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="truncate text-theme-xs text-gray-500">
                        {p._count.comments} komentar · {p.viewCount} view
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">{p.user.fullName}</TableCell>
                    <TableCell className="px-4 py-3">{statusBadge(p.status)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(p.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p.id)}>
                          Edit
                        </Button>
                        {p.status !== "PUBLISHED" && (
                          <Button size="sm" onClick={() => quickStatus(p.id, "PUBLISHED")}>
                            Publish
                          </Button>
                        )}
                        {p.status !== "ARCHIVED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => quickStatus(p.id, "ARCHIVED")}
                          >
                            Arsip
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
      </ComponentCard>
    </div>
  );
}
