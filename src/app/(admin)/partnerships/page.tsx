import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PartnershipsTable from "@/components/partnerships/PartnershipsTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontrak Kerjasama | BISA Admin",
  description: "Kelola kontrak kerjasama mitra BISA",
};

export default function PartnershipsPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="Kontrak Kerjasama"
        description="Pantau draf, menunggu TTD, dan kontrak aktif buyer–supplier"
      />
      <PartnershipsTable />
    </div>
  );
}
