import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CategoriesManager from "@/components/products/CategoriesManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kategori Produk | BISA Admin",
};

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Kategori Master" />
      <CategoriesManager />
    </div>
  );
}
