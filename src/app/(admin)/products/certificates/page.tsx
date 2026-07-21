import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProductCertificateQueue from "@/components/products/certificates/ProductCertificateQueue";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sertifikasi | BISA Admin",
};

export default function ProductCertificatesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Sertifikasi Produk & Toko" />
      <ProductCertificateQueue />
    </div>
  );
}
