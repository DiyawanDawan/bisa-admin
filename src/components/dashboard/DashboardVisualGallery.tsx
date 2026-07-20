"use client";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import { brandLinkClass, mutedTextClass } from "@/lib/theme-classes";
import { resolveMediaUrl } from "@/lib/media-url";
import type { DashboardVisualGallery } from "@/types/admin";
import Link from "next/link";
import { useState } from "react";

function GalleryImage({
  src,
  alt,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveMediaUrl(src);
  const show = resolved && !failed;

  if (!show) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-theme-xs text-gray-400 dark:bg-gray-800 ${className}`}
      >
        Tanpa gambar
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={`object-cover ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

interface DashboardVisualGalleryProps {
  data: DashboardVisualGallery | null;
  loading?: boolean;
}

export default function DashboardVisualGallerySection({
  data,
  loading = false,
}: DashboardVisualGalleryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const products = Array.isArray(data.products) ? data.products : [];
  const storeBanners = Array.isArray(data.storeBanners) ? data.storeBanners : [];
  const supplierStores = Array.isArray(data.supplierStores) ? data.supplierStores : [];
  const forumMedia = Array.isArray(data.forumMedia) ? data.forumMedia : [];

  return (
    <div className="space-y-6">
      <ComponentCard
        title="Produk terbaru"
        desc="Preview gambar listing — moderasi cepat"
      >
        {products.length === 0 ? (
          <p className={`text-sm ${mutedTextClass}`}>Belum ada produk dengan foto.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {products.map((p) => (
              <Link
                key={p.id}
                href="/products"
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <GalleryImage
                  src={p.thumbnailUrl}
                  alt={p.name}
                  className="aspect-square w-full transition group-hover:scale-[1.02]"
                />
                <div className="space-y-1 p-2">
                  <p className="line-clamp-2 text-theme-xs font-medium text-gray-800 dark:text-white/90">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <GalleryImage
                      src={p.supplierAvatarUrl}
                      alt={p.supplierName}
                      className="h-5 w-5 shrink-0 rounded-full"
                    />
                    <span className={`truncate text-[10px] ${mutedTextClass}`}>{p.supplierName}</span>
                  </div>
                  <Badge color={p.status === "ACTIVE" ? "success" : "warning"} size="sm">
                    {p.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </ComponentCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ComponentCard title="Banner toko supplier" desc="Visual etalase toko di marketplace">
          {storeBanners.length === 0 ? (
            <p className={`text-sm ${mutedTextClass}`}>Belum ada banner toko aktif.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {storeBanners.map((b) => (
                <div
                  key={b.id}
                  className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
                >
                  <GalleryImage
                    src={b.imageUrl}
                    alt={b.title ?? b.storeName}
                    className="aspect-[21/9] w-full"
                  />
                  <div className="flex items-center gap-2 p-2">
                    <GalleryImage
                      src={b.supplierAvatarUrl}
                      alt={b.storeName}
                      className="h-8 w-8 shrink-0 rounded-full"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                        {b.storeName}
                      </p>
                      <p className={`truncate text-[10px] ${mutedTextClass}`}>
                        {b.title ?? "Banner toko"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ComponentCard>

        <ComponentCard title="Toko & supplier" desc="Avatar dan profil toko terdaftar">
          {supplierStores.length === 0 ? (
            <p className={`text-sm ${mutedTextClass}`}>Belum ada supplier aktif.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {supplierStores.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <GalleryImage
                    src={s.avatarUrl}
                    alt={s.fullName}
                    className="h-12 w-12 shrink-0 rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                      {s.companyName ?? s.fullName}
                    </p>
                    <p className={`text-theme-xs ${mutedTextClass}`}>
                      {s.productCount} produk · {s.bannerCount} banner
                    </p>
                  </div>
                  <Link
                    href={`/users/${s.id}`}
                    className={`text-theme-xs font-medium ${brandLinkClass}`}
                  >
                    Dossier
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ComponentCard>
      </div>

      {forumMedia.length > 0 ? (
        <ComponentCard title="Media forum" desc="Posting dengan lampiran gambar">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
            {forumMedia.map((f) => (
              <Link
                key={f.id}
                href="/forum"
                className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
              >
                <GalleryImage
                  src={f.imageUrl}
                  alt={f.title}
                  className="aspect-video w-full"
                />
                <div className="p-2">
                  <p className="line-clamp-2 text-theme-xs font-medium text-gray-800 dark:text-white/90">
                    {f.title}
                  </p>
                  <p className={`text-[10px] ${mutedTextClass}`}>{f.authorName}</p>
                </div>
              </Link>
            ))}
          </div>
        </ComponentCard>
      ) : null}
    </div>
  );
}
