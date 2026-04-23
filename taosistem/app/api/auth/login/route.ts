import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, createAccessToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ detail: 'Faltan credenciales' }, { status: 422 });
    }

    const users = await query<any[]>('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ detail: 'Email o contraseña incorrectos' }, { status: 401 });
    }

    if (!user.activo) {
      return NextResponse.json({ detail: 'Usuario inactivo' }, { status: 403 });
    }

    const accessToken = await createAccessToken({ sub: user.id, email: user.email });

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'bearer',
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        activo: user.activo,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ detail: 'Error interno del servidor' }, { status: 500 });
  }
}
