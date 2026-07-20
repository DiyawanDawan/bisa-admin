import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FaqsManager from "@/components/content/FaqsManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | BISA Admin",
};

export default function FaqsPage() {
  return (
    <div>
      <PageBreadcrumb
        pageTitle="Manajemen FAQ"
        description="Kelola pertanyaan & jawaban Help Center — lihat detail lengkap di panel kanan"
      />
      <FaqsManager />
    </div>
  );
}
