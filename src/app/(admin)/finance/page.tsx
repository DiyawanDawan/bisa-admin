import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FinancePanel from "@/components/finance/FinancePanel";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Keuangan | BISA Admin",
};

export default function FinancePage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Keuangan & Escrow" />
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        }
      >
        <FinancePanel />
      </Suspense>
    </div>
  );
}
