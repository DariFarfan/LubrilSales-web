'use client';

import { useState } from 'react';
import { Search, Package } from 'lucide-react';
import { useStore } from '@/lib/store';
import OrderCard from '@/components/OrderCard';
import { isActiveStatus } from '@/lib/utils';

type Tab = 'activos' | 'entregados' | 'todos';

export default function OrdersPage() {
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>('activos');
  const [query, setQuery] = useState('');

  const filtered = state.orders.filter((o) => {
    const matchesTab =
      tab === 'todos' ? true :
      tab === 'activos' ? isActiveStatus(o.status) :
      o.status === 'delivered';
    const matchesQuery = query
      ? o.shortId.toLowerCase().includes(query.toLowerCase()) ||
        o.clientName.toLowerCase().includes(query.toLowerCase())
      : true;
    return matchesTab && matchesQuery;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'activos', label: 'Activos' },
    { key: 'entregados', label: 'Entregados' },
    { key: 'todos', label: 'Todos' },
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 pt-10 pb-0">
        <h1 className="text-lg font-bold text-gray-900 mb-3">Mis pedidos</h1>
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pedido o cliente..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white transition"
          />
        </div>
        <div className="flex gap-0 border-b border-gray-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                tab === t.key
                  ? 'text-red-600 border-red-600'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        {filtered.map((order) => (
          <OrderCard key={order.id} order={order} href={`/asesor/pedidos/${order.id}`} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Package size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Sin pedidos en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
}
