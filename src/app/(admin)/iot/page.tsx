import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IotDevicesPanel from "@/components/iot/IotDevicesPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IoT Monitoring | BISA Admin",
};

export default function IotMonitoringPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Smart Monitoring IoT" />
      <IotDevicesPanel />
    </div>
  );
}
