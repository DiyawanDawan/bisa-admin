import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CartsOverview from "@/components/analytics/CartsOverview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keranjang | BISA Admin",
};

export default function CartsPage() {
  return (
    <div>
      <PageBreadcrumb
        pageTitle="Insight keranjang"
        description="Analitik keranjang belanja dan konversi checkout"
      />
      <CartsOverview />
    </div>
  );
}
