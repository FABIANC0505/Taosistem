import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await query<any[]>('SELECT * FROM orders WHERE status = ? AND created_at >= ?', ['entregado', startDate]);
    
    const ingresosPorDiaMap = new Map<string, number>();
    for (const o of orders) {
        if (o.created_at) {
            const d = new Date(o.created_at).toISOString().split('T')[0];
            const amount = parseFloat(o.total_amount);
            ingresosPorDiaMap.set(d, (ingresosPorDiaMap.get(d) || 0) + amount);
        }
    }

    const ingresos_por_dia = Array.from(ingresosPorDiaMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([fecha, ingresos]) => ({ fecha, ingresos: Math.round(ingresos * 100) / 100 }));

    return NextResponse.json(ingresos_por_dia);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
