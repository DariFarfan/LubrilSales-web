'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Droplets, ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setLoginEmail } = useStore();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Ingresa un correo válido');
      return;
    }
    setError('');
    setLoading(true);
    setLoginEmail(email);
    setTimeout(() => {
      setLoading(false);
      router.push('/asesor/login/otp');
    }, 900);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-red-600 px-6 pt-12 pb-8">
        <div className="flex items-center gap-2 mb-2">
          <Droplets size={22} className="text-white" />
          <span className="text-white text-lg font-bold">LubriSales</span>
        </div>
        <h1 className="text-white text-2xl font-bold mt-4">Bienvenido</h1>
        <p className="text-red-200 text-sm mt-1">Ingresa con tu correo corporativo</p>
      </div>

      <div className="flex-1 px-6 pt-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="tu.nombre@soltrak.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
            {error && <p className="text-red-500 text-sm mt-1.5">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-red-600 disabled:bg-gray-300 text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (
              <>Enviar código <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-xs text-amber-700 font-medium">Demo</p>
          <p className="text-xs text-amber-600 mt-0.5">Usa cualquier correo. El OTP es <strong>123456</strong>.</p>
        </div>
      </div>
    </div>
  );
}
