import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import JilidUpgradeRequestsTable from "@/components/tier/JilidUpgradeRequestsTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minta naik jilid | BISA Admin",
  description: "Daftar permintaan naik jilid / tier pengguna BISA",
};

export default function JilidUpgradeRequestsPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="Minta naik jilid"
        description="Daftar permintaan kenaikan jilid. Centang dan aksi setuju/tolak menyusul."
      />
      <JilidUpgradeRequestsTable />
    </div>
  );
}
