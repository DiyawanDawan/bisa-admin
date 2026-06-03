import BisaDashboard from "@/components/dashboard/BisaDashboard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | BISA Admin",
  description: "Panel admin BISA — statistik platform, grafik, dan akses cepat modul",
};

export default function DashboardPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Dashboard" />
      <BisaDashboard />
    </div>
  );
}
