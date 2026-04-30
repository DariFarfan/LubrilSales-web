import Link from 'next/link';
import { Droplets } from 'lucide-react';

export default function AdvLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/adv" className="flex items-center gap-2">
            <Droplets size={20} className="text-red-600" />
            <span className="font-bold text-gray-900">LubriSales</span>
            <span className="text-xs text-gray-400 font-normal">/ Panel ADV</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800">Rosa Mendoza</p>
              <p className="text-xs text-gray-400">Área Administrativa de Ventas</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-blue-700">RM</span>
            </div>
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Salir
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
