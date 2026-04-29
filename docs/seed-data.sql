-- ============================================================
-- LUBRISALES — SEED DATA COMPLETO
-- Ejecutar en Supabase SQL Editor
-- Incluye: advisor, clientes, catálogo, pedidos, items,
--          historial de estados y notificaciones
-- ============================================================

-- Usar ON CONFLICT DO NOTHING por si ya existe data previa

-- ────────────────────────────────────────────────────────────
-- ADVISOR
-- ────────────────────────────────────────────────────────────
INSERT INTO advisors (id, name, email, zone) VALUES
  ('00000000-0000-0000-0000-000000000007', 'Carlos Quispe', 'carlos.quispe@soltrak.com', 'Lima Norte')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- CLIENTES
-- ────────────────────────────────────────────────────────────
INSERT INTO clients (id, name, ruc, address, email, phone, zone, last_order_date) VALUES
  ('00000000-0000-0000-0001-000000000001', 'Los Pinos',          '20456789012', 'Av. Los Pinos 432, Comas',                     'lospinos@gmail.com',       '987654321', 'Lima Norte', '2026-04-26'),
  ('00000000-0000-0000-0001-000000000002', 'El Rápido',          '20567890123', 'Jr. Independencia 128, Los Olivos',             'elrapido.lubri@gmail.com', '976543210', 'Lima Norte', '2026-04-28'),
  ('00000000-0000-0000-0001-000000000003', 'AutoService Center', '20678901234', 'Av. Universitaria 2560, San Martín de Porres', 'autoservice@hotmail.com',  '965432109', 'Lima Norte', '2026-04-29'),
  ('00000000-0000-0000-0001-000000000004', 'Lubri Express',      '20789012345', 'Calle Las Flores 89, Independencia',           'lubriexpress@gmail.com',   '954321098', 'Lima Norte', '2026-04-22'),
  ('00000000-0000-0000-0001-000000000005', 'Grasa & Go',         '20890123456', 'Av. Naranjal 340, Comas',                      'grasaygo@gmail.com',       '943210987', 'Lima Norte', '2026-04-19')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- CATÁLOGO DE PRODUCTOS
-- ────────────────────────────────────────────────────────────
INSERT INTO products (sku, name, brand, category, unit, unit_price_with_igv, stock) VALUES
  ('MOB-10W40-1L',  'Mobil Super 10W-40',       'Mobil',   'Aceite Motor',        'Lt',     28.90, 120),
  ('MOB-10W40-5L',  'Mobil Super 10W-40 Bid.',  'Mobil',   'Aceite Motor',        'Bid 5L', 125.00, 45),
  ('MOB-DEL-1L',    'Mobil Delvac MX 15W-40',   'Mobil',   'Aceite Motor Diesel', 'Lt',     32.50,  80),
  ('SHL-HLX-1L',    'Shell Helix HX3 20W-50',   'Shell',   'Aceite Motor',        'Lt',     26.80,  95),
  ('CAS-GTX-1L',    'Castrol GTX 20W-50',       'Castrol', 'Aceite Motor',        'Lt',     24.50, 150),
  ('MOB-1-5W30-1L', 'Mobil 1 5W-30 Sintético',  'Mobil',   'Aceite Motor Sint.',  'Lt',     65.00,  30),
  ('SHL-RIM-1L',    'Shell Rimula R4 15W-40',   'Shell',   'Aceite Motor Diesel', 'Lt',     35.00,  60),
  ('MOB-ATF-1L',    'Mobil ATF 320',            'Mobil',   'Aceite Transmisión',  'Lt',     42.00,  40),
  ('CAS-MAG-1L',    'Castrol Magnatec 5W-40',   'Castrol', 'Aceite Motor Sint.',  'Lt',     68.00,  25),
  ('MOB-GRS-400G',  'Grasa Mobil Polyrex EM',   'Mobil',   'Grasa',               '400g',   18.50, 200)
ON CONFLICT (sku) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- PEDIDOS
-- ────────────────────────────────────────────────────────────
INSERT INTO orders (
  id, short_id, client_id, advisor_id, status,
  subtotal_without_igv, igv, total,
  signer_name, sap_order_number, rejection_reason,
  has_stock_warning, created_at, updated_at
) VALUES

-- ORD-001 | Los Pinos | EN CAMINO
(
  '00000000-0000-0000-0003-000000000001',
  'ORD-001',
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0000-000000000007',
  'dispatched',
  918.31, 165.29, 1083.60,
  'José Quispe Mamani', '4500087231', NULL,
  false,
  '2026-04-26 09:00:00+00', '2026-04-28 10:00:00+00'
),

-- ORD-002 | El Rápido | EN PREPARACIÓN (in_sap)
(
  '00000000-0000-0000-0003-000000000002',
  'ORD-002',
  '00000000-0000-0000-0001-000000000002',
  '00000000-0000-0000-0000-000000000007',
  'in_sap',
  1131.19, 203.61, 1334.80,
  'Rosa Flores', '4500087289', NULL,
  false,
  '2026-04-28 08:00:00+00', '2026-04-28 14:00:00+00'
),

-- ORD-003 | AutoService Center | RECIBIDO (synced) — pendiente de validación ADV
(
  '00000000-0000-0000-0003-000000000003',
  'ORD-003',
  '00000000-0000-0000-0001-000000000003',
  '00000000-0000-0000-0000-000000000007',
  'synced',
  999.15, 178.85, 1188.00,
  'Marcos Vera', NULL, NULL,
  true,
  '2026-04-29 05:00:00+00', '2026-04-29 05:00:00+00'
),

-- ORD-004 | Lubri Express | ENTREGADO
(
  '00000000-0000-0000-0003-000000000004',
  'ORD-004',
  '00000000-0000-0000-0001-000000000004',
  '00000000-0000-0000-0000-000000000007',
  'delivered',
  996.61, 179.39, 1176.00,
  'Ana Huanca', '4500087100', NULL,
  false,
  '2026-04-22 09:00:00+00', '2026-04-25 09:00:00+00'
),

-- ORD-005 | Grasa & Go | ENTREGADO
(
  '00000000-0000-0000-0003-000000000005',
  'ORD-005',
  '00000000-0000-0000-0001-000000000005',
  '00000000-0000-0000-0000-000000000007',
  'delivered',
  889.83, 160.17, 1050.00,
  'Pedro Chávez', '4500087001', NULL,
  false,
  '2026-04-19 09:00:00+00', '2026-04-22 09:00:00+00'
),

-- ORD-006 | Los Pinos | RECHAZADO
(
  '00000000-0000-0000-0003-000000000006',
  'ORD-006',
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0000-000000000007',
  'rejected',
  529.66, 95.34, 625.00,
  'José Quispe Mamani', NULL,
  'Stock insuficiente en almacén central. Reagendar para próxima semana.',
  false,
  '2026-04-24 10:00:00+00', '2026-04-24 15:30:00+00'
)

ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- ORDER ITEMS
-- ────────────────────────────────────────────────────────────
INSERT INTO order_items (order_id, product_sku, product_name, quantity, unit, unit_price, subtotal, sort_order) VALUES

-- ORD-001
('00000000-0000-0000-0003-000000000001', 'MOB-10W40-1L', 'Mobil Super 10W-40',      24, 'Lt',  28.90,  693.60, 0),
('00000000-0000-0000-0003-000000000001', 'MOB-DEL-1L',   'Mobil Delvac MX 15W-40', 12, 'Lt',  32.50,  390.00, 1),

-- ORD-002
('00000000-0000-0000-0003-000000000002', 'SHL-HLX-1L',    'Shell Helix HX3 20W-50',  36, 'Lt',   26.80,  964.80, 0),
('00000000-0000-0000-0003-000000000002', 'MOB-GRS-400G',  'Grasa Mobil Polyrex EM',  20, '400g', 18.50,  370.00, 1),

-- ORD-003
('00000000-0000-0000-0003-000000000003', 'MOB-1-5W30-1L', 'Mobil 1 5W-30 Sintético', 12, 'Lt',  65.00,  780.00, 0),
('00000000-0000-0000-0003-000000000003', 'CAS-MAG-1L',    'Castrol Magnatec 5W-40',   6, 'Lt',  68.00,  408.00, 1),

-- ORD-004
('00000000-0000-0000-0003-000000000004', 'CAS-GTX-1L', 'Castrol GTX 20W-50', 48, 'Lt', 24.50, 1176.00, 0),

-- ORD-005
('00000000-0000-0000-0003-000000000005', 'MOB-ATF-1L', 'Mobil ATF 320',           10, 'Lt', 42.00, 420.00, 0),
('00000000-0000-0000-0003-000000000005', 'SHL-RIM-1L', 'Shell Rimula R4 15W-40',  18, 'Lt', 35.00, 630.00, 1),

-- ORD-006
('00000000-0000-0000-0003-000000000006', 'MOB-10W40-5L', 'Mobil Super 10W-40 Bid.', 5, 'Bid 5L', 125.00, 625.00, 0);

-- ────────────────────────────────────────────────────────────
-- HISTORIAL DE ESTADOS
-- ────────────────────────────────────────────────────────────
INSERT INTO order_status_history (order_id, status, label, note, created_at) VALUES

-- ORD-001: draft→synced→validated→in_sap→dispatched
('00000000-0000-0000-0003-000000000001', 'synced',    'Recibido',           NULL,               '2026-04-26 09:01:00+00'),
('00000000-0000-0000-0003-000000000001', 'validated', 'Validado por ADV',   NULL,               '2026-04-26 11:00:00+00'),
('00000000-0000-0000-0003-000000000001', 'in_sap',    'En preparación SAP', 'SAP #4500087231',  '2026-04-27 08:00:00+00'),
('00000000-0000-0000-0003-000000000001', 'dispatched','En camino',           NULL,               '2026-04-28 10:00:00+00'),

-- ORD-002: synced→validated→in_sap
('00000000-0000-0000-0003-000000000002', 'synced',    'Recibido',           NULL,               '2026-04-28 08:01:00+00'),
('00000000-0000-0000-0003-000000000002', 'validated', 'Validado por ADV',   NULL,               '2026-04-28 12:00:00+00'),
('00000000-0000-0000-0003-000000000002', 'in_sap',    'En preparación SAP', 'SAP #4500087289',  '2026-04-28 14:00:00+00'),

-- ORD-003: synced (pendiente ADV)
('00000000-0000-0000-0003-000000000003', 'synced',    'Recibido',           NULL,               '2026-04-29 05:01:00+00'),

-- ORD-004: completo
('00000000-0000-0000-0003-000000000004', 'synced',    'Recibido',           NULL,               '2026-04-22 09:01:00+00'),
('00000000-0000-0000-0003-000000000004', 'validated', 'Validado por ADV',   NULL,               '2026-04-22 11:00:00+00'),
('00000000-0000-0000-0003-000000000004', 'in_sap',    'En preparación SAP', 'SAP #4500087100',  '2026-04-23 08:00:00+00'),
('00000000-0000-0000-0003-000000000004', 'dispatched','En camino',           NULL,               '2026-04-24 09:00:00+00'),
('00000000-0000-0000-0003-000000000004', 'delivered', 'Entregado',          NULL,               '2026-04-25 09:00:00+00'),

-- ORD-005: completo
('00000000-0000-0000-0003-000000000005', 'synced',    'Recibido',           NULL,               '2026-04-19 09:01:00+00'),
('00000000-0000-0000-0003-000000000005', 'validated', 'Validado por ADV',   NULL,               '2026-04-19 11:00:00+00'),
('00000000-0000-0000-0003-000000000005', 'in_sap',    'En preparación SAP', 'SAP #4500087001',  '2026-04-20 08:00:00+00'),
('00000000-0000-0000-0003-000000000005', 'dispatched','En camino',           NULL,               '2026-04-21 09:00:00+00'),
('00000000-0000-0000-0003-000000000005', 'delivered', 'Entregado',          NULL,               '2026-04-22 09:00:00+00'),

-- ORD-006: synced→rejected
('00000000-0000-0000-0003-000000000006', 'synced',    'Recibido',         NULL,                                                                              '2026-04-24 10:01:00+00'),
('00000000-0000-0000-0003-000000000006', 'rejected',  'Rechazado por ADV','Stock insuficiente en almacén central. Reagendar para próxima semana.',           '2026-04-24 15:30:00+00');

-- ────────────────────────────────────────────────────────────
-- NOTIFICACIONES
-- ────────────────────────────────────────────────────────────
INSERT INTO notifications (advisor_id, order_id, type, title, body, read, created_at) VALUES

('00000000-0000-0000-0000-000000000007',
 '00000000-0000-0000-0003-000000000001',
 'dispatched', 'Pedido en camino',
 'Los Pinos — pedido ORD-001 fue despachado.',
 false, '2026-04-28 10:00:00+00'),

('00000000-0000-0000-0000-000000000007',
 '00000000-0000-0000-0003-000000000006',
 'rejected', 'Pedido rechazado',
 'Los Pinos — ORD-006 fue rechazado por ADV.',
 true, '2026-04-24 15:30:00+00'),

('00000000-0000-0000-0000-000000000007',
 '00000000-0000-0000-0003-000000000004',
 'delivered', 'Pedido entregado',
 'Lubri Express — ORD-004 fue entregado.',
 true, '2026-04-25 09:00:00+00'),

('00000000-0000-0000-0000-000000000007',
 '00000000-0000-0000-0003-000000000005',
 'delivered', 'Pedido entregado',
 'Grasa & Go — ORD-005 fue entregado.',
 true, '2026-04-22 09:00:00+00');
