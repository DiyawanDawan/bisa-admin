import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PartnershipDetailView from "@/components/partnerships/PartnershipDetailView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Kontrak Kerjasama | BISA Admin",
};

export default async function PartnershipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Detail kontrak kerjasama" />
      <PartnershipDetailView id={id} />
    </div>
  );
}
