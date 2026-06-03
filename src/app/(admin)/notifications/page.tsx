import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import NotificationsPanel from "@/components/notifications/NotificationsPanel";

export default function NotificationsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Notifikasi Sistem" />
      <NotificationsPanel />
    </div>
  );
}
