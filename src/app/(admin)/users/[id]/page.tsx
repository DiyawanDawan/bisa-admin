import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UserDossierView from "@/components/users/UserDossierView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dossier Pengguna | BISA Admin",
};

export default async function UserDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Dossier pengguna" />
      <UserDossierView userId={id} />
    </div>
  );
}
