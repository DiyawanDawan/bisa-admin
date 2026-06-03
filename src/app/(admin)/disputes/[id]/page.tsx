import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DisputeDetailView from "@/components/disputes/DisputeDetailView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Sengketa | BISA Admin",
};

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Detail sengketa" />
      <DisputeDetailView orderId={id} />
    </div>
  );
}
