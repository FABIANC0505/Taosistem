import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['mesero', 'admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    let queryStr = 'SELECT * FROM waiter_alerts WHERE resolved = ? ';
    const params: any[] = [false];

    if (authResult.user.rol === 'mesero') {
      queryStr += 'AND (mesero_user_id = ? OR mesero_user_id IS NULL) ';
      params.push(authResult.user.id);
    }

    queryStr += 'ORDER BY created_at DESC';

    const alerts = await query<any[]>(queryStr, params);
    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
