import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SupportInbox from "@/components/support/SupportInbox";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Service | BISA Admin",
};

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="Customer Service"
        description="Tangani tiket bantuan user. Pesan di sini dijawab oleh CS manusia, bukan AI."
      />
      <SupportInbox />
    </div>
  );
}
