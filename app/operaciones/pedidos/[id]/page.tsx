'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Truck, CheckCircle, Package, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDateTime, getStatusMeta } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';

const TIMELINE: OrderStatus[] = ['synced', 'validated', 'processing_sap', 'in_sap', 'dispatched', 'delivered'];

export default function OperacionesOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, markDispatched, markDelivered } = useStore();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const order = state.orders.find((o) => o.id === id);
  if (!order) return (
    <div className="text-center py-20 text-gray-400">
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
  const timelineStatuses = isRejectedOrCancelled ? [...TIMELINE.slice(0, 2), order.status] : TIMELINE;
  const currentIdx = timelineStatuses.indexOf(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pedido {order.shortId}</h1>
            <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <StatusBadge status={order.status} size="md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Client + advisor */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Cliente</p>
                <p className="font-semibold text-gray-900">{order.clientName}</p>
                <p className="text-xs text-gray-500 mt-0.5">RUC {order.clientRuc}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Asesor</p>
                <p className="font-semibold text-gray-900">{order.advisorName}</p>
              </div>
            </div>
            {order.sapOrderNumber && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500">SAP Nro.</span>
                <span className="font-mono font-semibold text-gray-800 flex-1">{order.sapOrderNumber}</span>
                <button onClick={copySap} className="text-gray-400 hover:text-gray-600">
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </div>

          {/* Products */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="font-semibold text-gray-800">Productos</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">Producto</th>
                  <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Cant.</th>
                  <th className="text-right px-5 py-2.5 font-medium text-gray-500 text-xs">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items.map((item) => (
                  <tr key={item.productSku}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-400">{item.productSku}</p>
                    </td>
                    <td className="text-center px-4 py-3 text-gray-700">{item.quantity} {item.unit}</td>
                    <td className="text-right px-5 py-3 font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-100">
                <tr className="border-t border-gray-100">
                  <td colSpan={2} className="px-5 py-3 text-right font-bold text-gray-900">Total</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900 text-base">{formatCurrency(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Actions */}
          {order.status === 'in_sap' && (
            <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-3">
              <p className="font-semibold text-gray-800">Acciones</p>
              <p className="text-xs text-gray-500">El pedido está listo en SAP. Márca como despachado cuando salga del almacén.</p>
              <button
                onClick={() => markDispatched(order.id)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Truck size={16} /> Marcar en camino
              </button>
            </div>
          )}

          {order.status === 'dispatched' && (
            <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-3">
              <p className="font-semibold text-gray-800">Acciones</p>
              <p className="text-xs text-gray-500">El pedido está en camino. Confirma cuando el cliente lo haya recibido.</p>
              <button
                onClick={() => markDelivered(order.id)}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle size={16} /> Confirmar entrega
              </button>
            </div>
          )}

          {order.status === 'delivered' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <p className="text-sm font-medium text-green-700">Pedido entregado</p>
              <p className="text-xs text-green-600 mt-0.5">Este pedido ya fue confirmado como entregado.</p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <p className="font-semibold text-gray-800 mb-4">Historial</p>
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
                        current ? `${meta.bg} border-2 border-current ${meta.color}` : past ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-300'
                      }`}>
                        {past ? <Check size={13} /> : <span className="w-2 h-2 rounded-full bg-current" />}
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
        </div>
      </div>
    </div>
  );
}
