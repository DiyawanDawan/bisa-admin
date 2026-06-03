"use client";
import AdminAreaChart from "@/components/charts/area/AdminAreaChart";
import AdminDonutChart from "@/components/charts/donut/AdminDonutChart";
import AdminInfoBanner from "@/components/common/AdminInfoBanner";
import AdminMetricCard from "@/components/common/AdminMetricCard";
import AdminSegmentTabs from "@/components/common/AdminSegmentTabs";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchCrmContacts, fetchCrmOverview } from "@/lib/api/extended";
import { selectClass } from "@/lib/form-classes";
import { formatDate, formatIDR } from "@/lib/format";
import type { CrmContactListItem, CrmOverview, CrmStage } from "@/types/extended";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const STAGES: CrmStage[] = ["LEAD", "PROSPECT", "ACTIVE", "VIP", "AT_RISK"];

const STAGE_LABELS: Record<CrmStage, string> = {
  LEAD: "Lead",
  PROSPECT: "Prospek",
  ACTIVE: "Aktif",
  VIP: "VIP",
  AT_RISK: "Berisiko",
};

const STAGE_COLORS: Record<CrmStage, string> = {
  LEAD: "#9ca3af",
  PROSPECT: "#0ea5e9",
  ACTIVE: "#059669",
  VIP: "#135122",
  AT_RISK: "#dc2626",
};

function stageBadge(stage: CrmStage) {
  const map: Record<CrmStage, "success" | "warning" | "error" | "light" | "primary"> = {
    LEAD: "light",
    PROSPECT: "primary",
    ACTIVE: "success",
    VIP: "success",
    AT_RISK: "error",
  };
  return (
    <Badge color={map[stage]} size="sm">
      {STAGE_LABELS[stage]}
    </Badge>
  );
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

export default function CrmDashboard() {
  const router = useRouter();
  const [overview, setOverview] = useState<CrmOverview | null>(null);
  const [contacts, setContacts] = useState<CrmContactListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [stageFilter, setStageFilter] = useState<CrmStage | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, list] = await Promise.all([
        fetchCrmOverview(),
        fetchCrmContacts({
          page: 1,
          limit: 25,
          search: debouncedSearch || undefined,
          role: roleFilter || undefined,
          stage: stageFilter || undefined,
        }),
      ]);
      setOverview(ov);
      setContacts(list.items);
      setTotal(list.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat CRM.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, stageFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const pipelineChart = useMemo(() => {
    if (!overview) return { labels: [], series: [], colors: [] };
    return {
      labels: STAGES.map((s) => STAGE_LABELS[s]),
      series: STAGES.map((s) => overview.pipeline[s] ?? 0),
      colors: STAGES.map((s) => STAGE_COLORS[s]),
    };
  }, [overview]);

  const leadCategories = useMemo(
    () => overview?.dailyLeads.map((p) => formatDayLabel(p.x)) ?? [],
    [overview],
  );

  const stageTabs = useMemo(
    () => [
      { id: "", label: "Semua pipeline", hint: "Tanpa filter stage" },
      ...STAGES.map((s) => ({
        id: s,
        label: STAGE_LABELS[s],
        hint: overview ? `${overview.pipeline[s] ?? 0} kontak` : undefined,
      })),
    ],
    [overview],
  );

  return (
    <div className="space-y-6">
      <AdminInfoBanner>
        CRM BISA: segmentasi otomatis dari order & negosiasi, catatan admin, follow-up, dan
        pipeline penjualan B2B.
      </AdminInfoBanner>

      {error ? <Alert variant="error" title="CRM" message={error} /> : null}

      {overview && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetricCard
              label="Total kontak"
              value={String(overview.summary.totalContacts)}
              desc={`+${overview.summary.newContacts30d} bulan ini`}
            />
            <AdminMetricCard
              label="Pembeli / Supplier"
              value={`${overview.summary.buyers} / ${overview.summary.suppliers}`}
            />
            <AdminMetricCard
              label="GMV platform"
              value={formatIDR(overview.summary.platformGmv)}
            />
            <AdminMetricCard
              label="Nego terbuka / KYC"
              value={`${overview.summary.openNegotiations} / ${overview.summary.pendingKyc}`}
            />
          </div>

          <AdminSegmentTabs
            tabs={stageTabs}
            active={stageFilter}
            onChange={(id) => setStageFilter(id as CrmStage | "")}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <ComponentCard title="Pipeline CRM" desc="Distribusi stage">
              <AdminDonutChart
                labels={pipelineChart.labels}
                series={pipelineChart.series}
                colors={pipelineChart.colors}
                centerLabel="Kontak"
                formatTotal={(sum) => String(Math.round(sum))}
                formatValue={(val) => String(Math.round(val))}
                height={280}
                emptyMessage="Belum ada kontak di pipeline."
              />
            </ComponentCard>
            <ComponentCard title="Kontak baru" desc="30 hari terakhir">
              <AdminAreaChart
                categories={leadCategories}
                series={{
                  name: "Kontak baru",
                  data: overview.dailyLeads.map((p) => p.y),
                }}
                emptyMessage="Belum ada kontak baru."
              />
            </ComponentCard>
          </div>
        </>
      )}

      <ComponentCard
        title="Kontak CRM"
        desc={`${total} kontak — cari dan filter`}
        className="scroll-mt-6"
      >
        <div id="crm-contacts" className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Label>Cari</Label>
            <Input
              placeholder="Nama, email, perusahaan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="min-w-[160px]">
            <Label>Role</Label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={selectClass}
            >
              <option value="">Semua role</option>
              <option value="BUYER">Pembeli</option>
              <option value="SUPPLIER">Supplier</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : contacts.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Tidak ada kontak.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Kontak</TableCell>
                  <TableCell isHeader>Stage</TableCell>
                  <TableCell isHeader>GMV selesai</TableCell>
                  <TableCell isHeader>Order</TableCell>
                  <TableCell isHeader>Follow-up</TableCell>
                  <TableCell isHeader className="text-end">
                    Aksi
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium text-gray-800 dark:text-white/90">{c.fullName}</p>
                      <p className="text-theme-xs text-gray-500">
                        {c.role} · {c.companyName ?? c.email}
                      </p>
                    </TableCell>
                    <TableCell>
                      {stageBadge(c.stage)}
                      {c.stageOverride && c.stageOverride !== c.stageComputed && (
                        <span className="ml-1 text-[10px] text-gray-400">(manual)</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{formatIDR(c.completedGmv)}</TableCell>
                    <TableCell>{c.completedOrders}</TableCell>
                    <TableCell className="text-theme-xs text-gray-500">
                      {c.nextFollowUpAt ? formatDate(c.nextFollowUpAt) : "—"}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/crm/${c.id}`)}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
