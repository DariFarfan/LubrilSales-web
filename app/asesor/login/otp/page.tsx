'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function OtpPage() {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(59);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { state, login } = useStore();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleChange(idx: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[idx] = val.slice(-1);
    setDigits(next);
    setError('');
    if (val && idx < 5) refs.current[idx + 1]?.focus();
    if (next.every((d) => d !== '') && next.join('').length === 6) {
      verify(next.join(''));
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  }

  function verify(code: string) {
    if (code !== '123456') {
      setError('Código incorrecto. Intenta de nuevo.');
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
      return;
    }
    setLoading(true);
    setTimeout(() => {
      login(state.loginEmail || 'carlos.quispe@soltrak.com');
      router.push('/asesor');
    }, 800);
  }

  const code = digits.join('');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-red-600 px-6 pt-12 pb-8">
        <button onClick={() => router.back()} className="text-red-200 flex items-center gap-1 mb-4 -ml-1">
          <ArrowLeft size={18} /> Atrás
        </button>
        <h1 className="text-white text-2xl font-bold">Verificar código</h1>
        <p className="text-red-200 text-sm mt-1">
          Enviamos un código a <span className="text-white">{state.loginEmail || 'tu correo'}</span>
        </p>
      </div>

      <div className="flex-1 px-6 pt-8">
        <div className="flex gap-2 mb-6 justify-center">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition ${
                error ? 'border-red-400 bg-red-50' : d ? 'border-red-500 bg-red-50' : 'border-gray-300'
              } focus:border-red-500`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-red-500 text-sm mb-4">{error}</p>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
            <CheckCircle size={20} />
            <span className="font-medium">Verificado</span>
          </div>
        )}

        <button
          disabled={loading || code.length < 6}
          onClick={() => verify(code)}
          className="w-full bg-red-600 disabled:bg-gray-300 text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Verificar'}
        </button>

        <div className="mt-5 text-center">
          {countdown > 0 ? (
            <p className="text-gray-500 text-sm">Reenviar código en {countdown}s</p>
          ) : (
            <button
              className="text-red-600 text-sm font-medium"
              onClick={() => {
                setCountdown(59);
                fetch('/api/send-otp', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: state.loginEmail }),
                }).catch(() => {});
              }}
            >
              Reenviar código
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
