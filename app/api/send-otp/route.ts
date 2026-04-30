import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const OTP_CODE = '123456';

export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email: string };

  if (!email?.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: 'LubriSales <onboarding@resend.dev>',
    to: email,
    subject: 'Tu código de acceso LubriSales',
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:#DC2626;padding:24px 28px">
      <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.3px">LubriSales</p>
      <p style="margin:2px 0 0;font-size:12px;color:#FCA5A5">Sistema de Gestión de Pedidos · Soltrak</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 28px;text-align:center">
      <p style="margin:0 0 8px;font-size:14px;color:#6B7280">Tu código de acceso es</p>
      <div style="background:#FEF2F2;border:2px dashed #FECACA;border-radius:14px;padding:20px 28px;display:inline-block;margin:0 0 20px">
        <p style="margin:0;font-size:40px;font-weight:800;font-family:monospace;letter-spacing:10px;color:#DC2626">${OTP_CODE}</p>
      </div>
      <p style="margin:0 0 4px;font-size:13px;color:#9CA3AF">Este código es válido por <strong style="color:#374151">10 minutos</strong>.</p>
      <p style="margin:0;font-size:13px;color:#9CA3AF">Si no solicitaste este código, ignora este correo.</p>
    </div>

    <!-- Footer -->
    <div style="background:#F9FAFB;border-top:1px solid #F3F4F6;padding:16px 28px;text-align:center">
      <p style="margin:0;font-size:11px;color:#9CA3AF">LubriSales by Soltrak · UTEC Grupo 3</p>
    </div>

  </div>
</body>
</html>`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
