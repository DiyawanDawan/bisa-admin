import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ArticlesManager from "@/components/content/ArticlesManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artikel | BISA Admin",
};

export default function ArticlesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Manajemen artikel" />
      <ArticlesManager />
    </div>
  );
}
