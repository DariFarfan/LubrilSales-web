'use client';

import Link from 'next/link';
import { Bell, CheckCheck, Truck, Package, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useStore } from '@/lib/store';
import { timeAgo } from '@/lib/utils';

const TYPE_ICONS = {
  synced: <RefreshCw size={16} className="text-blue-500" />,
  validated: <CheckCircle size={16} className="text-indigo-500" />,
  rejected: <XCircle size={16} className="text-red-500" />,
  dispatched: <Truck size={16} className="text-orange-500" />,
  delivered: <Package size={16} className="text-green-500" />,
};

const TYPE_BG = {
  synced: 'bg-blue-50',
  validated: 'bg-indigo-50',
  rejected: 'bg-red-50',
  dispatched: 'bg-orange-50',
  delivered: 'bg-green-50',
};

export default function NotificationsPage() {
  const { state, markNotificationRead, markAllRead } = useStore();
  const unread = state.notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 pt-10 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Notificaciones</h1>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-red-600 text-xs font-medium flex items-center gap-1">
              <CheckCheck size={14} /> Marcar todas
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {state.notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Bell size={32} className="mb-2 opacity-40" />
            <p className="text-sm">Sin notificaciones</p>
          </div>
        )}
        {state.notifications.map((n) => (
          <Link
            key={n.id}
            href={`/asesor/pedidos/${n.orderId}`}
            onClick={() => markNotificationRead(n.id)}
            className={`flex gap-3 px-4 py-4 transition-colors hover:bg-gray-50 ${n.read ? '' : 'bg-red-50/50'}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TYPE_BG[n.type]}`}>
              {TYPE_ICONS[n.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-medium ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                {!n.read && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0 mt-1.5" />}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>
              <p className="text-xs text-gray-400 mt-1">{timeAgo(n.timestamp)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
