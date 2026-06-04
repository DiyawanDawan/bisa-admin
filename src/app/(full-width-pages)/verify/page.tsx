"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export default function VerifyLookupPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) return;
    router.push(`/verify/${encodeURIComponent(trimmed)}`);
  };

  return (
    <PublicPageShell
      title="Verifikasi Kontrak B2B"
      subtitle="Masukkan nomor pesanan dari tagihan atau scan QR resmi BISA."
    >
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
      >
        <label className="mb-2 block text-sm font-semibold text-[#334155]">
          Nomor pesanan / kontrak
        </label>
        <input
          type="text"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Contoh: BISA-2026-000123"
          className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none focus:border-[#135122] focus:ring-2 focus:ring-[#DCFCE7]"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-[#135122] px-4 py-3 text-sm font-bold text-white hover:bg-[#1A4823]"
        >
          Verifikasi
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[#64748B]">
        Ingin lacak pengiriman?{" "}
        <Link href="/track" className="font-semibold text-[#135122] hover:underline">
          Lacak pesanan
        </Link>
      </p>
    </PublicPageShell>
  );
}
