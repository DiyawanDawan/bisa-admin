"use client";

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

type PaginationProps = {
  /** Alias TailAdmin lama — gunakan `page` jika memungkinkan */
  currentPage?: number;
  page?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: readonly number[];
  className?: string;
  /** Selalu tampilkan bar (termasuk 1 halaman) bila ada data */
  alwaysShow?: boolean;
};

/**
 * Pagination admin: nomor halaman + pilihan baris per halaman.
 * Kompatibel dengan props lama (`currentPage` / `totalPages` saja).
 */
export default function Pagination({
  currentPage,
  page,
  totalPages: totalPagesProp,
  total,
  limit = 10,
  onPageChange,
  onLimitChange,
  limitOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className = "",
  alwaysShow = true,
}: PaginationProps) {
  const activePage = page ?? currentPage ?? 1;
  const totalPages =
    totalPagesProp ??
    (typeof total === "number" ? Math.max(1, Math.ceil(total / Math.max(1, limit))) : 1);

  const showBar =
    alwaysShow && (typeof total === "number" ? total > 0 : totalPages >= 1);
  if (!showBar && totalPages <= 1 && !onLimitChange) return null;

  const from =
    typeof total === "number" && total > 0
      ? (activePage - 1) * limit + 1
      : 0;
  const to =
    typeof total === "number" ? Math.min(activePage * limit, total) : 0;

  const pageButtons = buildPageButtons(activePage, totalPages);

  return (
    <div
      className={`flex flex-col gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3 text-theme-xs text-gray-500 dark:text-gray-400">
        {typeof total === "number" ? (
          <span>
            Menampilkan{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {from}–{to}
            </span>{" "}
            dari{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {total}
            </span>
          </span>
        ) : (
          <span>
            Halaman {activePage} / {totalPages}
          </span>
        )}
        {onLimitChange ? (
          <label className="inline-flex items-center gap-2">
            <span>Per halaman</span>
            <select
              value={limit}
              onChange={(e) => {
                onLimitChange(Number(e.target.value));
              }}
              className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              aria-label="Jumlah baris per halaman"
            >
              {limitOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(activePage - 1)}
          disabled={activePage <= 1}
          className="flex h-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          Sebelumnya
        </button>
        <div className="flex items-center gap-1">
          {pageButtons.map((p, idx) =>
            p === "…" ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-1 text-sm text-gray-400"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium ${
                  activePage === p
                    ? "bg-brand-500 text-white"
                    : "text-gray-700 hover:bg-brand-50 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-brand-400"
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(activePage + 1)}
          disabled={activePage >= totalPages}
          className="flex h-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}

function buildPageButtons(current: number, total: number): Array<number | "…"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current]);
  for (let d = 1; d <= 1; d++) {
    if (current - d > 1) pages.add(current - d);
    if (current + d < total) pages.add(current + d);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}
