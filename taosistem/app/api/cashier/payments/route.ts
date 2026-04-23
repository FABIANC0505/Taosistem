import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['cajero', 'admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const sessions = await query<any[]>(`
      SELECT id FROM cash_sessions WHERE cashier_user_id = ? AND closed_at IS NULL ORDER BY opened_at DESC LIMIT 1
    `, [authResult.user.id]);

    if (sessions.length === 0) {
      return NextResponse.json([]);
    }

    const payments = await query<any[]>(`
      SELECT * FROM cash_payments WHERE session_id = ? ORDER BY created_at DESC LIMIT 20
    `, [sessions[0].id]);

    return NextResponse.json(payments.map(p => ({ ...p, amount: parseFloat(p.amount) })));
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(req, ['cajero']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { amount, payment_method, order_id, mesa_numero, reference_note } = body;

    if (amount === undefined || !payment_method) {
      return NextResponse.json({ detail: 'Faltan datos' }, { status: 422 });
    }

    const sessions = await query<any[]>(`
      SELECT id FROM cash_sessions WHERE cashier_user_id = ? AND closed_at IS NULL ORDER BY opened_at DESC LIMIT 1
    `, [authResult.user.id]);

    if (sessions.length === 0) {
      return NextResponse.json({ detail: 'Debes abrir caja antes de registrar pagos' }, { status: 400 });
    }

    const newId = crypto.randomUUID();
    const now = new Date();

    await query(
      'INSERT INTO cash_payments (id, session_id, cashier_user_id, order_id, mesa_numero, payment_method, amount, reference_note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newId, sessions[0].id, authResult.user.id, order_id || null, mesa_numero || null, payment_method, amount, reference_note || null, now]
    );

    return NextResponse.json({
      id: newId,
      session_id: sessions[0].id,
      cashier_user_id: authResult.user.id,
      order_id: order_id || null,
      mesa_numero: mesa_numero || null,
      payment_method,
      amount,
      reference_note: reference_note || null,
      created_at: now.toISOString()
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
