import type { Client, Product, Order, Advisor } from './types';

export const MOCK_ADVISOR: Advisor = {
  id: 'adv-007',
  name: 'Carlos Quispe',
  email: 'carlos.quispe@soltrak.com',
  zone: 'Lima Norte',
};

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'cli-001',
    name: 'Los Pinos',
    ruc: '20456789012',
    address: 'Av. Los Pinos 432, Comas',
    email: 'lospinos@gmail.com',
    phone: '987 654 321',
    lastOrderDate: '2026-04-15',
    zone: 'Lima Norte',
  },
  {
    id: 'cli-002',
    name: 'El Rápido',
    ruc: '20567890123',
    address: 'Jr. Independencia 128, Los Olivos',
    email: 'elrapido.lubri@gmail.com',
    phone: '976 543 210',
    lastOrderDate: '2026-04-20',
    zone: 'Lima Norte',
  },
  {
    id: 'cli-003',
    name: 'AutoService Center',
    ruc: '20678901234',
    address: 'Av. Universitaria 2560, San Martín de Porres',
    email: 'autoservice@hotmail.com',
    phone: '965 432 109',
    lastOrderDate: '2026-04-10',
    zone: 'Lima Norte',
  },
  {
    id: 'cli-004',
    name: 'Lubri Express',
    ruc: '20789012345',
    address: 'Calle Las Flores 89, Independencia',
    email: 'lubriexpress@gmail.com',
    phone: '954 321 098',
    zone: 'Lima Norte',
  },
  {
    id: 'cli-005',
    name: 'Grasa & Go',
    ruc: '20890123456',
    address: 'Av. Naranjal 340, Comas',
    email: 'grasaygo@gmail.com',
    phone: '943 210 987',
    lastOrderDate: '2026-04-25',
    zone: 'Lima Norte',
  },
];

export const MOCK_CATALOG: Product[] = [
  { sku: 'MOB-10W40-1L', name: 'Mobil Super 10W-40', brand: 'Mobil', category: 'Aceite Motor', unit: 'Lt', unitPriceWithIgv: 28.90, stock: 120 },
  { sku: 'MOB-10W40-5L', name: 'Mobil Super 10W-40 Bid.', brand: 'Mobil', category: 'Aceite Motor', unit: 'Bid 5L', unitPriceWithIgv: 125.00, stock: 45 },
  { sku: 'MOB-DEL-1L', name: 'Mobil Delvac MX 15W-40', brand: 'Mobil', category: 'Aceite Motor Diesel', unit: 'Lt', unitPriceWithIgv: 32.50, stock: 80 },
  { sku: 'SHL-HLX-1L', name: 'Shell Helix HX3 20W-50', brand: 'Shell', category: 'Aceite Motor', unit: 'Lt', unitPriceWithIgv: 26.80, stock: 95 },
  { sku: 'CAS-GTX-1L', name: 'Castrol GTX 20W-50', brand: 'Castrol', category: 'Aceite Motor', unit: 'Lt', unitPriceWithIgv: 24.50, stock: 150 },
  { sku: 'MOB-1-5W30-1L', name: 'Mobil 1 5W-30 Sintético', brand: 'Mobil', category: 'Aceite Motor Sint.', unit: 'Lt', unitPriceWithIgv: 65.00, stock: 30 },
  { sku: 'SHL-RIM-1L', name: 'Shell Rimula R4 15W-40', brand: 'Shell', category: 'Aceite Motor Diesel', unit: 'Lt', unitPriceWithIgv: 35.00, stock: 60 },
  { sku: 'MOB-ATF-1L', name: 'Mobil ATF 320', brand: 'Mobil', category: 'Aceite Transmisión', unit: 'Lt', unitPriceWithIgv: 42.00, stock: 40 },
  { sku: 'CAS-MAG-1L', name: 'Castrol Magnatec 5W-40', brand: 'Castrol', category: 'Aceite Motor Sint.', unit: 'Lt', unitPriceWithIgv: 68.00, stock: 25 },
  { sku: 'MOB-GRS-400G', name: 'Grasa Mobil Polyrex EM', brand: 'Mobil', category: 'Grasa', unit: '400g', unitPriceWithIgv: 18.50, stock: 200 },
];

const now = new Date('2026-04-29T08:00:00');

function daysAgo(d: number) {
  const dt = new Date(now);
  dt.setDate(dt.getDate() - d);
  return dt.toISOString();
}

function hoursAgo(h: number) {
  const dt = new Date(now);
  dt.setHours(dt.getHours() - h);
  return dt.toISOString();
}

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-001',
    shortId: 'ORD-001',
    clientId: 'cli-001',
    clientName: 'Los Pinos',
    clientRuc: '20456789012',
    advisorId: 'adv-007',
    advisorName: 'Carlos Quispe',
    items: [
      { productSku: 'MOB-10W40-1L', productName: 'Mobil Super 10W-40', quantity: 24, unit: 'Lt', unitPrice: 28.90, subtotal: 693.60 },
      { productSku: 'MOB-DEL-1L', productName: 'Mobil Delvac MX 15W-40', quantity: 12, unit: 'Lt', unitPrice: 32.50, subtotal: 390.00 },
    ],
    subtotalWithoutIgv: 918.31,
    igv: 165.29,
    total: 1083.60,
    status: 'dispatched',
    statusHistory: [
      { status: 'synced', label: 'Recibido', timestamp: daysAgo(3) },
      { status: 'validated', label: 'Validado por ADV', timestamp: daysAgo(3) },
      { status: 'in_sap', label: 'Confirmado en SAP', timestamp: daysAgo(2), note: 'SAP #4500087231' },
      { status: 'dispatched', label: 'En camino', timestamp: daysAgo(1) },
    ],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    sapOrderNumber: '4500087231',
    signerName: 'José Quispe Mamani',
    hasStockWarning: false,
  },
  {
    id: 'ord-002',
    shortId: 'ORD-002',
    clientId: 'cli-002',
    clientName: 'El Rápido',
    clientRuc: '20567890123',
    advisorId: 'adv-007',
    advisorName: 'Carlos Quispe',
    items: [
      { productSku: 'SHL-HLX-1L', productName: 'Shell Helix HX3 20W-50', quantity: 36, unit: 'Lt', unitPrice: 26.80, subtotal: 964.80 },
      { productSku: 'MOB-GRS-400G', productName: 'Grasa Mobil Polyrex EM', quantity: 20, unit: '400g', unitPrice: 18.50, subtotal: 370.00 },
    ],
    subtotalWithoutIgv: 1131.19,
    igv: 203.61,
    total: 1334.80,
    status: 'in_sap',
    statusHistory: [
      { status: 'synced', label: 'Recibido', timestamp: daysAgo(1) },
      { status: 'validated', label: 'Validado por ADV', timestamp: hoursAgo(20) },
      { status: 'in_sap', label: 'En preparación SAP', timestamp: hoursAgo(18), note: 'SAP #4500087289' },
    ],
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(18),
    sapOrderNumber: '4500087289',
    signerName: 'Rosa Flores',
  },
  {
    id: 'ord-003',
    shortId: 'ORD-003',
    clientId: 'cli-003',
    clientName: 'AutoService Center',
    clientRuc: '20678901234',
    advisorId: 'adv-007',
    advisorName: 'Carlos Quispe',
    items: [
      { productSku: 'MOB-1-5W30-1L', productName: 'Mobil 1 5W-30 Sintético', quantity: 12, unit: 'Lt', unitPrice: 65.00, subtotal: 780.00 },
      { productSku: 'CAS-MAG-1L', productName: 'Castrol Magnatec 5W-40', quantity: 6, unit: 'Lt', unitPrice: 68.00, subtotal: 408.00 },
    ],
    subtotalWithoutIgv: 999.15,
    igv: 178.85,
    total: 1188.00,
    status: 'synced',
    statusHistory: [
      { status: 'synced', label: 'Recibido', timestamp: hoursAgo(3) },
    ],
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(3),
    signerName: 'Marcos Vera',
    hasStockWarning: true,
  },
  {
    id: 'ord-004',
    shortId: 'ORD-004',
    clientId: 'cli-004',
    clientName: 'Lubri Express',
    clientRuc: '20789012345',
    advisorId: 'adv-007',
    advisorName: 'Carlos Quispe',
    items: [
      { productSku: 'CAS-GTX-1L', productName: 'Castrol GTX 20W-50', quantity: 48, unit: 'Lt', unitPrice: 24.50, subtotal: 1176.00 },
    ],
    subtotalWithoutIgv: 996.61,
    igv: 179.39,
    total: 1176.00,
    status: 'delivered',
    statusHistory: [
      { status: 'synced', label: 'Recibido', timestamp: daysAgo(7) },
      { status: 'validated', label: 'Validado por ADV', timestamp: daysAgo(7) },
      { status: 'in_sap', label: 'En preparación SAP', timestamp: daysAgo(6), note: 'SAP #4500087100' },
      { status: 'dispatched', label: 'En camino', timestamp: daysAgo(5) },
      { status: 'delivered', label: 'Entregado', timestamp: daysAgo(4) },
    ],
    createdAt: daysAgo(7),
    updatedAt: daysAgo(4),
    sapOrderNumber: '4500087100',
    signerName: 'Ana Huanca',
  },
  {
    id: 'ord-005',
    shortId: 'ORD-005',
    clientId: 'cli-005',
    clientName: 'Grasa & Go',
    clientRuc: '20890123456',
    advisorId: 'adv-007',
    advisorName: 'Carlos Quispe',
    items: [
      { productSku: 'MOB-ATF-1L', productName: 'Mobil ATF 320', quantity: 10, unit: 'Lt', unitPrice: 42.00, subtotal: 420.00 },
      { productSku: 'SHL-RIM-1L', productName: 'Shell Rimula R4 15W-40', quantity: 18, unit: 'Lt', unitPrice: 35.00, subtotal: 630.00 },
    ],
    subtotalWithoutIgv: 889.83,
    igv: 160.17,
    total: 1050.00,
    status: 'delivered',
    statusHistory: [
      { status: 'synced', label: 'Recibido', timestamp: daysAgo(10) },
      { status: 'validated', label: 'Validado por ADV', timestamp: daysAgo(10) },
      { status: 'in_sap', label: 'En preparación SAP', timestamp: daysAgo(9), note: 'SAP #4500087001' },
      { status: 'dispatched', label: 'En camino', timestamp: daysAgo(8) },
      { status: 'delivered', label: 'Entregado', timestamp: daysAgo(7) },
    ],
    createdAt: daysAgo(10),
    updatedAt: daysAgo(7),
    sapOrderNumber: '4500087001',
    signerName: 'Pedro Chávez',
  },
  {
    id: 'ord-006',
    shortId: 'ORD-006',
    clientId: 'cli-001',
    clientName: 'Los Pinos',
    clientRuc: '20456789012',
    advisorId: 'adv-007',
    advisorName: 'Carlos Quispe',
    items: [
      { productSku: 'MOB-10W40-5L', productName: 'Mobil Super 10W-40 Bid.', quantity: 5, unit: 'Bid 5L', unitPrice: 125.00, subtotal: 625.00 },
    ],
    subtotalWithoutIgv: 529.66,
    igv: 95.34,
    total: 625.00,
    status: 'rejected',
    statusHistory: [
      { status: 'synced', label: 'Recibido', timestamp: daysAgo(5) },
      { status: 'rejected', label: 'Rechazado por ADV', timestamp: daysAgo(5), note: 'Stock insuficiente en almacén central. Reagendar para próxima semana.' },
    ],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
    rejectionReason: 'Stock insuficiente en almacén central. Reagendar para próxima semana.',
    signerName: 'José Quispe Mamani',
  },
];
