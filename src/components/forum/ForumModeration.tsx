"use client";
import ComponentCard from "@/components/common/ComponentCard";
import AdminMediaImage from "@/components/common/AdminMediaImage";
import UserAvatar from "@/components/common/UserAvatar";
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
import { fetchUsers } from "@/lib/api/admin";
import {
  createForumPostAdmin,
  fetchForumCategoriesAdmin,
  fetchForumGroupsAdmin,
  fetchForumPostAdmin,
  fetchForumPostsAdmin,
  updateForumPostAdmin,
} from "@/lib/api/extended";
import { formatDate } from "@/lib/format";
import type { ForumGroupAdmin, ForumPostAdmin } from "@/types/extended";
import Link from "next/link";
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

function mediaList(
  media?: ForumPostAdmin["mediaUrls"],
): Array<{ url: string; type?: string }> {
  if (!Array.isArray(media)) return [];
  const out: Array<{ url: string; type?: string }> = [];
  for (const item of media) {
    if (typeof item === "string" && item) {
      out.push({ url: item, type: "image" });
      continue;
    }
    if (item && typeof item === "object" && "url" in item && item.url) {
      out.push({ url: String(item.url), type: item.type });
    }
  }
  return out;
}

function contentPreview(text: string, max = 120): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
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
  const [groups, setGroups] = useState<ForumGroupAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [authors, setAuthors] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ForumPostAdmin | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, groupsRes] = await Promise.all([
        fetchForumPostsAdmin({
          page,
          limit,
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
        }),
        fetchForumGroupsAdmin({ page: 1, limit: 12 }),
      ]);
      setItems(res.items);
      setTotal(res.total);
      setGroups(groupsRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat forum.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

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
      setDetail(post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat posting.");
    }
  }

  async function openDetail(id: string) {
    setDetailLoading(true);
    setError(null);
    try {
      setDetail(await fetchForumPostAdmin(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail.");
    } finally {
      setDetailLoading(false);
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

      const savedId = editingId;
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await load();
      if (savedId && detail?.id === savedId) {
        setDetail(await fetchForumPostAdmin(savedId));
      }
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
      if (detail?.id === id) setDetail(await fetchForumPostAdmin(id));
    } catch {
      setError("Gagal mengubah status.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-100 bg-brand-50/80 px-4 py-3 text-sm text-gray-700 dark:border-brand-900/40 dark:bg-brand-500/10 dark:text-gray-300">
        Buat dan edit posting forum atas nama admin atau pengguna. Status: terbit, draft, atau arsip.
        Detail menampilkan avatar penulis, banner grup, dan media lampiran.
      </div>

      {groups.length > 0 && (
        <ComponentCard title="Grup komunitas" desc="Avatar & banner grup aktif">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <div
                key={g.id}
                className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
              >
                <div className="relative h-20 bg-gray-100 dark:bg-gray-800">
                  <AdminMediaImage
                    src={g.bannerUrl}
                    alt={`Banner ${g.name}`}
                    className="h-20 w-full object-cover"
                    fallback={
                      <div className="flex h-20 items-center justify-center text-theme-xs text-gray-400">
                        Tanpa banner
                      </div>
                    }
                  />
                  <div className="absolute -bottom-5 left-3">
                    <UserAvatar
                      src={g.avatarUrl}
                      name={g.name}
                      className="h-10 w-10 border-2 border-white dark:border-gray-900"
                    />
                  </div>
                </div>
                <div className="px-3 pb-3 pt-7">
                  <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                    {g.name}
                  </p>
                  <p className="truncate text-theme-xs text-gray-500">
                    @{g.slug} · {g.memberCount} anggota · {g.postCount} post
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <UserAvatar
                      src={g.owner.avatarUrl}
                      name={g.owner.fullName}
                      className="h-6 w-6"
                    />
                    <span className="truncate text-theme-xs text-gray-500">
                      {g.owner.fullName}
                    </span>
                    <Badge color={g.isPublic ? "success" : "light"} size="sm">
                      {g.isPublic ? "Publik" : "Privat"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ComponentCard>
      )}

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
            {editingId && detail && detail.id === editingId && (
              <p className="text-theme-xs text-gray-500">
                Penulis: {detail.user.fullName}
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
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                <span className="text-gray-500">Kategori</span>
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
              <label className="block text-sm">
                <span className="text-gray-500">Tag (pisah koma)</span>
                <input
                  value={form.tagsText}
                  onChange={(e) => setForm((f) => ({ ...f, tagsText: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 dark:border-gray-700 dark:bg-gray-900"
                  placeholder="biomassa, karbon"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Menyimpan..." : editingId ? "Perbarui" : "Publikasikan"}
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <ComponentCard title="Daftar postingan" desc="Avatar penulis, media, dan detail grup">
            {loading ? (
              <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">Belum ada posting.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                          Postingan
                        </TableCell>
                        <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                          Penulis
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
                      {items.map((p) => {
                        const media = mediaList(p.mediaUrls);
                        const authorName = p.user?.fullName ?? "Penulis";
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="max-w-sm px-4 py-3">
                              <div className="flex gap-3">
                                {media[0] ? (
                                  <AdminMediaImage
                                    src={media[0].url}
                                    alt={p.title}
                                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                    fallback={
                                      <UserAvatar
                                        src={p.user?.avatarUrl}
                                        name={authorName}
                                        className="h-12 w-12"
                                      />
                                    }
                                  />
                                ) : (
                                  <UserAvatar
                                    src={p.user?.avatarUrl ?? p.group?.avatarUrl}
                                    name={authorName}
                                    className="h-12 w-12"
                                  />
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{p.title}</p>
                                  <p className="line-clamp-2 text-theme-xs text-gray-500">
                                    {contentPreview(p.content)}
                                  </p>
                                  <p className="mt-0.5 text-theme-xs text-gray-400">
                                    {p._count?.comments ?? 0} komentar · {p.viewCount ?? 0} view
                                    {p.group ? ` · ${p.group.name}` : ""}
                                    {media.length > 0 ? ` · ${media.length} media` : ""}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <UserAvatar
                                  src={p.user?.avatarUrl}
                                  name={authorName}
                                  className="h-9 w-9"
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                                    {authorName}
                                  </p>
                                  <p className="truncate text-theme-xs text-gray-400">
                                    {p.user?.role ?? "—"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">{statusBadge(p.status)}</TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex flex-wrap justify-end gap-1">
                                <Button size="sm" variant="outline" onClick={() => openDetail(p.id)}>
                                  Detail
                                </Button>
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
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
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
          <ComponentCard title="Detail posting" desc="Avatar, banner grup, media, tag">
            {detailLoading ? (
              <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ) : !detail ? (
              <p className="py-10 text-center text-sm text-gray-500">
                Pilih <strong>Detail</strong> pada postingan untuk melihat isi lengkap.
              </p>
            ) : (
              <div className="space-y-4 text-sm">
                {detail.group?.bannerUrl ? (
                  <AdminMediaImage
                    src={detail.group.bannerUrl}
                    alt={`Banner ${detail.group.name}`}
                    className="h-28 w-full rounded-xl object-cover"
                  />
                ) : null}

                <div className="flex items-start gap-3">
                  <UserAvatar
                    src={detail.user.avatarUrl}
                    name={detail.user.fullName}
                    className="h-12 w-12"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-white/90">
                      {detail.user.fullName}
                    </p>
                    <p className="text-theme-xs text-gray-500">
                      {detail.user.email} · {detail.user.role}
                    </p>
                    <Link
                      href={`/users/${detail.user.id}`}
                      className="text-theme-xs text-brand-600 hover:underline"
                    >
                      Lihat profil
                    </Link>
                  </div>
                </div>

                {detail.group ? (
                  <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                    <UserAvatar
                      src={detail.group.avatarUrl}
                      name={detail.group.name}
                      className="h-10 w-10"
                    />
                    <div className="min-w-0">
                      <p className="font-medium">{detail.group.name}</p>
                      <p className="text-theme-xs text-gray-500">
                        Grup · {detail.group.memberCount ?? 0} anggota
                        {detail.group.slug ? ` · @${detail.group.slug}` : ""}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                      {detail.title}
                    </h3>
                    {statusBadge(detail.status)}
                  </div>
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {detail.content}
                  </p>
                </div>

                {Array.isArray(detail.tags) && detail.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {detail.tags.map((tag) => (
                      <Badge key={tag} color="light" size="sm">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {mediaList(detail.mediaUrls).length > 0 ? (
                  <div>
                    <p className="mb-2 text-theme-xs font-medium text-gray-500">Media</p>
                    <div className="grid grid-cols-2 gap-2">
                      {mediaList(detail.mediaUrls).map((m, i) => (
                        <a
                          key={`${m.url}-${i}`}
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <AdminMediaImage
                            src={m.url}
                            alt={`Media ${i + 1}`}
                            className="h-28 w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {Array.isArray(detail.productMentions) && detail.productMentions.length > 0 ? (
                  <div>
                    <p className="mb-1 text-theme-xs font-medium text-gray-500">
                      Mentions produk
                    </p>
                    <ul className="space-y-1 text-theme-xs text-gray-600">
                      {detail.productMentions.map((pm) => (
                        <li key={pm.id}>
                          {pm.name}
                          {pm.slug ? ` (${pm.slug})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <dl className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 text-theme-xs dark:border-gray-800">
                  <div>
                    <dt className="text-gray-500">Kategori</dt>
                    <dd>{detail.category?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Komentar</dt>
                    <dd>{detail._count.comments}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Votes</dt>
                    <dd>
                      ↑{detail.upvotes} · ↓{detail.downvotes}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Dibuat</dt>
                    <dd>{formatDate(detail.createdAt)}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(detail.id)}>
                    Edit
                  </Button>
                  {detail.status !== "PUBLISHED" && (
                    <Button size="sm" onClick={() => quickStatus(detail.id, "PUBLISHED")}>
                      Publish
                    </Button>
                  )}
                  {detail.status !== "ARCHIVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => quickStatus(detail.id, "ARCHIVED")}
                    >
                      Arsipkan
                    </Button>
                  )}
                </div>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
