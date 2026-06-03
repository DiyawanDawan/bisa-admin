import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PoliciesManager from "@/components/content/PoliciesManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan | BISA Admin",
};

export default function PoliciesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Kebijakan legal" />
      <PoliciesManager />
    </div>
  );
}
