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
  createKnowledgeText,
  deleteKnowledgeDocument,
  fetchKnowledgeDocuments,
  fetchKnowledgeStats,
  reindexKnowledgeDocument,
  uploadKnowledgeFile,
  type KnowledgeDocumentItem,
  type KnowledgeStats,
} from "@/lib/api/knowledge";
import { formatDate } from "@/lib/format";
import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

const FILE_ACCEPT =
  ".pdf,.txt,.md,.csv,text/plain,text/markdown,text/csv,application/pdf,application/csv";

const STATUS_COLOR: Record<string, "success" | "warning" | "error" | "info"> = {
  INDEXED: "success",
  PENDING: "warning",
  FAILED: "error",
};

export default function KnowledgeManager() {
  const [items, setItems] = useState<KnowledgeDocumentItem[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"text" | "file">("file");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [listResult, statResult] = await Promise.allSettled([
      fetchKnowledgeDocuments({ page: 1, limit: 50 }),
      fetchKnowledgeStats(),
    ]);

    if (listResult.status === "fulfilled") {
      const nextItems = listResult.value?.items;
      setItems(Array.isArray(nextItems) ? nextItems : []);
    } else {
      setItems([]);
      setError(
        listResult.reason instanceof Error
          ? listResult.reason.message
          : "Gagal memuat daftar dokumen.",
      );
    }

    if (statResult.status === "fulfilled") {
      setStats(statResult.value);
    } else if (listResult.status !== "fulfilled") {
      setError(
        statResult.reason instanceof Error
          ? statResult.reason.message
          : "Gagal memuat statistik knowledge.",
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) {
      Swal.fire({
        icon: "warning",
        title: "Validasi Gagal",
        text: "Judul minimal 3 karakter.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (mode === "file") {
        if (!file) {
          Swal.fire({
            icon: "warning",
            title: "File Belum Dipilih",
            text: "Pilih file PDF, TXT, MD, atau CSV.",
            confirmButtonColor: "#3b82f6",
          });
          setSaving(false);
          return;
        }
        await uploadKnowledgeFile({
          title: title.trim(),
          description: description.trim() || undefined,
          file,
        });
      } else {
        if (content.trim().length < 20) {
          Swal.fire({
            icon: "warning",
            title: "Validasi Gagal",
            text: "Konten teks minimal 20 karakter.",
            confirmButtonColor: "#3b82f6",
          });
          setSaving(false);
          return;
        }
        await createKnowledgeText({
          title: title.trim(),
          description: description.trim() || undefined,
          content: content.trim(),
        });
      }
      setTitle("");
      setDescription("");
      setContent("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await load();
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Dokumen berhasil di-upload dan di-index ke Chroma.",
        confirmButtonColor: "#3b82f6",
        timer: 2500,
        timerProgressBar: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal meng-upload knowledge.";
      setError(message);
      Swal.fire({
        icon: "error",
        title: "Gagal Upload",
        text: message,
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const result = await Swal.fire({
      title: "Hapus Dokumen?",
      text: "Dokumen akan dihapus dari Chroma dan database. Aksi ini tidak bisa dibatalkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      Swal.fire({
        title: "Menghapus...",
        text: "Sedang menghapus dokumen dari Chroma dan database.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });
      await deleteKnowledgeDocument(id);
      await load();
      Swal.fire({
        icon: "success",
        title: "Terhapus!",
        text: "Dokumen berhasil dihapus dari Chroma dan database.",
        confirmButtonColor: "#3b82f6",
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus.";
      setError(message);
      Swal.fire({
        icon: "error",
        title: "Gagal Menghapus",
        text: message,
        confirmButtonColor: "#ef4444",
      });
    }
  }

  async function handleReindex(id: string) {
    try {
      await reindexKnowledgeDocument(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal re-index.");
    }
  }

  const displayItems = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <ComponentCard title="Total">
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">{stats.total}</p>
          </ComponentCard>
          <ComponentCard title="Ter-index">
            <p className="text-2xl font-bold text-success-600">{stats.indexed}</p>
          </ComponentCard>
          <ComponentCard title="Pending">
            <p className="text-2xl font-bold text-warning-600">{stats.pending}</p>
          </ComponentCard>
          <ComponentCard title="Gagal">
            <p className="text-2xl font-bold text-error-600">{stats.failed}</p>
          </ComponentCard>
          <ComponentCard title="Chroma">
            <Badge color={stats.chromaConfigured ? "success" : "error"}>
              {stats.chromaConfigured ? "Terhubung" : "Belum config"}
            </Badge>
          </ComponentCard>
        </div>
      )}

      {stats && !stats.chromaConfigured && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-200">
          <p className="font-medium">Chroma Cloud belum siap</p>
          <p className="mt-1 text-warning-700 dark:text-warning-300/90">
            {stats.chromaConfigIssue ??
              "Buat API key di dashboard Chroma (database bisa), lalu set CHROMA_API_KEY di Backend/.env."}{" "}
            <strong>Jangan</strong> isi Tenant ID sebagai API key — keduanya berbeda.
          </p>
        </div>
      )}

      <ComponentCard title="Upload Knowledge (RAG)">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Dokumen di-index ke Chroma Cloud database <strong>bisa</strong> untuk chatbot BISA Assistant.
          Format: PDF, TXT, MD, CSV.
        </p>
        {error && (
          <p className="mb-3 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "file" ? "primary" : "outline"}
              onClick={() => setMode("file")}
            >
              Upload file
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "text" ? "primary" : "outline"}
              onClick={() => setMode("text")}
            >
              Tempel teks
            </Button>
          </div>
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            placeholder="Judul dokumen"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            placeholder="Deskripsi (opsional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {mode === "file" ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                File dokumen
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={FILE_ACCEPT}
                className="sr-only"
                aria-hidden
                tabIndex={-1}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/80 px-4 py-4 dark:border-gray-700 dark:bg-white/[0.02]">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Pilih file
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {file ? (
                    <>
                      Terpilih:{" "}
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {file.name}
                      </span>
                      {" "}
                      ({Math.max(1, Math.round(file.size / 1024))} KB)
                    </>
                  ) : (
                    "PDF, TXT, MD, atau CSV — maks. 15 MB"
                  )}
                </span>
                {file && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Hapus
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <textarea
              className="min-h-[160px] w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              placeholder="Tempel konten FAQ, SOP, atau panduan biochar..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Meng-index..." : "Upload & Index ke Chroma"}
          </Button>
        </form>
      </ComponentCard>

      <ComponentCard title="Daftar Dokumen">
        {loading ? (
          <p className="text-sm text-gray-500">Memuat...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Judul</TableCell>
                <TableCell isHeader>Tipe</TableCell>
                <TableCell isHeader>Chunks</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Tanggal</TableCell>
                <TableCell isHeader>Aksi</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      {item.fileName && (
                        <p className="text-xs text-gray-500">{item.fileName}</p>
                      )}
                      {item.errorMessage && (
                        <p className="text-xs text-error-600">{item.errorMessage}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.sourceType}</TableCell>
                  <TableCell>{item.chunkCount}</TableCell>
                  <TableCell>
                    <Badge color={STATUS_COLOR[item.status] ?? "info"}>{item.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {item.storageKey && item.status === "FAILED" && (
                        <Button size="sm" variant="outline" onClick={() => handleReindex(item.id)}>
                          Re-index
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {displayItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Belum ada dokumen. Upload PDF/TXT/MD/CSV atau tempel teks di atas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </ComponentCard>
    </div>
  );
}
