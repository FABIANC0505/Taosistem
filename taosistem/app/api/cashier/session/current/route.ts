import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['cajero']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const sessions = await query<any[]>(`
      SELECT * FROM cash_sessions WHERE cashier_user_id = ? AND closed_at IS NULL ORDER BY opened_at DESC LIMIT 1
    `, [authResult.user.id]);

    if (sessions.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      id: sessions[0].id,
      cashier_user_id: sessions[0].cashier_user_id,
      opening_amount: parseFloat(sessions[0].opening_amount),
      opening_note: sessions[0].opening_note,
      opened_at: sessions[0].opened_at,
      closed_at: null,
      is_open: true
    });
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
