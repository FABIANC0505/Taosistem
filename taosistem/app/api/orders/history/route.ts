import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult.user;

  if (!['admin', 'cocina', 'mesero'].includes(user.rol)) {
    return NextResponse.json({ detail: 'No autorizado para ver historial' }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const safeLimit = Math.max(1, Math.min(limit, 500));

    let queryStr = `
        SELECT o.*, u.nombre as mesero_nombre
        FROM orders o
        JOIN users u ON u.id = o.id_mesero
        WHERE o.status IN ('entregado', 'cancelado')
    `;
    const params: any[] = [];

    if (user.rol === 'mesero') {
      queryStr += ' AND o.id_mesero = ?';
      params.push(user.id);
    }

    queryStr += ' ORDER BY o.created_at DESC LIMIT ?';
    params.push(safeLimit);

    const orders = await query<any[]>(queryStr, params);

    const metricsQuery = `
      SELECT 
       COUNT(*) as total_orders,
       COALESCE(SUM(total_amount), 0) as total_revenue
      FROM orders
      WHERE status = 'entregado'
    ` + (user.rol === 'mesero' ? ' AND id_mesero = ?' : '');

    const metricsParams = user.rol === 'mesero' ? [user.id] : [];
    const metrics = await query<any[]>(metricsQuery, metricsParams);

    const history = orders.map(o => ({
      ...o,
      total_amount: parseFloat(o.total_amount),
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
    }));

    return NextResponse.json({
      orders: history,
      total_orders: metrics[0].total_orders,
      total_revenue: parseFloat(metrics[0].total_revenue)
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
