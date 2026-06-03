import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FaqsManager from "@/components/content/FaqsManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | BISA Admin",
};

export default function FaqsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Manajemen FAQ" />
      <FaqsManager />
    </div>
  );
}
