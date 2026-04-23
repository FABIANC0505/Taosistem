import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/api-helpers';

type OrderCancelRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, context: OrderCancelRouteContext) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult.user;
  const { id } = await context.params;

  try {
    const orders = await query<any[]>('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) return NextResponse.json({ detail: 'Pedido no encontrado' }, { status: 404 });
    const order = orders[0];

    if (user.rol !== 'admin' && (user.rol === 'mesero' && order.id_mesero !== user.id)) {
        return NextResponse.json({ detail: 'No tienes permiso para gestionar este pedido' }, { status: 403 });
    }

    if (order.status === 'cancelado') {
        order.total_amount = parseFloat(order.total_amount);
        order.items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        return NextResponse.json(order);
    }

    const body = await req.json();
    const motivo_cancelacion = body.motivo_cancelacion || null;

    const allowedTransitions: Record<string, string[]> = {
      'pendiente': ['en_preparacion', 'cancelado'],
      'en_preparacion': ['listo', 'cancelado'],
      'listo': ['entregado', 'cancelado'],
      'entregado': [],
      'cancelado': []
    };

    if (!allowedTransitions[order.status]?.includes('cancelado')) {
      return NextResponse.json({ detail: 'Transición de estado no permitida' }, { status: 400 });
    }

    const now = new Date();
    await query(
      'UPDATE orders SET status = ?, cancelado_at = ?, cancelado_por = ?, motivo_cancelacion = ?, updated_at = ? WHERE id = ?',
      ['cancelado', now, user.id, motivo_cancelacion, now, id]
    );

    order.status = 'cancelado';
    order.cancelado_at = now;
    order.cancelado_por = user.id;
    order.motivo_cancelacion = motivo_cancelacion;
    order.updated_at = now;
    order.total_amount = parseFloat(order.total_amount);
    order.items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
