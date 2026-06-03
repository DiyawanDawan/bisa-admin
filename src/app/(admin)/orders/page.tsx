import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import OrdersList from "@/components/orders/OrdersList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order | BISA Admin",
};

export default function OrdersPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Manajemen Order" />
      <OrdersList />
    </div>
  );
}
