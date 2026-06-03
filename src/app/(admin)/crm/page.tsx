import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CrmDashboard from "@/components/crm/CrmDashboard";

export default function CrmPage() {
  return (
    <div>
      <PageBreadcrumb
        pageTitle="CRM BISA"
        description="Pipeline kontak, GMV, catatan admin, dan follow-up pembeli & supplier"
      />
      <CrmDashboard />
    </div>
  );
}
