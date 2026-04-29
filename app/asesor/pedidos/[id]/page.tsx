'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Check, Package } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDateTime, getStatusMeta } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';

const STATUS_ORDER: OrderStatus[] = [
  'pending_sync', 'synced', 'validated', 'in_sap', 'dispatched', 'delivered',
];

export default function AdvisorOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state } = useStore();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const order = state.orders.find((o) => o.id === id);
  if (!order) return (
    <div className="p-8 text-center text-gray-400">
      <Package size={32} className="mx-auto mb-2 opacity-40" />
      <p>Pedido no encontrado</p>
    </div>
  );

  function copySap() {
    if (order?.sapOrderNumber) {
      navigator.clipboard.writeText(order.sapOrderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  const isRejectedOrCancelled = order.status === 'rejected' || order.status === 'cancelled';
  const timelineStatuses = isRejectedOrCancelled
    ? [...STATUS_ORDER.slice(0, 2), order.status]
    : STATUS_ORDER;

  const currentIdx = timelineStatuses.indexOf(order.status);

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-100 px-4 pt-10 pb-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-600 flex items-center gap-1 text-sm mb-3">
          <ArrowLeft size={16} /> Pedidos
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Pedido {order.shortId}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} size="md" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Client + status description */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-0.5">Cliente</p>
          <p className="font-semibold text-gray-900">{order.clientName}</p>
          <p className="text-xs text-gray-500 mt-0.5">RUC {order.clientRuc}</p>
          {order.sapOrderNumber && (
            <div className="flex items-center gap-2 mt-3 p-2.5 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500">SAP #</span>
              <span className="text-sm font-mono font-semibold text-gray-800 flex-1">{order.sapOrderNumber}</span>
              <button onClick={copySap} className="text-gray-400 hover:text-gray-600">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>

        {/* Status description */}
        {order.status === 'rejected' && order.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-red-700 mb-1">Motivo de rechazo</p>
            <p className="text-sm text-red-600">{order.rejectionReason}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Estado del pedido</p>
          <div className="space-y-0">
            {timelineStatuses.map((s, idx) => {
              const past = currentIdx > idx;
              const current = currentIdx === idx;
              const meta = getStatusMeta(s);
              const historyEntry = order.statusHistory.find((h) => h.status === s);
              return (
                <div key={s} className="flex gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      current ? `${meta.bg} ${meta.color}` : past ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-300'
                    }`}>
                      {past ? <Check size={14} /> : <span className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    {idx < timelineStatuses.length - 1 && (
                      <div className={`w-0.5 flex-1 min-h-[20px] ${past ? 'bg-green-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-medium ${current ? meta.color : past ? 'text-gray-700' : 'text-gray-300'}`}>
                      {meta.label}
                    </p>
                    {historyEntry && (
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(historyEntry.timestamp)}</p>
                    )}
                    {historyEntry?.note && (
                      <p className="text-xs text-gray-500 mt-0.5">{historyEntry.note}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Productos</p>
          </div>
          {order.items.map((item) => (
            <div key={item.productSku} className="px-4 py-3 flex items-center border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                <p className="text-xs text-gray-500">{item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
          <div className="px-4 py-3 bg-gray-50 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span><span>{formatCurrency(order.subtotalWithoutIgv)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>IGV</span><span>{formatCurrency(order.igv)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
              <span>Total</span><span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Signature */}
        {order.signerName && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Firma del cliente</p>
            {order.signatureDataUrl && (
              <img src={order.signatureDataUrl} alt="Firma" className="w-full max-h-32 object-contain border border-gray-200 rounded-lg mb-2" />
            )}
            <p className="text-sm text-gray-700">Firmado por: <strong>{order.signerName}</strong></p>
          </div>
        )}

        {order.notes && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notas</p>
            <p className="text-sm text-gray-700">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
