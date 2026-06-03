import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProductsTable from "@/components/products/ProductsTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Produk | BISA Admin",
};

export default function ProductsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Moderasi Produk" />
      <ProductsTable />
    </div>
  );
}
