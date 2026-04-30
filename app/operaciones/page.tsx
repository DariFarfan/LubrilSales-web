'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Package, Truck, CheckCircle, RefreshCw } from 'lucide-react';
import { useStore } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

type Filter = 'todos' | 'in_sap' | 'dispatched' | 'delivered';

export default function OperacionesDashboard() {
  const { state, reload } = useStore();
  const [filter, setFilter] = useState<Filter>('todos');
  const [query, setQuery] = useState('');

  const relevant = state.orders.filter((o) =>
    ['in_sap', 'dispatched', 'delivered'].includes(o.status)
  );

  const filtered = relevant.filter((o) => {
    const matchesFilter = filter === 'todos' ? true : o.status === filter;
    const matchesQuery = query
      ? o.shortId.toLowerCase().includes(query.toLowerCase()) ||
        o.clientName.toLowerCase().includes(query.toLowerCase()) ||
        o.advisorName.toLowerCase().includes(query.toLowerCase())
      : true;
    return matchesFilter && matchesQuery;
  });

  const counts = {
    in_sap: relevant.filter((o) => o.status === 'in_sap').length,
    dispatched: relevant.filter((o) => o.status === 'dispatched').length,
    delivered: relevant.filter((o) => o.status === 'delivered').length,
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'in_sap', label: 'En preparación' },
    { key: 'dispatched', label: 'En camino' },
    { key: 'delivered', label: 'Entregados' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Despacho y Entrega</h1>
          <button
            onClick={() => reload()}
            disabled={state.isLoading}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={15} className={state.isLoading ? 'animate-spin' : ''} />
            Refrescar
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">Gestiona los pedidos listos para despachar y confirma entregas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-cyan-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1"><Package size={20} className="text-cyan-500" /><span className="text-xs text-gray-500">En preparación</span></div>
          <p className="text-2xl font-bold text-gray-900">{counts.in_sap}</p>
        </div>
        <div className="bg-orange-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1"><Truck size={20} className="text-orange-500" /><span className="text-xs text-gray-500">En camino</span></div>
          <p className="text-2xl font-bold text-gray-900">{counts.dispatched}</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1"><CheckCircle size={20} className="text-green-500" /><span className="text-xs text-gray-500">Entregados</span></div>
          <p className="text-2xl font-bold text-gray-900">{counts.delivered}</p>
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pedido, cliente o asesor..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">Asesor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">Fecha</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800 text-xs">{order.shortId}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.clientName}</p>
                    <p className="text-xs text-gray-400">{order.items.length} producto{order.items.length !== 1 ? 's' : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{order.advisorName}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/operaciones/pedidos/${order.id}`}
                      className="text-xs font-medium text-orange-600 hover:text-orange-800 whitespace-nowrap"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Package size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin pedidos en esta categoría</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
