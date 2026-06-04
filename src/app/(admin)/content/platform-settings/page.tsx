import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PlatformSettingsManager from "@/components/content/PlatformSettingsManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengaturan Platform | BISA Admin",
};

export default function PlatformSettingsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Pengaturan Platform" />
      <PlatformSettingsManager />
    </div>
  );
}
