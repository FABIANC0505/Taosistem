import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, createAccessToken } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, email, password } = body;

    if (!nombre || !email || !password) {
      return NextResponse.json({ detail: 'Faltan datos' }, { status: 422 });
    }

    // Verificar si ya existe
    const existing = await query<any[]>('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return NextResponse.json({ detail: 'Email ya registrado' }, { status: 400 });
    }

    // Comprobar si hay usuarios para asignar admin
    const totalUsers = await query<any[]>('SELECT count(*) as count FROM users');
    const userCount = totalUsers[0]?.count || 0;
    
    const rol = userCount === 0 ? 'admin' : 'mesero';
    const newId = crypto.randomUUID();
    const hashed = await hashPassword(password);
    const now = new Date();

    await query(
      'INSERT INTO users (id, nombre, email, password_hash, rol, activo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newId, nombre, email, hashed, rol, true, now, now]
    );

    const accessToken = await createAccessToken({ sub: newId, email });

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'bearer',
      user: {
        id: newId,
        nombre,
        email,
        rol,
        activo: true,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ detail: 'Error interno del servidor' }, { status: 500 });
  }
}
