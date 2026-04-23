import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';

type UserDeactivateRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, context: UserDeactivateRouteContext) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await context.params;

  try {
    const users = await query<any[]>('SELECT * FROM users WHERE id = ?', [id]);
    const user = users[0];

    if (!user) {
      return NextResponse.json({ detail: 'Usuario no encontrado' }, { status: 404 });
    }

    const now = new Date();
    await query('UPDATE users SET activo = ?, updated_at = ? WHERE id = ?', [false, now, id]);

    user.activo = false;
    user.updated_at = now;
    delete user.password_hash;
    
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
