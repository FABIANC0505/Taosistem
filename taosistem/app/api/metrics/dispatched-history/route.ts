import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['admin', 'cocina']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Return dummy history for now as per schema
    return NextResponse.json({
        retention_days: 30,
        dispatched_por_dia: [],
        dispatched_por_mes: []
    });
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
