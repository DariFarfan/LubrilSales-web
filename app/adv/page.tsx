'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, AlertTriangle, Package, CheckCircle, XCircle, Truck, Clock, RefreshCw } from 'lucide-react';
import { useStore } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDateTime, isActiveStatus } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';

type Filter = 'todos' | 'synced' | 'validated' | 'in_sap' | 'dispatched' | 'delivered' | 'rejected';

export default function AdvDashboard() {
  const { state, reload } = useStore();
  const [filter, setFilter] = useState<Filter>('todos');
  const [query, setQuery] = useState('');

  const filtered = state.orders.filter((o) => {
    const matchesFilter = filter === 'todos' ? true : o.status === filter;
    const matchesQuery = query
      ? o.shortId.toLowerCase().includes(query.toLowerCase()) ||
        o.clientName.toLowerCase().includes(query.toLowerCase()) ||
        o.advisorName.toLowerCase().includes(query.toLowerCase())
      : true;
    return matchesFilter && matchesQuery;
  });

  const counts = {
    synced: state.orders.filter((o) => o.status === 'synced').length,
    active: state.orders.filter((o) => isActiveStatus(o.status)).length,
    rejected: state.orders.filter((o) => o.status === 'rejected').length,
    delivered: state.orders.filter((o) => o.status === 'delivered').length,
  };

  const filters: { key: Filter; label: string; icon: React.ReactNode }[] = [
    { key: 'todos', label: 'Todos', icon: <Package size={13} /> },
    { key: 'synced', label: 'Pendientes', icon: <Clock size={13} /> },
    { key: 'validated', label: 'Validados', icon: <CheckCircle size={13} /> },
    { key: 'in_sap', label: 'En SAP', icon: <Package size={13} /> },
    { key: 'dispatched', label: 'En camino', icon: <Truck size={13} /> },
    { key: 'delivered', label: 'Entregados', icon: <CheckCircle size={13} /> },
    { key: 'rejected', label: 'Rechazados', icon: <XCircle size={13} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <button onClick={() => reload()} disabled={state.isLoading} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-50 transition-colors">
            <RefreshCw size={15} className={state.isLoading ? 'animate-spin' : ''} />
            Refrescar
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">Gestiona y valida los pedidos de los asesores</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Clock size={20} className="text-blue-500" />} label="Pendientes" value={counts.synced} bg="bg-blue-50" />
        <StatCard icon={<Package size={20} className="text-cyan-500" />} label="En proceso" value={counts.active} bg="bg-cyan-50" />
        <StatCard icon={<CheckCircle size={20} className="text-green-500" />} label="Entregados" value={counts.delivered} bg="bg-green-50" />
        <StatCard icon={<XCircle size={20} className="text-red-500" />} label="Rechazados" value={counts.rejected} bg="bg-red-50" />
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pedido, cliente o asesor..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f.key
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300'
              }`}
            >
              {f.icon}{f.label}
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-gray-800 text-xs">{order.shortId}</span>
                      {order.hasStockWarning && <AlertTriangle size={12} className="text-amber-500" />}
                      {order.status === 'synced' && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                    </div>
                  </td>
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
                      href={`/adv/pedidos/${order.id}`}
                      className="text-xs font-medium text-red-600 hover:text-red-800 whitespace-nowrap"
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

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
