import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const orders = await query<any[]>('SELECT items FROM orders WHERE status = ?', ['entregado']);
    
    const productosMap = new Map<string, { cantidad: number, ingresos: number }>();
    for (const o of orders) {
        const items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
        for (const item of items) {
            const nombre = item.nombre || 'Sin nombre';
            const cantidad = parseInt(item.cantidad) || 0;
            const precio = parseFloat(item.precio_unitario) || 0;
            if (!productosMap.has(nombre)) productosMap.set(nombre, { cantidad: 0, ingresos: 0 });
            const p = productosMap.get(nombre)!;
            p.cantidad += cantidad;
            p.ingresos += cantidad * precio;
        }
    }

    const productos_top = Array.from(productosMap.entries())
        .map(([nombre, data]) => ({ nombre, cantidad: data.cantidad, ingresos: Math.round(data.ingresos * 100) / 100 }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, limit);

    return NextResponse.json(productos_top);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
