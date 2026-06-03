import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import KYCQueueTable from "@/components/users/KYCQueueTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verifikasi KYC | BISA Admin",
};

export default function KYCPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="Antrean Verifikasi KYC"
        description="Tinjau dan setujui permohonan verifikasi identitas"
      />
      <KYCQueueTable />
    </div>
  );
}
