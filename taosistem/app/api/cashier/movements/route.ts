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

    const movements = await query<any[]>(`
      SELECT * FROM cash_movements WHERE session_id = ? ORDER BY created_at DESC
    `, [sessions[0].id]);

    return NextResponse.json(movements.map(m => ({ ...m, amount: parseFloat(m.amount) })));
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(req, ['cajero']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { movement_type, amount, description, related_order_id } = body;

    if (!movement_type || amount === undefined || !description) {
      return NextResponse.json({ detail: 'Faltan datos' }, { status: 422 });
    }

    const sessions = await query<any[]>(`
      SELECT id FROM cash_sessions WHERE cashier_user_id = ? AND closed_at IS NULL ORDER BY opened_at DESC LIMIT 1
    `, [authResult.user.id]);

    if (sessions.length === 0) {
      return NextResponse.json({ detail: 'Debes abrir caja antes de registrar movimientos' }, { status: 400 });
    }

    const newId = crypto.randomUUID();
    const now = new Date();

    await query(
      'INSERT INTO cash_movements (id, session_id, cashier_user_id, movement_type, amount, description, related_order_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newId, sessions[0].id, authResult.user.id, movement_type, amount, description.trim(), related_order_id || null, now]
    );

    return NextResponse.json({
      id: newId,
      session_id: sessions[0].id,
      cashier_user_id: authResult.user.id,
      movement_type,
      amount,
      description,
      related_order_id: related_order_id || null,
      created_at: now.toISOString()
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
