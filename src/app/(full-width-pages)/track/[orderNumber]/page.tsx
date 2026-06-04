import Link from "next/link";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { fetchPublicApi } from "@/lib/public-api";

type TrackData = {
  orderNumber: string;
  status: string;
  seller?: { fullName?: string };
  items?: Array<{
    quantity?: number;
    product?: { name?: string; unit?: string };
  }>;
  shipment?: {
    awbNumber?: string | null;
    courierCode?: string | null;
    deliveryStatus?: string | null;
    vesselName?: string | null;
    originHub?: string | null;
    destinationHub?: string | null;
    aiInsight?: string | null;
    updatedAt?: string | null;
  } | null;
};

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const decoded = decodeURIComponent(orderNumber);

  let data: TrackData | null = null;
  let error: string | null = null;

  try {
    const res = await fetchPublicApi<TrackData>(
      `/orders/track/${encodeURIComponent(decoded)}`,
    );
    data = res.data;
  } catch (e) {
    error = e instanceof Error ? e.message : "Pesanan tidak ditemukan";
  }

  const shipment = data?.shipment;

  return (
    <PublicPageShell title="Status Pengiriman" subtitle={decoded}>
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-[#64748B]">Status pesanan</dt>
                <dd className="font-semibold">{data.status}</dd>
              </div>
              <div>
                <dt className="text-[#64748B]">Supplier</dt>
                <dd className="font-semibold">{data.seller?.fullName ?? "—"}</dd>
              </div>
            </dl>
          </div>

          {shipment ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-[#0F172A]">Info pengiriman</h2>
              <dl className="grid gap-3 text-sm">
                {shipment.deliveryStatus ? (
                  <div>
                    <dt className="text-[#64748B]">Status delivery</dt>
                    <dd className="font-semibold">{shipment.deliveryStatus}</dd>
                  </div>
                ) : null}
                {shipment.awbNumber ? (
                  <div>
                    <dt className="text-[#64748B]">No. resi</dt>
                    <dd className="font-semibold">{shipment.awbNumber}</dd>
                  </div>
                ) : null}
                {shipment.courierCode ? (
                  <div>
                    <dt className="text-[#64748B]">Kurir</dt>
                    <dd className="font-semibold">{shipment.courierCode}</dd>
                  </div>
                ) : null}
                {shipment.originHub ? (
                  <div>
                    <dt className="text-[#64748B]">Asal hub</dt>
                    <dd className="font-semibold">{shipment.originHub}</dd>
                  </div>
                ) : null}
                {shipment.destinationHub ? (
                  <div>
                    <dt className="text-[#64748B]">Tujuan hub</dt>
                    <dd className="font-semibold">{shipment.destinationHub}</dd>
                  </div>
                ) : null}
                {shipment.vesselName ? (
                  <div>
                    <dt className="text-[#64748B]">Armada / kapal</dt>
                    <dd className="font-semibold">{shipment.vesselName}</dd>
                  </div>
                ) : null}
                {shipment.aiInsight ? (
                  <div>
                    <dt className="text-[#64748B]">Insight</dt>
                    <dd className="text-[#334155]">{shipment.aiInsight}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Pesanan belum memiliki data pengiriman aktif.
            </div>
          )}

          <Link
            href={`/verify/${encodeURIComponent(data.orderNumber)}`}
            className="block text-center text-sm font-semibold text-[#135122] hover:underline"
          >
            Verifikasi kontrak →
          </Link>
        </div>
      ) : null}
    </PublicPageShell>
  );
}
