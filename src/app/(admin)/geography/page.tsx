import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import RegionsExplorer from "@/components/geography/RegionsExplorer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wilayah | BISA Admin",
};

export default function GeographyPage() {
  return (
    <div>
      <PageBreadcrumb
        pageTitle="Wilayah administratif"
        description="Kelola hierarki alamat: Negara → Provinsi → Kabupaten/Kota → Kecamatan → Desa/Kelurahan"
      />
      <RegionsExplorer />
    </div>
  );
}
