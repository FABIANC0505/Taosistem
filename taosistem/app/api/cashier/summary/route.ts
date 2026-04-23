import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['cajero', 'admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const TOTAL_TABLES_KEY = 'total_mesas';
    const DEFAULT_TOTAL_TABLES = 12;

    const settings = await query<any[]>('SELECT value FROM app_settings WHERE `key` = ?', [TOTAL_TABLES_KEY]);
    let totalTables = DEFAULT_TOTAL_TABLES;
    if (settings.length > 0 && !isNaN(parseInt(settings[0].value))) {
      totalTables = Math.max(1, parseInt(settings[0].value));
    }

    const occupiedRes = await query<any[]>(`
      SELECT o.id, o.mesa_numero, o.status, o.total_amount, o.created_at, u.id as mesero_id, u.nombre as mesero_nombre
      FROM orders o
      JOIN users u ON u.id = o.id_mesero
      WHERE o.tipo_pedido = 'mesa' AND o.mesa_numero IS NOT NULL AND o.status NOT IN ('entregado', 'cancelado')
      ORDER BY o.created_at DESC
    `);

    const occupiedMap = new Map();
    for (const order of occupiedRes) {
      if (!occupiedMap.has(order.mesa_numero)) {
        occupiedMap.set(order.mesa_numero, {
          mesa_numero: order.mesa_numero,
          libre: false,
          order_id: order.id,
          status: order.status,
          total_amount: parseFloat(order.total_amount),
          mesero_id: order.mesero_id,
          mesero_nombre: order.mesero_nombre,
          created_at: order.created_at
        });
      }
    }

    const occupied_tables = Array.from(occupiedMap.values()).sort((a, b) => a.mesa_numero - b.mesa_numero);
    const free_tables = [];
    for (let mesa = 1; mesa <= totalTables; mesa++) {
      if (!occupiedMap.has(mesa)) {
        free_tables.push({ mesa_numero: mesa, libre: true });
      }
    }

    const alerts = await query<any[]>('SELECT * FROM waiter_alerts WHERE resolved = false ORDER BY created_at DESC');

    let open_session = null;
    let recent_payments = [];
    let payment_summary = [];

    if (authResult.user.rol === 'cajero') {
      const sessions = await query<any[]>(`
        SELECT * FROM cash_sessions WHERE cashier_user_id = ? AND closed_at IS NULL ORDER BY opened_at DESC LIMIT 1
      `, [authResult.user.id]);
      
      if (sessions.length > 0) {
        open_session = {
          id: sessions[0].id,
          cashier_user_id: sessions[0].cashier_user_id,
          opening_amount: parseFloat(sessions[0].opening_amount),
          opening_note: sessions[0].opening_note,
          opened_at: sessions[0].opened_at,
          closed_at: null,
          is_open: true
        };

        const payments = await query<any[]>('SELECT * FROM cash_payments WHERE session_id = ? ORDER BY created_at DESC LIMIT 20', [sessions[0].id]);
        recent_payments = payments.map(p => ({
          ...p, amount: parseFloat(p.amount)
        }));

        const summaryMap = new Map();
        for (const p of payments) {
          if (!summaryMap.has(p.payment_method)) {
            summaryMap.set(p.payment_method, { payment_method: p.payment_method, total_amount: 0, transactions: 0 });
          }
          const item = summaryMap.get(p.payment_method);
          item.total_amount += parseFloat(p.amount);
          item.transactions += 1;
        }
        payment_summary = Array.from(summaryMap.values());
      }
    }

    return NextResponse.json({
      total_mesas: totalTables,
      mesas_ocupadas: occupied_tables,
      mesas_libres: free_tables,
      active_alerts: alerts,
      open_session,
      recent_payments,
      payment_summary
    });
  } catch (error) {
    console.error('Error fetching cashier summary:', error);
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
