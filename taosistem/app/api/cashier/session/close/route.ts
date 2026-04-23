import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const authResult = await requireRole(req, ['cajero', 'admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { counted_amount, closing_note } = body;

    if (counted_amount === undefined || counted_amount < 0) {
      return NextResponse.json({ detail: 'Monto inválido' }, { status: 422 });
    }

    const sessions = await query<any[]>(`
      SELECT * FROM cash_sessions WHERE cashier_user_id = ? AND closed_at IS NULL ORDER BY opened_at DESC LIMIT 1
    `, [authResult.user.id]);

    if (sessions.length === 0) {
      return NextResponse.json({ detail: 'No tienes una caja abierta' }, { status: 400 });
    }

    const session = sessions[0];
    const now = new Date();

    await query(
      'UPDATE cash_sessions SET closing_counted_amount = ?, closing_note = ?, closed_at = ? WHERE id = ?',
      [counted_amount, closing_note ? closing_note.trim() : null, now, session.id]
    );

    return NextResponse.json({
      id: session.id,
      cashier_user_id: session.cashier_user_id,
      opening_amount: parseFloat(session.opening_amount),
      opening_note: session.opening_note,
      opened_at: session.opened_at,
      closed_at: now.toISOString(),
      is_open: false,
      closing_counted_amount: counted_amount,
      closing_note: closing_note
    });
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
