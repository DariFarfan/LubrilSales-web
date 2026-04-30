import Link from 'next/link';
import { Truck } from 'lucide-react';

export default function OperacionesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/operaciones" className="flex items-center gap-2">
            <Truck size={20} className="text-orange-600" />
            <span className="font-bold text-gray-900">LubriSales</span>
            <span className="text-xs text-gray-400 font-normal">/ Despacho y Entrega</span>
          </Link>
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Salir
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
