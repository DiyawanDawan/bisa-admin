"use client";
import ComponentCard from "@/components/common/ComponentCard";
import AdminMediaImage from "@/components/common/AdminMediaImage";
import PartyAvatar from "@/components/common/PartyAvatar";
import Badge from "@/components/ui/badge/Badge";
import { fetchAdminOrderDetail } from "@/lib/api/extended";
import {
  formatDate,
  formatIDR,
  formatOrderPayment,
  formatPaymentMethod,
  formatPaymentStatus,
} from "@/lib/format";
import type { AdminOrderDetail } from "@/types/extended";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function OrderDetailView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminOrderDetail(orderId)
      .then(setOrder)
      .catch(() => setError("Gagal memuat detail order."));
  }, [orderId]);

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-error-200 bg-error-50 px-5 py-4 text-sm text-error-700">
        {error ?? "Memuat..."}
        <Link href="/orders" className="ml-2 underline">
          Kembali
        </Link>
      </div>
    );
  }

  const buyer = order.buyer;
  const seller = order.seller;
  const items = order.items ?? [];
  const shipping = order.orderShipping;
  const shipment = order.shipment;
  const tx = order.transaction;

  return (
    <div className="space-y-6">
      <Link href="/orders" className="text-sm text-brand-600 hover:underline">
        ← Daftar order
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{String(order.orderNumber)}</h1>
        <Badge color="primary" size="sm">
          {String(order.status)}
        </Badge>
        {order.dispute ? (
          <Link href={`/disputes/${order.id}`} className="text-sm text-brand-600 hover:underline">
            Lihat sengketa
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComponentCard title="Pihak">
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-2 text-xs text-gray-500">Pembeli</p>
              <PartyAvatar
                name={buyer.fullName}
                avatarUrl={buyer.avatarUrl}
                subtitle={buyer.email}
                tone="buyer"
                size="md"
              />
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500">Supplier</p>
              <PartyAvatar
                name={seller.fullName}
                avatarUrl={seller.avatarUrl}
                subtitle={seller.email}
                tone="seller"
                size="md"
              />
            </div>
            <dl className="space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
              <div>
                <dt className="text-gray-500">Total</dt>
                <dd className="font-medium">{formatIDR(Number(order.totalAmount))}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Dibuat</dt>
                <dd>{formatDate(String(order.createdAt))}</dd>
              </div>
            </dl>
          </div>
        </ComponentCard>
        <ComponentCard title="Pembayaran">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Metode dipakai</dt>
              <dd className="font-medium">{formatOrderPayment(tx)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Jenis</dt>
              <dd>
                {formatPaymentMethod(tx?.paymentChannel?.group ?? tx?.paymentMethod)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Channel</dt>
              <dd>
                {tx?.paymentChannel
                  ? `${tx.paymentChannel.name} (${tx.paymentChannel.code})`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Status bayar</dt>
              <dd className="font-medium">
                {formatPaymentStatus(tx?.paymentStatus ?? tx?.status)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Dibayar pada</dt>
              <dd>{tx?.paidAt ? formatDate(String(tx.paidAt)) : "—"}</dd>
            </div>
            {tx?.amount != null ? (
              <div>
                <dt className="text-gray-500">Nominal transaksi</dt>
                <dd className="font-medium">{formatIDR(Number(tx.amount))}</dd>
              </div>
            ) : null}
            {tx?.externalId ? (
              <div>
                <dt className="text-gray-500">ID eksternal</dt>
                <dd className="break-all font-mono text-xs text-gray-600 dark:text-gray-400">
                  {tx.externalId}
                </dd>
              </div>
            ) : null}
          </dl>
        </ComponentCard>
      </div>
      <ComponentCard title="Item order">
          <ul className="space-y-2 text-sm">
            {items.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 border-b border-gray-100 py-2 dark:border-gray-800"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <AdminMediaImage
                    src={item.product.thumbnailUrl}
                    alt={item.product.name}
                    className="h-10 w-10 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <span className="truncate">{item.product.name}</span>
                </div>
                <span className="shrink-0">
                  {Number(item.quantity)} × {formatIDR(Number(item.pricePerUnit))}
                </span>
              </li>
            ))}
          </ul>
        </ComponentCard>
      {shipping || shipment ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {shipping ? (
            <ComponentCard title="Ongkir RajaOngkir">
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Kurir</dt>
                  <dd className="font-medium">
                    {(shipping.courierCode ?? "").toUpperCase()}{" "}
                    {shipping.serviceName ? `· ${shipping.serviceName}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Biaya Ongkir</dt>
                  <dd className="font-medium">{formatIDR(Number(shipping.shippingCost))}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">ETD</dt>
                  <dd>{shipping.etd ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Berat</dt>
                  <dd>{shipping.weightGrams.toLocaleString("id-ID")} gram</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Tujuan</dt>
                  <dd>{shipping.destinationLabel ?? String(shipping.destinationDestinationId)}</dd>
                </div>
              </dl>
            </ComponentCard>
          ) : null}
          {shipment ? (
            <ComponentCard title="Tracking Pengiriman">
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Resi</dt>
                  <dd className="font-medium">{shipment.awbNumber ?? "Belum diinput"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Status kirim</dt>
                  <dd>{shipment.deliveryStatus ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Kurir tracking</dt>
                  <dd>{shipment.courierCode?.toUpperCase() ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Update terakhir</dt>
                  <dd>{formatDate(shipment.lastTrackedAt ?? shipment.updatedAt)}</dd>
                </div>
              </dl>
            </ComponentCard>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
