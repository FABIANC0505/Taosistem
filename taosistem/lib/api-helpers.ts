import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';
import { query } from './db';

export interface AuthContext {
  user: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    activo: boolean;
  };
}

export async function requireAuth(req: NextRequest): Promise<AuthContext | NextResponse> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ detail: 'Token inválido' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const payload = await verifyToken(token);

  if (!payload || !payload.sub) {
    return NextResponse.json({ detail: 'Token expirado o inválido' }, { status: 401 });
  }

  try {
    const users = await query<any[]>('SELECT * FROM users WHERE id = ?', [payload.sub]);
    const user = users[0];

    if (!user) {
      return NextResponse.json({ detail: 'Usuario no encontrado' }, { status: 401 });
    }

    if (!user.activo) {
      return NextResponse.json({ detail: 'Usuario inactivo' }, { status: 403 });
    }

    return { user };
  } catch (error) {
    console.error('Error verifying user:', error);
    return NextResponse.json({ detail: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function requireRole(req: NextRequest, allowedRoles: string[]): Promise<AuthContext | NextResponse> {
  const authResult = await requireAuth(req);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Error response from requireAuth
  }
  
  if (!allowedRoles.includes(authResult.user.rol)) {
    return NextResponse.json({ detail: 'No autorizado' }, { status: 403 });
  }
  
  return authResult;
}
