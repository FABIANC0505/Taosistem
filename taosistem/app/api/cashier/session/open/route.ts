import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const authResult = await requireRole(req, ['cajero', 'admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { opening_amount, opening_note } = body;

    if (opening_amount === undefined || opening_amount < 0) {
      return NextResponse.json({ detail: 'Monto inválido' }, { status: 422 });
    }

    const sessions = await query<any[]>(`
      SELECT id FROM cash_sessions WHERE cashier_user_id = ? AND closed_at IS NULL
    `, [authResult.user.id]);

    if (sessions.length > 0) {
      return NextResponse.json({ detail: 'Ya tienes una caja abierta' }, { status: 400 });
    }

    const newId = crypto.randomUUID();
    const now = new Date();

    await query(
      'INSERT INTO cash_sessions (id, cashier_user_id, opening_amount, opening_note, opened_at) VALUES (?, ?, ?, ?, ?)',
      [newId, authResult.user.id, opening_amount, opening_note ? opening_note.trim() : null, now]
    );

    return NextResponse.json({
      id: newId,
      cashier_user_id: authResult.user.id,
      opening_amount,
      opening_note,
      opened_at: now.toISOString(),
      closed_at: null,
      is_open: true
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
