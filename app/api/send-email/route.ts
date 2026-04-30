import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type EmailStatus = 'synced' | 'in_sap' | 'dispatched' | 'delivered';

const STATUS_META: Record<EmailStatus, { subject: string; heading: string; body: string; badge: string; badgeBg: string }> = {
  synced: {
    subject: 'Pedido recibido',
    heading: '¡Tu pedido fue recibido!',
    body: 'Tu pedido ha sido registrado correctamente y está siendo revisado por nuestro equipo de ventas.',
    badge: 'Recibido',
    badgeBg: '#DBEAFE',
  },
  in_sap: {
    subject: 'Tu pedido está en preparación',
    heading: 'Estamos preparando tu pedido',
    body: 'Tu pedido fue validado por el área de ventas y ya está siendo preparado en nuestro almacén.',
    badge: 'En preparación',
    badgeBg: '#CFFAFE',
  },
  dispatched: {
    subject: 'Tu pedido está en camino',
    heading: '¡Tu pedido está en camino!',
    body: 'Tu pedido salió de nuestro almacén y pronto llegará a tu establecimiento.',
    badge: 'En camino',
    badgeBg: '#FFEDD5',
  },
  delivered: {
    subject: 'Pedido entregado',
    heading: '¡Pedido entregado con éxito!',
    body: 'Tu pedido fue entregado exitosamente. Gracias por confiar en Soltrak Chevron.',
    badge: 'Entregado',
    badgeBg: '#DCFCE7',
  },
};

function fmt(n: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);
}

type DBItem = { product_sku: string; product_name: string; quantity: number; unit: string; unit_price: number; subtotal: number; sort_order: number };

export async function POST(req: NextRequest) {
  const { orderId, status } = await req.json() as { orderId: string; status: EmailStatus };

  if (!STATUS_META[status]) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('short_id, subtotal_without_igv, igv, total, client:clients(name, email), order_items(*)')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const client = order.client as unknown as { name: string; email: string } | null;
  if (!client?.email) {
    return NextResponse.json({ error: 'Client has no email' }, { status: 400 });
  }

  const items = (order.order_items as unknown as DBItem[]).sort((a, b) => a.sort_order - b.sort_order);
  const meta = STATUS_META[status];

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6">
        <p style="margin:0;font-size:13px;font-weight:600;color:#111827">${item.product_name}</p>
        <p style="margin:2px 0 0;font-size:11px;color:#9CA3AF;font-family:monospace">${item.product_sku}</p>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;text-align:center;font-size:13px;color:#374151;white-space:nowrap">${item.quantity} ${item.unit}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;text-align:right;font-size:13px;color:#374151;white-space:nowrap">${fmt(Number(item.unit_price))}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;text-align:right;font-size:13px;font-weight:600;color:#111827;white-space:nowrap">${fmt(Number(item.subtotal))}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

    <!-- Header rojo -->
    <div style="background:#DC2626;padding:24px 28px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.3px">LubriSales</p>
            <p style="margin:2px 0 0;font-size:12px;color:#FCA5A5">Sistema de Gestión de Pedidos · Soltrak</p>
          </td>
          <td style="text-align:right">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Chevron_Corporation_Logo.svg/120px-Chevron_Corporation_Logo.svg.png" alt="Chevron" height="28" style="opacity:0.9" />
          </td>
        </tr>
      </table>
    </div>

    <!-- Status badge -->
    <div style="background:${meta.badgeBg};padding:10px 28px">
      <p style="margin:0;font-size:12px;font-weight:600;color:#374151">Estado del pedido: <strong>${meta.badge}</strong></p>
    </div>

    <!-- Body -->
    <div style="padding:28px">
      <p style="margin:0 0 4px;font-size:14px;color:#6B7280">Estimado/a,</p>
      <h2 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.3px">${meta.heading}</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6">${meta.body}</p>

      <!-- Número de pedido -->
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:14px 16px;margin-bottom:24px;display:inline-block;width:100%;box-sizing:border-box">
        <p style="margin:0 0 2px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px">Número de pedido</p>
        <p style="margin:0;font-size:20px;font-weight:800;font-family:monospace;color:#DC2626">${order.short_id}</p>
      </div>

      <!-- Tabla de productos -->
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px">Detalle del pedido</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #F3F4F6;border-radius:10px;overflow:hidden;border-collapse:collapse">
        <thead>
          <tr style="background:#F9FAFB">
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px">Producto</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px">Cant.</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px">Precio u.</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- Totales -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">
        <tr>
          <td style="padding:6px 12px;font-size:13px;color:#6B7280">Subtotal sin IGV</td>
          <td style="padding:6px 12px;text-align:right;font-size:13px;color:#374151">${fmt(Number(order.subtotal_without_igv))}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;font-size:13px;color:#6B7280">IGV (18%)</td>
          <td style="padding:6px 12px;text-align:right;font-size:13px;color:#374151">${fmt(Number(order.igv))}</td>
        </tr>
        <tr style="border-top:2px solid #F3F4F6">
          <td style="padding:10px 12px;font-size:15px;font-weight:800;color:#111827">Total</td>
          <td style="padding:10px 12px;text-align:right;font-size:15px;font-weight:800;color:#DC2626">${fmt(Number(order.total))}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="background:#F9FAFB;border-top:1px solid #F3F4F6;padding:16px 28px;text-align:center">
      <p style="margin:0;font-size:11px;color:#9CA3AF">Este es un correo automático · LubriSales by Soltrak · UTEC Grupo 3</p>
      <p style="margin:4px 0 0;font-size:11px;color:#D1D5DB">Por favor no respondas a este correo.</p>
    </div>

  </div>
</body>
</html>`;

  const { error: sendError } = await resend.emails.send({
    from: 'LubriSales <onboarding@resend.dev>',
    to: client.email,
    subject: `${meta.subject} · ${order.short_id}`,
    html,
  });

  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
