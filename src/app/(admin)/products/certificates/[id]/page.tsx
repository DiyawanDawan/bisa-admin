import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProductCertificateDetailView from "@/components/products/certificates/ProductCertificateDetailView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Sertifikat Produk | BISA Admin",
};

export default async function ProductCertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Detail Sertifikat Produk" />
      <ProductCertificateDetailView id={id} />
    </div>
  );
}
