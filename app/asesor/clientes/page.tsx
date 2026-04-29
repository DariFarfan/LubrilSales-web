'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Phone, Plus, Building2 } from 'lucide-react';
import { MOCK_CLIENTS } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';

export default function ClientsPage() {
  const [query, setQuery] = useState('');
  const filtered = MOCK_CLIENTS.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.ruc.includes(query)
  );

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 pt-10 pb-3">
        <h1 className="text-lg font-bold text-gray-900 mb-3">Mis clientes</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o RUC..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white transition"
          />
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        {filtered.map((client) => (
          <div key={client.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">RUC {client.ruc}</p>
                <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                  <MapPin size={11} />
                  <span className="truncate">{client.address}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                  <Phone size={11} />
                  <span>{client.phone}</span>
                </div>
                {client.lastOrderDate && (
                  <p className="text-xs text-gray-400 mt-1.5">Último pedido: {formatDate(client.lastOrderDate)}</p>
                )}
              </div>
              <Link
                href={`/asesor/pedidos/nuevo?clientId=${client.id}`}
                className="shrink-0 w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center hover:bg-red-700 transition-colors active:scale-95"
              >
                <Plus size={18} className="text-white" />
              </Link>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Building2 size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Sin resultados para &quot;{query}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}
