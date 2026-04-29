'use client';

import Link from 'next/link';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order } from '@/lib/types';

interface Props {
  order: Order;
  href: string;
}

export default function OrderCard({ order, href }: Props) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-red-200 hover:shadow-md transition-all active:scale-[0.99]"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-gray-900">{order.shortId}</span>
          {order.hasStockWarning && (
            <AlertTriangle size={12} className="text-amber-500" />
          )}
        </div>
        <p className="text-sm text-gray-700 truncate font-medium">{order.clientName}</p>
        <div className="flex items-center justify-between mt-2">
          <StatusBadge status={order.status} />
          <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)} · {order.items.length} producto{order.items.length !== 1 ? 's' : ''}</p>
      </div>
      <ChevronRight size={16} className="text-gray-400 shrink-0" />
    </Link>
  );
}
