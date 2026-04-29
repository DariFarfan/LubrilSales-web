export type OrderStatus =
  | 'draft'
  | 'pending_sync'
  | 'synced'
  | 'validated'
  | 'processing_sap'
  | 'in_sap'
  | 'dispatched'
  | 'delivered'
  | 'rejected'
  | 'cancelled';

export interface Product {
  sku: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  unitPriceWithIgv: number;
  stock: number;
}

export interface Client {
  id: string;
  name: string;
  ruc: string;
  address: string;
  email: string;
  phone: string;
  lastOrderDate?: string;
  zone: string;
}

export interface OrderItem {
  productSku: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export interface StatusEntry {
  status: OrderStatus;
  label: string;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  shortId: string;
  clientId: string;
  clientName: string;
  clientRuc: string;
  advisorId: string;
  advisorName: string;
  items: OrderItem[];
  subtotalWithoutIgv: number;
  igv: number;
  total: number;
  status: OrderStatus;
  statusHistory: StatusEntry[];
  createdAt: string;
  updatedAt: string;
  signatureDataUrl?: string;
  signerName?: string;
  sapOrderNumber?: string;
  rejectionReason?: string;
  notes?: string;
  hasStockWarning?: boolean;
}

export interface Notification {
  id: string;
  orderId: string;
  orderShortId: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'synced' | 'validated' | 'rejected' | 'dispatched' | 'delivered';
}

export interface Advisor {
  id: string;
  name: string;
  email: string;
  zone: string;
}
