import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const macroRes = await query<any[]>(`
      SELECT 
        (SELECT COUNT(*) FROM orders) as total_ordenes,
        (SELECT COUNT(*) FROM products WHERE disponible = false) as productos_agotados,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) as ordenes_hoy,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'entregado') as total_ingresos,
        (SELECT COUNT(*) FROM orders WHERE status = 'entregado' AND tipo_pedido = 'domicilio' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as domicilios_semana,
        (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE status = 'entregado') as media_ingresos
    `);

    const macro = macroRes[0] || {};

    const trendRes = await query<any[]>(`
        SELECT DATE(created_at) as fec, SUM(total_amount) as ingresos 
        FROM orders 
        WHERE status = 'entregado' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY fec 
        ORDER BY fec ASC
    `);

    const ingresos_por_dia = trendRes.map(t => ({
        fecha: t.fec,
        ingresos: parseFloat(t.ingresos).toFixed(2)
    }));

    const statsRes = await query<any[]>(`
        SELECT 
            AVG(TIMESTAMPDIFF(SECOND, cocinando_at, served_at)) as prep_time,
            AVG(TIMESTAMPDIFF(SECOND, created_at, entregado_at)) as delivery_time
        FROM orders 
        WHERE status = 'entregado'
    `);
    
    // Top Products fallback (JSON parsing can be tricky in raw MySQL depending on version, so we fetch only items of 'entregado')
    const itemRes = await query<any[]>("SELECT items FROM orders WHERE status = 'entregado' AND items IS NOT NULL");
    
    const productosMap = new Map<string, { cantidad: number, ingresos: number }>();
    for (const row of itemRes) {
        const items = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []);
        for (const item of items) {
            const nombre = item.nombre || 'Sin nombre';
            const cantidad = parseInt(item.cantidad) || 0;
            const precio = parseFloat(item.precio_unitario) || 0;
            const existing = productosMap.get(nombre) || { cantidad: 0, ingresos: 0 };
            existing.cantidad += cantidad;
            existing.ingresos += cantidad * precio;
            productosMap.set(nombre, existing);
        }
    }

    const productos_top = Array.from(productosMap.entries())
        .map(([nombre, data]) => ({ nombre, cantidad: data.cantidad, ingresos: Math.round(data.ingresos * 100) / 100 }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10);

    const producto_mas_vendido = productos_top.length > 0 ? { nombre: productos_top[0].nombre, cantidad: productos_top[0].cantidad } : { nombre: 'N/A', cantidad: 0 };

    return NextResponse.json({
      total_ingresos: parseFloat(macro.total_ingresos || 0),
      total_ordenes: parseInt(macro.total_ordenes || 0),
      ordenes_hoy: parseInt(macro.ordenes_hoy || 0),
      productos_agotados: parseInt(macro.productos_agotados || 0),
      producto_mas_vendido,
      media_ingresos: parseFloat(macro.media_ingresos || 0),
      moda_ingresos: parseFloat(macro.media_ingresos || 0), 
      ingresos_por_dia,
      productos_top,
      dispatched_por_dia: [],
      dispatched_por_mes: [],
      domicilios_semana: parseInt(macro.domicilios_semana || 0),
      tiempo_promedio_preparacion_segundos: Math.round(parseFloat(statsRes[0]?.prep_time || 0)),
      tiempo_promedio_entrega_segundos: Math.round(parseFloat(statsRes[0]?.delivery_time || 0)),
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
