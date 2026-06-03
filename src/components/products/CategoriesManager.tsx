"use client";
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
import type { CategoryItem, CategoryType } from "@/types/admin";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function CategoriesManager() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryType, setCategoryType] = useState<CategoryType>("PRODUK");
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchCategories());
    } catch {
      setError("Gagal memuat kategori.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    try {
      if (editId) {
        await updateCategory(editId, {
          name: name.trim(),
          description: description.trim() || undefined,
          categoryType,
        });
      } else {
        await createCategory({
          name: name.trim(),
          description: description.trim() || undefined,
          categoryType,
        });
      }
      setName("");
      setDescription("");
      setEditId(null);
      await load();
    } catch {
      alert("Gagal menyimpan kategori.");
    }
  }

  function startEdit(item: CategoryItem) {
    setEditId(item.id);
    setName(item.name);
    setDescription(item.description ?? "");
    setCategoryType(item.categoryType);
  }

  return (
    <div className="space-y-6">
      <Link href="/products" className="text-sm text-brand-600 hover:underline">
        ← Kembali ke produk
      </Link>

      <ComponentCard title={editId ? "Edit Kategori" : "Tambah Kategori"}>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kategori"
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            required
          />
          <select
            value={categoryType}
            onChange={(e) => setCategoryType(e.target.value as CategoryType)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="PRODUK">PRODUK</option>
            <option value="FORUM">FORUM</option>
            <option value="ARTICLE">ARTICLE</option>
          </select>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi (opsional)"
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 sm:col-span-2"
          />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">{editId ? "Simpan" : "Tambah"}</Button>
            {editId && (
              <Button type="button" variant="outline" onClick={() => { setEditId(null); setName(""); setDescription(""); }}>
                Batal
              </Button>
            )}
          </div>
        </form>
      </ComponentCard>

      <ComponentCard title="Daftar Kategori">
        {error && <p className="mb-4 text-sm text-error-600">{error}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">Nama</TableCell>
              <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">Tipe</TableCell>
              <TableCell isHeader className="px-4 py-3 text-end text-theme-xs text-gray-500">Aksi</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-4 py-3 text-sm">{item.name}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-gray-500">{item.categoryType}</TableCell>
                <TableCell className="px-4 py-3 text-end">
                  <button type="button" onClick={() => startEdit(item)} className="text-sm text-brand-600 hover:underline">
                    Edit
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ComponentCard>
    </div>
  );
}
