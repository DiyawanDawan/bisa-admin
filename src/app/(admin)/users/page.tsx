"use client";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UsersStatsPanel from "@/components/users/UsersStatsPanel";
import UsersTable from "@/components/users/UsersTable";
import { useState } from "react";

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  return (
    <div className="space-y-8">
      <PageBreadcrumb
        pageTitle="Manajemen Pengguna"
        description="Statistik demografi & KYC, tren pendaftaran, dan daftar akun"
      />

      <UsersStatsPanel
        onRoleClick={(role) => {
          setRoleFilter(role);
          document.getElementById("users-table")?.scrollIntoView({ behavior: "smooth" });
        }}
        onStatusClick={(status) => {
          setStatusFilter(status);
          document.getElementById("users-table")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <UsersTable
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onRoleFilterChange={setRoleFilter}
        onStatusFilterChange={setStatusFilter}
      />
    </div>
  );
}
