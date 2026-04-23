import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';

type AlertRouteContext = {
  params: Promise<{ alert_id: string }>;
};

export async function PUT(req: NextRequest, context: AlertRouteContext) {
  const authResult = await requireRole(req, ['cajero', 'mesero', 'admin']);
  if (authResult instanceof NextResponse) return authResult;
  const { alert_id } = await context.params;

  try {
    const alerts = await query<any[]>('SELECT * FROM waiter_alerts WHERE id = ?', [alert_id]);
    const alert = alerts[0];

    if (!alert) {
      return NextResponse.json({ detail: 'Aviso no encontrado' }, { status: 404 });
    }

    if (authResult.user.rol === 'mesero' && alert.mesero_user_id !== null && alert.mesero_user_id !== authResult.user.id) {
      return NextResponse.json({ detail: 'No autorizado para cerrar este aviso' }, { status: 403 });
    }

    const now = new Date();
    await query('UPDATE waiter_alerts SET resolved = ?, resolved_at = ? WHERE id = ?', [true, now, alert_id]);

    alert.resolved = true;
    alert.resolved_at = now;

    return NextResponse.json(alert);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
