"use client";
import AdminInfoBanner from "@/components/common/AdminInfoBanner";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createCategory, fetchCategories, updateCategory } from "@/lib/api/admin";
import type {
  BiomassaType,
  CategoryItem,
  CategoryType,
  ProductMode,
} from "@/types/admin";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type ShelfTab = "biomass" | "organic" | "content";

const BIOMASS_TYPES: { value: BiomassaType; label: string }[] = [
  { value: "BIOCHAR", label: "Biochar" },
  { value: "SEKAM_PADI", label: "Sekam padi" },
  { value: "TONGKOL_JAGUNG", label: "Tongkol jagung" },
  { value: "TEMPURUNG_KELAPA", label: "Tempurung kelapa" },
  { value: "WOOD_CHIP", label: "Wood chip" },
  { value: "OTHER", label: "Lainnya" },
];

const SHELF_TABS: { id: ShelfTab; label: string; desc: string }[] = [
  {
    id: "biomass",
    label: "Biomassa & Biochar",
    desc: "Bahan baku biomassa, biochar, limbah pertanian — selaras rak mobile Biomassa.",
  },
  {
    id: "organic",
    label: "Hasil Tani",
    desc: "Produk panen organik / konsumsi — selaras rak mobile Hasil Tani.",
  },
  {
    id: "content",
    label: "Forum & Artikel",
    desc: "Kategori konten edukasi, bukan listing marketplace.",
  },
];

function biomassaLabel(value?: BiomassaType | null): string {
  if (!value) return "—";
  return BIOMASS_TYPES.find((t) => t.value === value)?.label ?? value;
}

function shelfLabel(item: CategoryItem): string {
  if (item.categoryType !== "PRODUK") return item.categoryType;
  if (item.productMode === "ORGANIC_PRODUCE") return "Hasil Tani";
  if (item.productMode === "BIOMASS_MATERIAL") {
    return item.biomassaType ? `Biomassa · ${biomassaLabel(item.biomassaType)}` : "Biomassa";
  }
  return "Produk (belum diatur)";
}

function usageCount(item: CategoryItem): number {
  if (item.categoryType === "ARTICLE") return item._count?.articles ?? 0;
  if (item.categoryType === "FORUM") return item._count?.forumPosts ?? 0;
  return item._count?.products ?? 0;
}

export default function CategoriesManager() {
  const [shelf, setShelf] = useState<ShelfTab>("biomass");
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryType, setCategoryType] = useState<CategoryType>("PRODUK");
  const [productMode, setProductMode] = useState<ProductMode>("BIOMASS_MATERIAL");
  const [biomassaType, setBiomassaType] = useState<BiomassaType>("BIOCHAR");
  const [editId, setEditId] = useState<string | null>(null);

  const activeShelf = useMemo(
    () => SHELF_TABS.find((t) => t.id === shelf) ?? SHELF_TABS[0],
    [shelf],
  );

  const resetForm = useCallback((tab: ShelfTab = shelf) => {
    setEditId(null);
    setName("");
    setDescription("");
    if (tab === "biomass") {
      setCategoryType("PRODUK");
      setProductMode("BIOMASS_MATERIAL");
      setBiomassaType("BIOCHAR");
    } else if (tab === "organic") {
      setCategoryType("PRODUK");
      setProductMode("ORGANIC_PRODUCE");
      setBiomassaType("BIOCHAR");
    } else {
      setCategoryType("FORUM");
      setProductMode("BIOMASS_MATERIAL");
      setBiomassaType("BIOCHAR");
    }
  }, [shelf]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await fetchCategories();
      const filtered =
        shelf === "biomass"
          ? all.filter(
              (c) =>
                c.categoryType === "PRODUK" && c.productMode === "BIOMASS_MATERIAL",
            )
          : shelf === "organic"
            ? all.filter(
                (c) =>
                  c.categoryType === "PRODUK" && c.productMode === "ORGANIC_PRODUCE",
              )
            : all.filter((c) => c.categoryType === "FORUM" || c.categoryType === "ARTICLE");
      setItems(filtered);
    } catch {
      setError("Gagal memuat kategori.");
    } finally {
      setLoading(false);
    }
  }, [shelf]);

  useEffect(() => {
    load();
  }, [load]);

  function switchShelf(tab: ShelfTab) {
    setShelf(tab);
    resetForm(tab);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      categoryType,
      productMode: categoryType === "PRODUK" ? productMode : null,
      biomassaType:
        categoryType === "PRODUK" && productMode === "BIOMASS_MATERIAL"
          ? biomassaType
          : null,
    };

    try {
      if (editId) {
        await updateCategory(editId, payload);
      } else {
        await createCategory(payload);
      }
      resetForm();
      await load();
    } catch {
      alert("Gagal menyimpan kategori. Periksa mode rak dan jenis biomassa.");
    }
  }

  function startEdit(item: CategoryItem) {
    setEditId(item.id);
    setName(item.name);
    setDescription(item.description ?? "");
    setCategoryType(item.categoryType);
    if (item.categoryType === "PRODUK") {
      setProductMode(item.productMode ?? "BIOMASS_MATERIAL");
      setBiomassaType(item.biomassaType ?? "BIOCHAR");
      if (item.productMode === "ORGANIC_PRODUCE") setShelf("organic");
      else setShelf("biomass");
    } else {
      setShelf("content");
    }
  }

  const usageHeader =
    shelf === "content" ? "Konten terpakai" : "Produk terdaftar";

  return (
    <div className="space-y-6">
      <Link href="/products" className="text-sm text-brand-600 hover:underline">
        ← Kembali ke produk
      </Link>

      <div>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Kategori Master
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Kelola kategori per rak marketplace — Biomassa/Biochar terpisah dari Hasil Tani.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SHELF_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchShelf(tab.id)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              shelf === tab.id
                ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500/50 dark:bg-brand-500/10 dark:text-brand-300"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AdminInfoBanner>{activeShelf.desc}</AdminInfoBanner>

      <ComponentCard title={editId ? "Edit kategori" : `Tambah — ${activeShelf.label}`}>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-theme-xs text-gray-500">Nama kategori</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                shelf === "organic"
                  ? "Contoh: Sayuran organik, Padi premium…"
                  : shelf === "biomass"
                    ? "Contoh: Biochar grade A, Sekam basah…"
                    : "Nama kategori konten"
              }
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              required
            />
          </div>

          {shelf === "content" && (
            <div>
              <label className="mb-1 block text-theme-xs text-gray-500">Tipe konten</label>
              <select
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value as CategoryType)}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="FORUM">Forum</option>
                <option value="ARTICLE">Artikel</option>
              </select>
            </div>
          )}

          {shelf === "biomass" && (
            <div>
              <label className="mb-1 block text-theme-xs text-gray-500">Jenis biomassa</label>
              <select
                value={biomassaType}
                onChange={(e) => setBiomassaType(e.target.value as BiomassaType)}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                required
              >
                {BIOMASS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={shelf === "content" ? "" : "sm:col-span-2"}>
            <label className="mb-1 block text-theme-xs text-gray-500">Deskripsi (opsional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan internal atau penjelasan singkat"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit">{editId ? "Simpan perubahan" : "Tambah kategori"}</Button>
            {editId && (
              <Button type="button" variant="outline" onClick={() => resetForm()}>
                Batal edit
              </Button>
            )}
          </div>
        </form>
      </ComponentCard>

      <ComponentCard title={`Daftar — ${activeShelf.label}`}>
        {error && <p className="mb-4 text-sm text-error-600">{error}</p>}
        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            Belum ada kategori pada rak ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Nama
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    Rak / jenis
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                    {usageHeader}
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-end text-theme-xs text-gray-500">
                    Aksi
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 py-3 text-sm font-medium">{item.name}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500">
                      {shelfLabel(item)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {usageCount(item)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="text-sm text-brand-600 hover:underline"
                      >
                        Edit
                      </button>
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
