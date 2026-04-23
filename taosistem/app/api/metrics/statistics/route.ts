import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const statusCounts = await query<any[]>('SELECT status, COUNT(id) as cantidad FROM orders GROUP BY status');
    
    const ordenes_por_estado: Record<string, number> = {};
    for (const row of statusCounts) {
        ordenes_por_estado[row.status] = row.cantidad;
    }

    const avgRes = await query<any[]>('SELECT coalesce(avg(total_amount), 0) as promedio FROM orders');
    const promedio_gasto_por_orden = avgRes.length > 0 ? parseFloat(avgRes[0].promedio) : 0;

    return NextResponse.json({
        ordenes_por_estado,
        promedio_gasto_por_orden: Math.round(promedio_gasto_por_orden * 100) / 100
    });
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
