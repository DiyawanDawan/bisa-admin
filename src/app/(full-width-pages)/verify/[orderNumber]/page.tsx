import Link from "next/link";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { fetchPublicApi } from "@/lib/public-api";
import Badge from "@/components/ui/badge/Badge";

type VerifyData = {
  orderNumber: string;
  status: string;
  createdAt: string;
  totalQuantity: unknown;
  specifications?: unknown;
  verificationStatus: string;
  seller?: { fullName?: string };
  items?: Array<{
    product?: {
      name?: string;
      biomassaType?: string;
      thumbnailUrl?: string | null;
      isCertified?: boolean;
      isIotMonitored?: boolean;
      isEscrowProtected?: boolean;
    };
  }>;
};

export default async function VerifyOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const decoded = decodeURIComponent(orderNumber);

  let data: VerifyData | null = null;
  let error: string | null = null;

  try {
    const res = await fetchPublicApi<VerifyData>(
      `/orders/verify/${encodeURIComponent(decoded)}`,
    );
    data = res.data;
  } catch (e) {
    error = e instanceof Error ? e.message : "Kontrak tidak ditemukan";
  }

  return (
    <PublicPageShell
      title="Hasil Verifikasi"
      subtitle={decoded}
    >
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#86EFAC] bg-[#DCFCE7] p-4">
            <p className="text-sm font-bold text-[#135122]">
              ✓ Terverifikasi oleh BISA B2B
            </p>
            <p className="mt-1 text-xs text-[#166534]">{data.verificationStatus}</p>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-[#64748B]">Nomor kontrak</dt>
                <dd className="font-semibold">{data.orderNumber}</dd>
              </div>
              <div>
                <dt className="text-[#64748B]">Status pesanan</dt>
                <dd className="font-semibold">{data.status}</dd>
              </div>
              <div>
                <dt className="text-[#64748B]">Supplier</dt>
                <dd className="font-semibold">{data.seller?.fullName ?? "—"}</dd>
              </div>
              {data.items?.map((item, i) => (
                <div key={i}>
                  <dt className="text-[#64748B]">Produk</dt>
                  <dd>
                    <div className="flex items-start gap-3">
                      {item.product?.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.thumbnailUrl}
                          alt={item.product.name ?? "Produk"}
                          className="mt-0.5 h-14 w-14 rounded-lg border border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="mt-0.5 flex h-14 w-14 items-center justify-center rounded-lg border border-gray-200 bg-white text-[11px] text-gray-500">
                          Tanpa
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-semibold">
                          {item.product?.name ?? "—"}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {item.product?.isCertified ? (
                            <Badge color="primary" size="sm">
                              Certified
                            </Badge>
                          ) : null}
                          {item.product?.isIotMonitored ? (
                            <Badge color="success" size="sm">
                              IoT Monitored
                            </Badge>
                          ) : null}
                          {item.product?.isEscrowProtected ? (
                            <Badge color="success" size="sm">
                              Escrow Protected
                            </Badge>
                          ) : (
                            <Badge color="warning" size="sm">
                              Escrow Off
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <Link
            href={`/track/${encodeURIComponent(data.orderNumber)}`}
            className="block text-center text-sm font-semibold text-[#135122] hover:underline"
          >
            Lacak pengiriman pesanan ini →
          </Link>
        </div>
      ) : null}
    </PublicPageShell>
  );
}
