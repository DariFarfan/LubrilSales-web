import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type EmailStatus = 'synced' | 'in_sap' | 'dispatched' | 'delivered';

const EMAIL_CONTENT: Record<EmailStatus, { subject: string; heading: string; body: string; color: string }> = {
  synced: {
    subject: 'Pedido recibido',
    heading: '¡Tu pedido fue recibido!',
    body: 'Tu pedido ha sido registrado correctamente y está siendo revisado por nuestro equipo.',
    color: '#3B82F6',
  },
  in_sap: {
    subject: 'Tu pedido está en preparación',
    heading: 'Estamos preparando tu pedido',
    body: 'Tu pedido ha sido validado y ya está siendo preparado en nuestro almacén.',
    color: '#06B6D4',
  },
  dispatched: {
    subject: 'Tu pedido está en camino',
    heading: '¡Tu pedido está en camino!',
    body: 'Tu pedido salió de nuestro almacén y pronto llegará a tu establecimiento.',
    color: '#F97316',
  },
  delivered: {
    subject: 'Pedido entregado',
    heading: '¡Pedido entregado!',
    body: 'Tu pedido fue entregado exitosamente. Gracias por confiar en Soltrak.',
    color: '#22C55E',
  },
};

export async function POST(req: NextRequest) {
  const { orderId, status } = await req.json() as { orderId: string; status: EmailStatus };

  if (!EMAIL_CONTENT[status]) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Fetch order + client email from Supabase
  const { data: order, error } = await supabase
    .from('orders')
    .select('short_id, total, client:clients(name, email)')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const client = order.client as { name: string; email: string } | null;
  if (!client?.email) {
    return NextResponse.json({ error: 'Client has no email' }, { status: 400 });
  }

  const content = EMAIL_CONTENT[status];
  const totalFormatted = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(order.total));

  const { error: sendError } = await resend.emails.send({
    from: 'LubriSales <onboarding@resend.dev>',
    to: client.email,
    subject: `${content.subject} · ${order.short_id}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <div style="background:${content.color};border-radius:12px;padding:24px;margin-bottom:24px">
          <p style="color:white;font-size:18px;font-weight:700;margin:0">LubriSales · Soltrak</p>
        </div>
        <h2 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:8px">${content.heading}</h2>
        <p style="color:#6B7280;margin-bottom:24px">${content.body}</p>
        <div style="background:#F9FAFB;border-radius:12px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 8px;font-size:13px;color:#9CA3AF">Número de pedido</p>
          <p style="margin:0;font-weight:700;font-size:18px;font-family:monospace;color:#111827">${order.short_id}</p>
          <p style="margin:8px 0 0;font-size:13px;color:#6B7280">Total: <strong style="color:#111827">${totalFormatted}</strong></p>
        </div>
        <p style="color:#9CA3AF;font-size:12px;text-align:center;margin-top:32px">
          Este es un correo automático de LubriSales · UTEC Grupo 3
        </p>
      </div>
    `,
  });

  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
