import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import StoreCertificateDetailView from "@/components/products/certificates/StoreCertificateDetailView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Sertifikat Toko | BISA Admin",
};

export default async function StoreCertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <PageBreadcrumb pageTitle="Detail sertifikat toko" />
      <StoreCertificateDetailView id={id} />
    </div>
  );
}
