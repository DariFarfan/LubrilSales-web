'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Truck, Package, CheckCircle, RotateCcw, LogOut, Droplets, RefreshCw } from 'lucide-react';
import { useStore } from '@/lib/store';
import OrderCard from '@/components/OrderCard';
import { isActiveStatus } from '@/lib/utils';

export default function AdvisorHome() {
  const { state, logout, reload } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!state.isAuthenticated) router.replace('/asesor/login');
  }, [state.isAuthenticated, router]);

  if (!state.isAuthenticated) return null;

  const active = state.orders.filter((o) => isActiveStatus(o.status));
  const delivered = state.orders.filter((o) => o.status === 'delivered').slice(0, 3);

  const counts = {
    dispatched: state.orders.filter((o) => o.status === 'dispatched').length,
    in_sap: state.orders.filter((o) => o.status === 'in_sap').length,
    synced: state.orders.filter((o) => o.status === 'synced').length,
  };

  function handleLogout() {
    logout();
    router.replace('/');
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-red-600 px-4 pt-10 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Droplets size={20} className="text-white" />
            <span className="text-white font-bold text-base">LubriSales</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => reload()} disabled={state.isLoading} className="text-red-200 p-1 disabled:opacity-50">
              <RefreshCw size={18} className={state.isLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleLogout} className="text-red-200 p-1">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <p className="text-red-200 text-xs">Buenos días,</p>
        <h1 className="text-white text-xl font-bold">{state.currentAdvisor?.name}</h1>
        <p className="text-red-200 text-xs mt-0.5">{state.currentAdvisor?.zone}</p>
      </div>

      {/* Status chips */}
      <div className="px-4 -mt-3">
        <div className="bg-white rounded-2xl shadow-sm p-4 flex gap-2 overflow-x-auto">
          <Chip icon={<Truck size={14} />} label="En camino" count={counts.dispatched} color="text-orange-600 bg-orange-50" />
          <Chip icon={<Package size={14} />} label="En preparac." count={counts.in_sap} color="text-cyan-600 bg-cyan-50" />
          <Chip icon={<RotateCcw size={14} />} label="Recibidos" count={counts.synced} color="text-blue-600 bg-blue-50" />
          <Chip icon={<CheckCircle size={14} />} label="Entregados" count={state.orders.filter(o => o.status === 'delivered').length} color="text-green-600 bg-green-50" />
        </div>
      </div>

      <div className="px-4 mt-5 space-y-6">
        {/* Active orders */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">Pedidos activos</h2>
            <Link href="/asesor/pedidos" className="text-red-600 text-xs font-medium">Ver todos</Link>
          </div>
          {active.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-gray-400 text-sm border border-gray-100">
              No hay pedidos activos
            </div>
          ) : (
            <div className="space-y-2">
              {active.slice(0, 5).map((order) => (
                <OrderCard key={order.id} order={order} href={`/asesor/pedidos/${order.id}`} />
              ))}
            </div>
          )}
        </section>

        {/* Recent deliveries */}
        {delivered.length > 0 && (
          <section>
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Últimas entregas</h2>
            <div className="space-y-2">
              {delivered.map((order) => (
                <OrderCard key={order.id} order={order} href={`/asesor/pedidos/${order.id}`} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/asesor/pedidos/nuevo"
        className="fixed bottom-20 right-4 w-14 h-14 bg-red-600 rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition-colors active:scale-95 z-40"
      >
        <Plus size={26} className="text-white" />
      </Link>
    </div>
  );
}

function Chip({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0 ${color}`}>
      {icon}
      <span className="text-xs font-medium whitespace-nowrap">{label}: <strong>{count}</strong></span>
    </div>
  );
}
