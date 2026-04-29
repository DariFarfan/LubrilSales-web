'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, Plus, Minus, AlertTriangle, Check, Loader2, Pen, Trash2 } from 'lucide-react';
import { getClients, getCatalog } from '@/lib/db';
import { useStore } from '@/lib/store';
import { formatCurrency, calcOrderTotals } from '@/lib/utils';
import type { Client, Product, OrderItem } from '@/lib/types';

type Step = 'client' | 'items' | 'review' | 'sign' | 'success';

interface CartItem extends OrderItem {
  stock: number;
}

function NewOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, createOrder } = useStore();

  const [clients, setClients] = useState<Client[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [step, setStep] = useState<Step>('client');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [clientQuery, setClientQuery] = useState('');
  const [catalogQuery, setCatalogQuery] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  // Load clients and catalog from Supabase
  useEffect(() => {
    Promise.all([getClients(), getCatalog()])
      .then(([c, p]) => { setClients(c); setCatalog(p); })
      .catch(console.error);
  }, []);

  // Pre-select client from query param
  useEffect(() => {
    if (clients.length === 0) return;
    const cid = searchParams.get('clientId');
    if (cid) {
      const client = clients.find((c) => c.id === cid);
      if (client) { setSelectedClient(client); setStep('items'); }
    }
  }, [searchParams, clients]);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientQuery.toLowerCase()) ||
    c.ruc.includes(clientQuery)
  );

  const filteredCatalog = catalog.filter((p) =>
    p.name.toLowerCase().includes(catalogQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(catalogQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(catalogQuery.toLowerCase())
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productSku === product.sku);
      if (existing) {
        return prev.map((i) =>
          i.productSku === product.sku
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      return [...prev, {
        productSku: product.sku,
        productName: product.name,
        quantity: 1,
        unit: product.unit,
        unitPrice: product.unitPriceWithIgv,
        subtotal: product.unitPriceWithIgv,
        stock: product.stock,
      }];
    });
  }

  function changeQty(sku: string, delta: number) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productSku !== sku) return i;
        const q = Math.max(1, i.quantity + delta);
        return { ...i, quantity: q, subtotal: q * i.unitPrice };
      })
    );
  }

  function removeItem(sku: string) {
    setCart((prev) => prev.filter((i) => i.productSku !== sku));
  }

  const totals = calcOrderTotals(cart.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })));
  const hasWarning = cart.some((i) => i.quantity > i.stock);

  // Canvas signature
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawing.current = true;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function endDraw() {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureData(canvas.toDataURL());
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  }

  function handleSubmit() {
    if (!selectedClient) return;
    setSubmitting(true);
    const items = cart.map(({ stock: _, ...item }) => item);
    const id = createOrder({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientRuc: selectedClient.ruc,
      advisorId: state.currentAdvisor?.id ?? 'adv-007',
      advisorName: state.currentAdvisor?.name ?? 'Carlos Quispe',
      items,
      ...totals,
      signatureDataUrl: signatureData,
      signerName,
      notes,
      hasStockWarning: hasWarning,
    });
    setCreatedOrderId(id);
    setTimeout(() => { setSubmitting(false); setStep('success'); }, 1000);
  }

  const backLabel: Record<Step, string> = {
    client: 'Cancelar',
    items: 'Cliente',
    review: 'Productos',
    sign: 'Revisar',
    success: '',
  };

  const stepNum: Record<Step, number> = { client: 1, items: 2, review: 3, sign: 4, success: 4 };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      {step !== 'success' && (
        <div className="bg-white border-b border-gray-100 px-4 pt-10 pb-3 sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => {
                if (step === 'client') router.back();
                else {
                  const steps: Step[] = ['client', 'items', 'review', 'sign'];
                  setStep(steps[steps.indexOf(step) - 1]);
                }
              }}
              className="text-gray-600 flex items-center gap-1 text-sm"
            >
              <ArrowLeft size={16} /> {backLabel[step]}
            </button>
          </div>
          <div className="flex gap-1.5">
            {(['client', 'items', 'review', 'sign'] as Step[]).map((s, idx) => (
              <div
                key={s}
                className={`h-1 rounded-full flex-1 transition-colors ${
                  stepNum[step] > idx ? 'bg-red-600' : stepNum[step] === idx + 1 ? 'bg-red-400' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step: Client */}
      {step === 'client' && (
        <div className="flex-1 p-4">
          <h2 className="font-bold text-gray-900 mb-4">Seleccionar cliente</h2>
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={clientQuery}
              onChange={(e) => setClientQuery(e.target.value)}
              placeholder="Buscar lubricentro..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div className="space-y-2">
            {filteredClients.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedClient(c); setStep('items'); }}
                className="w-full text-left bg-white rounded-xl p-4 border border-gray-100 hover:border-red-300 hover:shadow-sm transition-all active:scale-[0.99]"
              >
                <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.address}</p>
                <p className="text-xs text-gray-400 mt-0.5">RUC {c.ruc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Items */}
      {step === 'items' && (
        <div className="flex-1 flex flex-col">
          <div className="p-4 pb-2">
            <h2 className="font-bold text-gray-900">Agregar productos</h2>
            <p className="text-xs text-gray-500 mt-0.5">Cliente: {selectedClient?.name}</p>
            <div className="relative mt-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={catalogQuery}
                onChange={(e) => setCatalogQuery(e.target.value)}
                placeholder="Buscar SKU o producto..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-2">
            {filteredCatalog.map((p) => {
              const inCart = cart.find((i) => i.productSku === p.sku);
              return (
                <div key={p.sku} className="bg-white rounded-xl p-3.5 border border-gray-100 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.sku} · {p.unit}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold text-gray-800">{formatCurrency(p.unitPriceWithIgv)}</span>
                      {inCart && inCart.quantity > p.stock && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-600">
                          <AlertTriangle size={10} /> Stock: {p.stock}
                        </span>
                      )}
                    </div>
                  </div>
                  {inCart ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => inCart.quantity === 1 ? removeItem(p.sku) : changeQty(p.sku, -1)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 active:scale-90 transition-transform">
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{inCart.quantity}</span>
                      <button onClick={() => changeQty(p.sku, 1)}
                        className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white active:scale-90 transition-transform">
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(p)}
                      className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform shrink-0">
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {cart.length > 0 && (
            <div className="bg-white border-t border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{cart.length} producto{cart.length !== 1 ? 's' : ''}</span>
                <span className="font-bold text-gray-900">{formatCurrency(totals.total)}</span>
              </div>
              <button onClick={() => setStep('review')}
                className="w-full bg-red-600 text-white rounded-xl py-3 font-semibold text-sm transition-colors hover:bg-red-700">
                Revisar pedido →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="flex-1 p-4 space-y-4">
          <h2 className="font-bold text-gray-900">Revisar pedido</h2>

          <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</p>
            <p className="font-semibold text-gray-900">{selectedClient?.name}</p>
            <p className="text-xs text-gray-500">RUC {selectedClient?.ruc}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Productos</p>
            </div>
            {cart.map((item) => (
              <div key={item.productSku} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500">{item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}</p>
                  {item.quantity > item.stock && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                      <AlertTriangle size={10} /> Stock disponible: {item.stock}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                  <button onClick={() => removeItem(item.productSku)} className="text-red-400 mt-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal (sin IGV)</span>
              <span>{formatCurrency(totals.subtotalWithoutIgv)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>IGV 18%</span>
              <span>{formatCurrency(totals.igv)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Instrucciones especiales..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>

          {hasWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Algunos productos superan el stock disponible. El pedido se enviará igual y el ADV gestionará la diferencia.</p>
            </div>
          )}

          <button onClick={() => setStep('sign')}
            className="w-full bg-red-600 text-white rounded-xl py-3.5 font-semibold transition-colors hover:bg-red-700">
            Solicitar firma →
          </button>
        </div>
      )}

      {/* Step: Sign */}
      {step === 'sign' && (
        <div className="flex-1 p-4 space-y-4">
          <h2 className="font-bold text-gray-900">Firma del cliente</h2>
          <p className="text-sm text-gray-600">Pide al dueño del lubricentro que firme en la pantalla.</p>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-600">Área de firma</label>
              <button onClick={clearCanvas} className="text-xs text-gray-400 flex items-center gap-1">
                <Trash2 size={12} /> Limpiar
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={350}
              height={180}
              className="w-full bg-white border-2 border-dashed border-gray-300 rounded-xl touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            {!signatureData && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ position: 'relative', top: -90, opacity: 0.35 }}>
                <Pen size={20} className="text-gray-400" />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Nombre del firmante</label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Nombre completo..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-xs text-gray-500 text-center font-medium">Resumen del pedido</p>
            <p className="text-center font-bold text-gray-900 mt-1">{formatCurrency(totals.total)}</p>
            <p className="text-center text-xs text-gray-500">{cart.length} producto{cart.length !== 1 ? 's' : ''} · {selectedClient?.name}</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!signerName || submitting}
            className="w-full bg-red-600 disabled:bg-gray-300 text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : (
              <><Check size={18} /> Confirmar pedido</>
            )}
          </button>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
            <Check size={36} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Pedido confirmado!</h2>
          <p className="text-gray-500 text-sm mb-1">Tu pedido fue enviado y está siendo sincronizado.</p>
          <p className="text-gray-400 text-xs mb-8">El ADV lo recibirá en pocos segundos.</p>
          <div className="space-y-3 w-full">
            <button
              onClick={() => router.push(`/asesor/pedidos/${createdOrderId}`)}
              className="w-full bg-red-600 text-white rounded-xl py-3.5 font-semibold hover:bg-red-700 transition-colors"
            >
              Ver pedido
            </button>
            <button
              onClick={() => { setCart([]); setSelectedClient(null); setNotes(''); setSignerName(''); setSignatureData(''); setStep('client'); }}
              className="w-full bg-white text-gray-700 border border-gray-200 rounded-xl py-3.5 font-semibold hover:bg-gray-50 transition-colors"
            >
              Nuevo pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-400">Cargando...</div>}>
      <NewOrderContent />
    </Suspense>
  );
}
