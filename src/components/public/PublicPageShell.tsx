import Link from "next/link";
import type { ReactNode } from "react";

export function PublicPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <header className="border-b border-[#E2E8F0] bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#135122]">
              BISA B2B
            </p>
            <h1 className="text-xl font-bold text-[#0F172A]">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p>
            ) : null}
          </div>
          <nav className="flex shrink-0 gap-3 text-sm font-medium">
            <Link href="/verify" className="text-[#135122] hover:underline">
              Verifikasi
            </Link>
            <Link href="/track" className="text-[#135122] hover:underline">
              Lacak
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8">{children}</main>
      <footer className="border-t border-[#E2E8F0] py-6 text-center text-xs text-[#94A3B8]">
        © BISA B2B Platform
      </footer>
    </div>
  );
}
