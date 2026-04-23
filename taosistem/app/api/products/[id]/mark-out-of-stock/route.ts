import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

type ProductStockRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, context: ProductStockRouteContext) {
  const { id } = await context.params;
  try {
    const products = await query<any[]>('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) return NextResponse.json({ detail: 'Producto no encontrado' }, { status: 404 });
    const product = products[0];

    const now = new Date();
    await query('UPDATE products SET disponible = ?, updated_at = ?, agotado_at = ? WHERE id = ?', [false, now, now, id]);

    product.disponible = false;
    product.updated_at = now;
    product.agotado_at = now;
    product.precio = parseFloat(product.precio);

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
