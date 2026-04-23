import { NextRequest, NextResponse } from 'next/server';
import { query, executeCount } from '@/lib/db';
import { requireAuth } from '@/lib/api-helpers';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult.user;

  try {
    const params: any[] = [];
    let queryStr = 'SELECT * FROM orders ORDER BY created_at DESC';

    if (user.rol === 'mesero') {
      queryStr = 'SELECT * FROM orders WHERE id_mesero = ? ORDER BY created_at DESC';
      params.push(user.id);
    }

    const orders = await query<any[]>(queryStr, params);
    
    // Process formatting
    const formattedOrders = orders.map(o => ({
      ...o,
      total_amount: parseFloat(o.total_amount),
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
    }));
    
    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult.user;

  if (user.rol !== 'mesero' && user.rol !== 'admin') {
    return NextResponse.json({ detail: 'No autorizado para crear pedidos' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { mesa_numero, tipo_pedido, cliente_nombre, cliente_telefono, direccion_entrega, items, notas } = body;

    let total = 0;
    if (items && Array.isArray(items)) {
      total = items.reduce((sum, item) => sum + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario)), 0);
    }

    const newId = crypto.randomUUID();
    const now = new Date();

    await query(
      `INSERT INTO orders (id, id_mesero, mesa_numero, tipo_pedido, cliente_nombre, cliente_telefono, direccion_entrega, status, items, notas, total_amount, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId, 
        user.id, 
        mesa_numero || null, 
        tipo_pedido, 
        cliente_nombre ? cliente_nombre.trim() : null, 
        cliente_telefono ? cliente_telefono.trim() : null, 
        direccion_entrega ? direccion_entrega.trim() : null, 
        'pendiente', 
        JSON.stringify(items), 
        notas || null, 
        total, 
        now, 
        now
      ]
    );

    return NextResponse.json({
      id: newId,
      id_mesero: user.id,
      mesa_numero: mesa_numero || null,
      tipo_pedido,
      cliente_nombre: cliente_nombre || null,
      cliente_telefono: cliente_telefono || null,
      direccion_entrega: direccion_entrega || null,
      status: 'pendiente',
      items,
      notas: notas || null,
      total_amount: total,
      created_at: now.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
