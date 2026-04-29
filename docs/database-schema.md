# LubriSales — Esquema de Base de Datos (Supabase / PostgreSQL)

## Tablas

| Tabla | Descripción |
|---|---|
| `advisors` | Asesores comerciales |
| `clients` | Lubricentros (clientes) |
| `products` | Catálogo de productos |
| `orders` | Pedidos con totales y estado actual |
| `order_items` | Líneas de cada pedido |
| `order_status_history` | Historial de transiciones de estado |
| `notifications` | Notificaciones por asesor |

---

## Diagrama de relaciones

```
advisors ─────────┐
                  ├──< orders >──< order_items >── products
clients ──────────┘       │
                          └──< order_status_history
                          └──< notifications >── advisors
```

---

## SQL

```sql
-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE order_status AS ENUM (
  'draft',
  'pending_sync',
  'synced',
  'validated',
  'processing_sap',
  'in_sap',
  'dispatched',
  'delivered',
  'rejected',
  'cancelled'
);

CREATE TYPE notification_type AS ENUM (
  'synced',
  'validated',
  'rejected',
  'dispatched',
  'delivered'
);

-- ============================================================
-- ADVISORS (Asesores comerciales)
-- ============================================================

CREATE TABLE advisors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  zone        TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CLIENTS (Lubricentros)
-- ============================================================

CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  ruc             VARCHAR(11) NOT NULL UNIQUE,
  address         TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  zone            TEXT NOT NULL,
  last_order_date DATE,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PRODUCTS (Catálogo)
-- ============================================================

CREATE TABLE products (
  sku                 TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  brand               TEXT NOT NULL,
  category            TEXT NOT NULL,
  unit                TEXT NOT NULL,
  unit_price_with_igv NUMERIC(10,2) NOT NULL,
  stock               INTEGER NOT NULL DEFAULT 0,
  active              BOOLEAN NOT NULL DEFAULT true,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ORDERS (Pedidos)
-- ============================================================

CREATE TABLE orders (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id             TEXT NOT NULL UNIQUE,
  client_id            UUID NOT NULL REFERENCES clients(id),
  advisor_id           UUID NOT NULL REFERENCES advisors(id),
  status               order_status NOT NULL DEFAULT 'draft',
  subtotal_without_igv NUMERIC(10,2) NOT NULL DEFAULT 0,
  igv                  NUMERIC(10,2) NOT NULL DEFAULT 0,
  total                NUMERIC(10,2) NOT NULL DEFAULT 0,
  signature_url        TEXT,
  signer_name          TEXT,
  sap_order_number     TEXT,
  rejection_reason     TEXT,
  notes                TEXT,
  has_stock_warning    BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ORDER ITEMS (Líneas del pedido)
-- ============================================================

CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_sku  TEXT NOT NULL REFERENCES products(sku),
  product_name TEXT NOT NULL,
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  unit         TEXT NOT NULL,
  unit_price   NUMERIC(10,2) NOT NULL,
  subtotal     NUMERIC(10,2) NOT NULL,
  sort_order   SMALLINT NOT NULL DEFAULT 0
);

-- ============================================================
-- ORDER STATUS HISTORY (Historial de estados)
-- ============================================================

CREATE TABLE order_status_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     order_status NOT NULL,
  label      TEXT NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS (Notificaciones del asesor)
-- ============================================================

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGER: updated_at automático en orders y products
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_orders_advisor       ON orders(advisor_id);
CREATE INDEX idx_orders_client        ON orders(client_id);
CREATE INDEX idx_orders_status        ON orders(status);
CREATE INDEX idx_orders_created_at    ON orders(created_at DESC);
CREATE INDEX idx_order_items_order    ON order_items(order_id);
CREATE INDEX idx_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_notifications_advisor ON notifications(advisor_id, read);

-- ============================================================
-- SEED DATA — Datos de prueba
-- ============================================================

INSERT INTO advisors (id, name, email, zone) VALUES
  ('00000000-0000-0000-0000-000000000007', 'Carlos Quispe', 'carlos.quispe@soltrak.com', 'Lima Norte');

INSERT INTO clients (id, name, ruc, address, email, phone, zone, last_order_date) VALUES
  ('00000000-0000-0000-0001-000000000001', 'Los Pinos',          '20456789012', 'Av. Los Pinos 432, Comas',                     'lospinos@gmail.com',       '987654321', 'Lima Norte', '2026-04-15'),
  ('00000000-0000-0000-0001-000000000002', 'El Rápido',          '20567890123', 'Jr. Independencia 128, Los Olivos',             'elrapido.lubri@gmail.com', '976543210', 'Lima Norte', '2026-04-20'),
  ('00000000-0000-0000-0001-000000000003', 'AutoService Center', '20678901234', 'Av. Universitaria 2560, San Martín de Porres', 'autoservice@hotmail.com',  '965432109', 'Lima Norte', '2026-04-10'),
  ('00000000-0000-0000-0001-000000000004', 'Lubri Express',      '20789012345', 'Calle Las Flores 89, Independencia',           'lubriexpress@gmail.com',   '954321098', 'Lima Norte', NULL),
  ('00000000-0000-0000-0001-000000000005', 'Grasa & Go',         '20890123456', 'Av. Naranjal 340, Comas',                      'grasaygo@gmail.com',       '943210987', 'Lima Norte', '2026-04-25');

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
  ('MOB-GRS-400G',  'Grasa Mobil Polyrex EM',   'Mobil',   'Grasa',               '400g',   18.50, 200);
```

---

## Notas de diseño

- **`short_id`** en `orders` es el código legible (`ORD-001`) generado en aplicación.
- **`signature_url`** apunta al archivo almacenado en Supabase Storage (bucket `signatures`).
- **`order_items.product_name`** se desnormaliza para preservar el nombre histórico si el producto cambia de nombre en catálogo.
- **`order_items.sort_order`** mantiene el orden visual en que el asesor agregó los productos.
- El trigger `set_updated_at` actualiza automáticamente `updated_at` en `orders` y `products` en cada `UPDATE`.
- `ON DELETE CASCADE` en `order_items` y `order_status_history` limpia las filas hijas si se elimina el pedido.
