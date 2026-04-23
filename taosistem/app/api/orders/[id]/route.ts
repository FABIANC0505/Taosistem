import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/api-helpers';

type OrderRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: OrderRouteContext) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult.user;
  const { id } = await context.params;

  try {
    const orders = await query<any[]>('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) return NextResponse.json({ detail: 'Pedido no encontrado' }, { status: 404 });
    const order = orders[0];

    if (user.rol !== 'admin' && user.rol !== 'cocina' && (user.rol === 'mesero' && order.id_mesero !== user.id)) {
      return NextResponse.json({ detail: 'No tienes permiso para gestionar este pedido' }, { status: 403 });
    }

    order.total_amount = parseFloat(order.total_amount);
    order.items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: OrderRouteContext) {
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

    if (order.status !== 'pendiente') {
      return NextResponse.json({ detail: 'Solo se puede editar un pedido pendiente' }, { status: 400 });
    }

    const body = await req.json();
    let { mesa_numero, tipo_pedido, cliente_nombre, cliente_telefono, direccion_entrega, notas, items } = body;

    let newTotal = order.total_amount;
    let itemsStr = order.items;
    if (items) {
      newTotal = items.reduce((sum: number, item: any) => sum + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario)), 0);
      itemsStr = JSON.stringify(items);
    }

    if (tipo_pedido === 'mesa') {
      if (!mesa_numero) return NextResponse.json({ detail: 'Los pedidos de mesa requieren número de mesa' }, { status: 400 });
      cliente_nombre = null;
      cliente_telefono = null;
      direccion_entrega = null;
    } else if (tipo_pedido === 'domicilio') {
      mesa_numero = null;
      const cNombre = cliente_nombre || order.cliente_nombre;
      const cTel = cliente_telefono || order.cliente_telefono;
      const cDir = direccion_entrega || order.direccion_entrega;
      if (!cNombre || !cTel || !cDir) {
        return NextResponse.json({ detail: 'Los domicilios requieren datos completos' }, { status: 400 });
      }
    }

    const now = new Date();
    await query(
      `UPDATE orders SET mesa_numero = ?, tipo_pedido = ?, cliente_nombre = ?, cliente_telefono = ?, direccion_entrega = ?, notas = ?, items = ?, total_amount = ?, updated_at = ? WHERE id = ?`,
      [
        mesa_numero !== undefined ? mesa_numero : order.mesa_numero,
        tipo_pedido !== undefined ? tipo_pedido : order.tipo_pedido,
        cliente_nombre !== undefined ? cliente_nombre : order.cliente_nombre,
        cliente_telefono !== undefined ? cliente_telefono : order.cliente_telefono,
        direccion_entrega !== undefined ? direccion_entrega : order.direccion_entrega,
        notas !== undefined ? notas : order.notas,
        itemsStr,
        newTotal,
        now,
        id
      ]
    );

    const updated = await query<any[]>('SELECT * FROM orders WHERE id = ?', [id]);
    const responseOrder = updated[0];
    responseOrder.total_amount = parseFloat(responseOrder.total_amount);
    responseOrder.items = typeof responseOrder.items === 'string' ? JSON.parse(responseOrder.items) : responseOrder.items;

    return NextResponse.json(responseOrder);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: OrderRouteContext) {
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

    if (order.status !== 'pendiente') {
      return NextResponse.json({ detail: 'Solo se puede eliminar un pedido pendiente' }, { status: 400 });
    }

    await query('DELETE FROM orders WHERE id = ?', [id]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
