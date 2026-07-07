import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import KnowledgeManager from "@/components/content/KnowledgeManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knowledge RAG | BISA Admin",
};

export default function KnowledgePage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Knowledge Base (RAG)" />
      <KnowledgeManager />
    </div>
  );
}
