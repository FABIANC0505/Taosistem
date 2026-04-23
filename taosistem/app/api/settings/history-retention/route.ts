import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';
import crypto from 'crypto';

const RETENTION_KEY = 'history_retention_days';
const DEFAULT_RETENTION = 30;

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const settings = await query<any[]>('SELECT value FROM app_settings WHERE `key` = ?', [RETENTION_KEY]);
    let retention_days = DEFAULT_RETENTION;
    if (settings.length > 0 && !isNaN(parseInt(settings[0].value))) {
        retention_days = Math.max(1, parseInt(settings[0].value));
    }
    
    return NextResponse.json({ retention_days });
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const retention_days = parseInt(body.retention_days);

    if (isNaN(retention_days) || retention_days < 1 || retention_days > 3650) {
      return NextResponse.json({ detail: 'Días de retención inválidos' }, { status: 422 });
    }

    const value = retention_days.toString();
    const settings = await query<any[]>('SELECT id FROM app_settings WHERE `key` = ?', [RETENTION_KEY]);

    const now = new Date();
    if (settings.length === 0) {
      const newId = crypto.randomUUID();
      await query(
          'INSERT INTO app_settings (id, `key`, value, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [newId, RETENTION_KEY, value, 'Días de retención para el historial de pedidos', now, now]
      );
    } else {
      await query('UPDATE app_settings SET value = ?, updated_at = ? WHERE `key` = ?', [value, now, RETENTION_KEY]);
    }

    return NextResponse.json({ retention_days });
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
