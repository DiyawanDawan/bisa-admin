import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AdminChatPanel from "@/components/chat/AdminChatPanel";
import { Suspense } from "react";

export default function ChatPage() {
  return (
    <div>
      <PageBreadcrumb
        pageTitle="Chat negosiasi"
        description="Chat negosiasi akun Anda sebagai pembeli atau supplier — bukan akses ke chat pengguna lain"
      />
      <Suspense
        fallback={
          <div className="h-[480px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        }
      >
        <AdminChatPanel />
      </Suspense>
    </div>
  );
}
