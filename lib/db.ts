import { supabase } from './supabase';
import type { Order, Client, Product, Notification, OrderStatus } from './types';

export const ADVISOR_UUID = '00000000-0000-0000-0000-000000000007';

// ─── DB row types ────────────────────────────────────────────

type DBOrder = {
  id: string;
  short_id: string;
  client_id: string;
  advisor_id: string;
  status: OrderStatus;
  subtotal_without_igv: number;
  igv: number;
  total: number;
  signature_url: string | null;
  signer_name: string | null;
  sap_order_number: string | null;
  rejection_reason: string | null;
  notes: string | null;
  has_stock_warning: boolean;
  created_at: string;
  updated_at: string;
  client: { id: string; name: string; ruc: string } | null;
  advisor: { id: string; name: string } | null;
  order_items: DBItem[];
  order_status_history: DBHistory[];
};

type DBItem = {
  id: string;
  order_id: string;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  sort_order: number;
};

type DBHistory = {
  id: string;
  order_id: string;
  status: OrderStatus;
  label: string;
  note: string | null;
  created_at: string;
};

type DBNotification = {
  id: string;
  advisor_id: string;
  order_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  orders: { short_id: string } | null;
};

// ─── Mappers ─────────────────────────────────────────────────

function mapOrder(row: DBOrder): Order {
  return {
    id: row.id,
    shortId: row.short_id,
    clientId: row.client_id,
    clientName: row.client?.name ?? '',
    clientRuc: row.client?.ruc ?? '',
    advisorId: row.advisor_id,
    advisorName: row.advisor?.name ?? '',
    items: (row.order_items ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({
        productSku: i.product_sku,
        productName: i.product_name,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: Number(i.unit_price),
        subtotal: Number(i.subtotal),
      })),
    subtotalWithoutIgv: Number(row.subtotal_without_igv),
    igv: Number(row.igv),
    total: Number(row.total),
    status: row.status,
    statusHistory: (row.order_status_history ?? [])
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((h) => ({
        status: h.status,
        label: h.label,
        timestamp: h.created_at,
        note: h.note ?? undefined,
      })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    signatureDataUrl: row.signature_url ?? undefined,
    signerName: row.signer_name ?? undefined,
    sapOrderNumber: row.sap_order_number ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    notes: row.notes ?? undefined,
    hasStockWarning: row.has_stock_warning,
  };
}

// ─── Queries ─────────────────────────────────────────────────

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    ruc: c.ruc,
    address: c.address,
    email: c.email ?? '',
    phone: c.phone ?? '',
    zone: c.zone,
    lastOrderDate: c.last_order_date ?? undefined,
  }));
}

export async function insertClient(data: Omit<Client, 'id' | 'lastOrderDate'>): Promise<Client> {
  const { data: row, error } = await supabase
    .from('clients')
    .insert({ name: data.name, ruc: data.ruc, address: data.address, email: data.email || null, phone: data.phone || null, zone: data.zone })
    .select()
    .single();
  if (error) throw error;
  return { id: row.id, name: row.name, ruc: row.ruc, address: row.address, email: row.email ?? '', phone: row.phone ?? '', zone: row.zone };
}

export async function updateClient(id: string, data: Partial<Omit<Client, 'id' | 'lastOrderDate'>>): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({ name: data.name, ruc: data.ruc, address: data.address, email: data.email || null, phone: data.phone || null, zone: data.zone })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').update({ active: false }).eq('id', id);
  if (error) throw error;
}

export async function getCatalog(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('brand')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((p) => ({
    sku: p.sku,
    name: p.name,
    brand: p.brand,
    category: p.category,
    unit: p.unit,
    unitPriceWithIgv: Number(p.unit_price_with_igv),
    stock: p.stock,
  }));
}

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      client:clients(id, name, ruc),
      advisor:advisors(id, name),
      order_items(*),
      order_status_history(*)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as DBOrder[]) ?? []).map(mapOrder);
}

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, orders(short_id)')
    .eq('advisor_id', ADVISOR_UUID)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as DBNotification[]) ?? []).map((n) => ({
    id: n.id,
    orderId: n.order_id,
    orderShortId: n.orders?.short_id ?? '',
    title: n.title,
    body: n.body,
    timestamp: n.created_at,
    read: n.read,
    type: n.type as Notification['type'],
  }));
}

// ─── Mutations ───────────────────────────────────────────────

export async function insertOrder(order: Order): Promise<void> {
  const { error: orderErr } = await supabase.from('orders').insert({
    id: order.id,
    short_id: order.shortId,
    client_id: order.clientId,
    advisor_id: ADVISOR_UUID,
    status: 'pending_sync',
    subtotal_without_igv: order.subtotalWithoutIgv,
    igv: order.igv,
    total: order.total,
    signature_url: order.signatureDataUrl ?? null,
    signer_name: order.signerName ?? null,
    notes: order.notes ?? null,
    has_stock_warning: order.hasStockWarning ?? false,
  });
  if (orderErr) throw orderErr;

  if (order.items.length > 0) {
    const { error: itemsErr } = await supabase.from('order_items').insert(
      order.items.map((item, idx) => ({
        order_id: order.id,
        product_sku: item.productSku,
        product_name: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        sort_order: idx,
      }))
    );
    if (itemsErr) throw itemsErr;
  }

  const { error: histErr } = await supabase.from('order_status_history').insert({
    order_id: order.id,
    status: 'pending_sync',
    label: 'Pendiente de sync',
  });
  if (histErr) throw histErr;
}

export async function pushStatus(
  orderId: string,
  status: OrderStatus,
  label: string,
  note?: string,
  extra?: { sap_order_number?: string; rejection_reason?: string }
): Promise<void> {
  const { error: updateErr } = await supabase
    .from('orders')
    .update({ status, ...(extra ?? {}) })
    .eq('id', orderId);
  if (updateErr) throw updateErr;

  const { error: histErr } = await supabase.from('order_status_history').insert({
    order_id: orderId,
    status,
    label,
    note: note ?? null,
  });
  if (histErr) throw histErr;
}

export async function insertNotification(
  orderId: string,
  type: Notification['type'],
  title: string,
  body: string
): Promise<void> {
  await supabase.from('notifications').insert({
    advisor_id: ADVISOR_UUID,
    order_id: orderId,
    type,
    title,
    body,
  });
}

export async function setNotificationRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function setAllNotificationsRead(): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('advisor_id', ADVISOR_UUID)
    .eq('read', false);
}
