import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DisputesTable from "@/components/disputes/DisputesTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sengketa | BISA Admin",
  description: "Kelola sengketa order BISA",
};

export default function DisputesPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="Sengketa Order"
        description="Tinjau dan selesaikan sengketa antara pembeli dan penjual"
      />
      <DisputesTable />
    </div>
  );
}
