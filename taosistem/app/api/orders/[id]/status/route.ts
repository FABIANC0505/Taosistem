import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/api-helpers';

type OrderStatusRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, context: OrderStatusRouteContext) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult.user;
  const { id } = await context.params;

  try {
    const orders = await query<any[]>('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) return NextResponse.json({ detail: 'Pedido no encontrado' }, { status: 404 });
    const order = orders[0];

    const body = await req.json();
    const { status } = body;

    if (!status) return NextResponse.json({ detail: 'Estado requerido' }, { status: 422 });

    if (user.rol !== 'admin' && user.rol !== 'cocina' && (user.rol === 'mesero' && order.id_mesero !== user.id)) {
        return NextResponse.json({ detail: 'No tienes permiso para gestionar este pedido' }, { status: 403 });
    }

    if (user.rol === 'cocina' && !['en_preparacion', 'listo'].includes(status)) {
      return NextResponse.json({ detail: 'Cocina solo puede marcar pedidos en preparación o listos' }, { status: 403 });
    }

    if (user.rol === 'mesero' && status !== 'entregado') {
      return NextResponse.json({ detail: 'Mesero solo puede confirmar la entrega final' }, { status: 403 });
    }

    // Validate Status transition
    const allowedTransitions: Record<string, string[]> = {
      'pendiente': ['en_preparacion', 'cancelado'],
      'en_preparacion': ['listo', 'cancelado'],
      'listo': ['entregado', 'cancelado'],
      'entregado': [],
      'cancelado': []
    };

    if (status !== order.status) {
      if (!allowedTransitions[order.status]?.includes(status)) {
        return NextResponse.json({ detail: 'Transición de estado no permitida' }, { status: 400 });
      }
    }

    const updates = ['status = ?'];
    const values = [status];
    const now = new Date();

    if (status === 'en_preparacion' && !order.cocinando_at) { updates.push('cocinando_at = ?'); values.push(now); order.cocinando_at = now; }
    if (status === 'listo' && !order.served_at) { updates.push('served_at = ?'); values.push(now); order.served_at = now; }
    if (status === 'entregado' && !order.entregado_at) { updates.push('entregado_at = ?'); values.push(now); order.entregado_at = now; }

    updates.push('updated_at = ?');
    values.push(now);
    order.updated_at = now;
    
    values.push(id);

    await query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, values);
    order.status = status;
    order.total_amount = parseFloat(order.total_amount);
    order.items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
