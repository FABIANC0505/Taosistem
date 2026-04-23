import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['cajero', 'admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const alerts = await query<any[]>('SELECT * FROM waiter_alerts WHERE resolved = ? ORDER BY created_at DESC', [false]);
    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(req, ['cajero', 'admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { mesa_numero, message } = body;

    if (!mesa_numero || !message) {
      return NextResponse.json({ detail: 'Faltan datos' }, { status: 422 });
    }

    const orders = await query<any[]>(`
      SELECT id_mesero FROM orders 
      WHERE tipo_pedido = 'mesa' AND mesa_numero = ? AND status NOT IN ('entregado', 'cancelado') 
      ORDER BY created_at DESC LIMIT 1
    `, [mesa_numero]);

    const mesero_user_id = orders.length > 0 ? orders[0].id_mesero : null;

    const newId = crypto.randomUUID();
    const now = new Date();

    await query(
      'INSERT INTO waiter_alerts (id, mesa_numero, cashier_user_id, mesero_user_id, message, resolved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newId, mesa_numero, authResult.user.id, mesero_user_id, message.trim(), false, now]
    );

    return NextResponse.json({
      id: newId,
      mesa_numero,
      cashier_user_id: authResult.user.id,
      mesero_user_id,
      message,
      resolved: false,
      created_at: now.toISOString(),
      resolved_at: null
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno o de base de datos' }, { status: 500 });
  }
}
