import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';
import { hashPassword } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const users = await query<any[]>('SELECT id, nombre, email, rol, activo, created_at, updated_at FROM users ORDER BY created_at DESC');
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ detail: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { nombre, email, password, rol } = body;

    if (!nombre || !email || !password || !rol) {
      return NextResponse.json({ detail: 'Faltan datos' }, { status: 422 });
    }

    const existing = await query<any[]>('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return NextResponse.json({ detail: 'Email ya existe' }, { status: 400 });
    }

    const newId = crypto.randomUUID();
    const hashed = await hashPassword(password);
    const now = new Date();

    await query(
      'INSERT INTO users (id, nombre, email, password_hash, rol, activo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newId, nombre, email, hashed, rol, true, now, now]
    );

    const newUser = { id: newId, nombre, email, rol, activo: true, created_at: now.toISOString(), updated_at: now.toISOString() };
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ detail: 'Error interno del servidor' }, { status: 500 });
  }
}
