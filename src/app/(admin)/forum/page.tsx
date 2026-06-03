import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ForumModeration from "@/components/forum/ForumModeration";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forum | BISA Admin",
};

export default function ForumPage() {
  return (
    <div>
      <PageBreadcrumb
        pageTitle="Moderasi forum"
        description="Buat, edit, publish, dan arsipkan posting komunitas BISA"
      />
      <ForumModeration />
    </div>
  );
}
