import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import MarketTrendsView from "@/components/market/MarketTrendsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pasar | BISA Admin",
};

export default function MarketPage() {
  return (
    <div>
      <PageBreadcrumb
        pageTitle="Tren pasar"
        description="Market Intelligence — pantau harga karbon, biomassa, dan logistik (selaras mobile)"
      />
      <MarketTrendsView />
    </div>
  );
}
