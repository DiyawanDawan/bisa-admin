import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BisaExpressPanel from "@/components/bisa-express/BisaExpressPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BISA Express | BISA Admin",
};

export default function BisaExpressAdminPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="BISA Express" />
      <BisaExpressPanel />
    </div>
  );
}
