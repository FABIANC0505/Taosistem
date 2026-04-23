import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';

type UserRoleRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, context: UserRoleRouteContext) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await context.params;

  try {
    const queryStr = new URL(req.url).searchParams;
    const body = await req.json().catch(() => ({}));
    const rol = queryStr.get('rol') || body.rol; // FastAPI accepts via query params in the original code, but sometimes body is used. Let's support both.
    
    if (!rol) {
      return NextResponse.json({ detail: 'Rol requerido' }, { status: 422 });
    }

    const users = await query<any[]>('SELECT * FROM users WHERE id = ?', [id]);
    const user = users[0];

    if (!user) {
      return NextResponse.json({ detail: 'Usuario no encontrado' }, { status: 404 });
    }

    const now = new Date();
    await query('UPDATE users SET rol = ?, updated_at = ? WHERE id = ?', [rol, now, id]);

    user.rol = rol;
    user.updated_at = now;
    delete user.password_hash;
    
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
