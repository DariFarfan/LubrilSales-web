import type { OrderStatus } from './types';

export function formatCurrency(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

export interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  dot: string;
}

const STATUS_META: Record<OrderStatus, StatusMeta> = {
  draft:          { label: 'Borrador',           color: 'text-gray-600',   bg: 'bg-gray-100',   dot: 'bg-gray-400'   },
  pending_sync:   { label: 'Sincronizando...',   color: 'text-amber-700',  bg: 'bg-amber-50',   dot: 'bg-amber-400'  },
  synced:         { label: 'Recibido',           color: 'text-blue-700',   bg: 'bg-blue-50',    dot: 'bg-blue-500'   },
  validated:      { label: 'Validado',           color: 'text-indigo-700', bg: 'bg-indigo-50',  dot: 'bg-indigo-500' },
  processing_sap: { label: 'Procesando SAP',     color: 'text-purple-700', bg: 'bg-purple-50',  dot: 'bg-purple-500' },
  in_sap:         { label: 'En preparación',     color: 'text-cyan-700',   bg: 'bg-cyan-50',    dot: 'bg-cyan-500'   },
  dispatched:     { label: 'En camino',          color: 'text-orange-700', bg: 'bg-orange-50',  dot: 'bg-orange-500' },
  delivered:      { label: 'Entregado',          color: 'text-green-700',  bg: 'bg-green-50',   dot: 'bg-green-500'  },
  rejected:       { label: 'Rechazado',          color: 'text-red-700',    bg: 'bg-red-50',     dot: 'bg-red-500'    },
  cancelled:      { label: 'Cancelado',          color: 'text-gray-700',   bg: 'bg-gray-100',   dot: 'bg-gray-500'   },
};

export function getStatusMeta(status: OrderStatus): StatusMeta {
  return STATUS_META[status] ?? STATUS_META.draft;
}

export function isActiveStatus(status: OrderStatus): boolean {
  return ['pending_sync', 'synced', 'validated', 'processing_sap', 'in_sap', 'dispatched'].includes(status);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function calcOrderTotals(items: { unitPrice: number; quantity: number }[]) {
  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const subtotalWithoutIgv = total / 1.18;
  const igv = total - subtotalWithoutIgv;
  return {
    subtotalWithoutIgv: Math.round(subtotalWithoutIgv * 100) / 100,
    igv: Math.round(igv * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
