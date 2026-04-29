'use client';

import Link from 'next/link';
import { Smartphone, Monitor, Droplets } from 'lucide-react';

export default function RoleSelector() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-700 to-red-900 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Droplets size={32} className="text-white" />
          <span className="text-white text-3xl font-bold tracking-tight">LubriSales</span>
        </div>
        <p className="text-red-200 text-sm">Sistema de Gestión de Pedidos · Soltrak</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <Link
          href="/asesor/login"
          className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] group"
        >
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
            <Smartphone size={24} className="text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Asesor Comercial</p>
            <p className="text-sm text-gray-500">Registra pedidos desde el campo</p>
          </div>
          <span className="text-gray-400 text-lg">›</span>
        </Link>

        <Link
          href="/adv"
          className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] group"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Monitor size={24} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Panel ADV</p>
            <p className="text-sm text-gray-500">Valida pedidos y gestiona el flujo</p>
          </div>
          <span className="text-gray-400 text-lg">›</span>
        </Link>
      </div>

      <p className="text-red-300 text-xs mt-12 text-center">
        Chevron / Soltrak · UTEC Grupo 3 · Demo sin backend
      </p>
    </div>
  );
}
