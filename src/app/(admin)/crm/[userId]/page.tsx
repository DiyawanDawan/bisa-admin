import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CrmContactDetailView from "@/components/crm/CrmContactDetailView";

type Props = { params: Promise<{ userId: string }> };

export default async function CrmContactPage({ params }: Props) {
  const { userId } = await params;
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Detail kontak CRM" />
      <CrmContactDetailView userId={userId} />
    </div>
  );
}
