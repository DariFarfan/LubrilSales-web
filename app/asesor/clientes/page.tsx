'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Plus, Building2, Loader2, Pencil, Trash2, X, Check } from 'lucide-react';
import { getClients, insertClient, updateClient, deleteClient } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import type { Client } from '@/lib/types';

type FormData = { name: string; ruc: string; address: string; zone: string; email: string; phone: string };
const EMPTY_FORM: FormData = { name: '', ruc: '', address: '', zone: '', email: '', phone: '' };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Modal state
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try { setClients(await getClients()); } catch {}
    setLoading(false);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError('');
    setEditing(null);
    setModal('create');
  }

  function openEdit(client: Client) {
    setForm({ name: client.name, ruc: client.ruc, address: client.address, zone: client.zone, email: client.email, phone: client.phone });
    setFormError('');
    setEditing(client);
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditing(null);
    setFormError('');
  }

  async function handleSave() {
    if (!form.name.trim() || !form.ruc.trim() || !form.address.trim() || !form.zone.trim()) {
      setFormError('Nombre, RUC, dirección y zona son obligatorios.');
      return;
    }
    if (!/^\d{11}$/.test(form.ruc.trim())) {
      setFormError('El RUC debe tener exactamente 11 dígitos.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (modal === 'create') {
        const created = await insertClient(form);
        setClients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      } else if (editing) {
        await updateClient(editing.id, form);
        setClients((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...form } : c));
      }
      closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setFormError(msg.includes('unique') || msg.includes('duplicate') ? 'Ya existe un cliente con ese RUC.' : 'Error al guardar. Intenta de nuevo.');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClient(deleteTarget.id);
      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setDeleteTarget(null);
    }
    setDeleting(false);
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) || c.ruc.includes(query)
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 pt-10 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-900">Mis clientes</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-red-700 active:scale-95 transition-all"
          >
            <Plus size={14} /> Nuevo
          </button>
        </div>
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

      {/* List */}
      <div className="px-4 py-3 space-y-2">
        {loading && (
          <div className="flex justify-center py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        )}

        {!loading && filtered.map((client) => (
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
                {client.phone && (
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                    <Phone size={11} />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.lastOrderDate && (
                  <p className="text-xs text-gray-400 mt-1.5">Último pedido: {formatDate(client.lastOrderDate)}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => openEdit(client)}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Pencil size={13} className="text-gray-500" />
                </button>
                <button
                  onClick={() => setDeleteTarget(client)}
                  className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={13} className="text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Building2 size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">{query ? `Sin resultados para "${query}"` : 'Sin clientes registrados'}</p>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-base">
                {modal === 'create' ? 'Nuevo cliente' : 'Editar cliente'}
              </h2>
              <button onClick={closeModal} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Nombre *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Lubricentro El Rápido" />
              <Field label="RUC *" value={form.ruc} onChange={(v) => setForm({ ...form, ruc: v })} placeholder="20123456789" maxLength={11} inputMode="numeric" />
              <Field label="Dirección *" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Av. Principal 123, Lima" />
              <Field label="Zona *" value={form.zone} onChange={(v) => setForm({ ...form, zone: v })} placeholder="Lima Norte" />
              <Field label="Correo" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="contacto@lubricentro.com" type="email" />
              <Field label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="987654321" inputMode="tel" />
            </div>

            {formError && <p className="text-red-500 text-xs">{formError}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-red-600 disabled:bg-gray-300 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <><Check size={16} /> {modal === 'create' ? 'Crear cliente' : 'Guardar cambios'}</>}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-900 mb-1">¿Eliminar cliente?</h3>
              <p className="text-sm text-gray-500"><strong>{deleteTarget.name}</strong> ya no aparecerá en la lista. Sus pedidos existentes no se verán afectados.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 font-medium text-sm hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 disabled:bg-gray-300 text-white rounded-xl py-2.5 font-medium text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
              >
                {deleting ? <Loader2 size={15} className="animate-spin" /> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', maxLength, inputMode }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; maxLength?: number; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition"
      />
    </div>
  );
}
