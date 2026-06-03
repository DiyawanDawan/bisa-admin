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
  createRegion,
  deleteRegion,
  fetchAdminRegions,
  updateRegion,
} from "@/lib/api/extended";
import type { RegionAdminList, RegionAdminRow } from "@/types/content";
import { useCallback, useEffect, useState } from "react";

type Level = "country" | "province" | "regency" | "district" | "village";

const LEVELS: Level[] = ["country", "province", "regency", "district", "village"];

const LEVEL_LABELS: Record<Level, string> = {
  country: "Negara",
  province: "Provinsi",
  regency: "Kabupaten/Kota",
  district: "Kecamatan",
  village: "Desa/Kelurahan",
};

const NEXT_LEVEL: Partial<Record<Level, Level>> = {
  country: "province",
  province: "regency",
  regency: "district",
  district: "village",
};

type StackItem = { level: Level; id: string; name: string };

function extraColumnLabel(level: Level): string {
  if (level === "country") return "Benua";
  if (level === "province" || level === "regency") return "Kode pendek";
  if (level === "village") return "Tipe";
  return "—";
}

function extraColumnValue(level: Level, row: RegionAdminRow): string {
  if (level === "country") return row.continent ?? "—";
  if (level === "province" || level === "regency") return row.shortCode ?? "—";
  if (level === "village") return row.villageType ?? "—";
  return "—";
}

export default function RegionsExplorer() {
  const [stack, setStack] = useState<StackItem[]>([]);
  const [list, setList] = useState<RegionAdminList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [continent, setContinent] = useState("Asia");
  const [villageType, setVillageType] = useState("DESA");
  const [saving, setSaving] = useState(false);

  const [editRow, setEditRow] = useState<RegionAdminRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editShortCode, setEditShortCode] = useState("");
  const [editContinent, setEditContinent] = useState("");
  const [editVillageType, setEditVillageType] = useState("DESA");

  const currentLevel: Level =
    stack.length === 0 ? "country" : (NEXT_LEVEL[stack[stack.length - 1].level] ?? "village");
  const parentId = stack.length > 0 ? stack[stack.length - 1].id : undefined;
  const nextLevel = NEXT_LEVEL[currentLevel];
  const canDrillDown = Boolean(nextLevel);
  const parentTrail = stack.map((s) => s.name).join(" › ");
  const levelIndex = LEVELS.indexOf(currentLevel);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setList(
        await fetchAdminRegions({
          level: currentLevel,
          parentId,
          search: searchDebounced || undefined,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat wilayah.");
    } finally {
      setLoading(false);
    }
  }, [currentLevel, parentId, searchDebounced]);

  useEffect(() => {
    load();
  }, [load]);

  function drillDown(row: RegionAdminRow) {
    if (!canDrillDown) return;
    setStack((s) => [...s, { level: currentLevel, id: row.id, name: row.name }]);
    setSearch("");
    setEditRow(null);
    setShowAddForm(false);
  }

  function goBackOne() {
    setStack((s) => s.slice(0, -1));
    setSearch("");
    setEditRow(null);
    setShowAddForm(false);
  }

  function goToRoot() {
    setStack([]);
    setSearch("");
    setEditRow(null);
    setShowAddForm(false);
  }

  function jumpToStackIndex(index: number) {
    setStack((s) => s.slice(0, index));
    setSearch("");
    setEditRow(null);
    setShowAddForm(false);
  }

  function startEdit(row: RegionAdminRow) {
    setEditRow(row);
    setEditName(row.name);
    setEditCode(row.code);
    setEditShortCode(row.shortCode ?? "");
    setEditContinent(row.continent ?? "Asia");
    setEditVillageType(row.villageType ?? "DESA");
    setShowAddForm(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createRegion({
        level: currentLevel,
        parentId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        shortCode: shortCode.trim() || undefined,
        continent: currentLevel === "country" ? continent : undefined,
        villageType: currentLevel === "village" ? villageType : undefined,
      });
      setName("");
      setCode("");
      setShortCode("");
      setShowAddForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah wilayah.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editRow) return;
    setSaving(true);
    setError(null);
    try {
      await updateRegion(editRow.id, {
        level: currentLevel,
        name: editName.trim(),
        code: editCode.trim().toUpperCase(),
        shortCode: editShortCode.trim() || undefined,
        continent: currentLevel === "country" ? editContinent : undefined,
        villageType: currentLevel === "village" ? editVillageType : undefined,
      });
      setEditRow(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: RegionAdminRow) {
    if (row.childCount > 0) {
      setError(
        `"${row.name}" masih memiliki ${row.childCount} ${list?.childLabel ?? "sub-wilayah"}. Kosongkan level di bawahnya dulu.`,
      );
      return;
    }
    if (!confirm(`Hapus "${row.name}"?`)) return;
    try {
      await deleteRegion(row.id, currentLevel);
      if (editRow?.id === row.id) setEditRow(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
    }
  }

  const backLabel =
    stack.length === 0
      ? null
      : stack.length === 1
        ? "Kembali ke daftar Negara"
        : `Kembali ke daftar ${LEVEL_LABELS[stack[stack.length - 1].level]}`;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-brand-100 bg-brand-50/80 px-4 py-3 text-sm text-gray-700 dark:border-brand-900/40 dark:bg-brand-500/10 dark:text-gray-300">
        <strong className="text-brand-800 dark:text-brand-300">Cara pakai:</strong> Pilih
        wilayah di tabel, lalu klik <strong>Masuk →</strong> untuk mengelola level di
        bawahnya (sama seperti di aplikasi mobile). Gunakan jalur lokasi di bawah untuk
        naik ke level atas.
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Tingkat wilayah
          </p>
          <ol className="space-y-2">
            {LEVELS.map((lvl, idx) => {
              const isCurrent = lvl === currentLevel;
              const isDone = idx < levelIndex;
              const isLocked = idx > levelIndex;
              return (
                <li
                  key={lvl}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    isCurrent
                      ? "bg-brand-500 font-medium text-white"
                      : isDone
                        ? "bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200"
                        : "text-gray-400"
                  }`}
                >
                  <span className="block text-[10px] uppercase opacity-80">
                    {idx + 1}. {isLocked ? "belum" : isCurrent ? "sedang" : "selesai"}
                  </span>
                  {LEVEL_LABELS[lvl]}
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Lokasi aktif
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
              {LEVEL_LABELS[currentLevel]}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {stack.length === 0 ? (
                "Daftar semua negara"
              ) : (
                <>
                  Di dalam: <span className="font-medium text-brand-700">{parentTrail}</span>
                </>
              )}
            </p>

            {stack.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={goToRoot}
                  className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Semua negara
                </button>
                {stack.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => jumpToStackIndex(i + 1)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-brand-700 hover:bg-brand-50 dark:border-gray-700 dark:hover:bg-brand-500/10"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}

            {backLabel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={goBackOne}
              >
                ← {backLabel}
              </Button>
            )}
          </div>

          <ComponentCard
            title={`Daftar ${LEVEL_LABELS[currentLevel]}`}
            desc={
              canDrillDown
                ? `Klik "Masuk" pada baris untuk mengelola ${LEVEL_LABELS[nextLevel!].toLowerCase()} di dalamnya.`
                : "Level terendah — tidak ada sub-wilayah lagi."
            }
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <input
                placeholder={`Cari nama ${LEVEL_LABELS[currentLevel].toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 min-w-[220px] flex-1 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <Button type="button" size="sm" onClick={() => setShowAddForm((v) => !v)}>
                {showAddForm ? "Tutup form" : `+ Tambah ${LEVEL_LABELS[currentLevel]}`}
              </Button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
                {error}
              </div>
            )}

            {showAddForm && (
              <form
                onSubmit={handleCreate}
                className="mb-6 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 p-4 dark:border-brand-800 dark:bg-brand-500/5"
              >
                <p className="mb-3 text-sm font-medium text-brand-800 dark:text-brand-200">
                  Tambah {LEVEL_LABELS[currentLevel]}
                  {parentTrail ? ` di ${parentTrail}` : ""}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-theme-xs text-gray-500">Nama</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-theme-xs text-gray-500">Kode unik</label>
                    <input
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-300 px-3 font-mono text-sm dark:border-gray-700 dark:bg-gray-900"
                    />
                  </div>
                  {(currentLevel === "province" || currentLevel === "regency") && (
                    <div>
                      <label className="mb-1 block text-theme-xs text-gray-500">Kode pendek</label>
                      <input
                        value={shortCode}
                        onChange={(e) => setShortCode(e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                      />
                    </div>
                  )}
                  {currentLevel === "country" && (
                    <div>
                      <label className="mb-1 block text-theme-xs text-gray-500">Benua</label>
                      <input
                        value={continent}
                        onChange={(e) => setContinent(e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                      />
                    </div>
                  )}
                  {currentLevel === "village" && (
                    <div>
                      <label className="mb-1 block text-theme-xs text-gray-500">Tipe</label>
                      <select
                        value={villageType}
                        onChange={(e) => setVillageType(e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                      >
                        <option value="DESA">DESA</option>
                        <option value="KELURAHAN">KELURAHAN</option>
                      </select>
                    </div>
                  )}
                </div>
                <Button type="submit" size="sm" className="mt-3" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </form>
            )}

            {loading ? (
              <div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ) : (list?.items.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-6 py-10 text-center dark:border-gray-800 dark:bg-gray-900/40">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Belum ada {LEVEL_LABELS[currentLevel].toLowerCase()} di sini
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {stack.length === 0
                    ? "Tambahkan negara pertama dengan tombol di atas."
                    : `Tambahkan entri baru, atau kembali dan pilih ${LEVEL_LABELS[stack[stack.length - 1].level]} lain.`}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                      Nama
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                      Kode
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                      {extraColumnLabel(currentLevel)}
                    </TableCell>
                    {canDrillDown && (
                      <TableCell isHeader className="px-4 py-3 text-theme-xs text-gray-500">
                        Isi di bawah
                      </TableCell>
                    )}
                    <TableCell isHeader className="px-4 py-3 text-end text-theme-xs text-gray-500">
                      Aksi
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list?.items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="px-4 py-3 text-sm font-medium">{row.name}</TableCell>
                      <TableCell className="px-4 py-3 font-mono text-sm">{row.code}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-500">
                        {extraColumnValue(currentLevel, row)}
                      </TableCell>
                      {canDrillDown && (
                        <TableCell className="px-4 py-3">
                          <Badge color={row.childCount > 0 ? "success" : "light"} size="sm">
                            {row.childCount} {list?.childLabel}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1">
                          {canDrillDown && (
                            <Button size="sm" onClick={() => drillDown(row)}>
                              Masuk → {LEVEL_LABELS[nextLevel!]}
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => startEdit(row)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(row)}>
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

          {editRow && (
            <ComponentCard title={`Edit: ${editRow.name}`}>
              <form onSubmit={handleUpdate} className="grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-theme-xs text-gray-500">Nama</label>
                  <input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-theme-xs text-gray-500">Kode</label>
                  <input
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 font-mono text-sm dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>
                {(currentLevel === "province" || currentLevel === "regency") && (
                  <div>
                    <label className="mb-1 block text-theme-xs text-gray-500">Kode pendek</label>
                    <input
                      value={editShortCode}
                      onChange={(e) => setEditShortCode(e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                    />
                  </div>
                )}
                {currentLevel === "country" && (
                  <div>
                    <label className="mb-1 block text-theme-xs text-gray-500">Benua</label>
                    <input
                      value={editContinent}
                      onChange={(e) => setEditContinent(e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                    />
                  </div>
                )}
                {currentLevel === "village" && (
                  <div>
                    <label className="mb-1 block text-theme-xs text-gray-500">Tipe</label>
                    <select
                      value={editVillageType}
                      onChange={(e) => setEditVillageType(e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                      <option value="DESA">DESA</option>
                      <option value="KELURAHAN">KELURAHAN</option>
                    </select>
                  </div>
                )}
                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit" size="sm" disabled={saving}>
                    Simpan perubahan
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditRow(null)}>
                    Batal
                  </Button>
                </div>
              </form>
            </ComponentCard>
          )}
        </div>
      </div>
    </div>
  );
}
