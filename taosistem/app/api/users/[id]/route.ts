import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';

type UserRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: UserRouteContext) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await context.params;

  try {
    const users = await query<any[]>('SELECT id, nombre, email, rol, activo, created_at, updated_at FROM users WHERE id = ?', [id]);
    const user = users[0];

    if (!user) {
      return NextResponse.json({ detail: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: UserRouteContext) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await context.params;

  try {
    const users = await query<any[]>('SELECT * FROM users WHERE id = ?', [id]);
    const user = users[0];

    if (!user) {
      return NextResponse.json({ detail: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const { nombre, email, rol, activo } = body;
    const now = new Date();

    const updates = [];
    const values = [];

    if (nombre !== undefined) { updates.push('nombre = ?'); values.push(nombre); user.nombre = nombre; }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); user.email = email; }
    if (rol !== undefined) { updates.push('rol = ?'); values.push(rol); user.rol = rol; }
    if (activo !== undefined) { updates.push('activo = ?'); values.push(activo); user.activo = activo; }
    
    updates.push('updated_at = ?');
    values.push(now);
    user.updated_at = now;

    values.push(id);

    if (updates.length > 1) { // includes updated_at
      await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    delete user.password_hash;
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: UserRouteContext) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await context.params;

  try {
    const users = await query<any[]>('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return NextResponse.json({ detail: 'Usuario no encontrado' }, { status: 404 });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);
    return NextResponse.json({ detail: 'Usuario eliminado' });
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
